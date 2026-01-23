// backend/scripts/diagnose-aws-credentials.ts
// Script de diagnóstico para investigar problema de credenciais AWS

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_USER_ID = '5611b389-0cb8-480e-b134-63eb8ce43c3f';
const TARGET_EMAIL = '123@123.com';
const TARGET_ACCESS_KEY = 'AKIA2JLLJVA5H7W7QT5R';

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE CREDENCIAIS AWS\n');
  console.log('=' .repeat(80));
  console.log(`Target User ID: ${TARGET_USER_ID}`);
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`Target Access Key: ${TARGET_ACCESS_KEY}`);
  console.log('=' .repeat(80));
  console.log('');

  try {
    // 1. Verificar se o usuário existe
    console.log('📋 1. Verificando usuário...');
    const user = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID }
    });

    if (!user) {
      console.log('❌ Usuário NÃO encontrado no banco!');
      console.log('   Isso pode indicar que o userId está incorreto.\n');
    } else {
      console.log('✅ Usuário encontrado:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nome: ${user.name || 'N/A'}`);
      console.log(`   - Criado em: ${user.createdAt}`);
      console.log('');
    }

    // 2. Verificar UserSettings
    console.log('📋 2. Verificando UserSettings...');
    const settings = await prisma.userSettings.findUnique({
      where: { userId: TARGET_USER_ID }
    });

    if (!settings) {
      console.log('❌ UserSettings NÃO encontrado!');
      console.log('   O usuário não tem registro de configurações.\n');
    } else {
      console.log('✅ UserSettings encontrado:');
      console.log(`   - ID: ${settings.id}`);
      console.log(`   - AWS Access Key: ${settings.awsAccessKey ? '***EXISTE*** (criptografado)' : 'NULL'}`);
      console.log(`   - AWS Secret Key: ${settings.awsSecretKey ? '***EXISTE*** (criptografado)' : 'NULL'}`);
      console.log(`   - AWS Region: ${settings.awsRegion || 'NULL'}`);
      console.log(`   - AWS Enabled Models: ${settings.awsEnabledModels.length} modelos`);
      
      if (settings.awsAccessKey) {
        console.log('\n   ⚠️ PROBLEMA IDENTIFICADO:');
        console.log('   O campo awsAccessKey está preenchido, mas pode conter:');
        console.log('   a) Credenciais de uma tentativa anterior que falhou');
        console.log('   b) Credenciais parciais (sem secretKey correspondente)');
        console.log('   c) Credenciais inválidas que não foram limpas');
      }
      console.log('');
    }

    // 3. Verificar ProviderCredentialValidation
    console.log('📋 3. Verificando ProviderCredentialValidation...');
    const validation = await prisma.providerCredentialValidation.findUnique({
      where: {
        userId_provider: {
          userId: TARGET_USER_ID,
          provider: 'bedrock'
        }
      }
    });

    if (!validation) {
      console.log('❌ ProviderCredentialValidation NÃO encontrado!');
      console.log('   Nenhuma validação registrada para AWS Bedrock.\n');
    } else {
      console.log('✅ ProviderCredentialValidation encontrado:');
      console.log(`   - Status: ${validation.status}`);
      console.log(`   - Última validação: ${validation.lastValidatedAt || 'Nunca'}`);
      console.log(`   - Último erro: ${validation.lastError || 'Nenhum'}`);
      console.log(`   - Error Code: ${validation.errorCode || 'N/A'}`);
      console.log(`   - Latency: ${validation.latencyMs || 'N/A'}ms`);
      console.log(`   - Modelos validados: ${validation.validatedModels.length}`);
      console.log('');
    }

    // 4. Buscar TODOS os UserSettings com awsAccessKey preenchido
    console.log('📋 4. Buscando TODOS os usuários com AWS configurado...');
    const allAWSUsers = await prisma.userSettings.findMany({
      where: {
        awsAccessKey: { not: null }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`   Total de usuários com AWS configurado: ${allAWSUsers.length}`);
    if (allAWSUsers.length > 0) {
      console.log('   Lista:');
      allAWSUsers.forEach((s, idx) => {
        console.log(`   ${idx + 1}. User: ${s.user.email} | Region: ${s.awsRegion} | Models: ${s.awsEnabledModels.length}`);
      });
    }
    console.log('');

    // 5. DIAGNÓSTICO FINAL
    console.log('=' .repeat(80));
    console.log('🎯 DIAGNÓSTICO FINAL\n');

    if (!user) {
      console.log('❌ PROBLEMA: Usuário não existe no banco de dados');
      console.log('   SOLUÇÃO: Verificar se o userId está correto');
    } else if (!settings) {
      console.log('✅ SITUAÇÃO NORMAL: Usuário existe mas não tem configurações AWS');
      console.log('   O formulário deveria estar limpo e pronto para cadastro');
    } else if (settings.awsAccessKey && !settings.awsSecretKey) {
      console.log('❌ PROBLEMA: Credenciais PARCIAIS detectadas');
      console.log('   - awsAccessKey: EXISTE');
      console.log('   - awsSecretKey: NULL');
      console.log('\n   CAUSA RAIZ:');
      console.log('   O sistema detecta credenciais existentes baseado apenas no awsAccessKey,');
      console.log('   mas o secretKey está ausente, causando o bloqueio incorreto.');
      console.log('\n   SOLUÇÃO RECOMENDADA:');
      console.log('   1. Limpar o registro de UserSettings para este usuário');
      console.log('   2. Corrigir a lógica do frontend para verificar AMBOS os campos');
      console.log('   3. Adicionar validação no backend para garantir consistência');
    } else if (settings.awsAccessKey && settings.awsSecretKey) {
      console.log('⚠️ SITUAÇÃO AMBÍGUA: Credenciais COMPLETAS detectadas');
      console.log('   - awsAccessKey: EXISTE');
      console.log('   - awsSecretKey: EXISTE');
      
      if (validation?.status === 'valid') {
        console.log('   - Status de validação: VALID');
        console.log('\n   POSSÍVEL CAUSA:');
        console.log('   As credenciais estão salvas e válidas, mas o usuário está tentando');
        console.log('   cadastrar NOVAS credenciais. O sistema está bloqueando corretamente.');
        console.log('\n   SOLUÇÃO:');
        console.log('   O usuário deve clicar em "Alterar Key" para editar as credenciais.');
      } else {
        console.log(`   - Status de validação: ${validation?.status || 'NÃO VALIDADO'}`);
        console.log('\n   POSSÍVEL CAUSA:');
        console.log('   Credenciais salvas mas nunca validadas ou validação falhou.');
        console.log('\n   SOLUÇÃO:');
        console.log('   1. Limpar as credenciais inválidas');
        console.log('   2. Permitir que o usuário cadastre novas credenciais');
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n💡 COMANDOS ÚTEIS:\n');
    console.log('Para LIMPAR as credenciais deste usuário:');
    console.log(`
UPDATE user_settings 
SET "awsAccessKey" = NULL, 
    "awsSecretKey" = NULL, 
    "awsRegion" = 'us-east-1',
    "awsEnabledModels" = '{}'
WHERE "userId" = '${TARGET_USER_ID}';

DELETE FROM provider_credential_validations 
WHERE "userId" = '${TARGET_USER_ID}' AND provider = 'bedrock';
    `);

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
