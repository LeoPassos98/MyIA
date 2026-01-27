// backend/scripts/benchmark-logger.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Script de Benchmark do Sistema de Logging
 * 
 * Objetivo: Validar que o impacto de performance do logger é < 5ms por log
 * 
 * Referências:
 * - LOGGING-IMPLEMENTATION-PLAN.md: Checkpoint 1.6.2
 * - STANDARDS.md §13: Sistema de Logging Estruturado
 * 
 * Uso:
 * ```bash
 * cd backend
 * npx ts-node scripts/benchmark-logger.ts
 * ```
 */

import { logger } from '../src/utils/logger';

// Configurações do benchmark
const ITERATIONS = 1000;
const WARMUP_ITERATIONS = 100;

// Tipos de log para testar
type LogType = 'simple' | 'with-context' | 'with-metadata' | 'with-error';

interface BenchmarkResult {
  type: LogType;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  passed: boolean;
}

/**
 * Executa benchmark para um tipo específico de log
 */
function benchmarkLogType(type: LogType, iterations: number): BenchmarkResult {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    
    switch (type) {
      case 'simple':
        logger.info('Benchmark test message');
        break;
        
      case 'with-context':
        logger.info('Benchmark test message', {
          requestId: 'test-request-id',
          userId: 'test-user-id'
        });
        break;
        
      case 'with-metadata':
        logger.info('Benchmark test message', {
          requestId: 'test-request-id',
          userId: 'test-user-id',
          metadata: {
            provider: 'bedrock',
            model: 'anthropic.claude-3-sonnet',
            tokensIn: 500,
            tokensOut: 300,
            cost: 0.01,
            duration: 1234
          }
        });
        break;
        
      case 'with-error':
        logger.error('Benchmark test error', {
          requestId: 'test-request-id',
          userId: 'test-user-id',
          error: 'Test error message',
          stack: 'Error: Test error\n    at test (test.ts:1:1)',
          metadata: {
            operation: 'test-operation',
            statusCode: 500
          }
        });
        break;
    }
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Converter para ms
    times.push(duration);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const passed = avgTime < 5; // Critério: < 5ms por log
  
  return {
    type,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    passed
  };
}

/**
 * Formata resultado para exibição
 */
function formatResult(result: BenchmarkResult): string {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const avgColor = result.passed ? '\x1b[32m' : '\x1b[31m'; // Verde ou Vermelho
  const resetColor = '\x1b[0m';
  
  return `
${status} ${result.type}
  Iterações:     ${result.iterations}
  Tempo Total:   ${result.totalTime.toFixed(2)}ms
  Tempo Médio:   ${avgColor}${result.avgTime.toFixed(3)}ms${resetColor}
  Tempo Mínimo:  ${result.minTime.toFixed(3)}ms
  Tempo Máximo:  ${result.maxTime.toFixed(3)}ms
  `;
}

/**
 * Executa benchmark completo
 */
async function runBenchmark() {
  console.log('\n🚀 Iniciando Benchmark do Sistema de Logging\n');
  console.log('═'.repeat(60));
  
  // Warmup (aquecimento)
  console.log('\n⏳ Executando warmup...');
  benchmarkLogType('simple', WARMUP_ITERATIONS);
  console.log('✅ Warmup concluído\n');
  
  console.log('═'.repeat(60));
  console.log('\n📊 Executando benchmarks...\n');
  
  // Executar benchmarks
  const types: LogType[] = ['simple', 'with-context', 'with-metadata', 'with-error'];
  const results: BenchmarkResult[] = [];
  
  for (const type of types) {
    const result = benchmarkLogType(type, ITERATIONS);
    results.push(result);
    console.log(formatResult(result));
  }
  
  console.log('═'.repeat(60));
  
  // Resumo
  const allPassed = results.every(r => r.passed);
  const avgOfAvgs = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
  
  console.log('\n📈 RESUMO\n');
  console.log(`Total de testes:        ${results.length}`);
  console.log(`Testes aprovados:       ${results.filter(r => r.passed).length}`);
  console.log(`Testes reprovados:      ${results.filter(r => !r.passed).length}`);
  console.log(`Média geral:            ${avgOfAvgs.toFixed(3)}ms`);
  console.log(`Critério de sucesso:    < 5ms por log`);
  
  console.log('\n═'.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ SUCESSO: Todos os benchmarks passaram!');
    console.log('   Performance do logger está dentro do esperado (< 5ms).\n');
    process.exit(0);
  } else {
    console.log('\n❌ FALHA: Alguns benchmarks não passaram!');
    console.log('   Performance do logger está acima do esperado (> 5ms).');
    console.log('   Considere otimizar a configuração do Winston.\n');
    process.exit(1);
  }
}

/**
 * Executa benchmark com tratamento de erros
 */
async function main() {
  try {
    await runBenchmark();
  } catch (error) {
    console.error('\n❌ Erro ao executar benchmark:', error);
    process.exit(1);
  }
}

// Executar
main();
