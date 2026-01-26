/**
 * frontend/src/services/certificationService.ts
 * Service for model certification API operations with caching
 * Standards: docs/STANDARDS.md
 */

import { api } from './api';
import { logger } from '../utils/logger';
import { CertificationDetails } from '../types/ai';

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
    unavailableModels: string[] | null;
    qualityWarningModels: string[] | null;
    timestamp: number;
  } = {
    certifiedModels: null,
    unavailableModels: null,
    qualityWarningModels: null,
    timestamp: 0
  };
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Certifica um modelo específico
   * Credenciais são buscadas automaticamente do banco
   */
  async certifyModel(modelId: string): Promise<CertificationResult> {
    logger.debug('[CertificationService] 🚀 Chamando API POST /certification/certify-model:', { modelId });
    const response = await api.post('/certification/certify-model', {
      modelId
    });
    logger.debug('[CertificationService] ✅ Resposta recebida:', response.data);
    
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
      logger.debug('[CertificationService] 📦 Retornando do cache:', this.cache.certifiedModels.length, 'modelos');
      return this.cache.certifiedModels;
    }
    
    // ✅ Buscar do backend e atualizar cache
    logger.debug('[CertificationService] 📋 Chamando API GET /certification/certified-models');
    const response = await api.get('/certification/certified-models');
    
    const modelIds = response.data.modelIds || [];
    this.cache.certifiedModels = modelIds;
    this.cache.timestamp = now;
    
    logger.debug('[CertificationService] ✅ Cache atualizado:', modelIds.length, 'modelos');
    
    return modelIds;
  }
  
  /**
   * Lista modelos que falharam na certificação (com cache)
   * @param forceRefresh - Se true, ignora cache e busca do backend
   */
  async getFailedModels(_forceRefresh = false): Promise<string[]> {
    // Usar o mesmo cache para simplificar, mas com chave diferente
    // Por enquanto, sempre buscar do backend
    logger.debug('[CertificationService] 📋 Chamando API GET /certification/failed-models');
    const response = await api.get('/certification/failed-models');
    
    const modelIds = response.data.modelIds || [];
    logger.debug('[CertificationService] ❌ Modelos que falharam:', modelIds.length, 'modelos');
    
    return modelIds;
  }

  /**
   * Lista TODOS os modelos com status 'failed' (para exibir badge vermelho)
   * @param forceRefresh - Se true, ignora cache e busca do backend
   */
  async getAllFailedModels(forceRefresh = false): Promise<string[]> {
    const now = Date.now();
    
    // ✅ OTIMIZAÇÃO: Retornar do cache se válido
    if (!forceRefresh && this.cache.unavailableModels && (now - this.cache.timestamp) < this.CACHE_TTL) {
      logger.debug('[CertificationService] 📦 Retornando do cache (all failed):', this.cache.unavailableModels.length, 'modelos');
      return this.cache.unavailableModels;
    }
    
    // ✅ Buscar do backend e atualizar cache
    logger.debug('[CertificationService] 📋 Chamando API GET /certification/all-failed-models');
    const response = await api.get('/certification/all-failed-models');
    
    // 🐛 DEBUG: Verificar estrutura da resposta
    logger.debug('[CertificationService] 🔍 DEBUG: Resposta completa do backend (all failed)', { data: response.data });
    logger.debug('[CertificationService] 🔍 DEBUG: response.data.modelIds', { modelIds: response.data.modelIds });
    
    const modelIds = response.data.modelIds || [];
    this.cache.unavailableModels = modelIds;
    this.cache.timestamp = now;
    
    logger.debug('[CertificationService] ❌ Todos os modelos failed:', modelIds.length, 'modelos');
    
    return modelIds;
  }

  /**
   * Lista modelos indisponíveis com erros críticos (com cache)
   * @param forceRefresh - Se true, ignora cache e busca do backend
   * @deprecated Use getAllFailedModels() para exibir badges no frontend
   */
  async getUnavailableModels(forceRefresh = false): Promise<string[]> {
    const now = Date.now();
    
    // ✅ OTIMIZAÇÃO: Retornar do cache se válido
    if (!forceRefresh && this.cache.unavailableModels && (now - this.cache.timestamp) < this.CACHE_TTL) {
      logger.debug('[CertificationService] 📦 Retornando do cache (unavailable):', this.cache.unavailableModels.length, 'modelos');
      return this.cache.unavailableModels;
    }
    
    // ✅ Buscar do backend e atualizar cache
    logger.debug('[CertificationService] 📋 Chamando API GET /certification/unavailable-models');
    const response = await api.get('/certification/unavailable-models');
    
    // 🐛 DEBUG: Verificar estrutura da resposta
    logger.debug('[CertificationService] 🔍 DEBUG: Resposta completa do backend (unavailable)', { data: response.data });
    logger.debug('[CertificationService] 🔍 DEBUG: response.data.modelIds', { modelIds: response.data.modelIds });
    logger.debug('[CertificationService] 🔍 DEBUG: response.data.models', { models: response.data.models });
    
    const modelIds = response.data.modelIds || [];
    this.cache.unavailableModels = modelIds;
    this.cache.timestamp = now;
    
    logger.debug('[CertificationService] ❌ Modelos indisponíveis:', modelIds.length, 'modelos');
    
    return modelIds;
  }

  /**
   * Lista modelos com warning de qualidade (com cache)
   * @param forceRefresh - Se true, ignora cache e busca do backend
   */
  async getQualityWarningModels(forceRefresh = false): Promise<string[]> {
    const now = Date.now();
    
    // ✅ OTIMIZAÇÃO: Retornar do cache se válido
    if (!forceRefresh && this.cache.qualityWarningModels && (now - this.cache.timestamp) < this.CACHE_TTL) {
      logger.debug('[CertificationService] 📦 Retornando do cache (quality warning):', this.cache.qualityWarningModels.length, 'modelos');
      return this.cache.qualityWarningModels;
    }
    
    // ✅ Buscar do backend e atualizar cache
    logger.debug('[CertificationService] 📋 Chamando API GET /certification/quality-warning-models');
    const response = await api.get('/certification/quality-warning-models');
    
    // 🐛 DEBUG: Verificar estrutura da resposta
    logger.debug('[CertificationService] 🔍 DEBUG: Resposta completa do backend', { data: response.data });
    logger.debug('[CertificationService] 🔍 DEBUG: response.data.modelIds', { modelIds: response.data.modelIds });
    logger.debug('[CertificationService] 🔍 DEBUG: response.data.models', { models: response.data.models });
    
    const modelIds = response.data.modelIds || [];
    this.cache.qualityWarningModels = modelIds;
    this.cache.timestamp = now;
    
    logger.debug('[CertificationService] ⚠️ Modelos com warning de qualidade:', modelIds.length, 'modelos');
    
    return modelIds;
  }

  /**
   * Obtém detalhes completos da certificação de um modelo
   */
  async getCertificationDetails(modelId: string): Promise<CertificationDetails | null> {
    try {
      const response = await api.get(`/certification/details/${modelId}`);
      return response.data.certification;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
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
    logger.debug('[CertificationService] 🗑️ Cache invalidado');
    this.cache.certifiedModels = null;
    this.cache.unavailableModels = null;
    this.cache.qualityWarningModels = null;
    this.cache.timestamp = 0;
  }
}

// ✅ Exportar instância única (singleton)
export const certificationService = new CertificationService();
