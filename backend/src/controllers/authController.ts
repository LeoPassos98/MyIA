import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const result = await authService.register(email, password, name);

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.userId,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      logger.info(`User logged in: ${email}`);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await authService.getUserById(req.userId);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
};