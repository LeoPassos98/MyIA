// frontend/src/features/promptTrace/mappers/mapPromptTraceRecord.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import type { PromptTraceRecord, PromptTraceStep } from '../types';

interface BackendPromptTracePayload {
  traceId: string;
  messageId: string;
  chatId: string;
  createdAt: string;
  provider: string;
  model: string;
  config: {
    mode: string;
    model: string;
    provider: string;
    timestamp: string;
    strategy?: string;
    params?: {
      temperature?: number;
      topK?: number;
      memoryWindow?: number;
    };
  };
  payloadSent: Array<{
    role: string;
    content: string;
  }>;
  response?: {
    content?: string;
  };
  usage?: {
    tokensIn?: number;
    tokensOut?: number;
    costInUSD?: number;
  };
}

/**
 * Converte payload do backend no formato da UI (PromptTraceRecord)
 */
export function mapPromptTraceRecord(raw: BackendPromptTracePayload): PromptTraceRecord {
  const steps: PromptTraceStep[] = raw.payloadSent.map((msg, index) => ({
    stepId: `req-${index + 1}`,
    stepNumber: index + 1,
    role: msg.role as PromptTraceStep['role'],
    content: msg.content,
    timestamp: raw.createdAt,
  }));

  // ✅ adiciona resposta como step final (melhor UX pra timeline)
  if (raw.response?.content) {
    steps.push({
      stepId: `res-1`,
      stepNumber: steps.length + 1,
      role: 'assistant',
      content: raw.response.content,
      timestamp: raw.createdAt,
    });
  }

  return {
    traceId: raw.traceId,
    messageId: raw.messageId,
    chatId: raw.chatId,
    userId: undefined, // backend não manda (e tá ok)
    timestamp: raw.createdAt,
    status: 'success',
    modelInfo: {
      provider: raw.provider,
      model: raw.model,
      temperature: raw.config?.params?.temperature,
      maxTokens: undefined,
      topP: undefined,
    },
    steps,
    totalUsage: {
      tokensIn: raw.usage?.tokensIn ?? 0,
      tokensOut: raw.usage?.tokensOut ?? 0,
      totalTokens: (raw.usage?.tokensIn ?? 0) + (raw.usage?.tokensOut ?? 0),
      costInUSD: raw.usage?.costInUSD ?? 0,
    },
    metadata: {
      strategy: raw.config?.strategy,
      contextWindowSize: raw.config?.params?.memoryWindow,
      ragEnabled: false, // ainda não temos no backend
      rawConfig: raw.config, // útil pra debug
    },

    // ✅ payload original do backend
    rawPayload: raw,
  };
}
