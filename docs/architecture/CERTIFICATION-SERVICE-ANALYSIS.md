# Análise Arquitetural: Sistema de Certificação como Serviço Separado

**Data:** 2026-02-07  
**Autor:** Arquiteto de Sistema  
**Status:** Análise Completa  
**Versão:** 1.0

---

## 📋 Sumário Executivo

Este documento analisa a viabilidade e benefícios de extrair o sistema de certificação de modelos para um microserviço independente, avaliando três opções arquiteturais distintas com base em critérios técnicos, operacionais e de negócio.

**Recomendação:** **Opção B - Worker Separado (Híbrido)** é a melhor escolha para o estágio atual do projeto, oferecendo escalabilidade independente com complexidade operacional controlada.

---

## 🔍 1. Estado Atual do Sistema

### 1.1 Arquitetura Atual

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Monolítico                    │
│                      (Node.js/Express)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌──────────────────┐      │
│  │  API Routes     │────────▶│  Controllers     │      │
│  │  /certification │         │  Queue           │      │
│  └─────────────────┘         └──────────────────┘      │
│           │                            │                 │
│           ▼                            ▼                 │
│  ┌─────────────────────────────────────────────┐       │
│  │     CertificationQueueService               │       │
│  │  (Orquestração + Validação + Criação Jobs)  │       │
│  └─────────────────────────────────────────────┘       │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────────────────────────────────┐       │
│  │          Bull Queue (Redis)                  │       │
│  │     Queue: model-certification               │       │
│  └─────────────────────────────────────────────┘       │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────────────────────────────────┐       │
│  │      CertificationWorker                     │       │
│  │   (Processa jobs no mesmo processo)          │       │
│  │   - Concurrency: 3                           │       │
│  │   - Timeout: 300s                            │       │
│  │   - Max Retries: 3                           │       │
│  └─────────────────────────────────────────────┘       │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────────────────────────────────┐       │
│  │    ModelCertificationService                 │       │
│  │  - Executa testes AWS Bedrock                │       │
│  │  - Calcula métricas                          │       │
│  │  - Determina status                          │       │
│  │  - Persiste resultados                       │       │
│  └─────────────────────────────────────────────┘       │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────────────────────────────────┐       │
│  │         PostgreSQL Database                  │       │
│  │  - ModelCertification (regional)             │       │
│  │  - CertificationJob                          │       │
│  │  - JobCertification                          │       │
│  │  - Logs                                      │       │
│  └─────────────────────────────────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Principais

#### 1.2.1 API Layer
- **Rotas:** [`backend/src/routes/certificationQueueRoutes.ts`](backend/src/routes/certificationQueueRoutes.ts)
- **Endpoints:**
  - `POST /certify-model` - Certifica modelo único
  - `POST /certify-multiple` - Certifica múltiplos modelos
  - `POST /certify-all` - Certifica todos os modelos
  - `GET /jobs/:jobId` - Status do job
  - `GET /history` - Histórico de jobs
  - `GET /certifications` - Lista certificações
  - `GET /stats` - Estatísticas da fila
  - `DELETE /jobs/:jobId` - Cancela job

#### 1.2.2 Queue Service
- **Arquivo:** [`backend/src/services/queue/CertificationQueueService.ts`](backend/src/services/queue/CertificationQueueService.ts)
- **Responsabilidades:**
  - Validação de modelos (ModelValidator)
  - Criação de jobs (JobCreator)
  - Processamento (JobProcessor)
  - Consultas de status (StatusQuery)
- **Padrão:** Facade Pattern

#### 1.2.3 Worker
- **Arquivo:** [`backend/src/workers/certificationWorker.ts`](backend/src/workers/certificationWorker.ts)
- **Configuração:**
  - Concurrency: 3 jobs simultâneos
  - Timeout: 300s (5 minutos)
  - Max Retries: 3 tentativas
  - Queue Name: `model-certification`
