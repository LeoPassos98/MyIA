// backend/scripts/sync-models-to-db.ts
// Script para sincronizar modelos do ModelRegistry (memória) para a tabela ai_models (banco)

import { PrismaClient } from '@prisma/client';
import { ModelRegistry } from '../src/services/ai/registry/model-registry';
// Importar todos os registros de modelos para popular o ModelRegistry
import '../src/services/ai/registry/models';

const prisma = new PrismaClient();

async function syncModelsToDatabase() {
  console.log('🔄 Sincronizando modelos para o banco de dados...\n');

  // 1. Buscar todos os modelos do ModelRegistry
  const registryModels = ModelRegistry.getAllSupported();
  console.log(`📊 Encontrados ${registryModels.length} modelos no ModelRegistry\n`);

  // 2. Garantir que existe um provider padrão (bedrock)
  const defaultProvider = await prisma.aIProvider.upsert({
    where: { slug: 'bedrock' },
    update: {},
    create: {
      name: 'AWS Bedrock',
      slug: 'bedrock',
      isActive: true,
      websiteUrl: 'https://aws.amazon.com/bedrock',
      baseUrl: null
    }
  });
  console.log(`✅ Provider padrão: ${defaultProvider.name} (${defaultProvider.id})\n`);

  // 3. Sincronizar cada modelo
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const model of registryModels) {
    try {
      // Verificar se o modelo já existe
      const existing = await prisma.aIModel.findFirst({
        where: { apiModelId: model.modelId }
      });

      const modelData = {
        name: model.displayName,
        apiModelId: model.modelId,
        contextWindow: model.capabilities.maxContextWindow || 4096,
        costPer1kInput: 0,
        costPer1kOutput: 0,
        isActive: true,
        providerId: defaultProvider.id
      };

      if (existing) {
        // Atualizar modelo existente
        await prisma.aIModel.update({
          where: { id: existing.id },
          data: modelData
        });
        updated++;
        console.log(`   📝 Atualizado: ${model.displayName}`);
      } else {
        // Criar novo modelo
        await prisma.aIModel.create({
          data: modelData
        });
        created++;
        console.log(`   ✨ Criado: ${model.displayName}`);
      }
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Erro em ${model.displayName}: ${error.message}`);
    }
  }

  // 4. Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA SINCRONIZAÇÃO');
  console.log('='.repeat(50));
  console.log(`   ✨ Criados: ${created}`);
  console.log(`   📝 Atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total no registro: ${registryModels.length}`);
  
  // Verificar total no banco
  const totalInDb = await prisma.aIModel.count();
  const activeInDb = await prisma.aIModel.count({ where: { isActive: true } });
  console.log(`   🗄️  Total no banco: ${totalInDb}`);
  console.log(`   ✅ Ativos no banco: ${activeInDb}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

syncModelsToDatabase()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
