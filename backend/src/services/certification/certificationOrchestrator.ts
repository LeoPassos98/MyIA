// backend/src/services/certification/certificationOrchestrator.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Orquestração de fluxo de certificação

import { ModelCertificationService, ProgressCallback } from '../ai/certification';
import { CertificationResult } from '../ai/certification/types';
import { resolveCredentials } from '../../utils/certification/credentialsResolver';
import { buildCompleteResponse } from '../../utils/certification/responseBuilder';
import { logger } from '../../utils/logger';

/**
 * Resultado completo com status code e resposta
 */
export interface OrchestrationResult {
  statusCode: number;
  response: any;
}

/**
 * Orquestrador de certificação
 * Coordena o fluxo completo de certificação de modelos
 */
export class CertificationOrchestrator {
  private certificationService: ModelCertificationService;
  
  constructor() {
    this.certificationService = new ModelCertificationService();
  }
  
  /**
   * Certifica um modelo específico
   * 
   * @param modelId - ID do modelo a certificar
   * @param userId - ID do usuário autenticado
   * @param force - Se true, ignora cache
   * @param requestId - ID da requisição para logging
   * @param onProgress - Callback opcional para progresso (SSE)
   * @returns Resultado com status code e resposta JSend
   */
  async certifyModel(
    modelId: string,
    userId: string,
    force: boolean = false,
    requestId?: string,
    onProgress?: ProgressCallback
  ): Promise<OrchestrationResult> {
    logger.info('Orquestrando certificação de modelo', {
      requestId,
      userId,
      modelId,
      force
    });
    
    // Validar entrada
    if (!modelId || typeof modelId !== 'string') {
      throw new Error('modelId is required and must be a string');
    }
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }
    
    // Resolver credenciais AWS
    const credentials = await resolveCredentials(userId, requestId);
    
    // Executar certificação
    logger.info('Executando certificação', {
      requestId,
      userId,
      modelId,
      region: credentials.region
    });
    
    const result = await this.certificationService.certifyModel(
      modelId,
      credentials,
      force,
      onProgress
    );
    
    // Construir resposta completa
    const response = buildCompleteResponse(result);
    
    logger.info('Certificação concluída', {
      requestId,
      userId,
      modelId,
      status: result.status,
      isAvailable: result.isAvailable,
      statusCode: response.statusCode
    });
    
    return response;
  }
  
  /**
   * Certifica todos os modelos de um vendor
   * 
   * @param vendor - Nome do vendor
   * @param userId - ID do usuário autenticado
   * @param requestId - ID da requisição para logging
   * @returns Array de resultados de certificação
   */
  async certifyVendor(
    vendor: string,
    userId: string,
    requestId?: string
  ): Promise<CertificationResult[]> {
    logger.info('Orquestrando certificação de vendor', {
      requestId,
      userId,
      vendor
    });
    
    // Validar entrada
    if (!vendor || typeof vendor !== 'string') {
      throw new Error('vendor is required and must be a string');
    }
    
    // Resolver credenciais AWS
    const credentials = await resolveCredentials(userId, requestId);
    
    // Executar certificação
    const results = await this.certificationService.certifyVendor(vendor, credentials);
    
    logger.info('Certificação de vendor concluída', {
      requestId,
      userId,
      vendor,
      totalModels: results.length
    });
    
    return results;
  }
  
  /**
   * Certifica todos os modelos disponíveis
   * 
   * @param userId - ID do usuário autenticado
   * @param requestId - ID da requisição para logging
   * @returns Array de resultados de certificação
   */
  async certifyAll(
    userId: string,
    requestId?: string
  ): Promise<CertificationResult[]> {
    logger.info('Orquestrando certificação de todos os modelos', {
      requestId,
      userId
    });
    
    // Resolver credenciais AWS
    const credentials = await resolveCredentials(userId, requestId);
    
    // Executar certificação
    const results = await this.certificationService.certifyAll(credentials);
    
    logger.info('Certificação de todos os modelos concluída', {
      requestId,
      userId,
      totalModels: results.length
    });
    
    return results;
  }
  
  /**
   * Obtém certificação do cache (sem executar testes)
   * 
   * @param modelId - ID do modelo
   * @param requestId - ID da requisição para logging
   * @returns Certificação em cache ou null
   */
  async getCachedCertification(
    modelId: string,
    requestId?: string
  ): Promise<CertificationResult | null> {
    logger.info('Buscando certificação em cache', {
      requestId,
      modelId
    });
    
    const cached = await this.certificationService.getCachedCertification(modelId);
    
    if (cached) {
      logger.info('Certificação encontrada em cache', {
        requestId,
        modelId,
        status: cached.status
      });
    } else {
      logger.info('Certificação não encontrada em cache', {
        requestId,
        modelId
      });
    }
    
    return cached;
  }
}