- **Hooks:**
  - `active` - Atualiza status para PROCESSING
  - `completed` - Atualiza status para COMPLETED/CERTIFIED
  - `failed` - Atualiza status para FAILED
  - `stalled` - Log de warning

#### 1.2.4 Certification Service
- **Arquivo:** [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts)
- **Módulos:**
  - CacheManager - Cache de certificações
  - VendorTestSelector - Seleção de testes por vendor
  - TestOrchestrator - Execução de testes com retry
  - MetricsCalculator - Cálculo de métricas
  - StatusDeterminer - Determinação de status
  - CertificationRepository - Persistência
  - CertificationQueries - Consultas

#### 1.2.5 Database Schema
- **Arquivo:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- **Tabelas:**
  - `ModelCertification` - Certificações regionais (modelId + region)
  - `CertificationJob` - Jobs de certificação em lote
  - `JobCertification` - Certificações individuais por job
  - `Log` - Logs estruturados

### 1.3 Dependências Críticas

#### Internas
- **Prisma ORM** - Acesso ao banco de dados
- **Bull Queue** - Fila de jobs (Redis)
- **Logger** - Sistema de logging estruturado
- **ModelRegistry** - Registro de modelos disponíveis
- **AWS SDK** - Comunicação com AWS Bedrock

#### Externas
- **Redis** - Armazenamento da fila Bull
- **PostgreSQL** - Persistência de certificações
- **AWS Bedrock** - API de modelos de IA

### 1.4 Acoplamentos Identificados

#### Alto Acoplamento
1. **Prisma Client** - Compartilhado com backend principal
2. **Logger** - Sistema de logging centralizado
3. **Configurações (env)** - Variáveis de ambiente compartilhadas
4. **ModelRegistry** - Registro de modelos em memória

#### Médio Acoplamento
1. **Redis** - Fila compartilhada (mas isolável)
2. **Database** - Tabelas específicas de certificação

#### Baixo Acoplamento
1. **AWS SDK** - Biblioteca independente
2. **Bull Queue** - Pode ter instância separada

---

## 📊 2. Análise de Métricas

### 2.1 Métricas Atuais (Estimadas)

#### Performance
- **Tempo médio de certificação:** 15-30s por modelo
- **Throughput:** ~3 modelos/minuto (concurrency=3)
- **Timeout configurado:** 300s (5 minutos)
- **Taxa de sucesso:** ~85-90% (baseado em logs)

#### Recursos
- **CPU:** Picos durante execução de testes AWS
- **Memória:** ~50-100MB por worker ativo
- **Rede:** Chamadas HTTP para AWS Bedrock
- **I/O:** Escrita no PostgreSQL + Redis

#### Escalabilidade
- **Modelos certificáveis:** ~50-100 modelos Bedrock
- **Regiões:** 3-5 regiões AWS
- **Jobs simultâneos:** 3 (configurável)
- **Carga estimada:** Baixa-Média (certificações sob demanda)

### 2.2 Gargalos Identificados

1. **Concurrency Limitada**
   - Worker roda no mesmo processo do backend
   - Competição por recursos CPU/memória
   - Não escala horizontalmente

2. **Timeout Compartilhado**
   - Timeout de 300s pode impactar requisições HTTP
   - Certificações longas podem bloquear recursos

3. **Deploy Acoplado**
   - Mudanças no worker requerem deploy do backend inteiro
   - Rollback afeta todo o sistema

4. **Monitoramento Limitado**
   - Métricas misturadas com backend principal
   - Difícil isolar problemas de certificação

---

## 🏗️ 3. Opções Arquiteturais

### Opção A: Microserviço Completo

#### Arquitetura

