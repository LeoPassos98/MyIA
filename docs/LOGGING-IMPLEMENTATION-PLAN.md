# Plano de Implementação - Sistema de Logging

> **Versão:** 1.0
> **Data:** 2026-01-26
> **Status:** Aguardando Aprovação
> **Referências:** [ADR-005](./architecture/ADR-005-LOGGING-SYSTEM.md) | [LOGGING-SYSTEM-PROPOSAL](./LOGGING-SYSTEM-PROPOSAL.md) | [STANDARDS §13](./STANDARDS.md#13-sistema-de-logging-estruturado)

**⚠️ IMPORTANTE:** Este plano NÃO inclui estimativas de tempo para tarefas individuais, conforme solicitado. Foca em checkpoints de validação e estratégias de ajuste.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Fase 1: MVP (Winston + SQLite)](#-fase-1-mvp-winston--sqlite)
3. [Fase 2: Produção (PostgreSQL)](#-fase-2-produção-postgresql)
4. [Fase 3: Observabilidade (Grafana + Loki)](#-fase-3-observabilidade-grafana--loki)
5. [Estratégias de Ajuste](#-estratégias-de-ajuste)
6. [Delegação de Modos](#-delegação-de-modos)
7. [Métricas de Sucesso](#-métricas-de-sucesso)

---

## 🎯 Visão Geral

### Objetivos Globais

- ✅ Implementar logging estruturado sem retrabalho entre fases
- ✅ Garantir rastreabilidade total (requestId, userId, inferenceId)
- ✅ Manter performance (impacto < 5ms por log)
- ✅ Self-hosted (custo zero)
- ✅ Observabilidade em tempo real (Fase 3)

### Princípios de Execução

1. **Checkpoints Obrigatórios:** Cada tarefa tem critérios de sucesso mensuráveis
2. **Ajuste Automático:** Estratégias alternativas pré-definidas para falhas
3. **Delegação Clara:** Modo primário e secundário para cada tarefa
4. **Rollback Seguro:** Critérios claros para voltar atrás

### Arquitetura de Fases

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1: MVP                               │
│  Winston + SQLite + Middleware + Migração console.log       │
│  Tempo: 1-2 semanas | Risco: Baixo                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 FASE 2: PRODUÇÃO                             │
│  PostgreSQL + Retenção + Índices + Busca Avançada          │
│  Tempo: 3-4 semanas | Risco: Baixo-Médio                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FASE 3: OBSERVABILIDADE                         │
│  Grafana + Loki + Dashboards + Alertas + SSE               │
│  Tempo: 4-6 semanas | Risco: Médio                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fase 1: MVP (Winston + SQLite)

### Objetivos Mensuráveis

- [ ] Winston instalado e configurado com 3 transports (Console, File, SQLite)
- [ ] Interface `LogEntry` criada e documentada
- [ ] Middleware `requestId` funcionando em todas as rotas
- [ ] 100% dos `console.log` migrados para `logger`
- [ ] Testes unitários com cobertura > 80%
- [ ] Performance < 5ms por log

### Duração Estimada
**1-2 semanas** (10-15 dias úteis)

---

### Tarefa 1.1: Instalar e Configurar Winston

**Modo Primário:** Code  
**Modo Secundário:** Debug (se houver conflitos de dependências)

#### Subtarefas

1. Instalar dependências Winston
2. Criar arquivo [`logger.ts`](../backend/src/utils/logger.ts:1)
3. Configurar transports (Console, File, SQLite)
4. Criar diretório `logs/` e configurar `.gitignore`

#### Arquivos Afetados

- [`backend/package.json`](../backend/package.json:1) (adicionar winston, winston-sqlite3)
- [`backend/src/utils/logger.ts`](../backend/src/utils/logger.ts:1) (substituir implementação atual)
- [`backend/.gitignore`](../backend/.gitignore:1) (adicionar `logs/`)

#### Checkpoint 1.1.1: Dependências Instaladas

**Critério de Sucesso:**
```bash
npm list winston winston-sqlite3
# Deve retornar:
# winston@3.19.0
# winston-sqlite3@latest
```

**Teste de Validação:**
```bash
cd backend
npm install winston winston-sqlite3 --save
npm list winston winston-sqlite3
```

**Se Falhar:**
- **Causa Provável:** Conflito de dependências
- **Ação:** Verificar versões compatíveis com Node.js atual
- **Modo:** Debug (investigar conflitos)
- **Estratégia Alternativa:** Usar versões específicas (winston@3.11.0)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.1.2

---

#### Checkpoint 1.1.2: Logger Configurado

**Critério de Sucesso:**
- Arquivo [`logger.ts`](../backend/src/utils/logger.ts:1) criado
- Exporta objeto `logger` com métodos `info`, `warn`, `error`, `debug`
- Transports configurados (Console, File, SQLite)

**Teste de Validação:**
```typescript
// backend/src/utils/logger.test.ts
import logger from './logger';

describe('Logger', () => {
  it('should have all log methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
  });
});
```

**Se Falhar:**
- **Causa Provável:** Erro de configuração Winston
- **Ação:** Revisar documentação Winston
- **Modo:** Code (corrigir configuração)
- **Estratégia Alternativa:** Usar configuração mínima (apenas Console)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.1.3

---

#### Checkpoint 1.1.3: Transports Funcionando

**Critério de Sucesso:**
- Logs aparecem no console (desenvolvimento)
- Logs salvos em `logs/combined.log`
- Logs de erro salvos em `logs/error.log`
- Logs persistidos no SQLite (`logs/logs.db`)

**Teste de Validação:**
```typescript
// Script de teste manual
import logger from './utils/logger';

logger.info('Test info log');
logger.warn('Test warn log');
logger.error('Test error log');
logger.debug('Test debug log');

// Verificar:
// 1. Console mostra 4 logs
// 2. logs/combined.log tem 4 linhas
// 3. logs/error.log tem 1 linha
// 4. logs/logs.db existe e tem 4 registros
```

**Se Falhar:**
- **Causa Provável:** Permissões de arquivo ou path incorreto
- **Ação:** Verificar permissões do diretório `logs/`
- **Modo:** Debug (investigar filesystem)
- **Estratégia Alternativa:** Usar apenas Console + File (adiar SQLite)

**Se Passar:**
- **Próximo Passo:** Tarefa 1.2

---

### Tarefa 1.2: Criar Interface LogEntry

**Modo Primário:** Code  
**Modo Secundário:** Architect (se precisar revisar estrutura)

#### Subtarefas

1. Criar arquivo [`backend/src/types/logging.ts`](../backend/src/types/logging.ts:1)
2. Definir interface `LogEntry`
3. Definir type `LogLevel`
4. Documentar campos com JSDoc

#### Arquivos Afetados

- [`backend/src/types/logging.ts`](../backend/src/types/logging.ts:1) (criar)

#### Checkpoint 1.2.1: Interface Criada

**Critério de Sucesso:**
- Interface `LogEntry` definida com todos os campos obrigatórios
- Type `LogLevel` definido
- JSDoc completo para cada campo

**Teste de Validação:**
```typescript
// backend/src/types/logging.test.ts
import { LogEntry, LogLevel } from './logging';

const validLog: LogEntry = {
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Test log',
  requestId: 'uuid-123',
  userId: 'user-456',
};

// TypeScript deve compilar sem erros
```

**Se Falhar:**
- **Causa Provável:** Erro de sintaxe TypeScript
- **Ação:** Revisar sintaxe de interfaces
- **Modo:** Code (corrigir sintaxe)

**Se Passar:**
- **Próximo Passo:** Tarefa 1.3

---

### Tarefa 1.3: Implementar Middleware requestId

**Modo Primário:** Code  
**Modo Secundário:** Test Engineer (para validar middleware)

#### Subtarefas

1. Criar arquivo [`backend/src/middleware/requestId.ts`](../backend/src/middleware/requestId.ts:1)
2. Implementar geração de UUID
3. Adicionar header `X-Request-ID`
4. Integrar no [`server.ts`](../backend/src/server.ts:1)

#### Arquivos Afetados

- [`backend/src/middleware/requestId.ts`](../backend/src/middleware/requestId.ts:1) (criar)
- [`backend/src/server.ts`](../backend/src/server.ts:1) (adicionar middleware)
- [`backend/src/types/express/index.d.ts`](../backend/src/types/express/index.d.ts:1) (adicionar `id` ao Request)

#### Checkpoint 1.3.1: Middleware Implementado

**Critério de Sucesso:**
- Middleware gera UUID único por requisição
- Header `X-Request-ID` presente na resposta
- `req.id` disponível em todos os controllers

**Teste de Validação:**
```typescript
// backend/src/middleware/requestId.test.ts
import { requestIdMiddleware } from './requestId';

describe('requestIdMiddleware', () => {
  it('should generate unique requestId', () => {
    const req = {} as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();
    
    requestIdMiddleware(req, res, next);
    
    expect(req.id).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id);
    expect(next).toHaveBeenCalled();
  });
});
```

**Se Falhar:**
- **Causa Provável:** Erro de integração com Express
- **Ação:** Revisar ordem de middlewares
- **Modo:** Debug (investigar ordem de execução)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.3.2

---

#### Checkpoint 1.3.2: Middleware Integrado

**Critério de Sucesso:**
- Middleware aplicado antes de todas as rotas
- Todas as requisições têm `X-Request-ID` no header
- `req.id` acessível em controllers

**Teste de Validação:**
```bash
# Teste manual com curl
curl -v http://localhost:3000/api/health

# Verificar header na resposta:
# X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

**Se Falhar:**
- **Causa Provável:** Middleware não aplicado globalmente
- **Ação:** Mover `app.use(requestIdMiddleware)` para antes das rotas
- **Modo:** Code (corrigir ordem)

**Se Passar:**
- **Próximo Passo:** Tarefa 1.4

---

### Tarefa 1.4: Migrar console.log para logger

**Modo Primário:** Code  
**Modo Secundário:** Code Simplifier (para refatorar código complexo)

#### Subtarefas

1. Identificar todos os `console.log/error/warn` no backend
2. Substituir por `logger.info/error/warn`
3. Adicionar contexto (requestId, userId)
4. Remover `console.log` de produção

#### Arquivos Afetados

- Todos os arquivos em [`backend/src/`](../backend/src/:1)
- Prioridade: Controllers → Services → Middlewares

#### Checkpoint 1.4.1: Identificação Completa

**Critério de Sucesso:**
- Lista completa de arquivos com `console.log/error/warn`
- Priorização por criticidade (controllers primeiro)

**Teste de Validação:**
```bash
# Buscar todos os console.log
cd backend/src
grep -r "console\." . --include="*.ts" | wc -l

# Resultado esperado: número total de ocorrências
```

**Se Falhar:**
- **Causa Provável:** Grep não encontrou arquivos
- **Ação:** Verificar path correto
- **Modo:** Code (ajustar busca)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.4.2

---

#### Checkpoint 1.4.2: Migração Controllers (50%)

**Critério de Sucesso:**
- 100% dos controllers migrados
- Todos os logs incluem `requestId` e `userId`
- Logs estruturados (objeto de contexto)

**Teste de Validação:**
```bash
# Verificar que não há console.log em controllers
cd backend/src/controllers
grep -r "console\." . --include="*.ts"

# Resultado esperado: 0 ocorrências
```

**Se Falhar:**
- **Causa Provável:** Migração incompleta
- **Ação:** Revisar controllers restantes
- **Modo:** Code (completar migração)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.4.3

---

#### Checkpoint 1.4.3: Migração Services (80%)

**Critério de Sucesso:**
- 100% dos services migrados
- Logs incluem contexto relevante (provider, model, etc.)

**Teste de Validação:**
```bash
# Verificar que não há console.log em services
cd backend/src/services
grep -r "console\." . --include="*.ts"

# Resultado esperado: 0 ocorrências
```

**Se Falhar:**
- **Causa Provável:** Services complexos com lógica aninhada
- **Ação:** Escalar para Code Simplifier
- **Modo:** Code Simplifier (refatorar e migrar)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.4.4

---

#### Checkpoint 1.4.4: Migração Completa (100%)

**Critério de Sucesso:**
- 0 ocorrências de `console.log/error/warn` em todo o backend
- Todos os logs estruturados
- Performance validada (< 5ms por log)

**Teste de Validação:**
```bash
# Busca global
cd backend/src
grep -r "console\." . --include="*.ts"

# Resultado esperado: 0 ocorrências
```

**Se Falhar:**
- **Causa Provável:** Arquivos esquecidos (scripts, testes)
- **Ação:** Migrar arquivos restantes
- **Modo:** Code (completar migração)
- **Estratégia Alternativa:** Permitir `console.log` em testes (adicionar exceção)

**Se Passar:**
- **Próximo Passo:** Tarefa 1.5

---

### Tarefa 1.5: Criar Testes Unitários

**Modo Primário:** Test Engineer  
**Modo Secundário:** Code (se precisar ajustar implementação)

#### Subtarefas

1. Criar testes para `logger.ts`
2. Criar testes para `requestIdMiddleware`
3. Criar testes de integração (logger + middleware)
4. Validar cobertura > 80%

#### Arquivos Afetados

- [`backend/src/utils/logger.test.ts`](../backend/src/utils/logger.test.ts:1) (criar)
- [`backend/src/middleware/requestId.test.ts`](../backend/src/middleware/requestId.test.ts:1) (criar)

#### Checkpoint 1.5.1: Testes Unitários Criados

**Critério de Sucesso:**
- Testes para `logger` (4 métodos)
- Testes para `requestIdMiddleware` (geração UUID, header)
- Todos os testes passando

**Teste de Validação:**
```bash
cd backend
npm test -- logger.test.ts
npm test -- requestId.test.ts

# Resultado esperado: 100% PASS
```

**Se Falhar:**
- **Causa Provável:** Implementação com bugs
- **Ação:** Corrigir implementação
- **Modo:** Code (fix bugs)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.5.2

---

#### Checkpoint 1.5.2: Cobertura > 80%

**Critério de Sucesso:**
- Cobertura de código > 80% para módulos de logging
- Todos os edge cases cobertos

**Teste de Validação:**
```bash
cd backend
npm run test:coverage

# Verificar:
# logger.ts: > 80%
# requestId.ts: > 80%
```

**Se Falhar:**
- **Causa Provável:** Testes insuficientes
- **Ação:** Adicionar testes para edge cases
- **Modo:** Test Engineer (adicionar testes)

**Se Passar:**
- **Próximo Passo:** Tarefa 1.6

---

### Tarefa 1.6: Documentação e Validação Final

**Modo Primário:** Docs Specialist  
**Modo Secundário:** Architect (para revisar arquitetura)

#### Subtarefas

1. Atualizar [`STANDARDS.md`](../docs/STANDARDS.md:1) (Seção 13)
2. Criar guia de uso do logger
3. Documentar exemplos práticos
4. Validar performance (< 5ms por log)

#### Arquivos Afetados

- [`docs/STANDARDS.md`](../docs/STANDARDS.md:1) (atualizar Seção 13)
- [`docs/LOGGING-USAGE-GUIDE.md`](../docs/LOGGING-USAGE-GUIDE.md:1) (criar)

#### Checkpoint 1.6.1: Documentação Completa

**Critério de Sucesso:**
- Seção 13 do STANDARDS.md atualizada
- Guia de uso criado com exemplos
- Todos os campos de `LogEntry` documentados

**Teste de Validação:**
- Revisar documentação manualmente
- Verificar links funcionando
- Validar exemplos de código

**Se Falhar:**
- **Causa Provável:** Documentação incompleta
- **Ação:** Completar documentação
- **Modo:** Docs Specialist (completar docs)

**Se Passar:**
- **Próximo Passo:** Checkpoint 1.6.2

---

#### Checkpoint 1.6.2: Performance Validada

**Critério de Sucesso:**
- Impacto de performance < 5ms por log
- Sem degradação em endpoints críticos

**Teste de Validação:**
```typescript
// Script de benchmark
import logger from './utils/logger';

const iterations = 1000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  logger.info('Benchmark test', {
    requestId: 'test-id',
    userId: 'test-user',
    iteration: i,
  });
}

const duration = Date.now() - start;
const avgPerLog = duration / iterations;

console.log(`Average time per log: ${avgPerLog}ms`);
// Esperado: < 5ms
```

**Se Falhar:**
- **Causa Provável:** SQLite transport lento
- **Ação:** Otimizar configuração ou usar apenas File transport
- **Modo:** Debug (investigar performance)
- **Estratégia Alternativa:** Usar logs assíncronos (batch writes)

**Se Passar:**
- **Próximo Passo:** Checkpoint de Fase 1

---

### 🎯 Checkpoint de Fase 1

**Critérios de Sucesso Global:**

- [ ] Winston configurado com 3 transports funcionando
- [ ] Interface `LogEntry` criada e documentada
- [ ] Middleware `requestId` integrado em todas as rotas
- [ ] 100% dos `console.log` migrados para `logger`
- [ ] Testes unitários com cobertura > 80%
- [ ] Performance < 5ms por log
- [ ] Documentação completa
- [ ] Zero erros de TypeScript/ESLint

**Teste de Validação Final:**

```bash
# 1. Build sem erros
cd backend
npm run build

# 2. Testes passando
npm test

# 3. Cobertura > 80%
npm run test:coverage

# 4. Lint sem erros
npm run lint

# 5. Verificar logs funcionando
npm run dev
# Fazer requisição e verificar logs em logs/combined.log
```

**Se TODOS passarem:**
- ✅ **Fase 1 COMPLETA**
- ✅ **Avançar para Fase 2**

**Se ALGUM falhar:**
- ❌ **NÃO avançar para Fase 2**
- ❌ **Executar Estratégia de Ajuste (ver seção abaixo)**

---

## 🏭 Fase 2: Produção (PostgreSQL)

### Objetivos Mensuráveis

- [ ] Migration PostgreSQL criada e aplicada
- [ ] Transport PostgreSQL configurado
- [ ] Retenção automática (30 dias) funcionando
- [ ] Índices de performance criados
- [ ] Busca avançada implementada (filtros, paginação)
- [ ] Dashboard básico de logs (SSE)
- [ ] Performance de queries < 100ms

### Duração Estimada
**3-4 semanas** (15-20 dias úteis)

---

### Tarefa 2.1: Criar Migration PostgreSQL

**Modo Primário:** Code  
**Modo Secundário:** Architect (para revisar schema)

#### Subtarefas

1. Criar migration Prisma para tabela `logs`
2. Definir schema com todos os campos de `LogEntry`
3. Criar índices de performance
4. Criar função de retenção automática

#### Arquivos Afetados

- [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:1) (adicionar model `Log`)
- [`backend/prisma/migrations/XXXXXX_create_logs_table/migration.sql`](../backend/prisma/migrations/:1) (criar)

#### Checkpoint 2.1.1: Schema Definido

**Critério de Sucesso:**
- Model `Log` adicionado ao `schema.prisma`
- Todos os campos de `LogEntry` mapeados
- Tipos corretos (UUID, TIMESTAMPTZ, JSONB)

**Teste de Validação:**
```bash
cd backend
npx prisma format
npx prisma validate

# Resultado esperado: Schema is valid
```

**Se Falhar:**
- **Causa Provável:** Erro de sintaxe Prisma
- **Ação:** Revisar sintaxe do schema
- **Modo:** Code (corrigir schema)

**Se Passar:**
- **Próximo Passo:** Checkpoint 2.1.2

---

#### Checkpoint 2.1.2: Migration Criada

**Critério de Sucesso:**
- Migration SQL gerada
- Tabela `logs` com todos os campos
- Índices criados (timestamp, level, user_id, request_id)

**Teste de Validação:**
```bash
cd backend
npx prisma migrate dev --name create_logs_table

# Verificar:
# 1. Migration criada em prisma/migrations/
# 2. Tabela logs existe no banco
```

**Se Falhar:**
- **Causa Provável:** Erro de conexão com PostgreSQL
- **Ação:** Verificar DATABASE_URL
- **Modo:** Debug (investigar conexão)

**Se Passar:**
- **Próximo Passo:** Checkpoint 2.1.3

---

#### Checkpoint 2.1.3: Índices Criados

**Critério de Sucesso:**
- Índice em `timestamp DESC` (queries temporais)
- Índice em `level` (filtro por nível)
- Índice em `user_id` (filtro por usuário)
- Índice em `request_id` (correlação)
- Índice GIN em `metadata` (busca em JSONB)

**Teste de Validação:**
```sql
-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'logs';

-- Resultado esperado: 5 índices
```

**Se Falhar:**
- **Causa Provável:** Índices não criados na migration
- **Ação:** Adicionar índices manualmente
- **Modo:** Code (atualizar migration)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.2

---

### Tarefa 2.2: Configurar Transport PostgreSQL

**Modo Primário:** Code  
**Modo Secundário:** Debug (se houver problemas de conexão)

#### Subtarefas

1. Instalar `winston-postgres` ou criar transport customizado
2. Configurar conexão com PostgreSQL
3. Atualizar [`logger.ts`](../backend/src/utils/logger.ts:1)
4. Testar persistência

#### Arquivos Afetados

- [`backend/package.json`](../backend/package.json:1) (adicionar winston-postgres)
- [`backend/src/utils/logger.ts`](../backend/src/utils/logger.ts:1) (adicionar transport PostgreSQL)

#### Checkpoint 2.2.1: Transport Configurado

**Critério de Sucesso:**
- Transport PostgreSQL adicionado ao Winston
- Logs persistidos na tabela `logs`
- Fallback para File transport se PostgreSQL falhar

**Teste de Validação:**
```typescript
// Script de teste
import logger from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

logger.info('Test PostgreSQL transport', {
  requestId: 'test-123',
  userId: 'user-456',
});

// Aguardar 1 segundo (async)
setTimeout(async () => {
  const logs = await prisma.log.findMany({
    where: { message: 'Test PostgreSQL transport' },
  });
  
  console.log(`Logs found: ${logs.length}`);
  // Esperado: 1
}, 1000);
```

**Se Falhar:**
- **Causa Provável:** Erro de conexão ou configuração
- **Ação:** Verificar DATABASE_URL e permissões
- **Modo:** Debug (investigar conexão)
- **Estratégia Alternativa:** Criar transport customizado usando Prisma

**Se Passar:**
- **Próximo Passo:** Checkpoint 2.2.2

---

#### Checkpoint 2.2.2: Fallback Funcionando

**Critério de Sucesso:**
- Se PostgreSQL falhar, logs salvos em arquivo
- Aplicação não crasha por erro de logging
- Erro de logging registrado (meta-log)

**Teste de Validação:**
```typescript
// Simular falha de PostgreSQL
// 1. Parar PostgreSQL
// 2. Executar aplicação
// 3. Fazer requisição
// 4. Verificar logs em logs/combined.log

// Esperado: Logs salvos em arquivo, aplicação funcionando
```

**Se Falhar:**
- **Causa Provável:** Falta de tratamento de erro
- **Ação:** Adicionar try/catch no transport
- **Modo:** Code (adicionar error handling)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.3

---

### Tarefa 2.3: Implementar Retenção Automática

**Modo Primário:** Code  
**Modo Secundário:** Architect (para revisar estratégia)

#### Subtarefas

1. Criar função PostgreSQL `cleanup_old_logs()`
2. Configurar cron job (pg_cron ou script Node.js)
3. Testar retenção (30 dias)
4. Adicionar logs de auditoria da limpeza

#### Arquivos Afetados

- [`backend/prisma/migrations/XXXXXX_add_log_retention/migration.sql`](../backend/prisma/migrations/:1) (criar)
- [`backend/scripts/cleanup-logs.ts`](../backend/scripts/cleanup-logs.ts:1) (criar, se usar Node.js)

#### Checkpoint 2.3.1: Função de Limpeza Criada

**Critério de Sucesso:**
- Função `cleanup_old_logs()` criada
- Deleta logs com `timestamp < NOW() - INTERVAL '30 days'`
- Retorna número de logs deletados

**Teste de Validação:**
```sql
-- Testar função manualmente
SELECT cleanup_old_logs();

-- Resultado esperado: número de logs deletados
```

**Se Falhar:**
- **Causa Provável:** Erro de sintaxe SQL
- **Ação:** Revisar sintaxe da função
- **Modo:** Code (corrigir SQL)

**Se Passar:**
- **Próximo Passo:** Checkpoint 2.3.2

---

#### Checkpoint 2.3.2: Cron Job Configurado

**Critério de Sucesso:**
- Cron job executando diariamente (2h da manhã)
- Logs de auditoria da limpeza
- Notificação se limpeza falhar

**Teste de Validação:**
```bash
# Se usando pg_cron
SELECT * FROM cron.job WHERE jobname = 'cleanup-logs';

# Se usando Node.js
node backend/scripts/cleanup-logs