// backend/src/services/chat/auditBuilder.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

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
interface InferenceConfig {
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
 * Parâmetros para construção do audit
 */
interface BuildAuditParams {
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
 * Objeto de auditoria (sentContext) - STANDARDS §7
 */
interface AuditObject {
  config_V47: {
    mode: 'manual' | 'auto';
    model: string;
    provider: string;
    timestamp: string;
    strategy: string;
    params: {
      mode: 'auto' | 'manual';
      temperature: number | 'auto';
      topP: number | 'auto';
      topK: number | 'auto';
      maxTokens: number | 'auto';
      memoryWindow?: number;
    };
  };
  systemPrompt: string;
  messageIds: string[];
  userMessageId: string;
  pinnedStepIndices: number[];
  stepOrigins: Record<number, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
  preflightTokenCount: number;
}

/**
 * Service responsável por construir objetos de auditoria (sentContext)
 * 
 * Implementa STANDARDS §7 (Armazenamento Lean):
 * - Salva apenas IDs e metadados
 * - NÃO duplica conteúdo de mensagens
 * - Permite reconstrução sob demanda
 * 
 * Responsabilidades:
 * - Construir objeto de auditoria completo
 * - Rastrear configuração de inferência
 * - Mapear origens das mensagens
 * - Registrar índices de mensagens pinadas
 */
class AuditBuilderService {
  /**
   * Constrói objeto de auditoria LEAN (Standards §7)
   * Salva apenas IDs e metadados, não conteúdo duplicado
   */
  build(params: BuildAuditParams): AuditObject {
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

    // Detecta se parâmetros foram enviados (modo manual) ou não (modo auto)
    const isAutoInferenceMode = this.detectInferenceMode({
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxTokens: config.maxTokens
    });

    return {
      config_V47: {
        mode: isManualMode ? 'manual' : 'auto',
        model: config.model,
        provider: config.provider,
        timestamp: new Date().toISOString(),
        strategy: config.strategy || 'efficient',
        params: {
          mode: isAutoInferenceMode ? 'auto' : 'manual',
          temperature: config.temperature ?? 'auto',
          topP: config.topP ?? 'auto',
          topK: config.topK ?? 'auto',
          maxTokens: config.maxTokens ?? 'auto',
          memoryWindow: config.memoryWindow
        }
      },
      // LEAN: Salva systemPrompt (único!) e IDs em vez de conteúdo
      systemPrompt,
      messageIds: historyMessages.map(m => m.id),
      userMessageId,
      pinnedStepIndices,
      stepOrigins,
      preflightTokenCount
    };
  }

  /**
   * Detecta se os parâmetros de inferência estão em modo auto ou manual
   */
  private detectInferenceMode(params: {
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

  /**
   * Converte objeto de auditoria para JSON string
   */
  stringify(auditObject: AuditObject): string {
    return JSON.stringify(auditObject);
  }

  /**
   * Adiciona informação de erro ao objeto de auditoria
   */
  addError(
    auditObject: AuditObject,
    error: {
      message: string;
      code?: string;
      status?: number;
    }
  ): AuditObject & { error: typeof error } {
    return {
      ...auditObject,
      error
    };
  }
}

export const auditBuilderService = new AuditBuilderService();
