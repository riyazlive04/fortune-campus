import { UserRole } from '../../types/enums';;
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
;

/**
 * Get user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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

    return successResponse(res, user);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', 500, error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const userId = req.user!.id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: userId },
        },
      });

      if (existingUser) {
        return errorResponse(res, 'Email is already in use', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        branchId: true,
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

    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', 500, error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to change password', 500, error);
  }
};

/**
 * Admin: Update any user's profile
 */
export const adminUpdateUserProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, isActive } = req.body;

    // Only ADMIN can update other users
    if (req.user?.role !== UserRole.ADMIN) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: id },
        },
      });

      if (existingUser) {
        return errorResponse(res, 'Email is already in use', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(isActive !== undefined && { isActive }),
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

    return successResponse(res, user, 'User profile updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update user profile', 500, error);
  }
};

/**
 * Admin: Reset any user's password
 */
export const adminResetUserPassword = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Only ADMIN can reset other users' passwords
    if (req.user?.role !== UserRole.ADMIN) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    // Validation
    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters long', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to reset password', 500, error);
  }
};
