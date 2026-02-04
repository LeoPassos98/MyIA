// backend/scripts/add-models-to-registry.ts
// Standards: docs/STANDARDS.md

/**
 * Script para adicionar automaticamente modelos AWS Bedrock ao registry
 * 
 * Uso:
 *   npx ts-node backend/scripts/add-models-to-registry.ts [--dry-run] [--vendor=<vendor>]
 * 
 * Exemplos:
 *   npx ts-node backend/scripts/add-models-to-registry.ts --dry-run  # Preview sem modificar arquivos
 *   npx ts-node backend/scripts/add-models-to-registry.ts            # Adiciona todos os modelos
 *   npx ts-node backend/scripts/add-models-to-registry.ts --vendor=mistral  # Apenas Mistral
 * 
 * O script:
 * 1. Busca TODOS os modelos disponíveis no AWS Bedrock
 * 2. Compara com modelos já configurados no registry
 * 3. Identifica modelos não configurados
 * 4. Agrupa por vendor
 * 5. Gera código TypeScript automaticamente
 * 6. Adiciona aos arquivos models.ts correspondentes
 * 7. Atualiza index.ts com novos exports
 * 8. Gera relatório de modelos adicionados
 */

import { PrismaClient } from '@prisma/client';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import * as fs from 'fs';
import * as path from 'path';
import { encryptionService } from '../src/services/encryptionService';
import { ModelRegistry } from '../src/services/ai/registry/model-registry';

const prisma = new PrismaClient();

// Blacklist de modelos que não devem ser adicionados
const BLACKLIST = [
  'amazon.nova-sonic-v1:0',
  'amazon.nova-2-sonic-v1:0'
];

interface BedrockModel {
  modelId: string;
  modelName: string;
  providerName: string;
  inputModalities: string[];
  outputModalities: string[];
  responseStreamingSupported: boolean;
  customizationsSupported: string[];
  inferenceTypesSupported: string[];
}

interface ModelToAdd {
  modelId: string;
  modelName: string;
  vendor: string;
  providerName: string;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxContextWindow: number;
    maxOutputTokens: number;
  };
  requiresInferenceProfile: boolean;
}

interface VendorGroup {
  vendor: string;
  models: ModelToAdd[];
}

/**
 * Busca todos os modelos disponíveis no AWS Bedrock
 */
async function listBedrockModels(
  credentials: { accessKey: string; secretKey: string; region: string }
): Promise<BedrockModel[]> {
  console.log('🔍 Buscando modelos disponíveis no AWS Bedrock...\n');

  const client = new BedrockClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey
    }
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    if (!response.modelSummaries || response.modelSummaries.length === 0) {
      console.log('⚠️  Nenhum modelo encontrado no AWS Bedrock.');
      return [];
    }

    const models: BedrockModel[] = response.modelSummaries.map(model => ({
      modelId: model.modelId || '',
      modelName: model.modelName || '',
      providerName: model.providerName || '',
      inputModalities: model.inputModalities || [],
      outputModalities: model.outputModalities || [],
      responseStreamingSupported: model.responseStreamingSupported || false,
      customizationsSupported: model.customizationsSupported || [],
      inferenceTypesSupported: model.inferenceTypesSupported || []
    }));

    console.log(`✅ ${models.length} modelos encontrados no AWS Bedrock\n`);
    return models;

  } catch (error: any) {
    console.error('❌ Erro ao listar modelos do Bedrock:', error.message);
    throw error;
  }
}

/**
 * Filtra modelos relevantes para adição ao registry
 */
function filterRelevantModels(models: BedrockModel[]): BedrockModel[] {
  console.log('🔧 Filtrando modelos relevantes...\n');

  const filtered = models.filter(model => {
    // Filtrar blacklist
    if (BLACKLIST.includes(model.modelId)) {
      console.log(`⛔ Modelo na blacklist: ${model.modelId}`);
      return false;
    }

    // Filtrar apenas modelos que suportam TEXT output
    const supportsText = model.outputModalities.includes('TEXT');

    // Filtrar apenas modelos que suportam inferência ON_DEMAND
    const supportsInference = model.inferenceTypesSupported.includes('ON_DEMAND');

    return supportsText && supportsInference;
  });

  console.log(`✅ ${filtered.length} modelos relevantes após filtragem\n`);
  return filtered;
}

