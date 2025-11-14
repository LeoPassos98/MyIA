import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { ProviderName, TelemetryMetrics, StreamChunk } from '../services/ai/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';


// Helper: conta palavras
function countWords(str: string): number {
  if (!str) return 0;
  return str.split(/\s+/).filter(Boolean).length;
}

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message, provider: requestProvider, chatId } = req.body;

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

      // --- 1. Encontrar ou Criar a Conversa (Chat) ---
      let currentChat;
      let lockedProvider: ProviderName;
      let isNewChat = false;

      if (chatId) {
        // Chat existente: busca e usa o provider travado
        currentChat = await prisma.chat.findUnique({ 
          where: { id: chatId, userId: req.userId }
        });
        
        if (!currentChat) {
          writeSSE({ type: 'error', error: 'Conversa não encontrada' });
          res.end();
          return;
        }
        
        lockedProvider = currentChat.provider as ProviderName;
      } else {
        // Novo chat: cria com provider travado (título padrão será substituído depois)
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
      }

      // --- 2. Salvar a Mensagem do Usuário ---
      await prisma.message.create({
        data: {
          role: 'user',
          content: message,
          chatId: currentChat.id,
        }
      });

      // --- 3. Preparar o Histórico para a IA ---
      const historyMessages = await prisma.message.findMany({
        where: { chatId: currentChat.id },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      const formattedMessages = historyMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // --- O NOVO MOTOR (Streaming) ---
      try {
        const stream = aiService.stream(formattedMessages, lockedProvider);

        let fullAssistantResponse = "";
        let finalMetrics: TelemetryMetrics | null = null;

        // "Sugue" o gotejamento do aiService
        for await (const chunk of stream) {
          // Re-transmite CADA chunk para o frontend
          writeSSE(chunk);

          // Acumula dados para salvar no DB
          if (chunk.type === 'chunk') {
            fullAssistantResponse += chunk.content;
          } else if (chunk.type === 'telemetry') {
            finalMetrics = chunk.metrics;
          } else if (chunk.type === 'error') {
            console.error("Erro no stream da IA:", chunk.error);
          }
        }

        // --- O STREAM TERMINOU ---
        if (finalMetrics) {
          // Salvar resposta completa do Assistente
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

          // Calcular métricas de engenharia
          const outputWords = countWords(fullAssistantResponse);
          const outputBytes = Buffer.byteLength(fullAssistantResponse, 'utf8');
          const inputWords = countWords(message);
          const inputBytes = Buffer.byteLength(message, 'utf8');

          // Salvar Log de Analytics
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
          });

          logger.info(`Stream completo para user ${req.userId} usando ${lockedProvider}`);

        } else {
          console.error("Stream encerrado sem telemetria.");
          writeSSE({ type: 'error', error: 'Stream encerrado sem telemetria' });
        }

        // --- Geração de Título (Fire-and-Forget) ---
        if (isNewChat && currentChat.title === "Nova Conversa") {
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
                
                let titleText = "";
                const titleStream = aiService.stream([{ role: 'user', content: titlePrompt }], 'groq');
                
                for await (const chunk of titleStream) {
                  if (chunk.type === 'chunk') {
                    titleText += chunk.content;
                  }
                }

                titleToSave = titleText.replace(/"/g, '').trim();
              } catch (err: any) {
                console.warn("Falha ao gerar título com IA:", err.message);
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
        console.error("Erro fatal no stream:", error);
        writeSSE({ type: 'error', error: error.message || 'Erro no servidor' });
      } finally {
        // Fecha a conexão SSE
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