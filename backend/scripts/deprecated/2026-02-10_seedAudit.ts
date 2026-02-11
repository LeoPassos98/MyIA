// backend/scripts/seedAudit.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE SEM CONHECIMENTO

import { prisma } from '../src/lib/prisma';
import { getProviderInfo } from '../src/config/providerMap';

// ============================
// CONFIGURAÇÃO
// ============================

const TARGET_USER_EMAIL = 'teste@teste.com'; // 🔴 AJUSTE AQUI
const DAYS = 30;

const PROVIDERS = [
  { provider: 'groq', model: 'llama-3.1-8b-instant' },
  { provider: 'openai', model: 'gpt-4o-mini' },
  { provider: 'mistral', model: 'mistral-small-latest' },
  { provider: 'claude', model: 'claude-3-5-sonnet-20241022' }
];

// ============================
// HELPERS
// ============================

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(rand(8, 22), rand(0, 59), rand(0, 59));
  return d;
}

// ============================
// MAIN
// ============================

async function main() {
  console.log('🔎 Procurando usuário...');

  const user = await prisma.user.findUnique({
    where: { email: TARGET_USER_EMAIL }
  });

  if (!user) {
    throw new Error(`Usuário não encontrado: ${TARGET_USER_EMAIL}`);
  }

  console.log(`✅ Usuário encontrado: ${user.email}`);

  // Chat sintético
  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      provider: 'synthetic',
      title: 'Synthetic Audit Data'
    }
  });

  console.log('🧪 Criando dados sintéticos de auditoria...');

  for (let day = 0; day < DAYS; day++) {
    const entriesPerDay = rand(3, 8);

    for (let i = 0; i < entriesPerDay; i++) {
      const pick = PROVIDERS[rand(0, PROVIDERS.length - 1)];
      const providerInfo = getProviderInfo(pick.model);

      const tokensIn = rand(200, 3500);
      const tokensOut = rand(100, 1500);

      const cost =
        (tokensIn / 1_000_000) * providerInfo.costIn +
        (tokensOut / 1_000_000) * providerInfo.costOut;

      await prisma.message.create({
        data: {
          role: 'assistant',
          content: '[SYNTHETIC DATA] Resposta simulada para auditoria.',
          chatId: chat.id,
          provider: pick.provider,
          model: pick.model,
          tokensIn,
          tokensOut,
          costInUSD: cost,
          createdAt: randomPastDate(day),
          sentContext: JSON.stringify({
            meta: {
              isSynthetic: true,
              generatedAt: new Date().toISOString()
            }
          })
        }
      });
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch(err => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
