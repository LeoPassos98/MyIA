// backend/src/services/ai/certification/certification.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { logger } from '../../../utils/logger';
import { deploymentService, baseModelService } from '../../models';
import { prisma } from '../../../lib/prisma';
import {
  CertificationResult,
  ModelCertificationStatus,
  ProgressCallback
} from './types';
import { CertificationCacheManager } from './cache/cache-manager';
import { VendorTestSelector } from './orchestration/vendor-test-selector';
import { TestOrchestrator } from './orchestration/test-orchestrator';
import { MetricsCalculator } from './status/metrics-calculator';
import { StatusDeterminer } from './status/status-determiner';
import { CertificationRepository } from './persistence/certification-repository';
import { CertificationQueries } from './queries/certification-queries';

interface AWSCredentials {
  accessKey: string;
  secretKey: string;
  region: string;
}

// Região padrão para queries sem região especificada
const DEFAULT_REGION = 'us-east-1';

// Provider slug padrão (AWS Bedrock)
const DEFAULT_PROVIDER_SLUG = 'bedrock';

/**
 * Informações do deployment resolvido
 */
interface ResolvedDeployment {
  id: string;              // UUID interno do deployment
  deploymentId: string;    // ID do provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
  baseModelId: string;     // UUID do modelo base
  providerId: string;      // UUID do provider
  vendor: string;          // Vendor do modelo base (ex: "Anthropic")
}

/**
 * Service principal de certificação de modelos
 * 
 * Responsabilidades:
 * - Orquestrar processo de certificação
 * - Coordenar módulos especializados
 * - Manter API pública compatível
 * - Resolver modelId (string) para deploymentId (FK) usando deploymentService
 * 
 * Arquitetura:
 * - CacheManager: Gerencia cache de certificações
 * - VendorTestSelector: Seleciona testes por vendor
 * - TestOrchestrator: Executa testes com retry
 * - MetricsCalculator: Calcula métricas de certificação
 * - StatusDeterminer: Determina status baseado em métricas
 * - CertificationRepository: Persiste certificações (usa deploymentId FK)
 * - CertificationQueries: Consulta certificações (usa deploymentId FK)
 * 
 * Clean Slate v2:
 * - API pública continua recebendo modelId (string do provider)
 * - Internamente resolve para deploymentId (UUID) via deploymentService
 * - Todos os modelos devem estar no banco de dados
 */
export class ModelCertificationService {
  private cacheManager: CertificationCacheManager;
  private testSelector: VendorTestSelector;
  private testOrchestrator: TestOrchestrator;
  private metricsCalculator: MetricsCalculator;
  private statusDeterminer: StatusDeterminer;
  private repository: CertificationRepository;
  private queries: CertificationQueries;
  
  constructor() {
    this.cacheManager = new CertificationCacheManager();
    this.testSelector = new VendorTestSelector();
    this.testOrchestrator = new TestOrchestrator();
    this.metricsCalculator = new MetricsCalculator();
    this.statusDeterminer = new StatusDeterminer();
    this.repository = new CertificationRepository();
    this.queries = new CertificationQueries();
  }

  /**
   * Resolve modelId (string do provider) para deployment completo
   *
   * Estratégia de resolução:
   * - Busca no banco via deploymentService (schema v2)
   *
   * @param modelId - ID do modelo no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
   * @returns Deployment resolvido ou null se não encontrado
   */
  private async resolveDeployment(modelId: string): Promise<ResolvedDeployment | null> {
    logger.debug('[CertificationService] Resolvendo deployment', { modelId });

    // 1. Buscar provider Bedrock (padrão)
    const provider = await prisma.provider.findUnique({
      where: { slug: DEFAULT_PROVIDER_SLUG }
    });

    if (!provider) {
      logger.warn('[CertificationService] Provider não encontrado', {
        slug: DEFAULT_PROVIDER_SLUG
      });
      return null;
    }

    // 2. Buscar deployment pelo deploymentId (string do provider)
    const deployment = await deploymentService.findByDeploymentId(
      provider.id,
      modelId,
      true,  // includeBaseModel
      true   // includeProvider
    );

    if (deployment && deployment.baseModel) {
      logger.info('[CertificationService] Deployment encontrado no banco v2', {
        deploymentId: deployment.id,
        modelId: deployment.deploymentId,
        vendor: deployment.baseModel.vendor
      });

      return {
        id: deployment.id,
        deploymentId: deployment.deploymentId,
        baseModelId: deployment.baseModelId,
        providerId: deployment.providerId,
        vendor: deployment.baseModel.vendor
      };
    }

    logger.error('[CertificationService] Modelo não encontrado no banco', { modelId });
    return null;
  }

