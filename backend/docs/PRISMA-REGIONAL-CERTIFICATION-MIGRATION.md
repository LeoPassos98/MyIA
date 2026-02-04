# Prisma Migration - Certificação Regional

## Visão Geral

Migration para suportar certificação de modelos AI por região AWS.

## Mudanças no Schema

### Novos Modelos

#### 1. ModelCertification
Armazena certificações individuais de modelos por região.

**Campos principais**:
- `modelId` + `region`: Chave única composta
- `status`: Status da certificação (PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED)
- `passed`, `score`, `rating`: Resultados da certificação
- `testResults`: JSON com detalhes dos testes
- `jobId`: Referência ao job Bull Queue
- `startedAt`, `completedAt`, `duration`: Métricas de tempo
- `createdBy`: User ID que iniciou a certificação

**Índices**:
- Unique: `[modelId, region]`
- Index: `status`, `region`, `jobId`, `createdAt`

**Relacionamentos**:
- `model`: Relacionamento com `AIModel` (CASCADE delete)

#### 2. CertificationJob
Rastreia jobs de certificação em lote.

**Campos principais**:
- `type`: Tipo de job (SINGLE_MODEL, MULTIPLE_MODELS, ALL_MODELS, RECERTIFY)
- `regions`: Array de regiões AWS
- `modelIds`: Array de IDs de modelos
- `status`: Status do job (PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED, PAUSED)
- `totalModels`, `processedModels`, `successCount`, `failureCount`: Contadores de progresso
- `bullJobId`: Referência ao job Bull Queue
- `config`: JSON com configurações adicionais

**Índices**:
- Index: `status`, `type`, `bullJobId`, `createdAt`

#### 3. ModelCertificationLegacy
Tabela legada renomeada de `model_certifications` para `model_certifications_legacy`.
Mantida para compatibilidade e histórico.

### Enums Adicionados

#### CertificationStatus
```typescript
enum CertificationStatus {
  PENDING      // Aguardando processamento
  QUEUED       // Na fila Bull
  PROCESSING   // Sendo processado
  COMPLETED    // Concluído com sucesso
  FAILED       // Falhou
  CANCELLED    // Cancelado
}
```

#### CertificationJobType
```typescript
enum CertificationJobType {
  SINGLE_MODEL    // Certificar um modelo específico
  MULTIPLE_MODELS // Certificar múltiplos modelos
  ALL_MODELS      // Certificar todos os modelos
  RECERTIFY       // Re-certificar modelos existentes
}
```

#### JobStatus
```typescript
enum JobStatus {
  PENDING      // Aguardando processamento
  QUEUED       // Na fila Bull
  PROCESSING   // Sendo processado
  COMPLETED    // Concluído
  FAILED       // Falhou
  CANCELLED    // Cancelado
  PAUSED       // Pausado
}
```

### Relacionamentos Atualizados

#### AIModel
Adicionado relacionamento:
```prisma
model AIModel {
  // ... campos existentes ...
  certifications ModelCertification[]
}
```

## Queries Comuns

### Buscar certificações de um modelo

```typescript
const certifications = await prisma.modelCertification.findMany({
  where: { modelId: 'model-id' },
  orderBy: { createdAt: 'desc' }
});
```

### Buscar certificações por região

```typescript
const certifications = await prisma.modelCertification.findMany({
  where: { 
    region: 'us-east-1',
    status: 'COMPLETED'
  },
  include: { model: true }
});
```

### Buscar certificação específica

```typescript
const certification = await prisma.modelCertification.findUnique({
  where: {
    modelId_region: {
      modelId: 'model-id',
      region: 'us-east-1'
    }
  }
});
```

### Criar certificação

```typescript
const certification = await prisma.modelCertification.create({
  data: {
    modelId: 'model-id',
    region: 'us-east-1',
    status: 'PENDING',
    createdBy: userId
  }
});
```

### Atualizar status de certificação

```typescript
await prisma.modelCertification.update({
  where: { id: certificationId },
  data: {
    status: 'COMPLETED',
    passed: true,
    score: 95.5,
    rating: 'A',
    completedAt: new Date(),
    duration: 5000
  }
});
```

### Criar job de certificação

```typescript
const job = await prisma.certificationJob.create({
  data: {
    type: 'ALL_MODELS',
    regions: ['us-east-1', 'us-west-2'],
    modelIds: [],
    status: 'PENDING',
    createdBy: userId
  }
});
```

### Atualizar progresso do job

```typescript
await prisma.certificationJob.update({
  where: { id: jobId },
  data: {
    processedModels: { increment: 1 },
    successCount: { increment: 1 }
  }
});
```

### Buscar jobs ativos

