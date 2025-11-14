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

      const { message, provider, chatId } = req.body;

      // Validar provider se fornecido
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral', 'claude'];
      
      if (provider && !validProviders.includes(provider)) {
        return res.status(400).json({ 
          error: `Invalid provider. Valid options: ${validProviders.join(', ')}` 
        });
      }

      // --- 1. Encontrar ou Criar a Conversa (Chat) ---
      let currentChat;
      if (chatId) {
        currentChat = await prisma.chat.findUnique({ 
          where: { id: chatId, userId: req.userId }
        });
      } else {
        // Se não tem ID, é um chat novo
        currentChat = await prisma.chat.create({
          data: {
            userId: req.userId,
            title: `Conversa: ${message.substring(0, 20)}...`
          }
        });
      }

      if (!currentChat) {
        throw new AppError('Conversa não encontrada', 404);
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
        take: 10, // Últimas 10 mensagens
      });

      const formattedMessages = historyMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // --- 4. Calcular Métricas de ENTRADA ---
      const inputBytes = Buffer.byteLength(message, 'utf8');
      const inputWords = countWords(message);

      // --- 5. Obter resposta da IA ---
      const aiResponseObject = await aiService.chat(formattedMessages, provider);
      const responseText = aiResponseObject.response;

      // --- 6. Calcular Métricas de SAÍDA e Custo ---
      const outputBytes = Buffer.byteLength(responseText, 'utf8');
      const outputWords = countWords(responseText);
      
      const modelKey = (aiResponseObject.model || provider) as CostMapKey;
      const costs = COST_PER_1M_TOKENS[modelKey] || { input: 0, output: 0 };
      
      const totalCost = ((aiResponseObject.tokensIn / 1_000_000) * costs.input) + 
                        ((aiResponseObject.tokensOut / 1_000_000) * costs.output);

      // --- 7. Salvar a Resposta da IA (O "Histórico Inteligente") ---
      await prisma.message.create({
        data: {
          role: 'assistant',
          content: responseText,
          chatId: currentChat.id,
          // Telemetria "Inteligente"
          provider: provider,
          model: modelKey,
          tokensIn: aiResponseObject.tokensIn,
          tokensOut: aiResponseObject.tokensOut,
          costInUSD: totalCost,
        }
      });

      // --- 8. Salvar o Log de Analytics (para os gráficos globais) ---
      prisma.apiCallLog.create({
        data: {
          userId: req.userId,
          provider: provider,
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

      logger.info(`Chat message processed for user: ${req.userId}${provider ? ` using ${provider}` : ''}`);

      // --- 9. Enviar a resposta (e o ID da conversa) ao frontend ---
      return res.status(200).json({
        response: responseText,
        chatId: currentChat.id,
        provider: provider || 'default',
      });
    } catch (error) {
      return next(error);
    }
  },
};