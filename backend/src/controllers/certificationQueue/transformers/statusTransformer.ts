// backend/src/controllers/certificationQueue/transformers/statusTransformer.ts
// Standards: docs/STANDARDS.md

import { CertificationStatus } from '@prisma/client';
import { logger } from '../../../utils/logger';

/**
 * Transformador de status de certificação
 * 
 * Responsabilidades:
 * - Converter status entre formato Prisma (UPPERCASE) e frontend (lowercase)
 * - Garantir consistência de status em toda a aplicação
 * - Validar status antes de conversão
 */
export class StatusTransformer {
  /**
   * Converte status do Prisma (UPPERCASE) para formato do frontend (lowercase)
   * 
   * Exemplos:
   * - CERTIFIED → certified
   * - FAILED → failed
   * - QUALITY_WARNING → quality_warning
   * 
   * @param prismaStatus - Status no formato Prisma
   * @returns Status no formato lowercase
   */
  toFrontendStatus(prismaStatus: CertificationStatus): string {
    const frontendStatus = prismaStatus.toLowerCase();
    
    logger.debug('[StatusTransformer] Convertendo status Prisma → Frontend', {
      prismaStatus,
      frontendStatus
    });
    
    return frontendStatus;
  }

  /**
   * Converte status do frontend (lowercase) para formato Prisma (UPPERCASE)
   * 
   * Exemplos:
   * - certified → CERTIFIED
   * - failed → FAILED
   * - quality_warning → QUALITY_WARNING
   * 
   * @param frontendStatus - Status no formato lowercase
   * @returns Status no formato Prisma
   */
  toPrismaStatus(frontendStatus: string): CertificationStatus {
    const prismaStatus = frontendStatus.toUpperCase() as CertificationStatus;
    
    logger.debug('[StatusTransformer] Convertendo status Frontend → Prisma', {
      frontendStatus,
      prismaStatus
    });
    
    // Validar se é um status válido
    const validStatuses = Object.values(CertificationStatus);
    if (!validStatuses.includes(prismaStatus)) {
      logger.warn('[StatusTransformer] Status inválido detectado', {
        frontendStatus,
        prismaStatus,
        validStatuses
      });
      throw new Error(
        `Invalid status: ${frontendStatus}. Valid statuses: ${validStatuses.join(', ')}`
      );
    }
    
    return prismaStatus;
  }

  /**
   * Converte array de status do Prisma para frontend
   * 
   * @param prismaStatuses - Array de status no formato Prisma
   * @returns Array de status no formato frontend
   */
  toFrontendStatuses(prismaStatuses: CertificationStatus[]): string[] {
    return prismaStatuses.map(status => this.toFrontendStatus(status));
  }

  /**
   * Converte array de status do frontend para Prisma
   * 
   * @param frontendStatuses - Array de status no formato frontend
   * @returns Array de status no formato Prisma
   */
  toPrismaStatuses(frontendStatuses: string[]): CertificationStatus[] {
    return frontendStatuses.map(status => this.toPrismaStatus(status));
  }

  /**
   * Verifica se um status é válido
   * 
   * @param status - Status para validar (qualquer formato)
   * @returns true se o status é válido
   */
  isValidStatus(status: string): boolean {
    try {
      this.toPrismaStatus(status);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtém lista de todos os status válidos
   * 
   * @param format - Formato desejado ('prisma' ou 'frontend')
   * @returns Array de status válidos
   */
  getValidStatuses(format: 'prisma' | 'frontend' = 'frontend'): string[] {
    const prismaStatuses = Object.values(CertificationStatus);
    
    if (format === 'prisma') {
      return prismaStatuses;
    }
    
    return prismaStatuses.map(status => this.toFrontendStatus(status));
  }
}

// Exportar instância singleton
export const statusTransformer = new StatusTransformer();
