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

/**
 * Configuração de retry para rate limiting
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
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

    // Prepara o payload uma vez
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const payload: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || 2048,
      messages: conversationMessages,
      temperature: options.temperature || 0.7,
      top_k: options.topK || 250,
      top_p: 0.999,
    };

    if (systemMessage) {
      payload.system = systemMessage.content;
    }

    // Retry loop com backoff exponencial
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const command = new InvokeModelWithResponseStreamCommand({
          modelId: options.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(payload),
        });

        const response = await client.send(command);

        if (!response.body) {
          yield { type: 'error', error: 'No response body from Bedrock' };
          return;
        }

        // Stream bem-sucedido - processa os chunks
        for await (const event of response.body) {
          if (event.chunk) {
            const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
              yield { type: 'chunk', content: chunk.delta.text };
            }

            if (chunk.type === 'message_stop') {
              break;
            }
          }
        }
        
        // Se chegou aqui, sucesso! Sai do loop de retry
        return;
        
      } catch (error: unknown) {
        lastError = error;
        
        // Verifica se é erro de rate limiting
        if (this.isRateLimitError(error)) {
          const isLastAttempt = attempt === this.retryConfig.maxRetries;
          
          if (isLastAttempt) {
            // Última tentativa falhou - retorna erro amigável
            console.error(`[BedrockProvider] Rate limit após ${attempt + 1} tentativas:`, error);
            
            yield {
              type: 'error',
              error: `AWS Bedrock rate limit atingido. Por favor, aguarde alguns segundos e tente novamente. (Tentativas: ${attempt + 1}/${this.retryConfig.maxRetries + 1})`,
            };
            return;
          }
          
          // Calcula delay e aguarda antes do próximo retry
          const delayMs = this.calculateRetryDelay(attempt);
          console.warn(
            `[BedrockProvider] Rate limit detectado (tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1}). ` +
            `Aguardando ${delayMs}ms antes de tentar novamente...`
          );
          
          // Informa o usuário sobre o retry
          yield {
            type: 'debug',
            log: `⏳ Rate limit detectado. Aguardando ${Math.round(delayMs / 1000)}s antes de tentar novamente... (Tentativa ${attempt + 1}/${this.retryConfig.maxRetries + 1})`,
          };
          
          await sleep(delayMs);
          continue; // Tenta novamente
        }
        
        // Erro não é de rate limiting - falha imediatamente
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no AWS Bedrock';
        console.error(`[BedrockProvider] Erro no stream:`, error);
        yield {
          type: 'error',
          error: errorMessage,
        };
        return;
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam (não deveria acontecer devido ao return acima)
    const errorMessage = lastError instanceof Error ? lastError.message : 'Erro desconhecido no AWS Bedrock';
    yield {
      type: 'error',
      error: `Falha após ${this.retryConfig.maxRetries + 1} tentativas: ${errorMessage}`,
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
