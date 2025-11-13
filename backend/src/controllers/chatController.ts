import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { contextService } from '../services/contextService';
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

// Tipo para a chave do nosso mapa de custos (CORRIGE O ERRO 1)
type CostMapKey = keyof typeof COST_PER_1M_TOKENS;

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return next(new AppError('Unauthorized', 401));
      }

      const { message, provider } = req.body;

      // Validar provider se fornecido
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral', 'claude'];
      
      if (provider && !validProviders.includes(provider)) {
        return res.status(400).json({ 
          error: `Invalid provider. Valid options: ${validProviders.join(', ')}` 
        });
      }

      // Adicionar mensagem do usuário ao contexto
      contextService.addMessage(req.userId, 'user', message);

      // Pegar histórico de mensagens
      const contextMessages = contextService.getMessages(req.userId);

      // Formatar para OpenAI
      const openaiMessages = contextMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // --- 1. Calcular Métricas de ENTRADA ---
      const inputBytes = Buffer.byteLength(message, 'utf8');
      const inputWords = countWords(message);

      // --- 2. Obter resposta da IA (O OBJETO) ---
      const aiResponseObject = await aiService.chat(openaiMessages, provider);

      // --- 3. DESEMPACOTAR a resposta ---
      const responseText = aiResponseObject.response;
      
      // --- 4. Adicionar resposta (SÓ O TEXTO) ao contexto ---
      contextService.addMessage(req.userId, 'assistant', responseText);

      // --- 5. Calcular Métricas de SAÍDA e Custo ---
      const outputBytes = Buffer.byteLength(responseText, 'utf8');
      const outputWords = countWords(responseText);
      
      // --- CORREÇÃO DO ERRO 'ANY' (Erro 1) ---
      const modelKey = (aiResponseObject.model || provider) as CostMapKey;
      const costs = COST_PER_1M_TOKENS[modelKey] || { input: 0, output: 0 };
      
      const totalCost = ((aiResponseObject.tokensIn / 1_000_000) * costs.input) + 
                        ((aiResponseObject.tokensOut / 1_000_000) * costs.output);

      // --- 6. LOG DE ANALYTICS (Fire-and-forget) ---
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

      // --- 7. Enviar resposta (SÓ O TEXTO) ao frontend ---
      res.status(200).json({
        response: responseText,
        contextSize: contextService.getContextSize(req.userId),
        provider: provider || 'default',
      });
    } catch (error) {
      next(error);
    }
  },

  async clearContext(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return next(new AppError('Unauthorized', 401));
      }

      contextService.clearContext(req.userId);

      logger.info(`Context cleared for user: ${req.userId}`);

      res.status(200).json({
        message: 'Context cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};