/**
 * Mapeia nome do provider para vendor interno
 */
function mapProviderToVendor(providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('anthropic')) return 'anthropic';
  if (lower.includes('amazon')) return 'amazon';
  if (lower.includes('cohere')) return 'cohere';
  if (lower.includes('meta')) return 'meta';
  if (lower.includes('mistral')) return 'mistral';
  if (lower.includes('ai21')) return 'ai21';
  if (lower.includes('nvidia')) return 'nvidia';
  if (lower.includes('openai')) return 'openai';
  if (lower.includes('qwen')) return 'qwen';
  if (lower.includes('minimax')) return 'minimax';
  if (lower.includes('google')) return 'google';
  if (lower.includes('moonshot')) return 'moonshot';
  if (lower.includes('twelvelabs')) return 'twelvelabs';
  return providerName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Determina se modelo requer inference profile
 */
function requiresInferenceProfile(modelId: string, providerName: string): boolean {
  // Modelos Anthropic novos (Claude 3.5+, Claude 4+) requerem inference profile
  if (providerName.toLowerCase().includes('anthropic')) {
    // Claude 3.5 Sonnet v2, Claude 3.5 Haiku, Claude 4.x, Claude 4.5.x
    if (modelId.includes('claude-3-5-sonnet-20241022') ||
      modelId.includes('claude-3-5-haiku') ||
      modelId.includes('claude-haiku-4-5') ||
      modelId.includes('claude-sonnet-4-5') ||
      modelId.includes('claude-opus-4-5') ||
      modelId.includes('claude-opus-4-1') ||
      modelId.includes('claude-sonnet-4-20250514') ||
      modelId.includes('claude-opus-4-20250514') ||
      modelId.includes('claude-3-7-sonnet')) {
      return true;
    }
  }

  // Amazon Nova Premier e Nova 2 requerem inference profile
  if (providerName.toLowerCase().includes('amazon')) {
    if (modelId.includes('nova-premier') ||
      modelId.includes('nova-2-lite') ||
      modelId.includes('nova-2-micro') ||
      modelId.includes('nova-2-pro')) {
      return true;
    }
  }

  return false;
}

/**
 * Estima capabilities baseado no modelo
 */
function estimateCapabilities(model: BedrockModel): ModelToAdd['capabilities'] {
  const vendor = mapProviderToVendor(model.providerName);

  // Valores padrão conservadores
  let maxContextWindow = 128000;
  let maxOutputTokens = 4096;
  let vision = model.inputModalities.includes('IMAGE');
  let functionCalling = false;

  // Ajustes específicos por vendor
  if (vendor === 'anthropic') {
    maxContextWindow = 200000;
    maxOutputTokens = 8192;
    functionCalling = model.modelId.includes('claude-3-5') || model.modelId.includes('claude-4');
  } else if (vendor === 'amazon') {
    if (model.modelId.includes('nova')) {
      maxContextWindow = 300000;
      maxOutputTokens = 5000;
    } else if (model.modelId.includes('titan-text-premier')) {
      maxContextWindow = 32768;
      maxOutputTokens = 3072;
    } else if (model.modelId.includes('titan-text-express')) {
      maxContextWindow = 8192;
      maxOutputTokens = 8192;
    } else if (model.modelId.includes('titan-text-lite')) {
      maxContextWindow = 4096;
      maxOutputTokens = 4096;
    }
  } else if (vendor === 'cohere') {
    maxContextWindow = 128000;
    maxOutputTokens = 4000;
    functionCalling = model.modelId.includes('command-r');
  } else if (vendor === 'meta') {
    maxContextWindow = 128000;
    maxOutputTokens = 4096;
  } else if (vendor === 'mistral') {
    maxContextWindow = 128000;
    maxOutputTokens = 4096;
    functionCalling = model.modelId.includes('large') || model.modelId.includes('medium');
  }

  return {
    streaming: model.responseStreamingSupported,
    vision,
    functionCalling,
    maxContextWindow,
    maxOutputTokens
  };
}

