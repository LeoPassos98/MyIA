/**
 * frontend/src/services/certificationService.ts
 * Service for model certification API operations
 * Standards: docs/STANDARDS.md
 */

import { api } from './api';

export interface CertificationResult {
  modelId: string;
  status: string;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs: number;
  isCertified: boolean;
}

export const certificationService = {
  /**
   * Certifica um modelo específico
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyModel(modelId: string): Promise<CertificationResult> {
    console.log('[CertificationService] 🚀 Chamando API POST /certification/certify-model:', { modelId });
    const response = await api.post('/certification/certify-model', {
      modelId
      // Não enviar credentials - backend busca do banco
    });
    console.log('[CertificationService] ✅ Resposta recebida:', response.data);
    return response.data.certification;
  },

  /**
   * Certifica todos os modelos de um vendor
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyVendor(vendor: string): Promise<CertificationResult[]> {
    const response = await api.post('/certification/certify-vendor', {
      vendor
      // Não enviar credentials - backend busca do banco
    });
    return response.data.certifications;
  },

  /**
   * Certifica todos os modelos
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyAll(): Promise<CertificationResult[]> {
    const response = await api.post('/certification/certify-all', {
      // Não enviar credentials - backend busca do banco
    });
    return response.data.certifications;
  },

  /**
   * Lista modelos certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    console.log('[CertificationService] 📋 Chamando API GET /certification/certified-models');
    const response = await api.get('/certification/certified-models');
    console.log('[CertificationService] ✅ Modelos certificados recebidos:', response.data.modelIds);
    return response.data.modelIds;
  },

  /**
   * Verifica se modelo está certificado
   */
  async isCertified(modelId: string): Promise<boolean> {
    const response = await api.get(`/certification/is-certified/${modelId}`);
    return response.data.isCertified;
  }
};
