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

export default router;
