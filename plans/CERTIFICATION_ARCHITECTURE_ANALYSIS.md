# Análise de Arquitetura do Sistema de Certificação

> **Documento:** Análise arquitetural completa do sistema de certificação de modelos
> **Data:** 2026-02-03
> **Status:** Subtarefa 4 - Arquitetura

---

## 1. Diagrama de Arquitetura do Sistema

### 1.1 Visão Geral da Arquitetura

```mermaid
flowchart TB
    subgraph Frontend Admin
        FA[CertificationForm.tsx]
        FH[useJobHistory.ts]
        FT[JobHistoryTable.tsx]
        FAPI[certificationApi.ts]
    end

    subgraph Backend API
        CTRL[certificationQueueController.ts]
        ROUTE[certificationQueueRoutes.ts]
        AUTH[authMiddleware.ts]
    end

    subgraph Queue System
        QS[CertificationQueueService.ts]
        BULL[Bull Queue - Redis]
        WORKER[certificationWorker.ts]
    end

    subgraph Certification Engine
        CS[certification.service.ts]
        TR[test-runner.ts]
        EC[error-categorizer.ts]
        RC[rating-calculator.ts]
    end

    subgraph Model Registry
        MR[ModelRegistry]
        MODELS[models/*.ts - 74 modelos]
    end

    subgraph Data Layer
        PRISMA[Prisma Client]
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    subgraph External Services
        AWS[AWS Bedrock API]
    end

    FA -->|POST /certify-all| FAPI
    FH -->|GET /jobs/:id| FAPI
    FT -->|Polling 3s| FH

    FAPI -->|HTTP| ROUTE
    ROUTE --> AUTH
    AUTH --> CTRL

    CTRL -->|certifyAllModels| QS
    QS -->|addJob| BULL
    QS -->|upsert| PRISMA

    BULL -->|process| WORKER
    WORKER -->|processCertification| QS
    QS -->|certifyModel| CS

    CS -->|getModel| MR
    CS -->|runTests| TR
    TR -->|invoke| AWS
    CS -->|categorizeError| EC
    CS -->|calculateRating| RC

    CS -->|upsert| PRISMA
    QS -->|update| PRISMA

    PRISMA --> PG
    BULL --> REDIS

    MR --> MODELS
```

### 1.2 Componentes e Responsabilidades

| Componente | Camada | Responsabilidade |
|------------|--------|------------------|
| `CertificationForm.tsx` | Frontend | UI para iniciar certificações |
| `useJobHistory.ts` | Frontend | Lógica de polling e estado |
| `certificationApi.ts` | Frontend | Cliente HTTP para API |
| `certificationQueueController.ts` | Backend | Endpoints REST |
| `CertificationQueueService.ts` | Backend | Orquestração de jobs |
| `certificationWorker.ts` | Backend | Processamento assíncrono |
| `certification.service.ts` | Backend | Lógica de certificação |
| `ModelRegistry` | Backend | Catálogo de modelos suportados |
| `Bull Queue` | Infra | Fila de jobs |
| `PostgreSQL` | Infra | Persistência |
| `Redis` | Infra | Cache e fila |

---

## 2. Mapa de Fluxo de Dados

### 2.1 Fluxo de Criação de Job

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FA as Frontend Admin
    participant API as Backend API
    participant QS as QueueService
    participant DB as PostgreSQL
    participant BULL as Bull/Redis
    participant W as Worker

    U->>FA: Clica Certificar Todos
    FA->>API: POST /certify-all regions
    API->>DB: SELECT * FROM ai_models WHERE isActive=true
    DB-->>API: 80 modelos ativos
    
    loop Para cada modelo x região
        API->>QS: certifyMultipleModels
        QS->>DB: INSERT CertificationJob
        QS->>DB: UPSERT ModelCertification status=PENDING
        QS->>BULL: addJob com modelId + region
    end
    
    API-->>FA: jobId + totalJobs
    FA->>U: Mostra Job criado

    Note over W,BULL: Worker processa assincronamente
    W->>BULL: Consome job
    W->>QS: processCertification
