// backend/src/services/ai/certification/certification.service.ts
// Standards: docs/STANDARDS.md

import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { ModelRegistry } from '../registry';
import { BedrockProvider } from '../providers/bedrock';
import { TestRunner } from './test-runner';
import { baseTestSpecs } from './test-specs/base.spec';
import { anthropicTestSpecs } from './test-specs/anthropic.spec';
import { cohereTestSpecs } from './test-specs/cohere.spec';
import { amazonTestSpecs } from './test-specs/amazon.spec';
import {
  CertificationResult,
  ModelCertificationStatus,
  TestSpec,
  ErrorCategory,
  ErrorSeverity,
  CategorizedError,
  ProgressCallback
} from './types';
import { categorizeError } from './error-categorizer';
import { logger } from '../../../utils/logger';

interface AWSCredentials {
  accessKey: string;
  secretKey: string;
  region: string;
}

export class ModelCertificationService {
  /**
   * Busca certificação apenas do cache (sem executar testes)
   * Usado pelo endpoint GET /check/:modelId que não tem rate limiting
   *
   * Este método é chamado ANTES do rate limiting para evitar consumo
   * desnecessário de quota quando o resultado já está em cache.
   *
   * @param modelId - ID do modelo a verificar
   * @returns Resultado da certificação em cache ou null se não encontrado/expirado
   */
  async getCachedCertification(modelId: string): Promise<CertificationResult | null> {
    logger.info(`[CertificationService] Verificando cache para ${modelId}`);
    
    const cached = await prisma.modelCertification.findUnique({
      where: { modelId }
    });
    
    if (!cached) {
      logger.info(`[CertificationService] Cache miss: nenhuma certificação encontrada para ${modelId}`);
      return null;
    }
    
    // Verificar se certificação está expirada
    if (cached.expiresAt) {
      const now = new Date();
      if (cached.expiresAt <= now) {
        logger.info(`[CertificationService] Cache expirado para ${modelId}`);
        return null;
      }
    }
    
    // Reconstruir categorizedError se houver
    let categorizedError: CategorizedError | undefined;
    if (cached.errorCategory && cached.lastError) {
      categorizedError = categorizeError(cached.lastError);
    }
    
    logger.info(`[CertificationService] Cache hit para ${modelId}: status=${cached.status}`);
    
    // Retornar resultado do cache
    return {
      modelId: cached.modelId,
      status: cached.status as ModelCertificationStatus,
      testsPassed: cached.testsPassed,
      testsFailed: cached.testsFailed,
      successRate: cached.successRate,
      avgLatencyMs: cached.avgLatencyMs || 0,
      isCertified: cached.status === 'certified',
      isAvailable: cached.status === 'certified' || cached.status === 'quality_warning',
      results: [], // Não retornamos resultados detalhados do cache
      categorizedError,
      overallSeverity: cached.errorSeverity as ErrorSeverity | undefined
    };
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
    logger.info(`[CertificationService] 🚀 Iniciando certificação para: ${modelId} (force=${force})`);
    
    // ========================================================================
    // CORREÇÃO #1: Verificar cache ANTES de aplicar rate limiting
    // ========================================================================
    //
    // Problema anterior: Rate limiter era aplicado na rota ANTES da verificação
    // de cache, consumindo quota desnecessariamente mesmo quando o resultado
    // já estava disponível em cache.
    //
    // Solução:
    // 1. Endpoint GET /check/:modelId verifica cache SEM rate limiting
    // 2. Este método certifyModel() é chamado apenas quando cache miss
    // 3. Rate limiting de rota (10 req/min) já foi aplicado antes de chegar aqui
    //
    // Fluxo:
    // - Frontend chama GET /check/:modelId (sem rate limit)
    // - Se cache hit: retorna imediatamente
    // - Se cache miss: Frontend chama POST /certify-model (com rate limit)
    //
    // PARÂMETRO FORCE:
    // - Se force=true, pula verificação de cache e força re-certificação
    // - Útil para invalidar cache antigo (ex: timeout 10s -> 30s)
    // ========================================================================
    
    // 1. Verificar cache PRIMEIRO (a menos que force=true)
    if (!force) {
      const cached = await this.getCachedCertification(modelId);
      if (cached) {
        logger.info(`[CertificationService] ✅ Cache hit para ${modelId}, retornando sem executar testes`);
        
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
      logger.info(`[CertificationService] 🔄 Force=true, ignorando cache para ${modelId}`);
    }
    
    // 2. Cache miss - executar testes
    // (rate limiting de rota já foi aplicado, mas adicionar log)
    logger.info(`[CertificationService] ⚠️ Cache miss para ${modelId}, executando testes (rate limit já aplicado)`);
    
    // 1. Obter metadata do modelo
    logger.info(`[CertificationService] 📖 Buscando metadata do modelo no registry...`);
    const metadata = ModelRegistry.getModel(modelId);
    if (!metadata) {
      logger.error(`[CertificationService] ❌ Modelo ${modelId} não encontrado no registry`);
      throw new Error(`Model ${modelId} not found in registry`);
    }
    logger.info(`[CertificationService] ✅ Metadata encontrada:`, {
      modelId: metadata.modelId,
      vendor: metadata.vendor
    });
    
    // 2. Criar provider Bedrock
    logger.info(`[CertificationService] 🔧 Criando BedrockProvider para região: ${credentials.region}`);
    const provider = new BedrockProvider(credentials.region);
    
    // 3. Selecionar testes apropriados
    const tests = this.getTestsForVendor(metadata.vendor);
    logger.info(`[CertificationService] 📝 Testes selecionados para vendor ${metadata.vendor}:`, tests.length);
    
    // Emitir progresso: iniciando testes
    if (onProgress) {
      onProgress({
        type: 'progress',
        current: 0,
        total: tests.length,
        message: `Iniciando ${tests.length} testes de certificação`
      });
    }
    
    // 4. Executar testes via TestRunner com callback de progresso
    // Formato esperado pelo BedrockProvider: ACCESS_KEY:SECRET_KEY
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    logger.info(`[CertificationService] 🧪 Executando testes...`);
    const runner = new TestRunner(provider, apiKey);
    
    // Contador de testes completados para progresso
    let completedTests = 0;
    
    const testResults = await runner.runTests(
      modelId,
      tests,
      onProgress ? (testName, status) => {
        // Incrementar contador quando teste completa (passed ou failed)
        if (status === 'passed' || status === 'failed') {
          completedTests++;
        }
        
        // Emitir evento de progresso
        onProgress({
          type: 'progress',
          current: completedTests,
          total: tests.length,
          testName,
          status
        });
      } : undefined
    );
    
    logger.info(`[CertificationService] 📊 Testes executados:`, {
      total: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length
    });
    
    // 5. Calcular métricas
    const testsPassed = testResults.filter(r => r.passed).length;
    const testsFailed = testResults.filter(r => !r.passed).length;
    const successRate = (testsPassed / testResults.length) * 100;
    
    const latencies = testResults
      .filter(r => r.passed && r.latencyMs > 0)
      .map(r => r.latencyMs);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    
    // 6. Categorizar erros e determinar status
    let categorizedError: CategorizedError | undefined;
    let overallSeverity: ErrorSeverity | undefined;
    let isAvailable = true;
    let status: ModelCertificationStatus;
    let isCertified = false;
    
    // Coletar testes que falharam para o campo qualityIssues
    const qualityIssues = testResults
      .filter(r => !r.passed)
      .map(r => r.testName);
    
    // Coletar e categorizar erros
    const failureReasons = testResults
      .filter(r => !r.passed && r.error)
      .map(r => ({
        testId: r.testId,
        testName: r.testName,
        error: r.error
      }));
    
    const lastError = failureReasons.length > 0
      ? failureReasons[failureReasons.length - 1].error
      : null;
    
    // Se há erros, categorizar o mais recente
    if (lastError) {
      categorizedError = categorizeError(lastError);
      overallSeverity = categorizedError.severity;
      
      logger.info(`[CertificationService] 🔍 DEBUG: Erro categorizado para ${modelId}:`, {
        category: categorizedError.category,
        severity: categorizedError.severity,
        isTemporary: categorizedError.isTemporary,
        successRate
      });
      
      logger.info(`[CertificationService] Erro categorizado para ${modelId}:`, {
        category: categorizedError.category,
        severity: categorizedError.severity,
        isTemporary: categorizedError.isTemporary
      });
    }
    
    // ========================================================================
    // NOVA LÓGICA DE DETERMINAÇÃO DE STATUS (Correção #6)
    // ========================================================================
    //
    // Thresholds de Certificação:
    // - >= 80%: CERTIFIED (modelo confiável, mesmo com alguns testes falhando)
    // - 60-79%: QUALITY_WARNING (funcional mas com problemas de qualidade)
    // - < 60%: FAILED (não confiável para uso em produção)
    //
    // Justificativa dos Thresholds:
    // - 80%: Permite que modelos sejam certificados mesmo com 1-2 testes falhando
    //        em suítes de 5-10 testes. Isso é realista considerando edge cases.
    // - 60%: Threshold mínimo para considerar o modelo "funcional". Abaixo disso,
    //        há muitos problemas para recomendar o uso.
    //
    // Exceções:
    // - Erros críticos (UNAVAILABLE, PERMISSION_ERROR, etc) sempre resultam em FAILED,
    //   independente do successRate, pois o modelo não pode ser usado.
    // ========================================================================
    
    // Primeiro, verificar se há erros críticos que impedem o uso do modelo
    if (categorizedError) {
      if (
        categorizedError.category === ErrorCategory.UNAVAILABLE ||
        categorizedError.category === ErrorCategory.PERMISSION_ERROR ||
        categorizedError.category === ErrorCategory.AUTHENTICATION_ERROR ||
        categorizedError.category === ErrorCategory.CONFIGURATION_ERROR
      ) {
        // Erros críticos: modelo não pode ser usado independente do successRate
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
        logger.info(`[CertificationService] ❌ Modelo ${modelId} marcado como FAILED devido a erro crítico: ${categorizedError.category}`);
      } else {
        // Erros não-críticos: determinar status baseado no successRate
        if (successRate >= 80) {
          // >= 80%: CERTIFIED (modelo confiável mesmo com alguns problemas)
          status = ModelCertificationStatus.CERTIFIED;
          isAvailable = true;
          isCertified = true;
          logger.info(`[CertificationService] ✅ Modelo ${modelId} CERTIFIED com ${successRate.toFixed(1)}% (erros não-críticos ignorados)`);
        } else if (successRate >= 60) {
          // 60-79%: QUALITY_WARNING (funcional mas com problemas)
          status = ModelCertificationStatus.QUALITY_WARNING;
          isAvailable = true;
          isCertified = false;
          logger.info(`[CertificationService] ⚠️ Modelo ${modelId} marcado como QUALITY_WARNING (${successRate.toFixed(1)}%)`);
        } else {
          // < 60%: FAILED (não confiável)
          status = ModelCertificationStatus.FAILED;
          isAvailable = false;
          isCertified = false;
          logger.info(`[CertificationService] ❌ Modelo ${modelId} marcado como FAILED (${successRate.toFixed(1)}% < 60%)`);
        }
      }
    } else {
      // Sem erros categorizados: determinar apenas por successRate
      if (successRate >= 80) {
        // >= 80%: CERTIFIED
        status = ModelCertificationStatus.CERTIFIED;
        isAvailable = true;
        isCertified = true;
        logger.info(`[CertificationService] ✅ Modelo ${modelId} CERTIFIED com ${successRate.toFixed(1)}%`);
      } else if (successRate >= 60) {
        // 60-79%: QUALITY_WARNING
        status = ModelCertificationStatus.QUALITY_WARNING;
        isAvailable = true;
        isCertified = false;
        logger.info(`[CertificationService] ⚠️ Modelo ${modelId} marcado como QUALITY_WARNING (${successRate.toFixed(1)}%)`);
      } else {
        // < 60%: FAILED
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
        logger.info(`[CertificationService] ❌ Modelo ${modelId} marcado como FAILED (${successRate.toFixed(1)}% < 60%)`);
      }
    }
    
    // 7. Salvar no banco via Prisma (upsert)
    const now = new Date();
    const expiresAt = isCertified
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      : null;
    
    logger.info(`[CertificationService] 💾 Salvando no banco:`, {
      modelId,
      status,
      isCertified,
      isAvailable,
      successRate,
      testsPassed,
      testsFailed,
      errorCategory: categorizedError?.category,
      errorSeverity: categorizedError?.severity
    });
    
    // Preparar dados para salvar (incluindo categorização de erros)
    const updateData: any = {
      vendor: metadata.vendor,
      status,
      certifiedAt: isCertified ? now : null,
      expiresAt,
      certifiedBy: 'system',
      lastTestedAt: now,
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs,
      lastError,
      failureReasons: failureReasons.length > 0 ? failureReasons : Prisma.JsonNull,
      errorCategory: categorizedError?.category || null,
      errorSeverity: categorizedError?.severity || null,
      updatedAt: now
    };
    
    const savedCertification = await prisma.modelCertification.upsert({
      where: { modelId },
      update: updateData,
      create: {
        modelId,
        ...updateData
      }
    });
    
    logger.info(`[CertificationService] ✅ Salvo no banco com sucesso:`, {
      id: savedCertification.id,
      modelId: savedCertification.modelId,
      status: savedCertification.status
    });
    
    logger.info(`[CertificationService] 🎯 Resultado final: ${modelId}: ${status} (${successRate.toFixed(1)}% success, available: ${isAvailable})`);
    
    return {
      modelId,
      status,
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs,
      isCertified,
      isAvailable,
      qualityIssues: qualityIssues.length > 0 ? qualityIssues : undefined,
      results: testResults,
      categorizedError,
      overallSeverity
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
    logger.info(`[Certification] Starting vendor certification for ${vendor}`);
    
    const models = ModelRegistry.getModelsByVendor(vendor);
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials, false);
        results.push(result);
      } catch (error: any) {
        logger.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
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
    
    logger.info(`[Certification] Vendor ${vendor} certification complete: ${results.length} models`);
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
    logger.info('[Certification] Starting full certification of all models');
    
    const models = ModelRegistry.getAllSupported();
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials, false);
        results.push(result);
      } catch (error: any) {
        logger.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
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
    
    logger.info(`[Certification] Full certification complete: ${results.length} models`);
    return results;
  }
  
