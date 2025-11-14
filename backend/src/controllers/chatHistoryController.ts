import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const chatHistoryController = {

  // 1. Busca TODAS as conversas (para a barra lateral)
  async getAllChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const chats = await prisma.chat.findMany({
        where: { userId: req.userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, updatedAt: true }
      });
      return res.json(chats);
    } catch (error) {
      return next(error);
    }
  },

  // 2. Busca as mensagens de UMA conversa (quando o usuário clica)
  async getChatMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { chatId } = req.params;
      const messages = await prisma.message.findMany({
        where: {
          chatId: chatId,
          chat: { userId: req.userId }
        },
        orderBy: { createdAt: 'asc' }
      });
      return res.json(messages);
    } catch (error) {
      return next(error);
    }
  },

  // 3. Deleta uma conversa
  async deleteChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { chatId } = req.params;

      // Deleta mensagens primeiro, depois o chat
      await prisma.message.deleteMany({ where: { chatId: chatId }});
      await prisma.chat.delete({ 
        where: { id: chatId, userId: req.userId }
      });

      return res.status(200).json({ message: 'Conversa deletada' });
    } catch (error) {
      return next(error);
    }
  }
};
