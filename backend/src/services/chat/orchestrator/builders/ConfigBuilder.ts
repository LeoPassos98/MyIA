// backend/src/services/chat/orchestrator/builders/ConfigBuilder.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { auditBuilderService } from '../../auditBuilder.service';
import { inferenceOrchestratorService } from '../../inferenceOrchestrator.service';

/**
 * Interface para mensagem do histórico
 */
interface HistoryMessage {
  id: string;
  role: string;
  content: string;
}

/**
 * Parâmetros de configuração da inferência
 */
export interface InferenceConfig {
  model: string;
  provider: string;
  strategy?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  memoryWindow?: number;
}

/**
 * Parâmetros para construção de configuração
 */
export interface BuildConfigParams {
  historyMessages: HistoryMessage[];
  userMessageId: string;
  systemPrompt: string;
  pinnedStepIndices: number[];
  stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  preflightTokenCount: number;
  config: InferenceConfig;
  isManualMode: boolean;
}

/**
 * Resultado da construção de configuração
 */
export interface ConfigResult {
  auditObject: any;
  inferenceMode: 'auto' | 'manual';
}

/**
 * Builder de configurações
 * 
 * Responsabilidades:
 * - Construir objeto de auditoria usando auditBuilderService
 * - Detectar modo de inferência
 * - Encapsular lógica de configuração
 */
export class ConfigBuilder {
  /**
   * Constrói configurações completas (auditoria + modo de inferência)
   * 
   * @param params - Parâmetros de configuração
   * @returns Objeto de auditoria e modo de inferência
   */
  build(params: BuildConfigParams): ConfigResult {
    const {
      historyMessages,
      userMessageId,
      systemPrompt,
      pinnedStepIndices,
      stepOrigins,
      preflightTokenCount,
      config,
      isManualMode
    } = params;

    // 1. Constrói objeto de auditoria LEAN
    const auditObject = auditBuilderService.build({
      historyMessages,
      userMessageId,
      systemPrompt,
      pinnedStepIndices,
      stepOrigins,
      preflightTokenCount,
      config,
      isManualMode
    });

    // 2. Detecta modo de inferência
    const inferenceMode = inferenceOrchestratorService.detectInferenceMode({
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxTokens: config.maxTokens
    });

    return {
      auditObject,
      inferenceMode
    };
  }
}