  /**
   * Busca certificação apenas do cache (sem executar testes)
   * Usado pelo endpoint GET /check/:modelId que não tem rate limiting
   *
   * Este método é chamado ANTES do rate limiting para evitar consumo
   * desnecessário de quota quando o resultado já está em cache.
   *
   * @param modelId - ID do modelo a verificar
   * @param region - Região AWS (padrão: us-east-1)
   * @returns Resultado da certificação em cache ou null se não encontrado/expirado
   */
  async getCachedCertification(modelId: string, region: string = DEFAULT_REGION): Promise<CertificationResult | null> {
    logger.info('[CertificationService] Verificando cache', {
      modelId,
      region
    });
    
    return this.cacheManager.getCached(modelId, region);
  }

  /**
   * Certifica um modelo específico executando testes apropriados
   *
   * @param modelId - ID do modelo a ser certificado (string do provider)
   * @param credentials - Credenciais AWS para acesso ao Bedrock
   * @param force - Se true, ignora cache e força re-certificação
   * @param onProgress - Callback opcional para feedback de progresso via SSE
   * @returns Resultado da certificação
   */
  async certifyModel(
    modelId: string,
    credentials: AWSCredentials,
    force: boolean = false,
    onProgress?: ProgressCallback
  ): Promise<CertificationResult> {
    logger.info('[CertificationService] Iniciando certificação', {
      modelId,
      force,
      region: credentials.region
    });
    
    // 1. Verificar cache PRIMEIRO (a menos que force=true)
    if (!force) {
      const cached = await this.cacheManager.getCached(modelId, credentials.region);
      if (cached) {
        logger.info('[CertificationService] Cache hit, retornando sem executar testes', {
          modelId
        });
        
        // Emitir evento de conclusão se callback fornecido
        if (onProgress) {
          onProgress({
            type: 'complete',
            message: 'Resultado obtido do cache',
            certification: cached
          });
        }
        
        return cached;
      }
    } else {
      logger.info('[CertificationService] Force=true, ignorando cache', {
        modelId
      });
    }
    
    // 2. Cache miss - resolver deployment
    logger.info('[CertificationService] Cache miss, resolvendo deployment', {
      modelId
    });
    
    // 3. Resolver deployment (v2)
    const deployment = await this.resolveDeployment(modelId);
    if (!deployment) {
      logger.error('[CertificationService] Modelo não encontrado', {
        modelId
      });
      throw new Error(`Model ${modelId} not found in database`);
    }
    
    logger.info('[CertificationService] Deployment resolvido', {
      deploymentId: deployment.id || '(fallback)',
      modelId: deployment.deploymentId,
      vendor: deployment.vendor
    });
    
    // 4. Selecionar testes apropriados
    const tests = this.testSelector.getTestsForVendor(deployment.vendor);
    
    // 5. Executar testes via TestOrchestrator
    const { results: testResults } = await this.testOrchestrator.runTests(
      modelId,
      tests,
      credentials,
      onProgress
    );
    
    // 6. Calcular métricas
    const metrics = this.metricsCalculator.calculate(testResults);
    
    // 7. Determinar status
    const statusResult = this.statusDeterminer.determine(
      modelId,
      metrics.successRate,
      metrics.lastError,
      metrics.qualityIssues
    );
    
    // 8. Salvar no banco (usando deploymentId FK se disponível)
    await this.repository.save({
      modelId,
      deploymentId: deployment.id || null,  // UUID do deployment (v2) ou null (fallback)
      region: credentials.region,
      vendor: deployment.vendor,
      status: statusResult.status,
      testsPassed: metrics.testsPassed,
      testsFailed: metrics.testsFailed,
      successRate: metrics.successRate,
      avgLatencyMs: metrics.avgLatencyMs,
      lastError: metrics.lastError,
      failureReasons: metrics.failureReasons,
      errorCategory: statusResult.categorizedError?.category || null,
      errorSeverity: statusResult.categorizedError?.severity || null,
      isCertified: statusResult.isCertified,
      testResults
    });
    
    logger.info('[CertificationService] Resultado final', {
      modelId,
      deploymentId: deployment.id || '(fallback)',
      status: statusResult.status,
      successRate: metrics.successRate.toFixed(1),
      isAvailable: statusResult.isAvailable
    });
    
    return {
      modelId,
      status: statusResult.status,
      testsPassed: metrics.testsPassed,
      testsFailed: metrics.testsFailed,
      successRate: metrics.successRate,
      avgLatencyMs: metrics.avgLatencyMs,
      isCertified: statusResult.isCertified,
      isAvailable: statusResult.isAvailable,
      qualityIssues: statusResult.qualityIssues.length > 0 ? statusResult.qualityIssues : undefined,
      results: testResults,
      categorizedError: statusResult.categorizedError,
      overallSeverity: statusResult.overallSeverity
    };
  }
  
