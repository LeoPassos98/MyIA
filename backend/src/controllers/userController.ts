import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const userController = {

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
