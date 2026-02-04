// backend/scripts/test-all-models-demo.ts
// Standards: docs/STANDARDS.md

/**
 * Script DEMO para demonstrar o relatório gerado pelo test-all-models.ts
 * 
 * Este script gera um relatório de exemplo sem precisar de credenciais AWS válidas
 * Útil para demonstrar o formato e conteúdo do relatório
 */

import * as fs from 'fs';
import * as path from 'path';
import { ErrorCategory } from '../src/services/ai/certification/types';

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

function analyzeResults(result: ModelTestResult): {
  explanation: string;
  recommendations: string[];
} {
  const { status, successRate, errorCategory, testsPassed, testsFailed } = result;
  
  let explanation = '';
  const recommendations: string[] = [];

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
    } else {
      explanation += '**Motivo:** Múltiplos testes falharam. O modelo não é confiável para uso em produção.';
      recommendations.push('❌ Não recomendado para uso em produção');
      recommendations.push('🔍 Revisar logs de erro para mais detalhes');
    }
  }

  return { explanation, recommendations };
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
  const certifiedModels = results.filter(r => r.status === 'certified');
  
  if (certifiedModels.length === 0) {
    md += '❌ Nenhum modelo certificado.\n\n';
  } else {
    md += '| Modelo | Vendor | Success Rate | Latency | Testes |\n';
    md += '|--------|--------|--------------|---------|--------|\n';
    certifiedModels.forEach(result => {
      const latency = result.avgLatencyMs ? `${result.avgLatencyMs}ms` : 'N/A';
      const tests = `${result.testsPassed}/${result.testsPassed + result.testsFailed}`;
      md += `| ${result.modelId} | ${result.vendor} | ${result.successRate.toFixed(1)}% | ${latency} | ${tests} |\n`;
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
  const warningModels = results.filter(r => r.status === 'quality_warning');
  
  if (warningModels.length === 0) {
    md += '✅ Nenhum modelo com avisos de qualidade.\n\n';
  } else {
    warningModels.forEach(result => {
      const { explanation, recommendations } = analyzeResults(result);
      md += `### ${result.modelId}\n\n`;
      md += `- **Vendor:** ${result.vendor}\n`;
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

      if (recommendations.length > 0) {
        md += '**Recomendações:**\n';
        recommendations.forEach(rec => md += `- ${rec}\n`);
        md += '\n';
      }
    });
  }

  md += '---\n\n';

  md += '## ❌ Modelos que Falharam\n\n';
  const failedModels = results.filter(r => r.status === 'failed');
  
  if (failedModels.length === 0) {
    md += '✅ Nenhum modelo falhou na certificação.\n\n';
  } else {
    failedModels.forEach(result => {
      const { explanation, recommendations } = analyzeResults(result);
      md += `### ${result.modelId}\n\n`;
      md += `- **Vendor:** ${result.vendor}\n`;
      md += `- **Success Rate:** ${result.successRate.toFixed(1)}%\n`;
      md += `- **Tests:** ${result.testsPassed} passed, ${result.testsFailed} failed\n`;
      if (result.errorCategory) {
        md += `- **Error Category:** ${result.errorCategory}\n`;
        md += `- **Error Severity:** ${result.errorSeverity}\n`;
      }
      md += '\n';
      md += `${explanation}\n\n`;
      
      if (result.lastError) {
        md += '**Último Erro:**\n';
        md += `\`\`\`\n${result.lastError}\n\`\`\`\n\n`;
      }

      if (recommendations.length > 0) {
        md += '**Recomendações:**\n';
        recommendations.forEach(rec => md += `- ${rec}\n`);
        md += '\n';
      }
    });
  }

  md += '---\n\n';
  md += `*Relatório gerado em ${summary.timestamp.toISOString()}*\n`;

  return md;
}

// Gerar dados de exemplo
function generateDemoData(): { summary: TestSummary; results: ModelTestResult[] } {
  const now = new Date();
  
  const results: ModelTestResult[] = [
    {
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      modelName: 'Claude 3.5 Sonnet v2',
      vendor: 'anthropic',
      status: 'certified',
      successRate: 100,
      testsPassed: 6,
      testsFailed: 0,
      avgLatencyMs: 1250,
      errorCategory: null,
      errorSeverity: null,
      lastError: null,
      qualityIssues: [],
      testedAt: now,
      testResults: [
        { testName: 'basic-prompt', passed: true, latencyMs: 1200 },
        { testName: 'streaming', passed: true, latencyMs: 1300 },
        { testName: 'parameter-validation', passed: true, latencyMs: 1100 },
        { testName: 'availability-check', passed: true, latencyMs: 1400 },
        { testName: 'anthropic-system-message', passed: true, latencyMs: 1250 },
        { testName: 'anthropic-temperature-top-p-conflict', passed: true, latencyMs: 1300 }
      ]
    },
    {
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      modelName: 'Claude 3 Haiku',
      vendor: 'anthropic',
      status: 'certified',
      successRate: 83.3,
      testsPassed: 5,
      testsFailed: 1,
      avgLatencyMs: 850,
      errorCategory: null,
      errorSeverity: null,
      lastError: null,
      qualityIssues: ['anthropic-temperature-top-p-conflict'],
      testedAt: now,
      testResults: [
        { testName: 'basic-prompt', passed: true, latencyMs: 800 },
        { testName: 'streaming', passed: true, latencyMs: 900 },
        { testName: 'parameter-validation', passed: true, latencyMs: 750 },
        { testName: 'availability-check', passed: true, latencyMs: 950 },
        { testName: 'anthropic-system-message', passed: true, latencyMs: 850 },
        { testName: 'anthropic-temperature-top-p-conflict', passed: false, error: 'Conflito entre temperature e top_p', latencyMs: 0 }
      ]
    },
    {
      modelId: 'amazon.titan-text-premier-v1:0',
      modelName: 'Titan Text Premier',
      vendor: 'amazon',
      status: 'quality_warning',
      successRate: 60,
      testsPassed: 3,
      testsFailed: 2,
      avgLatencyMs: 950,
      errorCategory: 'QUALITY_ISSUE',
      errorSeverity: 'MEDIUM',
      lastError: 'Streaming não suportado adequadamente',
      qualityIssues: ['streaming', 'amazon-guardrails'],
      testedAt: now,
      testResults: [
        { testName: 'basic-prompt', passed: true, latencyMs: 900 },
        { testName: 'streaming', passed: false, error: 'Streaming não suportado', latencyMs: 0 },
        { testName: 'parameter-validation', passed: true, latencyMs: 1000 },
        { testName: 'availability-check', passed: true, latencyMs: 950 },
        { testName: 'amazon-guardrails', passed: false, error: 'Guardrails não configurados', latencyMs: 0 }
      ]
    },
    {
      modelId: 'cohere.command-r-plus-v1:0',
      modelName: 'Command R+',
      vendor: 'cohere',
      status: 'failed',
      successRate: 20,
      testsPassed: 1,
      testsFailed: 4,
      avgLatencyMs: null,
      errorCategory: ErrorCategory.PROVISIONING_REQUIRED,
      errorSeverity: 'CRITICAL',
      lastError: 'You don\'t have access to the model with the specified model ID.',
      qualityIssues: ['basic-prompt', 'streaming', 'parameter-validation', 'cohere-search-queries'],
      testedAt: now,
      testResults: [
        { testName: 'basic-prompt', passed: false, error: 'Modelo requer provisionamento', latencyMs: 0 },
        { testName: 'streaming', passed: false, error: 'Modelo requer provisionamento', latencyMs: 0 },
        { testName: 'parameter-validation', passed: false, error: 'Modelo requer provisionamento', latencyMs: 0 },
        { testName: 'availability-check', passed: true, latencyMs: 100 },
        { testName: 'cohere-search-queries', passed: false, error: 'Modelo requer provisionamento', latencyMs: 0 }
      ]
    }
  ];

  const summary: TestSummary = {
    totalModels: results.length,
    certified: results.filter(r => r.status === 'certified').length,
    failed: results.filter(r => r.status === 'failed').length,
    qualityWarning: results.filter(r => r.status === 'quality_warning').length,
    byVendor: {
      anthropic: {
        total: 2,
        certified: 2,
        failed: 0,
        qualityWarning: 0
      },
      amazon: {
        total: 1,
        certified: 0,
        failed: 0,
        qualityWarning: 1
      },
      cohere: {
        total: 1,
        certified: 0,
        failed: 1,
        qualityWarning: 0
      }
    },
    timestamp: now,
    duration: 45000,
    recommendations: [
      '✅ 2 modelo(s) certificado(s) e pronto(s) para uso',
      '⚠️ 1 modelo(s) funcional(is) mas com limitações',
      '❌ 1 modelo(s) falharam na certificação',
      '🔧 1 modelo(s) requerem habilitação no AWS Console'
    ],
    commonIssues: {
      [ErrorCategory.PROVISIONING_REQUIRED]: 1,
      'QUALITY_ISSUE': 1
    }
  };

  return { summary, results };
}

async function generateDemoReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logsDir = path.join(__dirname, '../logs');
  
  // Criar diretório de logs se não existir
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  console.log('🎨 Gerando relatório de demonstração...\n');

  const { summary, results } = generateDemoData();

  // Salvar JSON
  const jsonPath = path.join(logsDir, `model-tests-demo-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    summary,
    results: results.map(r => ({
      ...r,
      analysis: analyzeResults(r)
    }))
  }, null, 2));

  // Salvar Markdown
  const mdPath = path.join(logsDir, `model-tests-demo-${timestamp}.md`);
  const markdown = generateMarkdownReport(summary, results);
  fs.writeFileSync(mdPath, markdown);

  console.log('✅ Relatório de demonstração gerado com sucesso!\n');
  console.log('📁 Arquivos gerados:');
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   MD:   ${mdPath}`);
  console.log('');
  console.log('📊 Sumário:');
  console.log(`   ✅ Certified: ${summary.certified}`);
  console.log(`   ⚠️  Quality Warning: ${summary.qualityWarning}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  console.log(`   📦 Total: ${summary.totalModels}`);
  console.log('');
}

generateDemoReport()
  .then(() => {
    console.log('🎉 Demo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
