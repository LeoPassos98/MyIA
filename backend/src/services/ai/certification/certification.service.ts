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
import { CertificationResult, ModelCertificationStatus, TestSpec } from './types';

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
    
    // 6. Determinar certificação (≥80% sucesso)
    const isCertified = successRate >= 80;
    const status = isCertified 
      ? ModelCertificationStatus.CERTIFIED 
      : ModelCertificationStatus.FAILED;
    
    // 7. Coletar erros
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
    
    // 8. Salvar no banco via Prisma (upsert)
    const now = new Date();
    const expiresAt = isCertified
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      : null;
    
    console.log(`[CertificationService] 💾 Salvando no banco:`, {
      modelId,
      status,
      isCertified,
      successRate,
      testsPassed,
      testsFailed
    });
    
    const savedCertification = await prisma.modelCertification.upsert({
      where: { modelId },
      update: {
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
        updatedAt: now
      },
      create: {
        modelId,
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
        failureReasons: failureReasons.length > 0 ? failureReasons : Prisma.JsonNull
      }
    });
    
    console.log(`[CertificationService] ✅ Salvo no banco com sucesso:`, {
      id: savedCertification.id,
      modelId: savedCertification.modelId,
      status: savedCertification.status
    });
    
    console.log(`[CertificationService] 🎯 Resultado final: ${modelId}: ${status} (${successRate.toFixed(1)}% success)`);
    
    return {
      modelId,
      status,
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs,
      isCertified,
      results: testResults
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
