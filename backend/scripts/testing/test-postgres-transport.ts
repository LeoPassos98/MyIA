// backend/scripts/test-postgres-transport.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Script de Teste - PostgreSQL Transport
 * 
 * Valida que o PostgresTransport está funcionando corretamente:
 * 1. Logs são persistidos no PostgreSQL
 * 2. Todos os campos são salvos corretamente
 * 3. Metadata e error são serializados como JSONB
 * 4. Performance é aceitável (< 100ms por log)
 * 
 * Referências:
 * - Plano: docs/LOGGING-IMPLEMENTATION-PLAN.md (Checkpoint 2.2.1)
 * - Transport: backend/src/utils/transports/postgresTransport.ts
 * 
 * Uso:
 * ```bash
 * cd backend
 * npx ts-node scripts/test-postgres-transport.ts
 * ```
 */

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Cores para output do terminal
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Helper para logs coloridos
 */
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Aguarda N milissegundos
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Teste 1: Log Simples
 */
async function testSimpleLog(): Promise<boolean> {
  log('\n📝 Teste 1: Log Simples', 'cyan');
  
  const testMessage = `Test log - ${Date.now()}`;
  const requestId = `test-${Date.now()}`;
  
  try {
    // Criar log
    logger.info(testMessage, { requestId });
    
    // Aguardar persistência (operação assíncrona)
    await sleep(1000);
    
    // Verificar no banco
    const logs = await prisma.log.findMany({
      where: { message: testMessage },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    
    if (logs.length === 0) {
      log('❌ FALHOU: Log não encontrado no banco', 'red');
      return false;
    }
    
    const savedLog = logs[0];
    
    // Validar campos
    if (savedLog.level !== 'info') {
      log(`❌ FALHOU: Level incorreto (esperado: info, recebido: ${savedLog.level})`, 'red');
      return false;
    }
    
    if (savedLog.requestId !== requestId) {
      log(`❌ FALHOU: RequestId incorreto (esperado: ${requestId}, recebido: ${savedLog.requestId})`, 'red');
      return false;
    }
    
    log('✅ PASSOU: Log simples persistido corretamente', 'green');
    log(`   - ID: ${savedLog.id}`, 'blue');
    log(`   - Level: ${savedLog.level}`, 'blue');
    log(`   - Message: ${savedLog.message}`, 'blue');
    log(`   - RequestId: ${savedLog.requestId}`, 'blue');
    log(`   - Timestamp: ${savedLog.timestamp.toISOString()}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ FALHOU: Erro ao testar log simples`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 2: Log com Metadata
 */
async function testLogWithMetadata(): Promise<boolean> {
  log('\n📝 Teste 2: Log com Metadata', 'cyan');
  
  const testMessage = `Test log with metadata - ${Date.now()}`;
  const requestId = `test-${Date.now()}`;
  const userId = 'user-123';
  const metadata = {
    provider: 'openai',
    model: 'gpt-4',
    tokensIn: 100,
    tokensOut: 50,
  };
  
  try {
    // Criar log
    logger.info(testMessage, {
      requestId,
      userId,
      metadata,
    });
    
    // Aguardar persistência
    await sleep(1000);
    
    // Verificar no banco
    const logs = await prisma.log.findMany({
      where: { message: testMessage },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    
    if (logs.length === 0) {
      log('❌ FALHOU: Log não encontrado no banco', 'red');
      return false;
    }
    
    const savedLog = logs[0];
    
    // Validar campos
    if (savedLog.userId !== userId) {
      log(`❌ FALHOU: UserId incorreto`, 'red');
      return false;
    }
    
    if (!savedLog.metadata) {
      log('❌ FALHOU: Metadata não salvo', 'red');
      return false;
    }
    
    const savedMetadata = savedLog.metadata as any;
    if (savedMetadata.provider !== metadata.provider) {
      log('❌ FALHOU: Metadata.provider incorreto', 'red');
      return false;
    }
    
    log('✅ PASSOU: Log com metadata persistido corretamente', 'green');
    log(`   - UserId: ${savedLog.userId}`, 'blue');
    log(`   - Metadata: ${JSON.stringify(savedLog.metadata)}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ FALHOU: Erro ao testar log com metadata`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 3: Log de Erro
 */
async function testErrorLog(): Promise<boolean> {
  log('\n📝 Teste 3: Log de Erro', 'cyan');
  
  const testMessage = `Test error log - ${Date.now()}`;
  const requestId = `test-${Date.now()}`;
  const error = new Error('Test error message');
  
  try {
    // Criar log de erro
    logger.error(testMessage, {
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    
    // Aguardar persistência
    await sleep(1000);
    
    // Verificar no banco
    const logs = await prisma.log.findMany({
      where: { message: testMessage },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    
    if (logs.length === 0) {
      log('❌ FALHOU: Log de erro não encontrado no banco', 'red');
      return false;
    }
    
    const savedLog = logs[0];
    
    // Validar campos
    if (savedLog.level !== 'error') {
      log(`❌ FALHOU: Level incorreto (esperado: error, recebido: ${savedLog.level})`, 'red');
      return false;
    }
    
    if (!savedLog.error) {
      log('❌ FALHOU: Error não salvo', 'red');
      return false;
    }
    
    const savedError = savedLog.error as any;
    if (savedError.message !== error.message) {
      log('❌ FALHOU: Error.message incorreto', 'red');
      return false;
    }
    
    log('✅ PASSOU: Log de erro persistido corretamente', 'green');
    log(`   - Level: ${savedLog.level}`, 'blue');
    log(`   - Error: ${JSON.stringify(savedLog.error)}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ FALHOU: Erro ao testar log de erro`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 4: Performance
 */
async function testPerformance(): Promise<boolean> {
  log('\n📝 Teste 4: Performance', 'cyan');
  
  const iterations = 10;
  const testMessage = `Performance test - ${Date.now()}`;
  
  try {
    const start = Date.now();
    
    // Criar múltiplos logs
    for (let i = 0; i < iterations; i++) {
      logger.info(`${testMessage} - ${i}`, {
        requestId: `perf-test-${i}`,
        iteration: i,
      });
    }
    
    const duration = Date.now() - start;
    const avgPerLog = duration / iterations;
    
    log(`   - Total: ${duration}ms`, 'blue');
    log(`   - Média por log: ${avgPerLog.toFixed(2)}ms`, 'blue');
    
    if (avgPerLog > 100) {
      log(`❌ FALHOU: Performance ruim (esperado: < 100ms, recebido: ${avgPerLog.toFixed(2)}ms)`, 'red');
      return false;
    }
    
    log('✅ PASSOU: Performance aceitável', 'green');
    
    return true;
  } catch (error) {
    log(`❌ FALHOU: Erro ao testar performance`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 5: Verificar Logs no Banco
 */
async function testDatabaseQuery(): Promise<boolean> {
  log('\n📝 Teste 5: Query no Banco', 'cyan');
  
  try {
    // Buscar últimos 5 logs
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });
    
    if (logs.length === 0) {
      log('❌ FALHOU: Nenhum log encontrado no banco', 'red');
      return false;
    }
    
    log(`✅ PASSOU: ${logs.length} logs encontrados no banco`, 'green');
    
    logs.forEach((log, index) => {
      console.log(`\n   Log ${index + 1}:`);
      console.log(`   - ID: ${log.id}`);
      console.log(`   - Level: ${log.level}`);
      console.log(`   - Message: ${log.message}`);
      console.log(`   - Timestamp: ${log.timestamp.toISOString()}`);
      console.log(`   - RequestId: ${log.requestId || 'N/A'}`);
      console.log(`   - UserId: ${log.userId || 'N/A'}`);
    });
    
    return true;
  } catch (error) {
    log(`❌ FALHOU: Erro ao buscar logs no banco`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runTests() {
  log('\n🚀 Iniciando Testes do PostgreSQL Transport', 'yellow');
  log('='.repeat(50), 'yellow');
  
  const results = {
    simpleLog: false,
    metadata: false,
    errorLog: false,
    performance: false,
    databaseQuery: false,
  };
  
  try {
    // Conectar ao banco
    await prisma.$connect();
    log('✅ Conectado ao PostgreSQL', 'green');
    
    // Executar testes
    results.simpleLog = await testSimpleLog();
    results.metadata = await testLogWithMetadata();
    results.errorLog = await testErrorLog();
    results.performance = await testPerformance();
    results.databaseQuery = await testDatabaseQuery();
    
    // Resumo
    log('\n' + '='.repeat(50), 'yellow');
    log('📊 RESUMO DOS TESTES', 'yellow');
    log('='.repeat(50), 'yellow');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`${icon} ${test}`, color);
    });
    
    log('\n' + '='.repeat(50), 'yellow');
    log(`RESULTADO: ${passed}/${total} testes passaram`, passed === total ? 'green' : 'red');
    log('='.repeat(50), 'yellow');
    
    if (passed === total) {
      log('\n🎉 CHECKPOINT 2.2.1 PASSOU: Transport PostgreSQL funcionando!', 'green');
    } else {
      log('\n❌ CHECKPOINT 2.2.1 FALHOU: Corrigir erros acima', 'red');
    }
    
  } catch (error) {
    log('\n❌ ERRO FATAL: Falha ao executar testes', 'red');
    console.error(error);
  } finally {
    // Desconectar do banco
    await prisma.$disconnect();
    log('\n✅ Desconectado do PostgreSQL', 'green');
  }
}

// Executar testes
runTests();
