// backend/src/controllers/userSettingsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { encryptionService } from '../services/encryptionService';
import { jsend } from '../utils/jsend';

// Helper: Encontrar ou criar configurações
async function findOrCreateSettings(userId: string) {
  // Primeiro, verificar se o usuário existe
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true } // Apenas pegar o ID para economizar recursos
  });

  if (!userExists) {
    throw new AppError('Usuário não encontrado. Token inválido ou usuário foi removido.', 401);
  }

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
        res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
        return;
      }

      const settings = await findOrCreateSettings(req.userId);

      // --- LÓGICA DO COFRE (GET) ---
      const safeSettings = { ...settings };

      for (const key of encryptedKeys) {
        const encryptedValue = settings[key as keyof typeof settings] as string;
        if (encryptedValue) {
          const decryptedKey = encryptionService.decrypt(encryptedValue);
          (safeSettings as any)[key] = encryptionService.getPlaceholder(decryptedKey);
        }
      }
      // --- FIM DA LÓGICA ---

      return res.json(jsend.success(safeSettings));

    } catch (error) {
      return next(error);
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

      return res.json(jsend.success(safeSettings));

    } catch (error) {
      return next(error);
    }
  },

  // GET /api/settings/credentials
  async getCredentials(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const credentials = await prisma.userProviderCredential.findMany({
        where: { userId: req.userId },
        include: { provider: true }
      });

      const keyMap: Record<string, string> = {};
      credentials.forEach(cred => {
        keyMap[cred.provider.slug] = cred.apiKey;
      });

      return res.json(jsend.success({ credentials: keyMap }));
    } catch (error) {
      return next(error);
    }
  },

  // POST /api/settings/credentials
  async updateCredentials(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const keys = req.body as Record<string, string>; 
      const userId = req.userId!;

      if (!keys || typeof keys !== 'object') {
        return res.status(400).json(jsend.fail({ body: 'Body inválido' }));
      }

      const updatePromises = Object.entries(keys).map(async ([providerSlug, apiKey]) => {
        if (!apiKey || typeof apiKey !== 'string') return null;

        const provider = await prisma.aIProvider.findUnique({ where: { slug: providerSlug } });
        if (!provider) return null;

        return prisma.userProviderCredential.upsert({
          where: {
            userId_providerId: {
              userId,
              providerId: provider.id
            }
          },
          update: { apiKey },
          create: {
            userId,
            providerId: provider.id,
            apiKey
          }
        });
      });

      await Promise.all(updatePromises);
      return res.json(jsend.success({ message: 'Credenciais atualizadas com sucesso' }));
    } catch (error) {
      return next(error);
    }
  }
};