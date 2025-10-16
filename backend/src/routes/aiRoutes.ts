// backend/src/routes/aiRoutes.ts

import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

// GET /api/ai/providers - Listar providers disponíveis
router.get('/providers', aiController.listProviders);

// POST /api/ai/test/:provider - Testar conexão com um provider
router.post('/test/:provider', aiController.testProvider);

export default router;