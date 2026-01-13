// backend/src/routes/userRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateProfileSchema } from '../middleware/validators/userValidator';

const router = Router();

// Rota para obter perfil do usuário autenticado
router.get('/profile', authMiddleware, userController.getProfile);

// Rota para atualizar o perfil (nome, etc.)
router.put('/profile', authMiddleware, validateRequest(updateProfileSchema), userController.updateProfile);

// Rota para obter dados do usuário autenticado
router.get('/me', authMiddleware, userController.getProfile);

export default router;
