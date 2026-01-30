import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

interface ChatModelAnalysis {
  provider: string;
  modelId: string;
  modelName: string;
  supportsInferenceProfile: boolean;
  supportsOnDemand: boolean;
  requiresProfile: boolean;
  testResult: string;
  inferenceTypes: string[];
  modalities: string[];
  releaseDate?: string;
  isObsolete: boolean;
  isChatModel: boolean;
}

// Modelos conhecidos como obsoletos ou embeddings
const OBSOLETE_PATTERNS = [
  'v1:0', 'v1.0', 'v1.2', 'v1.3', // Versões antigas
  'embed', 'embedding', // Modelos de embedding
  'titan-text-lite', 'titan-text-express', // Titan antigos
  'command-text', 'command-light', // Cohere antigos
  'j2-', // AI21 antigos
];

const CHAT_PATTERNS = [
  'claude', 'gpt', 'llama', 'mistral', 'command-r', 'nova', 
  'jamba', 'titan-text-premier', 'haiku', 'sonnet', 'opus'
];

function isChatModel(modelId: string, modelName: string, modalities: string[]): boolean {
  const id = modelId.toLowerCase();
  const name = modelName.toLowerCase();
  
  // Excluir embeddings explicitamente
  if (id.includes('embed') || name.includes('embed')) {
    return false;
  }
  
  // Verificar se é modelo de chat
  return CHAT_PATTERNS.some(pattern => id.includes(pattern) || name.includes(pattern)) &&
         modalities.includes('TEXT');
}

function isObsolete(modelId: string, modelName: string): boolean {
  const id = modelId.toLowerCase();
  const name = modelName.toLowerCase();
  
  return OBSOLETE_PATTERNS.some(pattern => id.includes(pattern) || name.includes(pattern));
}

async function analyzeChatModelsProfiles() {
  console.log('🔍 Analisando Modelos de Chat e Inference Profiles...\n');

  // Extrair credenciais
  const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
  if (!credentials) {
    console.error('❌ AWS_BEDROCK_CREDENTIALS não encontrado no .env');
    return;
  }

  const [accessKeyId, secretAccessKey] = credentials.split(':');
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Formato inválido de AWS_BEDROCK_CREDENTIALS');
    return;
  }

  const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';
  console.log(`📍 Região: ${region}\n`);

  const bedrockClient = new BedrockClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const runtimeClient = new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    // 1. Listar modelos disponíveis
    console.log('📥 Listando modelos disponíveis...\n');
    const command = new ListFoundationModelsCommand({});
    const response = await bedrockClient.send(command);

    if (!response.modelSummaries) {
      console.log('❌ Nenhum modelo encontrado');
      return;
    }

    // 2. Filtrar apenas modelos ACTIVE
    const activeModels = response.modelSummaries.filter(
      m => m.modelLifecycle?.status === 'ACTIVE'
    );

    console.log(`📊 Total de modelos ACTIVE: ${activeModels.length}\n`);

    // 3. Analisar cada modelo
    const results: ChatModelAnalysis[] = [];
    
    for (const model of activeModels) {
      const modelId = model.modelId!;
      const modelName = model.modelName || 'N/A';
      const inferenceTypes = model.inferenceTypesSupported || [];
      const modalities = model.outputModalities || [];
      
      const supportsInferenceProfile = inferenceTypes.includes('INFERENCE_PROFILE' as any);
      const supportsOnDemand = inferenceTypes.includes('ON_DEMAND' as any);
      const provider = model.providerName || 'Unknown';
      
      const isChatModelFlag = isChatModel(modelId, modelName, modalities);
      const isObsoleteFlag = isObsolete(modelId, modelName);
      
      // Testar apenas modelos de chat Anthropic
      let testResult = 'NOT_TESTED';
      let requiresProfile = false;
      
      if (provider === 'Anthropic' && isChatModelFlag) {
        try {
          console.log(`🧪 Testando ${modelId}...`);
          await testModel(runtimeClient, modelId);
          testResult = 'WORKS_WITHOUT_PROFILE';
          console.log(`✅ Funciona sem inference profile`);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          if (errorMsg.includes('on-demand throughput') || 
              errorMsg.includes('inference profile') ||
              errorMsg.includes('not available')) {
            requiresProfile = true;
            testResult = 'REQUIRES_PROFILE';
            console.log(`🔴 REQUER INFERENCE PROFILE`);
          } else {
            testResult = `ERROR: ${errorMsg.substring(0, 50)}`;
            console.log(`⚠️  Erro: ${errorMsg.substring(0, 50)}`);
          }
        }
      }
      
      results.push({
        provider,
        modelId,
        modelName,
        supportsInferenceProfile,
        supportsOnDemand,
        requiresProfile,
        testResult,
        inferenceTypes,
        modalities,
        isObsolete: isObsoleteFlag,
        isChatModel: isChatModelFlag,
      });
    }

    // 4. Gerar relatório focado em chat
    generateChatReport(results);
    
    // 5. Salvar relatório
    await saveReportToFile(results);

  } catch (error) {
    console.error('❌ Erro ao analisar modelos:', error);
    throw error;
  }
}

