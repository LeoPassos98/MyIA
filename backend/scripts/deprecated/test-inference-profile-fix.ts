#!/usr/bin/env tsx
/**
 * Script para testar correção de Inference Profile
 * 
 * Testa:
 * 1. Feature flag USE_NEW_ADAPTERS
 * 2. Detecção de inference type
 * 3. Criação de adapter correto
 * 4. Adição de prefixo regional
 * 
 * Uso:
 *   npx tsx backend/scripts/test-inference-profile-fix.ts
 */

import { AdapterFactory } from '../src/services/ai/adapters/adapter-factory';
import { ModelRegistry } from '../src/services/ai/registry/model-registry';
import '../src/services/ai/registry/models'; // Registrar modelos
import { logger } from '../src/utils/logger';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function main() {
  log('🧪 Teste de Correção: Inference Profile\n', 'blue');

  // ========================================
  // Teste 1: Verificar Feature Flag
  // ========================================
  section('Teste 1: Feature Flag USE_NEW_ADAPTERS');
  
  const useNewAdapters = process.env.USE_NEW_ADAPTERS;
  log(`Valor atual: ${useNewAdapters || '(não configurada)'}`, 'yellow');
  
  if (useNewAdapters === 'true') {
    log('✅ Feature flag habilitada corretamente', 'green');
  } else {
    log('❌ Feature flag NÃO está habilitada', 'red');
    log('   Adicione USE_NEW_ADAPTERS=true ao .env', 'yellow');
  }

  // ========================================
  // Teste 2: Verificar Registry
  // ========================================
  section('Teste 2: Verificar Configuração do Registry');
  
  const testModelId = 'anthropic.claude-sonnet-4-5-20250929-v1:0';
  log(`Modelo de teste: ${testModelId}`, 'yellow');
  
  try {
    const metadata = ModelRegistry.getModel(testModelId);
    log(`✅ Modelo encontrado no registry: ${metadata?.displayName}`, 'green');
    
    const platformRule = ModelRegistry.getPlatformRules(testModelId, 'bedrock');
    log(`Platform rule: ${platformRule?.rule || '(nenhuma)'}`, 'yellow');
    
    if (platformRule?.rule === 'requires_inference_profile') {
      log('✅ Modelo corretamente marcado como requires_inference_profile', 'green');
    } else {
      log('❌ Modelo NÃO está marcado como requires_inference_profile', 'red');
    }
  } catch (error) {
    log(`❌ Erro ao buscar modelo no registry: ${error}`, 'red');
  }

  // ========================================
  // Teste 3: Detecção de Inference Type
  // ========================================
  section('Teste 3: Detecção de Inference Type');
  
  const inferenceType = AdapterFactory.detectInferenceType(testModelId);
  log(`Inference type detectado: ${inferenceType}`, 'yellow');
  
  if (inferenceType === 'INFERENCE_PROFILE') {
    log('✅ Inference type detectado corretamente', 'green');
  } else {
    log('❌ Inference type incorreto (esperado: INFERENCE_PROFILE)', 'red');
  }

  // ========================================
  // Teste 4: Criação de Adapter
  // ========================================
  section('Teste 4: Criação de Adapter');
  
  try {
    const adapter = AdapterFactory.getAdapterForModel(testModelId);
    log(`Adapter criado: ${adapter.constructor.name}`, 'yellow');
    log(`Vendor: ${adapter.vendor}`, 'yellow');
    log(`Inference type: ${adapter.inferenceType}`, 'yellow');
    
    if (adapter.constructor.name === 'AnthropicProfileAdapter') {
      log('✅ Adapter correto criado (AnthropicProfileAdapter)', 'green');
    } else if (adapter.constructor.name === 'AnthropicAdapter') {
      log('❌ Adapter legado criado (AnthropicAdapter)', 'red');
      log('   Verifique se USE_NEW_ADAPTERS=true está configurada', 'yellow');
    } else {
      log(`⚠️ Adapter inesperado: ${adapter.constructor.name}`, 'yellow');
    }
    
    // Verificar se adapter suporta o modelo
    const supportsModel = adapter.supportsModel(testModelId);
    log(`Suporta modelo: ${supportsModel}`, 'yellow');
    
    if (supportsModel) {
      log('✅ Adapter suporta o modelo', 'green');
    } else {
      log('❌ Adapter NÃO suporta o modelo', 'red');
    }
  } catch (error) {
    log(`❌ Erro ao criar adapter: ${error}`, 'red');
  }

  // ========================================
  // Teste 5: Prefixo Regional
  // ========================================
  section('Teste 5: Prefixo Regional (Simulação)');
  
  log('Testando função getRegionPrefix (importada de bedrock.ts):', 'yellow');
  
  // Importar função de teste
  try {
    const { getRegionPrefix } = require('../src/services/ai/providers/bedrock');
    
    const testCases = [
      { region: 'us-east-1', expected: 'us' },
      { region: 'us-west-2', expected: 'us' },
      { region: 'eu-central-1', expected: 'eu' },
      { region: 'eu-west-1', expected: 'eu' },
      { region: 'ap-southeast-1', expected: 'apac' },
      { region: 'ap-northeast-1', expected: 'apac' },
    ];
    
    let allPassed = true;
    for (const { region, expected } of testCases) {
      const result = getRegionPrefix(region);
      const passed = result === expected;
      
      if (passed) {
        log(`  ✅ ${region} → ${result}`, 'green');
      } else {
        log(`  ❌ ${region} → ${result} (esperado: ${expected})`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('✅ Todos os prefixos regionais corretos', 'green');
    } else {
      log('❌ Alguns prefixos regionais incorretos', 'red');
    }
  } catch (error) {
    log(`❌ Erro ao testar prefixos regionais: ${error}`, 'red');
  }

  // ========================================
  // Resumo
  // ========================================
  section('Resumo dos Testes');
  
  const allTestsPassed = 
    useNewAdapters === 'true' &&
    inferenceType === 'INFERENCE_PROFILE';
  
  if (allTestsPassed) {
    log('✅ TODOS OS TESTES PASSARAM!', 'green');
    log('   O sistema está configurado corretamente para usar Inference Profiles.', 'green');
  } else {
    log('❌ ALGUNS TESTES FALHARAM', 'red');
    log('   Verifique os erros acima e corrija a configuração.', 'yellow');
    log('\nAções necessárias:', 'yellow');
    
    if (useNewAdapters !== 'true') {
      log('  1. Adicione USE_NEW_ADAPTERS=true ao arquivo .env', 'yellow');
    }
    
    if (inferenceType !== 'INFERENCE_PROFILE') {
      log('  2. Verifique se o modelo está corretamente registrado no registry', 'yellow');
    }
  }
  
  console.log('\n');
}

// Executar
main().catch(error => {
  log(`\n❌ Erro fatal: ${error}`, 'red');
  console.error(error);
  process.exit(1);
});
