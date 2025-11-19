import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { ragService } from '../services/ragService';
import { ProviderName, TelemetryMetrics, StreamChunk, AiServiceResponse } from '../services/ai/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { get_encoding } from 'tiktoken';
import { getProviderInfo } from '../config/providerMap';
import { getProviderConfig } from '../services/ai/utils/providerUtils';

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
  sentContext?: any; // <-- Corrige TS2339 (opcional)
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
    orderBy: { createdAt: 'desc' }, // Descendente para pegar os mais novos
    take: 10, // O "Número Mágico"
  });
  // Reverter ordem para asc (mais velho → mais novo)
  return messages.reverse();
}

// --- O "MOTOR" V9.4 (Híbrido RAG) ---
// [V22] Agora retorna o relatório estruturado
async function getHybridRagHistory(
  chatId: string, 
  userMessage: string, 
  providerModel: string,
  writeSSE: (data: StreamChunk) => void
): Promise<HybridHistoryReport> {

  // 1. Buscar Relevância (V9.4 - O "Buscador")
  writeSSE({ type: 'debug', log: `🧠 V9.4: Buscando memória RAG (relevância semântica)...` });
  const relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, 5);

  // 2. Buscar Recência (V7 - A "Memória Curta")
  writeSSE({ type: 'debug', log: `🧠 V7: Buscando memória recente (últimas 10 msgs)...` });
  const recentMessages = await getFastHistory(chatId);

  // 3. Combinar e De-duplicar
  const combinedMap = new Map<string, any>();
  
  // Recência vem primeiro
  recentMessages.forEach(msg => combinedMap.set(msg.id, msg));
  
  // Relevância sobrescreve (prioridade)
  relevantMessages.forEach(msg => combinedMap.set(msg.id, msg));

  const combinedHistory = Array.from(combinedMap.values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  writeSSE({ 
    type: 'debug', 
    log: `🧠 V9.4: Relevância (${relevantMessages.length}) + Recência (${recentMessages.length}) = ${combinedHistory.length} msgs (únicas)` 
  });

  // 4. O "Fiscal" V12 (Orçamento da Mochila)
  const providerInfo = getProviderInfo(providerModel);
  const ANSWER_BUFFER = 2000;
  const MAX_CONTEXT_TOKENS = providerInfo.contextLimit - ANSWER_BUFFER;

  const messageTokens = encoding.encode(userMessage).length;
  let budget = MAX_CONTEXT_TOKENS - messageTokens;

  const finalContextHistory = [];
  
  // Itera do *mais novo* para o *mais velho*
  for (const msg of [...combinedHistory].reverse()) { 
    const tokens = encoding.encode(msg.content).length;
    if (budget - tokens >= 0) {
      budget -= tokens;
      finalContextHistory.push(msg);
    } else {
      break; // Mochila cheia
    }
  }

  writeSSE({ 
    type: 'debug', 
    log: `🧠 V9.4: Contexto final após orçamento: ${finalContextHistory.length} msgs` 
  });

  // [V22] Retorna o relatório completo
  // [A CURA V27] Limpa sentContext das listas do relatório
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

// [V33] PROTEÇÃO ANTI-DISPARO MÚLTIPLO (Idempotência CORRIGIDA)
const processingRequests = new Set<string>();

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Aceitar tanto 'message' (antigo) quanto 'prompt' (novo) para compatibilidade
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

      // Usar prompt (novo) ou message (legado)
      const message = prompt || legacyMessage;

      // Validar que message existe
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ 
          error: 'Message/prompt is required and must be a non-empty string' 
        });
      }

      // [V33] CRIAR ID ÚNICO DETERMINÍSTICO (sem timestamp!)
      // Usa APENAS userId + chatId + hash da mensagem (ignora timestamp)
      const crypto = require('crypto');
      const messageHash = crypto.createHash('sha256').update(message).digest('hex').substring(0, 16);
      const requestId = `${req.userId}-${chatId || 'novo'}-${messageHash}`;

      // [V33] VERIFICAR SE REQUISIÇÃO JÁ ESTÁ SENDO PROCESSADA
      if (processingRequests.has(requestId)) {
        logger.warn(`[V33] ⛔ Requisição duplicada bloqueada: ${requestId}`);
        return res.status(429).json({ 
          error: 'Requisição duplicada detectada. Aguarde o processamento anterior.' 
        });
      }

      // [V33] MARCAR REQUISIÇÃO COMO "EM PROCESSAMENTO"
      processingRequests.add(requestId);

      // [V33] GARANTIR LIMPEZA (mesmo em caso de erro)
      const cleanup = () => {
        processingRequests.delete(requestId);
      };

      // [V33] TIMEOUT AUTOMÁTICO (limpar após 60s mesmo se travar)
      const timeoutCleanup = setTimeout(() => {
        if (processingRequests.has(requestId)) {
          cleanup();
        }
      }, 60000);

      // Validar provider se fornecido
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral', 'claude'];
      
      if (requestProvider && !validProviders.includes(requestProvider)) {
        clearTimeout(timeoutCleanup);
        cleanup();
        return res.status(400).json({ 
          error: `Invalid provider. Valid options: ${validProviders.join(', ')}` 
        });
      }

      // --- Configurar Headers SSE ---
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Envia headers imediatamente

      // Helper: Escrever evento SSE
      const writeSSE = (data: StreamChunk) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      writeSSE({ type: 'debug', log: '🔍 Iniciando processamento da mensagem...' });

      // --- 1. Encontrar ou Criar a Conversa (Chat) ---
      writeSSE({ type: 'debug', log: '📋 Validando usuário...' });
      
      // --- Validar usuário ---
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      writeSSE({ type: 'debug', log: `💬 Chat ID: ${chatId || 'novo'}` });
      
      let currentChat;
      let lockedProvider: ProviderName;
      let isNewChat = false;

      if (chatId) {
        writeSSE({ type: 'debug', log: '🔍 Buscando chat existente...' });
        currentChat = await prisma.chat.findUnique({ 
          where: { id: chatId, userId: req.userId }
        });
        
        if (!currentChat) {
          writeSSE({ type: 'debug', log: '❌ Chat não encontrado!' });
          writeSSE({ type: 'error', error: 'Conversa não encontrada' });
          res.end();
          return;
        }
        
        lockedProvider = currentChat.provider as ProviderName;
        writeSSE({ type: 'debug', log: `🔒 Provider travado: ${lockedProvider}` });
      } else {
        writeSSE({ type: 'debug', log: '✨ Criando novo chat...' });
        const providerToLock: ProviderName = requestProvider || 'groq';
        
        currentChat = await prisma.chat.create({
          data: {
            userId: req.userId,
            provider: providerToLock
          }
        });
        
        lockedProvider = providerToLock;
        isNewChat = true;
        writeSSE({ type: 'debug', log: `✅ Chat criado: ${currentChat.id} (provider: ${lockedProvider})` });
      }

      // [V43] BUSCAR HISTÓRICO **ANTES** DE SALVAR A NOVA MENSAGEM
      writeSSE({ type: 'debug', log: '📚 Buscando histórico de mensagens...' });
      
      // [V47] MODO MANUAL: Se context ou selectedMessageIds forem fornecidos
      const isManualMode = context !== undefined || (selectedMessageIds && selectedMessageIds.length > 0);
      
      if (isManualMode) {
        writeSSE({ type: 'debug', log: '✋ Modo MANUAL ativado (contexto customizado)' });
      } else {
        writeSSE({ type: 'debug', log: `⚙️ Estratégia de Contexto: ${strategy || contextStrategy || 'fast'}` });
      }

      const providerConfig = getProviderConfig(lockedProvider);
      const providerModel = model || providerConfig.defaultModel;
      writeSSE({ type: 'debug', log: `🤖 Provider: ${lockedProvider}, Modelo: ${providerModel}` });

      let historyReport: HybridHistoryReport | null = null;
      let historyMessages: Message[] = [];

      if (isManualMode) {
        // [V47] MODO MANUAL: Buscar apenas as mensagens selecionadas
        if (selectedMessageIds && selectedMessageIds.length > 0) {
          writeSSE({ type: 'debug', log: `🎯 Buscando ${selectedMessageIds.length} mensagens selecionadas...` });
          historyMessages = await prisma.message.findMany({
            where: {
              id: { in: selectedMessageIds },
              chatId: currentChat.id
            },
            orderBy: { createdAt: 'asc' }
          });
          writeSSE({ type: 'debug', log: `✅ ${historyMessages.length} mensagens encontradas` });
        }
        
        // Se há contexto adicional, logar
        if (context) {
          const contextWords = countWords(context);
          writeSSE({ type: 'debug', log: `📝 Contexto adicional: ${contextWords} palavras` });
        }
      } else if ((strategy || contextStrategy) === 'efficient') {
        const providerInfo = getProviderInfo(providerModel);
        writeSSE({ type: 'debug', log: `🧠 Motor Híbrido RAG (V9.4): Limite ${providerInfo.contextLimit} tokens, Buffer 2000` });
        historyReport = await getHybridRagHistory(
          currentChat.id,
          message,
          providerModel,
          writeSSE
        );
        historyMessages = historyReport.finalContext;
      } else {
        writeSSE({ type: 'debug', log: '⚡ Motor Rápido (V7 - take: 10)...' });
        historyMessages = await getFastHistory(currentChat.id);
      }

      writeSSE({ type: 'debug', log: `📖 Histórico carregado: ${historyMessages.length} mensagens` });

      // [V43] AGORA SIM: Salvar a Mensagem do Usuário (DEPOIS de buscar histórico)
      writeSSE({ type: 'debug', log: '💾 Salvando mensagem do usuário no banco...' });
      const userMessageRecord = await prisma.message.create({
        data: {
          role: 'user',
          content: message,
          chatId: currentChat.id,
        }
      });
      writeSSE({ type: 'debug', log: '✅ Mensagem do usuário salva!' });

      // --- A "INDEXAÇÃO" V9.3 (Usuário - Fire-and-Forget) ---
      (async () => {
        try {
          writeSSE({ type: 'debug', log: '🔍 Indexando mensagem do usuário (fire-and-forget)...' });
          const embedding = await aiService.embed(message);
          
          if (embedding) {
            await prisma.$executeRaw`
              UPDATE messages 
              SET vector = ${embedding.vector}::vector 
              WHERE id = ${userMessageRecord.id}
            `;

            prisma.apiCallLog.create({
              data: {
                userId: req.userId!,
                provider: 'azure_embedding',
                model: embedding.model,
                tokensIn: embedding.tokens,
                tokensOut: 0,
                costInUSD: embedding.cost,
                wordsIn: countWords(message),
                wordsOut: 0,
                bytesIn: Buffer.byteLength(message, 'utf8'),
                bytesOut: 0,
              }
            }).catch(logErr => console.error("⚠️ Falha no log V9.3 (User):", logErr));

            writeSSE({ type: 'debug', log: `✅ Mensagem indexada! Custo: $${embedding.cost.toFixed(8)}` });
          }
        } catch (embedErr: any) {
          console.error("❌ Erro no 'fire-and-forget' V9.3 (User):", embedErr.message);
          writeSSE({ type: 'debug', log: '⚠️ Falha ao indexar mensagem do usuário (não-crítico)' });
        }
      })();

      // [V43] MONTAR PAYLOAD: Histórico (ANTES de salvar) + Nova Mensagem
      // [V47] Se modo manual com contexto adicional, injeta como mensagem do sistema
      const payloadForIA = [];
      
      if (isManualMode && context) {
        // Adiciona contexto adicional como mensagem do sistema
        payloadForIA.push({
          role: 'system' as const,
          content: context
        });
        writeSSE({ type: 'debug', log: '📝 Contexto adicional injetado como system message' });
      }
      
      payloadForIA.push(
        ...historyMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content: message }
      );

      writeSSE({ type: 'debug', log: `🔧 Payload montado: ${payloadForIA.length} mensagens (${historyMessages.length} histórico + 1 nova${isManualMode && context ? ' + contexto' : ''})` });

      if (payloadForIA.length === 0) {
        writeSSE({ type: 'error', error: 'Erro crítico: Payload vazio!' });
        res.end();
        return;
      }

      const reportV22 = historyReport ? historyReport : historyMessages;
      const contextToSave = {
        debugReport_V22: reportV22,
        payloadSent_V23: payloadForIA,
        // [V47] Metadados de configuração usados
        config_V47: isManualMode ? {
          mode: 'manual',
          selectedMessages: selectedMessageIds?.length || 0,
          hasAdditionalContext: !!context
        } : {
          mode: 'automatic',
          strategy: strategy || contextStrategy || 'fast',
          temperature: temperature,
          topK: topK,
          memoryWindow: memoryWindow
        }
      };

      // 3. A "Chamada de Stream"
      // TODO [V47]: Passar temperature, topK para aiService quando suportado
      // Ex: aiService.stream(payloadForIA, lockedProvider, { temperature, topK })
      const stream = aiService.stream(payloadForIA, lockedProvider);

      // --- O NOVO MOTOR (Streaming com WATCHDOG) ---
      let watchdogTimer: NodeJS.Timeout | undefined;
      const WATCHDOG_TIMEOUT_MS = 60000;
      const resetWatchdog = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          console.error("⚠️ WATCHDOG: Stream travado (60s sem chunks). Encerrando.");
          writeSSE({ type: 'debug', log: '⏰ TIMEOUT: 60s sem resposta da IA' });
          writeSSE({ type: 'error', error: 'Stream timeout: A API parou de responder.' });
          res.end();
        }, WATCHDOG_TIMEOUT_MS);
      };

      try {
        writeSSE({ type: 'debug', log: `🤖 Iniciando stream com ${lockedProvider}...` });
        // [V23] usar payloadForIA em vez de formattedMessages
        resetWatchdog();
        writeSSE({ type: 'debug', log: '⏰ Watchdog ativado (60s)' });

        let fullAssistantResponse = "";
        let finalMetrics: TelemetryMetrics | null = null;
        let chunkCount = 0;

        for await (const chunk of stream) {
          resetWatchdog();

          if (chunk.type === 'chunk') {
            chunkCount++;
            // Opcional: muito verboso
            // writeSSE({ type: 'debug', log: `📦 Chunk #${chunkCount}: ${chunk.content.length} caracteres` });
          } else if (chunk.type === 'telemetry') {
            writeSSE({ type: 'debug', log: `📊 Telemetria recebida: ${chunk.metrics.tokensOut} tokens, $${chunk.metrics.costInUSD.toFixed(6)}` });
          }

          writeSSE(chunk);

          // Acumula dados para salvar no DB
          if (chunk.type === 'chunk') {
            fullAssistantResponse += chunk.content;
          } else if (chunk.type === 'telemetry') {
            finalMetrics = chunk.metrics;
          } else if (chunk.type === 'error') {
            writeSSE({ type: 'debug', log: `❌ Erro da IA: ${chunk.error}` });
          }
        }

        if (watchdogTimer) clearTimeout(watchdogTimer);
        writeSSE({ type: 'debug', log: `✅ Stream finalizado! Total: ${chunkCount} chunks` });

        if (finalMetrics) {
          writeSSE({ type: 'debug', log: '💾 Salvando resposta completa no banco...' });

          // --- A "INDEXAÇÃO" V9.3 (Assistente - Blocking) ---
          let assistantEmbeddingCost = 0;
          let assistantEmbeddingTokens = 0;
          let assistantEmbeddingModel = 'n/a';
          let vectorToSave: number[] | null = null;

          try {
            writeSSE({ type: 'debug', log: '🔍 Indexando resposta da IA...' });
            const embedding = await aiService.embed(fullAssistantResponse);
            
            if (embedding) {
              vectorToSave = embedding.vector;
              assistantEmbeddingCost = embedding.cost;
              assistantEmbeddingTokens = embedding.tokens;
              assistantEmbeddingModel = embedding.model;
              writeSSE({ type: 'debug', log: `✅ Resposta indexada! Custo: $${embedding.cost.toFixed(8)}` });
            }
          } catch (embedErr: any) {
            console.error("❌ Erro V9.3 (Assistant):", embedErr.message);
            writeSSE({ type: 'debug', log: '⚠️ Falha ao indexar resposta (não-crítico)' });
          }
          // --- FIM DA INDEXAÇÃO V9.3 (Assistente) ---

          // Cria a mensagem do assistente
          const assistantMessage = await prisma.message.create({
            data: {
              role: 'assistant',
              content: fullAssistantResponse,
              chatId: currentChat.id,
              provider: finalMetrics.provider,
              model: finalMetrics.model,
              tokensIn: finalMetrics.tokensIn,
              tokensOut: finalMetrics.tokensOut,
              costInUSD: finalMetrics.costInUSD,
              sentContext: JSON.stringify(contextToSave)
            }
          });

          // [V37] ENVIAR CONTEXTO VIA TELEMETRIA FINAL
          writeSSE({
            type: 'telemetry',
            metrics: {
              ...finalMetrics,
              sentContext: JSON.stringify(contextToSave) // <-- ENVIAR AQUI
            }
          });

          // Salvar o vetor separadamente usando raw SQL (se existir)
          if (vectorToSave) {
            try {
              await prisma.$executeRaw`
                UPDATE messages 
                SET vector = ${vectorToSave}::vector 
                WHERE id = ${assistantMessage.id}
              `;
              writeSSE({ type: 'debug', log: '✅ Vetor salvo no pgvector!' });
            } catch (vectorErr: any) {
              console.error("❌ Erro ao salvar vetor:", vectorErr.message);
              writeSSE({ type: 'debug', log: '⚠️ Falha ao salvar vetor (não-crítico)' });
            }
          }

          // Calcular métricas de engenharia
          const outputWords = countWords(fullAssistantResponse);
          const outputBytes = Buffer.byteLength(fullAssistantResponse, 'utf8');
          const inputWords = countWords(message);
          const inputBytes = Buffer.byteLength(message, 'utf8');

          // Salvar Log de Analytics (Chat + Embedding)
          const totalCost = finalMetrics.costInUSD + assistantEmbeddingCost;
          
          writeSSE({ type: 'debug', log: '📈 Salvando analytics...' });
          prisma.apiCallLog.create({
            data: {
              userId: req.userId!,
              provider: finalMetrics.provider,
              model: finalMetrics.model,
              tokensIn: finalMetrics.tokensIn,
              tokensOut: finalMetrics.tokensOut,
              costInUSD: totalCost, // Custo total V12 + V9.3
              wordsIn: inputWords,
              wordsOut: outputWords,
              bytesIn: inputBytes,
              bytesOut: outputBytes,
            }
          }).catch(logErr => {
            console.error("Falha ao salvar log de analytics:", logErr);
            writeSSE({ type: 'debug', log: '⚠️ Erro ao salvar analytics (não-crítico)' });
          });

          // Log separado do custo de embedding (opcional)
          if (assistantEmbeddingCost > 0) {
            prisma.apiCallLog.create({
              data: {
                userId: req.userId!,
                provider: 'azure_embedding',
                model: assistantEmbeddingModel,
                tokensIn: assistantEmbeddingTokens,
                tokensOut: 0,
                costInUSD: assistantEmbeddingCost,
                wordsIn: outputWords,
                wordsOut: 0,
                bytesIn: outputBytes,
                bytesOut: 0,
              }
            }).catch(logErr => console.error("⚠️ Falha no log V9.3 (Assistant Embed):", logErr));
          }

          writeSSE({ type: 'debug', log: '✅ Analytics salvo!' });
          logger.info(`Stream completo para user ${req.userId} usando ${lockedProvider}`);

        } else {
          writeSSE({ type: 'debug', log: '⚠️ Stream sem telemetria!' });
        }

        // [V41] FECHAR STREAM EXPLICITAMENTE
        writeSSE({ type: 'debug', log: '🏁 Encerrando stream...' });
        res.end(); // <-- CRUCIAL: Fecha a conexão SSE
        console.log('[V41] Stream SSE encerrado explicitamente');

        // --- Geração de Título (Fire-and-Forget com TIMEOUT) ---
        if (isNewChat && currentChat.title === "Nova Conversa") {
          // [V41] MOVIDO PARA FORA DO RES.END (executar após fechar stream)
          (async () => {
            try {
              const groqModelName = 'llama-3.1-8b-instant';
              type CostMapKey = keyof typeof import('../config/costMap').COST_PER_1M_TOKENS;
              const { COST_PER_1M_TOKENS } = await import('../config/costMap');
              const groqCosts = COST_PER_1M_TOKENS[groqModelName as CostMapKey] || { input: 99, output: 99 };
              const isGroqFree = groqCosts.input === 0 && groqCosts.output === 0;

              let titleToSave: string;

              if (isGroqFree) {
                try {
                  const titlePrompt = `Gere um título curto e conciso (máximo 5 palavras) para esta conversa, baseado na primeira pergunta do usuário. Responda APENAS com o título, sem introdução. Pergunta: "${message}"`;
                  
                  // --- O "TIMEOUT" (A "CORRIDA") ---
                  const titleGeneration = aiService.chat(
                    [{ role: 'user', content: titlePrompt }],
                    'groq'
                  );

                  const timeout = createTimeout(5000, "Timeout: Geração de título demorou mais de 5s");

                  const titleResponse = await Promise.race([
                    titleGeneration,
                    timeout
                  ]) as AiServiceResponse;
                  // --- FIM DO TIMEOUT ---

                  titleToSave = titleResponse.response.replace(/"/g, '').trim();

                } catch (err: any) {
                  console.warn("Falha ao gerar título (Timeout ou Erro de API):", err.message);
                  titleToSave = `Conversa: ${message.substring(0, 20)}...`;
                }
              } else {
                console.warn("Geração de título desabilitada (Groq não é mais grátis).");
                titleToSave = `Conversa: ${message.substring(0, 20)}...`;
              }

              try {
                if (titleToSave && titleToSave.length > 0) {
                  await prisma.chat.update({
                    where: { id: currentChat.id },
                    data: { title: titleToSave }
                  });
                  logger.info(`Título gerado para chat ${currentChat.id}: "${titleToSave}"`);
                }
              } catch (dbErr) {
                console.error("Falha ao salvar título:", dbErr);
              }
            } catch (dbErr) {
              console.error("Falha ao salvar título:", dbErr);
            }
          })();
        }

      } catch (error) {
        // --- A "CURA" V25 ---
        const translatedError = translateProviderError(error);

        writeSSE({ 
          type: 'error', 
          error: translatedError
        });

        clearTimeout(timeoutCleanup); // [V33] Limpar timeout
        cleanup(); // [V33] Limpar em caso de erro
        next(error);
        // --- FIM DA CURA V25 ---
      } finally {
        // [V33] GARANTIR LIMPEZA EM QUALQUER CENÁRIO
        clearTimeout(timeoutCleanup);
        cleanup();
      }
    } catch (error) {
      // Se erro acontecer antes do streaming começar
      if (!res.headersSent) {
        return next(error);
      } else {
        console.error("Erro após headers SSE enviados:", error);
        res.end();
      }
    }
  },
};

/**
 * O "Tradutor de Erros" V25
 */
function translateProviderError(error: any): string {
  const msg = error.message || String(error);

  // (O "Bug V23" - O Erro 400 de array vazio)
  if (msg.includes("minimum number of items is 1")) {
    return "Erro V23: O 'payload' enviado à IA estava vazio (0 mensagens). (O 'Fiscal V12' cortou tudo E o 'Hotfix V23' falhou).";
  }

  // (O "Bug V24" - O Erro 413 de mensagem longa)
  if (msg.includes("413") || msg.includes("Request too large")) {  return msg;
    return "Erro V24: A 'carga' (Histórico + Nova Mensagem) estourou o limite de tokens do provider (Erro 413).";  }  // (O "Bug V12" - O Erro 400 do Groq (Limite Real))  if (msg.includes("400") && msg.includes("context_length_exceeded")) {    return "Erro V12: O 'contexto' (Histórico) estourou o limite real do provider (Groq 6k).";  }


  // (O "Bug V12" - O Erro 400 do Groq (Limite Real))
  if (msg.includes("400") && msg.includes("context_length_exceeded")) {
    return "Erro V12: O 'contexto' (Histórico) estourou o limite real do provider (Groq 6k).";
  }

  return msg;
}