/// <reference types="node" />
// backend/prisma/seed.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type TraceStepRole = 'system' | 'user' | 'assistant' | 'tool';

type PromptTraceStep = {
  stepId: string;
  stepNumber: number;
  role: TraceStepRole;
  content: string;
  usage?: {
    tokensIn?: number;
    tokensOut?: number;
    totalTokens?: number;
    costInUSD?: number;
  };
  // timestamp?: string; // <- deliberadamente em suspensão
};

type PromptTraceRecord = {
  traceId: string;
  messageId: string;
  chatId: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  modelInfo: {
    provider: string;
    model: string;
    temperature: number;
  };
  steps: PromptTraceStep[];
  totalUsage: {
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
    costInUSD: number;
  };
  metadata: {
    strategy: string;
    contextWindowSize: number;
    ragEnabled: boolean;
    rawConfig: {
      mode: string;
      model: string;
      provider: string;
      timestamp: string;
      strategy: string;
      params: {
        temperature: number;
        topK: number;
        memoryWindow: number;
      };
    };
  };
};

function nowPlusMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function estimateCostUSD(tokensIn: number, tokensOut: number) {
  // Seed fake: custo “plausível” mas não real. Mantém coerência visual.
  const inCostPer1k = 0.0002; // 0.20 / 1M
  const outCostPer1k = 0.0002;
  const cost = (tokensIn / 1000) * inCostPer1k + (tokensOut / 1000) * outCostPer1k;
  return Number(cost.toFixed(6));
}

function makeTracePayload(params: {
  traceId: string;
  messageId: string;
  chatId: string;
  timestampISO: string;
  provider: string;
  model: string;
  temperature: number;
  strategy: string;
  topK: number;
  memoryWindow: number;
  contextWindowSize: number;
  ragEnabled: boolean;
  steps: PromptTraceStep[];
  tokensIn: number;
  tokensOut: number;
  costInUSD: number;
}): PromptTraceRecord {
  const totalTokens = params.tokensIn + params.tokensOut;

  return {
    traceId: params.traceId,
    messageId: params.messageId,
    chatId: params.chatId,
    timestamp: params.timestampISO,
    status: 'success',
    modelInfo: {
      provider: params.provider,
      model: params.model,
      temperature: params.temperature,
    },
    steps: params.steps,
    totalUsage: {
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      totalTokens,
      costInUSD: params.costInUSD,
    },
    metadata: {
      strategy: params.strategy,
      contextWindowSize: params.contextWindowSize,
      ragEnabled: params.ragEnabled,
      rawConfig: {
        mode: 'auto',
        model: params.model,
        provider: params.provider,
        timestamp: params.timestampISO,
        strategy: params.strategy,
        params: {
          temperature: params.temperature,
          topK: params.topK,
          memoryWindow: params.memoryWindow,
        },
      },
    },
  };
}

async function seedProvidersAndModels() {
  console.log('🌱 Seeding providers e modelos...');

  // --- OpenAI ---
  const openai = await prisma.aIProvider.upsert({
    where: { slug: 'openai' },
    update: {
      isActive: true,
      name: 'OpenAI',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    },
    create: {
      name: 'OpenAI',
      slug: 'openai',
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
      models: {
        create: [
          {
            name: 'GPT-4 Turbo',
            apiModelId: 'gpt-4-turbo',
            contextWindow: 128000,
            costPer1kInput: 0.01,
            costPer1kOutput: 0.03,
          },
          {
            name: 'GPT-3.5 Turbo',
            apiModelId: 'gpt-3.5-turbo',
            contextWindow: 16000,
            costPer1kInput: 0.0005,
            costPer1kOutput: 0.0015,
          },
        ],
      },
    },
    include: { models: true },
  });
  console.log(`✅ OpenAI OK (ID: ${openai.id}, models: ${openai.models.length})`);

  // --- Groq ---
  const groq = await prisma.aIProvider.upsert({
    where: { slug: 'groq' },
    update: {
      isActive: true,
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      websiteUrl: 'https://groq.com',
    },
    create: {
      name: 'Groq',
      slug: 'groq',
      isActive: true,
      baseUrl: 'https://api.groq.com/openai/v1',
      websiteUrl: 'https://groq.com',
      models: {
        create: [
          { name: 'Llama 3.3 70B', apiModelId: 'llama-3.3-70b-versatile', contextWindow: 128000 },
          { name: 'Llama 3.1 8B', apiModelId: 'llama-3.1-8b-instant', contextWindow: 128000 },
        ],
      },
    },
    include: { models: true },
  });
  console.log(`✅ Groq OK (ID: ${groq.id}, models: ${groq.models.length})`);

  // --- Together ---
  const together = await prisma.aIProvider.upsert({
    where: { slug: 'together' },
    update: {
      isActive: true,
      name: 'Together AI',
      baseUrl: 'https://api.together.xyz/v1',
    },
    create: {
      name: 'Together AI',
      slug: 'together',
      isActive: true,
      baseUrl: 'https://api.together.xyz/v1',
      models: {
        create: [
          { name: 'Llama 3 70B (Together)', apiModelId: 'meta-llama/Llama-3-70b-chat-hf', contextWindow: 8192 },
          { name: 'Qwen 1.5 72B', apiModelId: 'Qwen/Qwen1.5-72B-Chat', contextWindow: 32000 },
        ],
      },
    },
    include: { models: true },
  });
  console.log(`✅ Together OK (ID: ${together.id}, models: ${together.models.length})`);

  return { openai, groq, together };
}

