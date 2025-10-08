import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { contextService } from '../services/contextService';
import { openaiService } from '../services/openaiService';
import { logger } from '../utils/logger';

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { message } = req.body;

      // Adicionar mensagem do usuário ao contexto
      contextService.addMessage(req.userId, 'user', message);

      // Pegar histórico de mensagens
      const contextMessages = contextService.getMessages(req.userId);

      // Formatar para OpenAI
      const openaiMessages = contextMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Obter resposta da IA
      const aiResponse = await openaiService.chat(openaiMessages);

      // Adicionar resposta da IA ao contexto
      contextService.addMessage(req.userId, 'assistant', aiResponse);

      logger.info(`Chat message processed for user: ${req.userId}`);

      res.status(200).json({
        response: aiResponse,
        contextSize: contextService.getContextSize(req.userId),
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