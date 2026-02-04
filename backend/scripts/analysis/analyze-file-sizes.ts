// backend/scripts/analyze-file-sizes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * @file analyze-file-sizes.ts
 * @description Analisa tamanho de arquivos de código para identificar problemas de manutenibilidade
 * 
 * Este script escaneia recursivamente arquivos .ts, .tsx, .js, .jsx nos diretórios backend/src e frontend/src,
 * coletando métricas de linhas de código e gerando um relatório detalhado em Markdown.
 * 
 * Diretrizes de tamanho:
 * - ✅ SAUDÁVEL: ≤ 250 linhas
 * - ⚠️ ATENÇÃO: 251-400 linhas
 * - 🚨 CRÍTICO: 401-500 linhas
 * - 🔴 URGENTE: > 500 linhas
 * 
 * Uso: ts-node backend/scripts/analyze-file-sizes.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../src/utils/logger';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface FileMetrics {
  path: string;
  totalLines: number;
  codeLines: number;
  type: FileType;
  status: HealthStatus;
}

type FileType = 
  | 'controller'
  | 'service'
  | 'adapter'
  | 'route'
  | 'middleware'
  | 'component'
  | 'hook'
  | 'util'
  | 'config'
  | 'schema'
  | 'type'
  | 'test'
  | 'other';

type HealthStatus = 'healthy' | 'attention' | 'critical' | 'urgent';

interface Statistics {
  totalFiles: number;
  testFiles: number;
  byStatus: Record<HealthStatus, number>;
  byType: Record<FileType, { count: number; avgLines: number; totalLines: number }>;
  top10Largest: FileMetrics[];
  urgentRefactoring: FileMetrics[];
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  directories: ['backend/src', 'frontend/src'],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '.git'
  ],
  testPatterns: ['.test.', '.spec.'],
  thresholds: {
    healthy: 250,
    attention: 400,
    critical: 500
  }
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se o arquivo deve ser excluído da análise
 */
function shouldExclude(filePath: string): boolean {
  return CONFIG.excludePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Verifica se o arquivo é um arquivo de teste
 */
function isTestFile(filePath: string): boolean {
  return CONFIG.testPatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Determina o tipo do arquivo baseado no nome e caminho
 */
function inferFileType(filePath: string): FileType {
  const fileName = path.basename(filePath).toLowerCase();
  const dirPath = path.dirname(filePath).toLowerCase();

  // Testes
  if (isTestFile(filePath)) return 'test';

  // Controllers
  if (fileName.includes('controller')) return 'controller';

  // Services
  if (fileName.includes('service') || dirPath.includes('services')) return 'service';

  // Adapters
  if (fileName.includes('adapter') || dirPath.includes('adapters')) return 'adapter';

  // Routes
  if (fileName.includes('route') || dirPath.includes('routes')) return 'route';

  // Middleware
  if (fileName.includes('middleware') || dirPath.includes('middleware')) return 'middleware';

  // Components (React)
  if (filePath.endsWith('.tsx') && /^[A-Z]/.test(fileName)) return 'component';

  // Hooks
  if (fileName.startsWith('use') && filePath.endsWith('.ts')) return 'hook';

  // Config
  if (fileName.includes('config') || dirPath.includes('config')) return 'config';

  // Schema
  if (fileName.includes('schema') || dirPath.includes('schemas')) return 'schema';

  // Types
  if (fileName.includes('type') || fileName.includes('interface') || dirPath.includes('types')) return 'type';

  // Utils
  if (fileName.includes('util') || fileName.includes('helper') || dirPath.includes('utils')) return 'util';

  return 'other';
}

/**
 * Determina o status de saúde baseado no número de linhas
 */
function getHealthStatus(codeLines: number): HealthStatus {
  if (codeLines <= CONFIG.thresholds.healthy) return 'healthy';
  if (codeLines <= CONFIG.thresholds.attention) return 'attention';
  if (codeLines <= CONFIG.thresholds.critical) return 'critical';
  return 'urgent';
}

/**
 * Conta linhas de código excluindo comentários e linhas vazias
 */
function countCodeLines(content: string): { totalLines: number; codeLines: number } {
  const lines = content.split('\n');
  const totalLines = lines.length;

  let codeLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Pular linhas vazias
    if (trimmed === '') continue;

    // Detectar início/fim de comentário de bloco
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }
    if (trimmed.endsWith('*/')) {
      inBlockComment = false;
      continue;
    }

    // Pular se estiver em comentário de bloco
    if (inBlockComment) continue;

    // Pular comentários de linha única
    if (trimmed.startsWith('//')) continue;

    // Linha de código válida
    codeLines++;
  }

  return { totalLines, codeLines };
}

