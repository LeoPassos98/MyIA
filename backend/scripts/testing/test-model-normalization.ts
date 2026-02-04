// backend/scripts/test-model-normalization.ts
// Script para testar normalização de model IDs com sufixos

/**
 * Normaliza model ID removendo sufixos de context window
 */
function normalizeModelId(modelId: string): string {
  return modelId.replace(/:(8k|20k|24k|128k|256k|300k|1000k|mm)$/i, '');
}

/**
 * Casos de teste para normalização
 */
const testCases = [
  // Amazon Nova Premier
  { input: 'amazon.nova-premier-v1:0:8k', expected: 'amazon.nova-premier-v1:0' },
  { input: 'amazon.nova-premier-v1:0:20k', expected: 'amazon.nova-premier-v1:0' },
  { input: 'amazon.nova-premier-v1:0:1000k', expected: 'amazon.nova-premier-v1:0' },
  { input: 'amazon.nova-premier-v1:0:mm', expected: 'amazon.nova-premier-v1:0' },
  { input: 'amazon.nova-premier-v1:0', expected: 'amazon.nova-premier-v1:0' },
  
  // Amazon Nova Lite
  { input: 'amazon.nova-lite-v1:0:24k', expected: 'amazon.nova-lite-v1:0' },
  { input: 'amazon.nova-lite-v1:0:300k', expected: 'amazon.nova-lite-v1:0' },
  { input: 'amazon.nova-lite-v1:0', expected: 'amazon.nova-lite-v1:0' },
  
  // Amazon Nova Micro
  { input: 'amazon.nova-micro-v1:0:24k', expected: 'amazon.nova-micro-v1:0' },
  { input: 'amazon.nova-micro-v1:0:128k', expected: 'amazon.nova-micro-v1:0' },
  { input: 'amazon.nova-micro-v1:0', expected: 'amazon.nova-micro-v1:0' },
  
  // Amazon Nova Pro
  { input: 'amazon.nova-pro-v1:0:24k', expected: 'amazon.nova-pro-v1:0' },
  { input: 'amazon.nova-pro-v1:0:300k', expected: 'amazon.nova-pro-v1:0' },
  { input: 'amazon.nova-pro-v1:0', expected: 'amazon.nova-pro-v1:0' },
  
  // Amazon Nova 2 (com "2")
  { input: 'amazon.nova-2-lite-v1:0:256k', expected: 'amazon.nova-2-lite-v1:0' },
  { input: 'amazon.nova-2-micro-v1:0', expected: 'amazon.nova-2-micro-v1:0' },
  { input: 'amazon.nova-2-pro-v1:0', expected: 'amazon.nova-2-pro-v1:0' },
  { input: 'amazon.nova-2-sonic-v1:0', expected: 'amazon.nova-2-sonic-v1:0' },
  
  // Modelos sem sufixo (não devem ser alterados)
  { input: 'amazon.titan-text-express-v1', expected: 'amazon.titan-text-express-v1' },
  { input: 'amazon.titan-text-lite-v1', expected: 'amazon.titan-text-lite-v1' },
  { input: 'amazon.titan-text-premier-v1:0', expected: 'amazon.titan-text-premier-v1:0' },
  
  // Edge cases
  { input: 'amazon.nova-premier-v1:0:8K', expected: 'amazon.nova-premier-v1:0' }, // Case insensitive
  { input: 'amazon.nova-premier-v1:0:MM', expected: 'amazon.nova-premier-v1:0' }, // Case insensitive
];

/**
 * Executa testes
 */
function runTests() {
  console.log('🧪 Testando normalização de model IDs...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = normalizeModelId(test.input);
    const success = result === test.expected;
    
    if (success) {
      passed++;
      console.log(`✅ ${test.input}`);
      console.log(`   → ${result}`);
    } else {
      failed++;
      console.log(`❌ ${test.input}`);
      console.log(`   Esperado: ${test.expected}`);
      console.log(`   Obtido:   ${result}`);
    }
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Resultados: ${passed} ✅ | ${failed} ❌`);
  console.log(`   Taxa de sucesso: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (failed > 0) {
    console.error('❌ Alguns testes falharam!');
    process.exit(1);
  } else {
    console.log('✅ Todos os testes passaram!');
    process.exit(0);
  }
}

// Executar testes
runTests();
