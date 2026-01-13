// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema, changePasswordSchema } from '../middleware/validators/authValidator';
import passport from 'passport';
import { AuthController } from '../features/auth/auth.controller'; // Se estiver usando a classe
import { authMiddleware, protect } from '../middleware/authMiddleware';

const router = Router();

// --- OAuth (Google/GitHub) ---
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  AuthController.socialLoginCallback
);

// --- Autenticação Manual ---
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// --- Rotas Protegidas ---
// Use apenas UM padrão de proteção. Se 'protect' é o seu novo padrão, use-o aqui:
router.get('/me', authMiddleware, authController.getMe);

// 🛑 REMOVI A DUPLICATA: Mantendo apenas uma versão do change-password
router.post(
  '/change-password',
  protect,
  validateRequest(changePasswordSchema),
  authController.handleChangePassword
);

export default router;