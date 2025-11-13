import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rota para atualizar o perfil (nome, etc.)
router.put('/profile', authMiddleware, userController.updateProfile);

export default router;
