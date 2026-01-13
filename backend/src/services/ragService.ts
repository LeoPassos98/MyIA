// backend/src/services/ragService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { prisma } from '../lib/prisma';
import { aiService } from './ai';

// Interface para mensagem com similaridade
interface MessageWithSimilarity {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  chatId: string;
  provider: string | null;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costInUSD: number | null;
  sentContext: string | null;
  similarity: number;
}

/**
 * O "Buscador" V9.4
 * Encontra mensagens semanticamente similares no 'pgvector'
 */
export const ragService = {

  async findSimilarMessages(
    queryText: string, 
    chatId: string, 
    limit: number = 5
  ): Promise<MessageWithSimilarity[]> {

    try {
      // 1. "Traduza" (V9.2) a pergunta
      const embedding = await aiService.embed(queryText);
      if (!embedding) {
        console.error("V9.4: Falha ao 'traduzir' a pergunta (embedding nulo)");
        return [];
      }

      // 2. "Busque" (V9.1) no 'pgvector'
      // Usamos '$queryRaw' para usar o operador '<->' (Distância de Cosseno)
      const vectorQuery = embedding.vector;

      const results: MessageWithSimilarity[] = await prisma.$queryRaw`
        SELECT 
          id,
          role,
          content,
          "createdAt",
          "chatId",
          provider,
          model,
          "tokensIn",
          "tokensOut",
          "costInUSD",
          "sentContext",
          1 - (vector <=> ${vectorQuery}::vector) as similarity
        FROM messages
        WHERE "chatId" = ${chatId}
          AND vector IS NOT NULL
        ORDER BY vector <=> ${vectorQuery}::vector
        LIMIT ${limit}
      `;

      return results;

    } catch (error: any) {
      console.error("Erro na busca V9.4 (ragService):", error.message);
      return [];
    }
  }
};
