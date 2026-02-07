// backend/src/services/ai/certification/certification.service.ts
// Standards: docs/STANDARDS.md

import { ModelRegistry } from '../registry';
import {
  CertificationResult,
  ModelCertificationStatus,
  ProgressCallback
} from './types';
import { logger } from '../../../utils/logger';
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

/**
 * Service principal de certificação de modelos
 * 
 * Responsabilidades:
 * - Orquestrar processo de certificação
 * - Coordenar módulos especializados
 * - Manter API pública compatível
 * 
 * Arquitetura:
 * - CacheManager: Gerencia cache de certificações
 * - VendorTestSelector: Seleciona testes por vendor
 * - TestOrchestrator: Executa testes com retry
 * - MetricsCalculator: Calcula métricas de certificação
 * - StatusDeterminer: Determina status baseado em métricas
 * - CertificationRepository: Persiste certificações
 * - CertificationQueries: Consulta certificações
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
   * @param modelId - ID do modelo a ser certificado
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
    
    // 2. Cache miss - executar testes
    logger.info('[CertificationService] Cache miss, executando testes', {
      modelId
    });
    
    // 3. Obter metadata do modelo
    const metadata = ModelRegistry.getModel(modelId);
    if (!metadata) {
      logger.error('[CertificationService] Modelo não encontrado no registry', {
        modelId
      });
      throw new Error(`Model ${modelId} not found in registry`);
    }
    
    logger.info('[CertificationService] Metadata encontrada', {
      modelId: metadata.modelId,
      vendor: metadata.vendor
    });
    
    // 4. Selecionar testes apropriados
    const tests = this.testSelector.getTestsForVendor(metadata.vendor);
    
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
    
    // 8. Salvar no banco
    await this.repository.save({
      modelId,
      region: credentials.region,
      vendor: metadata.vendor,
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
   * @param vendor - Nome do vendor (anthropic, cohere, amazon)
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
    
    const models = ModelRegistry.getModelsByVendor(vendor);
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials, false);
        results.push(result);
      } catch (error) {
        logger.error('[CertificationService] Falha ao certificar modelo', {
          modelId: model.modelId,
          error: error instanceof Error ? error.message : String(error)
        });
        results.push({
          modelId: model.modelId,
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
    
    logger.info('[CertificationService] Certificação de vendor completa', {
      vendor,
      total: results.length
    });
    
    return results;
  }
  
  /**
   * Certifica todos os modelos suportados
   * 
   * @param credentials - Credenciais AWS para acesso ao Bedrock
   * @returns Array de resultados de certificação
   */
  async certifyAll(
    credentials: AWSCredentials
  ): Promise<CertificationResult[]> {
    logger.info('[CertificationService] Iniciando certificação completa');
    
    const models = ModelRegistry.getAllSupported();
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials, false);
        results.push(result);
      } catch (error) {
        logger.error('[CertificationService] Falha ao certificar modelo', {
          modelId: model.modelId,
          error: error instanceof Error ? error.message : String(error)
        });
        results.push({
          modelId: model.modelId,
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
