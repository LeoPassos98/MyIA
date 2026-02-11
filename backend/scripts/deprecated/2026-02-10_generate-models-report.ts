// backend/scripts/generate-models-report.ts
// Standards: docs/STANDARDS.md

import { ModelRegistry } from '../src/services/ai/registry/model-registry';
import '../src/services/ai/registry/models'; // Auto-register all models
import { prisma } from '../src/lib/prisma';

interface VendorModels {
  [vendor: string]: Array<{
    modelId: string;
    status: string;
    rating?: number;
    badge?: string;
  }>;
}

async function generateReport() {
  try {
    const registryModels = ModelRegistry.getAll();
    const certifications = await prisma.modelCertification.findMany();
    
    console.log('📊 RELATÓRIO DE MODELOS\n');
    console.log('═'.repeat(80));
    console.log(`Total no Registry: ${registryModels.length}`);
    console.log(`Total Certificados: ${certifications.length}`);
    console.log(`Com Rating: ${certifications.filter(c => c.rating).length}`);
    console.log(`Sem Rating: ${certifications.filter(c => !c.rating).length}`);
    console.log(`Não Testados: ${registryModels.length - certifications.length}`);
    console.log('═'.repeat(80));
    console.log('');
    
    // Modelos por vendor
    const byVendor: VendorModels = registryModels.reduce((acc: VendorModels, m) => {
      if (!acc[m.vendor]) acc[m.vendor] = [];
      
      const cert = certifications.find(c => c.modelId === m.modelId);
      acc[m.vendor].push({
        modelId: m.modelId,
        status: cert ? cert.status : '❌ Não testado',
        rating: cert?.rating ?? undefined,
        badge: cert?.badge ?? undefined,
      });
      
      return acc;
    }, {});
    
    console.log('📦 MODELOS POR VENDOR:\n');
    
    // Ordenar vendors alfabeticamente
    const sortedVendors = Object.keys(byVendor).sort();
    
    for (const vendor of sortedVendors) {
      const models = byVendor[vendor];
      const certified = models.filter(m => m.status === 'certified').length;
      const withRating = models.filter(m => m.rating).length;
      const failed = models.filter(m => m.status === 'failed').length;
      const notTested = models.filter(m => m.status === '❌ Não testado').length;
      
      console.log(`\n${vendor.toUpperCase()} (${models.length} modelos)`);
      console.log(`  ✅ Certificados: ${certified} | ⭐ Com Rating: ${withRating} | ❌ Falharam: ${failed} | 🔍 Não testados: ${notTested}`);
      console.log('  ' + '─'.repeat(76));
      
      models.forEach(m => {
        let statusIcon = '';
        let statusText = '';
        
        if (m.status === '❌ Não testado') {
          statusIcon = '🔍';
          statusText = 'Não testado';
        } else if (m.status === 'certified') {
          if (m.rating) {
            statusIcon = '⭐';
            statusText = `Rating: ${m.rating.toFixed(1)} ${m.badge || ''}`;
          } else {
            statusIcon = '✅';
            statusText = 'Certificado (sem rating)';
          }
        } else if (m.status === 'failed') {
          statusIcon = '❌';
          statusText = 'Falhou na certificação';
        } else {
          statusIcon = '⚠️';
          statusText = m.status;
        }
        
        console.log(`  ${statusIcon} ${m.modelId}`);
        console.log(`     └─ ${statusText}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📈 ESTATÍSTICAS POR VENDOR:\n');
    
    for (const vendor of sortedVendors) {
      const models = byVendor[vendor];
      const total = models.length;
      const certified = models.filter(m => m.status === 'certified').length;
      const withRating = models.filter(m => m.rating).length;
      const notTested = models.filter(m => m.status === '❌ Não testado').length;
      
      const certifiedPercent = ((certified / total) * 100).toFixed(1);
      const ratingPercent = ((withRating / total) * 100).toFixed(1);
      const notTestedPercent = ((notTested / total) * 100).toFixed(1);
      
      console.log(`${vendor.padEnd(15)} | Total: ${total.toString().padStart(2)} | Certificados: ${certifiedPercent.padStart(5)}% | Com Rating: ${ratingPercent.padStart(5)}% | Não testados: ${notTestedPercent.padStart(5)}%`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 RECOMENDAÇÕES:\n');
    
    // Identificar vendors com mais modelos não testados
    const vendorsNotTested = sortedVendors
      .map(vendor => ({
        vendor,
        notTested: byVendor[vendor].filter(m => m.status === '❌ Não testado').length,
        total: byVendor[vendor].length,
      }))
      .filter(v => v.notTested > 0)
      .sort((a, b) => b.notTested - a.notTested);
    
    console.log('1. Vendors com mais modelos não testados:');
    vendorsNotTested.slice(0, 5).forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.vendor}: ${v.notTested}/${v.total} modelos não testados`);
    });
    
    // Modelos certificados sem rating
    const certifiedNoRating = certifications.filter(c => c.status === 'certified' && !c.rating);
    if (certifiedNoRating.length > 0) {
      console.log(`\n2. Modelos certificados sem rating (${certifiedNoRating.length}):`);
      certifiedNoRating.forEach(c => {
        console.log(`   - ${c.modelId}`);
      });
    }
    
    // Modelos que falharam
    const failedModels = certifications.filter(c => c.status === 'failed');
    if (failedModels.length > 0) {
      console.log(`\n3. Modelos que falharam na certificação (${failedModels.length}):`);
      failedModels.forEach(c => {
        console.log(`   - ${c.modelId} (${c.errorCategory || 'sem categoria'})`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateReport().catch(console.error);
