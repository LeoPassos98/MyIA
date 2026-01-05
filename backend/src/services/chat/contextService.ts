// backend/src/services/chat/contextService.ts
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
  isPinned?: boolean;
}

interface HybridHistoryReport {
  finalContext: Message[];
  relevantMessages: Message[];
  recentMessages: Message[];
  pinnedMessages: Message[];
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
   * Busca mensagens pinadas do chat (prioridade máxima)
   */
  async getPinnedMessages(chatId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { 
        chatId,
        isPinned: true 
      },
      orderBy: { createdAt: 'asc' },
    });
    return messages as Message[];
  },

  /**
   * Busca histórico inteligente com Pinned + RAG + Recentes + Limite de Tokens
   * PRIORIDADE: 1. Pinned (sempre) → 2. RAG (semântico) → 3. Recentes (fallback)
   */
  async getHybridRagHistory(
    chatId: string, 
    userMessage: string, 
    writeSSE: (data: StreamChunk) => void
  ): Promise<HybridHistoryReport> {
    
    // 1. PRIORIDADE MÁXIMA: Mensagens Pinadas (sempre incluídas)
    writeSSE({ type: 'debug', log: `📌 Pinned: Buscando mensagens fixadas...` });
    const pinnedMessages = await this.getPinnedMessages(chatId);
    writeSSE({ type: 'debug', log: `📌 Pinned: ${pinnedMessages.length} mensagens fixadas encontradas` });

    // 2. RAG: Busca semântica
    writeSSE({ type: 'debug', log: `🧠 RAG: Buscando relevância semântica...` });
    const relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, 5);

    // 3. Fast: Memória recente
    writeSSE({ type: 'debug', log: `🧠 Fast: Buscando memória recente...` });
    const recentMessages = await this.getFastHistory(chatId);

    // Algoritmo de Orçamento de Tokens com Prioridade
    const MAX_CONTEXT_TOKENS = 6000; 
    const userTokens = encoding.encode(userMessage).length;
    let budget = MAX_CONTEXT_TOKENS - userTokens - 500; 

    const finalContextHistory: Message[] = [];
    const includedIds = new Set<string>();

    // FASE 1: Inclui TODAS as mensagens pinadas (prioridade absoluta)
    for (const msg of pinnedMessages) {
      const tokens = encoding.encode(msg.content).length;
      budget -= tokens; // Desconta do budget mesmo se estourar (pinned é obrigatório)
      finalContextHistory.push(msg);
      includedIds.add(msg.id);
    }

    if (pinnedMessages.length > 0) {
      writeSSE({ type: 'debug', log: `📌 Budget após pinned: ${budget} tokens restantes` });
    }

    // FASE 2: Combina RAG + Recentes (sem duplicar pinned)
    const combinedMap = new Map<string, Message>();
    recentMessages.forEach(msg => {
      if (!includedIds.has(msg.id)) combinedMap.set(msg.id, msg);
    });
    relevantMessages.forEach(msg => {
      if (!includedIds.has(msg.id)) combinedMap.set(msg.id, msg);
    });

    const combinedHistory = Array.from(combinedMap.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // FASE 3: Preenche com RAG/Recentes até estourar o budget
    for (const msg of [...combinedHistory].reverse()) { 
      const tokens = encoding.encode(msg.content).length;
      if (budget - tokens >= 0) {
        budget -= tokens;
        finalContextHistory.push(msg);
        includedIds.add(msg.id);
      } else {
        break;
      }
    }

    // Ordena cronologicamente e limpa campos desnecessários
    const cleanMessages = (msgs: Message[]): Message[] => {
      return msgs.map(msg => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sentContext, ...cleanedMsg } = msg as any;
        return cleanedMsg as Message;
      });
    };

    // Ordena o resultado final cronologicamente
    finalContextHistory.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      finalContext: cleanMessages(finalContextHistory),
      relevantMessages: cleanMessages(relevantMessages),
      recentMessages: cleanMessages(recentMessages),
      pinnedMessages: cleanMessages(pinnedMessages)
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
