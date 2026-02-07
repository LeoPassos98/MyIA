// backend/src/services/ai/providers/bedrock/streaming/StreamProcessor.ts

import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { BaseModelAdapter } from '../../../adapters/base.adapter';
import { StreamChunk } from '../../../types';
import { ChunkParser, AWSStreamEvent } from './ChunkParser';
import logger from '../../../../../utils/logger';

/**
 * Configuração para processamento de stream
 */
export interface StreamConfig {
  /** Cliente AWS Bedrock Runtime */
  client: BedrockRuntimeClient;
  
  /** Model ID a ser usado */
  modelId: string;
  
  /** Body da requisição (já formatado pelo adapter) */
  body: any;
  
  /** Adapter para parse de chunks */
  adapter: BaseModelAdapter;
  
  /** Content-Type da requisição */
  contentType?: string;
  
  /** Accept header */
  accept?: string;
}

/**
 * Resultado do processamento de stream
 */
export interface StreamResult {
  /** Se o stream foi bem-sucedido */
  success: boolean;
  
  /** Chunks processados (se success === true) */
  chunks?: StreamChunk[];
  
  /** Erro (se success === false) */
  error?: unknown;
}

/**
 * Processa streams de resposta do AWS Bedrock
 * 
 * Responsável por:
 * - Enviar comando AWS
 * - Processar stream de eventos
 * - Parsear chunks usando ChunkParser
 * - Converter para formato universal (StreamChunk)
 * - Gerenciar erros de streaming
 * 
 * @example
 * ```typescript
 * const processor = new StreamProcessor();
 * 
 * const config: StreamConfig = {
 *   client,
 *   modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
 *   body: formattedBody,
 *   adapter: anthropicAdapter,
 * };
 * 
 * for await (const chunk of processor.processStream(config)) {
 *   if (chunk.type === 'chunk') {
 *     console.log(chunk.content);
 *   }
 * }
 * ```
 */
export class StreamProcessor {
  /**
   * Processa stream de resposta AWS Bedrock
   * 
   * @param config Configuração do stream
   * @yields StreamChunk - Chunks processados
   */
  async *processStream(config: StreamConfig): AsyncGenerator<StreamChunk> {
    const parser = new ChunkParser(config.adapter);
    
    try {
      // Criar comando AWS
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: config.modelId,
        contentType: config.contentType || 'application/json',
        accept: config.accept || 'application/json',
        body: JSON.stringify(config.body),
      });

      logger.info(`🚀 [StreamProcessor] Starting stream for model: ${config.modelId}`);

      // Enviar comando e obter stream
      const response = await config.client.send(command);

      if (!response.body) {
        logger.warn(`⚠️ [StreamProcessor] No response body for: ${config.modelId}`);
        yield {
          type: 'error',
          error: 'No response body received from AWS Bedrock',
        };
        return;
      }

      // Processar eventos do stream
      let chunkCount = 0;
      for await (const event of response.body) {
        const parsed = parser.parseEvent(event as AWSStreamEvent);
        
        if (parsed.type === 'chunk' && parsed.content) {
          chunkCount++;
          yield { type: 'chunk', content: parsed.content };
        } else if (parsed.type === 'done') {
          logger.info(`✅ [StreamProcessor] Stream completed for ${config.modelId} (${chunkCount} chunks)`);
          break;
        } else if (parsed.type === 'error') {
          logger.error(`❌ [StreamProcessor] Parse error:`, parsed.error);
          yield { type: 'error', error: parsed.error || 'Unknown parse error' };
          break;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
      logger.error(`❌ [StreamProcessor] Stream error for ${config.modelId}:`, error);
      
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Processa stream e coleta todos os chunks em array
   * 
   * Útil para testes ou quando não é necessário streaming real
   * 
   * @param config Configuração do stream
   * @returns Resultado com todos os chunks ou erro
   */
  async collectStream(config: StreamConfig): Promise<StreamResult> {
    const chunks: StreamChunk[] = [];
    
    try {
      for await (const chunk of this.processStream(config)) {
        chunks.push(chunk);
        
        // Se encontrar erro, parar
        if (chunk.type === 'error') {
          return {
            success: false,
            error: chunk.error,
          };
        }
      }
      
      return {
        success: true,
        chunks,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Valida configuração de stream
   * 
   * @param config Configuração a validar
   * @returns true se válida
   */
  validateConfig(config: StreamConfig): boolean {
    return (
      config.client !== undefined &&
      config.modelId.length > 0 &&
      config.body !== undefined &&
      config.adapter !== undefined
    );
  }
}
