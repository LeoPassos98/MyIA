# Guia de Manutenção - Sistema de Certificação Regional

## 📋 Visão Geral

Este guia fornece instruções detalhadas para manutenção, monitoramento e troubleshooting do Sistema de Certificação Regional do MyIA.

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────┐
│  Frontend Admin │ (React + MUI)
│  :3002          │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Backend API    │ (Express + Prisma)
│  :3001          │
└────────┬────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌─────────────┐  ┌──────────────┐
│   Redis     │  │  PostgreSQL  │
│   :6379     │  │  :5432       │
└──────┬──────┘  └──────────────┘
       │
       ▼
┌─────────────────┐
│  Worker Process │ (Bull Queue)
│  (background)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   AWS Bedrock   │ (Modelos de IA)
│   (múltiplas    │
│    regiões)     │
└─────────────────┘
```

### Fluxo de Dados

1. **Admin cria job** → Frontend Admin envia POST para API
2. **API cria job** → Salva no PostgreSQL e adiciona à fila Redis
3. **Worker processa** → Pega job da fila e testa modelo
4. **Worker atualiza** → Salva resultado no PostgreSQL
5. **Frontend consulta** → Busca certificações via API
6. **Auto-refresh** → Frontend atualiza a cada 30s

---

## 🔧 Componentes do Sistema

### 1. Backend API (Express)

**Localização**: `backend/src/`

**Responsabilidades**:
- Receber requisições de certificação
- Criar jobs na fila Bull
- Consultar certificações no banco
- Servir dados para o frontend

**Portas**:
- API: `3001`
- Bull Board: `3001/admin/queues`

**Arquivos principais**:
- `backend/src/controllers/certificationQueueController.ts`
- `backend/src/services/queue/CertificationQueueService.ts`
- `backend/src/routes/certificationQueueRoutes.ts`

---

### 2. Worker (Bull Queue)

**Localização**: `backend/src/services/queue/`

**Responsabilidades**:
- Processar jobs de certificação
- Testar modelos em regiões AWS
- Atualizar status no banco
- Retry em caso de falha

**Configuração**:
- Concorrência: 5 jobs simultâneos
- Timeout: 30 segundos por job
- Retry: até 3 tentativas
- Delay entre retries: 5 segundos

**Arquivos principais**:
- `backend/src/services/queue/CertificationQueueService.ts`
- `backend/src/services/ai/certification/certification.service.ts`

---

### 3. Redis (Cache + Fila)

**Porta**: `6379`

**Responsabilidades**:
- Armazenar fila de jobs
- Cache de resultados
- Gerenciar estado dos jobs

**Dados armazenados**:
- Jobs pendentes
- Jobs em processamento
- Jobs completados (últimas 24h)
- Jobs falhados (últimas 48h)

---

### 4. PostgreSQL (Banco de Dados)

**Porta**: `5432`

**Responsabilidades**:
- Armazenar certificações
- Histórico de testes
- Metadados de modelos

**Tabelas principais**:
- `RegionalCertification`
- `Model`
- `Provider`

---

### 5. Frontend Admin (React)

**Porta**: `3002`

**Responsabilidades**:
- Interface para criar certificações
- Visualizar histórico
- Monitorar status

**Tecnologias**:
- React 18
- Material-UI 5
- React Query
- Vite

---

### 6. Frontend Usuário (React)

**Porta**: `3000`

**Responsabilidades**:
- Exibir badges de certificação
- Filtrar por região
- Auto-refresh de dados

---

## 🔄 Manutenção Regular

### Diária

#### 1. Verificar Logs de Erro

```bash
# Ver últimos 100 erros
tail -n 100 backend/logs/error.log

# Buscar erros específicos
grep "ERROR" backend/logs/combined.log | tail -n 50
```

**O que procurar**:
- ❌ `AccessDeniedException` - Problema de permissões AWS
- ❌ `ThrottlingException` - Quota AWS excedida
- ❌ `TimeoutError` - Problemas de rede
- ❌ `Connection refused` - Redis ou PostgreSQL offline

---

#### 2. Monitorar Bull Board

**URL**: `http://localhost:3001/admin/queues`

