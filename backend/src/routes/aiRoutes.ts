// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

// GET /api/ai/providers - Listar providers e modelos (Modular V2)
router.get('/providers', aiController.listProviders);

// POST /api/ai/test/:provider - Testar conexão
router.post('/test/:provider', aiController.testProvider);

export default router;