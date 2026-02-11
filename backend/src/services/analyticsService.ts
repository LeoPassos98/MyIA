// backend/src/services/analyticsService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// Schema v2: prisma import mantido para uso futuro com SystemMetric
// import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

/**
 * Schema v2: ApiCallLog foi REMOVIDO do schema
 *
 * Este serviço precisa ser refatorado para usar SystemMetric ou outra fonte de dados.
 * Por enquanto, retornamos dados vazios para não quebrar o build.
 *
 * TODO: Implementar analytics usando SystemMetric ou criar nova tabela de logs de uso
 */
export const analyticsService = {
  getCostOverTime: async (userId: string) => {
    // Schema v2: ApiCallLog foi removido
    // Retornar array vazio até implementar nova solução
    logger.warn(`[analyticsService.getCostOverTime] ApiCallLog removido do schema v2. userId: ${userId}`);
    
    // TODO: Implementar usando SystemMetric
    // const data = await prisma.systemMetric.findMany({
    //   where: { metricType: 'cost', metadata: { path: ['userId'], equals: userId } },
    //   orderBy: { timestamp: 'asc' }
    // });
    
    return [];
  },

  getCostEfficiency: async (userId: string) => {
    // Schema v2: ApiCallLog foi removido
    // Retornar array vazio até implementar nova solução
    logger.warn(`[analyticsService.getCostEfficiency] ApiCallLog removido do schema v2. userId: ${userId}`);
    
    // TODO: Implementar usando SystemMetric
    return [];
  },

  getLoadMap: async (userId: string) => {
    // Schema v2: ApiCallLog foi removido
    // Retornar array vazio até implementar nova solução
    logger.warn(`[analyticsService.getLoadMap] ApiCallLog removido do schema v2. userId: ${userId}`);
    
    // TODO: Implementar usando SystemMetric
    return [];
  }
};
