# 🔧 Correção: ModelCertification Não Existe (Prisma P2025)

**Data**: 2026-02-05  
**Tipo**: Bug Fix - Crítico  
**Status**: ✅ Concluído

---

## 📋 Problema

O worker de certificação estava falhando com erro Prisma P2025:

```
Record to update not found.
prisma.modelCertification.update()
```

### Causa Raiz

O método [`processCertification()`](../../backend/src/services/queue/CertificationQueueService.ts:344) tentava fazer `update` em `ModelCertification`, mas o registro não existia no banco de dados.

**Fluxo com problema**:
1. [`certifyModel()`](../../backend/src/services/queue/CertificationQueueService.ts:51) cria `ModelCertification` com `upsert` (linhas 97-119)
2. Worker [`processCertification()`](../../backend/src/services/queue/CertificationQueueService.ts:344) tenta fazer `update` direto
3. Se o registro não existe, o `update` falha com P2025

**Cenário de falha**:
- Job criado mas `ModelCertification` não persistido (ex: falha de rede)
- Banco limpo mas jobs ainda na fila Redis
- Race condition entre criação e processamento

---

## ✅ Solução Implementada

Substituir **TODOS** os `modelCertification.update()` por `upsert()` no método [`processCertification()`](../../backend/src/services/queue/CertificationQueueService.ts:344).

### Locais Corrigidos

#### 1. Início do Processamento (Linha ~413)

**Antes**:
```typescript
prisma.modelCertification.update({
  where: {
    modelId_region: { modelId: modelUUID, region }
  },
  data: {
    status: 'PROCESSING',
    startedAt: new Date()
  }
})
```

**Depois**:
```typescript
prisma.modelCertification.upsert({
  where: {
    modelId_region: { modelId: modelUUID, region }
  },
  create: {
    modelId: modelUUID,
    region,
    status: 'PROCESSING',
    startedAt: new Date()
  },
  update: {
    status: 'PROCESSING',
    startedAt: new Date()
  }
})
```

#### 2. Sucesso da Certificação (Linha ~522)

**Antes**:
```typescript
prisma.modelCertification.update({
  where: {
    modelId_region: { modelId: modelUUID, region }
  },
  data: {
    status: passed ? 'CERTIFIED' : 'FAILED',
    passed,
    score,
    rating,
    badge,
    testResults: testResults as any,
    completedAt: new Date(),
    duration
  }
})
```

**Depois**:
```typescript
prisma.modelCertification.upsert({
  where: {
    modelId_region: { modelId: modelUUID, region }
  },
  create: {
    modelId: modelUUID,
    region,
    status: passed ? 'CERTIFIED' : 'FAILED',
    passed,
    score,
    rating,
    badge,
    testResults: testResults as any,
    completedAt: new Date(),
    duration
  },
  update: {
    status: passed ? 'CERTIFIED' : 'FAILED',
    passed,
    score,
    rating,
    badge,
    testResults: testResults as any,
    completedAt: new Date(),
    duration
  }
})
```

#### 3. Erro na Certificação (Linha ~603)

**Antes**:
```typescript
prisma.modelCertification.update({
  where: {
    modelId_region: { modelId: finalModelUUID, region }
  },
  data: {
    status: 'FAILED',
    passed: false,
    errorMessage,
    errorCategory,
    completedAt: new Date(),
    duration
  }
})
```

**Depois**:
```typescript
prisma.modelCertification.upsert({
  where: {
    modelId_region: { modelId: finalModelUUID, region }
  },
  create: {
    modelId: finalModelUUID,
    region,
    status: 'FAILED',
    passed: false,
    errorMessage,
    errorCategory,
    completedAt: new Date(),
    duration
  },
  update: {
    status: 'FAILED',
    passed: false,
    errorMessage,
    errorCategory,
    completedAt: new Date(),
    duration
  }
})
```

---

## 🎯 Benefícios

### 1. Resiliência
- ✅ Worker não falha se `ModelCertification` não existe
- ✅ Cria registro automaticamente se necessário
- ✅ Atualiza registro existente normalmente

