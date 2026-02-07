// backend/src/services/ai/adapters/strategies/cohere-strategy.ts
// Standards: docs/STANDARDS.md

/**
 * @file cohere-strategy.ts
 * @description Strategy para Cohere Command models
 * @module services/ai/adapters/strategies
 */

import { VendorStrategy } from './vendor-strategy.interface';
import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';
import { CohereAdapter } from '../cohere.adapter';
import { logger } from '../../../../utils/logger';

/**
 * Strategy para Cohere Command
 * 
 * Suporta:
 * - ON_DEMAND: cohere.command-*
 * - INFERENCE_PROFILE: {region}.cohere.command-* (limitado)
 * - Direct API: command-* (sem prefixo)
 * 
 * Nota: Cohere tem suporte limitado a Inference Profiles
 */
export class CohereStrategy implements VendorStrategy {
  readonly vendor = 'cohere';
  readonly supportedInferenceTypes: InferenceType[] = [
    'ON_DEMAND',
    'INFERENCE_PROFILE', // Suporte limitado
    'PROVISIONED',
    'CROSS_REGION'
  ];

  /**
   * Verifica se pode lidar com o modelId
   */
  canHandle(modelId: string): boolean {
    // Inference Profile: {region}.cohere.*
    if (/^(us|eu|apac)\.cohere\./i.test(modelId)) {
      return true;
    }

    // Standard format: cohere.*
    if (modelId.toLowerCase().startsWith('cohere.')) {
      return true;
    }

    // Direct API format: command-*
    if (modelId.toLowerCase().startsWith('command-')) {
      return true;
    }

    // ARN format (provisioned)
    if (modelId.startsWith('arn:aws:bedrock') && modelId.includes('cohere')) {
      return true;
    }

    return false;
  }

  /**
   * Detecta tipo de inference
   */
  detectInferenceType(modelId: string): InferenceType {
    // Inference Profile: {region}.cohere.*
    if (/^(us|eu|apac)\.cohere\./i.test(modelId)) {
      logger.debug('[CohereStrategy] Detected INFERENCE_PROFILE', { modelId });
      logger.warn('[CohereStrategy] Cohere has limited support for Inference Profiles');
      return 'INFERENCE_PROFILE';
    }

    // Provisioned: arn:aws:bedrock:...
    if (modelId.startsWith('arn:aws:bedrock')) {
      logger.debug('[CohereStrategy] Detected PROVISIONED', { modelId });
      return 'PROVISIONED';
    }

    // Cross-region inference profile
    if (modelId.includes('.cross-region.')) {
      logger.debug('[CohereStrategy] Detected CROSS_REGION', { modelId });
      return 'CROSS_REGION';
    }

    // Default: ON_DEMAND
    logger.debug('[CohereStrategy] Detected ON_DEMAND', { modelId });
    return 'ON_DEMAND';
  }

  /**
   * Cria adapter apropriado
   */
  createAdapter(inferenceType: InferenceType): BaseModelAdapter {
    // Cohere usa o mesmo adapter para todos os tipos
    // (não tem adapter específico para Inference Profile)
    logger.debug('[CohereStrategy] Creating CohereAdapter', { inferenceType });
    
    if (inferenceType === 'INFERENCE_PROFILE') {
      logger.warn('[CohereStrategy] Using standard CohereAdapter for INFERENCE_PROFILE (limited support)');
    }

    return new CohereAdapter();
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

    // Se é formato direto (command-*), adicionar prefixo
    if (normalized.toLowerCase().startsWith('command-') && !normalized.includes('.')) {
      normalized = `cohere.${normalized}`;
    }

    return normalized;
  }
}
