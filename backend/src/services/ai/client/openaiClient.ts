// backend/src/services/ai/client/openaiClient.ts

import OpenAI from 'openai';
import { ProviderName, StreamChunk, TelemetryMetrics } from '../types';
import { getProviderConfig } from '../utils/providerUtils';
import { COST_PER_1M_TOKENS } from '../../../config/costMap';

// Função helper para criar cliente OpenAI (compatível com múltiplos providers)
function getOpenAIClient(provider: ProviderName): OpenAI {
  const config = getProviderConfig(provider);
  
  if (!config.isValidKey) {
    throw new Error(`${provider} API key not configured`);
  }
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

// A NOVA FUNÇÃO DE CHAT (Gerador com Streaming)
export async function* streamOpenAIChat(
  messages: any[], 
  provider: ProviderName
): AsyncGenerator<StreamChunk> {
  
  const client = getOpenAIClient(provider);
  const config = getProviderConfig(provider);
  
  if (!config) {
    yield { type: 'error', error: `Provider ${provider} não configurado` };
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      model: config.defaultModel, // <-- CORRIGIDO
      messages: messages as any,
      stream: true,
    });

    let responseText = "";
    let finalMetrics: TelemetryMetrics | null = null;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        responseText += content;
        yield { type: 'chunk', content: content };
      }

      if (chunk.usage) { 
        const inputTokens = chunk.usage.prompt_tokens || 0;
        const outputTokens = chunk.usage.completion_tokens || 0;
        const modelKey = chunk.model || config.defaultModel; // <-- CORRIGIDO
        
        type CostMapKey = keyof typeof COST_PER_1M_TOKENS;
        const costs = COST_PER_1M_TOKENS[modelKey as CostMapKey] || { input: 0, output: 0 };
        const totalCost = ((inputTokens / 1_000_000) * costs.input) + 
                          ((outputTokens / 1_000_000) * costs.output);

        finalMetrics = {
          tokensIn: inputTokens,
          tokensOut: outputTokens,
          costInUSD: totalCost,
          model: modelKey,
          provider: provider
        };
      }
    }

    if (finalMetrics) {
      yield { type: 'telemetry', metrics: finalMetrics };
    } else {
      console.warn(`Telemetria não encontrada no stream (${provider}), estimando...`);
      yield { 
        type: 'telemetry', 
        metrics: {
          tokensIn: 0,
          tokensOut: responseText.split(/\s+/).length,
          costInUSD: 0,
          model: config.defaultModel, // <-- CORRIGIDO
          provider: provider
        }
      };
    }

  } catch (error: any) {
    console.error(`Erro no stream (${provider}):`, error);
    yield { type: 'error', error: error.message || 'Erro desconhecido no stream' };
  }
}

// Função não-streaming para compatibilidade
export async function chatOpenAI(
  messages: any[], 
  provider: ProviderName
): Promise<{ response: string; tokensIn: number; tokensOut: number; model: string }> {
  let fullResponse = "";
  let metrics = { tokensIn: 0, tokensOut: 0, model: "", provider: "" };

  for await (const chunk of streamOpenAIChat(messages, provider)) {
    if (chunk.type === 'chunk') {
      fullResponse += chunk.content;
    } else if (chunk.type === 'telemetry') {
      metrics = chunk.metrics;
    } else if (chunk.type === 'error') {
      throw new Error(chunk.error);
    }
  }

  return {
    response: fullResponse,
    tokensIn: metrics.tokensIn,
    tokensOut: metrics.tokensOut,
    model: metrics.model
  };
}