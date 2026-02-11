// backend/src/services/chat/responseFormatter.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { TelemetryMetrics } from '../ai/types';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { contextService } from './contextService';

/**
 * Interface para informações de custo do provider
 */
interface ProviderCostInfo {
  costIn: number;       // Custo por 1M tokens de entrada
  costOut: number;      // Custo por 1M tokens de saída
  contextLimit: number; // Limite de tokens de contexto (input)
}

/**
 * Custos padrão quando não encontrado no banco
 */
const DEFAULT_COST_INFO: ProviderCostInfo = {
  costIn: 0.0,
  costOut: 0.0,
  contextLimit: 4000
};

/**
 * Cache de custos para evitar queries repetidas durante uma sessão
 */
const costCache = new Map<string, { info: ProviderCostInfo; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Parâmetros para cálculo de métricas fallback
 */
interface CalculateFallbackMetricsParams {
  payload: Array<{ role: string; content: string }>;
  fullContent: string;
  provider: string;
  model: string;
  chatId: string;
}

/**
 * Service responsável por formatar respostas e calcular métricas
 * 
 * Responsabilidades:
 * - Calcular métricas fallback quando API não retorna
 * - Formatar telemetria
 * - Calcular custos usando dados do banco (ModelDeployment)
 */
class ResponseFormatterService {
  /**
   * Busca informações de custo do banco de dados
   * Usa cache para evitar queries repetidas
   */
  private async getProviderCostInfo(model: string): Promise<ProviderCostInfo> {
    const now = Date.now();
    const cached = costCache.get(model);
    
    // Retorna cache se ainda válido
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return cached.info;
    }

    try {
      // Busca deployment pelo deploymentId (nome do modelo)
      const deployment = await prisma.modelDeployment.findFirst({
        where: {
          deploymentId: { contains: model, mode: 'insensitive' },
          isActive: true
        },
        select: {
          costPer1MInput: true,
          costPer1MOutput: true,
          baseModel: {
            select: {
              capabilities: true
            }
          }
        }
      });

      if (deployment) {
        // Extrai maxContextWindow do JSON de capabilities
        const capabilities = deployment.baseModel?.capabilities as Record<string, unknown> | null;
        const maxContextWindow = typeof capabilities?.maxContextWindow === 'number'
          ? capabilities.maxContextWindow
          : DEFAULT_COST_INFO.contextLimit;

        const info: ProviderCostInfo = {
          costIn: deployment.costPer1MInput,
          costOut: deployment.costPer1MOutput,
          contextLimit: maxContextWindow
        };
        
        costCache.set(model, { info, timestamp: now });
        logger.debug('Custo obtido do banco para modelo', { model, info });
        return info;
      }
    } catch (error) {
      logger.warn('Erro ao buscar custo do banco, usando fallback', {
        model,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Fallback: usar valores padrão
    costCache.set(model, { info: DEFAULT_COST_INFO, timestamp: now });
    logger.debug('Usando custo fallback para modelo', { model });
    return DEFAULT_COST_INFO;
  }

  /**
   * Calcula métricas fallback quando a API não retorna telemetria
   * Busca custos do banco de dados (ModelDeployment)
   */
  async calculateFallbackMetrics(params: CalculateFallbackMetricsParams): Promise<TelemetryMetrics> {
    const { payload, fullContent, provider, model, chatId } = params;

    // Calcula tokens de entrada e saída
    const tokensIn = contextService.countTokens(payload as Array<{ role: string; content: string }>);
    const tokensOut = contextService.encode(fullContent);

    // Busca informações de custo do banco
    const providerInfo = await this.getProviderCostInfo(model);
    
    // Calcula custo real em USD
    const costInUSD =
      (tokensIn / 1_000_000) * providerInfo.costIn +
      (tokensOut / 1_000_000) * providerInfo.costOut;

    return {
      provider,
      model,
      tokensIn,
      tokensOut,
      costInUSD,
      chatId
    };
  }

  /**
   * Versão síncrona para compatibilidade (usa cache ou fallback)
   * @deprecated Prefira usar calculateFallbackMetrics que é async
   */
  calculateFallbackMetricsSync(params: CalculateFallbackMetricsParams): TelemetryMetrics {
    const { payload, fullContent, provider, model, chatId } = params;

    // Calcula tokens de entrada e saída
    const tokensIn = contextService.countTokens(payload as Array<{ role: string; content: string }>);
    const tokensOut = contextService.encode(fullContent);

    // Tenta usar cache, senão usa fallback
    const cached = costCache.get(model);
    const providerInfo = cached?.info ?? DEFAULT_COST_INFO;
    
    // Calcula custo real em USD
    const costInUSD =
      (tokensIn / 1_000_000) * providerInfo.costIn +
      (tokensOut / 1_000_000) * providerInfo.costOut;

    return {
      provider,
      model,
      tokensIn,
      tokensOut,
      costInUSD,
      chatId
    };
  }

  /**
   * Valida se as métricas recebidas são confiáveis
   * Retorna true se métricas precisam ser recalculadas
   */
  needsRecalculation(metrics: TelemetryMetrics | null): boolean {
    if (!metrics) {
      return true;
    }

    // Se tokensIn é 0, as métricas não são confiáveis
    if (metrics.tokensIn === 0) {
      return true;
    }

    return false;
  }

  /**
   * Formata métricas para envio via SSE
   */
  formatTelemetry(metrics: TelemetryMetrics, messageId?: string): TelemetryMetrics {
    return {
      ...metrics,
      messageId
    };
  }

  /**
   * Extrai informações de custo do provider (async - busca do banco)
   */
  async getProviderCosts(model: string): Promise<ProviderCostInfo> {
    return this.getProviderCostInfo(model);
  }

  /**
   * Versão síncrona para compatibilidade (usa cache ou fallback)
   * @deprecated Prefira usar getProviderCosts que é async
   */
  getProviderCostsSync(model: string): ProviderCostInfo {
    const cached = costCache.get(model);
    return cached?.info ?? DEFAULT_COST_INFO;
  }

  /**
   * Limpa o cache de custos (útil para testes ou após atualizações)
   */
  clearCostCache(): void {
    costCache.clear();
    logger.debug('Cache de custos limpo');
  }
}

export const responseFormatterService = new ResponseFormatterService();
