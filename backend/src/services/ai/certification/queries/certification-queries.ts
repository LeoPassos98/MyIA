// backend/src/services/ai/certification/queries/certification-queries.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../../../../lib/prisma';
import { ModelCertificationStatus, CategorizedError } from '../types';
import { categorizeError } from '../error-categorizer';
import { logger } from '../../../../utils/logger';

// Região padrão para queries sem região especificada
const DEFAULT_REGION = 'us-east-1';

/**
 * Gerencia consultas de certificações no banco de dados
 * 
 * Responsabilidades:
 * - Buscar modelos certificados
 * - Buscar modelos que falharam
 * - Buscar modelos indisponíveis
 * - Buscar modelos com quality warning
 * - Verificar se modelo está certificado
 * - Obter detalhes completos de certificação
 * 
 * @example
 * const queries = new CertificationQueries();
 * const certified = await queries.getCertifiedModels();
 * const isCert = await queries.isCertified('model-id', 'us-east-1');
 */
export class CertificationQueries {
  /**
   * Obtém lista de modelos certificados e não expirados
   *
   * @returns Array de modelIds certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos certificados');
    const now = new Date();
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: ModelCertificationStatus.CERTIFIED,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      select: {
        modelId: true
      }
    });
    
    const modelIds = certifications.map(c => c.modelId);
    logger.info('[CertificationQueries] Modelos certificados encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }
  
  /**
   * Obtém lista de modelos que falharam na certificação
   * Retorna todos os modelos que não estão certificados (incluindo quality_warning)
   *
   * @returns Array de modelIds que falharam
   */
  async getFailedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos que falharam');
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: { not: ModelCertificationStatus.CERTIFIED }
      },
      select: {
        modelId: true
      },
      distinct: ['modelId']
    });
    
    const modelIds = certifications.map(c => c.modelId);
    logger.info('[CertificationQueries] Modelos que falharam encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos realmente indisponíveis (não podem ser usados)
   * Retorna modelos com status 'failed' E categorias de erro críticas
   *
   * @returns Array de modelIds indisponíveis
   */
  async getUnavailableModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos indisponíveis');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: { in: [ModelCertificationStatus.FAILED] },
        errorCategory: {
          in: ['UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR', 'PROVISIONING_REQUIRED']
        }
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationQueries] Modelos indisponíveis encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de TODOS os modelos com status 'failed'
   * Usado para exibir badge vermelho "❌ Indisponível" no frontend
   *
   * @returns Array de modelIds que falharam na certificação
   */
  async getAllFailedModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando TODOS os modelos com status failed');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: ModelCertificationStatus.FAILED
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationQueries] Modelos failed encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos com warnings de qualidade
   *
   * @returns Array de modelIds com quality_warning
   */
  async getQualityWarningModels(): Promise<string[]> {
    logger.info('[CertificationQueries] Buscando modelos com warning de qualidade');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: ModelCertificationStatus.QUALITY_WARNING
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationQueries] Modelos com warning encontrados', {
      count: modelIds.length
    });
    
    return modelIds;
  }
  
  /**
   * Verifica se um modelo está certificado e não expirado
   * 
   * @param modelId - ID do modelo a verificar
   * @param region - Região AWS (padrão: us-east-1)
   * @returns true se certificado e válido
   */
  async isCertified(modelId: string, region: string = DEFAULT_REGION): Promise<boolean> {
    const now = new Date();
    
    const certification = await prisma.modelCertification.findUnique({
      where: { 
        modelId_region: { modelId, region } 
      }
    });
    
    if (!certification) {
      return false;
    }
    
    if (certification.status !== ModelCertificationStatus.CERTIFIED) {
      return false;
    }
    
    if (certification.expiresAt && certification.expiresAt <= now) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtém detalhes completos da certificação de um modelo
   *
   * @param modelId - ID do modelo
   * @param region - Região AWS (padrão: us-east-1)
   * @returns Detalhes da certificação ou null se não encontrado
   */
  async getCertificationDetails(modelId: string, region: string = DEFAULT_REGION): Promise<{
    modelId: string;
    status: string;
    certifiedAt: Date | null;
    expiresAt: Date | null;
    lastTestedAt: Date;
    testsPassed: number;
    testsFailed: number;
    successRate: number;
    avgLatencyMs: number;
    lastError: string | null;
    isValid: boolean;
    daysUntilExpiration: number | null;
    errorCategory: string | null;
    errorSeverity: string | null;
    categorizedError?: CategorizedError;
  } | null> {
    const cert = await prisma.modelCertification.findUnique({
      where: { 
        modelId_region: { modelId, region } 
      }
    });
    
    if (!cert) {
      return null;
    }
    
    const now = new Date();
    const isValid = cert.status === ModelCertificationStatus.CERTIFIED &&
                    (!cert.expiresAt || cert.expiresAt > now);
    
    const daysUntilExpiration = cert.expiresAt
      ? Math.ceil((cert.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Reconstruir categorizedError se houver erro
    let categorizedError: CategorizedError | undefined;
    if (cert.errorCategory && cert.lastError) {
      categorizedError = categorizeError(cert.lastError);
    }
    
    return {
      modelId: cert.modelId,
      status: cert.status,
      certifiedAt: cert.certifiedAt,
      expiresAt: cert.expiresAt,
      lastTestedAt: cert.lastTestedAt || new Date(),
      testsPassed: cert.testsPassed,
      testsFailed: cert.testsFailed,
      successRate: cert.successRate,
      avgLatencyMs: cert.avgLatencyMs || 0,
      lastError: cert.lastError,
      isValid,
      daysUntilExpiration,
      errorCategory: cert.errorCategory,
      errorSeverity: cert.errorSeverity,
      categorizedError
    };
  }
}
