// backend/src/services/chat/responseFormatter.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { contextService } from './contextService';
import { getProviderInfo } from '../../config/providerMap';
import { TelemetryMetrics } from '../ai/types';

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
 * - Calcular custos usando providerMap
 */
class ResponseFormatterService {
  /**
   * Calcula métricas fallback quando a API não retorna telemetria
   * Usa providerMap para custos reais
   */
  calculateFallbackMetrics(params: CalculateFallbackMetricsParams): TelemetryMetrics {
    const { payload, fullContent, provider, model, chatId } = params;

    // Calcula tokens de entrada e saída
    const tokensIn = contextService.countTokens(payload as any);
    const tokensOut = contextService.encode(fullContent);

    // Busca informações de custo do provider
    const providerInfo = getProviderInfo(model);
    
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
   * Extrai informações de custo do provider
   */
  getProviderCosts(model: string): {
    costIn: number;
    costOut: number;
    contextLimit: number;
  } {
    return getProviderInfo(model);
  }
}

export const responseFormatterService = new ResponseFormatterService();
