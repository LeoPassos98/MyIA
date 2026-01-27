# Script de Benchmark do Logger

> **Arquivo:** [`backend/scripts/benchmark-logger.ts`](../backend/scripts/benchmark-logger.ts)  
> **Objetivo:** Validar que o impacto de performance do logger é < 5ms por log  
> **Referência:** [`LOGGING-IMPLEMENTATION-PLAN.md`](./LOGGING-IMPLEMENTATION-PLAN.md) Checkpoint 1.6.2

---

## Uso

```bash
cd backend
npx ts-node scripts/benchmark-logger.ts
```

---

## Implementação

O script deve testar 4 tipos de logs:

### 1. Log Simples
```typescript
logger.info('Benchmark test message');
```

### 2. Log com Contexto
```typescript
logger.info('Benchmark test message', {
  requestId: 'test-request-id',
  userId: 'test-user-id'
});
```

### 3. Log com Metadata Completa
```typescript
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
```

### 4. Log de Erro
```typescript
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
```

---

## Configuração

- **Iterações:** 1000 logs por tipo
- **Warmup:** 100 logs (aquecimento)
- **Critério de Sucesso:** Tempo médio < 5ms por log

---

## Saída Esperada

```
🚀 Iniciando Benchmark do Sistema de Logging

════════════════════════════════════════════════════════════

⏳ Executando warmup...
✅ Warmup concluído

════════════════════════════════════════════════════════════

📊 Executando benchmarks...

✅ PASS simple
  Iterações:     1000
  Tempo Total:   1234.56ms
  Tempo Médio:   1.235ms
  Tempo Mínimo:  0.123ms
  Tempo Máximo:  5.678ms
  
✅ PASS with-context
  Iterações:     1000
  Tempo Total:   1456.78ms
  Tempo Médio:   1.457ms
  Tempo Mínimo:  0.234ms
  Tempo Máximo:  6.789ms
  
✅ PASS with-metadata
  Iterações:     1000
  Tempo Total:   1678.90ms
  Tempo Médio:   1.679ms
  Tempo Mínimo:  0.345ms
  Tempo Máximo:  7.890ms
  
✅ PASS with-error
  Iterações:     1000
  Tempo Total:   1890.12ms
  Tempo Médio:   1.890ms
  Tempo Mínimo:  0.456ms
  Tempo Máximo:  8.901ms
  
════════════════════════════════════════════════════════════

📈 RESUMO

Total de testes:        4
Testes aprovados:       4
Testes reprovados:      0
Média geral:            1.565ms
Critério de sucesso:    < 5ms por log

════════════════════════════════════════════════════════════

✅ SUCESSO: Todos os benchmarks passaram!
   Performance do logger está dentro do esperado (< 5ms).
```

---

## Código Completo

```typescript
// backend/scripts/benchmark-logger.ts
import { logger } from '../src/utils/logger';

const ITERATIONS = 1000;
const WARMUP_ITERATIONS = 100;

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
    const duration = Number(end - start) / 1_000_000;
    times.push(duration);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const passed = avgTime < 5;
  
  return { type, iterations, totalTime, avgTime, minTime, maxTime, passed };
}

async function runBenchmark() {
  console.log('\n🚀 Iniciando Benchmark do Sistema de Logging\n');
  
  // Warmup
  benchmarkLogType('simple', WARMUP_ITERATIONS);
  
  // Benchmarks
  const types: LogType[] = ['simple', 'with-context', 'with-metadata', 'with-error'];
  const results = types.map(type => benchmarkLogType(type, ITERATIONS));
  
  // Exibir resultados
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.type}`);
    console.log(`  Tempo Médio: ${result.avgTime.toFixed(3)}ms`);
  });
  
  // Resumo
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

runBenchmark();
```

---

## Interpretação dos Resultados

### ✅ Sucesso (< 5ms)
- Logger está otimizado
- Performance aceitável para produção
- Pode avançar para Fase 2

### ❌ Falha (> 5ms)
- Revisar configuração do Winston
- Considerar remover transport SQLite (legado)
- Otimizar formato de logs
- Testar em ambiente diferente

---

## Troubleshooting

### Problema: Tempo médio > 5ms

**Possíveis causas:**
1. Transport SQLite lento (já desabilitado)
2. Disco lento (I/O)
3. Muitos transports ativos
4. Formato de log complexo

**Soluções:**
1. Desabilitar transport File temporariamente
2. Usar apenas Console transport
3. Simplificar formato de log
4. Testar em SSD

### Problema: Variação muito alta (maxTime >> avgTime)

**Possíveis causas:**
1. Garbage collector do Node.js
2. Outros processos no sistema
3. I/O disk latency

**Soluções:**
1. Aumentar warmup iterations
2. Executar em ambiente isolado
3. Calcular mediana ao invés de média

---

## Referências

- **Checkpoint 1.6.2:** [`LOGGING-IMPLEMENTATION-PLAN.md`](./LOGGING-IMPLEMENTATION-PLAN.md#checkpoint-162-performance-validada)
- **Logger Implementation:** [`backend/src/utils/logger.ts`](../backend/src/utils/logger.ts)
- **STANDARDS §13.6:** [`STANDARDS.md#136-performance`](./STANDARDS.md#136-performance)
