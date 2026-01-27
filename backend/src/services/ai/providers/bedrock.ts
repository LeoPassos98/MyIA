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
import { ModelRegistry } from '../registry';
import type { Message, UniversalOptions } from '../adapters';
import logger from '../../../utils/logger';

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
 * Converte modelId para Inference Profile ID se necessário
 * @param modelId ID do modelo (pode conter sufixo)
 * @param region Região AWS (ex: 'us-east-1')
 * @returns Inference Profile ID ou modelId original
 */
function getInferenceProfileId(modelId: string, region: string): string {
  // Normalizar antes de processar
  const baseModelId = normalizeModelId(modelId);
  
  // Se já tem prefixo de região, retornar como está
  if (baseModelId.startsWith('us.') || baseModelId.startsWith('eu.')) {
    return baseModelId;
  }
  
  // Check if model requires inference profile using registry
  const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
  
  if (platformRule?.rule === 'requires_inference_profile') {
    // Usar system-defined inference profile
    const regionPrefix = region.split('-')[0]; // 'us' de 'us-east-1'
    const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
    logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId} (region: ${region})`);
    return inferenceProfileId;
  }
  
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
    
    // 🧪 AUTO-TEST: Tentar múltiplas variações do modelId até encontrar a correta
    const modelIdVariations = [
      // Variação 1: Normalizado (sem sufixo)
      normalizedModelId,
      // Variação 2: Com inference profile
      modelIdWithProfile,
      // Variação 3: Sem "2" (para modelos nova-2-*)
      normalizedModelId.replace('nova-2-', 'nova-'),
    ];
    
    logger.info(`🧪 [Bedrock Auto-Test] Testing ${modelIdVariations.length} variations for: ${originalModelId}`);
    
    let lastGlobalError: any = null;
    
    // Tentar cada variação
    for (const testModelId of modelIdVariations) {
      logger.info(`🔍 [Bedrock Auto-Test] Trying: ${testModelId}`);
      
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
    logger.error(`❌ [Bedrock Auto-Test] All ${modelIdVariations.length} variations failed for: ${originalModelId}`);
    yield {
      type: 'error',
      error: `Falha ao invocar modelo ${originalModelId}. Tentativas: ${modelIdVariations.length} variações. Erro: ${errorMessage}`,
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