  /**
   * Certifica todos os modelos de um vendor específico
   *
   * Estratégia de resolução:
   * 1. Busca modelos base do vendor via baseModelService (schema v2)
   * 2. Para cada modelo base, busca deployments ativos
   *
   * @param vendor - Nome do vendor (Anthropic, Cohere, Amazon, Meta)
   * @param credentials - Credenciais AWS para acesso ao Bedrock
   * @returns Array de resultados de certificação
   */
  async certifyVendor(
    vendor: string,
    credentials: AWSCredentials
  ): Promise<CertificationResult[]> {
    logger.info('[CertificationService] Iniciando certificação de vendor', {
      vendor
    });
    
    const results: CertificationResult[] = [];
    
    // 1. Buscar modelos base do vendor via baseModelService (v2)
    const { models: baseModels } = await baseModelService.findByVendor(vendor, {
      includeDeployments: true
    });
    
    if (baseModels.length === 0) {
      logger.warn('[CertificationService] Nenhum modelo encontrado para o vendor', {
        vendor
      });
      return results;
    }
    
    logger.info('[CertificationService] Modelos encontrados no banco v2', {
      vendor,
      count: baseModels.length
    });
    
    // 2. Para cada modelo base, certificar seus deployments ativos
    for (const baseModel of baseModels) {
      const deployments = baseModel.deployments?.filter(d => d.isActive) || [];
      
      for (const deployment of deployments) {
        try {
          const result = await this.certifyModel(
            deployment.deploymentId,
            credentials,
            false
          );
          results.push(result);
        } catch (error) {
          logger.error('[CertificationService] Falha ao certificar deployment', {
            deploymentId: deployment.deploymentId,
            baseModel: baseModel.name,
            error: error instanceof Error ? error.message : String(error)
          });
          results.push({
            modelId: deployment.deploymentId,
            status: ModelCertificationStatus.FAILED,
            testsPassed: 0,
            testsFailed: 0,
            successRate: 0,
            avgLatencyMs: 0,
            isCertified: false,
            results: []
          });
        }
      }
    }
    
    logger.info('[CertificationService] Certificação de vendor completa', {
      vendor,
      total: results.length
    });
    
    return results;
  }
  
