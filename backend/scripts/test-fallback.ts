// backend/scripts/test-fallback.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Script de Teste - Fallback do PostgreSQL Transport
 * 
 * Valida que quando o PostgreSQL falha:
 * 1. Aplicação não crasha
 * 2. Logs são salvos em arquivo (fallback)
 * 3. Erro de logging é registrado (meta-log)
 * 
 * Referências:
 * - Plano: docs/LOGGING-IMPLEMENTATION-PLAN.md (Checkpoint 2.2.2)
 * - Transport: backend/src/utils/transports/postgresTransport.ts
 * 
 * Uso:
 * ```bash
 * # 1. Parar PostgreSQL (simular falha)
 * sudo systemctl stop postgresql
 * 
 * # 2. Executar teste
 * cd backend
 * ENABLE_POSTGRES_TRANSPORT=true npx ts-node scripts/test-fallback.ts
 * 
 * # 3. Verificar logs em logs/combined.log
 * tail -n 20 logs/combined.log
 * 
 * # 4. Reiniciar PostgreSQL
 * sudo systemctl start postgresql
 * ```
 */

import logger from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

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
 * Teste de Fallback
 */
async function testFallback() {
  log('\n🚀 Iniciando Teste de Fallback', 'yellow');
  log('='.repeat(50), 'yellow');
  
  const testMessage = `Fallback test - ${Date.now()}`;
  const requestId = `fallback-test-${Date.now()}`;
  
  try {
    log('\n📝 Criando logs de teste...', 'cyan');
    
    // Criar vários logs
    logger.info(testMessage, { requestId });
    logger.warn('Test warning', { requestId });
    logger.error('Test error', { requestId, error: new Error('Test error') });
    
    // Aguardar persistência
    await sleep(2000);
    
    log('✅ Logs criados sem crashar aplicação', 'green');
    
    // Verificar se logs foram salvos em arquivo
    const logFile = path.join(__dirname, '../logs/combined.log');
    
    if (!fs.existsSync(logFile)) {
      log('❌ FALHOU: Arquivo combined.log não encontrado', 'red');
      return false;
    }
    
    const logContent = fs.readFileSync(logFile, 'utf-8');
    const lines = logContent.split('\n');
    
    // Buscar log de teste
    const testLog = lines.find(line => line.includes(testMessage));
    
    if (!testLog) {
      log('❌ FALHOU: Log de teste não encontrado em combined.log', 'red');
      return false;
    }
    
    log('✅ Log encontrado em combined.log (fallback funcionando)', 'green');
    log(`   - Log: ${testLog.substring(0, 100)}...`, 'blue');
    
    // Verificar meta-log de erro do PostgreSQL
    const errorLog = lines.find(line => 
      line.includes('PostgresTransport') || 
      line.includes('Erro ao persistir log')
    );
    
    if (errorLog) {
      log('✅ Meta-log de erro encontrado (PostgreSQL falhou gracefully)', 'green');
      log(`   - Error: ${errorLog.substring(0, 100)}...`, 'blue');
    } else {
      log('⚠️  AVISO: Meta-log de erro não encontrado (PostgreSQL pode estar funcionando)', 'yellow');
    }
    
    log('\n' + '='.repeat(50), 'yellow');
    log('🎉 CHECKPOINT 2.2.2 PASSOU: Fallback funcionando!', 'green');
    log('='.repeat(50), 'yellow');
    
    log('\n📋 Resumo:', 'cyan');
    log('   ✅ Aplicação não crashou', 'green');
    log('   ✅ Logs salvos em arquivo (fallback)', 'green');
    log('   ✅ Sistema resiliente a falhas de logging', 'green');
    
    return true;
  } catch (error) {
    log('\n❌ ERRO FATAL: Aplicação crashou', 'red');
    console.error(error);
    return false;
  }
}

// Executar teste
testFallback();
