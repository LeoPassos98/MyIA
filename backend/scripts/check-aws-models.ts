// backend/scripts/check-aws-models.ts
// Script para verificar modelos AWS salvos no banco

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAWSModels() {
  try {
    console.log('🔍 Verificando configurações AWS...\n');

    // 1. Buscar user settings
    const settings = await prisma.userSettings.findMany({
      select: {
        userId: true,
        awsRegion: true,
        awsEnabledModels: true,
      }
    });

    console.log(`📊 Total de usuários com configurações: ${settings.length}\n`);

    for (const setting of settings) {
      console.log(`👤 Usuário: ${setting.userId}`);
      console.log(`   Região: ${setting.awsRegion || 'não configurada'}`);
      console.log(`   Modelos habilitados: ${setting.awsEnabledModels?.length || 0}`);
      if (setting.awsEnabledModels) {
        console.log(`   Modelos:`);
        setting.awsEnabledModels.forEach((model: string) => {
          console.log(`     - ${model}`);
        });
      }
      console.log('');
    }

    // 2. Buscar validações AWS
    const validations = await prisma.providerCredentialValidation.findMany({
      where: { provider: 'bedrock' },
      select: {
        userId: true,
        status: true,
        lastValidatedAt: true,
      }
    });

    console.log(`\n🔐 Validações AWS Bedrock: ${validations.length}\n`);
    for (const validation of validations) {
      console.log(`👤 Usuário: ${validation.userId}`);
      console.log(`   Status: ${validation.status}`);
      console.log(`   Última validação: ${validation.lastValidatedAt}`);
      console.log('');
    }

    // 3. Buscar certificações
    const certifications = await prisma.modelCertification.findMany({
      select: {
        modelId: true,
        vendor: true,
        status: true,
        certifiedAt: true,
        successRate: true,
      }
    });

    console.log(`\n✅ Certificações de modelos: ${certifications.length}\n`);
    for (const cert of certifications) {
      console.log(`📦 Modelo: ${cert.modelId}`);
      console.log(`   Vendor: ${cert.vendor}`);
      console.log(`   Status: ${cert.status}`);
      console.log(`   Taxa de sucesso: ${cert.successRate}%`);
      console.log(`   Certificado em: ${cert.certifiedAt || 'não certificado'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAWSModels();
