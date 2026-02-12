import { UserRole } from '../types/enums';;
import { Response, NextFunction } from 'express';
;
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

export const requireAdmin = requireRoles(UserRole.CEO, UserRole.ADMIN);
export const requireBranchHead = requireRoles(UserRole.CEO, UserRole.ADMIN, UserRole.CHANNEL_PARTNER);
export const requireTrainer = requireRoles(UserRole.CEO, UserRole.ADMIN, UserRole.CHANNEL_PARTNER, UserRole.TRAINER);
export const requireStudent = requireRoles(UserRole.CEO, UserRole.ADMIN, UserRole.CHANNEL_PARTNER, UserRole.TRAINER, UserRole.STUDENT);

