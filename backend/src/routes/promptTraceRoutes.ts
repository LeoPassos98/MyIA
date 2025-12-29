// backend/src/routes/promptTraceRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { promptTraceController } from '../controllers/promptTraceController';

const router = Router();

router.get('/:traceId', authMiddleware, (req, res) =>
  promptTraceController.getPromptTraceById(req, res)
);

export default router;