async function seedUser() {
  console.log('👤 Seeding usuário leo@leo.com ...');

  const passwordHash = await bcrypt.hash('leoleo', 10);

  const user = await prisma.user.upsert({
    where: { email: 'leo@leo.com' },
    update: {
      password: passwordHash,
      name: 'Leo',
    },
    create: {
      email: 'leo@leo.com',
      password: passwordHash,
      name: 'Leo',
      settings: {
        create: {
          theme: 'light',
          // chaves podem ficar null no seed
          openaiApiKey: null,
          groqApiKey: null,
          claudeApiKey: null,
          togetherApiKey: null,
          perplexityApiKey: null,
          mistralApiKey: null,
        },
      },
    },
    include: { settings: true },
  });

  console.log(`✅ User OK (ID: ${user.id})`);
  return user;
}

async function seedChatsAndMessages(userId: string) {
  console.log('💬 Seeding chats + mensagens + sentContext...');

  const baseTime = new Date('2025-12-26T13:30:00.000Z');
  const provider = 'groq';
  const model = 'llama-3.1-8b-instant';
  const temperature = 0.7;

  const chatsSpec = [
    {
      title: 'Continuidade e Intuição',
      messages: [
        { role: 'user', content: 'o que é continuidade?' },
        { role: 'assistant', content: 'Continuidade é a propriedade de algo variar sem “saltos”. Em matemática, uma função é contínua quando pequenas mudanças na entrada geram pequenas mudanças na saída.' },
        { role: 'user', content: 'o que continuidade tem a ver com intuição?' },
        { role: 'assistant', content: 'Uma leitura possível é que a intuição “preenche” lacunas usando padrões contínuos: seu cérebro extrapola o que vem a seguir com base no que já viu, sem precisar de um raciocínio passo-a-passo explícito.' },
      ],
    },
    {
      title: 'Resumo para prova',
      messages: [
        { role: 'user', content: 'resume recursão em 5 linhas' },
        { role: 'assistant', content: 'Recursão é quando uma função chama a si mesma para resolver subproblemas. Ela precisa de um caso base para parar. Cada chamada reduz o problema. É muito usada em árvores e divisão-e-conquista. Pode trocar por loop em muitos casos.' },
        { role: 'user', content: 'me dá um exemplo em Java' },
        { role: 'assistant', content: 'Exemplo clássico: fatorial. `int fat(int n){ if(n<=1) return 1; return n*fat(n-1); }`' },
      ],
    },
    {
      title: 'Dúvidas de banco',
      messages: [
        { role: 'user', content: 'qual a diferença entre chave primária e estrangeira?' },
        { role: 'assistant', content: 'Primária identifica unicamente uma linha na própria tabela. Estrangeira aponta para a primária de outra tabela, criando relacionamento e garantindo integridade referencial.' },
        { role: 'user', content: 'e índice, quando usar?' },
        { role: 'assistant', content: 'Índices aceleram buscas/joins/ordenação, mas custam escrita e espaço. Use em colunas filtradas com frequência, chaves de join e colunas usadas em ORDER BY.' },
      ],
    },
  ];

  // Cria os chats
  const createdChats = [];
  for (let i = 0; i < chatsSpec.length; i++) {
    const c = chatsSpec[i];
    const chat = await prisma.chat.create({
      data: {
        title: c.title,
        provider,
        userId,
        createdAt: nowPlusMinutes(baseTime, i * 15),
        updatedAt: nowPlusMinutes(baseTime, i * 15 + 1),
      },
    });
    createdChats.push(chat);
  }

  // Cria mensagens e sentContext para assistants
  for (let i = 0; i < createdChats.length; i++) {
    const chat = createdChats[i];
    const spec = chatsSpec[i];

    const systemPrompt = 'Você é uma IA útil e direta.';
    const memoryWindow = 10;
    const topK = 5;
    const strategy = 'efficient';

    const runningSteps: PromptTraceStep[] = [
      {
        stepId: `req-1`,
        stepNumber: 1,
        role: 'system',
        content: systemPrompt,
      },
    ];

    let minuteOffset = i * 15;

    for (let j = 0; j < spec.messages.length; j++) {
      const m = spec.messages[j];
      minuteOffset += 1;

      const createdAt = nowPlusMinutes(baseTime, minuteOffset);

      const msg = await prisma.message.create({
        data: {
          role: m.role,
          content: m.content,
          createdAt,
          chatId: chat.id,
          // telemetria e sentContext vão ser preenchidos só para assistant abaixo
        },
      });

      // adiciona step “real” ao trace em memória (sem timestamps por step)
      runningSteps.push({
        stepId: m.role === 'assistant' ? `res-${Math.ceil((j + 1) / 2)}` : `req-${j + 2}`,
        stepNumber: runningSteps.length + 1,
        role: m.role as TraceStepRole,
        content: m.content,
      });

      // quando for assistant: gera sentContext com trace completo até aqui
      if (m.role === 'assistant') {
        const tokensIn = 250 + j * 40 + i * 30;   // fake, mas consistente
        const tokensOut = 300 + j * 60 + i * 20;  // fake, mas consistente
        const costInUSD = estimateCostUSD(tokensIn, tokensOut);

        // adiciona usage opcional em alguns steps (pra timeline ficar interessante)
        const stepsWithUsage: PromptTraceStep[] = runningSteps.map((s) => {
          if (s.role !== 'assistant') return s;
          return {
            ...s,
            usage: {
              tokensOut: tokensOut,
              totalTokens: tokensOut,
            },
          };
        });

        const tracePayload = makeTracePayload({
          traceId: msg.id,
          messageId: msg.id,
          chatId: chat.id,
          timestampISO: createdAt.toISOString(),
          provider,
          model,
          temperature,
          strategy,
          topK,
          memoryWindow,
          contextWindowSize: memoryWindow,
          ragEnabled: false,
          steps: stepsWithUsage,
          tokensIn,
          tokensOut,
          costInUSD,
        });

        await prisma.message.update({
          where: { id: msg.id },
          data: {
            provider,
            model,
            tokensIn,
            tokensOut,
            costInUSD,
            sentContext: JSON.stringify(tracePayload),
          },
        });

        // também joga um ApiCallLog pra aplicação ter “telemetria geral”
        await prisma.apiCallLog.create({
          data: {
            provider,
            model,
            tokensIn,
            tokensOut,
            costInUSD,
            wordsIn: 0,
            wordsOut: 0,
            bytesIn: 0,
            bytesOut: 0,
            userId,
            timestamp: createdAt,
          },
        });

        // atualiza updatedAt do chat
        await prisma.chat.update({
          where: { id: chat.id },
          data: { updatedAt: createdAt },
        });
      }
    }
  }

  console.log('✅ Chats + mensagens + traces OK');
}

async function main() {
  console.log('🌱 Iniciando seed completo do MyIA...');

    console.log('🌱 Populando Provedores de IA...');

    const providers = [
      { name: 'OpenAI', slug: 'openai' },
      { name: 'Groq', slug: 'groq' },
      { name: 'Together AI', slug: 'together' },
      { name: 'AWS Bedrock', slug: 'bedrock' }
    ];

    for (const p of providers) {
      await prisma.aIProvider.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          name: p.name,
          slug: p.slug,
          isActive: true
        }
      });
    }

    console.log('✅ Seed finalizado com sucesso!');

    await seedProvidersAndModels();
  const user = await seedUser();
  await seedChatsAndMessages(user.id);

  console.log('🏁 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
