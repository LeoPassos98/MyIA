// backend/src/controllers/chatController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { duplicateRequestGuard } from '../utils/chat/duplicateRequestGuard';
import { sseHandler } from '../utils/chat/sseHandler';
import { chatOrchestratorService } from '../services/chat/chatOrchestrator.service';
import { logger } from '../utils/logger';

/**
 * Controller HTTP para chat
 * 
 * Responsabilidade ÚNICA: Orquestração HTTP
 * - Receber requisição
 * - Validar autenticação
 * - Prevenir duplicidade
 * - Configurar SSE
 * - Delegar processamento ao orchestrator
 * - Retornar resposta
 * 
 * TODA a lógica de negócio foi movida para services modulares.
 */
export const chatController = {
  /**
   * Endpoint: POST /api/chat/send
   * Processa mensagem do usuário e retorna resposta via SSE
   */
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    logger.info(`[chatController.sendMessage] 🚀 Iniciando processamento para userId: ${req.userId}`);

    try {
      // 1. Validação de Autenticação
      if (!req.userId) {
        logger.warn('[chatController.sendMessage] ❌ userId não encontrado');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      logger.info('[chatController.sendMessage] ✅ Autenticação OK, processando mensagem...');

      // 2. Extrai mensagem
      const messageContent = req.body.prompt || req.body.message;
      if (!messageContent || typeof messageContent !== 'string' || !messageContent.trim()) {
        res.status(400).json({ error: 'Message required' });
        return;
      }

      // 3. Prevenção de Duplicidade
      const requestId = duplicateRequestGuard.generateId(
        req.userId,
        req.body.chatId,
        messageContent
      );

      if (duplicateRequestGuard.isProcessing(requestId)) {
        res.status(429).json({ error: 'Duplicate request blocked' });
        return;
      }

      const cleanup = duplicateRequestGuard.markAsProcessing(requestId);

      // 4. Setup SSE (Streaming)
      sseHandler.setupHeaders(res);
      const writeSSE = sseHandler.createWriter(res);

      try {
        // 5. Delega processamento ao orchestrator
        await chatOrchestratorService.processMessage({
          userId: req.userId,
          body: req.body,
          writeSSE,
          requestId: req.id
        });

        res.end();
      } finally {
        cleanup();
      }
    } catch (error) {
      if (!res.headersSent) next(error);
    }
  }
};
