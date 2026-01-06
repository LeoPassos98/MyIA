// backend/src/routes/chatRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { sendMessageSchema } from '../middleware/validators/chatValidator';

const router = Router();

// Todas as rotas de chat são protegidas
router.use(authMiddleware);

// POST /api/chat/message
router.post(
  '/message',
  validateRequest(sendMessageSchema),
  chatController.sendMessage
);

export default router;