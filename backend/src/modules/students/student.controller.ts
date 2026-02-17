import { UserRole } from '../../types/enums';;
import { Response } from 'express';
import bcrypt from 'bcryptjs';
;
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
    const { admissionId, enrollmentNumber, currentSemester, cgpa } = req.body;

    // Verify admission exists and is approved
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      return errorResponse(res, 'Admission not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && admission.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Check if student already exists for this admission
    const existingStudent = await prisma.student.findUnique({
      where: { admissionId },
    });

    if (existingStudent) {
      return errorResponse(res, 'Student record already exists for this admission', 400);
    }

    // Create user account for student
    const defaultPassword = await bcrypt.hash('Student@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: admission.email || `${enrollmentNumber}@fortune.edu`,
          password: defaultPassword,
          firstName: admission.firstName,
          lastName: admission.lastName,
          phone: admission.phone,
          role: UserRole.STUDENT,
          branchId: admission.branchId,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionId,
          enrollmentNumber,
          currentSemester,
          cgpa,
          branchId: admission.branchId,
          courseId: admission.courseId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          branch: {
            select: { id: true, name: true },
          },
          course: {
            select: { id: true, name: true },
          },
        },
      });

      return student;
    });

    return successResponse(res, result, 'Student created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create student', 500, error);
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { currentSemester, cgpa, isActive, placementData } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { placements: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!existingStudent) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && existingStudent.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const student = await prisma.$transaction(async (tx) => {
      // Update student basics
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          currentSemester,
          cgpa,
          isActive,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: { id: true, name: true },
          },
        },
      });

      // Handle placement update if provided
      if (placementData) {
        const { companyId, companyName, position, package: pkg, status } = placementData;

        let finalCompanyId = companyId;

        // If companyName provided but no companyId, find or create company
        if (!finalCompanyId && companyName) {
          const existingCompany = await tx.company.findFirst({
            where: { name: companyName }
          });

          if (existingCompany) {
            finalCompanyId = existingCompany.id;
          } else {
            const newCompany = await tx.company.create({
              data: {
                name: companyName,
                industry: 'Unknown', // Default
              }
            });
            finalCompanyId = newCompany.id;
          }
        }

        if (finalCompanyId) {
          // If student has a placement, update it. Otherwise create.
          const existingPlacement = existingStudent.placements[0];

          if (existingPlacement) {
            await tx.placement.update({
              where: { id: existingPlacement.id },
              data: {
                companyId: finalCompanyId,
                position,
                package: pkg,
                status: status || 'PLACED'
              }
            });
          } else {
            await tx.placement.create({
              data: {
                studentId: id,
                companyId: finalCompanyId,
                position,
                package: pkg,
                status: status || 'PLACED'
              }
            });
          }
        }
      }

      return updatedStudent;
    });

    return successResponse(res, student, 'Student updated successfully');
  } catch (error) {
    console.error('Update Student Error:', error);
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

    // Delete student (will cascade to user due to onDelete: Cascade)
    await prisma.student.delete({ where: { id } });

    return successResponse(res, { id }, 'Student deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete student', 500, error);
  }
};