```
┌──────────────────────┐         ┌─────────────────────────┐
│   MyIA Backend API   │         │  Certification Service  │
│   (Express/Node.js)  │         │    (Express/Node.js)    │
├──────────────────────┤         ├─────────────────────────┤
│                      │         │                         │
│  POST /certify       │────────▶│  POST /certify          │
│  GET /status/:id     │◀────────│  GET /status/:id        │
│                      │  HTTP   │                         │
└──────────────────────┘         │  ┌───────────────────┐ │
                                 │  │  Bull Queue       │ │
                                 │  │  (Redis próprio)  │ │
                                 │  └───────────────────┘ │
                                 │           │             │
                                 │           ▼             │
                                 │  ┌───────────────────┐ │
                                 │  │  Worker           │ │
                                 │  │  (Concurrency: 5) │ │
                                 │  └───────────────────┘ │
                                 │           │             │
                                 │           ▼             │
                                 │  ┌───────────────────┐ │
                                 │  │  PostgreSQL       │ │
                                 │  │  (DB compartilhado│ │
                                 │  │   ou separado)    │ │
                                 │  └───────────────────┘ │
                                 └─────────────────────────┘
```

#### Características

**Separação Completa:**
- API própria (porta separada)
- Redis próprio (ou namespace isolado)
- Código completamente desacoplado
- Deploy independente
- Escalabilidade horizontal completa

**Comunicação:**
- HTTP REST entre serviços
- Eventos assíncronos (opcional)
- Autenticação via JWT compartilhado

**Infraestrutura:**
- Container Docker separado
- Service no Kubernetes/Docker Compose
- Load balancer próprio (opcional)

#### Prós

✅ **Escalabilidade Máxima**
- Escala horizontalmente sem limites
- Recursos dedicados (CPU, memória)
- Pode usar linguagem otimizada (Go, Rust)

✅ **Isolamento Total**
- Falhas não afetam backend principal
- Deploy independente
- Rollback isolado

✅ **Monitoramento Específico**
- Métricas dedicadas
- Logs isolados
- APM específico

✅ **Tecnologia Flexível**
- Pode usar stack diferente
- Otimizações específicas
- Bibliotecas especializadas

✅ **Segurança**
- Credenciais AWS isoladas
- Rede privada possível
- Rate limiting independente

#### Contras

❌ **Complexidade Operacional Alta**
- Mais serviços para gerenciar
- Orquestração complexa (K8s/Docker Compose)
- Monitoramento distribuído

❌ **Latência de Rede**
- Overhead HTTP entre serviços
- Possível timeout em cascata
- Retry logic mais complexa

❌ **Consistência de Dados**
- Transações distribuídas
- Eventual consistency
- Sincronização de estado

❌ **Duplicação de Código**
- Auth/JWT duplicado
- Logger duplicado
- Configurações duplicadas
- Modelos Prisma duplicados

❌ **Custo de Infraestrutura**
- Mais containers/VMs
- Mais recursos de rede
- Mais custos de cloud

❌ **Debugging Complexo**
- Traces distribuídos
- Logs em múltiplos lugares
- Correlação de erros difícil

#### Quando Usar

- Sistema com **alta carga** de certificações (>1000/dia)
- Necessidade de **escalar independentemente**
- Equipe dedicada para certificação
- Infraestrutura madura (K8s, observabilidade)
- Budget para infraestrutura adicional

---

### Opção B: Worker Separado (Híbrido) ⭐ **RECOMENDADO**

#### Arquitetura

