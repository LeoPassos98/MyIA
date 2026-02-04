// backend/scripts/check-sonnet-certifications.ts
import { prisma } from '../src/lib/prisma';

async function checkCertifications() {
  const certs = await prisma.modelCertification.findMany({
    where: {
      modelId: {
        contains: 'claude-sonnet-4-5-20250929'
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\nEncontradas ${certs.length} certificações para Claude Sonnet 4.5:\n`);

  certs.forEach((cert, index) => {
    console.log(`\n[${index + 1}] Certificação ID: ${cert.id}`);
    console.log(`    Model ID: ${cert.modelId}`);
    console.log(`    Status: ${cert.status}`);
    console.log(`    Error Category: ${cert.errorCategory || 'N/A'}`);
    console.log(`    Error Severity: ${cert.errorSeverity || 'N/A'}`);
    console.log(`    Created At: ${cert.createdAt}`);
    if (cert.lastError) {
      console.log(`    Error Message: ${cert.lastError.substring(0, 300)}`);
    }
    console.log('    ─'.repeat(40));
  });

  await prisma.$disconnect();
}

checkCertifications().catch(console.error);
