// frontend/src/services/certificationService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Certification Service
 * 
 * Serviço para buscar certificações regionais de modelos AI
 */

import { api } from './api';
import type { RegionalCertification, AWSRegion } from '../types/ai';

/**
 * Serviço de certificação regional
 */
export const certificationService = {
  /**
   * Busca todas as certificações regionais de um modelo
   * 
   * @param modelId - ID completo do modelo (ex: 'anthropic:claude-3-5-sonnet-20241022')
   * @param providerId - ID do provider (ex: 'aws-bedrock')
   * @returns Array de certificações regionais
   */
  async getAllRegionalCertifications(
    modelId: string,
    providerId: string
  ): Promise<RegionalCertification[]> {
    const response = await api.get<RegionalCertification[]>(
      `/api/certification-queue/certifications`,
      {
        params: {
          modelId,
          providerId
        }
      }
    );

    return response.data;
  },

  /**
   * Busca certificação de uma região específica
   * 
   * @param modelId - ID do modelo
   * @param providerId - ID do provider
   * @param region - Região AWS
   * @returns Certificação regional ou null se não encontrada
   */
  async getRegionalCertification(
    modelId: string,
    providerId: string,
    region: AWSRegion
  ): Promise<RegionalCertification | null> {
    const certifications = await this.getAllRegionalCertifications(modelId, providerId);
    return certifications.find(cert => cert.region === region) || null;
  }
};
