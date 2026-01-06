// frontend/src/features/promptTrace/mappers/mapPromptTraceRecord.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import type { PromptTraceRecord, PromptTraceStep, StepOrigin } from '../types';

// Estimativa: ~4 caracteres = 1 token. 8000 tokens ≈ 32000 chars
const TRUNCATION_CHAR_THRESHOLD = 30000;

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
  pinnedStepIndices?: number[]; // Índices dos steps que eram pinados
  stepOrigins?: Record<string, StepOrigin>; // Mapa stepIndex → origin
  response?: {
    content?: string;
  };
  usage?: {
    tokensIn?: number;
    tokensOut?: number;
    costInUSD?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
    status?: number;
  };
  preflightTokenCount?: number; // Tokens contados antes de enviar
}

/**
 * Converte payload do backend no formato da UI (PromptTraceRecord)
 */
export function mapPromptTraceRecord(raw: BackendPromptTracePayload): PromptTraceRecord {
  // Índices dos steps pinados e origens
  const pinnedIndices = raw.pinnedStepIndices || [];
  const stepOrigins = raw.stepOrigins || {};
  const pinnedCount = pinnedIndices.length;

  const steps: PromptTraceStep[] = raw.payloadSent.map((msg, index) => {
    // Determina a origem do step
    let origin: StepOrigin | undefined;
    const isLastMessage = index === raw.payloadSent.length - 1;
    
    if (msg.role === 'system') {
      origin = 'system';
    } else if (isLastMessage && msg.role === 'user') {
      // Última mensagem do user é sempre o input atual
      origin = 'user-input';
    } else if (stepOrigins[String(index)]) {
      origin = stepOrigins[String(index)];
    }

    // Estima se o embedding foi truncado baseado no tamanho
    const wasTruncatedForEmbedding = msg.content.length > TRUNCATION_CHAR_THRESHOLD;

    return {
      stepId: `req-${index + 1}`,
      stepNumber: index + 1,
      role: msg.role as PromptTraceStep['role'],
      content: msg.content,
      timestamp: raw.createdAt,
      isPinned: pinnedIndices.includes(index), // ✅ Agora funciona com índices!
      origin, // ✅ Origem da mensagem (pinned, rag, recent, etc)
      wasTruncatedForEmbedding, // ⚠️ Embedding pode ser parcial
    };
  });

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

  // 🔥 Determina status baseado em erro ou conteúdo da resposta
  let status: 'success' | 'error' | 'pending' = 'success';
  if (raw.error) {
    status = 'error';
  } else if (raw.response?.content?.startsWith('[ERRO]')) {
    status = 'error';
  }

  return {
    traceId: raw.traceId,
    messageId: raw.messageId,
    chatId: raw.chatId,
    userId: undefined, // backend não manda (e tá ok)
    timestamp: raw.createdAt,
    status,
    errorMessage: raw.error?.message, // 🔥 Adiciona mensagem de erro se houver
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
      pinnedMessagesCount: pinnedCount,
      rawConfig: raw.config, // útil pra debug
    },

    // ✅ payload original do backend
    rawPayload: raw,
  };
}
