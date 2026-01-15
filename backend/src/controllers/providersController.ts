// backend/src/controllers/providersController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { encryptionService } from '../services/encryptionService';
import { BedrockProvider } from '../services/ai/providers/bedrock';
import { bedrockConfigSchema } from '../schemas/bedrockSchema';
import { jsend } from '../utils/jsend';
import { AppError } from '../middleware/errorHandler';
import winston from 'winston';

// Logger configurado (assumindo logger global)
const logger = winston.createLogger({ /* config existente */ });

function isError(obj: unknown): obj is Error {
  return typeof obj === 'object' && obj !== null && 'message' in obj;
}

export const providersController = {
  /**
   * POST /api/providers/bedrock/validate
   * Validação inteligente (Safe-Save) para credenciais AWS Bedrock
   */
  async validateAWS(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      if (!userId) {
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      // Validação Zod do body
      const config = bedrockConfigSchema.parse(req.body);

      let accessKey: string;
      let secretKey: string;

      // Resolução de Credenciais
      if (config.secretKey) {
        // Caso A: Edição - Usar credenciais enviadas
        accessKey = config.accessKey!;
        secretKey = config.secretKey;
      } else {
        // Caso B: Teste Rápido - Buscar credenciais salvas no banco
        const userSettings = await prisma.userSettings.findUnique({
          where: { userId },
          select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true },
        });

        if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
          return res.status(400).json(jsend.fail({
            credentials: 'Nenhuma credencial AWS salva. Forneça accessKey e secretKey.',
          }));
        }

        accessKey = encryptionService.decrypt(userSettings.awsAccessKey);
        secretKey = encryptionService.decrypt(userSettings.awsSecretKey);
      }

      // Dry Run: Teste com ListFoundationModelsCommand
      const startTime = Date.now();
      let latencyMs: number;
      let modelsCount: number;

      try {
        const bedrockProvider = new BedrockProvider(config.region);
        const apiKey = `${accessKey}:${secretKey}`;

        // Simular chamada para validar (usar método existente ou adicionar)
        const isValid = await bedrockProvider.validateKey(apiKey);
        if (!isValid) {
          throw new Error('Credenciais inválidas ou sem permissão no Bedrock');
        }

        // Para obter contagem de modelos, podemos adicionar um método ou usar o SDK diretamente
        // Assumindo que adicionamos um método getModelsCount no BedrockProvider
        modelsCount = await bedrockProvider.getModelsCount(apiKey);
        latencyMs = Date.now() - startTime;

      } catch (error: any) {
        const errorMsg = error.message || 'Erro desconhecido na validação';
        logger.warn('AWS Bedrock validation failed', {
          userId,
          region: config.region,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        });

        // Mapear erros específicos
        let friendlyMessage = 'Credenciais inválidas';
        if (error.name === 'UnrecognizedClientException') {
          friendlyMessage = 'Credenciais AWS inválidas';
        } else if (error.name === 'AccessDeniedException') {
          friendlyMessage = 'Sem permissão para acessar Bedrock nesta região';
        }

        return res.status(400).json(jsend.fail({
          validation: friendlyMessage,
        }));
      }

      // Persistência (Safe-Save): Só salvar se sucesso E credenciais novas foram enviadas
      if (config.secretKey) {
        await prisma.userSettings.upsert({
          where: { userId },
          update: {
            awsAccessKey: encryptionService.encrypt(accessKey),
            awsSecretKey: encryptionService.encrypt(secretKey),
            awsRegion: config.region,
          },
          create: {
            userId,
            awsAccessKey: encryptionService.encrypt(accessKey),
            awsSecretKey: encryptionService.encrypt(secretKey),
            awsRegion: config.region,
          },
        });
      }
      
      // Registrar validação bem-sucedida na tabela providerCredentialValidation
      await prisma.providerCredentialValidation.upsert({
        where: {
          userId_provider: {
            userId,
            provider: 'bedrock'
          }
        },
        update: {
          status: 'valid',
          lastValidatedAt: new Date(),
          latencyMs,
          lastError: null,
          errorCode: null
        },
        create: {
          userId,
          provider: 'bedrock',
          status: 'valid',
          lastValidatedAt: new Date(),
          latencyMs
        }
      });

      // Auditoria: Log de sucesso
      logger.info('AWS Bedrock validation success', {
        userId,
        region: config.region,
        modelsCount,
        latencyMs,
        timestamp: new Date().toISOString(),
      });

      return res.json(jsend.success({
        status: 'valid',
        message: `Credenciais válidas. ${modelsCount} modelos disponíveis.`,
        latencyMs,
        modelsCount,
      }));

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      logger.error('Unexpected error in Bedrock validation', {
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro interno na validação AWS', 500));
    }
  },
};