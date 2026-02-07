// backend/src/services/ai/adapters/strategies/amazon-strategy.ts
// Standards: docs/STANDARDS.md

/**
 * @file amazon-strategy.ts
 * @description Strategy para Amazon Titan models
 * @module services/ai/adapters/strategies
 */

import { VendorStrategy } from './vendor-strategy.interface';
import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';
import { AmazonAdapter } from '../amazon.adapter';
import { AmazonProfileAdapter } from '../inference-profile';
import { logger } from '../../../../utils/logger';

/**
 * Strategy para Amazon Titan
 * 
 * Suporta:
 * - ON_DEMAND: amazon.titan-*
 * - INFERENCE_PROFILE: {region}.amazon.titan-*
 * - PROVISIONED: arn:aws:bedrock:...:provisioned-model/*
 */
export class AmazonStrategy implements VendorStrategy {
  readonly vendor = 'amazon';
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
    // Inference Profile: {region}.amazon.*
    if (/^(us|eu|apac)\.amazon\./i.test(modelId)) {
      return true;
    }

    // Standard format: amazon.*
    if (modelId.toLowerCase().startsWith('amazon.')) {
      return true;
    }

    // ARN format (provisioned)
    if (modelId.startsWith('arn:aws:bedrock') && modelId.includes('amazon')) {
      return true;
    }

    return false;
  }

  /**
   * Detecta tipo de inference
   */
  detectInferenceType(modelId: string): InferenceType {
    // Inference Profile: {region}.amazon.*
    if (/^(us|eu|apac)\.amazon\./i.test(modelId)) {
      logger.debug('[AmazonStrategy] Detected INFERENCE_PROFILE', { modelId });
      return 'INFERENCE_PROFILE';
    }

    // Provisioned: arn:aws:bedrock:...
    if (modelId.startsWith('arn:aws:bedrock')) {
      logger.debug('[AmazonStrategy] Detected PROVISIONED', { modelId });
      return 'PROVISIONED';
    }

    // Cross-region inference profile
    if (modelId.includes('.cross-region.')) {
      logger.debug('[AmazonStrategy] Detected CROSS_REGION', { modelId });
      return 'CROSS_REGION';
    }

    // Default: ON_DEMAND
    logger.debug('[AmazonStrategy] Detected ON_DEMAND', { modelId });
    return 'ON_DEMAND';
  }

  /**
   * Cria adapter apropriado
   */
  createAdapter(inferenceType: InferenceType): BaseModelAdapter {
    switch (inferenceType) {
      case 'INFERENCE_PROFILE':
        logger.debug('[AmazonStrategy] Creating AmazonProfileAdapter');
        return new AmazonProfileAdapter();

      case 'ON_DEMAND':
      case 'PROVISIONED':
      case 'CROSS_REGION':
      default:
        logger.debug('[AmazonStrategy] Creating AmazonAdapter');
        return new AmazonAdapter();
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
    return modelId.replace(/:/g, '.');
  }
}
