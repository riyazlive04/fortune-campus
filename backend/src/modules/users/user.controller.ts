import { UserRole } from '../../types/enums';
import { Response } from 'express';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

/**
 * Generate a random temporary password
 */
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Create a new user (ADMIN only or CHANNEL_PARTNER for their branch)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { email, firstName, lastName, phone, role, branchId, specialization, experience, qualification } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !role) {
      return errorResponse(res, 'Email, firstName, lastName, and role are required', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists', 409);
    }

    // Role-based permissions check
    if (req.user?.role === UserRole.CEO) {
      // CEO can create any user except other CEOs
      if (role === UserRole.CEO) {
        return errorResponse(res, 'Cannot create another CEO user', 403);
      }
    } else if (req.user?.role === UserRole.ADMIN) {
      // ADMIN can create any user
      if (role === UserRole.ADMIN) {
        return errorResponse(res, 'Cannot create another ADMIN user', 403);
      }
    } else if (req.user?.role === UserRole.CHANNEL_PARTNER) {
      // CHANNEL_PARTNER can only create users in their branch (not ADMIN or other CHANNEL_PARTNERs)
      if (role === UserRole.ADMIN) {
        return errorResponse(res, 'You cannot create ADMIN users', 403);
      }
      // Must be in the same branch
      if (!branchId || branchId !== req.user.branchId) {
        return errorResponse(res, 'You can only create users in your own branch', 403);
      }
    } else {
      return errorResponse(res, 'You do not have permission to create users', 403);
    }

    // Branch validation for non-ADMIN users
    if (role !== UserRole.ADMIN && !branchId) {
      return errorResponse(res, 'Branch is required for non-ADMIN users', 400);
    }

    // Trainer specific validation
    if (role === UserRole.TRAINER) {
      if (!specialization || !experience) {
        return errorResponse(res, 'Specialization and experience are required for trainers', 400);
      }
    }

    // Verify branch exists
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        return errorResponse(res, 'Invalid branch ID', 400);
      }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user and profile transactionally
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim(),
          role: role as UserRole,
          branchId: role === UserRole.ADMIN ? null : branchId,
          isActive: true,
        },
      });

      // Create Trainer Profile if role is TRAINER
      if (role === UserRole.TRAINER) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const employeeId = `TR-${timestamp}${random}`;

        await tx.trainer.create({
          data: {
            userId: newUser.id,
            employeeId,
            branchId,
            specialization,
            experience: Number(experience),
            qualification: qualification || null,
            isActive: true,
          },
        });
      }

      // Create Student Profile if role is STUDENT
      if (role === UserRole.STUDENT) {
        const { courseId } = req.body;

        if (!courseId) {
          throw new Error('Course is required for student creation');
        }

        const course = await tx.course.findUnique({ where: { id: courseId } });
        if (!course) {
          throw new Error('Invalid course ID');
        }

        // Generate Admission Number & Enrollment Number
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const admissionNumber = `ADM${timestamp}${random}`;
        const enrollmentNumber = `STU${timestamp}${random}`;

        // Create Admission Record
        const admission = await tx.admission.create({
          data: {
            admissionNumber,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim(),
            courseId,
            branchId,
            feeAmount: course.fees,
            status: 'APPROVED',
          }
        });

        // Create Student Record
        await tx.student.create({
          data: {
            userId: newUser.id,
            admissionId: admission.id,
            enrollmentNumber,
            branchId,
            courseId,
          }
        });
      }

      // Re-fetch full user with relations
      const finalUser = await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          branchId: true,
          isActive: true,
          photo: true,
          createdAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          trainerProfile: {
            select: {
              specialization: true,
              experience: true,
            },
          },
          studentProfile: {
            select: {
              id: true,
              enrollmentNumber: true,
              course: {
                select: {
                  name: true
                }
              }
            }
          }
        },
      });

      return { user: finalUser, tempPassword };
    });

    return successResponse(res, result, 'User created successfully', 201);
  } catch (error: any) {
    console.error('Create user error:', error);
    return errorResponse(res, error.message || 'Failed to create user', 500);
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, role, branchId, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    // Branch filtering based on user role
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          branchId: true,
          isActive: true,
          photo: true,
          createdAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          trainerProfile: {
            select: {
              specialization: true,
              experience: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { users, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch users', 500, error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.ADMIN && user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, user);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user', 500, error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, isActive, branchId, password, specialization, experience, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && existingUser.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Password update permission check
    if (password) {
      // CEO can update any user's password
      if (req.user?.role === UserRole.CEO) {
        // Allowed
      }
      // CHANNEL_PARTNER can update any user's password except CEO
      else if (req.user?.role === UserRole.CHANNEL_PARTNER) {
        if (existingUser.role === UserRole.CEO) {
          return errorResponse(res, 'Channel Partners cannot update CEO passwords', 403);
        }
      }
      // Others cannot update passwords
      else {
        return errorResponse(res, 'You do not have permission to update passwords', 403);
      }
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        isActive,
        ...((req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO) && branchId ? { branchId } : {}),
        ...((req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO) && role ? { role } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
        // Handle Trainer Profile Upsert (Create or Update)
        ...((role === UserRole.TRAINER || (existingUser.role === UserRole.TRAINER && !role)) && (specialization || experience) ? {
          trainerProfile: {
            upsert: {
              create: {
                employeeId: `TR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                branchId: branchId || existingUser.branchId,
                specialization: specialization || 'General',
                experience: Number(experience) || 0,
                isActive: true
              },
              update: {
                ...(specialization ? { specialization } : {}),
                ...(experience ? { experience: Number(experience) } : {}),
              }
            }
          }
        } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        trainerProfile: {
          select: {
            specialization: true,
            experience: true,
          },
        },
      },
    });

    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update user', 500, error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.ADMIN && existingUser.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.user.delete({ where: { id } });

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete user', 500, error);
  }
};


