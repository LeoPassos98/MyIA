// backend/src/services/chat/telemetryCollector.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { aiService } from '../ai';
import { prepareForEmbedding } from '../embeddingUtils';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

/**
 * Parâmetros para geração de embeddings
 */
interface GenerateEmbeddingsParams {
  userMessageId: string;
  assistantMessageId: string;
  userContent: string;
  assistantContent: string;
  requestId?: string;
}

/**
 * Parâmetros para geração de título
 */
interface GenerateTitleParams {
  chatId: string;
  userMessage: string;
  assistantMessage: string;
  userId: string;
  requestId?: string;
}

/**
 * Service responsável por coletar telemetria e executar tarefas assíncronas
 * 
 * Responsabilidades:
 * - Gerar embeddings (fire and forget)
 * - Gerar título automático (fire and forget)
 * - Logging de erros em tarefas assíncronas
 */
class TelemetryCollectorService {
  /**
   * Gera embeddings para mensagens (fire and forget)
   * Não bloqueia o fluxo principal
   */
  generateEmbeddings(params: GenerateEmbeddingsParams): void {
    const {
      userMessageId,
      assistantMessageId,
      userContent,
      assistantContent,
      requestId
    } = params;

    // Embedding da resposta do assistente
    aiService
      .embed(prepareForEmbedding(assistantContent))
      .then(async (emb) => {
        if (emb) {
          const vectorStr = '[' + emb.vector.join(',') + ']';
          await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${assistantMessageId}`;
        }
      })
      .catch((e) => {
        logger.error('Erro ao gerar embedding da resposta', {
          requestId,
          messageId: assistantMessageId,
          error: e instanceof Error ? e.message : String(e)
        });
      });

    // Embedding da mensagem do usuário
    aiService
      .embed(prepareForEmbedding(userContent))
      .then(async (emb) => {
        if (emb) {
          const vectorStr = '[' + emb.vector.join(',') + ']';
          await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${userMessageId}`;
        }
      })
      .catch((e) => {
        logger.error('Erro ao gerar embedding da mensagem do usuário', {
          requestId,
          messageId: userMessageId,
          error: e instanceof Error ? e.message : String(e)
        });
      });
  }

  /**
   * Gera título automático para novo chat (fire and forget)
   * Não bloqueia o fluxo principal
   */
  generateTitle(params: GenerateTitleParams): void {
    const { chatId, userMessage, assistantMessage, userId, requestId } = params;

    (async () => {
      try {
        const titlePrompt = [
          {
            role: 'system',
            content:
              'Você é uma IA especializada em resumir tópicos. Gere um título curto (máximo 5 palavras) e direto para esta conversa. Responda APENAS o título, sem aspas.'
          },
          {
            role: 'user',
            content: `User: ${userMessage}\nAI: ${assistantMessage}`
          }
        ];

        const titleStream = aiService.stream(titlePrompt, {
          providerSlug: 'groq',
          modelId: 'llama-3.1-8b-instant',
          userId
        });

        let generatedTitle = '';
        for await (const chunk of titleStream) {
          if (chunk.type === 'chunk') generatedTitle += chunk.content;
        }

        generatedTitle = generatedTitle.trim().replace(/^["']|["']$/g, '');

        if (generatedTitle) {
          await prisma.chat.update({
            where: { id: chatId },
            data: { title: generatedTitle }
          });
        }
      } catch (err) {
        logger.error('Erro ao gerar título automático', {
          requestId,
          chatId,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
      }
    })();
  }
}

export const telemetryCollectorService = new TelemetryCollectorService();
