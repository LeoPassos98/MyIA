// backend/scripts/test-all-models.ts
// Standards: docs/STANDARDS.md

/**
 * Script para testar TODOS os modelos disponíveis no AWS Bedrock e gerar relatório detalhado
 * 
 * Uso:
 *   npx ts-node backend/scripts/test-all-models.ts [vendor]
 * 
 * Exemplos:
 *   npx ts-node backend/scripts/test-all-models.ts           # Testa todos os vendors
 *   npx ts-node backend/scripts/test-all-models.ts amazon    # Testa apenas Amazon
 *   npx ts-node backend/scripts/test-all-models.ts anthropic # Testa apenas Anthropic
 * 
 * O script:
 * 1. Busca TODOS os modelos disponíveis no AWS Bedrock (via API)
 * 2. Filtra modelos relevantes (TEXT output, inferência)
 * 3. Executa certificação para cada modelo
 * 4. Gera relatório detalhado e EXPLICATIVO em JSON e Markdown
 * 5. Salva logs em backend/logs/model-tests-[timestamp].json
 * 
 * Saída:
 * - backend/logs/model-tests-[timestamp].json  (dados estruturados)
 * - backend/logs/model-tests-[timestamp].md    (relatório explicativo)
 */

import { PrismaClient } from '@prisma/client';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import * as fs from 'fs';
import * as path from 'path';
import { ModelCertificationService } from '../src/services/ai/certification/certification.service';
import { encryptionService } from '../src/services/encryptionService';
import { ErrorCategory } from '../src/services/ai/certification/types';
import { ModelRegistry } from '../src/services/ai/registry/model-registry';

const prisma = new PrismaClient();

interface BedrockModel {
  modelId: string;
  modelName: string;
  providerName: string;
  inputModalities: string[];
  outputModalities: string[];
  responseStreamingSupported: boolean;
  customizationsSupported: string[];
  inferenceTypesSupported: string[];
}

interface ModelTestResult {
  modelId: string;
  modelName: string;
  vendor: string;
  status: string;
  successRate: number;
  testsPassed: number;
  testsFailed: number;
  avgLatencyMs: number | null;
  errorCategory: string | null;
  errorSeverity: string | null;
  lastError: string | null;
  qualityIssues: string[];
  testedAt: Date;
  // Campos de rating
  rating: number | null;
  badge: string | null;
  metrics: any;
  scores: any;
  testResults: Array<{
    testName: string;
    passed: boolean;
    error?: string;
    latencyMs: number;
  }>;
}

interface TestSummary {
  totalModels: number;
  certified: number;
  failed: number;
  qualityWarning: number;
  byVendor: Record<string, {
    total: number;
    certified: number;
    failed: number;
    qualityWarning: number;
  }>;
  timestamp: Date;
  duration: number;
  recommendations: string[];
  commonIssues: Record<string, number>;
}

/**
 * Busca todos os modelos disponíveis no AWS Bedrock
 */
async function listBedrockModels(
  credentials: { accessKey: string; secretKey: string; region: string }
): Promise<BedrockModel[]> {
  console.log('🔍 Buscando modelos disponíveis no AWS Bedrock...\n');
  
  const client = new BedrockClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey
    }
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    if (!response.modelSummaries || response.modelSummaries.length === 0) {
      console.log('⚠️  Nenhum modelo encontrado no AWS Bedrock.');
      return [];
    }

    const models: BedrockModel[] = response.modelSummaries.map(model => ({
      modelId: model.modelId || '',
      modelName: model.modelName || '',
      providerName: model.providerName || '',
      inputModalities: model.inputModalities || [],
      outputModalities: model.outputModalities || [],
      responseStreamingSupported: model.responseStreamingSupported || false,
      customizationsSupported: model.customizationsSupported || [],
      inferenceTypesSupported: model.inferenceTypesSupported || []
    }));

    console.log(`✅ ${models.length} modelos encontrados no AWS Bedrock\n`);
    return models;

  } catch (error: any) {
    console.error('❌ Erro ao listar modelos do Bedrock:', error.message);
    throw error;
  }
}

/**
 * Filtra modelos relevantes para teste
 */
