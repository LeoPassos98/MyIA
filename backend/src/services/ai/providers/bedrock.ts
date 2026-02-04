// backend/src/services/ai/providers/bedrock.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  ThrottlingException,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BaseAIProvider, AIRequestOptions } from './base';
import { StreamChunk } from '../types';
import { AdapterFactory } from '../adapters';
import type { Message, UniversalOptions } from '../adapters';
import logger from '../../../utils/logger';
import { categorizeError } from '../certification/error-categorizer';

/**
 * Interface para erros do AWS SDK v3
 * Baseado na documentação oficial: https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md
 */
interface AWSBedrockError extends Error {
  // Metadados da requisição AWS
  $metadata?: {
    httpStatusCode?: number;        // Status HTTP da resposta
    requestId?: string;              // ID único da requisição (x-amzn-requestid)
    extendedRequestId?: string;      // ID estendido (usado em S3)
    cfId?: string;                   // CloudFront Distribution ID
    attempts?: number;               // Número de tentativas realizadas
    totalRetryDelay?: number;        // Delay total de retries em ms
  };
  
  // Tipo de falha: 'client' (erro do cliente) ou 'server' (erro do servidor)
  $fault?: 'client' | 'server';
  
  // Nome do serviço AWS que gerou o erro
  $service?: string;
  
  // Informações sobre retentativas
  $retryable?: {
    throttling?: boolean;            // Se o erro é devido a throttling
  };
  
  // Código do erro (ex: 'ValidationException', 'ThrottlingException')
  Code?: string;
  code?: string;  // Alguns erros usam minúscula
  
  // Tipo do erro
  Type?: string;
  
  // Nome do erro (ex: 'ResourceNotFoundException')
  name: string;
}

/**
 * Normaliza model ID removendo sufixos de context window
 *
 * AWS Bedrock não aceita sufixos no model ID. Esta função remove
 * sufixos conhecidos para garantir compatibilidade.
 *
 * Exemplos:
 *   amazon.nova-premier-v1:0:8k   → amazon.nova-premier-v1:0
 *   amazon.nova-premier-v1:0:20k  → amazon.nova-premier-v1:0
 *   amazon.nova-premier-v1:0:mm   → amazon.nova-premier-v1:0
 *   amazon.nova-lite-v1:0:300k    → amazon.nova-lite-v1:0
 *
 * @param modelId ID do modelo (pode conter sufixo)
 * @returns ID do modelo normalizado (sem sufixo)
 */
function normalizeModelId(modelId: string): string {
  // Remove sufixos conhecidos: :8k, :20k, :24k, :128k, :256k, :300k, :1000k, :mm
  return modelId.replace(/:(8k|20k|24k|128k|256k|300k|1000k|mm)$/i, '');
}

/**
 * Extrai prefixo regional para inference profile
 *
 * AWS usa prefixos específicos:
 * - us-east-1, us-west-2 → 'us'
 * - eu-central-1, eu-west-1 → 'eu'
 * - ap-southeast-1, ap-northeast-1 → 'apac' (não 'ap'!)
 *
 * @param region Região AWS (ex: 'us-east-1')
 * @returns Prefixo regional (ex: 'us', 'eu', 'apac')
 */
function getRegionPrefix(region: string): string {
  // Tratamento especial para regiões APAC
  if (region.startsWith('ap-')) {
    return 'apac';
  }
  
  // Outras regiões: extrair primeiro segmento
  return region.split('-')[0];
}

/**
 * Converte modelId para Inference Profile ID se necessário
 * @param modelId ID do modelo (pode conter sufixo)
 * @param _region Região AWS (ex: 'us-east-1')
 * @returns Inference Profile ID ou modelId original
 */
