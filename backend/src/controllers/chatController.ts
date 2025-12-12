// backend/src/controllers/chatController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { ragService } from '../services/ragService';
import { TelemetryMetrics, StreamChunk, AiServiceResponse } from '../services/ai/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { get_encoding } from 'tiktoken';
// import { getProviderInfo } from '../config/providerMap'; // LEGACY: Removido
// import { getProviderConfig } from '../services/ai/utils/providerUtils'; // LEGACY: Removido

// Instanciar encoding tiktoken (escopo global)
const encoding = get_encoding('cl100k_base');

// [V22] Interface do relatório estruturado
interface HybridHistoryReport {
  finalContext: Message[];
  relevantMessages: Message[];
  recentMessages: Message[];
}

// Tipo auxiliar para Message
interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  sentContext?: any;
}

// Helper: conta palavras
function countWords(str: string): number {
  if (!str) return 0;
  return str.split(/\s+/).filter(Boolean).length;
}

// Helper: cria timeout reutilizável
function createTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
}

// --- MOTOR 1 (V7 - Rápido/Burro) ---
async function getFastHistory(chatId: string) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  return messages.reverse();
}

// --- O "MOTOR" V9.4 (Híbrido RAG) ---
async function getHybridRagHistory(
  chatId: string, 
  userMessage: string, 
  providerModel: string, // Agora é apenas string informativa
  writeSSE: (data: StreamChunk) => void
): Promise<HybridHistoryReport> {

  writeSSE({ type: 'debug', log: `🧠 V9.4: Buscando memória RAG (relevância semântica)...` });
  const relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, 5);

  writeSSE({ type: 'debug', log: `🧠 V7: Buscando memória recente (últimas 10 msgs)...` });
  const recentMessages = await getFastHistory(chatId);

  const combinedMap = new Map<string, any>();
  recentMessages.forEach(msg => combinedMap.set(msg.id, msg));
  relevantMessages.forEach(msg => combinedMap.set(msg.id, msg));

  const combinedHistory = Array.from(combinedMap.values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // FIXME: Pegar limite real do banco de dados no futuro. 
  // Por enquanto, hardcoded seguro para não quebrar a migração.
  const MAX_CONTEXT_TOKENS = 6000; 
  const ANSWER_BUFFER = 2000;
  
  const messageTokens = encoding.encode(userMessage).length;
  let budget = (MAX_CONTEXT_TOKENS - ANSWER_BUFFER) - messageTokens;

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
      const { sentContext, ...cleanedMsg } = msg;
      return cleanedMsg as Message;
    });
  };

  return {
    finalContext: cleanMessages(finalContextHistory.reverse()),
    relevantMessages: cleanMessages(relevantMessages),
    recentMessages: cleanMessages(recentMessages)
  };
}

