// backend/src/controllers/providersController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import { encryptionService } from '../services/encryptionService';
import { BedrockProvider } from '../services/ai/providers/bedrock';
import { jsend } from '../utils/jsend';
import { AppError } from '../middleware/errorHandler';
import { ModelRegistry } from '../services/ai/registry';
import winston from 'winston';
import { VendorGroup, CertificationInfo } from '../types/vendors';

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

      // ✅ LOG DETALHADO: Request recebido
      console.log('\n🔍 [validateAWS] ========== INÍCIO DA VALIDAÇÃO ==========');
      console.log('📥 [validateAWS] Request body recebido:', {
        hasAccessKey: !!req.body.accessKey,
        accessKeyLength: req.body.accessKey?.length,
        accessKeyPrefix: req.body.accessKey?.substring(0, 4),
        hasSecretKey: !!req.body.secretKey,
        secretKeyLength: req.body.secretKey?.length,
        region: req.body.region,
        useStoredCredentials: req.body.useStoredCredentials
      });

      // Validação já foi feita pelo middleware validateRequest
      // Apenas pegar o config do body
      const config = req.body;
      console.log('✅ [validateAWS] Config recebido:', {
        region: config.region,
        hasAccessKey: !!config.accessKey,
        useStoredCredentials: config.useStoredCredentials
      });

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
      // ✅ LOG DETALHADO: Capturar erro de validação Zod
      console.log('\n❌ [validateAWS] ========== ERRO NA VALIDAÇÃO ==========');
      console.log('❌ [validateAWS] Tipo do erro:', error?.constructor?.name);
      
      // Se for erro de validação Zod, exibir detalhes
      if (error?.constructor?.name === 'ZodError') {
        const zodError = error as any;
        console.log('❌ [validateAWS] Erro de validação Zod:', JSON.stringify(zodError.errors, null, 2));
        return res.status(400).json(jsend.fail({
          validation: 'Dados inválidos',
          errors: zodError.errors
        }));
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      console.log('❌ [validateAWS] Erro inesperado:', err.message);
      console.log('❌ [validateAWS] Stack:', err.stack);
      
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

  /**
   * GET /api/providers/by-vendor
   * Retorna modelos agrupados por vendor com disponibilidade em múltiplos providers
   */
  async getByVendor(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      console.log('[providersController.getByVendor] Iniciando busca de vendors para usuário:', userId);
      
      // 1. Buscar configurações do usuário para filtrar modelos habilitados
      const settings = await prisma.userSettings.findUnique({
        where: { userId }
      });
      
      // 2. Buscar validação AWS
      const awsValidation = await prisma.providerCredentialValidation.findUnique({
        where: { userId_provider: { userId, provider: 'bedrock' } }
      });
      
      console.log('[providersController.getByVendor] AWS enabled models:', settings?.awsEnabledModels?.length || 0);
      console.log('[providersController.getByVendor] AWS validation status:', awsValidation?.status);
      
      // 3. Buscar todos os providers ativos
      const allProviders = await prisma.aIProvider.findMany({
        where: { isActive: true },
        include: {
          models: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        }
      });
      
      console.log(`[providersController.getByVendor] Encontrados ${allProviders.length} providers ativos`);
      
      // 4. Filtrar providers baseado em configuração (mesma lógica do /configured)
      const providers = allProviders.filter(provider => {
        // Providers padrão (sempre disponíveis)
        if (['openai', 'groq', 'together'].includes(provider.slug)) {
          return true;
        }
        
        // AWS Bedrock: só mostrar se validado E com modelos habilitados
        if (provider.slug === 'bedrock') {
          if (awsValidation?.status === 'valid' && settings?.awsEnabledModels?.length) {
            // Filtrar apenas modelos habilitados pelo usuário
            const existingModels = provider.models.filter(m =>
              settings.awsEnabledModels.includes(m.apiModelId)
            );
            
            // Criar modelos dinâmicos para IDs que não existem no banco
            const missingModelIds = settings.awsEnabledModels.filter(
              (modelId: string) => !provider.models.some(m => m.apiModelId === modelId)
            );
            
            const dynamicModels = missingModelIds.map((apiModelId: string) => ({
              id: `dynamic-${apiModelId}`,
              name: apiModelId.split('.').pop()?.replace(/-/g, ' ').toUpperCase() || apiModelId,
              apiModelId,
              contextWindow: 200000,
              costPer1kInput: 0,
              costPer1kOutput: 0,
              isActive: true,
              providerId: provider.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }));
            
            provider.models = [...existingModels, ...dynamicModels];
            
            console.log('[providersController.getByVendor] Bedrock modelos filtrados:', provider.models.length);
            console.log('[providersController.getByVendor] Bedrock IDs:', provider.models.map(m => m.apiModelId));
            
            return provider.models.length > 0;
          }
          console.log('[providersController.getByVendor] Bedrock excluído: não validado ou sem modelos habilitados');
          return false;
        }
        
        return true;
      });
      
      console.log(`[providersController.getByVendor] Providers configurados: ${providers.length}`);
      
      // 2. Agrupar modelos por vendor
      const vendorMap = new Map<string, VendorGroup>();
      
      for (const provider of providers) {
        console.log(`[providersController.getByVendor] Processando provider: ${provider.slug} (${provider.models.length} modelos)`);
        
        for (const model of provider.models) {
          // Extrair vendor do apiModelId ou usar campo vendor se existir
          const vendor = extractVendor(model.apiModelId);
          
          if (!vendorMap.has(vendor)) {
            vendorMap.set(vendor, {
              id: vendor,
              name: getVendorName(vendor),
              slug: vendor,
              logo: `/assets/vendors/${vendor}.svg`,
              models: []
            });
            console.log(`[providersController.getByVendor] Novo vendor criado: ${vendor}`);
          }
          
          const vendorGroup = vendorMap.get(vendor)!;
          
          // Verificar se modelo já existe no grupo
          let existingModel = vendorGroup.models.find(m => m.apiModelId === model.apiModelId);
          
          if (!existingModel) {
            // Buscar metadata do registry
            const registryMetadata = ModelRegistry.getModel(model.apiModelId);
            
            existingModel = {
              id: model.id,
              name: model.name,
              apiModelId: model.apiModelId,
              contextWindow: model.contextWindow,
              maxOutputTokens: registryMetadata?.capabilities.maxOutputTokens,
              version: extractVersion(model.apiModelId),
              availableOn: [],
              capabilities: registryMetadata ? {
                supportsVision: registryMetadata.capabilities.vision,
                supportsPromptCache: false, // TODO: adicionar ao registry
                supportsFunctionCalling: registryMetadata.capabilities.functionCalling
              } : undefined,
              pricing: {
                inputPer1M: model.costPer1kInput * 1000,
                outputPer1M: model.costPer1kOutput * 1000,
                // TODO: adicionar cache pricing ao banco
                cacheReadPer1M: undefined,
                cacheWritePer1M: undefined
              }
            };
            vendorGroup.models.push(existingModel);
            console.log(`[providersController.getByVendor] Novo modelo adicionado: ${model.apiModelId}`);
          }
          
          // Adicionar provider availability
          const certification = await getCertificationForModel(model.apiModelId, provider.slug);
          
          existingModel.availableOn.push({
            providerSlug: provider.slug,
            providerName: provider.name,
            isConfigured: true, // Se está na lista, está configurado
            certification
          });
        }
      }
      
      // 3. Converter Map para Array e ordenar
      const vendors = Array.from(vendorMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      
      console.log(`[providersController.getByVendor] Total de vendors: ${vendors.length}`);
      console.log(`[providersController.getByVendor] Vendors: ${vendors.map(v => v.name).join(', ')}`);
      
      return res.status(200).json(jsend.success({ vendors }));
      
    } catch (error) {
      console.error('[providersController.getByVendor] Erro ao buscar vendors:', error);
      if (error instanceof AppError) {
        throw error;
      }
      const err = isError(error) ? error : new Error(String(error));
      logger.error('Erro ao buscar vendors', {
        userId: req.userId,
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json(jsend.error('Erro ao buscar vendors', 500));
    }
  },
};

/**
 * Extrai vendor do apiModelId
 * Ex: "anthropic.claude-sonnet-4" → "anthropic"
 */
function extractVendor(apiModelId: string): string {
  // Padrão: vendor.model-name
  const parts = apiModelId.split('.');
  return parts[0] || 'unknown';
}

/**
 * Retorna nome amigável do vendor
 */
function getVendorName(vendor: string): string {
  const names: Record<string, string> = {
    'anthropic': 'Anthropic',
    'amazon': 'Amazon',
    'cohere': 'Cohere',
    'meta': 'Meta',
    'mistral': 'Mistral AI'
  };
  return names[vendor] || vendor.charAt(0).toUpperCase() + vendor.slice(1);
}

/**
 * Extrai versão do apiModelId
 * Ex: "anthropic.claude-sonnet-4-20250514-v1:0" → "4.0"
 */
function extractVersion(apiModelId: string): string | undefined {
  // Tentar extrair versão do nome
  const versionMatch = apiModelId.match(/v(\d+):(\d+)/);
  if (versionMatch) {
    return `${versionMatch[1]}.${versionMatch[2]}`;
  }
  
  // Tentar extrair do nome do modelo
  const modelMatch = apiModelId.match(/-([\d.]+)-/);
  if (modelMatch) {
    return modelMatch[1];
  }
  
  return undefined;
}

/**
 * Busca certificação do modelo em um provider específico
 */
async function getCertificationForModel(
  modelId: string,
  providerSlug: string
): Promise<CertificationInfo | null> {
  try {
    const fullModelId = `${providerSlug}:${modelId}`;
    
    const cert = await prisma.modelCertification.findFirst({
      where: { modelId: fullModelId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!cert) return null;
    
    return {
      status: cert.status,
      successRate: cert.successRate,
      lastChecked: cert.createdAt.toISOString()
    };
  } catch {
    return null;
  }
}