/**
 * Gera display name amigável
 */
function generateDisplayName(modelId: string, modelName: string, vendor: string): string {
  // Se já tem um nome descritivo, usar
  if (modelName && modelName !== modelId) {
    return modelName;
  }

  // Extrair nome do modelId
  const parts = modelId.split('.');
  if (parts.length > 1) {
    const name = parts[1]
      .replace(/-v\d+:\d+$/, '') // Remove versão
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${vendor.charAt(0).toUpperCase() + vendor.slice(1)} ${name}`;
  }

  return modelName || modelId;
}

/**
 * Compara com registry atual e identifica modelos não configurados
 */
async function identifyMissingModels(
  awsModels: BedrockModel[]
): Promise<ModelToAdd[]> {
  console.log('🔍 Comparando com registry atual...\n');

  // Carregar registry atual
  await import('../src/services/ai/registry/models');

  const registryModels = ModelRegistry.getAll();
  const registryIds = new Set(registryModels.map(m => m.modelId));

  console.log(`📊 Registry atual: ${registryIds.size} modelos`);
  console.log(`📊 AWS Bedrock: ${awsModels.length} modelos`);

  const missingModels: ModelToAdd[] = [];

  for (const awsModel of awsModels) {
    if (!registryIds.has(awsModel.modelId)) {
      const vendor = mapProviderToVendor(awsModel.providerName);
      const capabilities = estimateCapabilities(awsModel);
      const displayName = generateDisplayName(awsModel.modelId, awsModel.modelName, vendor);
      const requiresProfile = requiresInferenceProfile(awsModel.modelId, awsModel.providerName);

      missingModels.push({
        modelId: awsModel.modelId,
        modelName: displayName,
        vendor,
        providerName: awsModel.providerName,
        capabilities,
        requiresInferenceProfile: requiresProfile
      });
    }
  }

  console.log(`\n✅ ${missingModels.length} modelos não configurados identificados\n`);
  return missingModels;
}

/**
 * Agrupa modelos por vendor
 */
function groupByVendor(models: ModelToAdd[]): VendorGroup[] {
  console.log('📦 Agrupando modelos por vendor...\n');

  const groups = new Map<string, ModelToAdd[]>();

  for (const model of models) {
    if (!groups.has(model.vendor)) {
      groups.set(model.vendor, []);
    }
    groups.get(model.vendor)!.push(model);
  }

  const vendorGroups: VendorGroup[] = Array.from(groups.entries()).map(([vendor, models]) => ({
    vendor,
    models: models.sort((a, b) => a.modelId.localeCompare(b.modelId))
  }));

  // Mostrar distribuição
  console.log('📊 Distribuição por vendor:');
  for (const group of vendorGroups) {
    console.log(`   ${group.vendor}: ${group.models.length} modelos`);
  }
  console.log('');

  return vendorGroups.sort((a, b) => a.vendor.localeCompare(b.vendor));
}

/**
 * Gera código TypeScript para um modelo
 */
function generateModelCode(model: ModelToAdd, indent: string = '  '): string {
  const lines: string[] = [];

  lines.push(`${indent}{`);
  lines.push(`${indent}  modelId: '${model.modelId}',`);
  lines.push(`${indent}  vendor: '${model.vendor}',`);
  lines.push(`${indent}  displayName: '${model.modelName}',`);
  lines.push(`${indent}  description: 'Auto-generated model configuration',`);
  lines.push(`${indent}  capabilities: {`);
  lines.push(`${indent}    streaming: ${model.capabilities.streaming},`);
  lines.push(`${indent}    vision: ${model.capabilities.vision},`);
  lines.push(`${indent}    functionCalling: ${model.capabilities.functionCalling},`);
  lines.push(`${indent}    maxContextWindow: ${model.capabilities.maxContextWindow},`);
  lines.push(`${indent}    maxOutputTokens: ${model.capabilities.maxOutputTokens},`);
  lines.push(`${indent}  },`);
  lines.push(`${indent}  supportedPlatforms: ['bedrock'],`);

  if (model.requiresInferenceProfile) {
    lines.push(`${indent}  platformRules: [`);
    lines.push(`${indent}    {`);
    lines.push(`${indent}      platform: 'bedrock',`);
    lines.push(`${indent}      rule: 'requires_inference_profile',`);
    lines.push(`${indent}      config: {`);
    lines.push(`${indent}        profileFormat: '{region}.{modelId}',`);
    lines.push(`${indent}      },`);
    lines.push(`${indent}    },`);
    lines.push(`${indent}  ],`);
  }

  // Determinar adapter class baseado no vendor
  let adapterClass = 'AmazonAdapter'; // Default
  if (model.vendor === 'anthropic') adapterClass = 'AnthropicAdapter';
  else if (model.vendor === 'cohere') adapterClass = 'CohereAdapter';
  else if (model.vendor === 'amazon') adapterClass = 'AmazonAdapter';

  lines.push(`${indent}  adapterClass: '${adapterClass}',`);

  // Recommended params baseado no vendor
  lines.push(`${indent}  recommendedParams: {`);
  if (model.vendor === 'anthropic') {
    lines.push(`${indent}    temperature: 0.7,`);
    lines.push(`${indent}    topP: 0.9,`);
    lines.push(`${indent}    maxTokens: 2048,`);
  } else if (model.vendor === 'cohere') {
    lines.push(`${indent}    temperature: 0.3,`);
    lines.push(`${indent}    topP: 0.75,`);
    lines.push(`${indent}    topK: 0,`);
    lines.push(`${indent}    maxTokens: 2048,`);
  } else {
    lines.push(`${indent}    temperature: 0.7,`);
    lines.push(`${indent}    topP: 0.9,`);
    lines.push(`${indent}    topK: 250,`);
    lines.push(`${indent}    maxTokens: 2048,`);
  }
  lines.push(`${indent}  },`);

  lines.push(`${indent}},`);

  return lines.join('\n');
}

/**
 * Gera arquivo models.ts completo para um vendor
 */
function generateVendorFile(vendor: string, models: ModelToAdd[]): string {
  const vendorCapitalized = vendor.charAt(0).toUpperCase() + vendor.slice(1);

  const lines: string[] = [];
  lines.push(`// backend/src/services/ai/registry/models/${vendor}.models.ts`);
  lines.push(`// Standards: docs/STANDARDS.md`);
  lines.push(``);
  lines.push(`import { ModelRegistry, ModelMetadata } from '../model-registry';`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * ${vendorCapitalized} models registration`);
  lines.push(` * Auto-generated by add-models-to-registry.ts`);
  lines.push(` */`);
  lines.push(`const ${vendor}Models: ModelMetadata[] = [`);

  for (const model of models) {
    lines.push(generateModelCode(model));
    lines.push('');
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`// Auto-register all models`);
  lines.push(`ModelRegistry.registerMany(${vendor}Models);`);
  lines.push(``);
  lines.push(`export { ${vendor}Models };`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * Adiciona modelos a arquivo existente
 */
function addModelsToExistingFile(filePath: string, models: ModelToAdd[]): string {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Encontrar o array de modelos
  const arrayMatch = content.match(/const\s+\w+Models:\s*ModelMetadata\[\]\s*=\s*\[/);
  if (!arrayMatch) {
    throw new Error(`Não foi possível encontrar array de modelos em ${filePath}`);
  }

  // Encontrar o final do array (antes do ];)
  const closingBracketIndex = content.lastIndexOf('];');
  if (closingBracketIndex === -1) {
    throw new Error(`Não foi possível encontrar fechamento do array em ${filePath}`);
  }

  // Gerar código dos novos modelos
  const newModelsCode = models.map(model => generateModelCode(model)).join('\n\n');

  // Inserir novos modelos antes do fechamento
  const beforeClosing = content.substring(0, closingBracketIndex);
  const afterClosing = content.substring(closingBracketIndex);

  return beforeClosing + '\n' + newModelsCode + '\n' + afterClosing;
}

/**
 * Atualiza index.ts com novos vendors
 */
function updateIndexFile(registryPath: string, vendors: string[]): void {
  const indexPath = path.join(registryPath, 'index.ts');
  const content = fs.readFileSync(indexPath, 'utf-8');

  const lines = content.split('\n');
  const importLines: string[] = [];
  const exportLines: string[] = [];

  // Encontrar seção de imports e exports
  for (const line of lines) {
    if (line.includes('import \'./')) {
      importLines.push(line);
    } else if (line.includes('export * from \'./')) {
      exportLines.push(line);
    }
  }

  // Adicionar novos vendors
  for (const vendor of vendors) {
    const importLine = `import './${vendor}.models';`;
    const exportLine = `export * from './${vendor}.models';`;

    if (!importLines.includes(importLine)) {
      importLines.push(importLine);
    }
    if (!exportLines.includes(exportLine)) {
      exportLines.push(exportLine);
    }
  }

  // Reconstruir arquivo
  const newContent = [
    `// backend/src/services/ai/registry/models/index.ts`,
    `// Standards: docs/STANDARDS.md`,
    ``,
    `/**`,
    ` * Auto-register all models`,
    ` * `,
    ` * This file imports all model registrations, which automatically`,
    ` * register themselves in the ModelRegistry.`,
    ` */`,
    ``,
    ...importLines.sort(),
    ``,
    `// Re-export for convenience`,
    ...exportLines.sort(),
    ``
  ].join('\n');

  fs.writeFileSync(indexPath, newContent);
  console.log(`✅ index.ts atualizado`);
}

/**
 * Escreve modelos em arquivos
 */
async function writeModelsToFiles(
  vendorGroups: VendorGroup[],
  dryRun: boolean
): Promise<void> {
  console.log('📝 Escrevendo modelos em arquivos...\n');

  const registryPath = path.join(__dirname, '../src/services/ai/registry/models');
  const newVendors: string[] = [];

  for (const group of vendorGroups) {
    const filePath = path.join(registryPath, `${group.vendor}.models.ts`);
    const fileExists = fs.existsSync(filePath);

    console.log(`\n📄 ${group.vendor}.models.ts (${group.models.length} modelos)`);

    if (dryRun) {
      console.log(`   [DRY RUN] ${fileExists ? 'Adicionaria' : 'Criaria'} arquivo`);
      for (const model of group.models) {
        console.log(`   - ${model.modelId}`);
      }
      continue;
    }

    let content: string;

    if (fileExists) {
      // Adicionar a arquivo existente
      console.log(`   ✏️  Adicionando a arquivo existente`);
      content = addModelsToExistingFile(filePath, group.models);
    } else {
      // Criar novo arquivo
      console.log(`   ✨ Criando novo arquivo`);
      content = generateVendorFile(group.vendor, group.models);
      newVendors.push(group.vendor);
    }

    // Criar backup
    if (fileExists) {
      const backupPath = `${filePath}.backup`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`   💾 Backup criado: ${path.basename(backupPath)}`);
    }

    // Escrever arquivo
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Arquivo escrito com sucesso`);

    for (const model of group.models) {
      console.log(`   + ${model.modelId}`);
    }
  }

  // Atualizar index.ts se houver novos vendors
  if (!dryRun && newVendors.length > 0) {
    console.log(`\n📝 Atualizando index.ts com ${newVendors.length} novos vendors...`);
    updateIndexFile(registryPath, newVendors);
  }
}

/**
 * Gera relatório final
 */
function generateReport(vendorGroups: VendorGroup[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));

  const totalModels = vendorGroups.reduce((sum, g) => sum + g.models.length, 0);

  console.log(`\n✅ Total de modelos adicionados: ${totalModels}`);
  console.log(`📦 Vendors afetados: ${vendorGroups.length}`);

  console.log('\n📊 Por Vendor:');
  for (const group of vendorGroups) {
    console.log(`\n   ${group.vendor} (${group.models.length} modelos):`);
    for (const model of group.models) {
      const profile = model.requiresInferenceProfile ? '🔐' : '  ';
      const vision = model.capabilities.vision ? '👁️' : '  ';
      const functions = model.capabilities.functionCalling ? '⚙️' : '  ';
      console.log(`     ${profile}${vision}${functions} ${model.modelId}`);
    }
  }

  console.log('\n📝 Legenda:');
  console.log('   🔐 = Requer Inference Profile');
  console.log('   👁️ = Suporta Vision');
  console.log('   ⚙️ = Suporta Function Calling');
  console.log('');
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const vendorFilter = args.find(arg => arg.startsWith('--vendor='))?.split('=')[1];

  console.log('🚀 Iniciando adição de modelos ao registry...\n');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  if (dryRun) {
    console.log('🔍 Modo: DRY RUN (sem modificar arquivos)');
  }
  if (vendorFilter) {
    console.log(`🎯 Vendor: ${vendorFilter}`);
  }
  console.log('');

  try {
    // Buscar credenciais AWS
    const user = await prisma.user.findFirst({
      where: {
        settings: {
          awsAccessKey: { not: null },
          awsSecretKey: { not: null },
          awsRegion: { not: null }
        }
      },
      include: {
        settings: true
      }
    });

    if (!user || !user.settings) {
      console.error('❌ Nenhum usuário com credenciais AWS configuradas encontrado.');
      console.error('💡 Configure as credenciais AWS primeiro.');
      return;
    }

    const { awsAccessKey, awsSecretKey, awsRegion } = user.settings;

    if (!awsAccessKey || !awsSecretKey || !awsRegion) {
      console.error('❌ Credenciais AWS não configuradas.');
      return;
    }

    // Descriptografar credenciais
    const decryptedAccessKey = awsAccessKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsAccessKey)
      : awsAccessKey;

    const decryptedSecretKey = awsSecretKey.startsWith('U2FsdGVkX1')
      ? encryptionService.decrypt(awsSecretKey)
      : awsSecretKey;

    const credentials = {
      accessKey: decryptedAccessKey,
      secretKey: decryptedSecretKey,
      region: awsRegion
    };

    console.log(`🔑 Credenciais AWS encontradas (região: ${awsRegion})\n`);

    // 1. Buscar modelos do AWS Bedrock
    const allModels = await listBedrockModels(credentials);

    // 2. Filtrar modelos relevantes
    const relevantModels = filterRelevantModels(allModels);

    // 3. Identificar modelos não configurados
    const missingModels = await identifyMissingModels(relevantModels);

    if (missingModels.length === 0) {
      console.log('✅ Todos os modelos já estão configurados no registry!');
      return;
    }

    // 4. Aplicar filtro de vendor se especificado
    let modelsToAdd = missingModels;
    if (vendorFilter) {
      modelsToAdd = missingModels.filter(m => m.vendor === vendorFilter);
      console.log(`🎯 Filtrado para vendor '${vendorFilter}': ${modelsToAdd.length} modelos\n`);
    }

    // 5. Agrupar por vendor
    const vendorGroups = groupByVendor(modelsToAdd);

    // 6. Escrever em arquivos
    await writeModelsToFiles(vendorGroups, dryRun);

    // 7. Gerar relatório
    generateReport(vendorGroups);

    if (dryRun) {
      console.log('\n💡 Execute sem --dry-run para aplicar as mudanças');
    } else {
      console.log('\n✅ Modelos adicionados com sucesso!');
      console.log('💡 Execute os testes para validar os novos modelos:');
      console.log('   npx ts-node backend/scripts/test-all-models.ts');
    }

  } catch (error) {
    console.error('❌ Erro ao adicionar modelos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main()
  .then(() => {
    console.log('\n🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
