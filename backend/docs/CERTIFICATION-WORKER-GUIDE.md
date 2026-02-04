# Certification Worker Guide

## Visão Geral

Worker dedicado para processar jobs de certificação de modelos AI em background, rodando em processo separado do servidor Express.

## Arquitetura

```
┌─────────────────────┐         ┌─────────────────────┐
│   API Server        │         │   Worker Process    │
│   (Express)         │         │                     │
│                     │         │                     │
│  POST /certify      │         │  ┌──────────────┐   │
│       │             │         │  │ Worker       │   │
│       ▼             │         │  │ Instance     │   │
│  ┌──────────────┐   │         │  └──────┬───────┘   │
│  │ Queue        │   │         │         │           │
│  │ Service      │   │         │         │           │
│  └──────┬───────┘   │         │         │           │
└─────────┼───────────┘         └─────────┼───────────┘
          │                               │
          │         Redis Queue           │
          └───────────────┬───────────────┘
                          │
                    ┌─────▼─────┐
                    │   Redis   │
                    │   Server  │
                    └───────────┘
```

## Fluxo de Processamento

1. **API recebe requisição** → Cria job no banco + adiciona à fila Redis
2. **Worker detecta job** → Processa certificação
3. **Worker atualiza banco** → Salva resultado
4. **API consulta status** → Retorna resultado ao cliente

## Iniciar Worker

### Desenvolvimento (com hot-reload)
```bash
cd backend
npm run worker:dev
```

### Produção
```bash
cd backend
npm run worker:prod
```

### Modo simples
```bash
cd backend
npm run worker
```

## Configuração

### Variáveis de Ambiente

Adicione ao [`backend/.env`](backend/.env):

```env
# Certification Queue Configuration
CERTIFICATION_QUEUE_NAME=model-certification
CERTIFICATION_CONCURRENCY=3
CERTIFICATION_TIMEOUT=300000
CERTIFICATION_MAX_RETRIES=3

# Worker Health Check
WORKER_HEALTH_PORT=3002
```

### Parâmetros

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `CERTIFICATION_QUEUE_NAME` | Nome da fila Bull | `model-certification` |
| `CERTIFICATION_CONCURRENCY` | Jobs simultâneos | `3` |
| `CERTIFICATION_TIMEOUT` | Timeout por job (ms) | `300000` (5min) |
| `CERTIFICATION_MAX_RETRIES` | Tentativas em caso de falha | `3` |
| `WORKER_HEALTH_PORT` | Porta do health check | `3002` |

## Health Check

O worker expõe endpoints HTTP para monitoramento:

### Verificar saúde
```bash
curl http://localhost:3002/health
```

Resposta:
```json
{
  "status": "healthy",
  "worker": {
    "isRunning": true,
    "queueName": "model-certification",
    "concurrency": 3
  },
  "timestamp": "2024-01-31T23:00:00.000Z"
}
```

### Obter métricas
```bash
curl http://localhost:3002/metrics
```

Resposta:
```json
{
  "worker": {
    "isRunning": true,
    "queueName": "model-certification",
    "concurrency": 3
  },
  "queue": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0
  },
  "timestamp": "2024-01-31T23:00:00.000Z"
}
```

### Readiness probe (Kubernetes)
```bash
curl http://localhost:3002/ready
```

### Liveness probe (Kubernetes)
```bash
curl http://localhost:3002/live
```

## Testar Worker

### 1. Iniciar Redis
```bash
redis-server
```

### 2. Iniciar Worker
```bash
cd backend
npm run worker:dev
```

### 3. Executar teste
Em outro terminal:
```bash
cd backend
tsx scripts/test-worker.ts
```

O script irá:
1. Buscar um modelo ativo no banco
2. Criar job de certificação
3. Aguardar worker processar (15s)
4. Verificar resultado no banco
5. Exibir status da certificação

## Escalabilidade

### Múltiplas Instâncias (Horizontal Scaling)

Você pode rodar múltiplos workers para aumentar throughput:

```bash
# Terminal 1
WORKER_HEALTH_PORT=3002 npm run worker

# Terminal 2
WORKER_HEALTH_PORT=3003 npm run worker

# Terminal 3
WORKER_HEALTH_PORT=3004 npm run worker
```

Cada worker:
- Processa jobs independentemente
- Compartilha a mesma fila Redis
- Tem seu próprio health check endpoint

### Docker

#### Build
```bash
cd backend
docker build -f Dockerfile.worker -t myia-worker .
```

#### Run
```bash
docker run -d \
  --name myia-worker-1 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/myia" \
  -e CERTIFICATION_CONCURRENCY=3 \
  -p 3002:3002 \
  myia-worker
```

