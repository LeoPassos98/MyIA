import { Router } from 'express';
import { chatHistoryController } from '../controllers/chatHistoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, chatHistoryController.getAllChats);
router.get('/:chatId', authMiddleware, chatHistoryController.getChatMessages);
router.delete('/:chatId', authMiddleware, chatHistoryController.deleteChat);

export default router;
