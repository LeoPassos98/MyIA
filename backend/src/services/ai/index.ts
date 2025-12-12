// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { StreamChunk } from './types';
import { AIProviderFactory } from './providers/factory';
import { getEmbedding, getEmbeddingsBatch, EmbeddingResponse } from './client/azureEmbeddingClient';

export interface AIStreamOptions {
  providerSlug: string;
  modelId: string;
  userId: string;
}

export const aiService = {
  /**
   * Modo STREAMING (Modular V2)
   * Usa a Factory e o Banco de Dados.
   */
  async *stream(
    messages: any[],
    options: AIStreamOptions
  ): AsyncGenerator<StreamChunk> {
    
    console.log(`[AI Service] Stream init: ${options.providerSlug} / ${options.modelId}`);

    try {
      // 1. Instancia o driver (OpenAI, Groq, etc) via Factory
      const provider = await AIProviderFactory.getProviderInstance(options.providerSlug);

      // 2. Busca a credencial (Do usuário ou Fallback do sistema)
      let apiKey = "";
      try {
        // Fallback temporário de variáveis de ambiente até termos o painel frontend pronto
        if (options.providerSlug === 'openai') apiKey = process.env.OPENAI_API_KEY || "";
        if (options.providerSlug === 'groq') apiKey = process.env.GROQ_API_KEY || "";
        if (options.providerSlug === 'together') apiKey = process.env.TOGETHER_API_KEY || "";
        
        // Futuro: apiKey = await AIProviderFactory.getUserApiKey(options.userId, options.providerSlug);
      } catch (e) {
        console.warn("Chave não encontrada, usando variáveis de ambiente...");
      }

      if (!apiKey) {
         yield { type: 'error', error: `Chave de API não configurada para ${options.providerSlug}.` };
         return;
      }

      // 3. Inicia o streaming usando o Driver unificado
      const streamGenerator = provider.streamChat(messages, {
        modelId: options.modelId,
        apiKey: apiKey,
        maxTokens: 4000, 
        temperature: 0.7
      });

      for await (const chunk of streamGenerator) {
        yield chunk;
      }

    } catch (error: any) {
      console.error(`[AI Service] Erro fatal:`, error);
      yield {
        type: 'error',
        error: error.message || 'Erro interno no serviço de IA',
      };
    }
  },

  // Mantendo métodos de Embedding (Azure/OpenAI)
  async embed(text: string): Promise<EmbeddingResponse | null> {
    return getEmbedding(text);
  },

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    return getEmbeddingsBatch(texts);
  },
  
  // Método legado mantido para evitar quebra de contratos antigos se houver
  async chat(_messages: any[], _providerSlug: string) {
     // Implementação simplificada se necessária, ou erro
     throw new Error("Use aiService.stream para chat.");
  }
};

// Exportar interface para uso externo
export type { EmbeddingResponse };

export * from './types';