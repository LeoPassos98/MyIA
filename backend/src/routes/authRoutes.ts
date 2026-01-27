// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema, changePasswordSchema } from '../middleware/validators/authValidator';
import passport from 'passport';
import { authMiddleware, protect } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';

const router = Router();

// --- OAuth (Google/GitHub) ---
router.get('/test-callback', async (_req, res) => {
  logger.info('\n=== TEST CALLBACK (BYPASS GITHUB) ===');
  
  try {
    // Simula um usuário do GitHub
    const testUser = await prisma.user.upsert({
      where: { email: 'test@github.com' },
      update: { name: 'Test GitHub User' },
      create: {
        email: 'test@github.com',
        name: 'Test GitHub User',
        password: '',
        settings: { create: { theme: 'dark' } }
      }
    });
    
    logger.info('✅ Usuário de teste criado:', testUser.id);
    
    const token = generateToken({ userId: testUser.id, email: testUser.email });
    logger.info('✅ Token gerado:', token.substring(0, 20) + '...');
    
    const redirectUrl = `http://localhost:3000/auth-success?token=${token}`;
    logger.info('✅ Redirecionando para:', redirectUrl);
    
    return res.redirect(redirectUrl);
  } catch (error) {
    logger.error('❌ Erro:', error);
    return res.status(500).json({ error: 'Erro no teste' });
  }
});

router.get('/test-redirect', (_req, res) => {
  logger.info('🧪 [Test] Testando redirect simples');
  res.redirect('https://github.com');
});

router.get('/github', (_req, res) => {
  logger.info('\n=== GITHUB OAUTH START ===');
  logger.info('🔵 [OAuth] GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
  logger.info('🔵 [OAuth] GITHUB_OAUTH_CALLBACK_URL:', process.env.GITHUB_OAUTH_CALLBACK_URL);
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_OAUTH_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback');
  const scope = encodeURIComponent('user:email');
  
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  logger.info('🔵 [OAuth] Redirecionando para:', githubUrl);
  
  res.redirect(githubUrl);
});

router.get('/github/callback', (req, res, next) => {
  logger.info('\n=== GITHUB OAUTH CALLBACK ===');
  logger.info('🔵 [OAuth] GitHub callback recebido');
  logger.info('🔵 [OAuth] Query params:', JSON.stringify(req.query, null, 2));
  logger.info('🔵 [OAuth] URL completa:', req.url);
  logger.info('🔵 [OAuth] Headers:', JSON.stringify(req.headers, null, 2));
  
  passport.authenticate('github', { 
    failureRedirect: 'http://localhost:3000/login?error=auth_failed', 
    session: false 
  }, (err: any, user: any, info: any) => {
    logger.info('\n=== PASSPORT CALLBACK ===');
    logger.info('🔵 [OAuth] Passport authenticate callback');
    logger.info('🔵 [OAuth] Error:', err);
    logger.info('🔵 [OAuth] User:', user ? { id: user.id, email: user.email } : null);
    logger.info('🔵 [OAuth] Info:', info);
    
    if (err) {
      logger.error('❌ [OAuth] Erro na autenticação:', err);
      return res.redirect(`http://localhost:3000/login?error=auth_failed`);
    }
    
    if (!user) {
      logger.error('❌ [OAuth] Usuário não encontrado');
      return res.redirect(`http://localhost:3000/login?error=no_user`);
    }
    
    logger.info('✅ [OAuth] Usuário autenticado, passando para socialLoginCallback');
    req.user = user;
    next();
  })(req, res, next);
}, authController.socialLoginCallback);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  authController.socialLoginCallback
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