  /**
   * Certifica todos os modelos suportados
   *
   * Estratégia de resolução:
   * 1. Busca todos os modelos base ativos via baseModelService (schema v2)
   * 2. Para cada modelo base, busca deployments ativos
   *
   * @param credentials - Credenciais AWS para acesso ao Bedrock
   * @returns Array de resultados de certificação
   */
  async certifyAll(
    credentials: AWSCredentials
  ): Promise<CertificationResult[]> {
    logger.info('[CertificationService] Iniciando certificação completa');
    
    const results: CertificationResult[] = [];
    
    // 1. Buscar todos os modelos base ativos via baseModelService (v2)
    const { models: baseModels } = await baseModelService.findActive({
      includeDeployments: true
    });
    
    if (baseModels.length === 0) {
      logger.warn('[CertificationService] Nenhum modelo ativo encontrado no banco');
      return results;
    }
    
    logger.info('[CertificationService] Modelos ativos encontrados no banco v2', {
      count: baseModels.length
    });
    
    // 2. Para cada modelo base, certificar seus deployments ativos
    for (const baseModel of baseModels) {
      const deployments = baseModel.deployments?.filter(d => d.isActive) || [];
      
      for (const deployment of deployments) {
        try {
          const result = await this.certifyModel(
            deployment.deploymentId,
            credentials,
            false
          );
          results.push(result);
        } catch (error) {
          logger.error('[CertificationService] Falha ao certificar deployment', {
            deploymentId: deployment.deploymentId,
            baseModel: baseModel.name,
            error: error instanceof Error ? error.message : String(error)
          });
          results.push({
            modelId: deployment.deploymentId,
            status: ModelCertificationStatus.FAILED,
            testsPassed: 0,
            testsFailed: 0,
            successRate: 0,
            avgLatencyMs: 0,
            isCertified: false,
            results: []
          });
        }
      }
    }
    
    logger.info('[CertificationService] Certificação completa finalizada', {
      total: results.length
    });
    
    return results;
  }
  
  /**
   * Obtém lista de modelos certificados e não expirados
   *
   * @returns Array de modelIds certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    return this.queries.getCertifiedModels();
  }
  
  /**
   * Obtém lista de modelos que falharam na certificação
   * Retorna todos os modelos que não estão certificados (incluindo quality_warning)
   *
   * @returns Array de modelIds que falharam
   */
  async getFailedModels(): Promise<string[]> {
    return this.queries.getFailedModels();
  }

  /**
   * Obtém lista de modelos realmente indisponíveis (não podem ser usados)
   * Retorna modelos com status 'failed' E categorias de erro críticas
   *
   * @returns Array de modelIds indisponíveis
   */
  async getUnavailableModels(): Promise<string[]> {
    return this.queries.getUnavailableModels();
  }

  /**
   * Obtém lista de TODOS os modelos com status 'failed'
   * Usado para exibir badge vermelho "❌ Indisponível" no frontend
   *
   * @returns Array de modelIds que falharam na certificação
   */
  async getAllFailedModels(): Promise<string[]> {
    return this.queries.getAllFailedModels();
  }

  /**
   * Obtém lista de modelos com warnings de qualidade
   *
   * @returns Array de modelIds com quality_warning
   */
  async getQualityWarningModels(): Promise<string[]> {
    return this.queries.getQualityWarningModels();
  }
  
  /**
   * Verifica se um modelo está certificado e não expirado
   * 
   * @param modelId - ID do modelo a verificar
   * @param region - Região AWS (padrão: us-east-1)
   * @returns true se certificado e válido
   */
  async isCertified(modelId: string, region: string = DEFAULT_REGION): Promise<boolean> {
    return this.queries.isCertified(modelId, region);
  }
  
  /**
   * Obtém detalhes completos da certificação de um modelo
   *
   * @param modelId - ID do modelo
   * @param region - Região AWS (padrão: us-east-1)
   * @returns Detalhes da certificação ou null se não encontrado
   */
  async getCertificationDetails(modelId: string, region: string = DEFAULT_REGION) {
    return this.queries.getCertificationDetails(modelId, region);
  }
}
