// backend/scripts/clear-all-certifications.ts
// Standards: docs/STANDARDS.md

/**
 * Script para limpar TODAS as certificações do banco de dados
 *
 * Uso:
 *   npx ts-node backend/scripts/clear-all-certifications.ts            # Limpa TODAS as certificações
 *   npx ts-node backend/scripts/clear-all-certifications.ts <vendor>   # Limpa apenas o vendor específico
 *
 * Exemplos:
 *   CONFIRM=true npx ts-node backend/scripts/clear-all-certifications.ts
 *   CONFIRM=true npx ts-node backend/scripts/clear-all-certifications.ts amazon
 *   CONFIRM=true npx ts-node backend/scripts/clear-all-certifications.ts anthropic
 *   CONFIRM=true npx ts-node backend/scripts/clear-all-certifications.ts cohere
 *
 * O script deleta TODAS as certificações independente do status (certified, failed, quality_warning).
 *
 * Após limpar, você pode forçar re-certificação usando:
 *   POST /api/certifications/run { provider: "amazon" }
 *
 * ⚠️ ATENÇÃO: Requer CONFIRM=true para executar (proteção contra deleção acidental)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllCertifications(provider?: string) {
  try {
    console.log('🧹 Iniciando limpeza de certificações...\n');

    // Construir filtro baseado em argumentos
    const whereClause: any = {};

    // Se vendor fornecido, adicionar ao filtro
    if (provider) {
      whereClause.vendor = provider;
      console.log(`🎯 Modo: Limpar apenas vendor específico`);
      console.log(`   Vendor: ${provider}\n`);
    } else {
      console.log(`🎯 Modo: Limpar TODAS as certificações de TODOS os vendors\n`);
    }

    // Buscar certificações que serão deletadas (para mostrar antes)
    const toDelete = await prisma.modelCertification.findMany({
      where: whereClause,
      select: {
        id: true,
        modelId: true,
        vendor: true,
        status: true,
        errorCategory: true,
        successRate: true,
        lastTestedAt: true
      },
      orderBy: [
        { vendor: 'asc' },
        { modelId: 'asc' }
      ]
    });

    if (toDelete.length === 0) {
      console.log('✅ Nenhuma certificação encontrada para limpar.');
      return;
    }

    console.log(`📋 Certificações que serão deletadas (${toDelete.length}):\n`);
    
    // Agrupar por vendor para melhor visualização
    const byVendor = toDelete.reduce((acc, cert) => {
      const vendor = cert.vendor || 'unknown';
      if (!acc[vendor]) {
        acc[vendor] = [];
      }
      acc[vendor].push(cert);
      return acc;
    }, {} as Record<string, typeof toDelete>);

    Object.entries(byVendor).forEach(([vendorName, certs]) => {
      console.log(`\n📦 Vendor: ${vendorName} (${certs.length} certificações)`);
      console.log('─'.repeat(60));
      
      certs.forEach((cert, index) => {
        console.log(`${index + 1}. ${cert.modelId}`);
        console.log(`   Status: ${cert.status}`);
        console.log(`   Success Rate: ${cert.successRate !== null ? `${cert.successRate}%` : 'N/A'}`);
        console.log(`   Categoria: ${cert.errorCategory || 'N/A'}`);
        console.log(`   Último teste: ${cert.lastTestedAt?.toISOString() || 'N/A'}`);
        console.log('');
      });
    });

    // Confirmar antes de deletar (apenas se não for CI/CD)
    if (process.env.CI !== 'true') {
      console.log('\n⚠️  ATENÇÃO: Esta operação é irreversível!\n');
      console.log('Para confirmar, execute novamente com a variável CONFIRM=true:');
      console.log(`   CONFIRM=true npx ts-node backend/scripts/clear-all-certifications.ts${provider ? ` ${provider}` : ''}\n`);
      
      if (process.env.CONFIRM !== 'true') {
        console.log('❌ Operação cancelada (CONFIRM não definido)');
        return;
      }
    }

    // Executar deleção
    console.log('🗑️  Deletando certificações...\n');
    const result = await prisma.modelCertification.deleteMany({
      where: whereClause
    });

    console.log(`✅ Limpeza concluída com sucesso!`);
    console.log(`   Certificações deletadas: ${result.count}\n`);

    // Mostrar resumo
    if (provider) {
      console.log(`💡 Próximo passo: Re-certificar o vendor`);
      console.log(`   POST /api/certifications/run`);
      console.log(`   Body: { "provider": "${provider}" }\n`);
    } else {
      console.log(`💡 Próximo passo: Re-certificar os vendors`);
      console.log(`   POST /api/certifications/run`);
      console.log(`   Body: { "provider": "amazon" } (ou outro vendor)\n`);
    }

    // Mostrar estatísticas
    console.log('📊 Estatísticas da limpeza:');
    Object.entries(byVendor).forEach(([vendorName, certs]) => {
      const certified = certs.filter(c => c.status === 'CERTIFIED').length;
      const failed = certs.filter(c => c.status === 'FAILED').length;
      const warning = certs.filter(c => c.status === 'QUALITY_WARNING').length;
      
      console.log(`   ${vendorName}:`);
      console.log(`     - Certified: ${certified}`);
      console.log(`     - Failed: ${failed}`);
      console.log(`     - Quality Warning: ${warning}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao limpar certificações:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
const provider = process.argv[2]; // Argumento opcional: provider específico

clearAllCertifications(provider)
  .then(() => {
    console.log('🎉 Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
