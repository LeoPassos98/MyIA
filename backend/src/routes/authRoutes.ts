import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { authMiddleware } from '../middleware/authMiddleware';
import { registerSchema, loginSchema } from '../types';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

// GET /api/auth/me (protegida)
router.get(
  '/me',
  authMiddleware,
  authController.getMe
);

export default router;