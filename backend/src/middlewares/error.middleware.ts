import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return errorResponse(res, 'Duplicate entry: Record already exists', 409);
  }
  
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, message, statusCode, err);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};
