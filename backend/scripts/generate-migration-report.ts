/**
 * @file generate-migration-report.ts
 * @description Gera relatório de migração e certificação
 */

import { prisma } from '../src/lib/prisma';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';

async function generateReport() {
  logger.info('📊 Gerando relatório de migração...');
  
  // Buscar certificações recentes
  const certifications = await prisma.modelCertification.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Agrupar por vendor
  const byVendor = certifications.reduce((acc, cert) => {
    const vendor = cert.vendor || cert.modelId.split('.')[0];
    if (!acc[vendor]) acc[vendor] = [];
    acc[vendor].push(cert);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Gerar markdown
  let report = '# Relatório de Migração - Sprint 3\n\n';
  report += `**Data:** ${new Date().toISOString()}\n\n`;
  report += `**Total de Certificações:** ${certifications.length}\n\n`;
  
  report += '## Estatísticas por Vendor\n\n';
  
  for (const [vendor, certs] of Object.entries(byVendor)) {
    const passed = certs.filter(c => c.status === 'certified' || c.status === 'PASSED').length;
    const failed = certs.filter(c => c.status === 'failed' || c.status === 'FAILED').length;
    const qualityWarning = certs.filter(c => c.status === 'QUALITY_WARNING').length;
    const successRate = (passed / certs.length * 100).toFixed(1);
    
    report += `### ${vendor.toUpperCase()}\n`;
    report += `- Total: ${certs.length}\n`;
    report += `- Passed: ${passed}\n`;
    report += `- Failed: ${failed}\n`;
    report += `- Quality Warning: ${qualityWarning}\n`;
    report += `- Taxa de Sucesso: ${successRate}%\n\n`;
    
    // Listar modelos
    report += '| Modelo | Status | Rating | Badge | Tests Passed |\n';
    report += '|--------|--------|--------|-------|-------------|\n';
    
    for (const cert of certs) {
      const rating = cert.rating ? cert.rating.toFixed(1) : 'N/A';
      const badge = cert.badge || 'N/A';
      report += `| ${cert.modelId} | ${cert.status} | ${rating} | ${badge} | ${cert.testsPassed}/${cert.testsPassed + cert.testsFailed} |\n`;
    }
    
    report += '\n';
  }
  
  // Estatísticas gerais
  const totalPassed = certifications.filter(c => c.status === 'certified' || c.status === 'PASSED').length;
  const totalFailed = certifications.filter(c => c.status === 'failed' || c.status === 'FAILED').length;
  const overallSuccessRate = (totalPassed / certifications.length * 100).toFixed(1);
  
  report += '## Estatísticas Gerais\n\n';
  report += `- **Taxa de Sucesso Geral:** ${overallSuccessRate}%\n`;
  report += `- **Total Passed:** ${totalPassed}\n`;
  report += `- **Total Failed:** ${totalFailed}\n\n`;
  
  // Ratings médios
  const ratingsAvailable = certifications.filter(c => c.rating !== null);
  if (ratingsAvailable.length > 0) {
    const avgRating = ratingsAvailable.reduce((sum, c) => sum + (c.rating || 0), 0) / ratingsAvailable.length;
    report += `- **Rating Médio:** ${avgRating.toFixed(2)}\n\n`;
  }
  
  // Badges
  const badgeCounts = certifications.reduce((acc, cert) => {
    const badge = cert.badge || 'N/A';
    acc[badge] = (acc[badge] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  report += '## Distribuição de Badges\n\n';
  Object.entries(badgeCounts).forEach(([badge, count]) => {
    report += `- ${badge}: ${count}\n`;
  });
  report += '\n';
  
  // Conclusão
  report += '## Conclusão\n\n';
  if (parseFloat(overallSuccessRate) >= 80) {
    report += '✅ **Migração bem-sucedida!** Taxa de sucesso acima de 80%.\n\n';
  } else {
    report += '⚠️ **Atenção:** Taxa de sucesso abaixo de 80%. Revisar modelos com falha.\n\n';
  }
  
  // Salvar relatório
  const filename = `MIGRATION_REPORT_${Date.now()}.md`;
  fs.writeFileSync(filename, report);
  
  logger.info(`✅ Relatório salvo: ${filename}`);
  
  return report;
}

generateReport()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch(error => {
    logger.error('Erro ao gerar relatório:', error);
    prisma.$disconnect();
    process.exit(1);
  });
