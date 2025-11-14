import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai';
import { ProviderName } from '../services/ai/types';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { COST_PER_1M_TOKENS } from '../config/costMap';
import { AppError } from '../middleware/errorHandler';


// Helper: conta palavras
function countWords(str: string): number {
  if (!str) return 0;
  return str.split(/\s+/).filter(Boolean).length;
}

// Tipo para a chave do nosso mapa de custos
type CostMapKey = keyof typeof COST_PER_1M_TOKENS;

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
          throw new AppError('Conversa não encontrada', 404);
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

      // --- 4. Calcular Métricas de ENTRADA ---
      const inputBytes = Buffer.byteLength(message, 'utf8');
      const inputWords = countWords(message);

      // --- 5. Obter resposta da IA (usando provider travado) ---
      const aiResponseObject = await aiService.chat(formattedMessages, lockedProvider);
      const responseText = aiResponseObject.response;

      // --- 6. Calcular Métricas de SAÍDA e Custo ---
      const outputBytes = Buffer.byteLength(responseText, 'utf8');
      const outputWords = countWords(responseText);
      
      const modelKey = (aiResponseObject.model || lockedProvider) as CostMapKey;
      const costs = COST_PER_1M_TOKENS[modelKey] || { input: 0, output: 0 };
      
      const totalCost = ((aiResponseObject.tokensIn / 1_000_000) * costs.input) + 
                        ((aiResponseObject.tokensOut / 1_000_000) * costs.output);

      // --- 7. Salvar a Resposta da IA ---
      await prisma.message.create({
        data: {
          role: 'assistant',
          content: responseText,
          chatId: currentChat.id,
          provider: lockedProvider,
          model: modelKey,
          tokensIn: aiResponseObject.tokensIn,
          tokensOut: aiResponseObject.tokensOut,
          costInUSD: totalCost,
        }
      });

      // --- 8. Salvar o Log de Analytics ---
      prisma.apiCallLog.create({
        data: {
          userId: req.userId,
          provider: lockedProvider,
          model: modelKey,
          tokensIn: aiResponseObject.tokensIn || 0,
          tokensOut: aiResponseObject.tokensOut || 0,
          costInUSD: totalCost,
          wordsIn: inputWords,
          wordsOut: outputWords,
          bytesIn: inputBytes,
          bytesOut: outputBytes,
        }
      }).catch(err => {
        console.error("Falha ao salvar log de analytics:", err);
      });

      logger.info(`Chat message processed for user: ${req.userId} using locked provider: ${lockedProvider}`);

      // --- 9. Enviar a resposta (com provider travado) ---
      const responsePayload = {
        response: responseText,
        chatId: currentChat.id,
        provider: lockedProvider,
      };

      // Enviar resposta ANTES da geração de título
      res.status(200).json(responsePayload);

      // --- GERAÇÃO DE TÍTULO (FIRE-AND-FORGET c/ "CIRCUIT BREAKER") ---
      // Isso só roda se for um chat NOVO (quando o título ainda é o padrão)
      if (isNewChat && currentChat.title === "Nova Conversa") {

        // IIFE assíncrono para não bloquear a resposta
        (async () => {

          // --- O "INTERRUPTOR" DE CUSTO ---
          const groqModelName = 'llama-3.1-8b-instant'; 
          const groqCosts = COST_PER_1M_TOKENS[groqModelName as CostMapKey] || { input: 99, output: 99 };
          const isGroqFree = groqCosts.input === 0 && groqCosts.output === 0;
          // --- FIM DO INTERRUPTOR ---

          let titleToSave: string;

          if (isGroqFree) {
            // --- PLANO A: Tentar Título "Inteligente" (Grátis) ---
            try {
              const titlePrompt = `Gere um título curto e conciso (máximo 5 palavras) para esta conversa, baseado na primeira pergunta do usuário. Responda APENAS com o título, sem introdução. Pergunta: "${message}"`;

              const titleResponse = await aiService.chat(
                [{ role: 'user', content: titlePrompt }],
                'groq' // Força o uso do provider gratuito
              );

              titleToSave = titleResponse.response.replace(/"/g, '').trim(); // Limpa aspas e espaços

              // --- Logar a "Meta-Chamada" (Importante para Analytics) ---
              const modelKey = (titleResponse.model || 'groq') as CostMapKey;
              const costs = COST_PER_1M_TOKENS[modelKey] || { input: 0, output: 0 };
              const metaCost = ((titleResponse.tokensIn / 1_000_000) * costs.input) + 
                                 ((titleResponse.tokensOut / 1_000_000) * costs.output);

              prisma.apiCallLog.create({
                data: {
                  userId: req.userId!,
                  provider: 'groq',
                  model: modelKey,
                  tokensIn: titleResponse.tokensIn || 0,
                  tokensOut: titleResponse.tokensOut || 0,
                  costInUSD: metaCost, // Vai ser 0.00
                  wordsIn: countWords(titlePrompt),
                  wordsOut: countWords(titleToSave),
                  bytesIn: Buffer.byteLength(titlePrompt, 'utf8'),
                  bytesOut: Buffer.byteLength(titleToSave, 'utf8'),
                }
              }).catch(logErr => {
                console.error("Falha ao salvar log de analytics (título):", logErr);
              });
              // --- Fim do Log ---

            } catch (err: any) {
              // O Groq (grátis) falhou (ex: está fora do ar)
              console.warn("Falha ao gerar título (fire-and-forget) com IA:", err.message);
              titleToSave = `Conversa: ${message.substring(0, 20)}...`; // Fallback "burro"
            }
          } else {
            // --- PLANO B: "Degradação Graciosa" (O Groq não é mais grátis!) ---
            console.warn("Geração de título com Groq desabilitada (não é mais grátis). Usando fallback.");
            titleToSave = `Conversa: ${message.substring(0, 20)}...`;
          }

          // --- ATUALIZAÇÃO FINAL (Único Ponto de Escrita no DB) ---
          try {
            if (titleToSave && titleToSave.length > 0) { // Garante que não é nulo/vazio
              await prisma.chat.update({
                where: { id: currentChat.id },
                data: { title: titleToSave }
              });
              logger.info(`Título gerado automaticamente para chat ${currentChat.id}: "${titleToSave}"`);
            }
          } catch (dbErr) {
            console.error("Falha ao salvar título final:", dbErr);
          }

        })(); // <-- Fim do "fire-and-forget"
      }
      // --- FIM DA GERAÇÃO DE TÍTULO ---

      return; // Função já enviou resposta

    } catch (error) {
      return next(error);
    }
  },
};