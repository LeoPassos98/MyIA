import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

interface ModelAnalysis {
  provider: string;
  modelId: string;
  modelName?: string;
  supportsInferenceProfile: boolean;
  supportsOnDemand: boolean;
  requiresProfile: boolean;
  testResult: string;
  inferenceTypes: string[];
}

async function analyzeInferenceProfiles() {
  console.log('🔍 Analisando requisitos de Inference Profiles...\n');

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

  const bedrockClient = new BedrockClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const runtimeClient = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
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

    console.log(`📊 Total de modelos encontrados: ${response.modelSummaries.length}`);
    console.log(`📊 Total de modelos ACTIVE: ${activeModels.length}\n`);

    // 3. Agrupar por provider
    const byProvider: Record<string, any[]> = {};
    for (const model of activeModels) {
      const provider = model.providerName || 'Unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(model);
    }

    // 4. Analisar cada provider
    const results: ModelAnalysis[] = [];
    
    for (const [provider, models] of Object.entries(byProvider)) {
      console.log(`\n🏢 ${provider} (${models.length} modelos):`);
      console.log('─'.repeat(80));
      
      for (const model of models) {
        const modelId = model.modelId!;
        const modelName = model.modelName || 'N/A';
        const inferenceTypes = model.inferenceTypesSupported || [];
        
        // Verificar se suporta INFERENCE_PROFILE
        const supportsInferenceProfile = inferenceTypes.includes('INFERENCE_PROFILE');
        const supportsOnDemand = inferenceTypes.includes('ON_DEMAND');
        
        // Testar modelo
        let testResult = 'NOT_TESTED';
        let requiresProfile = false;
        
        // Apenas testar modelos Anthropic (Claude)
        if (provider === 'Anthropic' && modelId.includes('claude')) {
          try {
            console.log(`   🧪 Testando ${modelId}...`);
            await testModel(runtimeClient, modelId);
            testResult = 'WORKS_WITHOUT_PROFILE';
            console.log(`   ✅ Funciona sem inference profile`);
          } catch (error: any) {
            const errorMsg = error.message || String(error);
            if (errorMsg.includes('on-demand throughput') || 
                errorMsg.includes('inference profile') ||
                errorMsg.includes('not available')) {
              requiresProfile = true;
              testResult = 'REQUIRES_PROFILE';
              console.log(`   🔴 REQUER INFERENCE PROFILE`);
            } else {
              testResult = `ERROR: ${errorMsg.substring(0, 100)}`;
              console.log(`   ⚠️  Erro: ${errorMsg.substring(0, 100)}`);
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
        });
        
        const emoji = requiresProfile ? '🔴' : supportsInferenceProfile ? '🟡' : '✅';
        console.log(`${emoji} ${modelId}`);
        console.log(`   Nome: ${modelName}`);
        console.log(`   Inference Types: ${inferenceTypes.join(', ') || 'Nenhum'}`);
        if (requiresProfile) {
          console.log(`   ⚠️  REQUER INFERENCE PROFILE`);
        }
        console.log('');
      }
    }

    // 5. Gerar relatório
    generateReport(results);
    
    // 6. Salvar relatório em arquivo
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

function generateReport(results: ModelAnalysis[]) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 RELATÓRIO DE INFERENCE PROFILES');
  console.log('='.repeat(80));
  
  const requiresProfile = results.filter(r => r.requiresProfile);
  const supportsProfile = results.filter(r => r.supportsInferenceProfile);
  const byProvider = groupByProvider(results);
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de modelos analisados: ${results.length}`);
  console.log(`   Modelos que REQUEREM Inference Profile: ${requiresProfile.length}`);
  console.log(`   Modelos que SUPORTAM Inference Profile: ${supportsProfile.length}`);
  console.log(`   Modelos que NÃO precisam: ${results.length - supportsProfile.length}`);
  
  console.log(`\n\n🔴 MODELOS QUE REQUEREM INFERENCE PROFILE (${requiresProfile.length}):`);
  console.log('─'.repeat(80));
  if (requiresProfile.length > 0) {
    for (const model of requiresProfile) {
      console.log(`   - ${model.modelId}`);
      console.log(`     Provider: ${model.provider}`);
      console.log(`     Nome: ${model.modelName}`);
      console.log(`     Inference Types: ${model.inferenceTypes.join(', ')}`);
      console.log('');
    }
  } else {
    console.log('   Nenhum modelo requer inference profile obrigatoriamente.');
  }
  
  console.log(`\n🟡 MODELOS QUE SUPORTAM INFERENCE PROFILE (${supportsProfile.length}):`);
  console.log('─'.repeat(80));
  const supportsButNotRequires = supportsProfile.filter(m => !m.requiresProfile);
  if (supportsButNotRequires.length > 0) {
    for (const model of supportsButNotRequires) {
      console.log(`   - ${model.modelId} (${model.provider})`);
    }
  } else {
    console.log('   Todos os modelos que suportam também requerem.');
  }
  
  console.log(`\n\n📋 ANÁLISE POR PROVIDER:`);
  console.log('─'.repeat(80));
  for (const [provider, models] of Object.entries(byProvider)) {
    const requires = models.filter(m => m.requiresProfile).length;
    const supports = models.filter(m => m.supportsInferenceProfile).length;
    console.log(`\n${provider}:`);
    console.log(`   Total: ${models.length}`);
    console.log(`   Requer Profile: ${requires}`);
    console.log(`   Suporta Profile: ${supports}`);
  }
  
  // Recomendações
  console.log('\n\n📋 RECOMENDAÇÕES:');
  console.log('─'.repeat(80));
  
  if (requiresProfile.length > 0) {
    console.log('\n1. ✅ Adicionar `requires_inference_profile: true` para:');
    for (const model of requiresProfile) {
      console.log(`   - ${model.modelId}`);
    }
  } else {
    console.log('\n1. ✅ Nenhum modelo requer inference profile obrigatoriamente');
  }
  
  console.log('\n2. 🔧 Atualizar bedrock.ts para:');
  console.log('   - Usar inference profile APENAS quando modelo requer');
  console.log('   - Manter modelId direto para modelos que não requerem');
  console.log('   - Adicionar fallback inteligente');
  
  console.log('\n3. 📝 Atualizar registry models para marcar modelos que requerem profile');
  
  console.log('\n4. 🧪 Re-testar modelos após correções');
  
  console.log('\n\n✅ Análise concluída!');
  console.log('📄 Relatório salvo em: backend/scripts/INFERENCE_PROFILES_ANALYSIS.md');
}

function groupByProvider(results: ModelAnalysis[]): Record<string, ModelAnalysis[]> {
  const grouped: Record<string, ModelAnalysis[]> = {};
  for (const result of results) {
    if (!grouped[result.provider]) {
      grouped[result.provider] = [];
    }
    grouped[result.provider].push(result);
  }
  return grouped;
}

async function saveReportToFile(results: ModelAnalysis[]) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const requiresProfile = results.filter(r => r.requiresProfile);
  const supportsProfile = results.filter(r => r.supportsInferenceProfile);
  const byProvider = groupByProvider(results);
  
  let markdown = `# Análise de Inference Profiles - AWS Bedrock

**Data da Análise:** ${new Date().toISOString()}

## 📊 Resumo Executivo

- **Total de modelos analisados:** ${results.length}
- **Modelos que REQUEREM Inference Profile:** ${requiresProfile.length}
- **Modelos que SUPORTAM Inference Profile:** ${supportsProfile.length}
- **Modelos que NÃO precisam:** ${results.length - supportsProfile.length}

---

## 🔴 Modelos que REQUEREM Inference Profile

${requiresProfile.length > 0 ? requiresProfile.map(m => `
### ${m.modelId}

- **Provider:** ${m.provider}
- **Nome:** ${m.modelName}
- **Inference Types:** ${m.inferenceTypes.join(', ')}
- **Resultado do Teste:** ${m.testResult}
`).join('\n') : 'Nenhum modelo requer inference profile obrigatoriamente.'}

---

## 🟡 Modelos que SUPORTAM Inference Profile (mas não requerem)

${supportsProfile.filter(m => !m.requiresProfile).map(m => `- ${m.modelId} (${m.provider})`).join('\n') || 'Todos os modelos que suportam também requerem.'}

---

## 📋 Análise por Provider

${Object.entries(byProvider).map(([provider, models]) => {
  const requires = models.filter(m => m.requiresProfile).length;
  const supports = models.filter(m => m.supportsInferenceProfile).length;
  return `
### ${provider}

- **Total de modelos:** ${models.length}
- **Requerem Profile:** ${requires}
- **Suportam Profile:** ${supports}

**Modelos:**
${models.map(m => {
  const emoji = m.requiresProfile ? '🔴' : m.supportsInferenceProfile ? '🟡' : '✅';
  return `- ${emoji} \`${m.modelId}\` - ${m.modelName}`;
}).join('\n')}
`;
}).join('\n')}

---

## 📋 Recomendações

### 1. Atualizar Registry Models

${requiresProfile.length > 0 ? `Adicionar \`requires_inference_profile: true\` para:

${requiresProfile.map(m => `- \`${m.modelId}\``).join('\n')}
` : 'Nenhuma atualização necessária - nenhum modelo requer inference profile obrigatoriamente.'}

### 2. Atualizar bedrock.ts

- Usar inference profile APENAS quando modelo requer
- Manter modelId direto para modelos que não requerem
- Adicionar fallback inteligente

### 3. Próximos Passos

1. ✅ Revisar configuração atual do registry
2. ✅ Atualizar modelos que requerem profile
3. ✅ Testar modelos após correções
4. ✅ Validar funcionamento em produção

---

## 📊 Dados Completos

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

---

**Gerado por:** analyze-inference-profiles.ts
**Timestamp:** ${new Date().toISOString()}
`;

  const reportPath = path.join(process.cwd(), 'scripts', 'INFERENCE_PROFILES_ANALYSIS.md');
  await fs.writeFile(reportPath, markdown, 'utf-8');
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
}

// Executar análise
analyzeInferenceProfiles().catch(console.error);
