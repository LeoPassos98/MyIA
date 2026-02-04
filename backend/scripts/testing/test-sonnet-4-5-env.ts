// backend/scripts/test-sonnet-4-5-env.ts
// Teste real do Claude Sonnet 4.5 usando variáveis de ambiente AWS

import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { categorizeError } from '../src/services/ai/certification/error-categorizer';
import * as dotenv from 'dotenv';

// Carregar .env
dotenv.config();

const MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0';

async function testModel() {
  console.log('🧪 TESTE REAL: Claude Sonnet 4.5\n');
  console.log('═'.repeat(80));
  
  // Verificar variáveis de ambiente
  let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  let region = process.env.AWS_REGION || process.env.AWS_BEDROCK_REGION || 'us-east-1';
  
  // Se não encontrou, tentar formato AWS_BEDROCK_CREDENTIALS
  if (!accessKeyId || !secretAccessKey) {
    const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
    if (credentials && credentials.includes(':')) {
      [accessKeyId, secretAccessKey] = credentials.split(':');
      console.log('✅ Usando credenciais de AWS_BEDROCK_CREDENTIALS');
    }
  }
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Credenciais AWS não encontradas nas variáveis de ambiente');
    console.log('\nPara executar este teste, configure no .env:');
    console.log('  AWS_BEDROCK_CREDENTIALS=ACCESS_KEY:SECRET_KEY');
    console.log('  AWS_BEDROCK_REGION=us-east-1');
    console.log('\nOu use variáveis de ambiente padrão:');
    console.log('  export AWS_ACCESS_KEY_ID="sua-access-key"');
    console.log('  export AWS_SECRET_ACCESS_KEY="sua-secret-key"');
    return;
  }
  
  console.log(`✅ Credenciais encontradas`);
  console.log(`   Região: ${region}`);
  console.log(`   Access Key: ${accessKeyId.substring(0, 8)}...\n`);
  
  const client = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
  
  // Testar 3 variações do modelId
  const variations = [
    { name: 'Direct Model ID', id: MODEL_ID },
    { name: 'Inference Profile (us)', id: `us.${MODEL_ID}` },
    { name: 'Inference Profile (eu)', id: `eu.${MODEL_ID}` },
  ];
  
  for (const variation of variations) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🔍 Testando: ${variation.name}`);
    console.log(`   Model ID: ${variation.id}`);
    console.log(`${'─'.repeat(80)}\n`);
    
    try {
      const body = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Say "test successful" if you can read this.' }
        ],
        temperature: 0.7
      };
      
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: variation.id,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body)
      });
      
      console.log('📤 Enviando requisição...');
      const response = await client.send(command);
      
      if (!response.body) {
        console.log('⚠️  Resposta sem body');
        continue;
      }
      
      console.log('✅ Resposta recebida! Processando stream...\n');
      
      let hasContent = false;
      let fullResponse = '';
      
      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          
          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            hasContent = true;
            fullResponse += chunk.delta.text;
            process.stdout.write(chunk.delta.text);
          } else if (chunk.type === 'message_stop') {
            console.log('\n\n✅ Stream concluído com sucesso!');
            break;
          } else if (chunk.type === 'error' || chunk.error) {
            console.error(`\n❌ Erro no chunk: ${chunk.error?.message || chunk.message}`);
            break;
          }
        }
      }
      
      if (hasContent) {
        console.log(`\n\n✅ SUCESSO! Modelo ${variation.name} está funcionando!`);
        console.log(`   Resposta completa: "${fullResponse}"`);
        return; // Sucesso, não precisa testar outras variações
      } else {
        console.log('\n⚠️  Nenhum conteúdo recebido');
      }
      
    } catch (error: any) {
      console.error(`\n❌ ERRO CAPTURADO:\n`);
      console.error(`   Tipo: ${error.constructor.name}`);
      console.error(`   Nome: ${error.name}`);
      console.error(`   Mensagem: ${error.message}`);
      
      if (error.$metadata) {
        console.error(`\n📊 Metadata AWS:`);
        console.error(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
        console.error(`   Request ID: ${error.$metadata.requestId}`);
        console.error(`   Attempts: ${error.$metadata.attempts}`);
        console.error(`   Total Retry Delay: ${error.$metadata.totalRetryDelay}ms`);
      }
      
      if (error.Code || error.code) {
        console.error(`\n🔴 AWS Error Code: ${error.Code || error.code}`);
      }
      
      if (error.$fault) {
        console.error(`   Fault: ${error.$fault}`);
      }
      
      if (error.$service) {
        console.error(`   Service: ${error.$service}`);
      }
      
      // Categorizar erro
      const categorized = categorizeError(error.message);
      console.log(`\n📊 CATEGORIZAÇÃO DO ERRO:`);
      console.log(`   Categoria: ${categorized.category}`);
      console.log(`   Severidade: ${categorized.severity}`);
      console.log(`   Temporário: ${categorized.isTemporary}`);
      console.log(`   Mensagem: ${categorized.message}`);
      
      // Verificar se é erro de provisionamento
      if (categorized.category === 'PROVISIONING_REQUIRED') {
        console.log(`\n⚠️  CONFIRMADO: Erro de provisionamento detectado!`);
        console.log(`\n   Ações sugeridas:`);
        categorized.suggestedActions.forEach((action, i) => {
          console.log(`   ${i + 1}. ${action}`);
        });
      }
      
      // Log completo do erro para debug
      console.log(`\n🔍 ERRO COMPLETO (JSON):`);
      console.log(JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.Code || error.code,
        fault: error.$fault,
        service: error.$service,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        attempts: error.$metadata?.attempts,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      }, null, 2));
      
      // Stack trace completo
      console.log(`\n📚 Stack Trace:`);
      console.log(error.stack);
    }
  }
  
  console.log(`\n${'═'.repeat(80)}`);
  console.log('❌ Todas as variações falharam');
  console.log('═'.repeat(80));
}

testModel().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
