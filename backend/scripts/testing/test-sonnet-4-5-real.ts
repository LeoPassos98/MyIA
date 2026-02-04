// backend/scripts/test-sonnet-4-5-real.ts
// Teste real do Claude Sonnet 4.5 com captura detalhada de erros

import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { AWSCredentialsService } from '../src/services/awsCredentialsService';
import { categorizeError } from '../src/services/ai/certification/error-categorizer';

const MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0';
const REGION = 'us-east-1';

async function testModel() {
  console.log('🧪 TESTE REAL: Claude Sonnet 4.5\n');
  console.log('═'.repeat(80));
  
  // Buscar credenciais
  const testUserId = '123';
  const credentials = await AWSCredentialsService.getCredentials(testUserId);
  
  if (!credentials) {
    console.error('❌ Credenciais AWS não encontradas para usuário de teste');
    console.log('\nPara executar este teste:');
    console.log('1. Faça login na aplicação com usuário de teste');
    console.log('2. Configure credenciais AWS nas configurações');
    console.log('3. Execute este script novamente');
    return;
  }
  
  console.log(`✅ Credenciais encontradas`);
  console.log(`   Região: ${credentials.region}`);
  console.log(`   Access Key: ${credentials.accessKey.substring(0, 8)}...\n`);
  
  const client = new BedrockRuntimeClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey
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
      console.error(`   Mensagem: ${error.message}`);
      
      if (error.$metadata) {
        console.error(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
        console.error(`   Request ID: ${error.$metadata.requestId}`);
      }
      
      if (error.Code) {
        console.error(`   AWS Error Code: ${error.Code}`);
      }
      
      // Categorizar erro
      const categorized = categorizeError(error.message);
      console.log(`\n📊 CATEGORIZAÇÃO:`);
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
      console.log(`\n🔍 Erro completo (JSON):`);
      console.log(JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.Code || error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
      }, null, 2));
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
