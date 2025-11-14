import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { ProviderName, TelemetryMetrics, StreamChunk, AiServiceResponse } from '../services/ai/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { get_encoding } from 'tiktoken';
import { getProviderInfo } from '../config/providerMap';
import { getProviderConfig } from '../services/ai/utils/providerUtils';

// Instanciar encoding tiktoken (escopo global)
const encoding = get_encoding('cl100k_base');


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

// --- MOTOR 2 (V12 - Eficiente/DINÂMICO) ---
async function getEfficientHistory(
  chatId: string, 
  userMessage: string, 
  providerModel: string // ex: 'llama-3.1-8b-instant'
) {
  
  // 1. Pegar a "Mochila" (O Limite Dinâmico)
  const providerInfo = getProviderInfo(providerModel);

  // 2. Definir o "Orçamento" (Deixando espaço para a resposta)
  const ANSWER_BUFFER = 2000; // Reserva 2k tokens para a IA responder
  const MAX_CONTEXT_TOKENS = providerInfo.contextLimit - ANSWER_BUFFER;

  // 3. Orçamento Inicial (Prioriza a mensagem do usuário)
  const messageTokens = encoding.encode(userMessage).length;
  let budget = MAX_CONTEXT_TOKENS - messageTokens;

  // 4. Buscar *todo* o histórico (do mais novo para o mais velho)
  const allMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
  });

  const contextHistory = [];
  for (const msg of allMessages) {
    const tokens = encoding.encode(msg.content).length;

    if (budget - tokens >= 0) {
      // O "Fiscal" diz: "Cabe na mochila!"
      budget -= tokens;
      contextHistory.push(msg);
    } else {
      // A "Mochila" está cheia. Pare de adicionar.
      break;
    }
  }

  // Reverter ordem para asc (mais velho → mais novo)
  return contextHistory.reverse();
}

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message, provider: requestProvider, chatId, contextStrategy } = req.body;

      // Validar provider se fornecido
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral', 'claude'];
      
      if (requestProvider && !validProviders.includes(requestProvider)) {
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
            // Usa título padrão do schema - será substituído depois
            provider: providerToLock
          }
        });
        
        lockedProvider = providerToLock;
        isNewChat = true;
        writeSSE({ type: 'debug', log: `✅ Chat criado: ${currentChat.id} (provider: ${lockedProvider})` });
      }

      // --- 2. Salvar a Mensagem do Usuário ---
      writeSSE({ type: 'debug', log: '💾 Salvando mensagem do usuário no banco...' });
      await prisma.message.create({
        data: {
          role: 'user',
          content: message,
          chatId: currentChat.id,
        }
      });
      writeSSE({ type: 'debug', log: '✅ Mensagem do usuário salva!' });

      // --- 3. Preparar o Histórico para a IA ---
      writeSSE({ type: 'debug', log: '📚 Buscando histórico de mensagens...' });
      
      writeSSE({ type: 'debug', log: `⚙️ Estratégia de Contexto: ${contextStrategy || 'fast'}` });

      // --- O "DISTRIBUIDOR" V12 ---
      
      // Precisamos do NOME DO MODELO, não só do 'lockedProvider'
      const providerConfig = getProviderConfig(lockedProvider);
      const providerModel = providerConfig.defaultModel;

      writeSSE({ type: 'debug', log: `🤖 Provider: ${lockedProvider}, Modelo: ${providerModel}` });

      let historyMessages;

      if (contextStrategy === 'efficient') {
        const providerInfo = getProviderInfo(providerModel);
        writeSSE({ 
          type: 'debug', 
          log: `🧠 Motor Eficiente (V12): Limite ${providerInfo.contextLimit} tokens, Buffer 2000` 
        });
        
        historyMessages = await getEfficientHistory(
          currentChat.id, 
          message, 
          providerModel // <-- A "Mochila" Dinâmica
        );
      } else {
        writeSSE({ type: 'debug', log: '⚡ Motor Rápido (V7 - take: 10)...' });
        historyMessages = await getFastHistory(currentChat.id);
      }
      // --- FIM DO DISTRIBUIDOR ---

      const formattedMessages = historyMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      writeSSE({ type: 'debug', log: `📖 Histórico carregado: ${formattedMessages.length} mensagens` });

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
        const stream = aiService.stream(formattedMessages, lockedProvider);
        resetWatchdog();
        writeSSE({ type: 'debug', log: '⏰ Watchdog ativado (60s)' });

        let fullAssistantResponse = "";
        let finalMetrics: TelemetryMetrics | null = null;
        let chunkCount = 0;

        // "Sugue" o gotejamento do aiService
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

        // --- O STREAM TERMINOU ---
        if (finalMetrics) {
          writeSSE({ type: 'debug', log: '💾 Salvando resposta completa no banco...' });
          
          await prisma.message.create({
            data: {
              role: 'assistant',
              content: fullAssistantResponse,
              chatId: currentChat.id,
              provider: finalMetrics.provider,
              model: finalMetrics.model,
              tokensIn: finalMetrics.tokensIn,
              tokensOut: finalMetrics.tokensOut,
              costInUSD: finalMetrics.costInUSD,
            }
          });
          writeSSE({ type: 'debug', log: '✅ Resposta salva!' });

          // Calcular métricas de engenharia
          const outputWords = countWords(fullAssistantResponse);
          const outputBytes = Buffer.byteLength(fullAssistantResponse, 'utf8');
          const inputWords = countWords(message);
          const inputBytes = Buffer.byteLength(message, 'utf8');

          writeSSE({ type: 'debug', log: '📈 Salvando analytics...' });
          prisma.apiCallLog.create({
            data: {
              userId: req.userId!,
              provider: finalMetrics.provider,
              model: finalMetrics.model,
              tokensIn: finalMetrics.tokensIn,
              tokensOut: finalMetrics.tokensOut,
              costInUSD: finalMetrics.costInUSD,
              wordsIn: inputWords,
              wordsOut: outputWords,
              bytesIn: inputBytes,
              bytesOut: outputBytes,
            }
          }).catch(logErr => {
            console.error("Falha ao salvar log de analytics:", logErr);
            writeSSE({ type: 'debug', log: '⚠️ Erro ao salvar analytics (não-crítico)' });
          });

          logger.info(`Stream completo para user ${req.userId} usando ${lockedProvider}`);
          writeSSE({ type: 'debug', log: '✅ Analytics salvo!' });

        } else {
          writeSSE({ type: 'debug', log: '⚠️ Stream sem telemetria!' });
        }

        // --- Geração de Título (Fire-and-Forget com TIMEOUT) ---
        if (isNewChat && currentChat.title === "Nova Conversa") {
          writeSSE({ type: 'debug', log: '🏷️ Iniciando geração de título (fire-and-forget)...' });
          
          (async () => {
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
          })();
        }

      } catch (error: any) {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        writeSSE({ type: 'debug', log: `💥 ERRO FATAL: ${error.message}` });
        console.error("Erro fatal no stream:", error);
        writeSSE({ type: 'error', error: error.message || 'Erro no servidor' });
      } finally {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        writeSSE({ type: 'debug', log: '🏁 Encerrando conexão SSE' });
        res.end();
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