import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function listAvailableModels() {
  console.log('🔍 Verificando modelos disponíveis no AWS Bedrock...\n');

  // Extrair credenciais do formato ACCESS_KEY:SECRET_KEY
  const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
  if (!credentials) {
    console.error('❌ AWS_BEDROCK_CREDENTIALS não encontrado no .env');
    return;
  }

  const [accessKeyId, secretAccessKey] = credentials.split(':');
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Formato inválido de AWS_BEDROCK_CREDENTIALS. Esperado: ACCESS_KEY:SECRET_KEY');
    return;
  }

  const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';
  console.log(`📍 Região: ${region}`);
  console.log(`🔑 Access Key: ${accessKeyId.substring(0, 8)}...`);
  console.log('');

  const client = new BedrockClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    if (!response.modelSummaries) {
      console.log('❌ Nenhum modelo encontrado');
      return;
    }

    // Agrupar por provider
    const byProvider: Record<string, any[]> = {};
    
    for (const model of response.modelSummaries) {
      const provider = model.providerName || 'Unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(model);
    }

    // Mostrar resultados
    console.log(`📊 Total de modelos disponíveis: ${response.modelSummaries.length}\n`);

    for (const [provider, models] of Object.entries(byProvider)) {
      console.log(`\n🏢 ${provider} (${models.length} modelos):`);
      console.log('─'.repeat(80));
      
      for (const model of models) {
        const status = model.modelLifecycle?.status || 'UNKNOWN';
        const emoji = status === 'ACTIVE' ? '✅' : '⚠️';
        
        console.log(`${emoji} ${model.modelId}`);
        console.log(`   Nome: ${model.modelName}`);
        console.log(`   Status: ${status}`);
        console.log(`   Inference Types: ${model.inferenceTypesSupported?.join(', ') || 'N/A'}`);
        console.log('');
      }
    }

    // Verificar modelos específicos do usuário
    console.log('\n🎯 VERIFICAÇÃO DE MODELOS ESPECÍFICOS:\n');
    
    const targetModels = [
      'anthropic.claude-sonnet-4-5-20250929-v1:0',
      'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      'anthropic.claude-haiku-4-5-20251001-v1:0',
      'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      'amazon.nova-premier-v1:0',
      'us.amazon.nova-premier-v1:0',
    ];

    for (const targetId of targetModels) {
      const found = response.modelSummaries.find(m => m.modelId === targetId);
      if (found) {
        console.log(`✅ ${targetId} - DISPONÍVEL`);
        console.log(`   Status: ${found.modelLifecycle?.status}`);
      } else {
        console.log(`❌ ${targetId} - NÃO ENCONTRADO`);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro ao listar modelos:', error.message);
    console.error('Detalhes:', error);
  }
}

listAvailableModels();
