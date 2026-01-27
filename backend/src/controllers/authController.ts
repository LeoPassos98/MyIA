// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { generateToken } from '../utils/jwt';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);

      logger.info(`User registered: ${email}`);

      return res.status(201).json({
        status: 'success',
        data: {
          user: { id: result.userId, email, name }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email e senha são obrigatórios', 400);
      }

      const result = await authService.login(email, password);

      logger.info(`User logged in: ${email}`);

      // result = { token, user: { id, email, name, ... } }
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      return next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }

      const user = await authService.getUserById(req.userId);

      return res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      return next(error);
    }
  },

  async handleChangePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        throw new AppError('Todos os campos são obrigatórios', 400);
      }

      await authService.changePassword(req.userId, oldPassword, newPassword);
      
      return res.status(200).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      return next(error);
    }
  },

  async socialLoginCallback(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Social login callback iniciado', {
        requestId: req.id,
        user: req.user ? { id: (req.user as any).id, email: (req.user as any).email } : null
      });
      
      const user = req.user as any;
      
      if (!user || !user.id) {
        logger.error('Usuário não encontrado em req.user', {
          requestId: req.id,
          hasUser: !!user,
          userId: user?.id
        });
        throw new AppError('Falha na autenticação social', 401);
      }

      logger.info('Gerando JWT para usuário', {
        requestId: req.id,
        userId: user.id,
        email: user.email
      });
      
      const token = generateToken({ userId: user.id, email: user.email });
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth-success?token=${token}`;
      
      logger.info('Redirecionando para frontend', {
        requestId: req.id,
        userId: user.id,
        redirectUrl: frontendUrl + '/auth-success'
      });
      
      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Erro no callback social', {
        requestId: req.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return next(error);
    }
  },
};