#### Scale
```bash
# Worker 2
docker run -d --name myia-worker-2 \
  -e WORKER_HEALTH_PORT=3003 \
  -p 3003:3003 \
  myia-worker

# Worker 3
docker run -d --name myia-worker-3 \
  -e WORKER_HEALTH_PORT=3004 \
  -p 3004:3004 \
  myia-worker
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myia
      POSTGRES_USER: leonardo
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  api:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - redis
      - postgres
    environment:
      DATABASE_URL: postgresql://leonardo:password@postgres:5432/myia
      REDIS_HOST: redis

  worker-1:
    build:
      context: .
      dockerfile: Dockerfile.worker
    depends_on:
      - redis
      - postgres
    environment:
      DATABASE_URL: postgresql://leonardo:password@postgres:5432/myia
      REDIS_HOST: redis
      WORKER_HEALTH_PORT: 3002
    ports:
      - "3002:3002"

  worker-2:
    build:
      context: .
      dockerfile: Dockerfile.worker
    depends_on:
      - redis
      - postgres
    environment:
      DATABASE_URL: postgresql://leonardo:password@postgres:5432/myia
      REDIS_HOST: redis
      WORKER_HEALTH_PORT: 3003
    ports:
      - "3003:3003"
```

## Monitoramento

### Logs do Worker

Os logs seguem o padrão Winston configurado em [`backend/src/utils/logger.ts`](backend/src/utils/logger.ts):

```bash
# Logs em tempo real
npm run worker:dev

# Logs salvos
tail -f logs/combined.log
tail -f logs/error.log
```

### Bull Board (UI de Monitoramento)

Acesse a interface web para visualizar a fila:

```
http://localhost:3001/admin/queues
```

Credenciais padrão:
- Username: `admin`
- Password: `admin123`

Você pode ver:
- Jobs aguardando
- Jobs em processamento
- Jobs completados
- Jobs falhados
- Estatísticas e métricas

## Troubleshooting

### Worker não processa jobs

**Problema**: Jobs ficam em "waiting" mas não são processados

**Soluções**:
1. Verificar se Redis está rodando:
   ```bash
   redis-cli ping
   # Deve retornar: PONG
   ```

2. Verificar se worker está rodando:
   ```bash
   curl http://localhost:3002/health
   ```

3. Verificar logs do worker:
   ```bash
   tail -f logs/combined.log
   ```

4. Verificar conexão com Redis:
   ```bash
   redis-cli
   > KEYS myia:*
   ```

### Jobs ficam stalled

**Problema**: Jobs ficam travados em "active"

**Soluções**:
1. Aumentar timeout:
   ```env
   CERTIFICATION_TIMEOUT=600000  # 10 minutos
   ```

2. Reduzir concurrency:
   ```env
   CERTIFICATION_CONCURRENCY=1
   ```

3. Verificar memória disponível:
   ```bash
   free -h
   ```

### Performance lenta

**Problema**: Jobs demoram muito para processar

**Soluções**:
1. Aumentar concurrency:
   ```env
   CERTIFICATION_CONCURRENCY=5
   ```

2. Adicionar mais workers:
   ```bash
   # Terminal 2
   WORKER_HEALTH_PORT=3003 npm run worker
   ```

3. Otimizar certificação (reduzir testes)

4. Usar máquina com mais recursos

### Erro de conexão com banco

**Problema**: Worker não consegue conectar ao PostgreSQL

**Soluções**:
1. Verificar `DATABASE_URL`:
   ```bash
   echo $DATABASE_URL
   ```

2. Testar conexão:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. Verificar se Prisma está gerado:
   ```bash
   npm run prisma:generate
   ```

## Boas Práticas

### 1. Sempre rodar worker separado do servidor API
- Melhor isolamento
- Escalabilidade independente
- Falhas não afetam API

### 2. Monitorar health check regularmente
```bash
# Cron job para verificar saúde
*/5 * * * * curl -f http://localhost:3002/health || systemctl restart myia-worker
```

### 3. Escalar horizontalmente quando necessário
- Adicionar workers conforme carga aumenta
- Monitorar métricas de fila
- Ajustar concurrency por worker

### 4. Configurar alertas para jobs falhados
```javascript
// Exemplo: Enviar email quando job falha
queue.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    await sendAlert({
      subject: 'Job failed permanently',
      jobId: job.id,
      error: err.message
    });
  }
});
```

### 5. Fazer backup do Redis periodicamente
```bash
# Backup diário
0 2 * * * redis-cli BGSAVE
```

### 6. Limpar jobs antigos
```bash
# Limpar jobs completados com mais de 7 dias
redis-cli --scan --pattern "myia:*:completed" | xargs redis-cli DEL
```

## Integração com CI/CD

### GitHub Actions

```yaml
name: Test Worker

on: [push, pull_request]

jobs:
  test-worker:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: myia_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run migrations
        run: |
          cd backend
          npm run prisma:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/myia_test
      
      - name: Start worker
        run: |
          cd backend
          npm run worker &
          sleep 5
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/myia_test
          REDIS_HOST: localhost
      
      - name: Test worker
        run: |
          cd backend
          tsx scripts/test-worker.ts
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/myia_test
          REDIS_HOST: localhost
```

## Próximos Passos

1. **Implementar certificação real** (atualmente simulada)
2. **Adicionar métricas Prometheus**
3. **Implementar retry com backoff exponencial**
4. **Adicionar suporte a prioridades de jobs**
5. **Implementar rate limiting por região**
6. **Adicionar dashboard de monitoramento**

## Referências

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/documentation)
- [Prisma Documentation](https://www.prisma.io/docs)
