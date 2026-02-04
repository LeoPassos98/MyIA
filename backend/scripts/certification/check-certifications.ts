// backend/scripts/check-certifications.ts
// Check model certifications in database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando certificações no banco...\n');

  const certifications = await prisma.modelCertification.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  if (certifications.length === 0) {
    console.log('❌ Nenhuma certificação encontrada no banco');
    return;
  }

  console.log(`📦 Total de certificações: ${certifications.length}\n`);

  certifications.forEach((cert) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 Modelo: ${cert.modelId}`);
    console.log(`   Vendor: ${cert.vendor}`);
    console.log(`   Status: ${cert.status}`);
    console.log(`   Taxa de sucesso: ${cert.successRate}%`);
    console.log(`   Testes passados: ${cert.testsPassed}`);
    console.log(`   Testes falhados: ${cert.testsFailed}`);
    console.log(`   Certificado em: ${cert.certifiedAt || 'não certificado'}`);
    console.log(`   Expira em: ${cert.expiresAt || 'N/A'}`);
    console.log(`   Última atualização: ${cert.updatedAt}`);
    if (cert.lastError) {
      console.log(`   ⚠️  Último erro: ${cert.lastError}`);
    }
    console.log();
  });

  // Verificar quais estão certificados e não expirados
  const now = new Date();
  const certified = certifications.filter(
    c => c.status === 'certified' && c.expiresAt && c.expiresAt > now
  );

  console.log(`✅ Modelos certificados e válidos: ${certified.length}`);
  certified.forEach(c => console.log(`   - ${c.modelId}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