// [V33] PROTEÇÃO ANTI-DISPARO MÚLTIPLO
const processingRequests = new Set<string>();

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { 
        message: legacyMessage, 
        prompt, 
        provider: requestProvider, 
        chatId, 
        contextStrategy,
        model,
        context,
        selectedMessageIds,
        strategy,
        temperature,
        topK,
        memoryWindow
      } = req.body;

      const message = prompt || legacyMessage;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ 
          error: 'Message/prompt is required and must be a non-empty string' 
        });
      }

      // [V33] ID ÚNICO DETERMINÍSTICO
      const crypto = require('crypto');
      const messageHash = crypto.createHash('sha256').update(message).digest('hex').substring(0, 16);
      const requestId = `${req.userId}-${chatId || 'novo'}-${messageHash}`;

      if (processingRequests.has(requestId)) {
        logger.warn(`[V33] ⛔ Requisição duplicada bloqueada: ${requestId}`);
        return res.status(429).json({ error: 'Requisição duplicada.' });
      }

      processingRequests.add(requestId);

      const cleanup = () => { processingRequests.delete(requestId); };
      const timeoutCleanup = setTimeout(() => {
        if (processingRequests.has(requestId)) cleanup();
      }, 60000);

      // --- Configurar Headers SSE ---
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const writeSSE = (data: StreamChunk) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      writeSSE({ type: 'debug', log: '🔍 Iniciando processamento modular...' });

      // --- 1. Encontrar ou Criar a Conversa ---
      let currentChat;
      let lockedProvider: string;
      let isNewChat = false;

      // Definir slug do provider (usando 'groq' como fallback seguro)
      const providerSlug = requestProvider || 'groq';

      if (chatId) {
        currentChat = await prisma.chat.findUnique({ 
          where: { id: chatId, userId: req.userId }
        });
        
        if (!currentChat) {
          writeSSE({ type: 'error', error: 'Conversa não encontrada' });
          res.end();
          return;
        }
        
        lockedProvider = currentChat.provider;
      } else {
        currentChat = await prisma.chat.create({
          data: {
            userId: req.userId,
            provider: providerSlug
          }
        });
        lockedProvider = providerSlug;
        isNewChat = true;
      }

      // --- 2. Histórico e Contexto ---
      const isManualMode = context !== undefined || (selectedMessageIds && selectedMessageIds.length > 0);
      
      // Busca modelo padrão do banco (simulado aqui, idealmente viria do providerConfig)
      // O Factory lidará com defaults se o model for nulo
      const targetModelId = model || (lockedProvider === 'openai' ? 'gpt-4-turbo' : 'llama3-70b-8192');
      
      let historyReport: HybridHistoryReport | null = null;
      let historyMessages: Message[] = [];

      if (isManualMode) {
        if (selectedMessageIds && selectedMessageIds.length > 0) {
          historyMessages = await prisma.message.findMany({
            where: { id: { in: selectedMessageIds }, chatId: currentChat.id },
            orderBy: { createdAt: 'asc' }
          });
        }
      } else if ((strategy || contextStrategy) === 'efficient') {
        historyReport = await getHybridRagHistory(currentChat.id, message, targetModelId, writeSSE);
        historyMessages = historyReport.finalContext;
      } else {
        historyMessages = await getFastHistory(currentChat.id);
      }

      // --- 3. Salvar User Message ---
      const userMessageRecord = await prisma.message.create({
        data: {
          role: 'user',
          content: message,
          chatId: currentChat.id,
        }
      });

      // --- 4. Indexação Fire-and-Forget ---
      (async () => {
        try {
          const embedding = await aiService.embed(message);
          if (embedding) {
            await prisma.$executeRaw`UPDATE messages SET vector = ${embedding.vector}::vector WHERE id = ${userMessageRecord.id}`;
          }
        } catch (e) { console.error("Falha embed user:", e); }
      })();

      // --- 5. Montar Payload ---
      const payloadForIA = [];
      if (isManualMode && context) {
        payloadForIA.push({ role: 'system', content: context });
      }
      
      payloadForIA.push(
        ...historyMessages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user', content: message }
      );

      // --- 6. Chamada AI Service (MODULAR) ---
      // AQUI ESTÁ A GRANDE MUDANÇA PARA A NOVA ARQUITETURA
      const stream = aiService.stream(payloadForIA, {
        providerSlug: lockedProvider,
        modelId: targetModelId,
        userId: req.userId
      });

      let watchdogTimer: NodeJS.Timeout | undefined;
      const resetWatchdog = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          writeSSE({ type: 'error', error: 'Timeout: API parou de responder.' });
          res.end();
        }, 60000);
      };

      try {
        resetWatchdog();
        let fullAssistantResponse = "";
        let finalMetrics: TelemetryMetrics | null = null;
        let chunkCount = 0;

        for await (const chunk of stream) {
          resetWatchdog();
          if (chunk.type === 'chunk') {
            chunkCount++;
            fullAssistantResponse += chunk.content;
          } else if (chunk.type === 'telemetry') {
            finalMetrics = chunk.metrics;
          }
          writeSSE(chunk);
        }
        
        if (watchdogTimer) clearTimeout(watchdogTimer);

        // --- 7. Pós-Processamento (Salvar Resposta) ---
        if (fullAssistantResponse) {
           // Fallback de métricas se o provider não mandou
           const safeMetrics = finalMetrics || {
             provider: lockedProvider,
             model: targetModelId,
             tokensIn: 0, tokensOut: 0, costInUSD: 0
           };

           const assistantMessage = await prisma.message.create({
             data: {
               role: 'assistant',
               content: fullAssistantResponse,
               chatId: currentChat.id,
               provider: safeMetrics.provider,
               model: safeMetrics.model,
               tokensIn: safeMetrics.tokensIn,
               tokensOut: safeMetrics.tokensOut,
               costInUSD: safeMetrics.costInUSD,
               sentContext: isManualMode ? 'manual' : 'auto'
             }
           });

           // Embed da resposta (Async)
           (async () => {
             try {
                const embed = await aiService.embed(fullAssistantResponse);
                if (embed) {
                  await prisma.$executeRaw`UPDATE messages SET vector = ${embed.vector}::vector WHERE id = ${assistantMessage.id}`;
                }
             } catch (e) { console.error(e); }
           })();
        }

        res.end();

        // Geração de Título (Simplificado para o exemplo)
        if (isNewChat) {
           // Lógica de título fire-and-forget aqui...
        }

      } catch (error: any) {
        writeSSE({ type: 'error', error: translateProviderError(error) });
      } finally {
        clearTimeout(timeoutCleanup);
        cleanup();
      }

    } catch (error) {
      if (!res.headersSent) return next(error);
      res.end();
    }
  },
};

function translateProviderError(error: any): string {
  const msg = error.message || String(error);
  if (msg.includes("413") || msg.includes("too large")) return "Erro: Mensagem muito longa para o modelo.";
  return msg;
}