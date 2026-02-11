// backend/src/controllers/chatHistoryController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const chatHistoryController = {

  // 1. Busca TODAS as conversas (Já estava correto)
  async getAllChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Não autorizado', 401);
      
      const chats = await prisma.chat.findMany({
        where: { userId: req.userId },
        orderBy: { updatedAt: 'desc' },
        select: { 
          id: true, 
          title: true, 
          updatedAt: true,
          provider: true 
        }
      });

      return res.json({
        status: 'success',
        data: { chats }
      });
    } catch (error) {
      return next(error);
    }
  },

  // 2. Busca as mensagens de UMA conversa
  async getChatMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Não autorizado', 401);
      
      const { chatId } = req.params;
      const messages = await prisma.message.findMany({
        where: {
          chatId: chatId,
          chat: { userId: req.userId }
        },
        orderBy: { createdAt: 'asc' }
      });

      // ✅ Refatorado para JSend
      return res.json({
        status: 'success',
        data: { messages }
      });
    } catch (error) {
      return next(error);
    }
  },

  // 3. Deleta uma conversa
  async deleteChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Não autorizado', 401);
      
      const { chatId } = req.params;

      await prisma.message.deleteMany({ where: { chatId: chatId }});
      await prisma.chat.delete({
        where: { id: chatId, userId: req.userId }
      });

      // ✅ Refatorado: Sucesso em deleção geralmente retorna data null
      return res.status(200).json({ 
        status: 'success', 
        data: null 
      });
    } catch (error) {
      return next(error);
    }
  },

  // 4. Toggle pin de uma mensagem
  async toggleMessagePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Não autorizado', 401);
      
      const { messageId } = req.params;

      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          chat: { userId: req.userId }
        }
      });

      if (!message) throw new AppError('Mensagem não encontrada', 404);

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned }
      });

      // ✅ Refatorado para JSend
      return res.json({ 
        status: 'success',
        data: { 
          messageId: updatedMessage.id,
          isPinned: updatedMessage.isPinned 
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  // 5. Busca mensagens pinadas de um chat
  async getPinnedMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Não autorizado', 401);
      
      const { chatId } = req.params;

      const pinnedMessages = await prisma.message.findMany({
        where: {
          chatId: chatId,
          chat: { userId: req.userId },
          isPinned: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // ✅ Refatorado para JSend
      return res.json({
        status: 'success',
        data: { pinnedMessages }
      });
    } catch (error) {
      return next(error);
    }
  }
};