// backend/src/services/certification/certificationStreamHandler.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Gerenciamento de Server-Sent Events (SSE) para certificação

import { Response } from 'express';
import { logger } from '../../utils/logger';
import { ProgressEvent, CertificationResult } from '../ai/certification/types';

/**
 * Configura headers HTTP para Server-Sent Events (SSE)
 * 
 * @param res - Response object do Express
 */
export function setupSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  
  logger.info('[SSE] Headers configurados');
}

/**
 * Cria callback de progresso para enviar eventos SSE
 * 
 * @param res - Response object do Express
 * @param requestId - ID da requisição para logging
 * @returns Função callback para eventos de progresso
 */
export function createProgressCallback(
  res: Response,
  requestId?: string
): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    const data = JSON.stringify(event);
    res.write(`data: ${data}\n\n`);
    
    logger.debug('[SSE] Evento enviado', {
      requestId,
      type: event.type,
      testName: event.testName,
      status: event.status,
      current: event.current,
      total: event.total
    });
  };
}

/**
 * Envia evento de conclusão via SSE
 * 
 * @param res - Response object do Express
 * @param result - Resultado da certificação
 * @param requestId - ID da requisição para logging
 */
export function sendCompleteEvent(
  res: Response,
  result: CertificationResult,
  requestId?: string
): void {
  const completeEvent: ProgressEvent = {
    type: 'complete',
    certification: result
  };
  
  res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
  
  logger.info('[SSE] Evento de conclusão enviado', {
    requestId,
    modelId: result.modelId,
    status: result.status
  });
}

/**
 * Envia evento de erro via SSE
 * 
 * @param res - Response object do Express
 * @param error - Erro ocorrido
 * @param requestId - ID da requisição para logging
 */
export function sendErrorEvent(
  res: Response,
  error: Error,
  requestId?: string
): void {
  const errorEvent: ProgressEvent = {
    type: 'error',
    message: error.message || 'Erro ao certificar modelo'
  };
  
  res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
  
  logger.error('[SSE] Evento de erro enviado', {
    requestId,
    error: error.message,
    stack: error.stack
  });
}

/**
 * Finaliza conexão SSE
 * 
 * @param res - Response object do Express
 * @param requestId - ID da requisição para logging
 */
export function closeSSEConnection(res: Response, requestId?: string): void {
  res.end();
  logger.info('[SSE] Conexão fechada', { requestId });
}
