// backend/scripts/diagnose-aws-credentials.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// Script de diagnóstico para investigar problema de credenciais AWS

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

const TARGET_USER_ID = '5611b389-0cb8-480e-b134-63eb8ce43c3f';
const TARGET_EMAIL = '123@123.com';
const TARGET_ACCESS_KEY = 'AKIA2JLLJVA5H7W7QT5R';

async function diagnose() {
  logger.info('🔍 DIAGNÓSTICO DE CREDENCIAIS AWS\n');
  logger.info('=' .repeat(80));
  logger.info(`Target User ID: ${TARGET_USER_ID}`);
  logger.info(`Target Email: ${TARGET_EMAIL}`);
  logger.info(`Target Access Key: ${TARGET_ACCESS_KEY}`);
  logger.info('=' .repeat(80));
  logger.info('');

  try {
    // 1. Verificar se o usuário existe
    logger.info('📋 1. Verificando usuário...');
    const user = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID }
    });

    if (!user) {
      logger.info('❌ Usuário NÃO encontrado no banco!');
      logger.info('   Isso pode indicar que o userId está incorreto.\n');
    } else {
      logger.info('✅ Usuário encontrado:');
      logger.info(`   - ID: ${user.id}`);
      logger.info(`   - Email: ${user.email}`);
      logger.info(`   - Nome: ${user.name || 'N/A'}`);
      logger.info(`   - Criado em: ${user.createdAt}`);
      logger.info('');
    }

    // 2. Verificar UserSettings
    logger.info('📋 2. Verificando UserSettings...');
    const settings = await prisma.userSettings.findUnique({
      where: { userId: TARGET_USER_ID }
    });

    if (!settings) {
      logger.info('❌ UserSettings NÃO encontrado!');
      logger.info('   O usuário não tem registro de configurações.\n');
    } else {
      logger.info('✅ UserSettings encontrado:');
      logger.info(`   - ID: ${settings.id}`);
      logger.info(`   - AWS Access Key: ${settings.awsAccessKey ? '***EXISTE*** (criptografado)' : 'NULL'}`);
      logger.info(`   - AWS Secret Key: ${settings.awsSecretKey ? '***EXISTE*** (criptografado)' : 'NULL'}`);
      logger.info(`   - AWS Region: ${settings.awsRegion || 'NULL'}`);
      logger.info(`   - AWS Enabled Models: ${settings.awsEnabledModels.length} modelos`);
      
      if (settings.awsAccessKey) {
        logger.info('\n   ⚠️ PROBLEMA IDENTIFICADO:');
        logger.info('   O campo awsAccessKey está preenchido, mas pode conter:');
        logger.info('   a) Credenciais de uma tentativa anterior que falhou');
        logger.info('   b) Credenciais parciais (sem secretKey correspondente)');
        logger.info('   c) Credenciais inválidas que não foram limpas');
      }
      logger.info('');
    }

    // 3. Verificar ProviderCredentialValidation
    logger.info('📋 3. Verificando ProviderCredentialValidation...');
    const validation = await prisma.providerCredentialValidation.findUnique({
      where: {
        userId_provider: {
          userId: TARGET_USER_ID,
          provider: 'bedrock'
        }
      }
    });

    if (!validation) {
      logger.info('❌ ProviderCredentialValidation NÃO encontrado!');
      logger.info('   Nenhuma validação registrada para AWS Bedrock.\n');
    } else {
      logger.info('✅ ProviderCredentialValidation encontrado:');
      logger.info(`   - Status: ${validation.status}`);
      logger.info(`   - Última validação: ${validation.lastValidatedAt || 'Nunca'}`);
      logger.info(`   - Último erro: ${validation.lastError || 'Nenhum'}`);
      logger.info(`   - Error Code: ${validation.errorCode || 'N/A'}`);
      logger.info(`   - Latency: ${validation.latencyMs || 'N/A'}ms`);
      logger.info(`   - Modelos validados: ${validation.validatedModels.length}`);
      logger.info('');
    }

    // 4. Buscar TODOS os UserSettings com awsAccessKey preenchido
    logger.info('📋 4. Buscando TODOS os usuários com AWS configurado...');
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

    logger.info(`   Total de usuários com AWS configurado: ${allAWSUsers.length}`);
    if (allAWSUsers.length > 0) {
      logger.info('   Lista:');
      allAWSUsers.forEach((s, idx) => {
        logger.info(`   ${idx + 1}. User: ${s.user.email} | Region: ${s.awsRegion} | Models: ${s.awsEnabledModels.length}`);
      });
    }
    logger.info('');

    // 5. DIAGNÓSTICO FINAL
    logger.info('=' .repeat(80));
    logger.info('🎯 DIAGNÓSTICO FINAL\n');

    if (!user) {
      logger.info('❌ PROBLEMA: Usuário não existe no banco de dados');
      logger.info('   SOLUÇÃO: Verificar se o userId está correto');
    } else if (!settings) {
      logger.info('✅ SITUAÇÃO NORMAL: Usuário existe mas não tem configurações AWS');
      logger.info('   O formulário deveria estar limpo e pronto para cadastro');
    } else if (settings.awsAccessKey && !settings.awsSecretKey) {
      logger.info('❌ PROBLEMA: Credenciais PARCIAIS detectadas');
      logger.info('   - awsAccessKey: EXISTE');
      logger.info('   - awsSecretKey: NULL');
      logger.info('\n   CAUSA RAIZ:');
      logger.info('   O sistema detecta credenciais existentes baseado apenas no awsAccessKey,');
      logger.info('   mas o secretKey está ausente, causando o bloqueio incorreto.');
      logger.info('\n   SOLUÇÃO RECOMENDADA:');
      logger.info('   1. Limpar o registro de UserSettings para este usuário');
      logger.info('   2. Corrigir a lógica do frontend para verificar AMBOS os campos');
      logger.info('   3. Adicionar validação no backend para garantir consistência');
    } else if (settings.awsAccessKey && settings.awsSecretKey) {
      logger.info('⚠️ SITUAÇÃO AMBÍGUA: Credenciais COMPLETAS detectadas');
      logger.info('   - awsAccessKey: EXISTE');
      logger.info('   - awsSecretKey: EXISTE');
      
      if (validation?.status === 'valid') {
        logger.info('   - Status de validação: VALID');
        logger.info('\n   POSSÍVEL CAUSA:');
        logger.info('   As credenciais estão salvas e válidas, mas o usuário está tentando');
        logger.info('   cadastrar NOVAS credenciais. O sistema está bloqueando corretamente.');
        logger.info('\n   SOLUÇÃO:');
        logger.info('   O usuário deve clicar em "Alterar Key" para editar as credenciais.');
      } else {
        logger.info(`   - Status de validação: ${validation?.status || 'NÃO VALIDADO'}`);
        logger.info('\n   POSSÍVEL CAUSA:');
        logger.info('   Credenciais salvas mas nunca validadas ou validação falhou.');
        logger.info('\n   SOLUÇÃO:');
        logger.info('   1. Limpar as credenciais inválidas');
        logger.info('   2. Permitir que o usuário cadastre novas credenciais');
      }
    }

    logger.info('\n' + '=' .repeat(80));
    logger.info('\n💡 COMANDOS ÚTEIS:\n');
    logger.info('Para LIMPAR as credenciais deste usuário:');
    logger.info(`
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
    logger.error('❌ Erro durante diagnóstico', { error });
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