**Métricas importantes**:
- **Waiting**: Deve ser < 10 (se > 50, investigar)
- **Active**: Deve ser 1-5 (concorrência configurada)
- **Failed**: Deve ser < 5% do total
- **Completed**: Deve crescer constantemente

**Ações**:
- Se muitos jobs em "Waiting": Verificar worker
- Se muitos jobs em "Failed": Investigar erros
- Se nenhum job em "Active": Worker pode estar parado

---

#### 3. Verificar Health Checks

```bash
# Backend API
curl http://localhost:3001/health

# Worker
curl http://localhost:3004/health

# Redis
redis-cli ping

# PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1"
```

**Respostas esperadas**:
- API: `{"status":"healthy"}`
- Worker: `{"status":"healthy","worker":"running"}`
- Redis: `PONG`
- PostgreSQL: `1`

---

### Semanal

#### 1. Limpar Jobs Antigos

```bash
# Conectar ao Redis
redis-cli

# Limpar jobs completados com mais de 7 dias
# (executar script de limpeza)
```

**Script de limpeza** (`backend/scripts/cleanup-old-jobs.ts`):
```typescript
import { Queue } from 'bullmq';

const queue = new Queue('certification-queue');

async function cleanupOldJobs() {
  // Limpar jobs completados
  await queue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'completed');
  
  // Limpar jobs falhados
  await queue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed');
  
  console.log('Jobs antigos limpos com sucesso');
}

cleanupOldJobs();
```

**Executar**:
```bash
cd backend
npx ts-node scripts/cleanup-old-jobs.ts
```

---

#### 2. Verificar Uso de Redis

```bash
# Conectar ao Redis
redis-cli

# Ver uso de memória
INFO memory

# Ver número de keys
DBSIZE

# Ver keys por padrão
KEYS bull:certification-queue:*
```

**Limites recomendados**:
- Memória usada: < 500MB
- Número de keys: < 10,000
- Se exceder: Executar limpeza

---

#### 3. Analisar Performance

```bash
# Ver tempo médio de processamento
cd backend
npm run analyze:performance
```

**Métricas esperadas**:
- Tempo médio por job: 5-10 segundos
- Taxa de sucesso: > 95%
- Taxa de retry: < 10%

**Se fora dos limites**:
- Investigar logs
- Verificar latência AWS
- Verificar carga do sistema

---

### Mensal

#### 1. Backup do PostgreSQL

```bash
# Criar backup
pg_dump -U leonardo -h localhost myia > backup_$(date +%Y%m%d).sql

# Comprimir backup
gzip backup_$(date +%Y%m%d).sql

# Mover para diretório de backups
mv backup_$(date +%Y%m%d).sql.gz /backups/
```

**Retenção recomendada**:
- Backups diários: 7 dias
- Backups semanais: 4 semanas
- Backups mensais: 12 meses

---

#### 2. Atualizar Dependências

```bash
# Backend
cd backend
npm outdated
npm update

# Frontend
cd frontend
npm outdated
npm update

# Frontend Admin
cd frontend-admin
npm outdated
npm update
```

**Cuidados**:
- Testar em ambiente de desenvolvimento primeiro
- Verificar breaking changes
- Atualizar testes se necessário

---

#### 3. Revisar Certificações

```bash
# Listar modelos não certificados
cd backend
npx ts-node scripts/list-uncertified-models.ts

# Recertificar modelos antigos (> 30 dias)
npx ts-node scripts/recertify-old-models.ts
```

---

## 📊 Monitoramento

### Métricas Importantes

#### 1. Taxa de Sucesso

**Fórmula**: `(Jobs Completados / Total de Jobs) * 100`

**Meta**: > 95%

**Como calcular**:
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'certified') as success,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE status = 'certified')::float / COUNT(*)) * 100 as success_rate
FROM "RegionalCertification"
WHERE "lastTestedAt" > NOW() - INTERVAL '24 hours';
```

---

#### 2. Tempo Médio de Processamento

**Meta**: < 10 segundos

**Como calcular**:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as avg_processing_time
FROM "RegionalCertification"
WHERE "lastTestedAt" > NOW() - INTERVAL '24 hours';
```

