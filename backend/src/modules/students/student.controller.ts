import { UserRole } from '../../types/enums';
import { Response } from 'express';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { NotificationService } from '../notifications/notification.service';

export const getStudents = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, branchId, courseId, isActive, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (courseId) {
      where.courseId = courseId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          branch: {
            select: { id: true, name: true },
          },
          course: {
            select: { id: true, name: true, code: true },
          },
          admission: {
            select: { id: true, admissionNumber: true, feeBalance: true, feeAmount: true, feePaid: true, paymentPlan: true },
          },
          placements: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              company: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { students, meta });
  } catch (error) {
    console.error('getStudents Error:', error);
    return errorResponse(res, 'Failed to fetch students', 500, error);
  }
};

export const getStudentById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        branch: true,
        course: true,
        admission: true,
        portfolios: {
          orderBy: { createdAt: 'desc' },
        },
        placements: {
          include: {
            company: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, { student });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch student', 500, error);
  }
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const {
      firstName, lastName, email, phone,
      dateOfJoining, dateOfBirth, gender,
      parentPhone, address,
      courseId, branchId,
      qualification, leadSource,
      aadhaarNumber, panNumber,
      selectedSoftware,
      feeAmount, feePaid, paymentPlan, paymentMode, transactionId
    } = req.body;

    console.log('Create Student Payload received for:', email);

    // 1. Authorization Check
    if (req.user?.role !== UserRole.CEO && branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied: Cannot create student in another branch', 403);
    }

    // 2. Validate required fields
    if (!firstName || !lastName || !email || !courseId || !branchId) {
      return errorResponse(res, 'Required fields missing: firstName, lastName, email, courseId, branchId', 400);
    }

    // 3. Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists', 400);
    }

    // 4. Fetch branch for enrollment number
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }
    const branchCode = branch.code || 'GEN';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const enrollmentNumber = `STU-${branchCode}-${randomNum}`;

    // 5. Verify course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // 6. Transaction: Create User -> Admission -> Student
    const result = await prisma.$transaction(async (tx) => {
      // A. Create User account with default password
      const hashedPassword = await bcrypt.hash('Student@123', 10);
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || '',
          role: UserRole.STUDENT,
          branchId,
          isActive: true,
        }
      });

      // B. Create Admission record (auto-approved)
      const admissionNumber = `ADM-${branchCode}-${Date.now().toString().slice(-6)}`;
      const admissionDate = dateOfJoining ? new Date(dateOfJoining) : new Date();

      const admission = await tx.admission.create({
        data: {
          admissionNumber,
          firstName,
          lastName,
          email,
          phone: phone || '',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          address: address || null,
          courseId,
          branchId,
          feeAmount: Number(feeAmount) || 0,
          feePaid: Number(feePaid) || 0,
          feeBalance: (Number(feeAmount) || 0) - (Number(feePaid) || 0),
          paymentPlan: paymentPlan || 'SINGLE',
          paymentMode,
          transactionId,

          // New Fields
          parentPhone,
          qualification,
          leadSource,
          aadhaarNumber,
          panNumber,
          selectedSoftware,

          status: 'ADMITTED',
          admissionDate,
        }
      });

      // C. Create Student record linked to User and Admission
      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionId: admission.id,
          enrollmentNumber,
          branchId,
          courseId,
          currentSemester: 1,
          cgpa: 0,
          isActive: true,

          // New Fields
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          parentPhone,
          address,
          qualification,
          leadSource,
          aadhaarNumber,
          panNumber,
          selectedSoftware,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          course: {
            select: { id: true, name: true }
          },
          branch: {
            select: { id: true, name: true }
          },
          admission: {
            select: { id: true, admissionNumber: true, feeBalance: true }
          }
        }
      });

      return { student, tempPassword: 'Student@123' };
    });

    console.log('Student created successfully:', result.student.id);
    // Explicitly return tempPassword in the top-level response object
    return successResponse(res, { ...result }, 'Student created successfully', 201);

  } catch (error: any) {
    console.error('Create Student Error:', error?.message || error);
    return errorResponse(res, 'Failed to create student', 500, error);
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const {
      firstName, lastName, phone,
      currentSemester, cgpa, isActive,
      placementData,
      feeAmount, feePaid, paymentPlan,
      dateOfJoining, dateOfBirth, gender,
      parentPhone, address, qualification,
      leadSource, aadhaarNumber, panNumber,
      selectedSoftware, paymentMode, transactionId, paymentAmount
    } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        admission: { select: { id: true, feeAmount: true, feePaid: true } },
        placements: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!existingStudent) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && existingStudent.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const student = await prisma.$transaction(async (tx) => {
      // Update User's personal info if provided
      if (firstName || lastName || phone) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
          }
        });
      }

      // Update associated Admission record if fee info provided
      if (paymentAmount !== undefined && req.user?.role === UserRole.CHANNEL_PARTNER) {
        await tx.feePaymentRequest.create({
          data: {
            studentId: id,
            admissionId: existingStudent.admissionId,
            amount: Number(paymentAmount),
            paymentMode: paymentMode || 'CASH',
            transactionId: transactionId || null,
            requestedById: req.user.id,
            branchId: existingStudent.branchId,
            status: 'PENDING'
          }
        });

        // Notify CEO of the new fee approval request
        const requestingUser = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { firstName: true, lastName: true }
        });
        const requestingName = requestingUser ? `${requestingUser.firstName} ${requestingUser.lastName}` : 'A Channel Partner';
        const studentName = `${existingStudent.user.firstName} ${existingStudent.user.lastName}`;

        const modeLabel = (paymentMode || 'CASH').toUpperCase();
        await NotificationService.notifyRole(UserRole.CEO, {
          title: 'New Fee Approval Request',
          message: `Channel Partner ${requestingName} has requested a fee update of ₹${paymentAmount} via ${modeLabel} for student ${studentName}.`,
          type: 'INFO',
          link: `/students/${id}`
        });
      } else if (feeAmount !== undefined || feePaid !== undefined || paymentPlan !== undefined) {
        const updatedFeeAmount = feeAmount !== undefined ? (Number(feeAmount) || 0) : undefined;
        const updatedFeePaid = feePaid !== undefined ? (Number(feePaid) || 0) : undefined;

        let feeBalance = undefined;
        if (updatedFeeAmount !== undefined || updatedFeePaid !== undefined) {
          const finalFeeAmount = updatedFeeAmount !== undefined ? updatedFeeAmount : Number((existingStudent.admission as any)?.feeAmount) || 0;
          const finalFeePaid = updatedFeePaid !== undefined ? updatedFeePaid : Number((existingStudent.admission as any)?.feePaid) || 0;
          feeBalance = finalFeeAmount - finalFeePaid;
        }

        await tx.admission.update({
          where: { id: existingStudent.admissionId },
          data: {
            ...(updatedFeeAmount !== undefined && { feeAmount: updatedFeeAmount }),
            ...(updatedFeePaid !== undefined && { feePaid: updatedFeePaid }),
            ...(feeBalance !== undefined && { feeBalance }),
            ...(paymentPlan !== undefined && { paymentPlan }),
            ...(paymentMode !== undefined && { paymentMode }),
            ...(transactionId !== undefined && { transactionId }),
            // Also sync other personal info to admission for consistency
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
          }
        });
      }

      // Update student record
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          ...(currentSemester !== undefined && { currentSemester }),
          ...(cgpa !== undefined && { cgpa }),
          ...(isActive !== undefined && { isActive }),
          ...(dateOfJoining && { dateOfJoining: new Date(dateOfJoining) }),
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(gender && { gender }),
          ...(parentPhone && { parentPhone }),
          ...(address && { address }),
          ...(qualification && { qualification }),
          ...(leadSource && { leadSource }),
          ...(aadhaarNumber && { aadhaarNumber }),
          ...(panNumber && { panNumber }),
          ...(selectedSoftware && { selectedSoftware }),
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
          course: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          admission: { select: { id: true, feeBalance: true, feeAmount: true, feePaid: true, paymentPlan: true } },
        },
      });

      // Handle placement update if provided
      if (placementData) {
        const { companyId, companyName, position, package: pkg, status } = placementData;
        let finalCompanyId = companyId;

        if (!finalCompanyId && companyName) {
          const existingCompany = await tx.company.findFirst({ where: { name: companyName } });
          if (existingCompany) {
            finalCompanyId = existingCompany.id;
          } else {
            const newCompany = await tx.company.create({ data: { name: companyName, industry: 'Unknown' } });
            finalCompanyId = newCompany.id;
          }
        }

        if (finalCompanyId) {
          const existingPlacement = existingStudent.placements[0];
          if (existingPlacement) {
            await tx.placement.update({
              where: { id: existingPlacement.id },
              data: { companyId: finalCompanyId, position, package: pkg, status: status || 'PLACED' }
            });
          } else {
            await tx.placement.create({
              data: { studentId: id, companyId: finalCompanyId, position, package: pkg, status: status || 'PLACED' }
            });
          }
        }
      }

      return updatedStudent;
    });

    return successResponse(res, student, 'Student updated successfully');
  } catch (error: any) {
    console.error('Update Student Error:', error?.message || error);
    return errorResponse(res, 'Failed to update student', 500, error);
  }
};