/**
 * Escaneia recursivamente um diretório e coleta métricas de arquivos
 */
async function scanDirectory(dirPath: string): Promise<FileMetrics[]> {
  const metrics: FileMetrics[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Pular diretórios/arquivos excluídos
      if (shouldExclude(fullPath)) continue;

      if (entry.isDirectory()) {
        // Recursão em subdiretórios
        const subMetrics = await scanDirectory(fullPath);
        metrics.push(...subMetrics);
      } else if (entry.isFile()) {
        // Verificar extensão
        const ext = path.extname(entry.name);
        if (!CONFIG.extensions.includes(ext)) continue;

        // Ler e analisar arquivo
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const { totalLines, codeLines } = countCodeLines(content);
          const type = inferFileType(fullPath);
          const status = getHealthStatus(codeLines);

          metrics.push({
            path: fullPath,
            totalLines,
            codeLines,
            type,
            status
          });
        } catch (error) {
          logger.warn(`Erro ao ler arquivo ${fullPath}:`, { error });
        }
      }
    }
  } catch (error) {
    logger.warn(`Erro ao escanear diretório ${dirPath}:`, { error });
  }

  return metrics;
}

/**
 * Calcula estatísticas gerais dos arquivos analisados
 */
function calculateStatistics(allMetrics: FileMetrics[]): Statistics {
  // Separar arquivos de teste
  const testFiles = allMetrics.filter(m => m.type === 'test');
  const codeFiles = allMetrics.filter(m => m.type !== 'test');

  // Distribuição por status
  const byStatus: Record<HealthStatus, number> = {
    healthy: 0,
    attention: 0,
    critical: 0,
    urgent: 0
  };

  codeFiles.forEach(m => {
    byStatus[m.status]++;
  });

  // Distribuição por tipo
  const byType: Record<FileType, { count: number; avgLines: number; totalLines: number }> = {} as any;

  codeFiles.forEach(m => {
    if (!byType[m.type]) {
      byType[m.type] = { count: 0, avgLines: 0, totalLines: 0 };
    }
    byType[m.type].count++;
    byType[m.type].totalLines += m.codeLines;
  });

  // Calcular médias
  Object.keys(byType).forEach(type => {
    const typeKey = type as FileType;
    byType[typeKey].avgLines = Math.round(byType[typeKey].totalLines / byType[typeKey].count);
  });

  // Top 10 maiores arquivos
  const top10Largest = [...codeFiles]
    .sort((a, b) => b.codeLines - a.codeLines)
    .slice(0, 10);

  // Arquivos que precisam refatoração urgente
  const urgentRefactoring = codeFiles
    .filter(m => m.status === 'urgent' || m.status === 'critical')
    .sort((a, b) => b.codeLines - a.codeLines);

  return {
    totalFiles: codeFiles.length,
    testFiles: testFiles.length,
    byStatus,
    byType,
    top10Largest,
    urgentRefactoring
  };
}

/**
 * Gera relatório em formato Markdown
 */
