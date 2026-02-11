// backend/src/middleware/validateRequest.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects } from 'zod';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateRequest = (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔍 LOG: Dados recebidos ANTES da validação
      logger.info(`[validateRequest] 📥 Validando ${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: {
          authorization: req.headers.authorization ? 'Bearer ***' : 'none'
        }
      });
      
      // Parsear e transformar os dados
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Atribuir valores transformados de volta ao request
      // Isso é necessário para que transforms do Zod (ex: string -> number) funcionem
      if (result.body) req.body = result.body;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.query) req.query = result.query as Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.params) req.params = result.params as Record<string, any>;
      
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