```
┌──────────────────────────────────────────────────────┐
│              MyIA Backend API                        │
│              (Express/Node.js)                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  POST /certify ──▶ CertificationQueueService        │
│  GET /status/:id ──▶ StatusQuery                    │
│                                                       │
│           │                                           │
│           ▼                                           │
│  ┌────────────────────────────────────────┐         │
│  │     Bull Queue (Redis Compartilhado)   │         │
│  │     Queue: model-certification         │         │
│  └────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
                      │
                      │ (Redis)
                      ▼
┌──────────────────────────────────────────────────────┐
│         Certification Worker (Processo Separado)     │
│              (Node.js Standalone)                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────┐         │
│  │   CertificationWorker                  │         │
│  │   - Concurrency: 5 (configurável)      │         │
│  │   - Timeout: 300s                      │         │
│  │   - Max Retries: 3                     │         │
│  └────────────────────────────────────────┘         │
│           │                                           │
│           ▼                                           │
│  ┌────────────────────────────────────────┐         │
│  │   ModelCertificationService            │         │
│  │   (Código compartilhado via npm)       │         │
│  └────────────────────────────────────────┘         │
│           │                                           │
│           ▼                                           │
│  ┌────────────────────────────────────────┐         │
│  │   PostgreSQL (Compartilhado)           │         │
│  └────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
```

#### Características

**Separação Parcial:**
- Worker em processo separado
- Redis compartilhado (Bull Queue)
- Database compartilhado
- Código compartilhado via módulos

**Comunicação:**
- Fila Bull (Redis) como intermediário
- Sem HTTP entre serviços
- Estado compartilhado no PostgreSQL

**Infraestrutura:**
- Container Docker separado (opcional)
- Processo Node.js independente
- Escalável horizontalmente (múltiplas instâncias)

#### Prós

✅ **Escalabilidade Independente**
- Worker escala sem afetar API
- Múltiplas instâncias do worker
- Concurrency configurável por instância

✅ **Deploy Independente**
- Worker pode ser atualizado separadamente
- Rollback isolado do worker
- Zero downtime para API

✅ **Isolamento de Recursos**
- CPU/memória dedicados ao worker
- Não compete com requisições HTTP
- Pode rodar em máquina separada

✅ **Complexidade Controlada**
- Sem overhead HTTP
- Sem transações distribuídas
- Código compartilhado (DRY)

✅ **Monitoramento Melhorado**
- Métricas do worker isoladas
- Logs separados por processo
- Health check dedicado

✅ **Custo Moderado**
- Infraestrutura adicional mínima
- Redis compartilhado
- Database compartilhado

✅ **Fácil Migração**
- Código já modularizado
- Dockerfile já existe ([`backend/Dockerfile.worker`](backend/Dockerfile.worker))
- Mudanças mínimas necessárias

#### Contras

⚠️ **Acoplamento Parcial**
- Redis compartilhado (ponto único de falha)
- Database compartilhado (schema coupling)
- Código compartilhado (versioning)

⚠️ **Consistência de Dados**
- Sincronização Redis ↔ PostgreSQL
- Possível dessincronia (já existe logs para isso)

⚠️ **Debugging Moderado**
- Logs em dois processos
- Correlação via jobId/requestId

⚠️ **Infraestrutura Adicional**
- Mais um processo para gerenciar
- Mais um container (se Docker)

#### Quando Usar

- Carga **moderada** de certificações (100-1000/dia)
- Necessidade de **escalar worker** sem afetar API
- Infraestrutura **simples** (Docker Compose)
- Equipe **pequena/média**
- Budget **limitado**
- **Estágio atual do projeto** ✅

---

### Opção C: Manter Atual (Modular)

#### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Monolítico                    │
│                      (Node.js/Express)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  API + Worker no mesmo processo                          │
│                                                           │
│  ┌─────────────────────────────────────────────┐       │
│  │  Módulos bem separados:                      │       │
│  │  - CertificationQueueService                 │       │
│  │  - ModelCertificationService                 │       │
│  │  - CertificationWorker                       │       │
│  │  - Validators, Processors, Queries           │       │
│  └─────────────────────────────────────────────┘       │
│                                                           │
│  ✅ Código já modularizado (Fase 1 completa)            │
│  ✅ Fácil de testar                                      │
│  ✅ Fácil de debugar                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Características

**Monolito Modular:**
- Tudo no mesmo processo
- Módulos bem separados (SRP)
- Fácil de desenvolver e debugar