function generateMarkdownReport(stats: Statistics): string {
  const now = new Date().toISOString();
  
  let report = '# 📊 Relatório de Análise de Tamanho de Arquivos\n\n';
  report += `**Data de Geração:** ${now}\n\n`;
  report += '---\n\n';

  // ========== SUMÁRIO EXECUTIVO ==========
  report += '## 📋 Sumário Executivo\n\n';
  report += `- **Total de Arquivos Analisados:** ${stats.totalFiles}\n`;
  report += `- **Arquivos de Teste:** ${stats.testFiles}\n`;
  report += `- **Arquivos Saudáveis (≤250 linhas):** ${stats.byStatus.healthy} (${((stats.byStatus.healthy / stats.totalFiles) * 100).toFixed(1)}%)\n`;
  report += `- **Arquivos com Atenção (251-400):** ${stats.byStatus.attention} (${((stats.byStatus.attention / stats.totalFiles) * 100).toFixed(1)}%)\n`;
  report += `- **Arquivos Críticos (401-500):** ${stats.byStatus.critical} (${((stats.byStatus.critical / stats.totalFiles) * 100).toFixed(1)}%)\n`;
  report += `- **Arquivos Urgentes (>500):** ${stats.byStatus.urgent} (${((stats.byStatus.urgent / stats.totalFiles) * 100).toFixed(1)}%)\n\n`;

  const healthPercentage = (stats.byStatus.healthy / stats.totalFiles) * 100;
  if (healthPercentage >= 80) {
    report += '✅ **Status Geral:** EXCELENTE - Mais de 80% dos arquivos estão saudáveis.\n\n';
  } else if (healthPercentage >= 60) {
    report += '⚠️ **Status Geral:** BOM - Maioria dos arquivos está saudável, mas há espaço para melhorias.\n\n';
  } else {
    report += '🚨 **Status Geral:** ATENÇÃO - Muitos arquivos precisam de refatoração.\n\n';
  }

  report += '---\n\n';

  // ========== ARQUIVOS PROBLEMÁTICOS ==========
  if (stats.urgentRefactoring.length > 0) {
    report += '## 🚨 Arquivos Problemáticos (≥251 linhas)\n\n';
    report += '| Status | Linhas | Tipo | Arquivo |\n';
    report += '|--------|--------|------|----------|\n';

    stats.urgentRefactoring.forEach(file => {
      const statusIcon = {
        urgent: '🔴',
        critical: '🚨',
        attention: '⚠️',
        healthy: '✅'
      }[file.status];

      report += `| ${statusIcon} ${file.status.toUpperCase()} | ${file.codeLines} | ${file.type} | \`${file.path}\` |\n`;
    });

    report += '\n---\n\n';
  }

  // ========== ESTATÍSTICAS POR TIPO ==========
  report += '## 📊 Estatísticas por Tipo de Arquivo\n\n';
  report += '| Tipo | Quantidade | Média de Linhas | Total de Linhas |\n';
  report += '|------|------------|-----------------|------------------|\n';

  const sortedTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b.avgLines - a.avgLines);

  sortedTypes.forEach(([type, data]) => {
    report += `| ${type} | ${data.count} | ${data.avgLines} | ${data.totalLines} |\n`;
  });

  report += '\n---\n\n';

  // ========== TOP 10 MAIORES ARQUIVOS ==========
  report += '## 🏆 Top 10 Maiores Arquivos\n\n';
  report += '| # | Linhas | Tipo | Status | Arquivo |\n';
  report += '|---|--------|------|--------|----------|\n';

  stats.top10Largest.forEach((file, index) => {
    const statusIcon = {
      urgent: '🔴',
      critical: '🚨',
      attention: '⚠️',
      healthy: '✅'
    }[file.status];

    report += `| ${index + 1} | ${file.codeLines} | ${file.type} | ${statusIcon} ${file.status} | \`${file.path}\` |\n`;
  });

  report += '\n---\n\n';

  // ========== RECOMENDAÇÕES ==========
  report += '## 💡 Recomendações de Refatoração\n\n';

  if (stats.byStatus.urgent > 0) {
    report += '### 🔴 PRIORIDADE URGENTE\n\n';
    report += `Existem **${stats.byStatus.urgent} arquivos com mais de 500 linhas**. Estes devem ser refatorados imediatamente:\n\n`;
    
    const urgentFiles = stats.urgentRefactoring.filter(f => f.status === 'urgent').slice(0, 5);
    urgentFiles.forEach(file => {
      report += `- \`${file.path}\` (${file.codeLines} linhas) - ${file.type}\n`;
    });
    report += '\n';
  }

  if (stats.byStatus.critical > 0) {
    report += '### 🚨 PRIORIDADE ALTA\n\n';
    report += `Existem **${stats.byStatus.critical} arquivos entre 401-500 linhas**. Considere refatorar:\n\n`;
    
    const criticalFiles = stats.urgentRefactoring.filter(f => f.status === 'critical').slice(0, 5);
    criticalFiles.forEach(file => {
      report += `- \`${file.path}\` (${file.codeLines} linhas) - ${file.type}\n`;
    });
    report += '\n';
  }

  if (stats.byStatus.attention > 0) {
    report += '### ⚠️ PRIORIDADE MÉDIA\n\n';
    report += `Existem **${stats.byStatus.attention} arquivos entre 251-400 linhas**. Monitore o crescimento:\n\n`;
    
    const attentionFiles = stats.urgentRefactoring.filter(f => f.status === 'attention').slice(0, 5);
    attentionFiles.forEach(file => {
      report += `- \`${file.path}\` (${file.codeLines} linhas) - ${file.type}\n`;
    });
    report += '\n';
  }

  report += '### 📚 Estratégias de Refatoração\n\n';
  report += '1. **Controllers grandes:** Extrair lógica para services\n';
  report += '2. **Services grandes:** Dividir em múltiplos services especializados\n';
  report += '3. **Adapters grandes:** Separar em métodos auxiliares ou sub-adapters\n';
  report += '4. **Components grandes:** Extrair sub-componentes e custom hooks\n';
  report += '5. **Hooks grandes:** Dividir em hooks menores e mais focados\n\n';

  report += '---\n\n';

  // ========== CONCLUSÃO ==========
  report += '## ✅ Conclusão\n\n';
  
  const problemFiles = stats.byStatus.urgent + stats.byStatus.critical;
  if (problemFiles === 0) {
    report += '🎉 **Excelente!** Nenhum arquivo crítico ou urgente encontrado.\n\n';
  } else if (problemFiles <= 5) {
    report += `⚠️ **Atenção:** ${problemFiles} arquivo(s) precisam de refatoração prioritária.\n\n`;
  } else {
    report += `🚨 **Ação Necessária:** ${problemFiles} arquivos precisam de refatoração urgente.\n\n`;
  }

  report += 'Este relatório deve ser revisado regularmente para manter a qualidade do código.\n\n';
  report += '---\n\n';
  report += `*Gerado automaticamente por \`analyze-file-sizes.ts\` em ${now}*\n`;

  return report;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  logger.info('🔍 Iniciando análise de tamanho de arquivos...');

  const allMetrics: FileMetrics[] = [];

  // Escanear cada diretório configurado
  for (const dir of CONFIG.directories) {
    logger.info(`📂 Escaneando diretório: ${dir}`);
    
    try {
      await fs.access(dir);
      const metrics = await scanDirectory(dir);
      allMetrics.push(...metrics);
      logger.info(`✅ ${metrics.length} arquivos encontrados em ${dir}`);
    } catch (error) {
      logger.warn(`⚠️ Diretório ${dir} não encontrado, pulando...`);
    }
  }

  if (allMetrics.length === 0) {
    logger.error('❌ Nenhum arquivo encontrado para análise!');
    process.exit(1);
  }

  logger.info(`📊 Total de arquivos analisados: ${allMetrics.length}`);

  // Calcular estatísticas
  logger.info('📈 Calculando estatísticas...');
  const stats = calculateStatistics(allMetrics);

  // Gerar relatório
  logger.info('📝 Gerando relatório...');
  const report = generateMarkdownReport(stats);

  // Salvar relatório
  const reportPath = 'docs/FILE_SIZE_ANALYSIS_REPORT.md';
  await fs.writeFile(reportPath, report, 'utf-8');

  logger.info(`✅ Relatório salvo em: ${reportPath}`);

  // Exibir resumo no console
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA ANÁLISE');
  console.log('='.repeat(80));
  console.log(`Total de arquivos: ${stats.totalFiles}`);
  console.log(`✅ Saudáveis: ${stats.byStatus.healthy}`);
  console.log(`⚠️  Atenção: ${stats.byStatus.attention}`);
  console.log(`🚨 Críticos: ${stats.byStatus.critical}`);
  console.log(`🔴 Urgentes: ${stats.byStatus.urgent}`);
  console.log('='.repeat(80) + '\n');

  logger.info('✅ Análise concluída com sucesso!');
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro ao executar análise:', { error });
    process.exit(1);
  });
