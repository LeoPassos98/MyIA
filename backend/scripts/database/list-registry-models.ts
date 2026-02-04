// backend/scripts/list-registry-models.ts
// Standards: docs/STANDARDS.md

import { ModelRegistry } from '../src/services/ai/registry/model-registry';
import '../src/services/ai/registry/models'; // Auto-register all models

interface VendorCount {
  [vendor: string]: number;
}

const models = ModelRegistry.getAll();
console.log('Total de modelos no registry:', models.length);
console.log('\nModelos por vendor:');

const byVendor: VendorCount = models.reduce((acc: VendorCount, m) => {
  acc[m.vendor] = (acc[m.vendor] || 0) + 1;
  return acc;
}, {});

Object.entries(byVendor).forEach(([vendor, count]) => {
  console.log(`  ${vendor}: ${count} modelos`);
});

console.log('\nLista completa de modelos:');
models.forEach(m => {
  console.log(`  - ${m.modelId} (${m.vendor})`);
});
