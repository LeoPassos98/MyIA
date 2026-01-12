// backend/src/routes/authRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

const router = Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginSchema, registerSchema, changePasswordSchema } from '../middleware/validators/authValidator';
import passport from 'passport';
import { AuthController } from '../features/auth/auth.controller';
// OAuth Google
// Rota que o botão do Frontend vai chamar
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Rota de retorno (Callback)
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);


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

// POST /api/auth/change-password (protegida)
router.post(
  '/change-password',
  authMiddleware,
  validateRequest(changePasswordSchema),
  authController.handleChangePassword
);

export default router;