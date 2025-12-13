// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { ragService } from '../ragService';
import { StreamChunk } from '../ai/types';
import { get_encoding } from 'tiktoken';

const encoding = get_encoding('cl100k_base');

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface HybridHistoryReport {
  finalContext: Message[];
  relevantMessages: Message[];
  recentMessages: Message[];
}

export const contextService = {
  /**
   * Busca as últimas 10 mensagens (Modo Rápido/Simples)
   */
  async getFastHistory(chatId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return messages.reverse() as Message[];
  },

  /**
   * Busca histórico inteligente com RAG + Recentes + Limite de Tokens
   */
  async getHybridRagHistory(
    chatId: string, 
    userMessage: string, 
    writeSSE: (data: StreamChunk) => void
  ): Promise<HybridHistoryReport> {
    
    writeSSE({ type: 'debug', log: `🧠 RAG: Buscando relevância semântica...` });
    const relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, 5);

    writeSSE({ type: 'debug', log: `🧠 Fast: Buscando memória recente...` });
    const recentMessages = await this.getFastHistory(chatId);

    // Combina e remove duplicatas
    const combinedMap = new Map<string, any>();
    recentMessages.forEach(msg => combinedMap.set(msg.id, msg));
    relevantMessages.forEach(msg => combinedMap.set(msg.id, msg));

    const combinedHistory = Array.from(combinedMap.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Algoritmo de Orçamento de Tokens
    const MAX_CONTEXT_TOKENS = 6000; 
    const userTokens = encoding.encode(userMessage).length;
    let budget = MAX_CONTEXT_TOKENS - userTokens - 500; 

    const finalContextHistory = [];
    
    for (const msg of [...combinedHistory].reverse()) { 
      const tokens = encoding.encode(msg.content).length;
      if (budget - tokens >= 0) {
        budget -= tokens;
        finalContextHistory.push(msg);
      } else {
        break;
      }
    }

    const cleanMessages = (msgs: Message[]): Message[] => {
      return msgs.map(msg => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sentContext, ...cleanedMsg } = msg as any;
        return cleanedMsg as Message;
      });
    };

    return {
      finalContext: cleanMessages(finalContextHistory.reverse()),
      relevantMessages: cleanMessages(relevantMessages),
      recentMessages: cleanMessages(recentMessages)
    };
  },

  /**
   * Calcula tokens de uma lista de mensagens
   */
  countTokens(messages: { content: string }[]): number {
    return messages.reduce((acc, msg) => acc + encoding.encode(msg.content).length, 0);
  },

  /**
   * Calcula tokens de uma string
   */
  encode(text: string): number {
    return encoding.encode(text).length;
  }
};
