// backend/src/services/ai/adapters/loaders/adapter-validator.ts
// Standards: docs/STANDARDS.md

/**
 * @file adapter-validator.ts
 * @description Validação isolada de adapters e modelIds
 * @module services/ai/adapters/loaders
 */

import { BaseModelAdapter } from '../base.adapter';
import { InferenceType } from '../../types';

/**
 * Resultado de validação
 */
export interface ValidationResult {
  /**
   * Se validação passou
   */
  valid: boolean;

  /**
   * Erros encontrados
   */
  errors: string[];

  /**
   * Avisos (não impedem uso)
   */
  warnings: string[];
}

/**
 * Validador de adapters e modelIds
 * 
 * Centraliza toda lógica de validação.
 * 
 * @example
 * ```typescript
 * const validator = new AdapterValidator();
 * 
 * // Validar modelId
 * const result = validator.validateModelId('anthropic.claude-3');
 * if (!result.valid) {
 *   console.error('Invalid model:', result.errors);
 * }
 * 
 * // Validar adapter
 * const adapterResult = validator.validateAdapter(adapter);
 * ```
 */
export class AdapterValidator {
  /**
   * Valida modelId
   * 
   * @param modelId - ID do modelo
   * @returns Resultado da validação
   */
  validateModelId(modelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar não vazio
    if (!modelId || modelId.trim() === '') {
      errors.push('ModelId cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Validar formato básico
    if (!/^[a-zA-Z0-9._:-]+$/.test(modelId)) {
      errors.push('ModelId contains invalid characters');
    }

    // Validar comprimento
    if (modelId.length > 200) {
      errors.push('ModelId too long (max 200 characters)');
    }

    // Avisos para formatos suspeitos
    if (modelId.includes('..')) {
      warnings.push('ModelId contains consecutive dots');
    }

    if (modelId.startsWith('.') || modelId.endsWith('.')) {
      warnings.push('ModelId starts or ends with dot');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida adapter
   * 
   * @param adapter - Adapter a validar
   * @returns Resultado da validação
   */
  validateAdapter(adapter: BaseModelAdapter): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar métodos obrigatórios
    if (typeof adapter.supportsModel !== 'function') {
      errors.push('Adapter missing supportsModel method');
    }

    if (typeof adapter.formatRequest !== 'function') {
      errors.push('Adapter missing formatRequest method');
    }

    if (typeof adapter.parseChunk !== 'function') {
      errors.push('Adapter missing parseChunk method');
    }

    // Validar propriedades
    if (!adapter.vendor || adapter.vendor.trim() === '') {
      errors.push('Adapter missing vendor property');
    }

    if (!adapter.inferenceType || adapter.inferenceType.trim() === '') {
      errors.push('Adapter missing inferenceType property');
    }

    if (!adapter.supportedModels || adapter.supportedModels.length === 0) {
      errors.push('Adapter missing supportedModels property');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida inference type
   * 
   * @param inferenceType - Tipo de inference
   * @returns Resultado da validação
   */
  validateInferenceType(inferenceType: InferenceType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTypes: InferenceType[] = [
      'ON_DEMAND',
      'INFERENCE_PROFILE',
      'PROVISIONED',
      'CROSS_REGION'
    ];

    if (!validTypes.includes(inferenceType)) {
      errors.push(`Invalid inference type: ${inferenceType}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida compatibilidade entre modelId e adapter
   * 
   * @param modelId - ID do modelo
   * @param adapter - Adapter
   * @returns Resultado da validação
   */
  validateCompatibility(modelId: string, adapter: BaseModelAdapter): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar modelId
    const modelIdResult = this.validateModelId(modelId);
    if (!modelIdResult.valid) {
      errors.push(...modelIdResult.errors);
      return { valid: false, errors, warnings };
    }

    // Validar adapter
    const adapterResult = this.validateAdapter(adapter);
    if (!adapterResult.valid) {
      errors.push(...adapterResult.errors);
      return { valid: false, errors, warnings };
    }

    // Validar suporte
    try {
      if (!adapter.supportsModel(modelId)) {
        errors.push(`Adapter '${adapter.vendor}' does not support model '${modelId}'`);
      }
    } catch (error) {
      errors.push(`Error checking model support: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [...modelIdResult.warnings, ...adapterResult.warnings, ...warnings]
    };
  }

  /**
   * Valida formato de Inference Profile
   * 
   * @param modelId - ID do modelo
   * @returns Resultado da validação
   */
  validateInferenceProfileFormat(modelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Formato esperado: {region}.{vendor}.{model}
    const pattern = /^(us|eu|apac)\.[a-z]+\./i;
    
    if (!pattern.test(modelId)) {
      errors.push('Invalid Inference Profile format. Expected: {region}.{vendor}.{model}');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida formato de ARN
   * 
   * @param modelId - ID do modelo
   * @returns Resultado da validação
   */
  validateArnFormat(modelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Formato esperado: arn:aws:bedrock:{region}:{account}:provisioned-model/{id}
    const pattern = /^arn:aws:bedrock:[a-z0-9-]+:\d+:provisioned-model\/.+$/i;
    
    if (!pattern.test(modelId)) {
      errors.push('Invalid ARN format');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida batch de modelIds
   * 
   * @param modelIds - Array de modelIds
   * @returns Map de resultados por modelId
   */
  validateBatch(modelIds: string[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const modelId of modelIds) {
      results.set(modelId, this.validateModelId(modelId));
    }

    return results;
  }

  /**
   * Obtém estatísticas de validação
   * 
   * @param results - Array de resultados
   * @returns Estatísticas
   */
  getValidationStats(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
    };
  }
}