  /**
   * Obtém lista de modelos certificados e não expirados
   *
   * @returns Array de modelIds certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    logger.info('[CertificationService] 🔍 Buscando modelos certificados no banco...');
    const now = new Date();
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: 'certified',
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
    logger.info('[CertificationService] ✅ Modelos certificados encontrados:', modelIds);
    
    return modelIds;
  }
  
  /**
   * Obtém lista de modelos que falharam na certificação
   * Retorna todos os modelos que não estão certificados (incluindo quality_warning)
   *
   * @returns Array de modelIds que falharam
   */
  async getFailedModels(): Promise<string[]> {
    logger.info('[CertificationService] 🔍 Buscando modelos que falharam na certificação...');
    
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: { not: 'certified' }
      },
      select: {
        modelId: true
      },
      distinct: ['modelId']
    });
    
    const modelIds = certifications.map(c => c.modelId);
    logger.info('[CertificationService] ❌ Modelos que falharam encontrados:', modelIds);
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos realmente indisponíveis (não podem ser usados)
   * Retorna modelos com status 'failed' E categorias de erro críticas
   *
   * @returns Array de modelIds indisponíveis
   */
  async getUnavailableModels(): Promise<string[]> {
    logger.info('[CertificationService] 🔍 Buscando modelos indisponíveis...');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: { in: ['failed'] },
        errorCategory: {
          in: ['UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR']
        }
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationService] 🚫 Modelos indisponíveis encontrados:', modelIds);
    
    return modelIds;
  }

  /**
   * Obtém lista de TODOS os modelos com status 'failed'
   * Usado para exibir badge vermelho "❌ Indisponível" no frontend
   *
   * @returns Array de modelIds que falharam na certificação
   */
  async getAllFailedModels(): Promise<string[]> {
    logger.info('[CertificationService] 🔍 Buscando TODOS os modelos com status failed...');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: 'failed'
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationService] ❌ Modelos failed encontrados:', modelIds);
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos com warnings de qualidade
   *
   * @returns Array de modelIds com quality_warning
   */
  async getQualityWarningModels(): Promise<string[]> {
    logger.info('[CertificationService] 🔍 Buscando modelos com warning de qualidade...');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: 'quality_warning'
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    logger.info('[CertificationService] ⚠️ Modelos com warning encontrados:', modelIds);
    
    return modelIds;
  }
  
  /**
   * Verifica se um modelo está certificado e não expirado
   * 
   * @param modelId - ID do modelo a verificar
   * @returns true se certificado e válido
   */
  async isCertified(modelId: string): Promise<boolean> {
    const now = new Date();
    
    const certification = await prisma.modelCertification.findUnique({
      where: { modelId }
    });
    
    if (!certification) {
      return false;
    }
    
    if (certification.status !== 'certified') {
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
   * @returns Detalhes da certificação ou null se não encontrado
   */
  async getCertificationDetails(modelId: string): Promise<{
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
      where: { modelId }
    });
    
    if (!cert) {
      return null;
    }
    
    const now = new Date();
    const isValid = cert.status === 'certified' &&
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
  
  /**
   * Retorna testes base + testes específicos do vendor
   *
   * @param vendor - Nome do vendor
   * @returns Array de especificações de teste
   */
  private getTestsForVendor(vendor: string): TestSpec[] {
    const vendorLower = vendor.toLowerCase();
    
    switch (vendorLower) {
      case 'anthropic':
        return [...baseTestSpecs, ...anthropicTestSpecs];
      
      case 'cohere':
        return [...baseTestSpecs, ...cohereTestSpecs];
      
      case 'amazon':
        return [...baseTestSpecs, ...amazonTestSpecs];
      
      default:
        return baseTestSpecs;
    }
  }
}
