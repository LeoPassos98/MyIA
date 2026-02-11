// backend/src/services/chat/contextService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { get_encoding } from 'tiktoken';
import { prisma } from '../../lib/prisma';
import { ragService } from '../ragService';
import { StreamChunk } from '../ai/types';

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
  /** Mapa de ID da mensagem → origem (para auditoria) */
  messageOrigins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent'>;
}

/**
 * Configuração do Pipeline de Contexto (vem do frontend)
 */
interface ContextPipelineConfig {
  systemPrompt?: string;
  pinnedEnabled?: boolean;
  recentEnabled?: boolean;
  recentCount?: number;
  ragEnabled?: boolean;
  ragTopK?: number;
  maxContextTokens?: number;
}

// Valores padrão (conservadores para Groq free tier: 12K TPM limit)
const DEFAULT_CONFIG: Required<ContextPipelineConfig> = {
  systemPrompt: 'Você é uma IA útil e direta.',
  pinnedEnabled: true,
  recentEnabled: true,
  recentCount: 5, // Reduzido para evitar contexto muito grande
  ragEnabled: true,
  ragTopK: 3, // Reduzido para evitar contexto muito grande
  maxContextTokens: 4000, // Seguro para Groq (deixa margem para resposta)
};

export const contextService = {
  /**
   * Busca as últimas N mensagens (Modo Rápido/Simples)
   */
  async getFastHistory(chatId: string, limit: number = 10): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
    writeSSE: (data: StreamChunk) => void,
    userConfig?: ContextPipelineConfig
  ): Promise<HybridHistoryReport> {
    
    // Merge com configuração padrão
    const config = { ...DEFAULT_CONFIG, ...userConfig };
    
    writeSSE({ type: 'debug', log: `⚙️ Config: pinned=${config.pinnedEnabled}, recent=${config.recentCount}, rag=${config.ragEnabled} (top ${config.ragTopK}), budget=${config.maxContextTokens}` });

    let pinnedMessages: Message[] = [];
    let relevantMessages: Message[] = [];
    let recentMessages: Message[] = [];

    // 1. PRIORIDADE MÁXIMA: Mensagens Pinadas (se habilitado)
    if (config.pinnedEnabled) {
      writeSSE({ type: 'debug', log: `📌 Pinned: Buscando mensagens fixadas...` });
      pinnedMessages = await this.getPinnedMessages(chatId);
      writeSSE({ type: 'debug', log: `📌 Pinned: ${pinnedMessages.length} mensagens fixadas encontradas` });
    }

    // 2. RAG: Busca semântica (se habilitado)
    if (config.ragEnabled) {
      writeSSE({ type: 'debug', log: `🧠 RAG: Buscando relevância semântica (top ${config.ragTopK})...` });
      relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, config.ragTopK);
      
      // Log detalhado para debug
      if (relevantMessages.length === 0) {
        writeSSE({ type: 'debug', log: `🧠 RAG: ⚠️ Nenhuma mensagem encontrada (verifique se há embeddings no banco)` });
      } else {
        const ragMsgIds = relevantMessages.map(m => m.id.substring(0, 8)).join(', ');
        writeSSE({ type: 'debug', log: `🧠 RAG: ${relevantMessages.length} mensagens encontradas [${ragMsgIds}...]` });
      }
    }

    // 3. Fast: Memória recente (se habilitado)
    if (config.recentEnabled) {
      writeSSE({ type: 'debug', log: `🕐 Recent: Buscando últimas ${config.recentCount} mensagens...` });
      recentMessages = await this.getFastHistory(chatId, config.recentCount);
      writeSSE({ type: 'debug', log: `🕐 Recent: ${recentMessages.length} mensagens recentes carregadas` });
    }

    // Algoritmo de Orçamento de Tokens com Prioridade
    const userTokens = encoding.encode(userMessage).length;
    let budget = config.maxContextTokens - userTokens - 500; 

    const finalContextHistory: Message[] = [];
    const includedIds = new Set<string>();
    const messageOrigins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent'> = {};

    // Mapeia quais mensagens vieram de cada fonte
    const ragIds = new Set(relevantMessages.map(m => m.id));
    const recentIds = new Set(recentMessages.map(m => m.id));

    // FASE 1: Inclui TODAS as mensagens pinadas (prioridade absoluta)
    for (const msg of pinnedMessages) {
      const tokens = encoding.encode(msg.content).length;
      budget -= tokens; // Desconta do budget mesmo se estourar (pinned é obrigatório)
      finalContextHistory.push(msg);
      includedIds.add(msg.id);
      messageOrigins[msg.id] = 'pinned';
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
        
        // Determina a origem da mensagem
        const isRag = ragIds.has(msg.id);
        const isRecent = recentIds.has(msg.id);
        if (isRag && isRecent) {
          messageOrigins[msg.id] = 'rag+recent';
        } else if (isRag) {
          messageOrigins[msg.id] = 'rag';
        } else {
          messageOrigins[msg.id] = 'recent';
        }
      } else {
        break;
      }
    }

    // Ordena cronologicamente e limpa campos desnecessários
    const cleanMessages = (msgs: Message[]): Message[] => {
      return msgs.map(msg => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sentContext, ...cleanedMsg } = msg as Message & { sentContext?: unknown };
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
      pinnedMessages: cleanMessages(pinnedMessages),
      messageOrigins
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
