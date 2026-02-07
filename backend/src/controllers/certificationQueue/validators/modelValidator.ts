// backend/src/controllers/certificationQueue/validators/modelValidator.ts
// Standards: docs/STANDARDS.md

import { PrismaClient, AIModel } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * Resultado da validação de modelo
 */
export interface ModelValidationResult {
  exists: boolean;
  model?: AIModel;
  searchedBy: 'apiModelId' | 'uuid' | 'both';
}

/**
 * Validador de modelos para certificação
 * 
 * Responsabilidades:
 * - Validar existência de modelos por apiModelId ou UUID
 * - Buscar modelos com fallback entre apiModelId e UUID
 * - Fornecer informações detalhadas sobre o resultado da busca
 */
export class ModelValidator {
  /**
   * Valida se um modelo existe no banco de dados
   * Tenta primeiro por apiModelId, depois por UUID como fallback
   * 
   * @param modelId - ID do modelo (pode ser apiModelId ou UUID)
   * @returns Resultado da validação com informações do modelo se encontrado
   */
  async validateModelExists(modelId: string): Promise<ModelValidationResult> {
    logger.debug('[ModelValidator] Validando existência de modelo', {
      modelId,
      modelIdType: typeof modelId
    });

    // Primeiro, tentar buscar por apiModelId (ex: "amazon.nova-lite-v1:0")
    const modelByApiId = await this.validateModelByApiId(modelId);
    
    if (modelByApiId) {
      logger.debug('[ModelValidator] Modelo encontrado por apiModelId', {
        modelId,
        foundModelId: modelByApiId.id,
        foundApiModelId: modelByApiId.apiModelId
      });
      
      return {
        exists: true,
        model: modelByApiId,
        searchedBy: 'apiModelId'
      };
    }

    // Fallback: tentar buscar por UUID
    logger.debug('[ModelValidator] Não encontrado por apiModelId, tentando por UUID');
    const modelByUUID = await this.validateModelByUUID(modelId);
    
    if (modelByUUID) {
      logger.debug('[ModelValidator] Modelo encontrado por UUID', {
        modelId,
        foundModelId: modelByUUID.id,
        foundApiModelId: modelByUUID.apiModelId
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
      searchedBy: 'apiModelId e uuid'
    });
    
    return {
      exists: false,
      searchedBy: 'both'
    };
  }

  /**
   * Busca modelo por apiModelId (ID da AWS)
   * 
   * @param apiModelId - ID do modelo na AWS (ex: "amazon.nova-lite-v1:0")
   * @returns Modelo encontrado ou null
   */
  async validateModelByApiId(apiModelId: string): Promise<AIModel | null> {
    try {
      const model = await prisma.aIModel.findFirst({
        where: { apiModelId }
      });
      
      return model;
    } catch (error: any) {
      logger.error('[ModelValidator] Erro ao buscar por apiModelId', {
        apiModelId,
        error: error.message
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
  async validateModelByUUID(uuid: string): Promise<AIModel | null> {
    try {
      // Validar formato de UUID antes de consultar
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(uuid)) {
        logger.debug('[ModelValidator] Formato de UUID inválido', { uuid });
        return null;
      }
      
      const model = await prisma.aIModel.findUnique({
        where: { id: uuid }
      });
      
      return model;
    } catch (error: any) {
      logger.error('[ModelValidator] Erro ao buscar por UUID', {
        uuid,
        error: error.message
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
