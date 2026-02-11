// backend/src/services/providers/aws-models.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { BedrockProvider } from '../ai/providers/bedrock';
import { logger } from '../../utils/logger';
import { modelCacheService } from '../models/modelCacheService';
import { EnrichedModel, AWSModel } from '../../types/providers';
import { AWSCredentialsService } from './aws-credentials.service';

/**
 * Service para busca e enriquecimento de modelos AWS disponíveis
 * Responsabilidade: Buscar modelos AWS, enriquecer com dados do banco
 *
 * Clean Slate v2:
 * - Usa modelCacheService.getAllActiveDeployments() como fonte primária
 * - Usa BaseModel e ModelDeployment do schema v2
 */
export class AWSModelsService {
  private credentialsService: AWSCredentialsService;

  constructor(credentialsService?: AWSCredentialsService) {
    this.credentialsService = credentialsService || new AWSCredentialsService();
  }

  /**
   * Busca modelos disponíveis na conta AWS do usuário
   * - Recupera credenciais
   * - Chama AWS Bedrock API
   * - Filtra por suportados (ModelRegistry ou deployments do banco)
   * - Enriquece com dados do banco e registry
   * - Filtra por modalidades e compatibilidade
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição (para logging)
   * @returns Lista de modelos enriquecidos
   */
  async getAvailableModels(
    userId: string,
    requestId?: string
  ): Promise<EnrichedModel[]> {
    logger.info('Iniciando busca de modelos AWS disponíveis', {
      requestId,
      userId
    });

    // 1. Recuperar credenciais
    const credentials = await this.credentialsService.getDecryptedCredentials(
      userId,
      requestId
    );

    if (!credentials) {
      throw new Error('Nenhuma credencial AWS configurada. Configure suas credenciais primeiro.');
    }

    // 2. Buscar modelos disponíveis na AWS
    const bedrockProvider = new BedrockProvider(credentials.region);
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    
    const awsModels = await bedrockProvider.getAvailableModels(apiKey);
    
    // 3. Buscar deployments do banco via cache (Clean Slate v2)
    const cachedDeployments = await modelCacheService.getAllActiveDeployments(true, true);
    const deploymentCount = cachedDeployments.length;
    
    logger.info('Modelos AWS Bedrock obtidos', {
      requestId,
      userId,
      region: credentials.region,
      totalModels: awsModels.length,
      cachedDeployments: deploymentCount
    });

    // 4. Filtrar apenas modelos suportados (no registry ou no banco)
    const supportedModels = this.filterSupportedModels(awsModels, cachedDeployments, requestId);

    // 5. Enriquecer com dados do banco e registry
    const enrichedModels = await this.enrichModels(supportedModels, cachedDeployments, requestId);

    // 6. Filtrar apenas modelos de chat (TEXT input/output)
    const chatModels = this.filterChatModels(enrichedModels, requestId);

    logger.info('AWS Bedrock models fetched', {
      requestId,
      userId,
      region: credentials.region,
      totalModels: awsModels.length,
      supportedModels: supportedModels.length,
      enrichedModels: enrichedModels.length,
      chatModels: chatModels.length
    });

    return chatModels;
  }

  /**
   * Filtra apenas modelos suportados (presentes no banco)
   *
   * Clean Slate v2:
   * - Verifica no cache de deployments
   *
   * @param awsModels - Modelos retornados pela AWS
   * @param cachedDeployments - Deployments do cache
   * @param requestId - ID da requisição
   * @returns Modelos suportados
   */
  private filterSupportedModels(
    awsModels: AWSModel[],
    cachedDeployments: Awaited<ReturnType<typeof modelCacheService.getAllActiveDeployments>>,
    requestId?: string
  ): AWSModel[] {
    // Criar set de deploymentIds do banco para lookup rápido
    const deploymentIds = new Set(cachedDeployments.map(d => d.deploymentId));
    
    return awsModels.filter(model => {
      // Verificar no banco (Clean Slate v2)
      const isInDatabase = deploymentIds.has(model.modelId);
      
      if (!isInDatabase) {
        logger.debug('Modelo não está no banco', {
          requestId,
          modelId: model.modelId
        });
      }
      return isInDatabase;
    });
  }

  /**
   * Enriquece modelos AWS com dados do banco
   *
   * Clean Slate v2:
   * - Usa ModelDeployment e BaseModel do cache
   *
   * @param awsModels - Modelos AWS filtrados
   * @param cachedDeployments - Deployments do cache
   * @param requestId - ID da requisição
   * @returns Modelos enriquecidos
   */
  private async enrichModels(
    awsModels: AWSModel[],
    cachedDeployments: Awaited<ReturnType<typeof modelCacheService.getAllActiveDeployments>>,
    requestId?: string
  ): Promise<EnrichedModel[]> {
    // Criar mapa de deployments do banco para lookup rápido
    const deploymentsMap = new Map(
      cachedDeployments.map(d => [d.deploymentId, d])
    );

    logger.debug('Enriquecendo modelos', {
      requestId,
      awsModelsCount: awsModels.length,
      deploymentsCount: cachedDeployments.length
    });

    // Combinar informações da AWS com informações do banco
    return awsModels.map(awsModel => {
      const deployment = deploymentsMap.get(awsModel.modelId);
      
      // Extrair capabilities do BaseModel (Clean Slate v2)
      const baseModelCapabilities = deployment?.baseModel?.capabilities as {
        maxContextWindow?: number;
        maxOutputTokens?: number;
        vision?: boolean;
        functionCalling?: boolean;
        streaming?: boolean;
      } | undefined;
      
      // Custos: usar do deployment (1M tokens) convertido para 1k tokens para compatibilidade
      // Schema v2 usa costPer1MInput/Output, interface antiga usa costPer1kInput/Output
      const costPer1kInput = deployment
        ? deployment.costPer1MInput / 1000
        : 0;
      const costPer1kOutput = deployment
        ? deployment.costPer1MOutput / 1000
        : 0;
      
      return {
        id: awsModel.modelId,
        apiModelId: awsModel.modelId,
        name: deployment?.baseModel?.name || awsModel.modelName,
        providerName: awsModel.providerName,
        vendor: deployment?.baseModel?.vendor,
        description: deployment?.baseModel?.description,
        costPer1kInput,
        costPer1kOutput,
        contextWindow: baseModelCapabilities?.maxContextWindow || 0,
        inputModalities: awsModel.inputModalities,
        outputModalities: awsModel.outputModalities,
        responseStreamingSupported: awsModel.responseStreamingSupported,
        capabilities: {
          maxContextWindow: baseModelCapabilities?.maxContextWindow,
          maxOutputTokens: baseModelCapabilities?.maxOutputTokens,
          vision: baseModelCapabilities?.vision,
          functionCalling: baseModelCapabilities?.functionCalling
        },
        isInDatabase: !!deployment
      };
    });
  }

  /**
   * Filtra apenas modelos compatíveis com chat
   * - TEXT input/output
   * - Providers compatíveis (Anthropic, Meta, Mistral, Amazon, Cohere)
   * 
   * @param models - Modelos enriquecidos
   * @param requestId - ID da requisição
   * @returns Modelos de chat
   */
  private filterChatModels(
    models: EnrichedModel[],
    requestId?: string
  ): EnrichedModel[] {
    // Filtrar apenas modelos de texto (TEXT input/output)
    const textModels = models.filter(model =>
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

    logger.debug('Modelos filtrados por chat', {
      requestId,
      totalModels: models.length,
      textModels: textModels.length,
      chatModels: chatModels.length
    });

    return chatModels;
  }
}
