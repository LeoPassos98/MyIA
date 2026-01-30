// backend/scripts/diagnose-sonnet-4-5.ts
// Script para diagnosticar erro PROVISIONING_REQUIRED no Claude Sonnet 4.5

import { BedrockProvider } from '../src/services/ai/providers/bedrock';
import { ModelRegistry } from '../src/services/ai/registry/model-registry';
import { AWSCredentialsService } from '../src/services/awsCredentialsService';
import { categorizeError } from '../src/services/ai/certification/error-categorizer';
import logger from '../src/utils/logger';

// Importar modelos para registrar
import '../src/services/ai/registry/models';

const MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0';
const REGION = 'us-east-1';

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO: Claude Sonnet 4.5 - PROVISIONING_REQUIRED Error\n');
  console.log('═'.repeat(80));
  
  // 1. Verificar registro do modelo
  console.log('\n1️⃣ VERIFICANDO REGISTRO DO MODELO');
  console.log('─'.repeat(80));
  
  const modelMetadata = ModelRegistry.getModel(MODEL_ID);
  if (!modelMetadata) {
    console.error(`❌ Modelo ${MODEL_ID} NÃO está registrado no ModelRegistry!`);
    console.log('\nModelos Anthropic registrados:');
    const anthropicModels = ModelRegistry.getModelsByVendor('anthropic');
    anthropicModels.forEach(m => console.log(`  - ${m.modelId}`));
    return;
  }
  
  console.log(`✅ Modelo registrado: ${modelMetadata.displayName}`);
  console.log(`   Vendor: ${modelMetadata.vendor}`);
  console.log(`   Adapter: ${modelMetadata.adapterClass}`);
  console.log(`   Platforms: ${modelMetadata.supportedPlatforms.join(', ')}`);
  
  // 2. Verificar regras de plataforma
  console.log('\n2️⃣ VERIFICANDO REGRAS DE PLATAFORMA');
  console.log('─'.repeat(80));
  
  const platformRule = ModelRegistry.getPlatformRules(MODEL_ID, 'bedrock');
  if (platformRule) {
    console.log(`✅ Platform Rule encontrada: ${platformRule.rule}`);
    console.log(`   Config:`, JSON.stringify(platformRule.config, null, 2));
  } else {
    console.log('⚠️  Nenhuma platform rule específica (invocação direta)');
  }
  
  // 3. Testar normalização do modelId
  console.log('\n3️⃣ TESTANDO NORMALIZAÇÃO DO MODEL ID');
  console.log('─'.repeat(80));
  
  const BedrockProviderClass = BedrockProvider as any;
  
  // Simular normalização
  function normalizeModelId(modelId: string): string {
    return modelId.replace(/:(8k|20k|24k|128k|256k|300k|1000k|mm)$/i, '');
  }
  
  function getInferenceProfileId(modelId: string, region: string): string {
    const baseModelId = normalizeModelId(modelId);
    
    if (baseModelId.startsWith('us.') || baseModelId.startsWith('eu.')) {
      return baseModelId;
    }
    
    const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
    
    if (platformRule?.rule === 'requires_inference_profile') {
      const regionPrefix = region.split('-')[0];
      const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
      return inferenceProfileId;
    }
    
    return baseModelId;
  }
  
  const normalizedId = normalizeModelId(MODEL_ID);
  const inferenceProfileId = getInferenceProfileId(MODEL_ID, REGION);
  
  console.log(`   Original:           ${MODEL_ID}`);
  console.log(`   Normalizado:        ${normalizedId}`);
  console.log(`   Inference Profile:  ${inferenceProfileId}`);
  
  // 4. Verificar variações que serão testadas
  console.log('\n4️⃣ VARIAÇÕES QUE SERÃO TESTADAS (Auto-Test)');
  console.log('─'.repeat(80));
  
  const modelIdVariations = [
    normalizedId,
    inferenceProfileId,
    normalizedId.replace('nova-2-', 'nova-'),
  ];
  
  modelIdVariations.forEach((variation, index) => {
    console.log(`   ${index + 1}. ${variation}`);
  });
  
  // 5. Buscar credenciais AWS (se disponível)
  console.log('\n5️⃣ VERIFICANDO CREDENCIAIS AWS');
  console.log('─'.repeat(80));
  
  // Tentar buscar credenciais do usuário de teste (se existir)
  const testUserId = '123'; // ID do usuário de teste
  let credentials: any = null;
  
  try {
    credentials = await AWSCredentialsService.getCredentials(testUserId);
    if (credentials) {
      console.log(`✅ Credenciais encontradas para usuário ${testUserId}`);
      console.log(`   Região: ${credentials.region}`);
      console.log(`   Access Key: ${credentials.accessKey.substring(0, 8)}...`);
    } else {
      console.log(`⚠️  Nenhuma credencial encontrada para usuário ${testUserId}`);
      console.log('   Teste real não será executado');
    }
  } catch (error) {
    console.log(`⚠️  Erro ao buscar credenciais: ${error}`);
  }
  
  // 6. Testar invocação real (se credenciais disponíveis)
  if (credentials) {
    console.log('\n6️⃣ TESTANDO INVOCAÇÃO REAL');
    console.log('─'.repeat(80));
    
    const provider = new BedrockProvider(credentials.region);
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    
    console.log('Enviando mensagem de teste...\n');
    
    try {
      const messages = [
        { role: 'user', content: 'Say "test successful" if you can read this.' }
      ];
      
      const options = {
        modelId: MODEL_ID,
        apiKey,
        temperature: 0.7,
        maxTokens: 100,
      };
      
      let hasResponse = false;
      let errorMessage = '';
      
      for await (const chunk of provider.streamChat(messages, options)) {
        if (chunk.type === 'chunk' && chunk.content) {
          hasResponse = true;
          process.stdout.write(chunk.content);
        } else if (chunk.type === 'error') {
          errorMessage = chunk.error || 'Unknown error';
          console.error(`\n\n❌ ERRO: ${errorMessage}\n`);
          
          // Categorizar erro
          const categorized = categorizeError(errorMessage);
          console.log('📊 CATEGORIZAÇÃO DO ERRO:');
          console.log(`   Categoria: ${categorized.category}`);
          console.log(`   Severidade: ${categorized.severity}`);
          console.log(`   Temporário: ${categorized.isTemporary}`);
          console.log(`   Mensagem: ${categorized.message}`);
          console.log('\n   Ações Sugeridas:');
          categorized.suggestedActions.forEach((action, i) => {
            console.log(`   ${i + 1}. ${action}`);
          });
        } else if (chunk.type === 'debug') {
          console.log(`\n[DEBUG] ${chunk.log}`);
        }
      }
      
      if (hasResponse) {
        console.log('\n\n✅ SUCESSO! Modelo respondeu corretamente.');
      } else if (!errorMessage) {
        console.log('\n\n⚠️  Nenhuma resposta recebida (sem erro explícito)');
      }
      
    } catch (error: any) {
      console.error(`\n❌ EXCEÇÃO CAPTURADA: ${error.message}\n`);
      
      // Categorizar erro
      const categorized = categorizeError(error.message);
      console.log('📊 CATEGORIZAÇÃO DO ERRO:');
      console.log(`   Categoria: ${categorized.category}`);
      console.log(`   Severidade: ${categorized.severity}`);
      console.log(`   Temporário: ${categorized.isTemporary}`);
      console.log(`   Mensagem: ${categorized.message}`);
      console.log('\n   Ações Sugeridas:');
      categorized.suggestedActions.forEach((action, i) => {
        console.log(`   ${i + 1}. ${action}`);
      });
    }
  }
  
  // 7. Análise do categorizador de erros
  console.log('\n7️⃣ ANÁLISE DO CATEGORIZADOR DE ERROS');
  console.log('─'.repeat(80));
  
  const testErrors = [
    'on-demand throughput not available',
    'provisioned throughput required',
    'model access not enabled',
    'enable model access in console',
    'request model access',
    'provisioning required',
    'ResourceNotFoundException',
    'AccessDeniedException',
    'ValidationException',
  ];
  
  console.log('Testando padrões que acionam PROVISIONING_REQUIRED:\n');
  testErrors.forEach(errorMsg => {
    const categorized = categorizeError(errorMsg);
    const icon = categorized.category === 'PROVISIONING_REQUIRED' ? '✅' : '❌';
    console.log(`${icon} "${errorMsg}"`);
    console.log(`   → ${categorized.category} (${categorized.severity})`);
  });
  
  console.log('\n═'.repeat(80));
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO\n');
}

// Executar diagnóstico
diagnose().catch(error => {
  console.error('Erro fatal no diagnóstico:', error);
  process.exit(1);
});