async function testModel(client: BedrockRuntimeClient, modelId: string): Promise<void> {
  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 10,
    }),
  });
  
  await client.send(command);
}

function generateChatReport(results: ChatModelAnalysis[]) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('💬 ANÁLISE DE MODELOS DE CHAT - INFERENCE PROFILES');
  console.log('='.repeat(80));
  
  // Filtrar apenas modelos de chat
  const chatModels = results.filter(r => r.isChatModel);
  const nonChatModels = results.filter(r => !r.isChatModel);
  
  console.log(`\n📊 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de modelos: ${results.length}`);
  console.log(`   Modelos de CHAT: ${chatModels.length}`);
  console.log(`   Modelos NÃO-CHAT (embeddings, etc): ${nonChatModels.length}`);
  
  // Análise de modelos de chat
  const chatWithProfile = chatModels.filter(m => m.supportsInferenceProfile);
  const chatWithoutProfile = chatModels.filter(m => !m.supportsInferenceProfile);
  const chatRequiresProfile = chatModels.filter(m => m.requiresProfile);
  const chatObsolete = chatModels.filter(m => m.isObsolete);
  const chatModern = chatModels.filter(m => !m.isObsolete);
  
  console.log(`\n💬 MODELOS DE CHAT:`);
  console.log(`   Total: ${chatModels.length}`);
  console.log(`   Com Inference Profile: ${chatWithProfile.length} (${((chatWithProfile.length/chatModels.length)*100).toFixed(1)}%)`);
  console.log(`   Sem Inference Profile: ${chatWithoutProfile.length} (${((chatWithoutProfile.length/chatModels.length)*100).toFixed(1)}%)`);
  console.log(`   Requerem Profile: ${chatRequiresProfile.length}`);
  console.log(`   Modelos Obsoletos: ${chatObsolete.length}`);
  console.log(`   Modelos Modernos: ${chatModern.length}`);
  
  // Análise: Modernos vs Obsoletos
  const modernWithProfile = chatModern.filter(m => m.supportsInferenceProfile);
  const obsoleteWithProfile = chatObsolete.filter(m => m.supportsInferenceProfile);
  
  console.log(`\n📈 CORRELAÇÃO: MODERNIDADE vs INFERENCE PROFILE`);
  console.log(`   Modelos MODERNOS com Profile: ${modernWithProfile.length}/${chatModern.length} (${((modernWithProfile.length/chatModern.length)*100).toFixed(1)}%)`);
  console.log(`   Modelos OBSOLETOS com Profile: ${obsoleteWithProfile.length}/${chatObsolete.length} (${((obsoleteWithProfile.length/chatObsolete.length)*100).toFixed(1)}%)`);
  
  // Análise por provider (apenas chat)
  const chatByProvider = groupByProvider(chatModels);
  
  console.log(`\n\n🏢 ANÁLISE POR PROVIDER (APENAS CHAT):`);
  console.log('─'.repeat(80));
  for (const [provider, models] of Object.entries(chatByProvider)) {
    const withProfile = models.filter(m => m.supportsInferenceProfile).length;
    const requires = models.filter(m => m.requiresProfile).length;
    const obsolete = models.filter(m => m.isObsolete).length;
    
    console.log(`\n${provider}:`);
    console.log(`   Total de modelos de chat: ${models.length}`);
    console.log(`   Com Inference Profile: ${withProfile} (${((withProfile/models.length)*100).toFixed(1)}%)`);
    console.log(`   Requerem Profile: ${requires}`);
    console.log(`   Obsoletos: ${obsolete}`);
  }
  
  // Listar modelos de chat MODERNOS
  console.log(`\n\n✨ MODELOS DE CHAT MODERNOS (${chatModern.length}):`);
  console.log('─'.repeat(80));
  for (const model of chatModern) {
    const emoji = model.requiresProfile ? '🔴' : model.supportsInferenceProfile ? '🟡' : '⚪';
    const profileStatus = model.requiresProfile ? 'REQUER' : model.supportsInferenceProfile ? 'SUPORTA' : 'NÃO SUPORTA';
    console.log(`${emoji} ${model.modelId}`);
    console.log(`   Provider: ${model.provider}`);
    console.log(`   Nome: ${model.modelName}`);
    console.log(`   Inference Profile: ${profileStatus}`);
    console.log('');
  }
  
  // Listar modelos de chat OBSOLETOS
  console.log(`\n\n🗑️  MODELOS DE CHAT OBSOLETOS (${chatObsolete.length}):`);
  console.log('─'.repeat(80));
  for (const model of chatObsolete) {
    const emoji = model.supportsInferenceProfile ? '🟡' : '⚪';
    console.log(`${emoji} ${model.modelId} (${model.provider})`);
  }
  
  // Conclusão
  console.log(`\n\n🎯 CONCLUSÃO:`);
  console.log('─'.repeat(80));
  
  const modernProfilePercentage = (modernWithProfile.length/chatModern.length)*100;
  const obsoleteProfilePercentage = chatObsolete.length > 0 ? (obsoleteWithProfile.length/chatObsolete.length)*100 : 0;
  
  if (modernProfilePercentage > obsoleteProfilePercentage) {
    console.log(`✅ SUA HIPÓTESE ESTÁ CORRETA!`);
    console.log(`   ${modernProfilePercentage.toFixed(1)}% dos modelos MODERNOS suportam Inference Profiles`);
    console.log(`   ${obsoleteProfilePercentage.toFixed(1)}% dos modelos OBSOLETOS suportam Inference Profiles`);
    console.log(`\n   Modelos mais novos têm maior suporte a Inference Profiles.`);
  } else {
    console.log(`⚠️  Hipótese parcialmente correta`);
    console.log(`   Análise mais detalhada necessária.`);
  }
  
  console.log(`\n📋 RECOMENDAÇÃO:`);
  if (chatWithoutProfile.length < chatWithProfile.length) {
    console.log(`   ✅ Usar APENAS modelos com Inference Profile é viável!`);
    console.log(`   ${chatWithProfile.length} modelos de chat suportam (vs ${chatWithoutProfile.length} que não suportam)`);
    console.log(`\n   Você pode focar nos ${chatModern.length} modelos modernos de chat.`);
  } else {
    console.log(`   ⚠️  Ainda há muitos modelos de chat sem Inference Profile`);
    console.log(`   Recomenda-se abordagem híbrida.`);
  }
}

