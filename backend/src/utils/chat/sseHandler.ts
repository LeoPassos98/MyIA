// backend/src/utils/chat/sseHandler.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response } from 'express';
import { StreamChunk } from '../../services/ai/types';

/**
 * Utilitário para configuração e escrita de Server-Sent Events (SSE)
 */
export const sseHandler = {
  /**
   * Configura headers necessários para SSE
   */
  setupHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  },

  /**
   * Cria função de escrita SSE para a resposta
   */
  createWriter(res: Response): (data: StreamChunk) => void {
    return (data: StreamChunk) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
  }
};