**Comunicação:**
- Chamadas de função diretas
- Sem overhead de rede
- Transações ACID simples

**Infraestrutura:**
- Um único container/processo
- Simples de deployar
- Simples de monitorar

#### Prós

✅ **Simplicidade Máxima**
- Um único processo
- Um único deploy
- Um único log

✅ **Performance**
- Sem overhead de rede
- Chamadas de função diretas
- Transações ACID simples

✅ **Debugging Fácil**
- Stack traces completos
- Logs centralizados
- Breakpoints funcionam

✅ **Custo Mínimo**
- Infraestrutura mínima
- Sem overhead de rede
- Recursos compartilhados

✅ **Código Modular**
- Já refatorado (Fase 1)
- Fácil de testar
- Fácil de manter

✅ **Transações Simples**
- ACID garantido
- Sem eventual consistency
- Rollback simples

#### Contras

❌ **Escalabilidade Limitada**
- Não escala horizontalmente
- Worker compete com API por recursos
- Concurrency limitada

❌ **Deploy Acoplado**
- Mudanças no worker requerem deploy completo
- Rollback afeta todo o sistema
- Downtime para ambos

❌ **Isolamento Inexistente**
- Falhas no worker afetam API
- Recursos compartilhados
- Monitoramento misturado

❌ **Gargalo de Recursos**
- CPU/memória compartilhados
- Certificações pesadas impactam API
- Não pode usar máquina dedicada

#### Quando Usar

- Carga **baixa** de certificações (<100/dia)
- Equipe **muito pequena** (1-2 devs)
- Infraestrutura **mínima**
- **Prototipagem rápida**
- Budget **muito limitado**

---

## 📊 4. Matriz de Decisão

### 4.1 Critérios de Avaliação

| Critério | Peso | Opção A (Microserviço) | Opção B (Worker) | Opção C (Atual) |
|----------|------|------------------------|------------------|-----------------|
| **Escalabilidade** | 20% | 10 | 8 | 4 |
| **Complexidade Operacional** | 15% | 3 | 7 | 10 |
| **Custo de Infraestrutura** | 10% | 4 | 7 | 10 |
| **Facilidade de Manutenção** | 15% | 6 | 8 | 9 |
| **Isolamento de Falhas** | 15% | 10 | 7 | 3 |
| **Performance** | 10% | 7 | 9 | 10 |
| **Facilidade de Deploy** | 10% | 5 | 8 | 10 |
| **Monitoramento** | 5% | 9 | 7 | 5 |
| **Total Ponderado** | 100% | **6.85** | **7.60** ⭐ | **7.15** |

### 4.2 Análise por Cenário

#### Cenário 1: Carga Baixa (<100 certificações/dia)
- **Vencedor:** Opção C (Atual)
- **Justificativa:** Simplicidade supera benefícios de separação

#### Cenário 2: Carga Moderada (100-1000 certificações/dia)
- **Vencedor:** Opção B (Worker Separado) ⭐
- **Justificativa:** Melhor custo-benefício, escalabilidade suficiente

#### Cenário 3: Carga Alta (>1000 certificações/dia)
- **Vencedor:** Opção A (Microserviço)
- **Justificativa:** Escalabilidade horizontal necessária

#### Cenário 4: Equipe Pequena (1-3 devs)
- **Vencedor:** Opção B (Worker Separado) ⭐
- **Justificativa:** Complexidade gerenciável, benefícios significativos

#### Cenário 5: Equipe Grande (>5 devs)
- **Vencedor:** Opção A (Microserviço)
- **Justificativa:** Equipe dedicada pode gerenciar complexidade

---

## 🎯 5. Recomendação

### 5.1 Opção Escolhida: **B - Worker Separado (Híbrido)** ⭐

#### Justificativa

1. **Melhor Custo-Benefício**
   - Escalabilidade independente com complexidade controlada
   - Infraestrutura adicional mínima
   - Código já modularizado (Fase 1 completa)

