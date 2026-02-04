// Script para verificar certificações falhadas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const models = [
    'anthropic.claude-3-7-sonnet-20250219-v1:0',
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-5-sonnet-20240620-v1:0'
  ];

  console.log('🔍 Buscando certificações falhadas...\n');

  for (const modelId of models) {
    const cert = await prisma.modelCertification.findUnique({
      where: { modelId },
      select: {
        modelId: true,
        status: true,
        lastError: true,
        errorCategory: true,
        errorSeverity: true,
        failureReasons: true,
        testsPassed: true,
        testsFailed: true,
        successRate: true,
        avgLatencyMs: true,
        lastTestedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (cert) {
      console.log(`\n📋 Modelo: ${cert.modelId}`);
      console.log(`   Status: ${cert.status}`);
      console.log(`   Último Erro: ${cert.lastError || 'N/A'}`);
      console.log(`   Categoria: ${cert.errorCategory || 'N/A'}`);
      console.log(`   Severidade: ${cert.errorSeverity || 'N/A'}`);
      console.log(`   Testes Passados: ${cert.testsPassed}`);
      console.log(`   Testes Falhados: ${cert.testsFailed}`);
      console.log(`   Taxa de Sucesso: ${cert.successRate}%`);
      console.log(`   Latência Média: ${cert.avgLatencyMs || 'N/A'}ms`);
      console.log(`   Último Teste: ${cert.lastTestedAt}`);
      console.log(`   Criado em: ${cert.createdAt}`);
      console.log(`   Atualizado em: ${cert.updatedAt}`);
      
      if (cert.failureReasons) {
        console.log(`   Razões de Falha:`);
        const reasons = JSON.parse(JSON.stringify(cert.failureReasons));
        if (Array.isArray(reasons)) {
          reasons.forEach((reason: any, index: number) => {
            console.log(`      ${index + 1}. ${JSON.stringify(reason, null, 2)}`);
          });
        } else {
          console.log(`      ${JSON.stringify(reasons, null, 2)}`);
        }
      }
    } else {
      console.log(`\n❌ Nenhuma certificação encontrada para: ${modelId}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