```typescript
const activeJobs = await prisma.certificationJob.findMany({
  where: {
    status: {
      in: ['PENDING', 'QUEUED', 'PROCESSING']
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

### Buscar certificações com modelo

```typescript
const certifications = await prisma.modelCertification.findMany({
  where: { region: 'us-east-1' },
  include: {
    model: {
      include: {
        provider: true
      }
    }
  }
});
```

## Migration SQL

A migration foi aplicada manualmente devido à necessidade de preservar dados existentes:

1. Renomeou `model_certifications` para `model_certifications_legacy`
2. Criou enums `CertificationStatus`, `CertificationJobType`, `JobStatus`
3. Criou nova tabela `model_certifications` com estrutura regional
4. Criou tabela `certification_jobs`
5. Criou índices otimizados
6. Adicionou foreign key para `AIModel`

## Rollback

Se necessário reverter:

```bash
# Marcar migration como não aplicada
npx prisma migrate resolve --rolled-back 20260131185640_add_regional_certification

# Reverter manualmente no banco
psql -U leonardo -h localhost -d myia << 'EOF'
DROP TABLE IF EXISTS "model_certifications" CASCADE;
DROP TABLE IF EXISTS "certification_jobs" CASCADE;
DROP TYPE IF EXISTS "CertificationStatus";
DROP TYPE IF EXISTS "CertificationJobType";
DROP TYPE IF EXISTS "JobStatus";
ALTER TABLE "model_certifications_legacy" RENAME TO "model_certifications";
ALTER TABLE "model_certifications" RENAME CONSTRAINT "model_certifications_legacy_pkey" TO "model_certifications_pkey";
EOF

# Regenerar Prisma Client
npx prisma generate
```

## Impacto

### Código Afetado
- ✅ Nenhum código existente quebra (tabela legada preservada)
- ⚠️ Código de certificação precisa ser atualizado para usar novos modelos
- ⚠️ Queries antigas continuam funcionando com `ModelCertificationLegacy`

### Performance
- ✅ Índices otimizados para queries comuns
- ✅ Cascade delete configurado
- ✅ Unique constraint previne duplicatas por região
- ✅ Índices em campos de busca frequente (status, region, jobId)

### Compatibilidade
- ✅ Dados antigos preservados em `model_certifications_legacy`
- ✅ Possível migrar dados gradualmente
- ✅ Rollback seguro disponível

## Próximos Passos

1. ✅ Migration aplicada
2. ✅ Prisma Client regenerado
3. ⏳ Atualizar `CertificationService` para usar novos modelos
4. ⏳ Criar endpoints API para certificações regionais
5. ⏳ Implementar worker de processamento Bull Queue
6. ⏳ Atualizar frontend para exibir certificações por região
7. ⏳ Migrar dados de `model_certifications_legacy` (opcional)

## Exemplos de Uso

### Certificar modelo em múltiplas regiões

```typescript
const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
const modelId = 'model-123';

// Criar job
const job = await prisma.certificationJob.create({
  data: {
    type: 'SINGLE_MODEL',
    regions,
    modelIds: [modelId],
    status: 'PENDING',
    totalModels: regions.length,
    createdBy: userId
  }
});

// Criar certificações pendentes
for (const region of regions) {
  await prisma.modelCertification.create({
    data: {
      modelId,
      region,
      status: 'PENDING',
      jobId: job.id,
      createdBy: userId
    }
  });
}
```

### Verificar status de certificação

```typescript
const certification = await prisma.modelCertification.findUnique({
  where: {
    modelId_region: {
      modelId: 'model-123',
      region: 'us-east-1'
    }
  }
});

if (certification?.status === 'COMPLETED' && certification.passed) {
  console.log(`Modelo certificado na região ${certification.region}`);
  console.log(`Rating: ${certification.rating}, Score: ${certification.score}`);
}
```

### Listar modelos certificados por região

```typescript
const certifiedModels = await prisma.modelCertification.findMany({
  where: {
    region: 'us-east-1',
    status: 'COMPLETED',
    passed: true
  },
  include: {
    model: {
      include: {
        provider: true
      }
    }
  },
  orderBy: {
    score: 'desc'
  }
});
```

## Notas Técnicas

### Unique Constraint
A constraint `[modelId, region]` garante que cada modelo tenha apenas uma certificação por região.
Para re-certificar, atualize o registro existente ou delete e recrie.

### Cascade Delete
Quando um `AIModel` é deletado, todas as suas certificações são automaticamente removidas.

### Índices
Os índices foram criados para otimizar as queries mais comuns:
- Busca por status (filtros de dashboard)
- Busca por região (filtros regionais)
- Busca por jobId (rastreamento de jobs)
- Ordenação por data (histórico)

### JSON Fields
Os campos `testResults` e `config` usam JSONB para armazenar dados estruturados flexíveis.

## Referências

- [Prisma Schema](../prisma/schema.prisma)
- [Migration SQL](../prisma/migrations/20260131185640_add_regional_certification/migration.sql)
- [Redis + Bull Setup](./REDIS-BULL-SETUP.md)
- [Frontend Admin Proposal](../../docs/FRONTEND-ADMIN-PROPOSAL.md)