function groupByProvider(results: ChatModelAnalysis[]): Record<string, ChatModelAnalysis[]> {
  const grouped: Record<string, ChatModelAnalysis[]> = {};
  for (const result of results) {
    if (!grouped[result.provider]) {
      grouped[result.provider] = [];
    }
    grouped[result.provider].push(result);
  }
  return grouped;
}

async function saveReportToFile(results: ChatModelAnalysis[]) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const chatModels = results.filter(r => r.isChatModel);
  const chatModern = chatModels.filter(m => !m.isObsolete);
  const chatObsolete = chatModels.filter(m => m.isObsolete);
  const chatWithProfile = chatModels.filter(m => m.supportsInferenceProfile);
  const chatRequiresProfile = chatModels.filter(m => m.requiresProfile);
  
  let markdown = `# Análise de Modelos de Chat - Inference Profiles

**Data da Análise:** ${new Date().toISOString()}

## 📊 Resumo Executivo

- **Total de modelos de CHAT:** ${chatModels.length}
- **Modelos MODERNOS:** ${chatModern.length}
- **Modelos OBSOLETOS:** ${chatObsolete.length}
- **Com Inference Profile:** ${chatWithProfile.length} (${((chatWithProfile.length/chatModels.length)*100).toFixed(1)}%)
- **Requerem Inference Profile:** ${chatRequiresProfile.length}

---

## ✨ Modelos de Chat MODERNOS

${chatModern.map(m => {
  const emoji = m.requiresProfile ? '🔴' : m.supportsInferenceProfile ? '🟡' : '⚪';
  const profileStatus = m.requiresProfile ? 'REQUER' : m.supportsInferenceProfile ? 'SUPORTA' : 'NÃO SUPORTA';
  return `
