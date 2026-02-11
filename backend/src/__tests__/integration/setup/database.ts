// backend/src/__tests__/integration/setup/testDatabase.ts
// Standards: docs/STANDARDS.md

import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma para testes de integração
 * Usa o mesmo banco de dados configurado em DATABASE_URL
 * 
 * IMPORTANTE: Os testes de integração usam o banco real (não SQLite in-memory)
 * para garantir compatibilidade total com PostgreSQL e suas extensões (pgvector)
 */
const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Limpa todas as tabelas relacionadas aos testes de integração da API v2
 * Ordem de deleção respeita as foreign keys
 */
export async function cleanupTestData(): Promise<void> {
  // Deletar em ordem reversa de dependências
  await prisma.modelCertification.deleteMany({
    where: { deployment: { deploymentId: { startsWith: 'test-' } } }
  });
  await prisma.modelDeployment.deleteMany({
    where: { deploymentId: { startsWith: 'test-' } }
  });
  await prisma.baseModel.deleteMany({
    where: { name: { startsWith: 'Test ' } }
  });
  await prisma.provider.deleteMany({
    where: { slug: { startsWith: 'test-' } }
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-' } }
  });
}

/**
 * Limpa dados de teste específicos por prefixo
 */
export async function cleanupByPrefix(prefix: string): Promise<void> {
  await prisma.modelCertification.deleteMany({
    where: { deployment: { deploymentId: { startsWith: prefix } } }
  });
  await prisma.modelDeployment.deleteMany({
    where: { deploymentId: { startsWith: prefix } }
  });
  await prisma.baseModel.deleteMany({
    where: { name: { startsWith: prefix } }
  });
  await prisma.provider.deleteMany({
    where: { slug: { startsWith: prefix } }
  });
}

/**
 * Conecta ao banco de dados
 */
export async function connectTestDb(): Promise<void> {
  await prisma.$connect();
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Verifica se o banco está acessível
 */
export async function isDbHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { prisma };
