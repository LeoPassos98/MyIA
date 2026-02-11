// backend/src/controllers/certificationQueue/validators/modelValidator.ts
// Standards: docs/STANDARDS.md

import { PrismaClient, ModelDeployment } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * Resultado da validação de modelo
 * Schema v2: Usa ModelDeployment em vez de AIModel
 */
export interface ModelValidationResult {
  exists: boolean;
  model?: ModelDeployment;
  searchedBy: 'deploymentId' | 'uuid' | 'both';
}

/**
 * Validador de modelos para certificação
 * Schema v2: Usa ModelDeployment em vez de AIModel
 * 
 * Responsabilidades:
 * - Validar existência de modelos por deploymentId ou UUID
 * - Buscar modelos com fallback entre deploymentId e UUID
 * - Fornecer informações detalhadas sobre o resultado da busca
 */
export class ModelValidator {
  /**
   * Valida se um modelo existe no banco de dados
   * Tenta primeiro por deploymentId, depois por UUID como fallback
   * 
   * @param modelId - ID do modelo (pode ser deploymentId ou UUID)
   * @returns Resultado da validação com informações do modelo se encontrado
   */
  async validateModelExists(modelId: string): Promise<ModelValidationResult> {
    logger.debug('[ModelValidator] Validando existência de modelo', {
      modelId,
      modelIdType: typeof modelId
    });

    // Primeiro, tentar buscar por deploymentId (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
    const modelByDeploymentId = await this.validateModelByDeploymentId(modelId);
    
    if (modelByDeploymentId) {
      logger.debug('[ModelValidator] Modelo encontrado por deploymentId', {
        modelId,
        foundModelId: modelByDeploymentId.id,
        foundDeploymentId: modelByDeploymentId.deploymentId
      });
      
      return {
        exists: true,
        model: modelByDeploymentId,
        searchedBy: 'deploymentId'
      };
    }

    // Fallback: tentar buscar por UUID
    logger.debug('[ModelValidator] Não encontrado por deploymentId, tentando por UUID');
    const modelByUUID = await this.validateModelByUUID(modelId);
    
    if (modelByUUID) {
      logger.debug('[ModelValidator] Modelo encontrado por UUID', {
        modelId,
        foundModelId: modelByUUID.id,
        foundDeploymentId: modelByUUID.deploymentId
      });
      
      return {
        exists: true,
        model: modelByUUID,
        searchedBy: 'uuid'
      };
    }

    // Modelo não encontrado
    logger.warn('[ModelValidator] Modelo não encontrado', {
      modelId,
      searchedBy: 'deploymentId e uuid'
    });
    
    return {
      exists: false,
      searchedBy: 'both'
    };
  }

  /**
   * Busca modelo por deploymentId (ID do provider)
   * Schema v2: Usa deploymentId em vez de apiModelId
   * 
   * @param deploymentId - ID do modelo no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
   * @returns Modelo encontrado ou null
   */
  async validateModelByDeploymentId(deploymentId: string): Promise<ModelDeployment | null> {
    try {
      const model = await prisma.modelDeployment.findFirst({
        where: { deploymentId }
      });
      
      return model;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[ModelValidator] Erro ao buscar por deploymentId', {
        deploymentId,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Busca modelo por UUID
   * 
   * @param uuid - UUID do modelo no banco de dados
   * @returns Modelo encontrado ou null
   */
  async validateModelByUUID(uuid: string): Promise<ModelDeployment | null> {
    try {
      // Validar formato de UUID antes de consultar
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(uuid)) {
        logger.debug('[ModelValidator] Formato de UUID inválido', { uuid });
        return null;
      }
      
      const model = await prisma.modelDeployment.findUnique({
        where: { id: uuid }
      });
      
      return model;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[ModelValidator] Erro ao buscar por UUID', {
        uuid,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Valida múltiplos modelos de uma vez
   * 
   * @param modelIds - Array de IDs de modelos
   * @returns Array de resultados de validação
   */
  async validateMultipleModels(modelIds: string[]): Promise<ModelValidationResult[]> {
    logger.debug('[ModelValidator] Validando múltiplos modelos', {
      count: modelIds.length,
      modelIds
    });

    const results = await Promise.all(
      modelIds.map(modelId => this.validateModelExists(modelId))
    );

    const existingCount = results.filter(r => r.exists).length;
    logger.info('[ModelValidator] Validação de múltiplos modelos concluída', {
      total: modelIds.length,
      existing: existingCount,
      missing: modelIds.length - existingCount
    });

    return results;
  }
}

// Exportar instância singleton
export const modelValidator = new ModelValidator();
