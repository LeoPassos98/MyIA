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
  CategorizedError
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
   * Certifica um modelo específico executando testes apropriados
   * 
   * @param modelId - ID do modelo a ser certificado
   * @param credentials - Credenciais AWS para acesso ao Bedrock
   * @returns Resultado da certificação
   */
  async certifyModel(
    modelId: string,
    credentials: AWSCredentials
  ): Promise<CertificationResult> {
    console.log(`[CertificationService] 🚀 Iniciando certificação para: ${modelId}`);
    
    // 0. Verificar se já existe certificação válida
    const existingCert = await prisma.modelCertification.findUnique({
      where: { modelId }
    });
    
    if (existingCert && existingCert.status === 'certified' && existingCert.expiresAt) {
      const now = new Date();
      if (existingCert.expiresAt > now) {
        const daysRemaining = Math.ceil((existingCert.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`[CertificationService] ✅ Certificação válida encontrada para ${modelId}. Expira em ${daysRemaining} dias.`);
        
        // Retornar certificação existente sem executar testes novamente
        return {
          modelId: existingCert.modelId,
          status: existingCert.status as ModelCertificationStatus,
          testsPassed: existingCert.testsPassed,
          testsFailed: existingCert.testsFailed,
          successRate: existingCert.successRate,
          avgLatencyMs: existingCert.avgLatencyMs || 0,
          isCertified: true,
          results: []
        };
      }
    }
    
    // 1. Obter metadata do modelo
    console.log(`[CertificationService] 📖 Buscando metadata do modelo no registry...`);
    const metadata = ModelRegistry.getModel(modelId);
    if (!metadata) {
      console.error(`[CertificationService] ❌ Modelo ${modelId} não encontrado no registry`);
      throw new Error(`Model ${modelId} not found in registry`);
    }
    console.log(`[CertificationService] ✅ Metadata encontrada:`, {
      modelId: metadata.modelId,
      vendor: metadata.vendor
    });
    
    // 2. Criar provider Bedrock
    console.log(`[CertificationService] 🔧 Criando BedrockProvider para região: ${credentials.region}`);
    const provider = new BedrockProvider(credentials.region);
    
    // 3. Selecionar testes apropriados
    const tests = this.getTestsForVendor(metadata.vendor);
    console.log(`[CertificationService] 📝 Testes selecionados para vendor ${metadata.vendor}:`, tests.length);
    
    // 4. Executar testes via TestRunner
    // Formato esperado pelo BedrockProvider: ACCESS_KEY:SECRET_KEY
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    console.log(`[CertificationService] 🧪 Executando testes...`);
    const runner = new TestRunner(provider, apiKey);
    const testResults = await runner.runTests(modelId, tests);
    console.log(`[CertificationService] 📊 Testes executados:`, {
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
      
      console.log(`[CertificationService] 🔍 DEBUG: Erro categorizado para ${modelId}:`, {
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
      
      // Determinar status baseado na categoria do erro
      if (categorizedError.category === ErrorCategory.QUALITY_ISSUE) {
        // Modelo funciona mas tem problemas de qualidade
        status = ModelCertificationStatus.QUALITY_WARNING;
        isAvailable = true;
        isCertified = false;
        console.log(`[CertificationService] ⚠️ DEBUG: Definindo status como QUALITY_WARNING para ${modelId}`);
      } else if (
        categorizedError.category === ErrorCategory.UNAVAILABLE ||
        categorizedError.category === ErrorCategory.PERMISSION_ERROR ||
        categorizedError.category === ErrorCategory.AUTHENTICATION_ERROR
      ) {
        // Modelo não pode ser usado
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
      } else if (categorizedError.category === ErrorCategory.CONFIGURATION_ERROR) {
        // Requer configuração
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
      } else {
        // Outros erros (temporários, rede, etc)
        status = ModelCertificationStatus.FAILED;
        isAvailable = false;
        isCertified = false;
      }
    } else {
      // Sem erros, determinar por success rate
      isCertified = successRate >= 80;
      status = isCertified
        ? ModelCertificationStatus.CERTIFIED
        : ModelCertificationStatus.FAILED;
      isAvailable = isCertified;
    }
    
    // Se passou em 80%+ dos testes, considerar certificado mesmo com alguns erros
    // MAS: se já foi identificado como QUALITY_WARNING, manter esse status
    if (successRate >= 80) {
      console.log(`[CertificationService] 🔍 DEBUG: successRate >= 80 para ${modelId}`);
      console.log(`[CertificationService] 🔍 DEBUG: status atual: ${status}`);
      console.log(`[CertificationService] 🔍 DEBUG: categorizedError?.category: ${categorizedError?.category}`);
      
      // Se já foi marcado como QUALITY_WARNING, NÃO sobrescrever
      if (status !== ModelCertificationStatus.QUALITY_WARNING) {
        isCertified = true;
        status = ModelCertificationStatus.CERTIFIED;
        isAvailable = true;
        categorizedError = undefined;
        overallSeverity = undefined;
        console.log(`[CertificationService] ✅ DEBUG: Mudando para CERTIFIED`);
      } else {
        // Mantém QUALITY_WARNING mas marca como disponível
        isAvailable = true;
        isCertified = false;  // Não é totalmente certificado
        logger.info(`[CertificationService] Modelo ${modelId} passou em ${successRate}% mas mantém status QUALITY_WARNING devido a erros de qualidade`);
        console.log(`[CertificationService] ⚠️ DEBUG: Mantendo QUALITY_WARNING com categorizedError preservado`);
      }
    }
    
    // 7. Salvar no banco via Prisma (upsert)
    const now = new Date();
    const expiresAt = isCertified
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      : null;
    
    console.log(`[CertificationService] 💾 Salvando no banco:`, {
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
    
    console.log(`[CertificationService] ✅ Salvo no banco com sucesso:`, {
      id: savedCertification.id,
      modelId: savedCertification.modelId,
      status: savedCertification.status
    });
    
    console.log(`[CertificationService] 🎯 Resultado final: ${modelId}: ${status} (${successRate.toFixed(1)}% success, available: ${isAvailable})`);
    
    return {
      modelId,
      status,
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs,
      isCertified,
      isAvailable,
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
    console.log(`[Certification] Starting vendor certification for ${vendor}`);
    
    const models = ModelRegistry.getModelsByVendor(vendor);
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials);
        results.push(result);
      } catch (error: any) {
        console.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
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
    
    console.log(`[Certification] Vendor ${vendor} certification complete: ${results.length} models`);
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
    console.log('[Certification] Starting full certification of all models');
    
    const models = ModelRegistry.getAllSupported();
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials);
        results.push(result);
      } catch (error: any) {
        console.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
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
    
    console.log(`[Certification] Full certification complete: ${results.length} models`);
    return results;
  }
  
  /**
   * Obtém lista de modelos certificados e não expirados
   *
   * @returns Array de modelIds certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    console.log('[CertificationService] 🔍 Buscando modelos certificados no banco...');
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
    console.log('[CertificationService] ✅ Modelos certificados encontrados:', modelIds);
    
    return modelIds;
  }
  
  /**
   * Obtém lista de modelos que falharam na certificação
   * Retorna todos os modelos que não estão certificados (incluindo quality_warning)
   *
   * @returns Array de modelIds que falharam
   */
  async getFailedModels(): Promise<string[]> {
    console.log('[CertificationService] 🔍 Buscando modelos que falharam na certificação...');
    
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
    console.log('[CertificationService] ❌ Modelos que falharam encontrados:', modelIds);
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos realmente indisponíveis (não podem ser usados)
   *
   * @returns Array de modelIds indisponíveis
   */
  async getUnavailableModels(): Promise<string[]> {
    console.log('[CertificationService] 🔍 Buscando modelos indisponíveis...');
    
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
    console.log('[CertificationService] 🚫 Modelos indisponíveis encontrados:', modelIds);
    
    return modelIds;
  }

  /**
   * Obtém lista de modelos com warnings de qualidade
   *
   * @returns Array de modelIds com quality_warning
   */
  async getQualityWarningModels(): Promise<string[]> {
    console.log('[CertificationService] 🔍 Buscando modelos com warning de qualidade...');
    
    const certs = await prisma.modelCertification.findMany({
      where: {
        status: 'quality_warning'
      },
      select: { modelId: true },
      distinct: ['modelId']
    });
    
    const modelIds = certs.map(c => c.modelId);
    console.log('[CertificationService] ⚠️ Modelos com warning encontrados:', modelIds);
    
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
