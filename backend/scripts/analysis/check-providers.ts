// backend/scripts/check-providers.ts
// Script para verificar providers no banco

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProviders() {
  try {
    console.log('🔍 Verificando providers no banco...\n');

    // 1. Buscar todos os providers
    const allProviders = await prisma.aIProvider.findMany({
      include: {
        models: true
      }
    });

    console.log(`📊 Total de providers: ${allProviders.length}\n`);

    for (const provider of allProviders) {
      console.log(`📦 Provider: ${provider.name} (${provider.slug})`);
      console.log(`   ID: ${provider.id}`);
      console.log(`   Ativo: ${provider.isActive ? '✅' : '❌'}`);
      console.log(`   Modelos: ${provider.models.length}`);
      console.log('');
    }

    // 2. Buscar providers ativos
    const activeProviders = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: { models: true }
    });

    console.log(`\n✅ Providers ativos: ${activeProviders.length}\n`);

    if (activeProviders.length === 0) {
      console.log('❌ PROBLEMA: Nenhum provider ativo encontrado!');
      console.log('   Isso explica por que o ControlPanel não mostra modelos.\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProviders();
