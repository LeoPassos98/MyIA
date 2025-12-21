// backend/src/routes/chatRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas de chat são protegidas
router.use(authMiddleware);

// POST /api/chat/message
router.post(
  '/message',
  chatController.sendMessage
);

export default router;