import { UserRole } from '../types/enums';;
import { Response, NextFunction } from 'express';
;
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response';

/**
 * Middleware to enforce branch-level access control
 * - CEO can access all branches
 * - Other roles can only access their assigned branch
 */
export const enforceBranchAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  // CEO has access to all branches
  if (req.user.role === UserRole.CEO) {
    return next();
  }

  // Extract branchId from request (body, query, or params)
  const requestedBranchId = req.body.branchId || req.query.branchId || req.params.branchId;

  // If no branch specified in request, allow (will use user's branch)
  if (!requestedBranchId) {
    return next();
  }

  // Verify user has access to the requested branch
  if (req.user.branchId !== requestedBranchId) {
    return errorResponse(res, 'Access denied: Branch mismatch', 403);
  }

  next();
};

/**
 * Attach user's branchId to request if not specified
 * Useful for create operations
 */
export const attachUserBranch = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next();
  }

  // If CEO, don't auto-attach branch
  if (req.user.role === UserRole.CEO) {
    return next();
  }

  // Auto-attach user's branch if not specified
  if (!req.body.branchId && req.user.branchId) {
    req.body.branchId = req.user.branchId;
  }

  next();
};
