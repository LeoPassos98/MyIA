import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { encryptionService } from '../services/encryptionService';

// Helper: Encontrar ou criar configurações
async function findOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    // Criar configurações padrão se não existir
    settings = await prisma.userSettings.create({
      data: {
        userId,
        theme: 'light',
      }
    });
  }

  return settings;
}

// Lista das chaves que precisam de criptografia
const encryptedKeys: string[] = [
  'openaiApiKey', 
  'groqApiKey', 
  'claudeApiKey',
  'togetherApiKey',
  'perplexityApiKey',
  'mistralApiKey'
];

export const userSettingsController = {
  getSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return; // <-- FIX: Adicionar return explícito
      }

      const settings = await findOrCreateSettings(req.userId);

      // --- LÓGICA DO COFRE (GET) ---
      // Crie uma cópia segura para enviar ao frontend
      const safeSettings = { ...settings };

      for (const key of encryptedKeys) {
        const encryptedValue = settings[key as keyof typeof settings] as string;
        if (encryptedValue) {
          // 1. Descriptografe para verificar (mas não use o valor)
          const decryptedKey = encryptionService.decrypt(encryptedValue);
          // 2. Substitua o "rabisco" por um placeholder
          (safeSettings as any)[key] = encryptionService.getPlaceholder(decryptedKey);
        }
      }
      // --- FIM DA LÓGICA ---

      res.json(safeSettings);

    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const updateData = { ...req.body };

      // --- LÓGICA DO COFRE (UPDATE) ---
      for (const key of encryptedKeys) {
        if (updateData[key]) {
          // 1. Pegue a chave em texto puro enviada pelo frontend
          const plainTextKey = updateData[key];
          // 2. Criptografe-a
          updateData[key] = encryptionService.encrypt(plainTextKey);
        }
      }
      // --- FIM DA LÓGICA ---

      await findOrCreateSettings(req.userId);

      const updatedSettings = await prisma.userSettings.update({
        where: { userId: req.userId },
        data: updateData,
      });

      // (Repetir a lógica do GET para retornar os placeholders)
      const safeSettings = { ...updatedSettings };
      for (const key of encryptedKeys) {
        const encryptedValue = updatedSettings[key as keyof typeof updatedSettings] as string;
        if (encryptedValue) {
          const decryptedKey = encryptionService.decrypt(encryptedValue);
          (safeSettings as any)[key] = encryptionService.getPlaceholder(decryptedKey);
        }
      }

      res.json(safeSettings);

    } catch (error) {
      next(error);
    }
  },
};
