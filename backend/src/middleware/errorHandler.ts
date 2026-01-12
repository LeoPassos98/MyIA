
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (

  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // 1. Captura erros de sintaxe (como os tracinhos extras no JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(ApiResponse.fail({ message: 'JSON malformado. Verifique caracteres extras.' }));
  }

  // 2. Captura erros de lógica conhecidos (Invalid credentials, etc)
  if (err.message === 'Invalid credentials' || err.name === 'AppError') {
    return res.status(401).json(ApiResponse.fail({ message: err.message }));
  }

  // 3. Log para você ver no terminal do Fedora
  console.error(' [DETALHE DO ERRO] ', err);

  return res.status(500).json(ApiResponse.error('Erro interno no servidor'));
};