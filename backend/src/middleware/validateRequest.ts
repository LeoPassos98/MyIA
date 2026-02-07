// backend/src/middleware/validateRequest.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects } from 'zod';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

export const validateRequest = (schema: AnyZodObject | ZodEffects<any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔍 LOG: Dados recebidos ANTES da validação
      logger.info(`[validateRequest] 📥 Validando ${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: {
          contentType: req.headers['content-type'],
          authorization: req.headers.authorization ? 'Bearer ***' : 'none'
        }
      });
      
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
          message: err.message,
          code: err.code // 🔍 Adicionar código do erro
        }));
        
        logger.warn(`[validateRequest] ❌ Validação falhou para ${req.method} ${req.path}`, {
          errors: formattedErrors,
          receivedData: {
            body: req.body,
            query: req.query,
            params: req.params
          }
        });
        
        return res.status(400).json(ApiResponse.fail({ validation: formattedErrors }));
      }
      
      logger.error(`[validateRequest] ❌ Erro interno na validação para ${req.method} ${req.path}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return res.status(500).json(ApiResponse.error('Erro interno na validação'));
    }
  };
