// backend/scripts/diagnose-database-state.ts
// Standards: docs/STANDARDS.md

/**
 * Script de diagnóstico do estado atual do banco de dados
 * Verifica schema, dados e identifica o que precisa ser populado
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableCount {
  table: string;
  count: number;
  status: 'empty' | 'populated';
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão com banco de dados OK\n');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

async function checkSchema(): Promise<boolean> {
  console.log('🔍 Verificando schema do banco de dados...\n');
  
  try {
    // Verificar se as principais tabelas existem
    const tables = [
      'users',
      'user_settings',
      'ai_providers',
      'ai_models',
      'chats',
      'messages',
      'api_call_logs',
      'model_certifications',
      'certification_jobs',
      'logs'
    ];

    const existingTables: string[] = [];
    const missingTables: string[] = [];

    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        existingTables.push(table);
      } catch (error) {
        missingTables.push(table);
      }
    }

    console.log(`📊 Tabelas existentes: ${existingTables.length}/${tables.length}`);
    
    if (existingTables.length > 0) {
      console.log('✅ Tabelas encontradas:');
      existingTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
    }

    if (missingTables.length > 0) {
      console.log('⚠️  Tabelas faltando:');
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
      console.log('💡 Execute: npx prisma migrate deploy\n');
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('❌ Erro ao verificar schema:', error.message);
    return false;
  }
}

async function checkTableCounts(): Promise<TableCount[]> {
  console.log('📊 Verificando dados nas tabelas...\n');

  const counts: TableCount[] = [];

  try {
    // Users
    const userCount = await prisma.user.count();
    counts.push({
      table: 'users',
      count: userCount,
      status: userCount > 0 ? 'populated' : 'empty'
    });

    // AI Providers
    const providerCount = await prisma.aIProvider.count();
    counts.push({
      table: 'ai_providers',
      count: providerCount,
      status: providerCount > 0 ? 'populated' : 'empty'
    });

    // AI Models
    const modelCount = await prisma.aIModel.count();
    counts.push({
      table: 'ai_models',
      count: modelCount,
      status: modelCount > 0 ? 'populated' : 'empty'
    });

    // Chats
    const chatCount = await prisma.chat.count();
    counts.push({
      table: 'chats',
      count: chatCount,
      status: chatCount > 0 ? 'populated' : 'empty'
    });

    // Messages
    const messageCount = await prisma.message.count();
    counts.push({
      table: 'messages',
      count: messageCount,
      status: messageCount > 0 ? 'populated' : 'empty'
    });

    // API Call Logs
    const apiCallCount = await prisma.apiCallLog.count();
    counts.push({
      table: 'api_call_logs',
      count: apiCallCount,
      status: apiCallCount > 0 ? 'populated' : 'empty'
    });

    // Model Certifications
    const certCount = await prisma.modelCertification.count();
    counts.push({
      table: 'model_certifications',
      count: certCount,
      status: certCount > 0 ? 'populated' : 'empty'
    });

    // Certification Jobs
    const jobCount = await prisma.certificationJob.count();
    counts.push({
      table: 'certification_jobs',
      count: jobCount,
      status: jobCount > 0 ? 'populated' : 'empty'
    });

    // Logs
    const logCount = await prisma.log.count();
    counts.push({
      table: 'logs',
      count: logCount,
      status: logCount > 0 ? 'populated' : 'empty'
    });

    return counts;
  } catch (error: any) {
    console.error('❌ Erro ao contar registros:', error.message);
    return counts;
  }
}

function displayTableCounts(counts: TableCount[]): void {
  console.log('📋 Estado das tabelas:\n');

  const emptyTables = counts.filter(c => c.status === 'empty');
  const populatedTables = counts.filter(c => c.status === 'populated');

  if (populatedTables.length > 0) {
    console.log('✅ Tabelas com dados:');
    populatedTables.forEach(c => {
      console.log(`   ${c.table.padEnd(25)} ${c.count.toString().padStart(6)} registros`);
    });
    console.log('');
  }

  if (emptyTables.length > 0) {
    console.log('⚠️  Tabelas vazias:');
    emptyTables.forEach(c => {
      console.log(`   ${c.table.padEnd(25)} ${c.count.toString().padStart(6)} registros`);
    });
    console.log('');
  }
}

function generateRecommendations(counts: TableCount[]): void {
  console.log('=' .repeat(60));
  console.log('💡 RECOMENDAÇÕES');
  console.log('='.repeat(60));
  console.log('');

  const emptyTables = counts.filter(c => c.status === 'empty');
  const hasUsers = counts.find(c => c.table === 'users')?.count ?? 0 > 0;
  const hasProviders = counts.find(c => c.table === 'ai_providers')?.count ?? 0 > 0;
  const hasModels = counts.find(c => c.table === 'ai_models')?.count ?? 0 > 0;

  if (emptyTables.length === 0) {
    console.log('✅ Banco de dados está populado!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Verificar se os dados estão corretos');
    console.log('2. Testar autenticação com usuário existente');
    console.log('3. Verificar modelos disponíveis no frontend');
    console.log('');
    return;
  }

  console.log('📝 Passos necessários para popular o banco:\n');

  // Passo 1: Seed básico
  if (!hasUsers || !hasProviders || !hasModels) {
    console.log('1️⃣  SEED BÁSICO (Obrigatório)');
    console.log('   Popula: users, ai_providers, ai_models, chats, messages');
    console.log('   Comando: cd backend && npx prisma db seed');
    console.log('   Usuário criado: leo@leo.com / leoleo');
    console.log('');
  }

  // Passo 2: Adicionar modelos AWS Bedrock
  if (hasProviders && hasModels) {
    const modelCount = counts.find(c => c.table === 'ai_models')?.count ?? 0;
    if (modelCount < 100) {
      console.log('2️⃣  ADICIONAR MODELOS AWS BEDROCK (Recomendado)');
      console.log('   Adiciona 100+ modelos do AWS Bedrock ao registry');
      console.log('   Comando: cd backend && npx ts-node scripts/add-models-to-registry.ts');
      console.log('   Pré-requisito: Configurar credenciais AWS no frontend');
      console.log('');
    }
  }

  // Passo 3: Certificar modelos
  if (hasModels) {
    const certCount = counts.find(c => c.table === 'model_certifications')?.count ?? 0;
    if (certCount === 0) {
      console.log('3️⃣  CERTIFICAR MODELOS (Opcional)');
      console.log('   Testa e certifica modelos disponíveis');
      console.log('   Comando: ./manage-certifications.sh');
      console.log('   Ou: cd backend && npx ts-node scripts/recertify-all-models.ts');
      console.log('');
    }
  }

  // Resumo
  console.log('📌 RESUMO:');
  if (!hasUsers || !hasProviders || !hasModels) {
    console.log('   ⚠️  Banco está vazio - Execute o seed primeiro');
  } else {
    console.log('   ✅ Dados básicos OK - Pode adicionar mais modelos e certificar');
  }
  console.log('');
}

async function main() {
  console.log('🔍 DIAGNÓSTICO DO BANCO DE DADOS');
  console.log('='.repeat(60));
  console.log('');

  // 1. Verificar conexão
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao banco de dados');
    console.log('💡 Verifique se o PostgreSQL está rodando');
    console.log('💡 Verifique as variáveis de ambiente no .env');
    process.exit(1);
  }

  // 2. Verificar schema
  const schemaOk = await checkSchema();
  if (!schemaOk) {
    console.log('❌ Schema incompleto ou não existe');
    console.log('💡 Execute: npx prisma migrate deploy');
    process.exit(1);
  }

  // 3. Verificar dados
  const counts = await checkTableCounts();
  displayTableCounts(counts);

  // 4. Gerar recomendações
  generateRecommendations(counts);

  console.log('✅ Diagnóstico concluído!');
  console.log('');
}

main()
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
