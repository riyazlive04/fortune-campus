import { UserRole } from '../../types/enums';
import { Response } from 'express';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

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
            select: { id: true, admissionNumber: true, feeBalance: true },
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
      feeAmount, feePaid, paymentPlan
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
      placementData
    } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true } },
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

      // Update student record
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          ...(currentSemester !== undefined && { currentSemester }),
          ...(cgpa !== undefined && { cgpa }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
          course: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          admission: { select: { id: true, feeBalance: true } },
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