function filterRelevantModels(
  models: BedrockModel[],
  vendorFilter?: string
): BedrockModel[] {
  console.log('🔧 Filtrando modelos relevantes...\n');

  let filtered = models.filter(model => {
    // Filtrar apenas modelos que suportam TEXT output
    const supportsText = model.outputModalities.includes('TEXT');
    
    // Filtrar apenas modelos que suportam inferência ON_DEMAND
    const supportsInference = model.inferenceTypesSupported.includes('ON_DEMAND');
    
    return supportsText && supportsInference;
  });

  // Aplicar filtro de vendor se especificado
  if (vendorFilter) {
    const vendorLower = vendorFilter.toLowerCase();
    filtered = filtered.filter(model => 
      model.providerName.toLowerCase().includes(vendorLower)
    );
  }

  console.log(`✅ ${filtered.length} modelos relevantes após filtragem\n`);
  
  // Mostrar distribuição por vendor
  const byVendor = filtered.reduce((acc, model) => {
    const vendor = model.providerName;
    acc[vendor] = (acc[vendor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Distribuição por vendor:');
  Object.entries(byVendor).forEach(([vendor, count]) => {
    console.log(`   ${vendor}: ${count} modelos`);
  });
  console.log('');

  return filtered;
}

/**
 * Mapeia nome do provider para vendor interno
 */
function mapProviderToVendor(providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('anthropic')) return 'anthropic';
  if (lower.includes('amazon')) return 'amazon';
  if (lower.includes('cohere')) return 'cohere';
  if (lower.includes('meta')) return 'meta';
  if (lower.includes('mistral')) return 'mistral';
  if (lower.includes('ai21')) return 'ai21';
  return providerName;
}

/**
 * Analisa resultados e gera explicações
 */
function analyzeResults(result: ModelTestResult): {
  explanation: string;
  recommendations: string[];
} {
  const { status, successRate, errorCategory, testsPassed, testsFailed } = result;
  
  let explanation = '';
  const recommendations: string[] = [];

  // Análise baseada no status
  if (status === 'certified') {
    explanation = `✅ **Modelo certificado com sucesso!** O modelo passou em ${testsPassed} de ${testsPassed + testsFailed} testes (${successRate.toFixed(1)}% de sucesso). `;
    
    if (successRate === 100) {
      explanation += 'Desempenho perfeito em todos os testes. Recomendado para uso em produção.';
      recommendations.push('✅ Modelo pronto para uso em produção');
      recommendations.push('✅ Suporta todas as funcionalidades testadas');
    } else {
      explanation += `Alguns testes falharam (${testsFailed}), mas o modelo ainda é confiável para uso geral.`;
      recommendations.push('✅ Modelo confiável para uso em produção');
      recommendations.push('⚠️ Verificar testes que falharam para casos de uso específicos');
    }
  } else if (status === 'quality_warning') {
    explanation = `⚠️ **Modelo funcional com avisos de qualidade.** O modelo passou em ${testsPassed} de ${testsPassed + testsFailed} testes (${successRate.toFixed(1)}% de sucesso). `;
    explanation += 'O modelo pode ser usado, mas apresenta limitações em alguns cenários.';
    
    recommendations.push('⚠️ Modelo funcional mas com limitações');
    recommendations.push('🧪 Testar em ambiente de desenvolvimento antes de usar em produção');
    recommendations.push('📋 Revisar testes que falharam para entender limitações');
  } else if (status === 'failed') {
    explanation = `❌ **Modelo falhou na certificação.** O modelo passou em apenas ${testsPassed} de ${testsPassed + testsFailed} testes (${successRate.toFixed(1)}% de sucesso). `;
    
    // Análise baseada na categoria de erro
    if (errorCategory === ErrorCategory.PROVISIONING_REQUIRED) {
      explanation += '**Motivo:** O modelo requer habilitação prévia na conta AWS. ';
      explanation += 'Acesse AWS Console → Bedrock → Model Access para solicitar acesso ao modelo.';
      recommendations.push('🔧 Habilitar modelo no AWS Console → Bedrock → Model Access');
      recommendations.push('⏳ Aguardar aprovação do acesso (pode levar alguns minutos)');
      recommendations.push('🔄 Executar certificação novamente após aprovação');
    } else if (errorCategory === ErrorCategory.PERMISSION_ERROR) {
      explanation += '**Motivo:** Erro de permissão. Suas credenciais AWS não têm permissão para acessar este modelo.';
      recommendations.push('🔐 Verificar permissões IAM da conta AWS');
      recommendations.push('📋 Adicionar política bedrock:InvokeModel para este modelo');
    } else if (errorCategory === ErrorCategory.UNAVAILABLE) {
      explanation += '**Motivo:** Modelo indisponível na região configurada. O modelo pode não estar disponível em todas as regiões.';
      recommendations.push('🌍 Verificar disponibilidade do modelo na região atual');
      recommendations.push('🔄 Considerar usar outra região AWS');
    } else if (errorCategory === ErrorCategory.RATE_LIMIT) {
      explanation += '**Motivo:** Limite de taxa excedido. Muitas requisições em curto período.';
      recommendations.push('⏱️ Aguardar alguns minutos antes de testar novamente');
      recommendations.push('🔧 Implementar retry com backoff exponencial');
    } else if (errorCategory === ErrorCategory.TIMEOUT) {
      explanation += '**Motivo:** Timeout nas requisições. O modelo pode estar sobrecarregado ou com latência alta.';
      recommendations.push('⏱️ Aumentar timeout das requisições');
      recommendations.push('🔄 Testar novamente em horário diferente');
    } else if (errorCategory === ErrorCategory.CONFIGURATION_ERROR) {
      explanation += '**Motivo:** Erro de configuração. Parâmetros inválidos ou incompatíveis com o modelo.';
      recommendations.push('🔧 Verificar parâmetros de configuração do modelo');
      recommendations.push('📖 Consultar documentação do modelo para parâmetros suportados');
    } else {
      explanation += '**Motivo:** Múltiplos testes falharam. O modelo não é confiável para uso em produção.';
      recommendations.push('❌ Não recomendado para uso em produção');
      recommendations.push('🔍 Revisar logs de erro para mais detalhes');
    }
  }

  return { explanation, recommendations };
}

/**
 * Gera análise de problemas comuns
 */
function analyzeCommonIssues(results: ModelTestResult[]): {
  issues: Record<string, number>;
  insights: string[];
} {
  const issues: Record<string, number> = {};
  const insights: string[] = [];

  // Contar categorias de erro
  results.forEach(result => {
    if (result.errorCategory) {
      issues[result.errorCategory] = (issues[result.errorCategory] || 0) + 1;
    }
  });

  // Gerar insights
  if (issues[ErrorCategory.PROVISIONING_REQUIRED] > 0) {
    insights.push(`🔧 ${issues[ErrorCategory.PROVISIONING_REQUIRED]} modelo(s) requerem habilitação no AWS Console`);
  }
  if (issues[ErrorCategory.PERMISSION_ERROR] > 0) {
    insights.push(`🔐 ${issues[ErrorCategory.PERMISSION_ERROR]} modelo(s) com erro de permissão IAM`);
  }
  if (issues[ErrorCategory.UNAVAILABLE] > 0) {
    insights.push(`🌍 ${issues[ErrorCategory.UNAVAILABLE]} modelo(s) indisponíveis na região atual`);
  }
  if (issues[ErrorCategory.RATE_LIMIT] > 0) {
    insights.push(`⏱️ ${issues[ErrorCategory.RATE_LIMIT]} modelo(s) com limite de taxa excedido`);
  }

  return { issues, insights };
}

async function testAllModels(vendorFilter?: string) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logsDir = path.join(__dirname, '../logs');
  
  // Criar diretório de logs se não existir
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  console.log('🚀 Iniciando teste de TODOS os modelos AWS Bedrock...\n');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  if (vendorFilter) {
    console.log(`🎯 Vendor: ${vendorFilter}`);
  } else {
    console.log(`🎯 Testando TODOS os vendors`);
  }
  console.log('');

  try {
    // Buscar credenciais AWS do usuário
    const user = await prisma.user.findFirst({
      where: {
        settings: {
          awsAccessKey: { not: null },
          awsSecretKey: { not: null },
          awsRegion: { not: null }
        }
      },
      include: {
        settings: true
      }
    });

    if (!user || !user.settings) {
      console.error('❌ Nenhum usuário com credenciais AWS configuradas encontrado.');
      console.error('💡 Configure as credenciais AWS primeiro.');
      return;
    }

    const { awsAccessKey, awsSecretKey, awsRegion } = user.settings;

    if (!awsAccessKey || !awsSecretKey || !awsRegion) {
      console.error('❌ Credenciais AWS não configuradas.');
      console.error('💡 Configure AWS Access Key, Secret Key e Region nas configurações do usuário.');
      return;
    }

    // Descriptografar credenciais se estiverem criptografadas
    // CORREÇÃO: Verificar 'U2FsdGVkX1' (sem o último caractere) pois o salt varia
    const decryptedAccessKey = awsAccessKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsAccessKey)
      : awsAccessKey;
    
    const decryptedSecretKey = awsSecretKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsSecretKey)
      : awsSecretKey;

    // Validar se a descriptografia funcionou
    if (!decryptedAccessKey || !decryptedSecretKey) {
      console.error('❌ Erro ao descriptografar credenciais AWS.');
      console.error('💡 Verifique se ENCRYPTION_SECRET está configurado corretamente no .env');
      return;
    }

    const credentials = {
      accessKey: decryptedAccessKey,
      secretKey: decryptedSecretKey,
      region: awsRegion
    };

    console.log(`🔑 Credenciais AWS encontradas (região: ${awsRegion})`);
    console.log(`🔓 Credenciais descriptografadas com sucesso\n`);

    // 1. Buscar TODOS os modelos do AWS Bedrock
    const allModels = await listBedrockModels(credentials);
    
    if (allModels.length === 0) {
      console.log('⚠️  Nenhum modelo encontrado no AWS Bedrock.');
      return;
    }

    // 2. Filtrar modelos relevantes
    const relevantModels = filterRelevantModels(allModels, vendorFilter);
    
    if (relevantModels.length === 0) {
      console.log('⚠️  Nenhum modelo relevante encontrado após filtragem.');
      return;
    }

    // 2.5. Filtrar apenas modelos disponíveis na região (cross-reference com Registry)
    const registryModels = ModelRegistry.getAll();
    const modelsToTest = relevantModels.filter(model => {
      const isInRegistry = registryModels.some(reg =>
        reg.modelId === model.modelId
      );
      
      if (!isInRegistry) {
        console.log(`⏭️  Pulando ${model.modelId} (não disponível na região ${credentials.region})`);
      }
      
      return isInRegistry;
    });

    console.log(`\n📊 Estatísticas:`);
    console.log(`   AWS Bedrock (${credentials.region}): ${relevantModels.length} modelos relevantes`);
    console.log(`   Registry: ${registryModels.length} modelos cadastrados`);
    console.log(`   ✅ Modelos a testar: ${modelsToTest.length} modelos`);
    console.log(`   ⏭️  Modelos pulados: ${relevantModels.length - modelsToTest.length} modelos\n`);

    if (modelsToTest.length === 0) {
      console.log('⚠️  Nenhum modelo disponível para teste após filtragem regional.');
      return;
    }

    // 3. Executar certificação para cada modelo
    const certificationService = new ModelCertificationService();
    const results: ModelTestResult[] = [];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Iniciando testes de certificação`);
    console.log('='.repeat(60));
    console.log('');

    for (let i = 0; i < modelsToTest.length; i++) {
      const model = modelsToTest[i];
      const vendor = mapProviderToVendor(model.providerName);
      
      console.log(`[${i + 1}/${modelsToTest.length}] Testando: ${model.modelId}`);
      console.log(`   Vendor: ${vendor}`);
      console.log(`   Nome: ${model.modelName}`);

      try {
        // Executar certificação
        const certResult = await certificationService.certifyModel(
          model.modelId,
          credentials,
          false // não forçar re-certificação
        );

        // Buscar detalhes do banco
        const certDetails = await prisma.modelCertification.findUnique({
          where: { modelId: model.modelId }
        });

        // Extrair quality issues
        const qualityIssues: string[] = [];
        if (certDetails?.failureReasons && typeof certDetails.failureReasons === 'object') {
          const reasons = certDetails.failureReasons as any;
          if (Array.isArray(reasons)) {
            qualityIssues.push(...reasons.map((r: any) => r.testName || r));
          } else if (reasons.qualityIssues && Array.isArray(reasons.qualityIssues)) {
            qualityIssues.push(...reasons.qualityIssues);
          }
        }

        const result: ModelTestResult = {
          modelId: model.modelId,
          modelName: model.modelName,
          vendor,
          status: certResult.status,
          successRate: certResult.successRate,
          testsPassed: certResult.testsPassed,
          testsFailed: certResult.testsFailed,
          avgLatencyMs: certResult.avgLatencyMs,
          errorCategory: certResult.categorizedError?.category || null,
          errorSeverity: certResult.categorizedError?.severity || null,
          lastError: certDetails?.lastError || null,
          qualityIssues,
          testedAt: new Date(),
          // Campos de rating
          rating: certDetails?.rating || null,
          badge: certDetails?.badge || null,
          metrics: certDetails?.metrics || null,
          scores: certDetails?.scores || null,
          testResults: certResult.results.map(r => ({
            testName: r.testName,
            passed: r.passed,
            error: r.error,
            latencyMs: r.latencyMs
          }))
        };

        results.push(result);

        // Log resultado
        const statusEmoji = certResult.status === 'certified' ? '✅' : 
                           certResult.status === 'quality_warning' ? '⚠️' : '❌';
        console.log(`   ${statusEmoji} Status: ${certResult.status}`);
        console.log(`   📊 Success Rate: ${certResult.successRate.toFixed(1)}%`);
        console.log(`   🧪 Tests: ${certResult.testsPassed} passed, ${certResult.testsFailed} failed`);
        if (certResult.avgLatencyMs > 0) {
          console.log(`   ⏱️  Latency: ${certResult.avgLatencyMs}ms`);
        }
        console.log('');

      } catch (error: any) {
        console.error(`   ❌ Erro ao testar modelo: ${error.message}`);
        console.log('');
      }
    }

    // 4. Gerar sumário e análises
    const summary: TestSummary = {
      totalModels: results.length,
      certified: results.filter(r => r.status === 'certified').length,
      failed: results.filter(r => r.status === 'failed').length,
      qualityWarning: results.filter(r => r.status === 'quality_warning').length,
      byVendor: {},
      timestamp: new Date(),
      duration: Date.now() - startTime,
      recommendations: [],
      commonIssues: {}
    };

    // Calcular estatísticas por vendor
    const vendorGroups = results.reduce((acc, r) => {
      if (!acc[r.vendor]) acc[r.vendor] = [];
      acc[r.vendor].push(r);
      return acc;
    }, {} as Record<string, ModelTestResult[]>);

    for (const [vendor, vendorResults] of Object.entries(vendorGroups)) {
      summary.byVendor[vendor] = {
        total: vendorResults.length,
        certified: vendorResults.filter(r => r.status === 'certified').length,
        failed: vendorResults.filter(r => r.status === 'failed').length,
        qualityWarning: vendorResults.filter(r => r.status === 'quality_warning').length
      };
    }

    // Analisar problemas comuns
    const { issues, insights } = analyzeCommonIssues(results);
    summary.commonIssues = issues;

    // Gerar recomendações gerais
    if (summary.certified > 0) {
      summary.recommendations.push(`✅ ${summary.certified} modelo(s) certificado(s) e pronto(s) para uso`);
    }
    if (summary.qualityWarning > 0) {
      summary.recommendations.push(`⚠️ ${summary.qualityWarning} modelo(s) funcional(is) mas com limitações`);
    }
    if (summary.failed > 0) {
      summary.recommendations.push(`❌ ${summary.failed} modelo(s) falharam na certificação`);
    }
    summary.recommendations.push(...insights);

    // 5. Salvar resultados em JSON
    const jsonPath = path.join(logsDir, `model-tests-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
      summary,
      results: results.map(r => ({
        ...r,
        analysis: analyzeResults(r)
      }))
    }, null, 2));

    // 6. Gerar relatório Markdown explicativo
    const mdPath = path.join(logsDir, `model-tests-${timestamp}.md`);
    const markdown = generateMarkdownReport(summary, results);
    fs.writeFileSync(mdPath, markdown);

    // 7. Exibir sumário
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMÁRIO FINAL');
    console.log('='.repeat(60));
    console.log(`\n✅ Certified: ${summary.certified}`);
    console.log(`⚠️  Quality Warning: ${summary.qualityWarning}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📦 Total: ${summary.totalModels}`);
    console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

    console.log('\n📊 Por Vendor:');
    Object.entries(summary.byVendor).forEach(([vendor, stats]) => {
      console.log(`\n   ${vendor}:`);
      console.log(`     ✅ Certified: ${stats.certified}`);
      console.log(`     ⚠️  Quality Warning: ${stats.qualityWarning}`);
      console.log(`     ❌ Failed: ${stats.failed}`);
      console.log(`     📦 Total: ${stats.total}`);
    });

    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recomendações:');
      summary.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n📁 Arquivos gerados:');
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   MD:   ${mdPath}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao testar modelos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateMarkdownReport(summary: TestSummary, results: ModelTestResult[]): string {
  let md = '# Relatório de Testes de Modelos AWS Bedrock\n\n';
  
  md += `**Data:** ${summary.timestamp.toISOString()}\n`;
  md += `**Duração:** ${(summary.duration / 1000).toFixed(2)}s\n`;
  md += `**Total de Modelos Testados:** ${summary.totalModels}\n\n`;

  md += '---\n\n';

  md += '## 📊 Sumário Executivo\n\n';
  md += `- ✅ **Certified:** ${summary.certified} modelos (${((summary.certified / summary.totalModels) * 100).toFixed(1)}%)\n`;
  md += `- ⚠️ **Quality Warning:** ${summary.qualityWarning} modelos (${((summary.qualityWarning / summary.totalModels) * 100).toFixed(1)}%)\n`;
  md += `- ❌ **Failed:** ${summary.failed} modelos (${((summary.failed / summary.totalModels) * 100).toFixed(1)}%)\n\n`;

  if (summary.recommendations.length > 0) {
    md += '### 💡 Recomendações Gerais\n\n';
    summary.recommendations.forEach(rec => {
      md += `- ${rec}\n`;
    });
    md += '\n';
  }

  if (Object.keys(summary.commonIssues).length > 0) {
    md += '### 🔍 Problemas Comuns Identificados\n\n';
    Object.entries(summary.commonIssues).forEach(([issue, count]) => {
      md += `- **${issue}:** ${count} modelo(s)\n`;
    });
    md += '\n';
  }

  md += '---\n\n';

  md += '## 📊 Estatísticas por Vendor\n\n';
  Object.entries(summary.byVendor).forEach(([vendor, stats]) => {
    const certRate = ((stats.certified / stats.total) * 100).toFixed(1);
    md += `### ${vendor}\n\n`;
    md += `- ✅ Certified: ${stats.certified}/${stats.total} (${certRate}%)\n`;
    md += `- ⚠️ Quality Warning: ${stats.qualityWarning}\n`;
    md += `- ❌ Failed: ${stats.failed}\n\n`;
  });

  md += '---\n\n';

  md += '## ✅ Modelos Certificados\n\n';
  const certifiedModels = results.filter(r => r.status === 'certified')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Ordenar por rating (maior primeiro)
  
  if (certifiedModels.length === 0) {
    md += '❌ Nenhum modelo certificado.\n\n';
  } else {
    md += '| Modelo | Vendor | Rating | Badge | Success Rate | Latency | Testes |\n';
    md += '|--------|--------|--------|-------|--------------|---------|--------|\n';
    certifiedModels.forEach(result => {
      const latency = result.avgLatencyMs ? `${result.avgLatencyMs}ms` : 'N/A';
      const tests = `${result.testsPassed}/${result.testsPassed + result.testsFailed}`;
      const rating = result.rating !== null ? `⭐ ${result.rating.toFixed(1)}` : 'N/A';
      const badge = result.badge || 'N/A';
      md += `| ${result.modelId} | ${result.vendor} | ${rating} | ${badge} | ${result.successRate.toFixed(1)}% | ${latency} | ${tests} |\n`;
    });
    md += '\n';

    md += '### 📝 Análise Detalhada\n\n';
    certifiedModels.forEach(result => {
      const { explanation, recommendations } = analyzeResults(result);
      md += `#### ${result.modelId}\n\n`;
      md += `${explanation}\n\n`;
      if (recommendations.length > 0) {
        md += '**Recomendações:**\n';
        recommendations.forEach(rec => md += `- ${rec}\n`);
        md += '\n';
      }
    });
  }

  md += '---\n\n';

  md += '## ⚠️ Modelos com Avisos de Qualidade\n\n';
  const warningModels = results.filter(r => r.status === 'quality_warning')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Ordenar por rating
  
  if (warningModels.length === 0) {
    md += '✅ Nenhum modelo com avisos de qualidade.\n\n';
  } else {
    warningModels.forEach(result => {
      const { explanation, recommendations } = analyzeResults(result);
      md += `### ${result.modelId}\n\n`;
      md += `- **Vendor:** ${result.vendor}\n`;
      if (result.rating !== null) {
        md += `- **Rating:** ${'⭐'.repeat(Math.round(result.rating))} ${result.rating.toFixed(1)}\n`;
        md += `- **Badge:** ${result.badge}\n`;
      }
      md += `- **Success Rate:** ${result.successRate.toFixed(1)}%\n`;
      md += `- **Tests:** ${result.testsPassed} passed, ${result.testsFailed} failed\n`;
      if (result.avgLatencyMs) {
        md += `- **Latency:** ${result.avgLatencyMs}ms\n`;
      }
      md += '\n';
      md += `${explanation}\n\n`;
      
      if (result.qualityIssues.length > 0) {
        md += '**Testes que Falharam:**\n';
        result.qualityIssues.forEach(issue => {
          md += `- ❌ ${issue}\n`;
        });
        md += '\n';
      }

      if (result.testResults.length > 0) {
        md += '**Detalhes dos Testes:**\n';
        result.testResults.forEach(test => {
          const emoji = test.passed ? '✅' : '❌';
          md += `- ${emoji} ${test.testName} (${test.latencyMs}ms)\n`;
          if (!test.passed && test.error) {
            md += `  - Erro: ${test.error}\n`;
          }
        });
        md += '\n';
      }

      if (recommendations.length > 0) {
        md += '**Recomendações:**\n';
        recommendations.forEach(rec => md += `- ${rec}\n`);
        md += '\n';
      }
    });
  }

  md += '---\n\n';

  md += '## ❌ Modelos que Falharam\n\n';
  const failedModels = results.filter(r => r.status === 'failed')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Ordenar por rating
  
  if (failedModels.length === 0) {
    md += '✅ Nenhum modelo falhou na certificação.\n\n';
  } else {
    failedModels.forEach(result => {
      const { explanation, recommendations } = analyzeResults(result);
      md += `### ${result.modelId}\n\n`;
      md += `- **Vendor:** ${result.vendor}\n`;
      if (result.rating !== null) {
        md += `- **Rating:** ${'⭐'.repeat(Math.max(0, Math.round(result.rating)))} ${result.rating.toFixed(1)}\n`;
        md += `- **Badge:** ${result.badge}\n`;
      }
      md += `- **Success Rate:** ${result.successRate.toFixed(1)}%\n`;
      md += `- **Tests:** ${result.testsPassed} passed, ${result.testsFailed} failed\n`;
      if (result.errorCategory) {
        md += `- **Error Category:** ${result.errorCategory}\n`;
        md += `- **Error Severity:** ${result.errorSeverity}\n`;
      }
      if (result.avgLatencyMs) {
        md += `- **Latency:** ${result.avgLatencyMs}ms\n`;
      }
      md += '\n';
      md += `${explanation}\n\n`;
      
      if (result.lastError) {
        md += '**Último Erro:**\n';
        md += `\`\`\`\n${result.lastError}\n\`\`\`\n\n`;
      }

      if (result.qualityIssues.length > 0) {
        md += '**Testes que Falharam:**\n';
        result.qualityIssues.forEach(issue => {
          md += `- ❌ ${issue}\n`;
        });
        md += '\n';
      }

      if (result.testResults.length > 0) {
        md += '**Detalhes dos Testes:**\n';
        result.testResults.forEach(test => {
          const emoji = test.passed ? '✅' : '❌';
          md += `- ${emoji} ${test.testName} (${test.latencyMs}ms)\n`;
          if (!test.passed && test.error) {
            md += `  - Erro: ${test.error}\n`;
          }
        });
        md += '\n';
      }

      if (recommendations.length > 0) {
        md += '**Recomendações:**\n';
        recommendations.forEach(rec => md += `- ${rec}\n`);
        md += '\n';
      }
    });
  }

  md += '---\n\n';

  md += '## 📋 Resumo por Categoria de Erro\n\n';
  if (Object.keys(summary.commonIssues).length > 0) {
    Object.entries(summary.commonIssues).forEach(([category, count]) => {
      md += `### ${category}\n\n`;
      md += `**Modelos afetados:** ${count}\n\n`;
      
      const affectedModels = results.filter(r => r.errorCategory === category);
      if (affectedModels.length > 0) {
        md += '**Modelos:**\n';
        affectedModels.forEach(model => {
          md += `- ${model.modelId} (${model.vendor})\n`;
        });
        md += '\n';
      }
    });
  } else {
    md += '✅ Nenhum erro categorizado.\n\n';
  }

  md += '---\n\n';
  md += `*Relatório gerado em ${summary.timestamp.toISOString()}*\n`;
  md += `*Duração total: ${(summary.duration / 1000).toFixed(2)}s*\n`;

  return md;
}

// Executar script
const vendorFilter = process.argv[2];

testAllModels(vendorFilter)
  .then(() => {
    console.log('🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
