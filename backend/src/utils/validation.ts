import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from './response';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors);
        return;
      }
      errorResponse(res, 'Invalid request data', 400);
    }
  };
};
