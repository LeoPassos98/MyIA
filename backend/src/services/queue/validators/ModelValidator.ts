// backend/src/services/queue/validators/ModelValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';
import { ModelRegistry } from '../../ai/registry';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * Modelo validado com informações essenciais
 */
export interface ValidatedModel {
  uuid: string;
  apiModelId: string;
  name: string;
}

/**
 * Resultado de validação de múltiplos modelos
 */
export interface ValidationResult {
  valid: ValidatedModel[];
  invalid: string[];
}

/**
 * ModelValidator
 * 
 * Responsabilidade: Validar modelos antes de criar jobs de certificação
 * - Verifica existência no banco de dados
 * - Valida presença no ModelRegistry
 * - Filtra modelos inválidos
 */
export class ModelValidator {
  /**
   * Valida se modelo existe no banco e no ModelRegistry
   * @throws Error se modelo inválido
   */
  async validateModel(modelId: string): Promise<ValidatedModel> {
    logger.info(`🔍 Validando modelo: ${modelId}`);

    // Buscar por apiModelId (ID da AWS) primeiro
    let model = await prisma.aIModel.findFirst({
      where: { apiModelId: modelId },
      select: { id: true, apiModelId: true, name: true }
    });

    // Fallback: tentar buscar por id (UUID) se não encontrar por apiModelId
    if (!model) {
      model = await prisma.aIModel.findUnique({
        where: { id: modelId },
        select: { id: true, apiModelId: true, name: true }
      });
    }

    if (!model) {
      throw new Error(`Modelo ${modelId} não encontrado no banco de dados`);
    }

    // Validar no ModelRegistry
    if (!ModelRegistry.isSupported(model.apiModelId)) {
      logger.error(`❌ Modelo ${model.name} (${model.apiModelId}) não encontrado no ModelRegistry`);
      throw new Error(`Modelo ${model.name} (${model.apiModelId}) não suportado - não existe no ModelRegistry`);
    }

    logger.info(`✅ Modelo ${model.name} (${model.apiModelId}) validado no ModelRegistry`);

    return {
      uuid: model.id,
      apiModelId: model.apiModelId,
      name: model.name
    };
  }

  /**
   * Valida múltiplos modelos e retorna apenas os válidos
   * @returns Array de modelos válidos + array de inválidos
   */
  async validateModels(modelIds: string[]): Promise<ValidationResult> {
    logger.info(`🔍 Validando ${modelIds.length} modelos`);

    // Buscar informações dos modelos
    const modelsInfo = await prisma.aIModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, apiModelId: true, name: true }
    });

    // Validar cada modelo no Registry
    const validModels: ValidatedModel[] = [];
    const invalidModels: string[] = [];

    for (const model of modelsInfo) {
      if (ModelRegistry.isSupported(model.apiModelId)) {
        validModels.push({
          uuid: model.id,
          apiModelId: model.apiModelId,
          name: model.name
        });
      } else {
        const invalidEntry = `${model.name} (${model.apiModelId})`;
        invalidModels.push(invalidEntry);
        logger.warn(`⚠️ Modelo ${invalidEntry} não encontrado no ModelRegistry - ignorando`);
      }
    }

    if (invalidModels.length > 0) {
      logger.warn(`⚠️ ${invalidModels.length} modelos ignorados por não existirem no ModelRegistry: ${invalidModels.join(', ')}`);
    }

    logger.info(`✅ ${validModels.length} modelos válidos no ModelRegistry (de ${modelsInfo.length} no banco)`);

    return {
      valid: validModels,
      invalid: invalidModels
    };
  }

  /**
   * Busca todos modelos Bedrock ativos e válidos
   */
  async getValidBedrockModels(): Promise<ValidatedModel[]> {
    logger.info(`📊 Buscando todos os modelos Bedrock ativos`);

    // Buscar todos os modelos ativos do provider Bedrock
    const models = await prisma.aIModel.findMany({
      where: {
        isActive: true,
        provider: {
          slug: 'bedrock'
        }
      },
      select: {
        id: true,
        apiModelId: true,
        name: true
      }
    });

    logger.info(`📊 Encontrados ${models.length} modelos Bedrock ativos no banco`);

    // Filtrar apenas modelos que existem no ModelRegistry
    const validModels: ValidatedModel[] = [];

    for (const model of models) {
      const existsInRegistry = ModelRegistry.isSupported(model.apiModelId);
      if (existsInRegistry) {
        validModels.push({
          uuid: model.id,
          apiModelId: model.apiModelId,
          name: model.name
        });
      } else {
        logger.warn(`⚠️ Modelo ${model.name} (${model.apiModelId}) não encontrado no ModelRegistry - ignorando`);
      }
    }

    logger.info(`✅ ${validModels.length} modelos válidos no ModelRegistry (de ${models.length} no banco)`);

    if (validModels.length === 0) {
      logger.warn(`⚠️ Nenhum modelo Bedrock válido encontrado para certificação`);
      throw new Error('Nenhum modelo Bedrock válido encontrado para certificação');
    }

    return validModels;
  }
}
