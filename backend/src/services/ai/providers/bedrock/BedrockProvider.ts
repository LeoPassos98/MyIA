// backend/src/services/ai/providers/bedrock/BedrockProvider.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  BedrockRuntimeClient,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BaseAIProvider, AIRequestOptions } from '../base';
import { StreamChunk } from '../../types';
import { AdapterFactory } from '../../adapters';
import type { Message, UniversalOptions } from '../../adapters';
import logger from '../../../../utils/logger';
import { categorizeError } from '../../certification/error-categorizer';

// Importar módulos modularizados
import { deploymentService, InferenceType } from '../../../models';
import { ModelIdNormalizer, InferenceProfileResolver, ModelIdVariationGenerator } from './modelId';
import { RateLimitDetector, AWSErrorParser } from './errors';
import { RetryStrategy, RetryConfig } from './retry';
import { StreamProcessor, StreamConfig } from './streaming';

// Importar novos services de models (Clean Slate)

/**
 * Configuração padrão de retry
 * 
 * Retry reduzido para 2 tentativas por variação de formato
 * Total de tentativas: 6 (3 variações × 2 retries)
 * Isso reduz latência mantendo resiliência adequada
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  backoff: {
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterPercent: 0.2,
  },
};

/**
 * Provider AWS Bedrock modularizado
 * 
 * **REFATORADO** - Loop triplo aninhado desacoplado em módulos especializados
 * 
 * Arquitetura:
 * - ModelId: Normalização, resolução de inference profile, geração de variações
 * - Errors: Parse de erros AWS, detecção de rate limit
 * - Retry: Estratégia de retry reutilizável com backoff exponencial
 * - Streaming: Processamento de chunks e stream completo
 * 
 * Redução de complexidade:
 * - Antes: 553 linhas, complexidade ciclomática 38
 * - Depois: ~200 linhas, complexidade ciclomática < 10
 */
export class BedrockProvider extends BaseAIProvider {
  private region: string;
  private retryStrategy: RetryStrategy;
  
  // Módulos especializados
  private readonly modelIdNormalizer: ModelIdNormalizer;
  private readonly inferenceProfileResolver: InferenceProfileResolver;
  private readonly variationGenerator: ModelIdVariationGenerator;
  private readonly rateLimitDetector: RateLimitDetector;
  private readonly errorParser: AWSErrorParser;
  private readonly streamProcessor: StreamProcessor;

