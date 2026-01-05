// backend/src/controllers/promptTraceController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

class PromptTraceController {
  /**
   * GET /api/prompt-trace/:traceId
   *
   * traceId = messageId (assistant)
   * Retorna o trace completo da chamada da IA para aquela mensagem.
   */
  async getPromptTraceById(req: Request, res: Response) {
    const { traceId } = req.params;
    const userId = req.userId;

    if (!traceId) {
      return res.status(400).json({ error: 'traceId é obrigatório' });
    }

    try {
      const message = await prisma.message.findUnique({
        where: { id: traceId },
        include: { chat: true },
      });

      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (message.chat.userId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (!message.sentContext) {
        return res.status(404).json({ error: 'Trace não encontrado (sentContext vazio)' });
      }

      let sentContext: any;
      try {
        sentContext = JSON.parse(message.sentContext);
      } catch (err) {
        return res.status(500).json({ error: 'sentContext inválido (JSON malformado)' });
      }

      // payloadSent_V23 deve existir no padrão atual do seu auditObject
      const payload = sentContext.payloadSent_V23 || [];
      const config = sentContext.config_V47 || {};
      const pinnedStepIndices = sentContext.pinnedStepIndices || [];

      const trace = {
        traceId: message.id,
        messageId: message.id,
        chatId: message.chatId,
        createdAt: message.createdAt,
        provider: message.provider,
        model: message.model,

        // config guardada junto
        config,

        // O que foi enviado pra IA
        payloadSent: payload,

        // Índices dos steps que eram pinados
        pinnedStepIndices,

        // A resposta final
        response: {
          content: message.content,
        },

        // Métricas reais salvas no banco
        usage: {
          tokensIn: message.tokensIn,
          tokensOut: message.tokensOut,
          costInUSD: message.costInUSD,
        },
      };

      return res.json(trace);
    } catch (error) {
      logger.error('Erro ao carregar prompt trace', error);
      return res.status(500).json({ error: 'Erro ao carregar prompt trace' });
    }
  }
}

export const promptTraceController = new PromptTraceController();
