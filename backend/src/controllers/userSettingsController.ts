// backend/src/controllers/userSettingsController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { encryptionService } from '../services/encryptionService';
import { jsend } from '../utils/jsend';
import logger from '../utils/logger';

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
  'mistralApiKey',
  'awsAccessKey',
  'awsSecretKey'
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
      const safeSettings: Record<string, unknown> = { ...settings };

      for (const key of encryptedKeys) {
        const encryptedValue = settings[key as keyof typeof settings] as string;
        if (encryptedValue) {
          const decryptedKey = encryptionService.decrypt(encryptedValue);
          safeSettings[key] = encryptionService.getPlaceholder(decryptedKey);
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
        const value = updateData[key];
        
        // Se o campo foi enviado no payload
        if (value !== undefined) {
          // Ignorar strings vazias, null ou placeholders (proteção contra corrupção)
          // String vazia significa "não modificado" no frontend
          if (!value || value === '' || value.trim() === '') {
            delete updateData[key]; // Não atualizar este campo, manter valor existente
            continue;
          }
          
          // Ignorar placeholders comuns (ex: "********", "AKIA...EKEY")
          if (value.match(/^\*+$/) || value.match(/^.{4}\.\.\..{4}$/)) {
            delete updateData[key]; // Não atualizar este campo, manter valor existente
            continue;
          }
          
          // 1. Pegue a chave em texto puro enviada pelo frontend
          const plainTextKey = value;
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
      const safeSettings: Record<string, unknown> = { ...updatedSettings };
      for (const key of encryptedKeys) {
        const encryptedValue = updatedSettings[key as keyof typeof updatedSettings] as string;
        if (encryptedValue) {
          const decryptedKey = encryptionService.decrypt(encryptedValue);
          safeSettings[key] = encryptionService.getPlaceholder(decryptedKey);
        }
      }

      return res.json(jsend.success(safeSettings));

    } catch (error) {
      return next(error);
    }
  },

  // GET /api/settings/credentials
  // Schema v2: UserProviderCredential foi removido
  // As credenciais agora são armazenadas diretamente em UserSettings
  async getCredentials(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Schema v2: Buscar credenciais diretamente de UserSettings
      const settings = await prisma.userSettings.findUnique({
        where: { userId: req.userId }
      });

      // Mapear credenciais do UserSettings para o formato esperado
      const keyMap: Record<string, string> = {};
      
      // AWS Bedrock credentials
      if (settings?.awsAccessKey && settings?.awsSecretKey) {
        // Retornar placeholder para não expor credenciais
        keyMap['bedrock'] = encryptionService.getPlaceholder(
          encryptionService.decrypt(settings.awsAccessKey)
        );
      }
      
      // NOTA: Outras credenciais de providers (openai, groq, etc.)
      // também estão em UserSettings como campos individuais
      // Ex: openaiApiKey, groqApiKey, etc.
      
      logger.info(`[getCredentials] Retornando credenciais para userId: ${req.userId}`);

      return res.json(jsend.success({ credentials: keyMap }));
    } catch (error) {
      return next(error);
    }
  },

  // POST /api/settings/credentials
  // Schema v2: UserProviderCredential foi removido
  // As credenciais agora são armazenadas diretamente em UserSettings
  // TODO: Refatorar para atualizar campos específicos em UserSettings
  async updateCredentials(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const keys = req.body as Record<string, string>;
      // Schema v2: userId disponível em req.userId para atualização via UserSettings

      if (!keys || typeof keys !== 'object') {
        return res.status(400).json(jsend.fail({ body: 'Body inválido' }));
      }

      const updatePromises = Object.entries(keys).map(async ([providerSlug, apiKey]) => {
        if (!apiKey || typeof apiKey !== 'string') return null;

        // Schema v2: AIProvider → Provider
        const provider = await prisma.provider.findUnique({ where: { slug: providerSlug } });
        if (!provider) return null;

        // Schema v2: UserProviderCredential foi removido
        // As credenciais agora são armazenadas diretamente em UserSettings
        // TODO: Implementar atualização via UserSettings baseado no providerSlug
        // Ex: if (providerSlug === 'bedrock') { update awsAccessKey, awsSecretKey }
        logger.warn(`[updateCredentials] UserProviderCredential removido do schema v2. Provider: ${providerSlug}. Use updateSettings para atualizar credenciais.`);
        return null;
      });

      await Promise.all(updatePromises);
      return res.json(jsend.success({ message: 'Credenciais atualizadas com sucesso' }));
    } catch (error) {
      return next(error);
    }
  }
};