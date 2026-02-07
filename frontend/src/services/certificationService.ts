// frontend/src/services/certificationService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Certification Service
 *
 * Serviço para certificação de modelos AI usando sistema de fila
 *
 * ✅ SINGLETON PATTERN: Previne requisições duplicadas
 * ✅ O backend agora salva modelId como apiModelId (ex: "anthropic.claude-sonnet-4-5-20250929-v1:0")
 *    diretamente na tabela ModelCertification, então não é mais necessário fazer mapeamento.
 */

import { api } from './api';
import type { RegionalCertification, AWSRegion } from '../types/ai';

interface CertifyModelResult {
  jobId: string;
  bullJobId: string;
  modelId: string;
  region: string;
  status: string;
}

// 🔒 SINGLETON: Promises em cache para prevenir requisições duplicadas
let certifiedModelsPromise: Promise<string[]> | null = null;
let failedModelsPromise: Promise<string[]> | null = null;
let qualityWarningModelsPromise: Promise<string[]> | null = null;

/**
 * Serviço de certificação regional
 */
export const certificationService = {
  /**
   * Certifica um modelo em uma região específica
   * 
   * @param modelId - ID do modelo a ser certificado (apiModelId, ex: "anthropic.claude-sonnet-4-5-20250929-v1:0")
   * @param region - Região AWS (padrão: 'us-east-1')
   * @returns Resultado do job de certificação
   */
  async certifyModel(modelId: string, region: string = 'us-east-1'): Promise<CertifyModelResult> {
    console.log('[certificationService] 📤 certifyModel chamado', { modelId, region });
    const response = await api.post<CertifyModelResult>(
      '/certification-queue/certify-model',
      { modelId, region }
    );
    console.log('[certificationService] ✅ certifyModel resposta', response.data);
    return response.data;
  },

  /**
   * Busca todas as certificações regionais de um modelo
   * 
   * @param modelId - apiModelId do modelo (ex: 'anthropic.claude-sonnet-4-5-20250929-v1:0')
   * @param providerId - ID do provider (opcional, ex: 'aws-bedrock')
   * @returns Array de certificações regionais
   */
  async getAllRegionalCertifications(
    modelId: string,
    providerId?: string
  ): Promise<RegionalCertification[]> {
    const params: any = { modelId, limit: 100 };
    if (providerId) {
      params.providerId = providerId;
    }
    
    const response = await api.get(
      `/certification-queue/certifications`,
      { params }
    );

    // O interceptor já desembrulhou o JSend, então response.data já é { certifications: [...] }
    return response.data?.certifications || [];
  },

  /**
   * Busca certificação de uma região específica
   * 
   * @param modelId - apiModelId do modelo
   * @param providerId - ID do provider (opcional)
   * @param region - Região AWS
   * @returns Certificação regional ou null se não encontrada
   */
  async getRegionalCertification(
    modelId: string,
    region: AWSRegion,
    providerId?: string
  ): Promise<RegionalCertification | null> {
    const certifications = await this.getAllRegionalCertifications(modelId, providerId);
    return certifications.find(cert => cert.region === region) || null;
  },

  /**
   * Busca lista de modelos certificados
   * 
   * 🔒 SINGLETON: Garante que apenas uma requisição seja feita por vez
   * ✅ O backend agora retorna modelId como apiModelId diretamente
   * 
   * @param forceRefresh - Força recarregar do backend (ignora cache local)
   * @returns Array de apiModelIds de modelos certificados
   */
  async getCertifiedModels(forceRefresh: boolean = false): Promise<string[]> {
    // 🔒 Se já existe uma promise em andamento E não é forceRefresh, retornar a promise existente
    if (certifiedModelsPromise && !forceRefresh) {
      console.log('[certificationService] 🔒 Retornando promise em cache (getCertifiedModels)');
      return certifiedModelsPromise;
    }

    // 🔒 Criar nova promise e armazenar em cache
    certifiedModelsPromise = (async () => {
      try {
        console.log('[certificationService] 📥 getCertifiedModels chamado', { forceRefresh });

        const response = await api.get(
          '/certification-queue/certifications',
          {
            params: {
              status: 'CERTIFIED',  // ✅ Usar CERTIFIED (status do enum Prisma)
              limit: 1000,
              _t: forceRefresh ? Date.now() : undefined // Cache busting
            }
          }
        );
        
        console.log('[certificationService] 📦 Resposta recebida', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasCertifications: !!response.data?.certifications,
          certificationsLength: response.data?.certifications?.length
        });

        // O interceptor já desembrulhou o JSend, então response.data já é { certifications: [...] }
        const certifications = response.data?.certifications || [];
        
        // ✅ Extrai IDs únicos de modelos certificados
        // O backend agora salva modelId como apiModelId diretamente
        const uniqueModelIds = new Set<string>(
          certifications.map((cert: any) => cert.modelId as string)
        );
        
        const result = Array.from(uniqueModelIds);
        
        console.log('[certificationService] ✅ Modelos certificados', {
          count: result.length,
          modelIds: result
        });

        return result;
      } catch (error: any) {
        // 🔧 Tratamento especial para 404: retornar array vazio ao invés de erro
        if (error.response?.status === 404) {
          console.warn('[certificationService] ⚠️ Nenhuma certificação encontrada (404), retornando array vazio');
          return [];
        }
        
        console.error('[certificationService] ❌ Erro em getCertifiedModels', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      } finally {
        // 🔒 Limpar cache após 5 segundos para permitir novas requisições
        setTimeout(() => {
          certifiedModelsPromise = null;
        }, 5000);
      }
    })();

    return certifiedModelsPromise;
  },

  /**
   * Busca lista de modelos com falha
   * 
   * 🔒 SINGLETON: Garante que apenas uma requisição seja feita por vez
   * ✅ O backend agora retorna modelId como apiModelId diretamente
   * 
   * @param forceRefresh - Força recarregar do backend (ignora cache local)
   * @returns Array de apiModelIds de modelos com falha
   */
  async getAllFailedModels(forceRefresh: boolean = false): Promise<string[]> {
    // 🔒 Se já existe uma promise em andamento E não é forceRefresh, retornar a promise existente
    if (failedModelsPromise && !forceRefresh) {
      console.log('[certificationService] 🔒 Retornando promise em cache (getAllFailedModels)');
      return failedModelsPromise;
    }

    // 🔒 Criar nova promise e armazenar em cache
    failedModelsPromise = (async () => {
      try {
        console.log('[certificationService] 📥 getAllFailedModels chamado', { forceRefresh });

        const response = await api.get(
          '/certification-queue/certifications',
          {
            params: {
              status: 'FAILED',
              limit: 1000,
              _t: forceRefresh ? Date.now() : undefined // Cache busting
            }
          }
        );
        
        console.log('[certificationService] 📦 Resposta recebida (FAILED)', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasCertifications: !!response.data?.certifications,
          certificationsLength: response.data?.certifications?.length
        });

        // O interceptor já desembrulhou o JSend, então response.data já é { certifications: [...] }
        const certifications = response.data?.certifications || [];
        
        // ✅ Extrai IDs únicos de modelos com falha
        // O backend agora salva modelId como apiModelId diretamente
        const uniqueModelIds = new Set<string>(
          certifications.map((cert: any) => cert.modelId as string)
        );
        
        const result = Array.from(uniqueModelIds);
        
        console.log('[certificationService] ✅ Modelos com falha', {
          count: result.length,
          modelIds: result
        });

        return result;
      } catch (error: any) {
        // 🔧 Tratamento especial para 404: retornar array vazio ao invés de erro
        if (error.response?.status === 404) {
          console.warn('[certificationService] ⚠️ Nenhuma certificação com falha encontrada (404), retornando array vazio');
          return [];
        }
        
        console.error('[certificationService] ❌ Erro em getAllFailedModels', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      } finally {
        // 🔒 Limpar cache após 5 segundos para permitir novas requisições
        setTimeout(() => {
          failedModelsPromise = null;
        }, 5000);
      }
    })();

    return failedModelsPromise;
  },

  /**
   * Busca modelos com aviso de qualidade
   * 
   * 🔒 SINGLETON: Garante que apenas uma requisição seja feita por vez
   * ✅ O backend agora retorna modelId como apiModelId diretamente
   * 
   * @param forceRefresh - Força recarregar do backend (ignora cache local)
   * @returns Array de apiModelIds de modelos com aviso de qualidade
   */
  async getQualityWarningModels(forceRefresh: boolean = false): Promise<string[]> {
    // 🔒 Se já existe uma promise em andamento E não é forceRefresh, retornar a promise existente
    if (qualityWarningModelsPromise && !forceRefresh) {
      console.log('[certificationService] 🔒 Retornando promise em cache (getQualityWarningModels)');
      return qualityWarningModelsPromise;
    }

    // 🔒 Criar nova promise e armazenar em cache
    qualityWarningModelsPromise = (async () => {
      try {
        console.log('[certificationService] 📥 getQualityWarningModels chamado', { forceRefresh });

        const response = await api.get(
          '/certification-queue/certifications',
          {
            params: {
              status: 'QUALITY_WARNING',
              limit: 1000,
              _t: forceRefresh ? Date.now() : undefined // Cache busting
            }
          }
        );
        
        console.log('[certificationService] 📦 Resposta recebida (QUALITY_WARNING)', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasCertifications: !!response.data?.certifications,
          certificationsLength: response.data?.certifications?.length
        });

        // O interceptor já desembrulhou o JSend, então response.data já é { certifications: [...] }
        const certifications = response.data?.certifications || [];
        
        // ✅ Extrai IDs únicos de modelos com quality warning
        // O backend agora salva modelId como apiModelId diretamente
        const uniqueModelIds = new Set<string>(
          certifications.map((cert: any) => cert.modelId as string)
        );
        
        const result = Array.from(uniqueModelIds);
        
        console.log('[certificationService] ✅ Modelos com quality warning', {
          count: result.length,
          modelIds: result
        });

        return result;
      } catch (error: any) {
        // 🔧 Tratamento especial para 404: retornar array vazio ao invés de erro
        if (error.response?.status === 404) {
          console.warn('[certificationService] ⚠️ Nenhum modelo com quality warning encontrado (404), retornando array vazio');
          return [];
        }
        
        console.error('[certificationService] ❌ Erro em getQualityWarningModels', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // Retornar array vazio em caso de erro para não quebrar a UI
        return [];
      } finally {
        // 🔒 Limpar cache após 5 segundos para permitir novas requisições
        setTimeout(() => {
          qualityWarningModelsPromise = null;
        }, 5000);
      }
    })();

    return qualityWarningModelsPromise;
  },

  /**
   * Busca detalhes da certificação de um modelo específico
   *
   * @param modelId - apiModelId do modelo
   * @returns Detalhes da certificação ou null se não encontrada
   */
  async getCertificationDetails(modelId: string): Promise<RegionalCertification | null> {
    try {
      console.log('[certificationService] 🔍 getCertificationDetails chamado', { modelId });
      
      const response = await api.get(
        '/certification-queue/certifications',
        {
          params: {
            modelId,
            limit: 100  // Aumentar para ver todas as certificações
          }
        }
      );
      
      console.log('[certificationService] 📦 getCertificationDetails resposta', {
        modelId,
        hasData: !!response.data,
        certificationsLength: response.data?.certifications?.length,
        certifications: response.data?.certifications
      });
      
      // O interceptor já desembrulhou o JSend, então response.data já é { certifications: [...] }
      const certifications = response.data?.certifications || [];
      
      // ✅ CORREÇÃO: Priorizar certificações certified e quality_warning (lowercase)
      // O backend converte status para lowercase antes de retornar (ver certificationQueueController)
      // Ignorar certificações pending, queued, processing, failed
      const validCertifications = certifications.filter((cert: any) =>
        cert.status === 'certified' || cert.status === 'quality_warning'
      );
      
      console.log('[certificationService] 🔍 Certificações válidas filtradas', {
        modelId,
        totalCertifications: certifications.length,
        validCertifications: validCertifications.length,
        statuses: certifications.map((c: any) => c.status)
      });
      
      // Retorna a primeira certificação válida encontrada
      return validCertifications.length > 0 ? validCertifications[0] : null;
    } catch (error) {
      console.error('[certificationService] ❌ Erro ao buscar detalhes de certificação:', error);
      return null;
    }
  }
};
