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
import { ModelRegistry } from '../services/ai/registry';
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

  /**
   * GET /api/providers/bedrock/available-models
   * Retorna os modelos disponíveis na conta AWS do usuário
   */
  async getAvailableModels(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      if (!userId) {
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      // Buscar credenciais salvas do usuário
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true },
      });

      if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
        return res.status(400).json(jsend.fail({
          credentials: 'Nenhuma credencial AWS configurada. Configure suas credenciais primeiro.',
        }));
      }

      // Descriptografar credenciais
      const accessKey = encryptionService.decrypt(userSettings.awsAccessKey);
      const secretKey = encryptionService.decrypt(userSettings.awsSecretKey);
      const region = userSettings.awsRegion || 'us-east-1';

      // Buscar modelos disponíveis na AWS
      const bedrockProvider = new BedrockProvider(region);
      const apiKey = `${accessKey}:${secretKey}`;
      
      const awsModels = await bedrockProvider.getAvailableModels(apiKey);

      // Debug: Log all models from AWS
      console.log(`[ProvidersController] AWS returned ${awsModels.length} models`);
      console.log('[ProvidersController] AWS models:', awsModels.map(m => m.modelId));
      
      // Debug: Log registry count
      console.log(`[ProvidersController] Registry has ${ModelRegistry.count()} models`);
      console.log('[ProvidersController] Registry models:', ModelRegistry.getAll().map(m => m.modelId));

      // Filter only supported models using Model Registry
      const supportedModels = awsModels.filter(model => {
        const isSupported = ModelRegistry.isSupported(model.modelId);
        if (!isSupported) {
          console.log(`[ProvidersController] Model NOT in registry: ${model.modelId}`);
        }
        return isSupported;
      });
      
      console.log(`[ProvidersController] Filtered to ${supportedModels.length} supported models`);

      // Buscar modelos cadastrados no banco para enriquecer com informações de custo
      const dbModels = await prisma.aIModel.findMany({
        where: {
          provider: {
            slug: 'bedrock',
            isActive: true
          },
          isActive: true
        },
        select: {
          apiModelId: true,
          name: true,
          costPer1kInput: true,
          costPer1kOutput: true,
          contextWindow: true
        }
      });

      // Criar mapa de modelos do banco para lookup rápido
      const dbModelsMap = new Map(dbModels.map(m => [m.apiModelId, m]));

      // Combinar informações da AWS com informações do banco e registry
      const enrichedModels = supportedModels.map(awsModel => {
        const dbModel = dbModelsMap.get(awsModel.modelId);
        const registryMetadata = ModelRegistry.getModel(awsModel.modelId);
        
        return {
          id: awsModel.modelId,
          apiModelId: awsModel.modelId,
          name: dbModel?.name || registryMetadata?.displayName || awsModel.modelName,
          providerName: awsModel.providerName,
          vendor: registryMetadata?.vendor,
          description: registryMetadata?.description,
          costPer1kInput: dbModel?.costPer1kInput || 0,
          costPer1kOutput: dbModel?.costPer1kOutput || 0,
          contextWindow: dbModel?.contextWindow || registryMetadata?.capabilities.maxContextWindow || 0,
          inputModalities: awsModel.inputModalities,
          outputModalities: awsModel.outputModalities,
          responseStreamingSupported: awsModel.responseStreamingSupported,
          capabilities: registryMetadata?.capabilities,
          isInDatabase: !!dbModel,
          isInRegistry: !!registryMetadata
        };
      });

      // Filtrar apenas modelos de texto (TEXT input/output)
      const textModels = enrichedModels.filter(model =>
        model.inputModalities.includes('TEXT') &&
        model.outputModalities.includes('TEXT')
      );

      // Lista de provedores/modelos compatíveis com chat conversacional
      const chatCompatibleProviders = ['Anthropic', 'Meta', 'Mistral AI', 'Amazon', 'Cohere'];
      const chatCompatibleKeywords = ['claude', 'llama', 'mistral', 'titan', 'command'];
      
      // Filtrar apenas modelos compatíveis com chat
      const chatModels = textModels.filter(model => {
        const providerMatch = chatCompatibleProviders.includes(model.providerName);
        const nameMatch = chatCompatibleKeywords.some(keyword =>
          model.apiModelId.toLowerCase().includes(keyword) ||
          model.name.toLowerCase().includes(keyword)
        );
        return providerMatch || nameMatch;
      });

      logger.info('AWS Bedrock models fetched', {
        userId,
        region,
        totalModels: awsModels.length,
        textModels: textModels.length,
        chatModels: chatModels.length,
        timestamp: new Date().toISOString(),
      });

      return res.json(jsend.success({
        models: chatModels,
        totalCount: chatModels.length,
        region
      }));

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      logger.error('Error fetching AWS Bedrock models', {
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro ao buscar modelos AWS', 500));
    }
  },
};