// backend/src/routes/chatHistoryRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { chatHistoryController } from '../controllers/chatHistoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, chatHistoryController.getAllChats);
router.get('/:chatId', authMiddleware, chatHistoryController.getChatMessages);
router.delete('/:chatId', authMiddleware, chatHistoryController.deleteChat);

// Rotas de mensagens pinadas
router.patch('/message/:messageId/pin', authMiddleware, chatHistoryController.toggleMessagePin);
router.get('/:chatId/pinned', authMiddleware, chatHistoryController.getPinnedMessages);

export default router;
