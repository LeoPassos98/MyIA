// backend/src/middleware/errorHandler.ts
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

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

export const errorHandler = (err: any, _req: Request, res: Response) => {
  const statusCode = err.statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

  // Log do erro para o desenvolvedor
  logger.error(`${err.name}: ${err.message} (${statusCode})`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // 1. Resposta para erros de CLIENTE (4xx) -> JSend 'fail'
  if (status === 'fail') {
    return res.status(statusCode).json({
      status: 'fail',
      data: { message: err.message }
    });
  }

  // 2. Resposta para erros de SERVIDOR (5xx) -> JSend 'error'
  return res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro interno no servidor' 
      : err.message,
    code: statusCode
  });
};