```

### 2.2 Fluxo de Processamento de Certificação

```mermaid
sequenceDiagram
    participant W as Worker
    participant QS as QueueService
    participant CS as CertificationService
    participant MR as ModelRegistry
    participant AWS as AWS Bedrock
    participant DB as PostgreSQL

    W->>QS: processCertification job
    QS->>DB: UPDATE status=PROCESSING
    
    QS->>DB: SELECT apiModelId FROM AIModel WHERE id=modelId
    DB-->>QS: apiModelId ex: amazon.nova-lite-v1:0
    
    QS->>CS: certifyModel apiModelId, credentials
    
    CS->>MR: getModel apiModelId
    
    alt Modelo encontrado no Registry
        MR-->>CS: ModelMetadata vendor, capabilities
        CS->>AWS: Executa testes
        AWS-->>CS: Resultados
        CS->>DB: UPSERT ModelCertification
        CS-->>QS: CertificationResult
        QS->>DB: UPDATE status=CERTIFIED/FAILED
    else Modelo NÃO encontrado
        MR-->>CS: undefined
        CS-->>QS: Error Model not found in registry
        QS->>DB: UPDATE status=FAILED, errorMessage
    end
    
    QS-->>W: Resultado
```

### 2.3 Transformações de Dados

| Etapa | Entrada | Transformação | Saída |
|-------|---------|---------------|-------|
| 1. Frontend | Regiões selecionadas | Serialização JSON | `{ regions: [us-east-1] }` |
| 2. Controller | Request body | Busca modelos ativos | Lista de UUIDs do banco |
| 3. QueueService | UUID do modelo | Busca apiModelId | `amazon.nova-lite-v1:0` |
| 4. CertificationService | apiModelId | Lookup no Registry | ModelMetadata ou undefined |
| 5. TestRunner | ModelMetadata | Executa testes AWS | TestResult[] |
| 6. RatingCalculator | Métricas | Calcula score | Rating 0-5 + Badge |
| 7. Prisma | Resultado | Upsert | ModelCertification |

---

## 3. Identificação de Pontos de Falha

### 3.1 Ponto de Falha 1: Validação de Modelos Antes de Criar Job

```mermaid
flowchart LR
    subgraph Problema
        A[AIModel no banco] -->|UUID| B[CertificationJob]
        B -->|UUID| C[Worker processa]
        C -->|Busca apiModelId| D[Banco retorna]
        D -->|apiModelId| E[Registry.getModel]
        E -->|undefined| F[ERRO: Model not found]
    end
    
    style F fill:#f66,stroke:#333
```

**Causa Raiz:**
- O banco de dados (`AIModel`) contém **80 modelos** de diversos providers
- O `ModelRegistry` contém apenas **74 modelos** do AWS Bedrock
- **6 modelos incompatíveis** estão no banco mas não no Registry:
  - OpenAI: `gpt-3.5-turbo`, `gpt-4-turbo`
  - Groq: `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`
  - HuggingFace: `meta-llama/Llama-3-70b-chat-hf`, `Qwen/Qwen1.5-72B-Chat`

**Impacto:** Jobs falham com erro "Model not found in registry" para modelos não-Bedrock.

### 3.2 Ponto de Falha 2: Lookup no Registry Durante Certificação

```mermaid
flowchart TB
    subgraph certification.service.ts linha 162-166
        A[certifyModel recebe apiModelId]
        B{ModelRegistry.getModel}
        C[Retorna ModelMetadata]
        D[Lança Error]
    end
    
    A --> B
    B -->|Encontrado| C
    B -->|Não encontrado| D
    
    style D fill:#f66
```

**Código Problemático:**
```typescript
// certification.service.ts:162-166
const metadata = ModelRegistry.getModel(modelId);
if (!metadata) {
  logger.error(`[CertificationService] ❌ Modelo ${modelId} não encontrado no registry`);
  throw new Error(`Model ${modelId} not found in registry`);
}
```

**Problema:** Não há validação prévia se o modelo é certificável antes de criar o job.

### 3.3 Ponto de Falha 3: Atualização de Status no Banco

```mermaid
flowchart TB
    subgraph Fluxo de Status
        A[PENDING] --> B[QUEUED]
        B --> C[PROCESSING]
        C --> D{Resultado}
        D -->|Sucesso| E[CERTIFIED]
        D -->|Falha| F[FAILED]
        D -->|Parcial| G[QUALITY_WARNING]
    end
    
    subgraph Problema de Tipo
        H[rating: Float?]
        I[Recebe String]
        J[Erro de tipo]
    end
    
    I --> J
    
    style J fill:#f66
```

**Bug Identificado:** Campo `rating` no schema é `Float?` mas pode receber `String` em alguns casos.

### 3.4 Ponto de Falha 4: Descompasso de Identificadores

```mermaid
flowchart LR
    subgraph Banco AIModel
        A1[id: UUID]
        A2[apiModelId: string]
    end
    
    subgraph ModelRegistry
        B1[modelId: string]
    end
    
    subgraph Problema
        C[UUID ≠ apiModelId ≠ modelId]
    end
    
    A1 --> C
    A2 --> C
    B1 --> C
    
    style C fill:#ff9
