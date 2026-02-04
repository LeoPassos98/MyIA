// backend/scripts/test-adapter-factory-feature-flag.ts
// Standards: docs/STANDARDS.md

/**
 * Script para validar AdapterFactory com feature flag USE_NEW_ADAPTERS
 * 
 * Testa:
 * 1. Detecção de inference type
 * 2. Criação de adapters com USE_NEW_ADAPTERS=false (legacy)
 * 3. Criação de adapters com USE_NEW_ADAPTERS=true (novos)
 * 4. Integração com getAdapterForModel
 */

import { AdapterFactory } from '../src/services/ai/adapters/adapter-factory';

console.log('='.repeat(80));
console.log('TESTE: AdapterFactory com Feature Flag');
console.log('='.repeat(80));

// Teste 1: Detecção de Inference Type
console.log('\n📋 Teste 1: Detecção de Inference Type');
console.log('-'.repeat(80));

const testModels = [
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'us.amazon.nova-pro-v1:0',
  'amazon.nova-pro-v1:0',
  'arn:aws:bedrock:us-east-1:123456789012:provisioned-model/abc',
];

testModels.forEach(modelId => {
  const inferenceType = AdapterFactory.detectInferenceType(modelId);
  const vendor = AdapterFactory.detectVendor(modelId);
  console.log(`  ${modelId}`);
  console.log(`    → Vendor: ${vendor}`);
  console.log(`    → Inference Type: ${inferenceType}`);
});

// Teste 2: Legacy Mode (USE_NEW_ADAPTERS=false)
console.log('\n📋 Teste 2: Legacy Mode (USE_NEW_ADAPTERS=false)');
console.log('-'.repeat(80));

delete process.env.USE_NEW_ADAPTERS;
AdapterFactory.clearCache();

try {
  const adapter1 = AdapterFactory.createAdapter('anthropic', 'INFERENCE_PROFILE');
  console.log(`  ✅ Anthropic INFERENCE_PROFILE: ${adapter1.constructor.name} (inferenceType: ${adapter1.inferenceType})`);
} catch (error) {
  console.log(`  ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const adapter2 = AdapterFactory.createAdapter('amazon', 'ON_DEMAND');
  console.log(`  ✅ Amazon ON_DEMAND: ${adapter2.constructor.name} (inferenceType: ${adapter2.inferenceType})`);
} catch (error) {
  console.log(`  ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
}

// Teste 3: New Mode (USE_NEW_ADAPTERS=true)
console.log('\n📋 Teste 3: New Mode (USE_NEW_ADAPTERS=true)');
console.log('-'.repeat(80));

process.env.USE_NEW_ADAPTERS = 'true';
AdapterFactory.clearCache();

try {
  const adapter1 = AdapterFactory.createAdapter('anthropic', 'INFERENCE_PROFILE');
  console.log(`  ✅ Anthropic INFERENCE_PROFILE: ${adapter1.constructor.name} (inferenceType: ${adapter1.inferenceType})`);
} catch (error) {
  console.log(`  ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const adapter2 = AdapterFactory.createAdapter('amazon', 'INFERENCE_PROFILE');
  console.log(`  ✅ Amazon INFERENCE_PROFILE: ${adapter2.constructor.name} (inferenceType: ${adapter2.inferenceType})`);
} catch (error) {
  console.log(`  ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const adapter3 = AdapterFactory.createAdapter('anthropic', 'ON_DEMAND');
  console.log(`  ✅ Anthropic ON_DEMAND: ${adapter3.constructor.name} (inferenceType: ${adapter3.inferenceType})`);
} catch (error) {
  console.log(`  ❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
}

// Teste 4: getAdapterForModel com USE_NEW_ADAPTERS=true
console.log('\n📋 Teste 4: getAdapterForModel com USE_NEW_ADAPTERS=true');
console.log('-'.repeat(80));

const testModelsForAdapter = [
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'us.amazon.nova-pro-v1:0',
  'amazon.nova-pro-v1:0',
];

testModelsForAdapter.forEach(modelId => {
  try {
    const adapter = AdapterFactory.getAdapterForModel(modelId);
    console.log(`  ✅ ${modelId}`);
    console.log(`     → Adapter: ${adapter.constructor.name}`);
    console.log(`     → Vendor: ${adapter.vendor}`);
    console.log(`     → Inference Type: ${adapter.inferenceType}`);
  } catch (error) {
    console.log(`  ❌ ${modelId}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

// Teste 5: Verificar suporte de modelos
console.log('\n📋 Teste 5: Verificar suporte de modelos');
console.log('-'.repeat(80));

const modelsToCheck = [
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'us.amazon.nova-pro-v1:0',
  'unknown.model-v1:0',
];

modelsToCheck.forEach(modelId => {
  const isSupported = AdapterFactory.isModelSupported(modelId);
  console.log(`  ${isSupported ? '✅' : '❌'} ${modelId}: ${isSupported ? 'Suportado' : 'Não suportado'}`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Validação concluída!');
console.log('='.repeat(80));
