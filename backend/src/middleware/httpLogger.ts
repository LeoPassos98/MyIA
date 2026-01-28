// backend/src/middleware/httpLogger.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para logging estruturado de requisições HTTP
 * 
 * Captura informações detalhadas de cada requisição:
 * - Método HTTP (GET, POST, PUT, DELETE, etc.)
 * - URL da requisição
 * - Status code da resposta
 * - Duração da requisição (ms)
 * - Request ID (correlação)
 * - User ID (se autenticado)
 * - IP do cliente
 * - User Agent
 * - Content Length da resposta
 * 
 * Fase 1 HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md
 * 
 * @example
 * ```typescript
 * import { httpLoggerMiddleware } from './middleware/httpLogger';
 * 
 * app.use(httpLoggerMiddleware);
 * ```
 */
export function httpLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capturar evento de finalização da resposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log estruturado HTTP
    logger.http('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
      userId: (req.user as any)?.id || null,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
    });
  });

  next();
}
