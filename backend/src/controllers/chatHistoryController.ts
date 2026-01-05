// backend/src/controllers/chatHistoryController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

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
        select: { 
          id: true, 
          title: true, 
          updatedAt: true,
          provider: true // Campo provider incluído
        }
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
  },

  // 4. Toggle pin de uma mensagem
  async toggleMessagePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { messageId } = req.params;

      // Verifica se a mensagem existe e pertence ao usuário
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          chat: { userId: req.userId }
        }
      });

      if (!message) {
        throw new AppError('Mensagem não encontrada', 404);
      }

      // Toggle o estado do pin
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned }
      });

      return res.json({ 
        messageId: updatedMessage.id,
        isPinned: updatedMessage.isPinned 
      });
    } catch (error) {
      return next(error);
    }
  },

  // 5. Busca mensagens pinadas de um chat
  async getPinnedMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { chatId } = req.params;

      const pinnedMessages = await prisma.message.findMany({
        where: {
          chatId: chatId,
          chat: { userId: req.userId },
          isPinned: true
        },
        orderBy: { createdAt: 'asc' }
      });

      return res.json(pinnedMessages);
    } catch (error) {
      return next(error);
    }
  }
};
