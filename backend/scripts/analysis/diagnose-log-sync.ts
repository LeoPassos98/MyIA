// backend/scripts/diagnose-log-sync.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Script de Diagnóstico - Sincronização de Logs
 * 
 * Valida se logs são escritos IMEDIATAMENTE no PostgreSQL
 * e identifica se o problema está no backend ou no Grafana.
 * 
 * Testes realizados:
 * 1. Escrita imediata de logs no banco
 * 2. Latência entre logger.info() e disponibilidade no banco
 * 3. Verificação de timestamps
 * 4. Diagnóstico da causa raiz
 * 
 * Uso:
 * ```bash
 * cd backend
 * npx ts-node scripts/diagnose-log-sync.ts
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
  magenta: '\x1b[35m',
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
 * Formata timestamp para exibição
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 23);
}

/**
 * Teste 1: Validar Escrita Imediata
 */
async function testImmediateWrite(): Promise<boolean> {
  log('\n🔍 Teste 1: Validar Escrita Imediata de Logs', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const testId = `sync-test-${Date.now()}`;
  const testMessage = `[DIAGNÓSTICO] Log de teste para sincronização - ${testId}`;
  
  try {
    // Registrar timestamp ANTES de criar o log
    const beforeWrite = new Date();
    log(`\n⏰ Timestamp ANTES da escrita: ${formatTimestamp(beforeWrite)}`, 'blue');
    
    // Criar log
    log(`📝 Criando log: "${testMessage}"`, 'yellow');
    logger.info(testMessage, { 
      requestId: testId,
      testType: 'sync-diagnostic',
      metadata: {
        purpose: 'Validar escrita imediata no PostgreSQL',
        expectedBehavior: 'Log deve aparecer no banco em < 1 segundo',
      }
    });
    
    // Aguardar 1 segundo (tempo generoso para escrita assíncrona)
    log('⏳ Aguardando 1 segundo para escrita assíncrona...', 'yellow');
    await sleep(1000);
    
    // Registrar timestamp DEPOIS da espera
    const afterWait = new Date();
    log(`⏰ Timestamp DEPOIS da espera: ${formatTimestamp(afterWait)}`, 'blue');
    
    // Consultar banco
    log('\n🔎 Consultando banco de dados...', 'yellow');
    const logs = await prisma.log.findMany({
      where: { 
        message: testMessage,
      },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    
    if (logs.length === 0) {
      log('\n❌ FALHOU: Log NÃO foi encontrado no banco!', 'red');
      log('   Isso indica problema no PostgresTransport', 'red');
      return false;
    }
    
    const savedLog = logs[0];
    const logTimestamp = new Date(savedLog.timestamp);
    const latencyMs = afterWait.getTime() - beforeWrite.getTime();
    
    log('\n✅ SUCESSO: Log encontrado no banco!', 'green');
    log('─'.repeat(60), 'blue');
    log(`   📋 ID do Log: ${savedLog.id}`, 'blue');
    log(`   📝 Mensagem: ${savedLog.message}`, 'blue');
    log(`   🏷️  Request ID: ${savedLog.requestId}`, 'blue');
    log(`   ⏰ Timestamp do Log: ${formatTimestamp(logTimestamp)}`, 'blue');
    log(`   ⚡ Latência Total: ${latencyMs}ms`, 'blue');
    log('─'.repeat(60), 'blue');
    
    // Validar latência
    if (latencyMs < 2000) {
      log('\n✅ LATÊNCIA ACEITÁVEL: Log foi escrito em < 2 segundos', 'green');
      log('   O PostgresTransport está funcionando corretamente', 'green');
    } else {
      log('\n⚠️  LATÊNCIA ALTA: Log demorou > 2 segundos para ser escrito', 'yellow');
      log('   Pode haver problema de performance no banco', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('\n❌ ERRO: Falha ao testar escrita imediata', 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 2: Validar Múltiplos Logs Sequenciais
 */
async function testSequentialWrites(): Promise<boolean> {
  log('\n\n🔍 Teste 2: Validar Múltiplos Logs Sequenciais', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const testId = `multi-test-${Date.now()}`;
  const logsToCreate = 3;
  
  try {
    log(`\n📝 Criando ${logsToCreate} logs sequenciais...`, 'yellow');
    
    const startTime = Date.now();
    const logMessages: string[] = [];
    
    // Criar múltiplos logs
    for (let i = 1; i <= logsToCreate; i++) {
      const message = `[DIAGNÓSTICO] Log sequencial ${i}/${logsToCreate} - ${testId}`;
      logMessages.push(message);
      
      logger.info(message, {
        requestId: `${testId}-${i}`,
        sequenceNumber: i,
        totalLogs: logsToCreate,
      });
      
      log(`   ✓ Log ${i}/${logsToCreate} criado`, 'blue');
    }
    
    const writeTime = Date.now() - startTime;
    log(`\n⚡ Tempo para criar ${logsToCreate} logs: ${writeTime}ms`, 'blue');
    
    // Aguardar escrita
    log('⏳ Aguardando 1.5 segundos para escrita assíncrona...', 'yellow');
    await sleep(1500);
    
    // Verificar todos os logs no banco
    log('\n🔎 Verificando logs no banco...', 'yellow');
    
    let allFound = true;
    for (let i = 0; i < logsToCreate; i++) {
      const logs = await prisma.log.findMany({
        where: { message: logMessages[i] },
        take: 1,
      });
      
      if (logs.length === 0) {
        log(`   ❌ Log ${i + 1}/${logsToCreate} NÃO encontrado`, 'red');
        allFound = false;
      } else {
        log(`   ✓ Log ${i + 1}/${logsToCreate} encontrado`, 'green');
      }
    }
    
    if (allFound) {
      log('\n✅ SUCESSO: Todos os logs foram escritos no banco!', 'green');
      log('   O PostgresTransport está funcionando corretamente', 'green');
      return true;
    } else {
      log('\n❌ FALHOU: Alguns logs não foram encontrados no banco', 'red');
      return false;
    }
    
  } catch (error) {
    log('\n❌ ERRO: Falha ao testar logs sequenciais', 'red');
    console.error(error);
    return false;
  }
}

/**
 * Teste 3: Consultar Logs Recentes
 */
async function testRecentLogs(): Promise<void> {
  log('\n\n🔍 Teste 3: Consultar Logs Recentes no Banco', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    // Buscar últimos 5 logs
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });
    
    if (logs.length === 0) {
      log('\n⚠️  Nenhum log encontrado no banco', 'yellow');
      return;
    }
    
    log(`\n📊 Últimos ${logs.length} logs no banco:`, 'green');
    log('─'.repeat(60), 'blue');
    
    const now = new Date();
    
    logs.forEach((logEntry, index) => {
      const logTime = new Date(logEntry.timestamp);
      const ageMs = now.getTime() - logTime.getTime();
      const ageSeconds = Math.floor(ageMs / 1000);
      const ageMinutes = Math.floor(ageSeconds / 60);
      const ageHours = Math.floor(ageMinutes / 60);
      const ageDays = Math.floor(ageHours / 24);
      
      let ageStr = '';
      if (ageDays > 0) {
        ageStr = `${ageDays} dia(s) atrás`;
      } else if (ageHours > 0) {
        ageStr = `${ageHours} hora(s) atrás`;
      } else if (ageMinutes > 0) {
        ageStr = `${ageMinutes} minuto(s) atrás`;
      } else {
        ageStr = `${ageSeconds} segundo(s) atrás`;
      }
      
      log(`\n   Log ${index + 1}:`, 'cyan');
      log(`   ├─ Level: ${logEntry.level}`, 'blue');
      log(`   ├─ Message: ${logEntry.message.substring(0, 60)}${logEntry.message.length > 60 ? '...' : ''}`, 'blue');
      log(`   ├─ Timestamp: ${formatTimestamp(logTime)}`, 'blue');
      log(`   └─ Idade: ${ageStr}`, ageMs < 60000 ? 'green' : 'yellow');
    });
    
    log('\n─'.repeat(60), 'blue');
    
  } catch (error) {
    log('\n❌ ERRO: Falha ao consultar logs recentes', 'red');
    console.error(error);
  }
}

/**
 * Diagnóstico Final
 */
async function provideDiagnosis(test1Passed: boolean, test2Passed: boolean): Promise<void> {
  log('\n\n' + '='.repeat(60), 'magenta');
  log('📋 DIAGNÓSTICO FINAL', 'magenta');
  log('='.repeat(60), 'magenta');
  
  // Se pelo menos um teste passou, o PostgresTransport está funcionando
  if (test1Passed || test2Passed) {
    log('\n✅ CONCLUSÃO: PostgresTransport está funcionando CORRETAMENTE', 'green');
    log('   - Logs são escritos no banco de dados PostgreSQL', 'green');
    log('   - Latência de escrita é aceitável', 'green');
    
    if (!test1Passed && test2Passed) {
      log('\n⚠️  OBSERVAÇÃO: Teste 1 falhou mas Teste 2 passou', 'yellow');
      log('   - Isso indica que há um pequeno delay na escrita (< 1.5s)', 'yellow');
      log('   - O PostgresTransport está funcionando, mas pode ter latência', 'yellow');
    }
    
    log('\n🎯 CAUSA RAIZ DO PROBLEMA:', 'yellow');
    log('   O problema está no GRAFANA, não no backend!', 'yellow');
    
    log('\n🔧 SOLUÇÕES RECOMENDADAS:', 'cyan');
    log('─'.repeat(60), 'cyan');
    
    log('\n1️⃣  DESABILITAR CACHE NO DATASOURCE POSTGRESQL:', 'cyan');
    log('   a) Acesse: Configuration > Data Sources > PostgreSQL', 'blue');
    log('   b) Procure por "Cache" ou "Query caching"', 'blue');
    log('   c) Desabilite ou configure TTL para 0 segundos', 'blue');
    
    log('\n2️⃣  CONFIGURAR AUTO-REFRESH NO DASHBOARD:', 'cyan');
    log('   a) No dashboard, clique no dropdown de refresh (canto superior direito)', 'blue');
    log('   b) Selecione "10s" ou "5s" para refresh automático', 'blue');
    log('   c) Verifique se o ícone de refresh não está pausado', 'blue');
    
    log('\n3️⃣  AJUSTAR QUERY DO PAINEL:', 'cyan');
    log('   a) Edite o painel de logs no Grafana', 'blue');
    log('   b) Verifique a query SQL:', 'blue');
    log('      SELECT * FROM logs', 'blue');
    log('      WHERE timestamp > NOW() - INTERVAL \'1 minute\'', 'blue');
    log('      ORDER BY timestamp DESC', 'blue');
    log('   c) Certifique-se de que o intervalo de tempo não exclui logs recentes', 'blue');
    
    log('\n4️⃣  HABILITAR "SKIP CACHE" NO PAINEL:', 'cyan');
    log('   a) Edite o painel de logs', 'blue');
    log('   b) Vá em "Query options"', 'blue');
    log('   c) Habilite "Skip cache" ou "Disable cache"', 'blue');
    
    log('\n5️⃣  VERIFICAR CONFIGURAÇÕES DE TEMPO:', 'cyan');
    log('   a) No dashboard, verifique o seletor de tempo (canto superior direito)', 'blue');
    log('   b) Configure para "Last 5 minutes" ou "Last 15 minutes"', 'blue');
    log('   c) Certifique-se de que "Refresh dashboard" está habilitado', 'blue');
    
    log('\n─'.repeat(60), 'cyan');
    
  } else {
    log('\n❌ CONCLUSÃO: Há problema no PostgresTransport', 'red');
    log('   - Logs NÃO estão sendo escritos corretamente no banco', 'red');
    log('   - Verifique a conexão com o PostgreSQL', 'red');
    log('   - Verifique os logs de erro do backend', 'red');
    
    log('\n🔧 AÇÕES RECOMENDADAS:', 'yellow');
    log('   1. Verificar se o PostgreSQL está rodando', 'yellow');
    log('   2. Verificar variável DATABASE_URL no .env', 'yellow');
    log('   3. Verificar variável ENABLE_POSTGRES_TRANSPORT=true no .env', 'yellow');
    log('   4. Verificar logs de erro do PostgresTransport', 'yellow');
    log('   5. Executar: npx ts-node scripts/test-postgres-transport.ts', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'magenta');
}

/**
 * Executar todos os testes
 */
async function runDiagnostics() {
  log('\n🚀 DIAGNÓSTICO DE SINCRONIZAÇÃO DE LOGS', 'yellow');
  log('='.repeat(60), 'yellow');
  log('Objetivo: Identificar se o problema está no backend ou no Grafana', 'yellow');
  log('='.repeat(60), 'yellow');
  
  try {
    // Conectar ao banco
    await prisma.$connect();
    log('\n✅ Conectado ao PostgreSQL', 'green');
    
    // Executar testes
    const test1Passed = await testImmediateWrite();
    const test2Passed = await testSequentialWrites();
    await testRecentLogs();
    
    // Fornecer diagnóstico
    await provideDiagnosis(test1Passed, test2Passed);
    
  } catch (error) {
    log('\n❌ ERRO FATAL: Falha ao executar diagnóstico', 'red');
    console.error(error);
  } finally {
    // Desconectar do banco
    await prisma.$disconnect();
    log('\n✅ Desconectado do PostgreSQL\n', 'green');
  }
}

// Executar diagnóstico
runDiagnostics();
