// backend/src/controllers/chatController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { TelemetryMetrics, StreamChunk } from '../services/ai/types';
import { prisma } from '../lib/prisma';
import { contextService } from '../services/chat/contextService';
import { getProviderInfo } from '../config/providerMap';

// Controle de Concorrência (Evita spam de requisições iguais)
const processingRequests = new Set<string>();

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        prompt, message: legacyMsg, provider, chatId,
        model, context, selectedMessageIds, strategy, temperature, memoryWindow, topK
      } = req.body;

      const messageContent = prompt || legacyMsg;

      if (!messageContent || typeof messageContent !== 'string' || !messageContent.trim()) {
        res.status(400).json({ error: 'Message required' });
        return;
      }

      // 1. Prevenção de Duplicidade
      const crypto = require('crypto');
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
      let historyMessages: any[] = [];

      if (isManualMode) {
        if (selectedMessageIds?.length > 0) {
          historyMessages = await prisma.message.findMany({
            where: { id: { in: selectedMessageIds }, chatId: currentChat.id },
            orderBy: { createdAt: 'asc' }
          });
        }
      } else {
        // Modo RAG Híbrido Automático
        const report = await contextService.getHybridRagHistory(currentChat.id, messageContent, writeSSE);
        historyMessages = report.finalContext;
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

      if (isManualMode && context) {
        payloadForIA.push({ role: 'system', content: context });
      } else {
        payloadForIA.push({ role: 'system', content: "Você é uma IA útil e direta." });
      }

      // Adiciona o histórico recuperado (coleta índices dos pinados)
      historyMessages.forEach(msg => {
        const currentIndex = payloadForIA.length; // Índice ANTES de adicionar
        payloadForIA.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
        if (msg.isPinned) {
          pinnedStepIndices.push(currentIndex);
        }
      });

      // Adiciona a pergunta atual
      payloadForIA.push({ role: 'user', content: messageContent });

      // 7. Streaming da Resposta
      const stream = aiService.stream(payloadForIA, {
        providerSlug: lockedProvider,
        modelId: targetModel,
        userId: req.userId // O TypeScript já aceita aqui pois não é função async separada
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

        for await (const chunk of stream) {
          resetWatchdog();
          if (chunk.type === 'chunk') {
            fullAssistantResponse += chunk.content;
          } else if (chunk.type === 'telemetry') {
            finalMetrics = chunk.metrics;
          }
          writeSSE(chunk);
        }

        if (watchdogTimer) clearTimeout(watchdogTimer);

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

          // === AUDITORIA CONFIÁVEL ===
          // Prepara objeto de auditoria para salvar no banco
          const auditObject = {
            config_V47: {
              mode: isManualMode ? 'manual' : 'auto',
              model: targetModel,
              provider: lockedProvider,
              timestamp: new Date().toISOString(),
              strategy: strategy || 'efficient',
              params: { temperature, topK, memoryWindow }
            },
            payloadSent_V23: payloadForIA, // EXATAMENTE o que foi enviado para a API
            pinnedStepIndices // Índices dos steps que eram pinados (ex: [1, 3])
          };

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

          // 🔥 Envia ID REAL para o frontend (Fonte Única de Verdade)
          finalMetrics.messageId = savedAssistantMsg.id;
          writeSSE({ type: 'telemetry', metrics: finalMetrics });

          // Embeds (Gera vetores para o futuro)
          aiService.embed(fullAssistantResponse).then(emb => {
            if (emb) prisma.$executeRaw`UPDATE messages SET vector = ${emb.vector}::vector WHERE id = ${savedAssistantMsg.id}`;
          }).catch(e => console.error("Embed error:", e));

          aiService.embed(messageContent).then(emb => {
            if (emb) prisma.$executeRaw`UPDATE messages SET vector = ${emb.vector}::vector WHERE id = ${userMsgRecord.id}`;
          }).catch(e => console.error("Embed user error:", e));
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
              console.error("Erro ao gerar título automático:", err);
            }
          })();
        }

      } catch (streamError: any) {
        console.error("Stream Error:", streamError);
        writeSSE({ type: 'error', error: streamError.message || "Erro na geração" });
        res.end();
      } finally {
        cleanup();
      }

    } catch (error) {
      if (!res.headersSent) next(error);
    }
  }
};