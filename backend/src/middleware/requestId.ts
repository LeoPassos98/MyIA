import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware que gera um UUID único para cada requisição HTTP.
 * 
 * Funcionalidades:
 * - Gera UUID v4 único por requisição
 * - Adiciona req.id com o UUID gerado
 * - Adiciona header X-Request-ID na resposta
 * 
 * @param req - Request do Express
 * @param res - Response do Express
 * @param next - NextFunction do Express
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Gera UUID único para a requisição
  const requestId = uuidv4();
  
  // Adiciona o requestId ao objeto Request
  req.id = requestId;
  
  // Adiciona o header X-Request-ID na resposta
  res.setHeader('X-Request-ID', requestId);
  
  // Continua para o próximo middleware
  next();
}
