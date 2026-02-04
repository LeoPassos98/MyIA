#!/usr/bin/env ts-node
// backend/scripts/test-model-after-fix.ts
// Testa modelo após correção dos prefixos us.

import { BedrockProvider } from '../src/services/ai/providers/bedrock';
import dotenv from 'dotenv';

dotenv.config();

// Usar AWS_BEDROCK_CREDENTIALS do .env (formato: ACCESS_KEY:SECRET_KEY)
const AWS_BEDROCK_CREDENTIALS = process.env.AWS_BEDROCK_CREDENTIALS || '';
const [AWS_ACCESS_KEY, AWS_SECRET_KEY] = AWS_BEDROCK_CREDENTIALS.split(':');

async function testModel() {
  console.log('🧪 Testando modelo após correção dos prefixos us.\n');

  // Modelo a testar (sem prefixo us.)
  const modelId = 'anthropic.claude-sonnet-4-5-20250929-v1:0';
  
  console.log(`📋 Modelo: ${modelId}`);
  console.log(`✅ Modelo deve estar registrado sem prefixo us.`);
  
  // Testar invocação
  console.log('\n🚀 Testando invocação...\n');
  
  const provider = new BedrockProvider('us-east-1');
  const apiKey = `${AWS_ACCESS_KEY}:${AWS_SECRET_KEY}`;
  
  const messages = [
    { role: 'user', content: 'Responda apenas: OK' }
  ];
  
  const options = {
    modelId,
    apiKey,
    temperature: 0.7,
    maxTokens: 10,
    // topP removido - Claude Sonnet 4.5 não aceita temperature e topP juntos
  };
  
  try {
    let response = '';
    for await (const chunk of provider.streamChat(messages, options)) {
      if (chunk.type === 'chunk' && chunk.content) {
        response += chunk.content;
        process.stdout.write(chunk.content);
      } else if (chunk.type === 'error') {
        console.error(`\n❌ Erro: ${chunk.error}`);
        return;
      }
    }
    
    console.log('\n\n✅ Teste bem-sucedido!');
    console.log(`📝 Resposta completa: "${response.trim()}"`);
    
  } catch (error) {
    console.error('\n❌ Erro na invocação:', error);
  }
}

testModel().catch(console.error);
