import { UserRole } from '../types/enums';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { errorResponse } from '../utils/response';


export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    branchId: string | null;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errorResponse(res, 'Access token required', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      branchId: user.branchId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};
