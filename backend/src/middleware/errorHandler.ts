// backend/src/middleware/errorHandler.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

// Classe de erro customizada para erros operacionais
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware global de tratamento de erros (JSend, JWT, sintaxe, credenciais)
export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response
) => {
  // 1. Erro de autenticação JWT (express-jwt, etc)
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ApiResponse.fail({ message: 'Token inválido ou ausente' }));
  }

  // 2. Erro de sintaxe no JSON do body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(ApiResponse.fail({ message: 'JSON malformado. Verifique caracteres extras.' }));
  }

  // 3. Erros de credenciais (login social ou padrão)
  if (err.message === 'Invalid credentials' || err.name === 'AppError' || err instanceof AppError) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json(ApiResponse.fail({ message: err.message }));
  }

  // 4. Log detalhado para desenvolvedor
  logger.error(`${err.name}: ${err.message} (${err.statusCode || 500})`);
  if (process.env.NODE_ENV === 'development') {
    console.error(' [ERROR] ', err);
  }

  // 5. Determinar se é erro de cliente (4xx) ou servidor (5xx)
  const statusCode = err.statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

  // 6. Resposta para erros de CLIENTE (4xx) -> JSend 'fail'
  if (status === 'fail') {
    return res.status(statusCode).json(ApiResponse.fail({ message: err.message }));
  }

  // 7. Resposta para erros de SERVIDOR (5xx) -> JSend 'error'
  return res.status(statusCode).json(
    ApiResponse.error(
      process.env.NODE_ENV === 'production' 
        ? 'Erro interno no servidor' 
        : err.message || 'Erro interno no servidor'
    )
  );
};
