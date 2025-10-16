import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { contextService } from '../services/contextService';
import { aiService } from '../services/ai';
import { ProviderName } from '../services/ai/types';
import { logger } from '../utils/logger';

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message, provider } = req.body; // ← ADICIONAR provider aqui

      // Validar provider se fornecido
      const validProviders: ProviderName[] = ['openai', 'groq', 'together', 'perplexity', 'mistral'];
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

      // Obter resposta da IA (com provider opcional)
      const aiResponse = await aiService.chat(openaiMessages, provider);

      // Adicionar resposta da IA ao contexto
      contextService.addMessage(req.userId, 'assistant', aiResponse);

      logger.info(`Chat message processed for user: ${req.userId}${provider ? ` using ${provider}` : ''}`);

      res.status(200).json({
        response: aiResponse,
        contextSize: contextService.getContextSize(req.userId),
        provider: provider || 'default', // ← ADICIONAR qual provider foi usado
      });
    } catch (error) {
      next(error);
    }
  },

  async clearContext(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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