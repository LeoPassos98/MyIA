// backend/src/middleware/validateRequest.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      console.log('=== VALIDAÇÃO ===');
      console.log('Body recebido:', JSON.stringify(req.body, null, 2));
      console.log('Tipo do body:', typeof req.body);
      
      // Validar apenas o body, não o objeto completo
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        console.log('Erro de validação:', JSON.stringify(result.error.errors, null, 2));
        const message = result.error.errors[0]?.message || 'Validation error';
        throw new AppError(message, 400);
      }
      
      console.log('Validação OK!');
      next();
    } catch (error: any) {
      console.error('Erro no validateRequest:', error);
      next(error);
    }
  };
};