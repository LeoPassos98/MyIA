// backend/src/services/ai/adapters/strategies/anthropic-strategy.ts
// Standards: docs/STANDARDS.md

/**
 * @file anthropic-strategy.ts
 * @description Strategy para Anthropic/Claude models
 * @module services/ai/adapters/strategies
 */

import { VendorStrategy } from './vendor-strategy.interface';
import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';
import { AnthropicAdapter } from '../anthropic.adapter';
import { AnthropicProfileAdapter } from '../inference-profile';
import { logger } from '../../../../utils/logger';

/**
 * Strategy para Anthropic/Claude
 * 
 * Suporta:
 * - ON_DEMAND: anthropic.claude-*
 * - INFERENCE_PROFILE: {region}.anthropic.claude-*
 * - PROVISIONED: arn:aws:bedrock:...:provisioned-model/*
 * - Direct API: claude-* (sem prefixo)
 */
export class AnthropicStrategy implements VendorStrategy {
  readonly vendor = 'anthropic';
  readonly supportedInferenceTypes: InferenceType[] = [
    'ON_DEMAND',
    'INFERENCE_PROFILE',
    'PROVISIONED',
    'CROSS_REGION'
  ];

  /**
   * Verifica se pode lidar com o modelId
   */
  canHandle(modelId: string): boolean {
    // Inference Profile: {region}.anthropic.*
    if (/^(us|eu|apac)\.anthropic\./i.test(modelId)) {
      return true;
    }

    // Standard format: anthropic.*
    if (modelId.toLowerCase().startsWith('anthropic.')) {
      return true;
    }

    // Direct API format: claude-*
    if (modelId.toLowerCase().startsWith('claude-')) {
      return true;
    }

    // ARN format (provisioned)
    if (modelId.startsWith('arn:aws:bedrock') && modelId.includes('anthropic')) {
      return true;
    }

    return false;
  }

  /**
   * Detecta tipo de inference
   */
  detectInferenceType(modelId: string): InferenceType {
    // Inference Profile: {region}.anthropic.*
    if (/^(us|eu|apac)\.anthropic\./i.test(modelId)) {
      logger.debug('[AnthropicStrategy] Detected INFERENCE_PROFILE', { modelId });
      return 'INFERENCE_PROFILE';
    }

    // Provisioned: arn:aws:bedrock:...
    if (modelId.startsWith('arn:aws:bedrock')) {
      logger.debug('[AnthropicStrategy] Detected PROVISIONED', { modelId });
      return 'PROVISIONED';
    }

    // Cross-region inference profile
    if (modelId.includes('.cross-region.')) {
      logger.debug('[AnthropicStrategy] Detected CROSS_REGION', { modelId });
      return 'CROSS_REGION';
    }

    // Default: ON_DEMAND
    logger.debug('[AnthropicStrategy] Detected ON_DEMAND', { modelId });
    return 'ON_DEMAND';
  }

  /**
   * Cria adapter apropriado
   */
  createAdapter(inferenceType: InferenceType): BaseModelAdapter {
    switch (inferenceType) {
      case 'INFERENCE_PROFILE':
        logger.debug('[AnthropicStrategy] Creating AnthropicProfileAdapter');
        return new AnthropicProfileAdapter();

      case 'ON_DEMAND':
      case 'PROVISIONED':
      case 'CROSS_REGION':
      default:
        logger.debug('[AnthropicStrategy] Creating AnthropicAdapter');
        return new AnthropicAdapter();
    }
  }

  /**
   * Valida modelId
   */
  validateModelId(modelId: string): boolean {
    if (!modelId || modelId.trim() === '') {
      return false;
    }

    // Deve ser um dos formatos suportados
    return this.canHandle(modelId);
  }

  /**
   * Normaliza modelId
   */
  normalizeModelId(modelId: string): string {
    // Substituir : por . (formato antigo)
    let normalized = modelId.replace(/:/g, '.');

    // Se é formato direto (claude-*), adicionar prefixo
    if (normalized.toLowerCase().startsWith('claude-') && !normalized.includes('.')) {
      normalized = `anthropic.${normalized}`;
    }

    return normalized;
  }
}