function getInferenceProfileId(modelId: string, _region: string): string {
  // Normalizar antes de processar
  const baseModelId = normalizeModelId(modelId);
  
  // Se já tem prefixo de região, retornar como está
  if (baseModelId.startsWith('us.') || baseModelId.startsWith('eu.')) {
    logger.info(`🔍 [getInferenceProfileId] Model already has regional prefix: ${baseModelId}`);
    return baseModelId;
  }
  
  // ✅ REATIVADO: Adicionar prefixo regional para modelos que requerem Inference Profile
  // Usando require() dinâmico para evitar dependência circular
  try {
    const { ModelRegistry } = require('../registry');
    const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
    
    logger.info(`🔍 [getInferenceProfileId] Platform rule for ${baseModelId}:`, platformRule);
    
    if (platformRule?.rule === 'requires_inference_profile') {
      // Usar system-defined inference profile
      const regionPrefix = getRegionPrefix(_region); // ✅ CORRETO: 'apac' para regiões ap-*
      const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
      logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId} (region: ${_region})`);
      return inferenceProfileId;
    }
  } catch (error) {
    logger.error(`❌ [getInferenceProfileId] Error loading ModelRegistry:`, error);
  }
  
  logger.info(`🔍 [getInferenceProfileId] No inference profile needed for: ${baseModelId}`);
  return baseModelId;
}

/**
 * Configuração de retry para rate limiting
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// Retry reduzido para 2 tentativas por variação de formato
// Total de tentativas: 6 (3 variações × 2 retries)
// Isso reduz latência mantendo resiliência adequada
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Utilitário para sleep
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class BedrockProvider extends BaseAIProvider {
  private region: string;
  private retryConfig: RetryConfig;

  constructor(region: string = 'us-east-1', retryConfig?: Partial<RetryConfig>) {
    super();
    this.region = region;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Detecta se o erro é de rate limiting
   */
  private isRateLimitError(error: any): boolean {
    // Verifica se é ThrottlingException do SDK
    if (error instanceof ThrottlingException) {
      return true;
    }
    
    // Verifica mensagens de erro conhecidas
    const errorMessage = error?.message?.toLowerCase() || '';
    const rateLimitKeywords = [
      'too many tokens',
      'rate limit',
      'throttling',
      'quota exceeded',
      'too many requests',
      'request limit',
    ];
    
    return rateLimitKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Calcula o delay para o próximo retry com backoff exponencial
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber),
      this.retryConfig.maxDelayMs
    );
    
    // Adiciona jitter (variação aleatória de ±20%) para evitar thundering herd
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  async *streamChat(
    messages: any[],
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    const [accessKeyId, secretAccessKey] = options.apiKey.split(':');

    if (!accessKeyId || !secretAccessKey) {
      yield {
        type: 'error',
        error: 'AWS credentials must be in format: ACCESS_KEY:SECRET_KEY',
      };
      return;
    }

    const client = new BedrockRuntimeClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Get adapter for this model
    let adapter;
    try {
      adapter = AdapterFactory.getAdapterForModel(options.modelId);
      logger.info(`🔍 [Bedrock] Using adapter: ${adapter.displayName} for model: ${options.modelId}`);
    } catch (_error) {
      yield {
        type: 'error',
        error: `Model ${options.modelId} is not supported. Please check the model ID.`,
      };
      return;
    }

    // Convert to universal format
    const universalMessages: Message[] = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const universalOptions: UniversalOptions = {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topK: options.topK,
      topP: options.topP,
      modelId: options.modelId, // Pass modelId for adapters that need it
    };

    // Format request using adapter
    const { body, contentType, accept } = adapter.formatRequest(
      universalMessages,
      universalOptions
    );

    // Normalizar model ID removendo sufixos de context window
    const originalModelId = options.modelId;
    const normalizedModelId = normalizeModelId(originalModelId);
    
    // Log se houve normalização
    if (normalizedModelId !== originalModelId) {
      logger.info(`🔄 [Bedrock] Normalized model ID: ${originalModelId} → ${normalizedModelId}`);
    }
    
    // Obter inference profile se necessário
    const modelIdWithProfile = getInferenceProfileId(normalizedModelId, this.region);
    
    // Verificar se modelo requer inference profile
    // Usando require() dinâmico para evitar dependência circular
    let requiresInferenceProfile = false;
    try {
      const { ModelRegistry } = require('../registry');
      const platformRule = ModelRegistry.getPlatformRules(normalizedModelId, 'bedrock');
      requiresInferenceProfile = platformRule?.rule === 'requires_inference_profile';
      
      if (requiresInferenceProfile) {
        logger.info(`🔍 [Bedrock] Model ${normalizedModelId} requires Inference Profile`);
      }
    } catch (error) {
      logger.debug(`[Bedrock] Could not check platform rules:`, error);
    }
    
    // 🧪 AUTO-TEST: Tentar múltiplas variações do modelId até encontrar a correta
    let modelIdVariations: string[];
    
    if (requiresInferenceProfile) {
      // Modelos que REQUEREM Inference Profile: tentar apenas com profile
      modelIdVariations = [modelIdWithProfile];
      logger.info(`🔍 [Bedrock] Model requires Inference Profile, using only: ${modelIdWithProfile}`);
    } else {
      // Modelos ON_DEMAND: tentar múltiplas variações
      modelIdVariations = [
        // Variação 1: Com inference profile (pode funcionar para alguns modelos)
        modelIdWithProfile,
        // Variação 2: Normalizado (sem sufixo) - formato padrão
        normalizedModelId,
        // Variação 3: Sem "2" (para modelos nova-2-*)
        normalizedModelId.replace('nova-2-', 'nova-'),
      ];
    }
    
    logger.info(`🔍 [Bedrock] Testing ${modelIdVariations.length} variations for: ${originalModelId}`);
    logger.debug(`[Bedrock] Variations: ${JSON.stringify(modelIdVariations)}`);
    
    let lastGlobalError: any = null;
    
    // Tentar cada variação
    for (let i = 0; i < modelIdVariations.length; i++) {
      const testModelId = modelIdVariations[i];
      logger.info(`🧪 [Bedrock] Trying variation ${i + 1}/${modelIdVariations.length}: ${testModelId}`);
      
      // Retry loop com backoff exponencial para esta variação
      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          const command = new InvokeModelWithResponseStreamCommand({
            modelId: testModelId,
            contentType: contentType || 'application/json',
            accept: accept || 'application/json',
            body: JSON.stringify(body),
          });

          const response = await client.send(command);

          if (!response.body) {
            logger.warn(`⚠️ [Bedrock Auto-Test] No response body for: ${testModelId}`);
            break; // Tenta próxima variação
          }

          // ✅ Stream bem-sucedido! Processa chunks
          logger.info(`✅ [Bedrock Auto-Test] SUCCESS with: ${testModelId}`);
          
          for await (const event of response.body) {
            if (event.chunk) {
              const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

              // Parse chunk using adapter
              const parsed = adapter.parseChunk(chunk);

              if (parsed.type === 'chunk' && parsed.content) {
                yield { type: 'chunk', content: parsed.content };
              } else if (parsed.type === 'done') {
                break;
              } else if (parsed.type === 'error') {
                yield { type: 'error', error: parsed.error || 'Unknown error from adapter' };
                break;
              }
            }
          }
          
          // Se chegou aqui, sucesso completo!
          return;
          
        } catch (error: unknown) {
          lastGlobalError = error;
          
          // Extrair todos os campos relevantes do erro AWS SDK v3
          const awsError = error as AWSBedrockError;
          const metadata = awsError?.$metadata || {};
          
          // Log detalhado do erro AWS com todos os campos disponíveis
          logger.error(`[BedrockProvider] AWS Error Details:`, {
            // Identificação do modelo e contexto
            modelId: testModelId,
            originalModelId: originalModelId,
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries + 1,
            
            // Informações básicas do erro
            errorName: awsError.name || awsError.constructor.name,
            errorMessage: awsError.message,
            errorCode: awsError.Code || awsError.code || awsError.name,
            errorType: awsError.Type || awsError.$fault,
            
            // $metadata - Metadados da requisição AWS
            metadata: {
              httpStatusCode: metadata.httpStatusCode,
              requestId: metadata.requestId,           // ID único da requisição AWS
              extendedRequestId: metadata.extendedRequestId, // ID estendido (S3)
              cfId: metadata.cfId,                     // CloudFront ID (se aplicável)
              attempts: metadata.attempts,             // Número de tentativas feitas
              totalRetryDelay: metadata.totalRetryDelay, // Delay total de retries (ms)
            },
            
            // Campos adicionais de erro AWS
            fault: awsError.$fault,                    // 'client' ou 'server'
            service: awsError.$service,                // Nome do serviço AWS
            retryable: awsError.$retryable,            // Info sobre retentativas
            
            // Stack trace completo para debug
            errorStack: awsError.stack,
            
            // Erro bruto serializado (para campos não mapeados)
            rawError: JSON.stringify(awsError, Object.getOwnPropertyNames(awsError)),
          });
          
          // Verifica se é erro de rate limiting
          if (this.isRateLimitError(error)) {
            const isLastAttempt = attempt === this.retryConfig.maxRetries;
            
            if (isLastAttempt) {
              logger.error(`[BedrockProvider] Rate limit após ${attempt + 1} tentativas para ${testModelId}:`, error);
              break; // Tenta próxima variação
            }
            
            // Calcula delay e aguarda antes do próximo retry
            const delayMs = this.calculateRetryDelay(attempt);
            logger.warn(
              `[BedrockProvider] Rate limit detectado (tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1}). ` +
              `Aguardando ${delayMs}ms antes de tentar novamente...`
            );
            
            // Informa o usuário sobre o retry
            yield {
              type: 'debug',
              log: `⏳ Rate limit detectado. Aguardando ${Math.round(delayMs / 1000)}s antes de tentar novamente... (Tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1})`,
            };
            
            await sleep(delayMs);
            continue; // Tenta novamente com o mesmo modelId
          }
          
          // Erro não é de rate limiting - tenta próxima variação
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          logger.warn(`⚠️ [Bedrock Auto-Test] Failed with ${testModelId}: ${errorMessage}`);
          break; // Tenta próxima variação
        }
      }
    }
    
    // Se chegou aqui, todas as variações falharam
    const errorMessage = lastGlobalError instanceof Error ? lastGlobalError.message : 'Erro desconhecido no AWS Bedrock';
    logger.error(`❌ [Bedrock] All ${modelIdVariations.length} variations failed for: ${originalModelId}`);
    logger.error(`[Bedrock] Variations tried: ${modelIdVariations.join(', ')}`);
    
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
    
    // Log detalhado para debug com metadata adicional
    logger.error(`[Bedrock] Error categorized as ${categorizedError.category} (severity: ${categorizedError.severity})`, {
      modelId: originalModelId,
      normalizedModelId: normalizedModelId,
      category: categorizedError.category,
      severity: categorizedError.severity,
      isTemporary: categorizedError.isTemporary,
      requiresInferenceProfile: requiresInferenceProfile,
      variationsTried: modelIdVariations,
      originalError: errorMessage
    });
    
    // Criar erro estruturado com metadata
    const structuredError = new Error(
      `Model ${originalModelId} failed all ${modelIdVariations.length} variations. ` +
      `Last error: ${categorizedError.message}. ` +
      `This model may require provisioning or have configuration issues.`
    ) as any;
    
    structuredError.modelId = originalModelId;
    structuredError.normalizedModelId = normalizedModelId;
    structuredError.variationsTried = modelIdVariations;
    structuredError.lastError = categorizedError;
    structuredError.requiresInferenceProfile = requiresInferenceProfile;
    
    // Log erro estruturado
    logger.error(`[Bedrock] Structured error details:`, {
      message: structuredError.message,
      modelId: structuredError.modelId,
      normalizedModelId: structuredError.normalizedModelId,
      variationsTried: structuredError.variationsTried,
      requiresInferenceProfile: structuredError.requiresInferenceProfile,
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

  // Novo método para obter contagem de modelos (usado na validação)
  async getModelsCount(apiKey: string): Promise<number> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    const client = new BedrockClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const response = await client.send(new ListFoundationModelsCommand({}));
    return response.modelSummaries?.length || 0;
  }

  // Novo método para obter lista completa de modelos disponíveis na AWS
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

// Exportar função para testes
export { getRegionPrefix };
