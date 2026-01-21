// backend/src/middleware/validateRequest.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects } from 'zod';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

export const validateRequest = (schema: AnyZodObject | ZodEffects<any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(`[validateRequest] Validando ${req.method} ${req.path}`);
      
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      logger.info(`[validateRequest] ✅ Validação passou para ${req.method} ${req.path}`);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formata os erros do Zod para o frontend
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn(`[validateRequest] ❌ Validação falhou para ${req.method} ${req.path}`, { errors: formattedErrors });
        
        return res.status(400).json(ApiResponse.fail({ validation: formattedErrors }));
      }
      
      logger.error(`[validateRequest] ❌ Erro interno na validação para ${req.method} ${req.path}`, { error });
      return res.status(500).json(ApiResponse.error('Erro interno na validação'));
    }
  };
