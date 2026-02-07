// backend/test-amazon-models.ts
// Script temporário para validar registro de modelos Amazon

import { ModelRegistry } from './src/services/ai/registry/index.js';

// Importar todos os modelos (auto-registro)
import './src/services/ai/registry/models/index.js';

const amazonModels = ModelRegistry.getModelsByVendor('amazon');

console.log('='.repeat(60));
console.log('VALIDAÇÃO DE MODELOS AMAZON');
console.log('='.repeat(60));
console.log(`Total de modelos Amazon registrados: ${amazonModels.length}`);
console.log('');

// Agrupar por família
const byFamily: Record<string, string[]> = {};
amazonModels.forEach(model => {
  const family = model.name.split('-')[0]; // Pega primeira parte do nome
  if (!byFamily[family]) byFamily[family] = [];
  byFamily[family].push(model.name);
});

console.log('Modelos por família:');
Object.entries(byFamily).forEach(([family, models]) => {
  console.log(`  ${family}: ${models.length} modelos`);
  models.forEach(name => console.log(`    - ${name}`));
});

console.log('');
console.log('='.repeat(60));
console.log(`Status: ${amazonModels.length === 24 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Esperado: 24 modelos`);
console.log(`Encontrado: ${amazonModels.length} modelos`);
console.log('='.repeat(60));

process.exit(amazonModels.length === 24 ? 0 : 1);
