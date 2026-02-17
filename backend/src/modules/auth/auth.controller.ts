import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../utils/response";
import { config } from "../../config";

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password, firstName, lastName, role, branchId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        branchId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        branchId: user.branchId,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        branch: user.branch,
      },
    }, 'User registered successfully', 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Failed to register user', 500);
  }
};

/**
 * User login
 */

/**
 * User login
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // 2️⃣ Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // 3️⃣ User not found or inactive
    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // 4️⃣ Password check
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // 5️⃣ Generate JWT
    console.log('Signing token with secret length:', config.jwt.secret.length);
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        branchId: user.branchId,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // 6️⃣ Success response (never expose password)
    return successResponse(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        branch: user.branch,
      },
    }, 'Login successful');
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, 'Failed to login', 500);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
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

    return successResponse(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId,
      branch: user.branch,
      isActive: user.isActive,
    }, 'User retrieved successfully');
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};