  constructor(region: string = 'us-east-1', retryConfig?: Partial<RetryConfig>) {
    super();
    this.region = region;
    
    // Inicializar retry strategy
    const fullRetryConfig = retryConfig 
      ? { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
      : DEFAULT_RETRY_CONFIG;
    this.retryStrategy = new RetryStrategy(fullRetryConfig);
    
    // Inicializar módulos especializados
    this.modelIdNormalizer = new ModelIdNormalizer();
    this.inferenceProfileResolver = new InferenceProfileResolver(this.modelIdNormalizer);
    this.variationGenerator = new ModelIdVariationGenerator(
      this.modelIdNormalizer,
      this.inferenceProfileResolver
    );
    this.rateLimitDetector = new RateLimitDetector();
    this.errorParser = new AWSErrorParser();
    this.streamProcessor = new StreamProcessor();
  }

  async *streamChat(
    messages: Array<{ role: string; content: string }>,
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    // Validar credenciais
    const [accessKeyId, secretAccessKey] = options.apiKey.split(':');

    if (!accessKeyId || !secretAccessKey) {
      yield {
        type: 'error',
        error: 'AWS credentials must be in format: ACCESS_KEY:SECRET_KEY',
      };
      return;
    }

    // Criar cliente AWS
    const client = new BedrockRuntimeClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Obter adapter para o modelo
    let adapter;
    try {
      adapter = AdapterFactory.getAdapterForModel(options.modelId);
      logger.info(`🔍 [Bedrock] Using adapter: ${adapter.displayName} for model: ${options.modelId}`);
    } catch {
      yield {
        type: 'error',
        error: `Model ${options.modelId} is not supported. Please check the model ID.`,
      };
      return;
    }

    // Converter para formato universal
    const universalMessages: Message[] = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const universalOptions: UniversalOptions = {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topK: options.topK,
      topP: options.topP,
      modelId: options.modelId,
    };

    // Formatar requisição usando adapter
    const { body, contentType, accept } = adapter.formatRequest(
      universalMessages,
      universalOptions
    );

    // Normalizar model ID
    const originalModelId = options.modelId;
    const normalizedModelId = this.modelIdNormalizer.normalize(originalModelId);
    
    if (normalizedModelId !== originalModelId) {
      logger.info(`🔄 [Bedrock] Normalized model ID: ${originalModelId} → ${normalizedModelId}`);
    }
    
    // Verificar se modelo requer inference profile
    // REFATORADO: Usa novos services de models com fallback para registry antigo
    const requiresInferenceProfile = await this.checkRequiresInferenceProfile(normalizedModelId);
    
    // Gerar variações de model ID para auto-test
    const variations = await this.variationGenerator.generate(
      originalModelId,
      requiresInferenceProfile,
      this.region
    );
    
    logger.info(`🔍 [Bedrock] Testing ${variations.length} variations for: ${originalModelId}`);
    logger.debug(`[Bedrock] Variations:`, variations.map(v => v.modelId));
    
    // Tentar cada variação
    let lastGlobalError: unknown = null;
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      logger.info(
        `🧪 [Bedrock] Trying variation ${i + 1}/${variations.length}: ${variation.modelId} ` +
        `(${variation.type})`
      );
      
      // Executar com retry strategy
      const result = await this.retryStrategy.executeWithRetry({
        execute: async () => {
          // Processar stream usando StreamProcessor
          const streamConfig: StreamConfig = {
            client,
            modelId: variation.modelId,
            body,
            adapter,
            contentType,
            accept,
          };
          
          return this.streamProcessor.collectStream(streamConfig);
        },
        
        shouldRetry: (error) => this.rateLimitDetector.isRateLimit(error),
        
        onRetry: (attempt, delay, error) => {
          const parsed = this.errorParser.parse(error);
          logger.warn(
            `[Bedrock] Rate limit detected (attempt ${attempt + 1}). ` +
            `Waiting ${delay}ms... (Request ID: ${parsed.requestId})`
          );
        },
      });
      
      // Se sucesso, retornar chunks
      if (result.success && result.result?.success) {
        logger.info(`✅ [Bedrock] SUCCESS with variation: ${variation.modelId}`);
        
        // Yield todos os chunks
        for (const chunk of result.result.chunks || []) {
          yield chunk;
        }
        
        return; // Sucesso completo!
      }
      
      // Falhou - guardar erro e tentar próxima variação
      lastGlobalError = result.error || result.result?.error;
      
      const errorMessage = lastGlobalError instanceof Error
        ? lastGlobalError.message
        : 'Unknown error';
      logger.warn(`⚠️ [Bedrock] Failed with ${variation.modelId}: ${errorMessage}`);
    }
    
    // Se chegou aqui, todas as variações falharam
    yield* this.handleAllVariationsFailed(
      originalModelId,
      normalizedModelId,
      variations.map(v => v.modelId),
      requiresInferenceProfile,
      lastGlobalError
    );
  }

