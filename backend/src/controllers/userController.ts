import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const userController = {

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, name: true, createdAt: true }
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Não autorizado', 401);
      }
      const { name } = req.body;

      if (!name) {
        throw new AppError('O nome é obrigatório', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { name },
        select: { id: true, email: true, name: true }
      });

      res.json(updatedUser);

    } catch (error) {
      next(error);
    }
  },
};