2. **Adequado ao Estágio Atual**
   - Carga moderada de certificações
   - Equipe pequena/média
   - Infraestrutura simples (Docker Compose)

3. **Migração Incremental**
   - Dockerfile já existe
   - Código já preparado
   - Mudanças mínimas necessárias

4. **Escalabilidade Futura**
   - Pode evoluir para Opção A se necessário
   - Múltiplas instâncias do worker
   - Concurrency configurável

5. **Isolamento Suficiente**
   - Worker não compete com API
   - Deploy independente
   - Rollback isolado

### 5.2 Quando Migrar para Opção A

Considerar migração para microserviço completo quando:

- Certificações > 1000/dia
- Equipe dedicada para certificação (>2 devs)
- Infraestrutura madura (Kubernetes)
- Budget para infraestrutura adicional
- Necessidade de tecnologia diferente (Go, Rust)

### 5.3 Quando Voltar para Opção C

Considerar voltar para monolito se:

- Certificações < 50/dia
- Equipe muito pequena (1 dev)
- Problemas operacionais recorrentes
- Custo de infraestrutura alto

---

## 🚀 6. Roadmap de Migração (Opção B)

### Fase 1: Preparação (1-2 dias)

#### 1.1 Revisar Código Existente
- ✅ Código já modularizado (Fase 1 completa)
- ✅ Dockerfile.worker já existe
- ✅ Worker já isolado em arquivo separado

#### 1.2 Configurar Variáveis de Ambiente
```bash
# .env.worker (novo arquivo)
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
CERTIFICATION_QUEUE_NAME=model-certification
CERTIFICATION_CONCURRENCY=5  # Aumentar de 3 para 5
CERTIFICATION_TIMEOUT=300000
CERTIFICATION_MAX_RETRIES=3
AWS_BEDROCK_REGION=us-east-1
```

#### 1.3 Criar Script de Inicialização
```bash
# scripts/services/worker.sh (já existe)
#!/bin/bash
cd backend
npm run worker:prod
```

### Fase 2: Separação do Worker (2-3 dias)

#### 2.1 Criar Entrypoint do Worker
```typescript
// backend/src/workers/index.ts (já existe)
import { certificationWorker } from './certificationWorker';
import { logger } from '../utils/logger';

async function main() {
  logger.info('🚀 Starting Certification Worker...');
  
  try {
    certificationWorker.start();
    logger.info('✅ Worker started successfully');
  } catch (error) {
    logger.error('❌ Failed to start worker', { error });
    process.exit(1);
  }
}

main();
```

#### 2.2 Atualizar package.json
```json
{
  "scripts": {
    "worker:dev": "ts-node src/workers/index.ts",
    "worker:prod": "node dist/workers/index.js",
    "worker:build": "tsc"
  }
}
```

#### 2.3 Remover Worker do Backend Principal
```typescript
// backend/src/server.ts
// REMOVER: import { certificationWorker } from './workers/certificationWorker';
// REMOVER: certificationWorker.start();

// O worker agora roda em processo separado
```

### Fase 3: Docker Compose (1 dia)

#### 3.1 Atualizar docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - CERTIFICATION_CONCURRENCY=5
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myia
      - POSTGRES_USER=leonardo
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Fase 4: Health Check (1 dia)

#### 4.1 Adicionar Health Check ao Worker
```typescript
// backend/src/workers/healthCheck.ts (já existe)
import express from 'express';
import { certificationWorker } from './certificationWorker';
import { logger } from '../utils/logger';

const app = express();
const PORT = process.env.WORKER_HEALTH_PORT || 3002;

app.get('/health', async (req, res) => {
  try {
    const status = certificationWorker.getStatus();
    const stats = await certificationWorker.getQueueStats();
    
    res.json({
      status: 'healthy',
      worker: status,
      queue: stats,
      timestamp: new Date().toISOString()