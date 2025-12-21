// backend/src/controllers/auditRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Router } from 'express';
import { auditController } from '../controllers/auditController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Auditoria protegida (por enquanto)
router.use(authMiddleware);

// GET /api/audit/messages - Lista de auditorias
router.get(
  '/messages',
  auditController.listAudits
);

// GET /api/audit/messages/:messageId - Auditoria específica
router.get(
  '/messages/:messageId',
  auditController.getAuditByMessageId
);

export default router;
