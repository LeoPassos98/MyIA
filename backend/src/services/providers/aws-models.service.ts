// backend/src/services/providers/aws-models.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { BedrockProvider } from '../ai/providers/bedrock';
import { ModelRegistry } from '../ai/registry';
import logger from '../../utils/logger';
import { AWSCredentialsService } from './aws-credentials.service';
import { EnrichedModel, AWSModel, DBModel } from '../../types/providers';

/**
 * Service para busca e enriquecimento de modelos AWS disponíveis
 * Responsabilidade: Buscar modelos AWS, enriquecer com dados do banco e registry
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
   * - Filtra por suportados (ModelRegistry)
   * - Enriquece com dados do banco
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
    
    logger.info('Modelos AWS Bedrock obtidos', {
      requestId,
      userId,
      region: credentials.region,
      totalModels: awsModels.length,
      registryModels: ModelRegistry.count()
    });

    // 3. Filtrar apenas modelos suportados (no registry)
    const supportedModels = this.filterSupportedModels(awsModels, requestId);

    // 4. Enriquecer com dados do banco e registry
    const enrichedModels = await this.enrichModels(supportedModels, requestId);

    // 5. Filtrar apenas modelos de chat (TEXT input/output)
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
   * Filtra apenas modelos suportados (presentes no ModelRegistry)
   * 
   * @param awsModels - Modelos retornados pela AWS
   * @param requestId - ID da requisição
   * @returns Modelos suportados
   */
  private filterSupportedModels(
    awsModels: AWSModel[],
    requestId?: string
  ): AWSModel[] {
    return awsModels.filter(model => {
      const isSupported = ModelRegistry.isSupported(model.modelId);
      if (!isSupported) {
        logger.debug('Modelo não está no registry', {
          requestId,
          modelId: model.modelId
        });
      }
      return isSupported;
    });
  }

  /**
   * Enriquece modelos AWS com dados do banco e registry
   * 
   * @param awsModels - Modelos AWS filtrados
   * @param requestId - ID da requisição
   * @returns Modelos enriquecidos
   */
  private async enrichModels(
    awsModels: AWSModel[],
    requestId?: string
  ): Promise<EnrichedModel[]> {
    // Buscar modelos cadastrados no banco
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
    const dbModelsMap = new Map<string, DBModel>(
      dbModels.map(m => [m.apiModelId, m])
    );

    logger.debug('Enriquecendo modelos', {
      requestId,
      awsModelsCount: awsModels.length,
      dbModelsCount: dbModels.length
    });

    // Combinar informações da AWS com informações do banco e registry
    return awsModels.map(awsModel => {
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
