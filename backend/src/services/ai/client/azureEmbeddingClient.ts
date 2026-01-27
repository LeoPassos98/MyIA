// backend/src/services/ai/client/azureEmbeddingClient.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import OpenAI from 'openai';
import { getProviderInfo } from '../../../config/providerMap';
import logger from '../../../utils/logger';

// Interface para o retorno V9.2 (com custo calculado)
export interface EmbeddingResponse {
  vector: number[];
  cost: number;
  tokens: number;
  model: string;
}

// 1. Pegue as chaves do .env
const endpoint = process.env.AZURE_EMBEDDING_ENDPOINT;
const apiKey = process.env.AZURE_API_KEY;
const deploymentName = process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME;

if (!endpoint || !apiKey || !deploymentName) {
  logger.warn("⚠️ Azure Embedding Client (V9.2) não configurado. O RAG falhará.");
}

// Criar cliente OpenAI configurado para Azure
const client = (endpoint && apiKey) 
  ? new OpenAI({
      apiKey: apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
      defaultQuery: { 'api-version': '2023-05-15' },
      defaultHeaders: { 'api-key': apiKey },
    })
  : null;

/**
 * O "Tradutor/Contador" (V9.2)
 * Converte texto em vetor de 1536 dimensões + calcula custo
 */
export async function getEmbedding(text: string): Promise<EmbeddingResponse | null> {
  if (!client || !deploymentName) {
    logger.warn("Azure Embedding não disponível. Retornando null.");
    return null;
  }

  try {
    // 1. A Chamada ("Tradução")
    const response = await client.embeddings.create({
      model: deploymentName,
      input: text,
    });

    // 2. A "Contabilidade" (V9.2)
    const vector = response.data[0]?.embedding || [];
    const tokens = response.usage?.total_tokens || 0;

    // Usar o "Motor V12" para buscar o custo
    const modelInfo = getProviderInfo(deploymentName);
    const cost = (tokens / 1_000_000) * modelInfo.costIn;

    return {
      vector: vector,
      cost: cost,
      tokens: tokens,
      model: deploymentName
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error("❌ Erro ao gerar embedding (Azure V9.2):", errorMessage);
    return null;
  }
}

/**
 * Helper: Gera embeddings em lote com cálculo de custo total
 * Útil para indexação em massa
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<EmbeddingResponse[]> {
  if (!client || !deploymentName) {
    logger.warn("Azure Embedding não disponível. Retornando array vazio.");
    return [];
  }

  // Azure OpenAI suporta múltiplos textos em uma única chamada
  const BATCH_SIZE = 16;
  const results: EmbeddingResponse[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    try {
      const response = await client.embeddings.create({
        model: deploymentName,
        input: batch,
      });

      const totalTokens = response.usage?.total_tokens || 0;
      const modelInfo = getProviderInfo(deploymentName);
      const totalCost = (totalTokens / 1_000_000) * modelInfo.costIn;
      
      // Distribuir custo proporcionalmente entre os textos
      const costPerText = totalCost / batch.length;
      const tokensPerText = Math.floor(totalTokens / batch.length);

      response.data.forEach((item) => {
        results.push({
          vector: item.embedding,
          cost: costPerText,
          tokens: tokensPerText,
          model: deploymentName
        });
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(`❌ Erro no batch ${i}-${i + batch.length}:`, errorMessage);
      // Retornar null para cada texto que falhou
      batch.forEach(() => {
        results.push({
          vector: [],
          cost: 0,
          tokens: 0,
          model: deploymentName
        });
      });
    }
  }

  return results;
}
