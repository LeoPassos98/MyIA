import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { validateRequest } from '../middleware/validateRequest';
import { authMiddleware } from '../middleware/authMiddleware';
import { chatMessageSchema } from '../types';

const router = Router();

// Todas as rotas de chat são protegidas
router.use(authMiddleware);

// POST /api/chat/message
router.post(
  '/message',
  validateRequest(chatMessageSchema),
  chatController.sendMessage
);

// DELETE /api/chat/context
router.delete(
  '/context',
  chatController.clearContext
);

export default router;