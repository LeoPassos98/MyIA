// backend/src/services/ai/providers/bedrock/streaming/ChunkParser.ts

import type { BaseModelAdapter } from '../../../adapters/base.adapter';
import { StreamChunk } from '../../../types';

/**
 * Resultado do parse de um chunk
 */
export interface ParsedChunk {
  /** Tipo do chunk */
  type: 'chunk' | 'done' | 'error';
  
  /** Conteúdo do chunk (se type === 'chunk') */
  content?: string;
  
  /** Mensagem de erro (se type === 'error') */
  error?: string;
}

/**
 * Evento de stream do AWS SDK
 */
export interface AWSStreamEvent {
  chunk?: {
    bytes?: Uint8Array;
  };
}

/**
 * Parse de chunks de stream AWS Bedrock usando adapters
 * 
 * Responsável por:
 * - Decodificar bytes do chunk
 * - Parsear JSON
 * - Delegar para adapter específico do vendor
 * - Converter para formato universal (StreamChunk)
 * 
 * @example
 * ```typescript
 * const parser = new ChunkParser(adapter);
 * 
 * for await (const event of response.body) {
 *   const parsed = parser.parseEvent(event);
 *   
 *   if (parsed.type === 'chunk' && parsed.content) {
 *     yield { type: 'chunk', content: parsed.content };
 *   } else if (parsed.type === 'done') {
 *     break;
 *   } else if (parsed.type === 'error') {
 *     yield { type: 'error', error: parsed.error };
 *     break;
 *   }
 * }
 * ```
 */
export class ChunkParser {
  private readonly textDecoder = new TextDecoder();

  constructor(private readonly adapter: BaseModelAdapter) {}

  /**
   * Parse um evento de stream AWS
   * 
   * @param event Evento do stream AWS
   * @returns Chunk parseado
   */
  parseEvent(event: AWSStreamEvent): ParsedChunk {
    // Verificar se evento tem chunk
    if (!event.chunk?.bytes) {
      return { type: 'done' };
    }

    try {
      // Decodificar bytes para string
      const chunkText = this.textDecoder.decode(event.chunk.bytes);
      
      // Parsear JSON
      const chunkData = JSON.parse(chunkText);
      
      // Delegar para adapter
      return this.parseWithAdapter(chunkData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
      return {
        type: 'error',
        error: `Failed to parse chunk: ${errorMessage}`,
      };
    }
  }

  /**
   * Parse chunk usando adapter específico do vendor
   */
  private parseWithAdapter(chunkData: any): ParsedChunk {
    const parsed = this.adapter.parseChunk(chunkData);
    
    if (parsed.type === 'chunk' && parsed.content) {
      return {
        type: 'chunk',
        content: parsed.content,
      };
    } else if (parsed.type === 'done') {
      return { type: 'done' };
    } else if (parsed.type === 'error') {
      return {
        type: 'error',
        error: parsed.error || 'Unknown error from adapter',
      };
    }
    
    // Tipo desconhecido - tratar como done
    return { type: 'done' };
  }

  /**
   * Converte ParsedChunk para StreamChunk
   */
  toStreamChunk(parsed: ParsedChunk): StreamChunk | null {
    if (parsed.type === 'chunk' && parsed.content) {
      return { type: 'chunk', content: parsed.content };
    } else if (parsed.type === 'error') {
      return { type: 'error', error: parsed.error || 'Unknown error' };
    }
    
    // done não gera StreamChunk
    return null;
  }

  /**
   * Retorna o adapter usado
   */
  getAdapter(): BaseModelAdapter {
    return this.adapter;
  }
}