```

**Formatos de ID:**
| Fonte | Formato | Exemplo |
|-------|---------|---------|
| AIModel.id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| AIModel.apiModelId | Provider-specific | `amazon.nova-lite-v1:0` |
| ModelRegistry.modelId | Bedrock format | `anthropic.claude-3-sonnet-20240229-v1:0` |

### 3.5 Ponto de Falha 5: Falta de Filtro por Provider

```mermaid
flowchart TB
    subgraph certifyAllModels
        A[SELECT * FROM ai_models WHERE isActive=true]
        B[Retorna TODOS os modelos]
        C[Inclui OpenAI, Groq, HuggingFace]
        D[Tenta certificar no Bedrock]
        E[FALHA]
    end
    
    A --> B --> C --> D --> E
    
    style E fill:#f66
```

**Código Problemático:**
```typescript
// CertificationQueueService.ts:239-246
const models = await prisma.aIModel.findMany({
  where: {
    isActive: true  // ← Não filtra por provider!
  },
  select: {
    id: true
  }
});
```

---

## 4. Proposta de Arquitetura Melhorada

### 4.1 Solução para Descompasso Banco/Registry

```mermaid
flowchart TB
    subgraph Arquitetura Atual
        A1[AIModel - 80 modelos]
        A2[ModelRegistry - 74 modelos]
        A3[Descompasso]
    end
    
    subgraph Arquitetura Proposta
        B1[AIModel com provider filter]
        B2[ModelRegistry como fonte de verdade]
        B3[Validação prévia]
    end
    
    A1 --> A3
    A2 --> A3
    
    B1 --> B3
    B2 --> B3
```

**Solução 1: Filtrar por Provider no Banco**
```typescript
// CertificationQueueService.ts - PROPOSTA
const models = await prisma.aIModel.findMany({
  where: {
    isActive: true,
    provider: {
      slug: 'bedrock'  // ← Filtrar apenas modelos Bedrock
    }
  }
});
```

**Solução 2: Validar contra Registry antes de criar job**
```typescript
// CertificationQueueService.ts - PROPOSTA
const validModels = modelIds.filter(id => {
  const model = await prisma.aIModel.findUnique({ where: { id } });
  return ModelRegistry.isSupported(model.apiModelId);
});
```

### 4.2 Onde Adicionar Validações

```mermaid
flowchart TB
    subgraph Validações Propostas
        V1[1. Controller: Validar provider]
        V2[2. QueueService: Validar Registry]
        V3[3. Worker: Retry com backoff]
        V4[4. CertificationService: Fallback gracioso]
    end
    
    V1 --> V2 --> V3 --> V4
```

| Camada | Validação | Ação |
|--------|-----------|------|
| Controller | Provider é Bedrock? | Rejeitar com 400 |
| QueueService | Modelo existe no Registry? | Não criar job |
| Worker | Erro temporário? | Retry com exponential backoff |
| CertificationService | Modelo não encontrado? | Retornar status UNSUPPORTED |

### 4.3 Arquitetura de Resiliência

```mermaid
flowchart TB
    subgraph Circuit Breaker Pattern
        A[Request] --> B{Circuit Open?}
        B -->|Não| C[Tenta AWS]
        B -->|Sim| D[Retorna cached/fallback]
        C -->|Sucesso| E[Reset counter]
        C -->|Falha| F{Threshold?}
        F -->|Não| G[Increment counter]
        F -->|Sim| H[Open circuit]
    end
```

**Melhorias de Resiliência:**
1. **Circuit Breaker** para AWS Bedrock
2. **Cache de certificações** válidas
3. **Retry com exponential backoff**
4. **Dead Letter Queue** para jobs que falharam múltiplas vezes

### 4.4 Diagrama de Arquitetura Proposta

```mermaid
flowchart TB
    subgraph Frontend Admin
        FA[CertificationForm]
        FH[useJobHistory]
    end

    subgraph Backend API
        CTRL[Controller]
        VAL[ModelValidator - NOVO]
    end

    subgraph Queue System
        QS[QueueService]
        BULL[Bull Queue]
        DLQ[Dead Letter Queue - NOVO]
        WORKER[Worker]
    end

    subgraph Certification Engine
        CS[CertificationService]
        CB[CircuitBreaker - NOVO]
        CACHE[CertificationCache - NOVO]
    end

    subgraph Model Registry
        MR[ModelRegistry]
        SYNC[RegistrySync - NOVO]
    end

    FA --> CTRL
    CTRL --> VAL
    VAL -->|Válido| QS
    VAL -->|Inválido| CTRL

    QS --> BULL
    BULL --> WORKER
    WORKER -->|Falha permanente| DLQ

    WORKER --> CS
    CS --> CB
    CB -->|Open| CACHE
    CB -->|Closed| AWS

    SYNC --> MR
    SYNC --> DB