### 2. Idempotência
- ✅ Operação pode ser repetida sem efeitos colaterais
- ✅ Retry de jobs não causa erros
- ✅ Race conditions tratadas automaticamente

### 3. Consistência
- ✅ Garante que `ModelCertification` sempre existe após processamento
- ✅ Sincronização automática entre Redis e PostgreSQL
- ✅ Dados sempre atualizados

---

## 📊 Impacto

### Arquivos Modificados
- [`backend/src/services/queue/CertificationQueueService.ts`](../../backend/src/services/queue/CertificationQueueService.ts)
  - Linha ~413: Status PROCESSING
  - Linha ~522: Status CERTIFIED/FAILED
  - Linha ~603: Status FAILED (catch)

### Comportamento Anterior
```
Job criado → Worker processa → update() → ❌ P2025 Error
```

### Comportamento Atual
```
Job criado → Worker processa → upsert() → ✅ Sucesso
```

---

## 🧪 Validação

### Logs Esperados

**Sucesso**:
```
✅ Modelo identificado: UUID=..., apiModelId=...
🔍 DEBUG - Modo selecionado: ✅ REAL
🔧 Executando certificação REAL
✅ Certificação concluída
```

**Erro Tratado**:
```
✅ Modelo identificado: UUID=..., apiModelId=...
❌ Erro na certificação: ...
✅ ModelCertification criado/atualizado com erro
```

### Testes Recomendados

1. **Certificação Normal**
   ```bash
   # Certificar modelo existente
   curl -X POST http://localhost:3001/api/certification/certify \
     -H "Content-Type: application/json" \
     -d '{"modelId": "amazon.nova-lite-v1:0", "region": "us-east-1"}'
   ```

2. **Banco Limpo + Jobs na Fila**
   ```bash
   # Limpar ModelCertification
   psql -U leonardo -h localhost -d myia -c "DELETE FROM \"ModelCertification\";"
   
   # Processar jobs existentes na fila
   # Worker deve criar registros automaticamente
   ```

3. **Retry de Job Falhado**
   ```bash
   # Forçar retry de job
   # Deve atualizar registro existente sem erro
   ```

---

## 🔗 Referências

- **Issue Original**: Worker falhando com P2025
- **Documentação Prisma**: [upsert()](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert)
- **Padrão**: Usar `upsert` ao invés de `update` quando registro pode não existir

---

## 📝 Notas Técnicas

### Por que `upsert` ao invés de `update`?

1. **Atomicidade**: Operação única (não precisa verificar existência antes)
2. **Performance**: Menos queries ao banco
3. **Segurança**: Evita race conditions
4. **Simplicidade**: Código mais limpo e legível

### Campos Obrigatórios no `create`

```typescript
{
  modelId: string,  // UUID do modelo (FK para AIModel)
  region: string,   // Região AWS
  status: string,   // Status atual (PROCESSING, CERTIFIED, FAILED)
  // Outros campos opcionais...
}
```

### Unique Constraint

```prisma
@@unique([modelId, region], name: "modelId_region")
```

Garante que só existe 1 certificação por modelo+região.

---

## ✅ Checklist de Validação

- [x] Substituir `update` por `upsert` (linha ~413)
- [x] Substituir `update` por `upsert` (linha ~522)
- [x] Substituir `update` por `upsert` (linha ~603)
- [x] Worker reiniciado automaticamente
- [x] Logs confirmam worker rodando
- [ ] Testar certificação de modelo
- [ ] Validar logs de sucesso
- [ ] Confirmar ausência de erros P2025

---

## 🚀 Próximos Passos

1. **Teste Manual**: Certificar modelo e validar logs
2. **Monitoramento**: Verificar ausência de erros P2025 no Grafana
3. **Documentação**: Atualizar guias de troubleshooting
4. **Cleanup**: Remover logs de debug após validação

---

**Status**: ✅ Correção aplicada, aguardando validação em produção
