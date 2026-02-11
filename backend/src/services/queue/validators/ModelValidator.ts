// backend/src/services/queue/validators/ModelValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

/**
 * ModelValidator
 * 
 * Responsabilidade: Validar modelos antes de criar jobs de certificação
 * Schema v2: Usa ModelDeployment em vez de AIModel
 */
export class ModelValidator {
  /**
   * Valida se um modelo existe no banco
   * Schema v2: Busca em ModelDeployment
   */
  async validateModel(modelId: string): Promise<{ uuid: string; deploymentId: string }> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);

    if (isUUID) {
      const deployment = await prisma.modelDeployment.findUnique({
        where: { id: modelId },
        select: { id: true, deploymentId: true }
      });

      if (!deployment) {
        throw new Error(`Deployment ${modelId} não encontrado no banco de dados`);
      }

      return {
        uuid: deployment.id,
        deploymentId: deployment.deploymentId
      };
    } else {
      const deployment = await prisma.modelDeployment.findFirst({
        where: { deploymentId: modelId },
        select: { id: true, deploymentId: true }
      });

      if (!deployment) {
        throw new Error(`Deployment ${modelId} não encontrado no banco de dados`);
      }

      return {
        uuid: deployment.id,
        deploymentId: deployment.deploymentId
      };
    }
  }

  /**
   * Valida múltiplos modelos
   * Schema v2: Busca em ModelDeployment
   */
  async validateModels(modelIds: string[]): Promise<{
    valid: Array<{ uuid: string; deploymentId: string }>;
    invalid: string[];
  }> {
    const valid: Array<{ uuid: string; deploymentId: string }> = [];
    const invalid: string[] = [];

    for (const modelId of modelIds) {
      try {
        const result = await this.validateModel(modelId);
        valid.push(result);
      } catch {
        invalid.push(modelId);
        logger.warn(`Modelo ${modelId} não encontrado no banco de dados`);
      }
    }

    return { valid, invalid };
  }

  /**
   * Obtém todos os modelos Bedrock válidos
   * Schema v2: Busca em ModelDeployment com provider Bedrock
   */
  async getValidBedrockModels(): Promise<Array<{ uuid: string; deploymentId: string }>> {
    // Buscar provider Bedrock
    const bedrockProvider = await prisma.provider.findFirst({
      where: { 
        OR: [
          { slug: 'bedrock' },
          { type: 'AWS_BEDROCK' }
        ]
      },
      select: { id: true }
    });

    if (!bedrockProvider) {
      logger.warn('Provider Bedrock não encontrado');
      return [];
    }

    // Buscar deployments do provider Bedrock
    const deployments = await prisma.modelDeployment.findMany({
      where: {
        providerId: bedrockProvider.id,
        isActive: true
      },
      select: {
        id: true,
        deploymentId: true
      }
    });

    return deployments.map(d => ({
      uuid: d.id,
      deploymentId: d.deploymentId
    }));
  }
}