```

---

## 5. Matriz de Responsabilidades

### 5.1 RACI Matrix

| Componente | Validação de Modelo | Criação de Job | Processamento | Persistência | Notificação |
|------------|---------------------|----------------|---------------|--------------|-------------|
| Frontend | I | R | I | - | A |
| Controller | A | A | I | - | - |
| QueueService | C | R | A | R | - |
| Worker | - | - | R | C | - |
| CertificationService | R | - | R | R | - |
| ModelRegistry | R | C | C | - | - |
| Prisma | - | - | - | R | - |

**Legenda:** R=Responsável, A=Aprova, C=Consultado, I=Informado

### 5.2 Tratamento de Erros por Componente

| Componente | Tipo de Erro | Tratamento Atual | Tratamento Proposto |
|------------|--------------|------------------|---------------------|
| Controller | Modelo não existe | 404 Not Found | ✅ Correto |
| Controller | Provider inválido | Não valida | ❌ Adicionar validação |
| QueueService | Modelo não no Registry | Cria job mesmo assim | ❌ Validar antes |
| Worker | Erro de processamento | Retry 3x | ✅ Correto |
| CertificationService | Model not found | Throw Error | ❌ Retornar UNSUPPORTED |
| CertificationService | AWS timeout | Categoriza como FAILED | ⚠️ Adicionar retry |

### 5.3 Fluxo de Erros Proposto

```mermaid
flowchart TB
    subgraph Erro: Modelo não suportado
        E1[Controller recebe request]
        E2{Modelo é Bedrock?}
        E3[Retorna 400: Provider não suportado]
        E4{Modelo no Registry?}
        E5[Retorna 400: Modelo não certificável]
        E6[Cria job normalmente]
    end
    
    E1 --> E2
    E2 -->|Não| E3
    E2 -->|Sim| E4
    E4 -->|Não| E5
    E4 -->|Sim| E6
```

---

## 6. Resumo Executivo

### 6.1 Problemas Identificados

1. **Descompasso Banco/Registry:** 80 modelos no banco vs 74 no Registry
2. **6 modelos incompatíveis:** OpenAI, Groq, HuggingFace não são Bedrock
3. **Falta de validação prévia:** Jobs são criados para modelos não certificáveis
4. **Bug de tipo:** Campo `rating` pode receber String em vez de Float
5. **Sem filtro por provider:** `certifyAllModels` inclui todos os providers

### 6.2 Soluções Propostas

1. **Filtrar por provider** na query de modelos ativos
2. **Validar contra Registry** antes de criar job
3. **Adicionar status UNSUPPORTED** para modelos não-Bedrock
4. **Implementar Circuit Breaker** para resiliência
5. **Criar Dead Letter Queue** para jobs problemáticos

### 6.3 Impacto Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Jobs com erro "not found" | ~7.5% (6/80) | 0% |
| Tempo de feedback ao usuário | Após falha | Imediato |
| Resiliência a falhas AWS | Baixa | Alta |
| Clareza de erros | Genérica | Específica |

---

## 7. Próximos Passos Recomendados

### 7.1 Curto Prazo - Quick Wins

- [ ] Adicionar filtro `provider.slug = 'bedrock'` em `certifyAllModels`
- [ ] Validar modelo contra Registry antes de criar job
- [ ] Corrigir tipo do campo `rating` para garantir Float

### 7.2 Médio Prazo - Melhorias Estruturais

- [ ] Implementar status `UNSUPPORTED` para modelos não-Bedrock
- [ ] Criar endpoint para listar apenas modelos certificáveis
- [ ] Adicionar Circuit Breaker para AWS Bedrock

### 7.3 Longo Prazo - Arquitetura

- [ ] Sincronizar banco com Registry automaticamente
- [ ] Implementar Dead Letter Queue
- [ ] Dashboard de saúde do sistema de certificação

---

*Documento gerado como parte da análise de arquitetura do sistema de certificação.*
