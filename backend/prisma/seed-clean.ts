// backend/prisma/seed-clean.ts
// Standards: docs/STANDARDS.md
//
// Seed para Clean Slate v2 - Sistema de Modelos
// Conforme: docs/CLEAN-SLATE-IMPLEMENTATION-PLAN.md
//
// Este arquivo popula o banco com dados iniciais mínimos após a migration.
// Usa upsert para idempotência (pode rodar múltiplas vezes sem duplicar dados).
//
// NOTA: Os erros de ESLint sobre console.log são
// permitidos em arquivos de seed conforme STANDARDS.md Seção 11.8.

/* eslint-disable no-console */

import { PrismaClient, InferenceType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================================
// CONSTANTES
// ============================================================================

const BCRYPT_SALT_ROUNDS = 10;

// Valores dos enums (strings literais para compatibilidade)
// Espelham os enums do schema-v2.prisma
const PROVIDER_TYPE = {
  AWS_BEDROCK: 'AWS_BEDROCK',
  AZURE_OPENAI: 'AZURE_OPENAI',
  OPENAI_DIRECT: 'OPENAI_DIRECT',
  GOOGLE_VERTEX: 'GOOGLE_VERTEX',
} as const;

const INFERENCE_TYPE = {
  ON_DEMAND: 'ON_DEMAND',
  INFERENCE_PROFILE: 'INFERENCE_PROFILE',
  PROVISIONED: 'PROVISIONED',
} as const;

// Custos em USD por 1 MILHÃO de tokens (padrão da indústria)
// Fonte: https://aws.amazon.com/bedrock/pricing/ (Janeiro 2026)
const BEDROCK_COSTS = {
  // Claude 3.5 Sonnet v2 (us-east-1)
  'claude-3-5-sonnet-v2': {
    input: 3.0,   // $3.00 / 1M tokens
    output: 15.0, // $15.00 / 1M tokens
  },
  // Claude 3 Haiku (us-east-1)
  'claude-3-haiku': {
    input: 0.25,  // $0.25 / 1M tokens
    output: 1.25, // $1.25 / 1M tokens
  },
  // Llama 3.1 70B Instruct (us-east-1)
  'llama-3-1-70b': {
    input: 0.99,  // $0.99 / 1M tokens
    output: 0.99, // $0.99 / 1M tokens
  },
};

// ============================================================================
// SEED: USUÁRIO DE TESTE
// ============================================================================

async function seedTestUser(): Promise<string> {
  console.log('👤 Criando usuário de teste...');

  const passwordHash = await bcrypt.hash('leoleo', BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: 'leo@leo.com' },
    update: {
      password: passwordHash,
      name: 'Leonardo',
    },
    create: {
      email: 'leo@leo.com',
      password: passwordHash,
      name: 'Leonardo',
      settings: {
        create: {
          theme: 'light',
          awsRegion: 'us-east-1',
          awsEnabledModels: [],
        },
      },
    },
    include: { settings: true },
  });

  console.log(`   ✅ Usuário criado: ${user.email} (ID: ${user.id})`);
  return user.id;
}

// ============================================================================
// SEED: PROVIDER AWS BEDROCK
// ============================================================================

async function seedAwsBedrockProvider(): Promise<string> {
  console.log('☁️  Criando provider AWS Bedrock...');

  const provider = await prisma.provider.upsert({
    where: { slug: 'bedrock' },
    update: {
      name: 'AWS Bedrock',
      type: PROVIDER_TYPE.AWS_BEDROCK,
      isActive: true,
      authType: 'aws_credentials',
    },
    create: {
      name: 'AWS Bedrock',
      slug: 'bedrock',
      type: PROVIDER_TYPE.AWS_BEDROCK,
      isActive: true,
      authType: 'aws_credentials',
      baseUrl: null, // Bedrock usa SDK, não URL direta
    },
  });

  console.log(`   ✅ Provider criado: ${provider.name} (ID: ${provider.id})`);
  return provider.id;
}

// ============================================================================
// SEED: BASE MODELS
// ============================================================================

interface BaseModelData {
  name: string;
  vendor: string;
  family: string;
  version: string;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxContextWindow: number;
    maxOutputTokens: number;
  };
  defaultParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  description: string;
}

const BASE_MODELS: BaseModelData[] = [
  {
    name: 'Claude 3.5 Sonnet v2',
    vendor: 'Anthropic',
    family: 'Claude',
    version: '3.5',
    capabilities: {
      streaming: true,
      vision: true,
      functionCalling: true,
      maxContextWindow: 200000,
      maxOutputTokens: 8192,
    },
    defaultParams: {
      temperature: 1.0,
      topP: 0.999,
      maxTokens: 4096,
    },
    description: 'Modelo mais inteligente da Anthropic. Excelente para tarefas complexas de raciocínio, análise e geração de código.',
  },
  {
    name: 'Claude 3 Haiku',
    vendor: 'Anthropic',
    family: 'Claude',
    version: '3',
    capabilities: {
      streaming: true,
      vision: true,
      functionCalling: true,
      maxContextWindow: 200000,
      maxOutputTokens: 4096,
    },
    defaultParams: {
      temperature: 1.0,
      topP: 0.999,
      maxTokens: 2048,
    },
    description: 'Modelo mais rápido e econômico da Anthropic. Ideal para tarefas simples e alto volume.',
  },
  {
    name: 'Llama 3.1 70B Instruct',
    vendor: 'Meta',
    family: 'Llama',
    version: '3.1',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: true,
      maxContextWindow: 128000,
      maxOutputTokens: 2048,
    },
    defaultParams: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
    },
    description: 'Modelo open-source da Meta com 70 bilhões de parâmetros. Bom equilíbrio entre qualidade e custo.',
  },
];