  /**
   * Verifica se o modelo requer Inference Profile
   * 
   * REFATORADO (Clean Slate): Usa novos services de models com fallback para registry antigo
   * 
   * Ordem de verificação:
   * 1. Tenta buscar no banco via deploymentService (novo schema v2)
   * 2. Se não encontrar, faz fallback para ModelRegistry (antigo)
   * 
   * @param modelId - ID do modelo normalizado
   * @returns true se requer inference profile
   */
  private async checkRequiresInferenceProfile(modelId: string): Promise<boolean> {
    // Schema v2: Usar deploymentService como fonte de verdade
    // ModelRegistry foi removido - usar apenas banco de dados
    try {
      // Buscar provider Bedrock
      const { prisma } = await import('../../../../lib/prisma');
      const bedrockProvider = await prisma.provider.findUnique({
        where: { slug: 'bedrock' }
      });
      
      if (bedrockProvider) {
        // Buscar deployment pelo deploymentId
        const deployment = await deploymentService.findByDeploymentId(
          bedrockProvider.id,
          modelId,
          false, // includeBaseModel
          false, // includeProvider
          false  // includeCertifications
        );
        
        if (deployment) {
          const requiresProfile = deployment.inferenceType === InferenceType.INFERENCE_PROFILE;
          
          if (requiresProfile) {
            logger.info(`🔍 [Bedrock] Model ${modelId} requires Inference Profile (from DB)`);
          }
          
          return requiresProfile;
        }
      }
    } catch (error) {
      logger.debug(`[Bedrock] Could not check deployment in DB:`, error);
    }
    
    // Schema v2: ModelRegistry foi removido
    // Se não encontrar no banco, assumir que não requer inference profile
    // Modelos novos devem ser cadastrados no banco com inferenceType correto
    logger.debug(`[Bedrock] Model ${modelId} not found in DB, assuming ON_DEMAND`);
    
    // Default: não requer inference profile
    return false;
  }

  /**
   * Trata caso onde todas as variações falharam
   */
  private async *handleAllVariationsFailed(
    originalModelId: string,
    normalizedModelId: string,
    variationsTried: string[],
    requiresInferenceProfile: boolean,
    lastError: unknown
  ): AsyncGenerator<StreamChunk> {
    const errorMessage = lastError instanceof Error 
      ? lastError.message 
      : 'Erro desconhecido no AWS Bedrock';
    
    logger.error(`❌ [Bedrock] All ${variationsTried.length} variations failed for: ${originalModelId}`);
    logger.error(`[Bedrock] Variations tried: ${variationsTried.join(', ')}`);
    
    // Categorizar erro para mensagem amigável
    const categorizedError = categorizeError(errorMessage);
    
    // Formatar mensagem amigável com sugestões
    let friendlyMessage = `❌ ${categorizedError.message}\n\n`;
    
    if (categorizedError.suggestedActions.length > 0) {
      friendlyMessage += 'Sugestões:\n';
      categorizedError.suggestedActions.forEach((action, index) => {
        friendlyMessage += `${index + 1}. ${action}\n`;
      });
    }
    
    // Log detalhado para debug
    logger.error(`[Bedrock] Error categorized as ${categorizedError.category} (severity: ${categorizedError.severity})`, {
      modelId: originalModelId,
      normalizedModelId,
      category: categorizedError.category,
      severity: categorizedError.severity,
      isTemporary: categorizedError.isTemporary,
      requiresInferenceProfile,
      variationsTried,
      originalError: errorMessage,
    });
    
    yield {
      type: 'error',
      error: friendlyMessage.trim(),
    };
  }

  async validateKey(apiKey: string): Promise<boolean> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    if (!accessKeyId || !secretAccessKey) return false;

    try {
      const client = new BedrockClient({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });

      // Dry run real: ListFoundationModelsCommand
      await client.send(new ListFoundationModelsCommand({}));
      return true;
    } catch {
      return false;
    }
  }

  async getModelsCount(apiKey: string): Promise<number> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    const client = new BedrockClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const response = await client.send(new ListFoundationModelsCommand({}));
    return response.modelSummaries?.length || 0;
  }

  async getAvailableModels(apiKey: string): Promise<Array<{
    modelId: string;
    modelName: string;
    providerName: string;
    inputModalities: string[];
    outputModalities: string[];
    responseStreamingSupported: boolean;
  }>> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    const client = new BedrockClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const response = await client.send(new ListFoundationModelsCommand({}));
    
    if (!response.modelSummaries) {
      return [];
    }

    return response.modelSummaries.map(model => ({
      modelId: model.modelId || '',
      modelName: model.modelName || '',
      providerName: model.providerName || '',
      inputModalities: model.inputModalities || [],
      outputModalities: model.outputModalities || [],
      responseStreamingSupported: model.responseStreamingSupported || false,
    }));
  }
}

// Exportar para backward compatibility
export { InferenceProfileResolver } from './modelId/InferenceProfileResolver';