---

#### 3. Taxa de Retry

**Meta**: < 10%

**Como verificar** (Bull Board):
- Acessar `http://localhost:3001/admin/queues`
- Ver coluna "Attempts"
- Jobs com attempts > 1 foram retried

---

#### 4. Disponibilidade do Worker

**Meta**: 99.9% uptime

**Como monitorar**:
```bash
# Verificar se processo está rodando
ps aux | grep "worker"

# Verificar health check
curl http://localhost:3004/health
```

---

### Alertas Recomendados

#### 1. Worker Offline

**Condição**: Health check falha por > 5 minutos

**Ação**:
```bash
cd backend
npm run worker:restart
```

---

#### 2. Taxa de Falha Alta

**Condição**: > 10% de jobs falhando

**Ação**:
1. Verificar logs: `tail -f backend/logs/error.log`
2. Verificar credenciais AWS
3. Verificar quota AWS
4. Verificar conectividade

---

#### 3. Fila Crescendo

**Condição**: > 100 jobs em "Waiting"

**Ação**:
1. Verificar se worker está rodando
2. Aumentar concorrência (se necessário)
3. Verificar se há jobs travados

---

#### 4. Redis Offline

**Condição**: `redis-cli ping` não responde

**Ação**:
```bash
# Verificar status
docker ps | grep redis

# Reiniciar Redis
docker restart myia-redis

# Ou iniciar se não estiver rodando
docker run -d --name myia-redis -p 6379:6379 redis:7-alpine
```

---

## 🛠️ Comandos Úteis

### Gerenciamento de Serviços

```bash
# Iniciar todos os serviços
./start.sh start both

# Parar todos os serviços
./start.sh stop both

# Reiniciar backend
./start.sh restart backend

# Reiniciar frontend
./start.sh restart frontend

# Ver status
./start.sh status both
```

---

### Gerenciamento do Worker

```bash
# Iniciar worker
cd backend
npm run worker:dev

# Parar worker
pkill -f "worker"

# Reiniciar worker
npm run worker:restart

# Ver logs do worker
tail -f logs/worker.log
```

---

### Gerenciamento da Fila

```bash
# Limpar toda a fila (CUIDADO!)
redis-cli FLUSHDB

# Limpar apenas jobs completados
redis-cli DEL bull:certification-queue:completed

# Ver jobs em espera
redis-cli LRANGE bull:certification-queue:wait 0 -1

# Ver jobs ativos
redis-cli SMEMBERS bull:certification-queue:active
```

---

### Gerenciamento do Banco

```bash
# Conectar ao banco
psql -U leonardo -h localhost -d myia

# Ver certificações recentes
SELECT * FROM "RegionalCertification" 
ORDER BY "lastTestedAt" DESC 
LIMIT 10;

# Limpar certificações antigas
DELETE FROM "RegionalCertification" 
WHERE "lastTestedAt" < NOW() - INTERVAL '90 days';

# Ver estatísticas
SELECT 
  status,
  COUNT(*) as count
FROM "RegionalCertification"
GROUP BY status;
```

---

### Logs

```bash
# Ver todos os logs
tail -f backend/logs/combined.log

# Ver apenas erros
tail -f backend/logs/error.log

# Ver logs do worker
tail -f backend/logs/worker.log

# Buscar por termo
grep "ERROR" backend/logs/combined.log

# Ver logs de hoje
grep "$(date +%Y-%m-%d)" backend/logs/combined.log
```

---

## 🔍 Troubleshooting Rápido

### Worker não processa jobs

**Sintomas**:
- Jobs ficam em "Waiting"
- Nenhum job em "Active"
- Health check falha

**Diagnóstico**:
```bash
# 1. Verificar se worker está rodando
ps aux | grep worker

# 2. Verificar Redis
redis-cli ping

# 3. Verificar logs
tail -f backend/logs/worker.log
```

**Solução**:
```bash
# Reiniciar worker
cd backend
npm run worker:restart
```

---

