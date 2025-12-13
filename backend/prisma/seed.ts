/// <reference types="node" />
// backend/prisma/seed.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // --- 1. OpenAI ---
  const openai = await prisma.aIProvider.upsert({
    where: { slug: 'openai' },
    update: {},
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
            costPer1kOutput: 0.03 
          },
          { 
            name: 'GPT-3.5 Turbo', 
            apiModelId: 'gpt-3.5-turbo', 
            contextWindow: 16000, 
            costPer1kInput: 0.0005, 
            costPer1kOutput: 0.0015 
          },
        ],
      },
    },
  });
  console.log(`✅ OpenAI configurado (ID: ${openai.id})`);

  // --- 2. Groq (Super Rápido) ---
  const groq = await prisma.aIProvider.upsert({
    where: { slug: 'groq' },
    update: {},
    create: {
      name: 'Groq',
      slug: 'groq',
      isActive: true,
      baseUrl: 'https://api.groq.com/openai/v1',
      websiteUrl: 'https://groq.com',
      models: {
        create: [
          // IDs atualizados em 13/12/2025
          { name: 'Llama 3.3 70B', apiModelId: 'llama-3.3-70b-versatile', contextWindow: 128000 },
          { name: 'Llama 3.1 8B', apiModelId: 'llama-3.1-8b-instant', contextWindow: 128000 },
        ],
      },
    },
  });
  console.log(`✅ Groq configurado (ID: ${groq.id})`);

  // --- 3. Together AI ---
  const together = await prisma.aIProvider.upsert({
    where: { slug: 'together' },
    update: {},
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
  });
  console.log(`✅ Together AI configurado (ID: ${together.id})`);

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