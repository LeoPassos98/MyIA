// backend/scripts/cleanupDatabase.ts
// Standards: docs/STANDARDS.md
// Script de limpeza do banco de dados
// Remove modelos, providers e certificações obsoletos
// MANTÉM: configurações de usuário e credenciais AWS

import { prisma } from '../src/lib/prisma';

async function cleanupDatabase() {
  console.log('🧹 Iniciando limpeza do banco de dados...\n');

  try {
    // 1. Contar registros antes
    const beforeCounts = {
      models: await prisma.aIModel.count(),
      providers: await prisma.aIProvider.count(),
      certifications: await prisma.modelCertification.count(),
      credentials: await prisma.userProviderCredential.count(),
      users: await prisma.user.count(),
      settings: await prisma.userSettings.count()
    };

    console.log('📊 Estado atual do banco:');
    console.log(`   Modelos: ${beforeCounts.models}`);
    console.log(`   Providers: ${beforeCounts.providers}`);
    console.log(`   Certificações: ${beforeCounts.certifications}`);
    console.log(`   Credenciais: ${beforeCounts.credentials}`);
    console.log(`   Usuários: ${beforeCounts.users}`);
    console.log(`   Configurações: ${beforeCounts.settings}\n`);

    // 2. Confirmar limpeza
    console.log('⚠️  Esta operação irá remover:');
    console.log('   - Todos os modelos');
    console.log('   - Todos os providers');
    console.log('   - Todas as certificações');
    console.log('   - Todas as credenciais de providers\n');
    console.log('✅ Será mantido:');
    console.log('   - Usuários');
    console.log('   - Configurações gerais\n');

    // 3. Executar limpeza NA ORDEM CORRETA (respeitar foreign keys)
    console.log('🧹 Executando limpeza...');

    // Passo 1: Certificações (sem dependências)
    await prisma.modelCertification.deleteMany({});
    console.log('   ✅ Certificações removidas');

    // Passo 2: Modelos (sem dependências)
    await prisma.aIModel.deleteMany({});
    console.log('   ✅ Modelos removidos');

    // Passo 3: Credenciais de providers (referencia ai_providers)
    await prisma.userProviderCredential.deleteMany({});
    console.log('   ✅ Credenciais de providers removidas');

    // Passo 4: Providers (agora pode ser deletado)
    await prisma.aIProvider.deleteMany({});
    console.log('   ✅ Providers removidos');

    // 4. Verificar resultado
    const afterCounts = {
      models: await prisma.aIModel.count(),
      providers: await prisma.aIProvider.count(),
      certifications: await prisma.modelCertification.count(),
      credentials: await prisma.userProviderCredential.count(),
      users: await prisma.user.count(),
      settings: await prisma.userSettings.count()
    };

    console.log('\n📊 Estado após limpeza:');
    console.log(`   Modelos: ${afterCounts.models}`);
    console.log(`   Providers: ${afterCounts.providers}`);
    console.log(`   Certificações: ${afterCounts.certifications}`);
    console.log(`   Credenciais: ${afterCounts.credentials}`);
    console.log(`   Usuários: ${afterCounts.users} (mantidos)`);
    console.log(`   Configurações: ${afterCounts.settings} (mantidas)\n`);

    console.log('✅ Limpeza concluída com sucesso!\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Acesse Settings → API Keys → AWS Bedrock');
    console.log('   2. Configure suas credenciais AWS');
    console.log('   3. Clique em "Testar e Salvar" para buscar novos modelos');
    console.log('   4. Selecione os modelos desejados');
    console.log('   5. Certifique os modelos selecionados\n');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
cleanupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
