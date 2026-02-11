import { UserRole } from '../../types/enums';;
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { config } from '../../config';

/**
 * Check if initial setup is required
 * Returns true if no users exist in the database
 */
export const getSetupStatus = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const userCount = await prisma.user.count();

    return successResponse(res, {
      setupRequired: userCount === 0,
    }, 'Setup status retrieved successfully');
  } catch (error) {
    console.error('Get setup status error:', error);
    return errorResponse(res, 'Failed to check setup status', 500);
  }
};

/**
 * Initialize the system by creating the first ADMIN user
 * Only works if no users exist in the database
 * Also creates default branches automatically
 */
export const initializeSetup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return errorResponse(res, 'All fields are required', 400);
    }

    // Check if any users already exist
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return errorResponse(res, 'Setup has already been completed. Please use the login page.', 403);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Password validation
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default branches to create
    const defaultBranches = [
      { name: 'Tirupur', code: 'TIR', city: 'Tirupur', state: 'Tamil Nadu' },
      { name: 'Salem', code: 'SLM', city: 'Salem', state: 'Tamil Nadu' },
      { name: 'Erode', code: 'ERD', city: 'Erode', state: 'Tamil Nadu' },
      { name: 'Coimbatore', code: 'CBE', city: 'Coimbatore', state: 'Tamil Nadu' },
    ];

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the first ADMIN user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: UserRole.ADMIN,
          isActive: true,
          branchId: null, // ADMIN has access to all branches
        },
      });

      // Create default branches
      const branches = await Promise.all(
        defaultBranches.map((branch) =>
          tx.branch.create({
            data: branch,
          })
        )
      );

      return { user, branches };
    });

    // Generate JWT token for auto-login
    const token = jwt.sign(
      {
        userId: result.user.id,
        role: result.user.role,
        branchId: result.user.branchId,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return successResponse(res, {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        branchId: result.user.branchId,
      },
      branchesCreated: result.branches.length,
    }, 'Admin account and branches created successfully', 201);
  } catch (error) {
    console.error('Initialize setup error:', error);

    // Handle duplicate email error
    if ((error as any).code === 'P2002') {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    return errorResponse(res, 'Failed to initialize setup', 500);
  }
};
