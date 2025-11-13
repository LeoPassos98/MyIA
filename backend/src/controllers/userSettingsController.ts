import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

async function findOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: userId,
        theme: 'light',
      },
    });
  }
  return settings;
}

export const userSettingsController = {
  getSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      const settings = await findOrCreateSettings(req.userId);
      res.json(settings);

    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      await findOrCreateSettings(req.userId);

      const updatedSettings = await prisma.userSettings.update({
        where: {
          userId: req.userId,
        },
        data: req.body,
      });
      
      res.json(updatedSettings);

    } catch (error) {
      next(error);
    }
  },
};
