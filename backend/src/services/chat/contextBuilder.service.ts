// backend/src/services/chat/contextBuilder.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
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
  createdAt?: Date;
}

/**
 * Configuração do pipeline de contexto (vem do frontend)
 */
interface ContextPipelineConfig {
  systemPrompt?: string;
  pinnedEnabled?: boolean;
  recentEnabled?: boolean;
  recentCount?: number;
  ragEnabled?: boolean;
  ragTopK?: number;
  maxContextTokens?: number;
}

/**
 * Parâmetros para construção de contexto
 */
interface BuildContextParams {
  chatId: string;
  message: string;
  isManualMode: boolean;
  selectedMessageIds?: string[];
  contextConfig?: ContextPipelineConfig;
  writeSSE: (data: StreamChunk) => void;
}

/**
 * Resultado da construção de contexto
 */
interface ContextResult {
  messages: HistoryMessage[];
  origins: Record<string, 'pinned' | 'rag' | 'recent' | 'rag+recent' | 'manual'>;
}

/**
 * Service responsável por construir o contexto (histórico) para a IA
 * 
 * Suporta dois modos:
 * - Manual: Usuário seleciona mensagens específicas
 * - Auto: Sistema usa RAG híbrido (pinned + semântico + recentes)
 */
class ContextBuilderService {
  /**
   * Constrói contexto baseado no modo (manual ou auto)
   */
  async build(params: BuildContextParams): Promise<ContextResult> {
    const {
      chatId,
      message,
      isManualMode,
      selectedMessageIds,
      contextConfig,
      writeSSE
    } = params;

    if (isManualMode) {
      return this.buildManualContext(chatId, selectedMessageIds);
    }

    return this.buildAutoContext(chatId, message, contextConfig, writeSSE);
  }

  /**
   * Modo Manual: Usuário selecionou mensagens específicas
   */
  private async buildManualContext(
    chatId: string,
    selectedMessageIds?: string[]
  ): Promise<ContextResult> {
    if (!selectedMessageIds || selectedMessageIds.length === 0) {
      return {
        messages: [],
        origins: {}
      };
    }

    const messages = await prisma.message.findMany({
      where: {
        id: { in: selectedMessageIds },
        chatId
      },
      orderBy: { createdAt: 'asc' }
    });

    // Modo manual: todas as mensagens têm origem 'manual'
    const origins: Record<string, 'manual'> = {};
    messages.forEach(msg => {
      origins[msg.id] = 'manual';
    });

    return {
      messages: messages as HistoryMessage[],
      origins
    };
  }

  /**
   * Modo Auto: Sistema usa RAG híbrido inteligente
   * Prioridade: Pinned → RAG (semântico) → Recentes
   */
  private async buildAutoContext(
    chatId: string,
    message: string,
    contextConfig: ContextPipelineConfig | undefined,
    writeSSE: (data: StreamChunk) => void
  ): Promise<ContextResult> {
    const report = await contextService.getHybridRagHistory(
      chatId,
      message,
      writeSSE,
      contextConfig
    );

    return {
      messages: report.finalContext as HistoryMessage[],
      origins: report.messageOrigins
    };
  }
}

export const contextBuilderService = new ContextBuilderService();
