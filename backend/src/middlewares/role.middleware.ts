import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

export const requireAdmin = requireRoles(UserRole.ADMIN);
export const requireBranchHead = requireRoles(UserRole.ADMIN, UserRole.BRANCH_HEAD);
export const requireTrainer = requireRoles(UserRole.ADMIN, UserRole.BRANCH_HEAD, UserRole.TRAINER);