export const getFeeStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId } = req.query;
    const where: any = {};

    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    const stats = await prisma.admission.aggregate({
      where,
      _sum: {
        feeAmount: true,
        feePaid: true,
        feeBalance: true
      }
    });

    return successResponse(res, {
      totalReceivables: stats._sum.feeAmount || 0,
      totalCollected: stats._sum.feePaid || 0,
      outstandingBalance: stats._sum.feeBalance || 0
    }, 'Fee statistics fetched successfully');
  } catch (error) {
    console.error('getFeeStats Error:', error);
    return errorResponse(res, 'Failed to fetch fee statistics', 500, error);
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && existingStudent.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.student.delete({ where: { id } });

    return successResponse(res, { id }, 'Student deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete student', 500, error);
  }
};

export const getFeeRequests = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status, page = 1, limit = 10 } = req.query; // PENDING, APPROVED, REJECTED
    const { skip, take } = paginationHelper(Number(page), Number(limit));
    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
    }

    if (req.user?.role !== UserRole.CEO) {
      whereCondition.branchId = req.user?.branchId;
    }

    const [requests, total] = await Promise.all([
      prisma.feePaymentRequest.findMany({
        where: whereCondition,
        skip,
        take,
        include: {
          student: { select: { id: true, enrollmentNumber: true, user: { select: { firstName: true, lastName: true } } } },
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          branch: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.feePaymentRequest.count({ where: whereCondition }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { requests, meta }, 'Fee requests fetched successfully');
  } catch (error) {
    console.error('getFeeRequests Error:', error);
    return errorResponse(res, 'Failed to fetch fee requests', 500, error);
  }
};

export const approveFeeRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== UserRole.CEO) {
      return errorResponse(res, 'Access denied. Only CEO can approve fees.', 403);
    }

    const request = await prisma.feePaymentRequest.findUnique({
      where: { id },
      include: { admission: true }
    });

    if (!request) {
      return errorResponse(res, 'Fee request not found', 404);
    }

    if (request.status !== 'PENDING') {
      return errorResponse(res, 'Only pending requests can be approved', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Mark request as approved
      await tx.feePaymentRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: req.user!.id
        }
      });

      // Update admission fee balances
      const newFeePaid = (request.admission.feePaid || 0) + request.amount;
      const newBalance = (request.admission.feeAmount || 0) - newFeePaid;

      await tx.admission.update({
        where: { id: request.admissionId },
        data: {
          feePaid: newFeePaid,
          feeBalance: newBalance,
          paymentMode: request.paymentMode,
          transactionId: request.transactionId
        }
      });
    });

    return successResponse(res, { id }, 'Fee request approved successfully');
  } catch (error) {
    console.error('approveFeeRequest Error:', error);
    return errorResponse(res, 'Failed to approve fee request', 500, error);
  }
};

