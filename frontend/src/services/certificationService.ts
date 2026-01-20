/**
 * frontend/src/services/certificationService.ts
 * Service for model certification API operations with caching
 * Standards: docs/STANDARDS.md
 */

import { api } from './api';
import { logger } from '../utils/logger';

export interface CertificationResult {
  modelId: string;
  status: string;
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs: number;
  isCertified: boolean;
}

// ✅ OTIMIZAÇÃO: Cache interno com TTL
class CertificationService {
  private cache: {
    certifiedModels: string[] | null;
    timestamp: number;
  } = {
    certifiedModels: null,
    timestamp: 0
  };
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Certifica um modelo específico
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyModel(modelId: string): Promise<CertificationResult> {
    logger.log('[CertificationService] 🚀 Chamando API POST /certification/certify-model:', { modelId });
    const response = await api.post('/certification/certify-model', {
      modelId
    });
    logger.log('[CertificationService] ✅ Resposta recebida:', response.data);
    
    // ✅ OTIMIZAÇÃO: Invalidar cache após certificação
    this.invalidateCache();
    
    return response.data.certification;
  }

  /**
   * Certifica todos os modelos de um vendor
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyVendor(vendor: string): Promise<CertificationResult[]> {
    const response = await api.post('/certification/certify-vendor', {
      vendor
    });
    
    // ✅ OTIMIZAÇÃO: Invalidar cache após certificação
    this.invalidateCache();
    
    return response.data.certifications;
  }

  /**
   * Certifica todos os modelos
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyAll(): Promise<CertificationResult[]> {
    const response = await api.post('/certification/certify-all', {});
    
    // ✅ OTIMIZAÇÃO: Invalidar cache após certificação
    this.invalidateCache();
    
    return response.data.certifications;
  }

  /**
   * Lista modelos certificados (com cache)
   * @param forceRefresh - Se true, ignora cache e busca do backend
   */
  async getCertifiedModels(forceRefresh = false): Promise<string[]> {
    const now = Date.now();
    
    // ✅ OTIMIZAÇÃO: Retornar do cache se válido
    if (!forceRefresh && this.cache.certifiedModels && (now - this.cache.timestamp) < this.CACHE_TTL) {
      logger.log('[CertificationService] 📦 Retornando do cache:', this.cache.certifiedModels.length, 'modelos');
      return this.cache.certifiedModels;
    }
    
    // ✅ Buscar do backend e atualizar cache
    logger.log('[CertificationService] 📋 Chamando API GET /certification/certified-models');
    const response = await api.get('/certification/certified-models');
    
    const modelIds = response.data.modelIds || [];
    this.cache.certifiedModels = modelIds;
    this.cache.timestamp = now;
    
    logger.log('[CertificationService] ✅ Cache atualizado:', modelIds.length, 'modelos');
    
    return modelIds;
  }

  /**
   * Verifica se modelo está certificado
   */
  async isCertified(modelId: string): Promise<boolean> {
    const response = await api.get(`/certification/is-certified/${modelId}`);
    return response.data.isCertified;
  }
  
  /**
   * Invalida o cache de modelos certificados
   * Deve ser chamado após qualquer operação de certificação
   */
  invalidateCache(): void {
    logger.log('[CertificationService] 🗑️ Cache invalidado');
    this.cache.certifiedModels = null;
    this.cache.timestamp = 0;
  }
}

// ✅ Exportar instância única (singleton)
export const certificationService = new CertificationService();
