import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
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
 * Create a new user (ADMIN only or BRANCH_HEAD for their branch)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { email, firstName, lastName, phone, role, branchId } = req.body;

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
    if (req.user?.role === UserRole.ADMIN) {
      // ADMIN can create any user
      if (role === UserRole.ADMIN) {
        return errorResponse(res, 'Cannot create another ADMIN user', 403);
      }
    } else if (req.user?.role === UserRole.BRANCH_HEAD) {
      // BRANCH_HEAD can only create users in their branch (not ADMIN or other BRANCH_HEADs)
      if (role === UserRole.ADMIN || role === UserRole.BRANCH_HEAD) {
        return errorResponse(res, 'You cannot create ADMIN or BRANCH_HEAD users', 403);
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

    // Create user
    const user = await prisma.user.create({
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
      },
    });

    return successResponse(res, {
      user,
      tempPassword, // Return temp password only once
    }, 'User created successfully. Please share the temporary password securely.', 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 'Failed to create user', 500, error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, role, branchId, search } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    // Branch filtering based on user role
    if (req.user?.role !== UserRole.ADMIN) {
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
          createdAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
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
    const { firstName, lastName, phone, isActive, branchId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.ADMIN && existingUser.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        isActive,
        ...(req.user?.role === UserRole.ADMIN && branchId && { branchId }),
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
        updatedAt: true,
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