export const rejectFeeRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== UserRole.CEO) {
      return errorResponse(res, 'Access denied. Only CEO can reject fees.', 403);
    }

    await prisma.feePaymentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user!.id // We use this to track who rejected it too
      }
    });

    return successResponse(res, { id }, 'Fee request rejected successfully');
  } catch (error) {
    console.error('rejectFeeRequest Error:', error);
    return errorResponse(res, 'Failed to reject fee request', 500, error);
  }
};

export const getFeeRequestById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const request = await prisma.feePaymentRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } }
          }
        },
        admission: {
          include: {
            course: { select: { name: true } }
          }
        },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
        branch: true
      }
    });

    if (!request) {
      return errorResponse(res, 'Fee request not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && request.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, request, 'Fee request fetched successfully');
  } catch (error) {
    console.error('getFeeRequestById Error:', error);
    return errorResponse(res, 'Failed to fetch fee request', 500, error);
  }
};

export const sendFeeRequestToStudent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const request = await prisma.feePaymentRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return errorResponse(res, 'Fee request not found', 404);
    }

    if (request.status !== 'APPROVED') {
      return errorResponse(res, 'Only approved fee requests can be sent to students', 400);
    }

    await prisma.feePaymentRequest.update({
      where: { id },
      data: {
        isSentToStudent: true,
        sentAt: new Date()
      }
    });

    return successResponse(res, { id }, 'Receipt sent to student successfully');
  } catch (error) {
    console.error('sendFeeRequestToStudent Error:', error);
    return errorResponse(res, 'Failed to send receipt to student', 500, error);
  }
};
