// backend/src/controllers/chatController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { TelemetryMetrics, StreamChunk } from '../services/ai/types';
import { prisma } from '../lib/prisma';
import { contextService } from '../services/chat/contextService';
import { getProviderInfo } from '../config/providerMap';
import { prepareForEmbedding } from '../services/embeddingUtils';
import { logger } from '../utils/logger';

import crypto from 'crypto';

// Controle de Concorrência (Evita spam de requisições iguais)
const processingRequests = new Set<string>();

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    logger.info(`[chatController.sendMessage] 🚀 Iniciando processamento para userId: ${req.userId}`);
    
    try {
      if (!req.userId) {
        logger.warn('[chatController.sendMessage] ❌ userId não encontrado');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      logger.info('[chatController.sendMessage] ✅ Autenticação OK, processando mensagem...');

      const {
        prompt, message: legacyMsg, provider, chatId,
        model, context, selectedMessageIds, strategy, temperature, memoryWindow, topK, topP, maxTokens,
        contextConfig // Nova configuração do pipeline de contexto
      } = req.body;

      const messageContent = prompt || legacyMsg;

      if (!messageContent || typeof messageContent !== 'string' || !messageContent.trim()) {
        res.status(400).json({ error: 'Message required' });
        return;
      }

      // 1. Prevenção de Duplicidade
      const requestId = `${req.userId}-${chatId || 'new'}-${crypto.createHash('sha256').update(messageContent).digest('hex').substring(0, 8)}`;

      if (processingRequests.has(requestId)) {
        res.status(429).json({ error: 'Duplicate request blocked' });
        return;
      }

      processingRequests.add(requestId);
      const cleanup = () => processingRequests.delete(requestId);
      // Timeout de segurança para limpar a flag de processamento
      setTimeout(cleanup, 60000);

      // 2. Setup SSE (Streaming)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const writeSSE = (data: StreamChunk) => res.write(`data: ${JSON.stringify(data)}\n\n`);

      // 3. Gestão do Chat (Criar ou Recuperar)
      let currentChat;
      let lockedProvider = provider || 'groq';
      let isNewChat = false;

      if (chatId) {
        currentChat = await prisma.chat.findUnique({ where: { id: chatId, userId: req.userId } });
        if (!currentChat) {
          writeSSE({ type: 'error', error: 'Chat not found' });
          res.end();
          cleanup();
          return;
        }
        lockedProvider = currentChat.provider;
      } else {
        currentChat = await prisma.chat.create({
          data: { userId: req.userId, provider: lockedProvider }
        });
        isNewChat = true;
      }

      // 4. Construção do Contexto (Histórico)
      const targetModel = model || 'default-model';
      const isManualMode = context !== undefined || (selectedMessageIds && selectedMessageIds.length > 0);
      interface HistoryMessage {
        id: string;
        role: string;
        content: string;
        isPinned?: boolean;
      }
      let historyMessages: HistoryMessage[] = [];

      let messageOrigins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent'> = {};
      
      if (isManualMode) {
        if (selectedMessageIds?.length > 0) {
          historyMessages = await prisma.message.findMany({
            where: { id: { in: selectedMessageIds }, chatId: currentChat.id },
            orderBy: { createdAt: 'asc' }
          });
          // Modo manual: todas são 'manual' (não rastreamos origem)
        }
      } else {
        // Modo RAG Híbrido Automático com configuração do usuário
        const report = await contextService.getHybridRagHistory(
          currentChat.id, 
          messageContent, 
          writeSSE,
          contextConfig // Passa a configuração para o serviço
        );
        historyMessages = report.finalContext;
        messageOrigins = report.messageOrigins; // Captura origens
      }

      // 5. Salvar Mensagem do Usuário (Antes de gerar resposta)
      const userMsgRecord = await prisma.message.create({
        data: { role: 'user', content: messageContent, chatId: currentChat.id }
      });

      // 5.1. Enviar ID real da mensagem do user para o frontend
      writeSSE({ 
        type: 'user_message_saved', 
        userMessageId: userMsgRecord.id 
      });

      // 6. Montar Payload FINAL para a IA
      const payloadForIA: Array<{ role: string; content: string }> = [];
      const pinnedStepIndices: number[] = []; // Índices dos steps que são pinados

      // System Prompt - usa configuração do usuário se disponível
      const systemPrompt = isManualMode && context 
        ? context 
        : (contextConfig?.systemPrompt || "Você é uma IA útil e direta.");
      payloadForIA.push({ role: 'system', content: systemPrompt });

      // Mapa de stepIndex → origin para auditoria
      const stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'> = {};

      // Adiciona o histórico recuperado (coleta índices dos pinados e origens)
      historyMessages.forEach(msg => {
        const currentIndex = payloadForIA.length; // Índice ANTES de adicionar
        payloadForIA.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
        if (msg.isPinned) {
          pinnedStepIndices.push(currentIndex);
        }
        // Mapeia origem do step
        if (messageOrigins[msg.id]) {
          stepOrigins[currentIndex] = messageOrigins[msg.id];
        } else if (isManualMode) {
          stepOrigins[currentIndex] = 'manual';
        }
      });

      // Adiciona a pergunta atual
      payloadForIA.push({ role: 'user', content: messageContent });

      // 6.5. VALIDAÇÃO DE TOKENS ANTES DE ENVIAR
      const totalTokens = contextService.countTokens(payloadForIA as any);
      
      // Limites conhecidos por provider/modelo (Groq free tier)
      const GROQ_FREE_LIMITS: Record<string, number> = {
        'llama-3.1-8b-instant': 6000,
        'llama-3.3-70b-versatile': 12000,
        'default': 6000
      };
      
      const estimatedLimit = GROQ_FREE_LIMITS[targetModel] || GROQ_FREE_LIMITS['default'];
      
      if (lockedProvider === 'groq' && totalTokens > estimatedLimit * 0.9) {
        writeSSE({ 
          type: 'debug', 
          log: `⚠️ AVISO: Contexto com ${totalTokens} tokens (limite estimado: ${estimatedLimit}). Pode falhar!` 
        });
      }

      // 6.6. Preparar objeto de auditoria LEAN (Standards §7 - Anti-Duplicação)
      // Salva apenas IDs e metadados, não conteúdo duplicado
      // 🎯 MODO AUTO/MANUAL: Detectar se parâmetros foram enviados
      const isAutoMode = temperature === undefined && topP === undefined && topK === undefined && maxTokens === undefined;
      
      const auditObject = {
        config_V47: {
          mode: isManualMode ? 'manual' : 'auto',
          model: targetModel,
          provider: lockedProvider,
          timestamp: new Date().toISOString(),
          strategy: strategy || 'efficient',
          params: {
            mode: isAutoMode ? 'auto' : 'manual', // ✅ Indicar modo usado
            temperature: temperature ?? 'auto',
            topP: topP ?? 'auto',
            topK: topK ?? 'auto',
            maxTokens: maxTokens ?? 'auto',
            memoryWindow
          }
        },
        // LEAN: Salva systemPrompt (único!) e IDs em vez de conteúdo
        systemPrompt: systemPrompt,
        messageIds: historyMessages.map(m => m.id),
        userMessageId: userMsgRecord.id,
        pinnedStepIndices,
        stepOrigins,
        preflightTokenCount: totalTokens
      };

      // 7. Streaming da Resposta
      const stream = aiService.stream(payloadForIA, {
        providerSlug: lockedProvider,
        modelId: targetModel,
        userId: req.userId,
        // 🎯 MODO AUTO/MANUAL: Só envia parâmetros se modo manual
        ...(isAutoMode ? {} : {
          temperature: temperature,
          topP: topP,
          topK: topK,
          maxTokens: maxTokens
        })
      });

      // Watchdog: Derruba a conexão se a IA travar por 60s [PODE SER MENOR QUE 60s]
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
        let streamError: string | null = null;

        for await (const chunk of stream) {
          resetWatchdog();
          if (chunk.type === 'chunk') {
            fullAssistantResponse += chunk.content;
          } else if (chunk.type === 'telemetry') {
            finalMetrics = chunk.metrics;
          } else if (chunk.type === 'error') {
            // 🔥 Erro vindo do aiService como chunk - captura para tratar depois
            streamError = chunk.error;
          }
          writeSSE(chunk);
        }

        if (watchdogTimer) clearTimeout(watchdogTimer);

        // 🔥 Se houve erro durante o stream, salva audit e encerra
        if (streamError) {
          const errorContent = `[ERRO] ${streamError}`;
          const errorAuditObject = {
            ...auditObject,
            error: {
              message: streamError,
              type: 'stream_error',
            }
          };
          
          const savedErrorMsg = await prisma.message.create({
            data: {
              role: 'assistant',
              content: errorContent,
              chatId: currentChat.id,
              provider: lockedProvider,
              model: targetModel,
              tokensIn: auditObject.preflightTokenCount || 0,
              tokensOut: 0,
              costInUSD: 0,
              sentContext: JSON.stringify(errorAuditObject)
            }
          });
          
          // Envia ID para frontend poder abrir Prompt Trace
          writeSSE({ 
            type: 'telemetry', 
            metrics: {
              messageId: savedErrorMsg.id,
              chatId: currentChat.id,
              provider: lockedProvider,
              model: targetModel,
              tokensIn: auditObject.preflightTokenCount || 0,
              tokensOut: 0,
              costInUSD: 0
            }
          });
          
          writeSSE({ type: 'debug', log: `❌ Erro salvo com ID: ${savedErrorMsg.id}` });
          res.end();
          cleanup();
          return;
        }

        // 8. SALVAMENTO E PÓS-PROCESSAMENTO
        if (fullAssistantResponse) {

          // Fallback de Métricas (Se a API não mandar o preço)
          if (!finalMetrics || finalMetrics.tokensIn === 0) {
            const tokensIn = contextService.countTokens(payloadForIA as any);
            const tokensOut = contextService.encode(fullAssistantResponse);

            // ✅ Cálculo de custo REAL usando providerMap (não estimativa)
            const providerInfo = getProviderInfo(targetModel);
            const realCostInUSD =
              (tokensIn / 1_000_000) * providerInfo.costIn +
              (tokensOut / 1_000_000) * providerInfo.costOut;

            // DADOS CONFIAVEIS 
            finalMetrics = {
              provider: lockedProvider,
              model: targetModel,
              tokensIn,
              tokensOut,
              costInUSD: realCostInUSD,
              chatId: currentChat.id
            };

            writeSSE({
              type: 'telemetry',
              metrics: finalMetrics
            });

          }

          // === AUDITORIA CONFIÁVEL (auditObject já foi preparado antes do stream) ===
          const sentContextString = JSON.stringify(auditObject);
          // =======================================

          // Salva no Banco
          const savedAssistantMsg = await prisma.message.create({
            data: {
              role: 'assistant',
              content: fullAssistantResponse,
              chatId: currentChat.id,
              provider: finalMetrics.provider,
              model: finalMetrics.model,
              tokensIn: finalMetrics.tokensIn,
              tokensOut: finalMetrics.tokensOut,
              costInUSD: finalMetrics.costInUSD,
              sentContext: sentContextString // Campo novo preenchido!
            }
          });

          // 📊 LOG ESTRUTURADO: Trace criado (para painel admin futuro)
          logger.info('TRACE_CREATED', {
            traceId: savedAssistantMsg.id,
            chatId: currentChat.id,
            userId: req.userId,
            provider: finalMetrics.provider,
            model: finalMetrics.model,
            tokensIn: finalMetrics.tokensIn,
            tokensOut: finalMetrics.tokensOut,
            totalTokens: (finalMetrics.tokensIn || 0) + (finalMetrics.tokensOut || 0),
            costInUSD: finalMetrics.costInUSD,
            contextSize: auditObject.messageIds?.length || 0,
            strategy: auditObject.config_V47?.strategy || 'unknown',
            timestamp: new Date().toISOString()
          });

          // 🔥 Envia ID REAL para o frontend (Fonte Única de Verdade)
          finalMetrics.messageId = savedAssistantMsg.id;
          writeSSE({ type: 'telemetry', metrics: finalMetrics });

          // Embeds (Gera vetores para o futuro) - Fire and forget com tratamento correto
          aiService.embed(prepareForEmbedding(fullAssistantResponse)).then(async (emb) => {
            if (emb) {
              const vectorStr = '[' + emb.vector.join(',') + ']';
              await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${savedAssistantMsg.id}`;
            }
          }).catch(e => {
            logger.error("Erro ao gerar embedding da resposta", {
              requestId: req.id,
              messageId: savedAssistantMsg.id,
              error: e instanceof Error ? e.message : String(e)
            });
          });

          aiService.embed(prepareForEmbedding(messageContent)).then(async (emb) => {
            if (emb) {
              const vectorStr = '[' + emb.vector.join(',') + ']';
              await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${userMsgRecord.id}`;
            }
          }).catch(e => {
            logger.error("Erro ao gerar embedding da mensagem do usuário", {
              requestId: req.id,
              messageId: userMsgRecord.id,
              error: e instanceof Error ? e.message : String(e)
            });
          });
        }

        res.end();

        // [NOVO] Geração de Título Automática (Corrigido TypeScript)
        if (isNewChat && fullAssistantResponse.length > 0) {
          (async () => {
            try {
              const titlePrompt = [
                { role: 'system', content: 'Você é uma IA especializada em resumir tópicos. Gere um título curto (máximo 5 palavras) e direto para esta conversa. Responda APENAS o título, sem aspas.' },
                { role: 'user', content: `User: ${messageContent}\nAI: ${fullAssistantResponse}` }
              ];

              // Use o ! no final de userId para garantir ao TS que não é nulo
              const titleStream = aiService.stream(titlePrompt, {
                providerSlug: 'groq',
                modelId: 'llama-3.1-8b-instant',
                userId: req.userId!
              });

              let generatedTitle = '';
              for await (const chunk of titleStream) {
                if (chunk.type === 'chunk') generatedTitle += chunk.content;
              }

              generatedTitle = generatedTitle.trim().replace(/^["']|["']$/g, '');

              if (generatedTitle) {
                await prisma.chat.update({
                  where: { id: currentChat.id },
                  data: { title: generatedTitle }
                });
              }
            } catch (err) {
              logger.error("Erro ao gerar título automático", {
                requestId: req.id,
                chatId: currentChat.id,
                error: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined
              });
            }
          })();
        }

      } catch (streamError: unknown) {
        const errorMessage = streamError instanceof Error ? streamError.message : "Erro na geração";
        const errorCode = streamError instanceof Error && 'code' in streamError ? (streamError as any).code : undefined;
        const errorStatus = streamError instanceof Error && 'status' in streamError ? (streamError as any).status : undefined;
        
        logger.error("Erro no stream", {
          requestId: req.id,
          chatId: currentChat.id,
          userId: req.userId,
          provider: lockedProvider,
          model: targetModel,
          error: errorMessage,
          errorCode,
          errorStatus,
          stack: streamError instanceof Error ? streamError.stack : undefined
        });
        
        // 🔥 NOVO: Salva mensagem de erro com audit trace para debug
        const errorContent = `[ERRO] ${errorMessage}`;
        const errorAuditObject = {
          ...auditObject,
          error: {
            message: errorMessage,
            code: errorCode,
            status: errorStatus,
          }
        };
        
        try {
          const savedErrorMsg = await prisma.message.create({
            data: {
              role: 'assistant',
              content: errorContent,
              chatId: currentChat.id,
              provider: lockedProvider,
              model: targetModel,
              tokensIn: auditObject.preflightTokenCount || 0,
              tokensOut: 0,
              costInUSD: 0,
              sentContext: JSON.stringify(errorAuditObject)
            }
          });
          
          // Envia ID para frontend poder abrir Prompt Trace
          writeSSE({ 
            type: 'telemetry', 
            metrics: {
              messageId: savedErrorMsg.id,
              chatId: currentChat.id,
              provider: lockedProvider,
              model: targetModel,
              tokensIn: auditObject.preflightTokenCount || 0,
              tokensOut: 0,
              costInUSD: 0
            }
          });
          
          // Envia o erro separadamente
          writeSSE({ type: 'debug', log: `❌ Erro salvo com ID: ${savedErrorMsg.id}` });
        } catch (saveErr) {
          logger.error("Erro ao salvar audit de erro", {
            requestId: req.id,
            chatId: currentChat.id,
            error: saveErr instanceof Error ? saveErr.message : String(saveErr),
            stack: saveErr instanceof Error ? saveErr.stack : undefined
          });
        }
        
        writeSSE({ type: 'error', error: errorMessage });
        res.end();
      } finally {
        cleanup();
      }

    } catch (error) {
      if (!res.headersSent) next(error);
    }
  }
};