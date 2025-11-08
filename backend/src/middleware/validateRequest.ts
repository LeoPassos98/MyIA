import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {  // ← Adicione _ aqui
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Validation error';
      next(new AppError(message, 400));
    }
  };
};