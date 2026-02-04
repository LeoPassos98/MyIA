// backend/scripts/test-logs-api.ts
// Script para testar a API de busca de logs

import { prisma } from '../src/lib/prisma';
import { logger } from '../src/utils/logger';

async function seedTestLogs() {
  console.log('🌱 Populando logs de teste...');

  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testRequestId = 'req-test-123';

  // Criar logs de diferentes níveis
  const logs = [
    {
      level: 'info',
      message: 'Usuário fez login com sucesso',
      userId: testUserId,
      requestId: testRequestId,
      metadata: { action: 'login', ip: '192.168.1.1' }
    },
    {
      level: 'info',
      message: 'Requisição processada com sucesso',
      userId: testUserId,
      requestId: testRequestId,
      metadata: { duration: 45, status: 200 }
    },
    {
      level: 'warn',
      message: 'Taxa de requisições próxima do limite',
      userId: testUserId,
      metadata: { current: 95, limit: 100 }
    },
    {
      level: 'error',
      message: 'Falha ao conectar com provider externo',
      userId: testUserId,
      inferenceId: 'inf-test-456',
      metadata: { provider: 'groq', error: 'Connection timeout' },
      error: { code: 'ETIMEDOUT', message: 'Connection timeout' }
    },
    {
      level: 'error',
      message: 'Erro ao processar inferência',
      userId: testUserId,
      inferenceId: 'inf-test-789',
      metadata: { provider: 'anthropic', model: 'claude-3-sonnet' },
      error: { code: 'API_ERROR', message: 'Rate limit exceeded' }
    },
    {
      level: 'debug',
      message: 'Cache hit para embedding',
      metadata: { cacheKey: 'emb-123', hitRate: 0.85 }
    },
    {
      level: 'info',
      message: 'Embedding gerado com sucesso',
      metadata: { dimensions: 1536, model: 'text-embedding-ada-002' }
    }
  ];

  for (const log of logs) {
    await prisma.log.create({ data: log });
  }

  console.log(`✅ ${logs.length} logs de teste criados`);
}

async function testAPI() {
  console.log('\n🧪 Testando API de Logs...\n');

  const baseUrl = 'http://localhost:3001/api/logs';
  
  // Você precisa de um token válido - faça login primeiro
  // Para este teste, vamos apenas mostrar os comandos curl
  
  console.log('📋 Comandos de teste (use um token válido):');
  console.log('\n1. Buscar todos os logs (paginado):');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?page=1&limit=20"`);
  
  console.log('\n2. Buscar logs de erro:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?level=error"`);
  
  console.log('\n3. Buscar logs de um usuário específico:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?userId=550e8400-e29b-41d4-a716-446655440000"`);
  
  console.log('\n4. Buscar logs por requestId (correlação):');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}/request/req-test-123"`);
  
  console.log('\n5. Buscar logs com range de datas:');
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?startDate=${yesterday}&endDate=${now}"`);
  
  console.log('\n6. Buscar logs com texto:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?search=provider"`);
  
  console.log('\n7. Buscar erros recentes:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}/errors/recent?limit=10"`);
  
  console.log('\n8. Estatísticas de logs:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}/stats"`);
  
  console.log('\n9. Buscar log por ID:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}/LOG_ID_HERE"`);
  
  console.log('\n10. Buscar com múltiplos filtros:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${baseUrl}?level=error&userId=550e8400-e29b-41d4-a716-446655440000&sort=desc&limit=5"`);
}

async function main() {
  try {
    await seedTestLogs();
    await testAPI();
    
    console.log('\n✅ Script concluído!');
    console.log('\n💡 Dica: Use o script test-postgres-transport.ts para gerar logs reais via logger');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
