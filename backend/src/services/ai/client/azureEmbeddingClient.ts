// backend/src/services/ai/client/azureEmbeddingClient.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import OpenAI from 'openai';
import logger from '../../../utils/logger';
import { prisma } from '../../../lib/prisma';

// Interface para o retorno V9.2 (com custo calculado)
export interface EmbeddingResponse {
  vector: number[];
  cost: number;
  tokens: number;
  model: string;
}

/**
 * Custos padrão para modelos de embedding (fallback)
 * Valores baseados em preços públicos da OpenAI/Azure
 */
const DEFAULT_EMBEDDING_COSTS: Record<string, number> = {
  'text-embedding-3-small': 0.02,   // $0.02 por 1M tokens
  'text-embedding-3-large': 0.13,   // $0.13 por 1M tokens
  'text-embedding-ada-002': 0.10,   // $0.10 por 1M tokens
};
const DEFAULT_EMBEDDING_COST = 0.10; // Fallback genérico

// Cache de custos do banco para evitar queries repetidas
let cachedEmbeddingCost: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

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
 * Busca o custo de embedding do banco de dados ou usa fallback
 * Usa cache para evitar queries repetidas
 */
async function getEmbeddingCostPer1M(modelName: string): Promise<number> {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedEmbeddingCost !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedEmbeddingCost;
  }

  try {
    // Busca deployment pelo deploymentId (nome do modelo)
    const deployment = await prisma.modelDeployment.findFirst({
      where: {
        deploymentId: { contains: modelName, mode: 'insensitive' },
        isActive: true
      },
      select: {
        costPer1MInput: true
      }
    });

    if (deployment) {
      cachedEmbeddingCost = deployment.costPer1MInput;
      cacheTimestamp = now;
      logger.debug('Custo de embedding obtido do banco', { 
        modelName, 
        costPer1MInput: deployment.costPer1MInput 
      });
      return deployment.costPer1MInput;
    }
  } catch (error) {
    logger.warn('Erro ao buscar custo de embedding do banco, usando fallback', {
      modelName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Fallback: usar custos conhecidos ou padrão
  const fallbackCost = DEFAULT_EMBEDDING_COSTS[modelName] ?? DEFAULT_EMBEDDING_COST;
  cachedEmbeddingCost = fallbackCost;
  cacheTimestamp = now;
  
  logger.debug('Usando custo de embedding fallback', { modelName, fallbackCost });
  return fallbackCost;
}

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

    // Buscar custo do banco ou usar fallback
    const costPer1M = await getEmbeddingCostPer1M(deploymentName);
    const cost = (tokens / 1_000_000) * costPer1M;

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

  // Buscar custo uma vez para todo o batch
  const costPer1M = await getEmbeddingCostPer1M(deploymentName);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    try {
      const response = await client.embeddings.create({
        model: deploymentName,
        input: batch,
      });

      const totalTokens = response.usage?.total_tokens || 0;
      const totalCost = (totalTokens / 1_000_000) * costPer1M;
      
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