### API retorna 500

**Sintomas**:
- Frontend mostra erro
- Requisições falham
- Logs mostram erros

**Diagnóstico**:
```bash
# 1. Verificar se API está rodando
curl http://localhost:3001/health

# 2. Verificar PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1"

# 3. Verificar logs
tail -f backend/logs/error.log
```

**Solução**:
```bash
# Reiniciar backend
./start.sh restart backend
```

---

### Redis desconectado

**Sintomas**:
- Worker não inicia
- Erro: "Connection refused"
- Bull Board não carrega

**Diagnóstico**:
```bash
# Verificar se Redis está rodando
redis-cli ping
```

**Solução**:
```bash
# Iniciar Redis
docker run -d --name myia-redis -p 6379:6379 redis:7-alpine

# Ou reiniciar se já existe
docker restart myia-redis
```

---

### Certificações não aparecem no frontend

**Sintomas**:
- Badges não renderizam
- Loading infinito
- Console mostra erros

**Diagnóstico**:
```bash
# 1. Verificar API
curl http://localhost:3001/api/certification-queue/certifications?modelId=test&providerId=test

# 2. Verificar banco
psql -U leonardo -h localhost -d myia -c "SELECT COUNT(*) FROM \"RegionalCertification\""

# 3. Ver console do navegador (F12)
```

**Solução**:
1. Verificar se há certificações no banco
2. Verificar se API está retornando dados
3. Limpar cache do navegador (Ctrl+Shift+R)

---

## 📈 Otimização de Performance

### 1. Aumentar Concorrência do Worker

**Arquivo**: `backend/src/services/queue/CertificationQueueService.ts`

```typescript
// De:
concurrency: 5

// Para:
concurrency: 10
```

**Cuidado**: Não exceder limites de quota AWS

---

### 2. Ajustar Timeout

**Arquivo**: `backend/src/services/queue/CertificationQueueService.ts`

```typescript
// De:
timeout: 30000 // 30 segundos

// Para:
timeout: 60000 // 60 segundos
```

---

### 3. Configurar Cache do React Query

**Arquivo**: `frontend/src/hooks/useRegionalCertifications.ts`

```typescript
// Aumentar staleTime para reduzir requisições
staleTime: 1000 * 60 * 10, // 10 minutos (era 5)
```

---

## 🔐 Segurança

### 1. Rotação de Credenciais AWS

```bash
# 1. Gerar novas credenciais no AWS Console
# 2. Atualizar ~/.aws/credentials
# 3. Testar credenciais
aws sts get-caller-identity

# 4. Reiniciar worker
cd backend
npm run worker:restart
```

---

### 2. Backup de Dados Sensíveis

```bash
# Backup de credenciais
cp ~/.aws/credentials ~/.aws/credentials.backup

# Backup de variáveis de ambiente
cp backend/.env backend/.env.backup
```

---

### 3. Logs de Auditoria

```bash
# Ver quem criou certificações
SELECT 
  "modelId",
  "providerId",
  "createdAt",
  "updatedAt"
FROM "RegionalCertification"
ORDER BY "createdAt" DESC
LIMIT 50;
```

---

## 📞 Suporte e Escalação

### Nível 1: Problemas Comuns

- Worker offline → Reiniciar worker
- Redis offline → Reiniciar Redis
- API lenta → Verificar logs e banco

### Nível 2: Problemas Complexos

- Taxa de falha alta → Investigar logs AWS
- Performance degradada → Analisar métricas
- Erros intermitentes → Verificar rede

### Nível 3: Problemas Críticos

- Perda de dados → Restaurar backup
- Falha de segurança → Rotacionar credenciais
- Sistema inoperante → Escalar para arquiteto

---

## 📚 Recursos Adicionais

- **Documentação Bull**: https://docs.bullmq.io/
- **Documentação AWS Bedrock**: https://docs.aws.amazon.com/bedrock/
- **Documentação Prisma**: https://www.prisma.io/docs/
- **Documentação React Query**: https://tanstack.com/query/latest

---

**Última atualização**: 2024-01-15
**Versão do documento**: 1.0.0
