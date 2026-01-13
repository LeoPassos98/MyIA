// backend/src/controllers/promptTraceController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { get_encoding } from 'tiktoken';
import { jsend } from '../utils/jsend';

// Encoder para contagem de tokens (mesmo usado no contextService)
const encoding = get_encoding('cl100k_base');

/**
 * Conta tokens de uma string usando tiktoken
 */
function countTokens(text: string): number {
  return encoding.encode(text).length;
}

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
      return res.status(400).json(jsend.fail({ traceId: 'Campo obrigatório' }));
    }

    try {
      const message = await prisma.message.findUnique({
        where: { id: traceId },
        include: { chat: true },
      });

      if (!message) {
        return res.status(404).json(jsend.fail({ message: 'Mensagem não encontrada' }));
      }

      if (message.chat.userId !== userId) {
        return res.status(403).json(jsend.fail({ access: 'Acesso negado' }));
      }

      if (!message.sentContext) {
        return res.status(404).json(jsend.fail({ trace: 'Trace não encontrado (sentContext vazio)' }));
      }

      let sentContext: any;
      try {
        sentContext = JSON.parse(message.sentContext);
      } catch (err) {
        return res.status(500).json(jsend.error('sentContext inválido (JSON malformado)'));
      }

      const config = sentContext.config_V47 || {};
      const pinnedStepIndices = sentContext.pinnedStepIndices || [];
      const stepOrigins = sentContext.stepOrigins || {};

      // === RECONSTRUÇÃO SOB DEMANDA (Standards §7) ===
      // Suporte a formato LEAN (messageIds) e legado (payloadSent_V23)
      let payload: Array<{ role: string; content: string }> = [];

      if (sentContext.messageIds && sentContext.messageIds.length > 0) {
        // FORMATO LEAN: Reconstruir payload a partir dos IDs
        const systemPrompt = sentContext.systemPrompt || 'Você é uma IA útil e direta.';
        
        // Busca mensagens do histórico
        const historyMessages = await prisma.message.findMany({
          where: { id: { in: sentContext.messageIds } },
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true }
        });

        // Busca mensagem do usuário (pergunta atual)
        const userMessage = sentContext.userMessageId 
          ? await prisma.message.findUnique({
              where: { id: sentContext.userMessageId },
              select: { role: true, content: true }
            })
          : null;

        // Reconstrói o payload na ordem correta
        payload.push({ role: 'system', content: systemPrompt });
        historyMessages.forEach(msg => {
          payload.push({ role: msg.role, content: msg.content });
        });
        if (userMessage) {
          payload.push({ role: userMessage.role, content: userMessage.content });
        }
      } else if (sentContext.payloadSent_V23) {
        // FORMATO LEGADO: Usa payload salvo diretamente
        payload = sentContext.payloadSent_V23;
      }

      // === CÁLCULO DE TOKENS POR STEP (sob demanda) ===
      const payloadWithTokens = payload.map((msg) => ({
        ...msg,
        tokens: countTokens(msg.content)
      }));

      // Tokens da resposta
      const responseTokens = message.content ? countTokens(message.content) : 0;

      const trace = {
        traceId: message.id,
        messageId: message.id,
        chatId: message.chatId,
        createdAt: message.createdAt,
        provider: message.provider,
        model: message.model,

        // config guardada junto
        config,

        // O que foi enviado pra IA (com tokens por step)
        payloadSent: payloadWithTokens,

        // Índices dos steps que eram pinados
        pinnedStepIndices,

        // Origens de cada step (pinned, rag, recent, rag+recent, manual)
        stepOrigins,

        // A resposta final (com tokens)
        response: {
          content: message.content,
          tokens: responseTokens,
        },

        // Métricas reais salvas no banco
        usage: {
          tokensIn: message.tokensIn,
          tokensOut: message.tokensOut,
          costInUSD: message.costInUSD,
        },
      };

      return res.json(jsend.success({ trace }));
    } catch (error) {
      logger.error('Erro ao carregar prompt trace', error);
      return res.status(500).json(jsend.error('Erro ao carregar prompt trace'));
    }
  }
}

export const promptTraceController = new PromptTraceController();
