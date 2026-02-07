// backend/src/services/chat/inferenceOrchestrator.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { contextService } from './contextService';
import { StreamChunk } from '../ai/types';

/**
 * Interface para mensagem do histórico
 */
interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  isPinned?: boolean;
}

/**
 * Parâmetros para construção do payload
 */
interface BuildPayloadParams {
  historyMessages: HistoryMessage[];
  currentMessage: string;
  systemPrompt: string;
  isManualMode: boolean;
  messageOrigins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
}

/**
 * Resultado da construção do payload
 */
interface PayloadResult {
  payload: Array<{ role: string; content: string }>;
  pinnedStepIndices: number[];
  stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  totalTokens: number;
}

/**
 * Parâmetros para validação de tokens
 */
interface ValidateTokensParams {
  totalTokens: number;
  provider: string;
  model: string;
  writeSSE: (data: StreamChunk) => void;
}

/**
 * Service responsável por orquestrar a preparação da inferência
 * 
 * Responsabilidades:
 * - Construir payload final para a IA
 * - Mapear índices de mensagens pinadas
 * - Rastrear origens das mensagens (auditoria)
 * - Validar limites de tokens
 */
class InferenceOrchestratorService {
  /**
   * Constrói o payload completo para enviar à IA
   */
  buildPayload(params: BuildPayloadParams): PayloadResult {
    const {
      historyMessages,
      currentMessage,
      systemPrompt,
      messageOrigins
    } = params;

    const payload: Array<{ role: string; content: string }> = [];
    const pinnedStepIndices: number[] = [];
    const stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'> = {};

    // 1. System Prompt (sempre primeiro)
    payload.push({
      role: 'system',
      content: systemPrompt
    });

    // 2. Histórico (com rastreamento de pinned e origens)
    historyMessages.forEach(msg => {
      const currentIndex = payload.length;

      payload.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });

      // Rastreia mensagens pinadas
      if (msg.isPinned) {
        pinnedStepIndices.push(currentIndex);
      }

      // Rastreia origem da mensagem (para auditoria)
      if (messageOrigins[msg.id]) {
        stepOrigins[currentIndex] = messageOrigins[msg.id];
      }
    });

    // 3. Mensagem atual do usuário
    payload.push({
      role: 'user',
      content: currentMessage
    });

    // 4. Calcula total de tokens
    const totalTokens = contextService.countTokens(payload as any);

    return {
      payload,
      pinnedStepIndices,
      stepOrigins,
      totalTokens
    };
  }

  /**
   * Valida se o total de tokens está dentro dos limites
   * Envia warning via SSE se próximo do limite
   */
  validateTokens(params: ValidateTokensParams): void {
    const { totalTokens, provider, model, writeSSE } = params;

    // Limites conhecidos por provider/modelo (Groq free tier)
    const GROQ_FREE_LIMITS: Record<string, number> = {
      'llama-3.1-8b-instant': 6000,
      'llama-3.3-70b-versatile': 12000,
      'default': 6000
    };

    if (provider !== 'groq') {
      return; // Validação apenas para Groq por enquanto
    }

    const estimatedLimit = GROQ_FREE_LIMITS[model] || GROQ_FREE_LIMITS['default'];
    const threshold = estimatedLimit * 0.9;

    if (totalTokens > threshold) {
      writeSSE({
        type: 'debug',
        log: `⚠️ AVISO: Contexto com ${totalTokens} tokens (limite estimado: ${estimatedLimit}). Pode falhar!`
      });
    }
  }

  /**
   * Detecta se os parâmetros de inferência estão em modo auto ou manual
   */
  detectInferenceMode(params: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  }): 'auto' | 'manual' {
    const { temperature, topP, topK, maxTokens } = params;
    
    // Se nenhum parâmetro foi enviado, é modo auto
    if (
      temperature === undefined &&
      topP === undefined &&
      topK === undefined &&
      maxTokens === undefined
    ) {
      return 'auto';
    }

    return 'manual';
  }
}

export const inferenceOrchestratorService = new InferenceOrchestratorService();
