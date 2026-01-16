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
 * Modelos que requerem Inference Profile (cross-region)
 * Esses modelos não podem ser invocados diretamente pelo modelId
 */
const REQUIRES_INFERENCE_PROFILE = [
  'anthropic.claude-haiku-4-5-20251001-v1:0',
  'anthropic.claude-sonnet-4-20250514-v1:0',
  'amazon.nova-2-lite-v1:0',
  'amazon.nova-2-lite-v1:0:256k',
  'amazon.nova-2-micro-v1:0',
  'amazon.nova-2-pro-v1:0'
];

/**
 * Tipos de provedores de modelos no AWS Bedrock
 */
enum ModelProvider {
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  AMAZON = 'amazon',
  AI21 = 'ai21',
  META = 'meta',
  MISTRAL = 'mistral',
  STABILITY = 'stability'
}

/**
 * Detecta o provedor do modelo baseado no modelId
 */
function detectModelProvider(modelId: string): ModelProvider {
  const prefix = modelId.split('.')[0].toLowerCase();
  
  switch (prefix) {
    case 'anthropic':
      return ModelProvider.ANTHROPIC;
    case 'cohere':
      return ModelProvider.COHERE;
    case 'amazon':
      return ModelProvider.AMAZON;
    case 'ai21':
      return ModelProvider.AI21;
    case 'meta':
      return ModelProvider.META;
    case 'mistral':
      return ModelProvider.MISTRAL;
    case 'stability':
      return ModelProvider.STABILITY;
    default:
      // Default para Anthropic (compatibilidade com código existente)
      return ModelProvider.ANTHROPIC;
  }
}

/**
 * Converte modelId para Inference Profile ID se necessário
 * @param modelId ID do modelo
 * @param region Região AWS (ex: 'us-east-1')
 * @returns Inference Profile ID ou modelId original
 */
function getInferenceProfileId(modelId: string, region: string): string {
  if (REQUIRES_INFERENCE_PROFILE.includes(modelId)) {
    // Usar system-defined inference profile
    const regionPrefix = region.split('-')[0]; // 'us' de 'us-east-1'
    const inferenceProfileId = `${regionPrefix}.${modelId}`;
    console.log(`🔄 [Bedrock] Usando Inference Profile: ${inferenceProfileId} (região: ${region})`);
    return inferenceProfileId;
  }
  return modelId;
}

/**
 * Cria payload para modelos Anthropic Claude
 */
function createAnthropicPayload(messages: any[], options: AIRequestOptions): any {
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

  return payload;
}

/**
 * Cria payload para modelos Cohere
 */
function createCoherePayload(messages: any[], options: AIRequestOptions): any {
  // Cohere usa um formato diferente
  // Combina system message com o histórico de mensagens
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  // Cohere usa 'message' (singular) para a última mensagem do usuário
  // e 'chat_history' para mensagens anteriores
  const chatHistory = conversationMessages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: m.content
  }));
  
  const lastMessage = conversationMessages[conversationMessages.length - 1];
  
  const payload: any = {
    message: lastMessage?.content || '',
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2048,
  };

  // Adiciona chat_history se houver mensagens anteriores
  if (chatHistory.length > 0) {
    payload.chat_history = chatHistory;
  }

  // Adiciona preamble (equivalente ao system message)
  if (systemMessage) {
    payload.preamble = systemMessage.content;
  }

  // Cohere suporta p (top_p) mas não top_k da mesma forma
  if (options.topP !== undefined) {
    payload.p = options.topP;
  }

  // NOTA: O streaming é controlado pelo InvokeModelWithResponseStreamCommand,
  // não pelo payload. Não adicionar 'stream: true' aqui.

  return payload;
}

/**
 * Cria payload para modelos Amazon (Titan, Nova)
 */
function createAmazonPayload(messages: any[], options: AIRequestOptions): any {
  // Amazon Titan/Nova usa formato próprio
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  const payload: any = {
    inputText: conversationMessages.map(m =>
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n'),
    textGenerationConfig: {
      maxTokenCount: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.9,
    }
  };

  // Adiciona system prompt se houver
  if (systemMessage) {
    payload.inputText = `System: ${systemMessage.content}\n\n${payload.inputText}`;
  }

  return payload;
}

/**
 * Cria payload baseado no provedor do modelo
 */
function createPayloadForProvider(
  provider: ModelProvider,
  messages: any[],
  options: AIRequestOptions
): any {
  console.log(`📦 [Bedrock] Criando payload para provedor: ${provider}`);
  
  switch (provider) {
    case ModelProvider.ANTHROPIC:
      return createAnthropicPayload(messages, options);
    
    case ModelProvider.COHERE:
      return createCoherePayload(messages, options);
    
    case ModelProvider.AMAZON:
      return createAmazonPayload(messages, options);
    
    // Para outros provedores, usa formato Anthropic como fallback
    // TODO: Implementar formatos específicos para AI21, Meta, Mistral, Stability
    default:
      console.warn(`⚠️ [Bedrock] Provedor ${provider} não tem formato específico, usando Anthropic como fallback`);
      return createAnthropicPayload(messages, options);
  }
}

/**
 * Processa chunk de resposta baseado no provedor
 */
function* processChunkForProvider(
  provider: ModelProvider,
  chunk: any
): Generator<StreamChunk> {
  switch (provider) {
    case ModelProvider.ANTHROPIC:
      // Formato Anthropic
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield { type: 'chunk', content: chunk.delta.text };
      }
      if (chunk.type === 'message_stop') {
        return; // Sinaliza fim do stream
      }
      break;
    
    case ModelProvider.COHERE:
      // Formato Cohere
      if (chunk.text) {
        yield { type: 'chunk', content: chunk.text };
      }
      if (chunk.is_finished) {
        return; // Sinaliza fim do stream
      }
      break;
    
    case ModelProvider.AMAZON:
      // Formato Amazon Titan/Nova
      if (chunk.outputText) {
        yield { type: 'chunk', content: chunk.outputText };
      }
      if (chunk.completionReason) {
        return; // Sinaliza fim do stream
      }
      break;
    
    default:
      // Fallback para formato Anthropic
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield { type: 'chunk', content: chunk.delta.text };
      }
      if (chunk.type === 'message_stop') {
        return;
      }
      break;
  }
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

    // Detecta o provedor do modelo
    const provider = detectModelProvider(options.modelId);
    console.log(`🔍 [Bedrock] Modelo: ${options.modelId}, Provedor detectado: ${provider}`);

    // Cria payload específico para o provedor
    const payload = createPayloadForProvider(provider, messages, options);

    // Retry loop com backoff exponencial
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Usar Inference Profile se necessário
        const modelId = getInferenceProfileId(options.modelId, this.region);
        
        const command = new InvokeModelWithResponseStreamCommand({
          modelId,
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

            // Processa chunk baseado no provedor
            const chunkResults = processChunkForProvider(provider, chunk);
            for (const result of chunkResults) {
              yield result;
            }

            // Verifica se é o fim do stream (específico por provedor)
            const isFinished =
              (provider === ModelProvider.ANTHROPIC && chunk.type === 'message_stop') ||
              (provider === ModelProvider.COHERE && chunk.is_finished) ||
              (provider === ModelProvider.AMAZON && chunk.completionReason);

            if (isFinished) {
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