### ${emoji} ${m.modelId}

- **Provider:** ${m.provider}
- **Nome:** ${m.modelName}
- **Inference Profile:** ${profileStatus}
- **Inference Types:** ${m.inferenceTypes.join(', ')}
- **Modalities:** ${m.modalities.join(', ')}
`;
}).join('\n')}

---

## 🗑️ Modelos de Chat OBSOLETOS

${chatObsolete.map(m => `- ${m.modelId} (${m.provider}) - ${m.supportsInferenceProfile ? 'Suporta Profile' : 'Não suporta'}`).join('\n')}

---

## 🎯 Conclusão

${(() => {
  const modernWithProfile = chatModern.filter(m => m.supportsInferenceProfile);
  const obsoleteWithProfile = chatObsolete.filter(m => m.supportsInferenceProfile);
  const modernProfilePercentage = (modernWithProfile.length/chatModern.length)*100;
  const obsoleteProfilePercentage = chatObsolete.length > 0 ? (obsoleteWithProfile.length/chatObsolete.length)*100 : 0;
  
  if (modernProfilePercentage > obsoleteProfilePercentage) {
    return `✅ **Hipótese CONFIRMADA!**

${modernProfilePercentage.toFixed(1)}% dos modelos MODERNOS suportam Inference Profiles vs ${obsoleteProfilePercentage.toFixed(1)}% dos OBSOLETOS.

**Recomendação:** Focar nos ${chatModern.length} modelos modernos de chat que suportam Inference Profiles.`;
  } else {
    return `⚠️ Hipótese parcialmente correta. Análise mais detalhada necessária.`;
  }
})()}

---

## 📊 Dados Completos (JSON)

\`\`\`json
${JSON.stringify(chatModels, null, 2)}
\`\`\`

---

**Gerado por:** analyze-chat-models-profiles.ts  
**Timestamp:** ${new Date().toISOString()}
`;

  const reportPath = path.join(process.cwd(), 'scripts', 'CHAT_MODELS_INFERENCE_ANALYSIS.md');
  await fs.writeFile(reportPath, markdown, 'utf-8');
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
}

// Executar análise
analyzeChatModelsProfiles().catch(console.error);
