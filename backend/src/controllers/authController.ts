// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

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
      const user = req.user as any;
      if (!user || !user.token) {
        throw new AppError('Falha na autenticação social', 401);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth-success?token=${user.token}`);
    } catch (error) {
      return next(error);
    }
  },
};