async function seedBaseModels(): Promise<Map<string, string>> {
  console.log('🤖 Criando modelos base...');

  const modelIds = new Map<string, string>();

  for (const modelData of BASE_MODELS) {
    const model = await prisma.baseModel.upsert({
      where: { name: modelData.name },
      update: {
        vendor: modelData.vendor,
        family: modelData.family,
        version: modelData.version,
        capabilities: modelData.capabilities,
        defaultParams: modelData.defaultParams,
        description: modelData.description,
        deprecated: false,
      },
      create: {
        name: modelData.name,
        vendor: modelData.vendor,
        family: modelData.family,
        version: modelData.version,
        capabilities: modelData.capabilities,
        defaultParams: modelData.defaultParams,
        description: modelData.description,
        deprecated: false,
      },
    });

    modelIds.set(modelData.name, model.id);
    console.log(`   ✅ Modelo criado: ${model.name} (ID: ${model.id})`);
  }

  return modelIds;
}

// ============================================================================
// SEED: MODEL DEPLOYMENTS
// ============================================================================

interface DeploymentData {
  baseModelName: string;
  deploymentId: string;
  inferenceType: InferenceType;
  costKey: keyof typeof BEDROCK_COSTS;
  providerConfig?: object;
}

const DEPLOYMENTS: DeploymentData[] = [
  {
    baseModelName: 'Claude 3.5 Sonnet v2',
    deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    inferenceType: INFERENCE_TYPE.ON_DEMAND,
    costKey: 'claude-3-5-sonnet-v2',
    providerConfig: {
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      defaultRegion: 'us-east-1',
    },
  },
  {
    baseModelName: 'Claude 3 Haiku',
    deploymentId: 'anthropic.claude-3-haiku-20240307-v1:0',
    inferenceType: INFERENCE_TYPE.ON_DEMAND,
    costKey: 'claude-3-haiku',
    providerConfig: {
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      defaultRegion: 'us-east-1',
    },
  },
  {
    baseModelName: 'Llama 3.1 70B Instruct',
    deploymentId: 'meta.llama3-1-70b-instruct-v1:0',
    inferenceType: INFERENCE_TYPE.ON_DEMAND,
    costKey: 'llama-3-1-70b',
    providerConfig: {
      regions: ['us-east-1', 'us-west-2'],
      defaultRegion: 'us-east-1',
    },
  },
];

async function seedModelDeployments(
  providerId: string,
  modelIds: Map<string, string>
): Promise<void> {
  console.log('🚀 Criando deployments...');

  for (const deploymentData of DEPLOYMENTS) {
    const baseModelId = modelIds.get(deploymentData.baseModelName);

    if (!baseModelId) {
      console.error(`   ❌ Modelo base não encontrado: ${deploymentData.baseModelName}`);
      continue;
    }

    const costs = BEDROCK_COSTS[deploymentData.costKey];

    // Upsert usando a constraint única (providerId, deploymentId)
    // Como Prisma não suporta upsert com constraint composta diretamente,
    // usamos findFirst + create/update
    const existing = await prisma.modelDeployment.findFirst({
      where: {
        providerId,
        deploymentId: deploymentData.deploymentId,
      },
    });

    if (existing) {
      // Update
      await prisma.modelDeployment.update({
        where: { id: existing.id },
        data: {
          baseModelId,
          inferenceType: deploymentData.inferenceType,
          costPer1MInput: costs.input,
          costPer1MOutput: costs.output,
          providerConfig: deploymentData.providerConfig,
          isActive: true,
        },
      });
      console.log(`   ✅ Deployment atualizado: ${deploymentData.deploymentId}`);
    } else {
      // Create
      const deployment = await prisma.modelDeployment.create({
        data: {
          baseModelId,
          providerId,
          deploymentId: deploymentData.deploymentId,
          inferenceType: deploymentData.inferenceType,
          costPer1MInput: costs.input,
          costPer1MOutput: costs.output,
          providerConfig: deploymentData.providerConfig,
          isActive: true,
        },
      });
      console.log(`   ✅ Deployment criado: ${deployment.deploymentId} (ID: ${deployment.id})`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('');
  console.log('🌱 ═══════════════════════════════════════════════════════════');
  console.log('   SEED CLEAN SLATE v2 - Sistema de Modelos');
  console.log('   Conforme: docs/CLEAN-SLATE-IMPLEMENTATION-PLAN.md');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // 1. Criar usuário de teste
  await seedTestUser();
  console.log('');

  // 2. Criar provider AWS Bedrock
  const providerId = await seedAwsBedrockProvider();
  console.log('');

  // 3. Criar modelos base
  const modelIds = await seedBaseModels();
  console.log('');

  // 4. Criar deployments
  await seedModelDeployments(providerId, modelIds);
  console.log('');

  // Resumo
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('');
  console.log('📊 Resumo:');
  console.log('   • 1 usuário de teste (leo@leo.com / leoleo)');
  console.log('   • 1 provider (AWS Bedrock)');
  console.log(`   • ${BASE_MODELS.length} modelos base (Claude 3.5 Sonnet, Claude 3 Haiku, Llama 3.1 70B)`);
  console.log(`   • ${DEPLOYMENTS.length} deployments ON_DEMAND`);
  console.log('');
  console.log('💡 Próximos passos:');
  console.log('   1. Execute a migration: npx prisma migrate deploy');
  console.log('   2. Execute este seed: npx prisma db seed');
  console.log('   3. Certifique os modelos via API ou frontend');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('❌ ERRO NO SEED:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
