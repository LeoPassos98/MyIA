// backend/test-bedrock-direct.js
const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const ACCESS_KEY = 'AKIA2JLLJVA5ILP43A7D';
const SECRET_KEY = '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';
const REGION = 'us-east-1';

async function test() {
  console.log('🧪 Teste Direto AWS Bedrock');
  console.log('============================');
  console.log('Access Key:', ACCESS_KEY.substring(0, 10) + '...');
  console.log('Secret Key:', SECRET_KEY.substring(0, 10) + '...');
  console.log('Região:', REGION);
  console.log('');

  const client = new BedrockRuntimeClient({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  });

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Olá!' }],
  };

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  try {
    console.log('📡 Enviando requisição...');
    const response = await client.send(command);
    
    console.log('✅ Resposta recebida!');
    console.log('');
    
    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          process.stdout.write(chunk.delta.text);
        }
      }
    }
    console.log('\n\n✅ Teste bem-sucedido!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código:', error.name);
  }
}

test();
