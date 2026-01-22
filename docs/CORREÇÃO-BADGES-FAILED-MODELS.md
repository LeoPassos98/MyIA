# Correção: Badges de Modelos Failed não Aparecem na Lista

**Data:** 2026-01-22  
**Autor:** Kilo Code  
**Status:** ✅ Concluído

## 📋 Problema Identificado

Os modelos com status `failed` não estavam aparecendo com badge vermelho "❌ Indisponível" na lista de modelos do AWSProviderPanel após a certificação.

### Comportamento Observado

**No diálogo de certificação** (funcionando corretamente):
- Claude 4 Sonnet: "❌ Indisponível" (vermelho)
- Claude 3.7 Sonnet: "⚠️ Disponível" (amarelo)
- Claude 4.1 Opus: "❌ Indisponível" (vermelho)

**Na lista de modelos do AWSProviderPanel** (NÃO funcionando):
- Claude 4 Sonnet: Checkbox marcado, **sem badge de status**
- Claude 4.1 Opus: Checkbox marcado, **sem badge de status**
- Claude 3.7 Sonnet: Checkbox marcado, badge "⚠️ Qualidade" (correto!)

### Causa Raiz

O método [`getUnavailableModels()`](backend/src/services/ai/certification/certification.service.ts:555-573) retornava apenas modelos com:
- `status = 'failed'` **E**
- `errorCategory IN ('UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR')`

Isso significa que modelos com status `failed` mas com outras categorias de erro (como `TIMEOUT`, `VALIDATION_ERROR`, etc.) não apareciam na lista, e portanto não recebiam o badge vermelho.

## 🔧 Solução Implementada

### 1. Backend: Novo Método `getAllFailedModels()`

Criado novo método no [`certification.service.ts`](backend/src/services/ai/certification/certification.service.ts) que retorna **TODOS** os modelos com status `failed`, independente da categoria de erro:

```typescript
/**
 * Obtém lista de TODOS os modelos com status 'failed'
 * Usado para exibir badge vermelho "❌ Indisponível" no frontend
 */
async getAllFailedModels(): Promise<string[]> {
  const certs = await prisma.modelCertification.findMany({
    where: {
      status: 'failed'
    },
    select: { modelId: true },
    distinct: ['modelId']
  });
  
  return certs.map(c => c.modelId);
}
```

### 2. Backend: Novo Endpoint `/all-failed-models`

Adicionado novo endpoint no [`certificationController.ts`](backend/src/controllers/certificationController.ts):

```typescript
/**
 * GET /api/certification/all-failed-models
 * Lista TODOS os modelos com status 'failed' (para exibir badge vermelho no frontend)
 */
export const getAllFailedModels = async (_req: Request, res: Response) => {
  const failed = await certificationService.getAllFailedModels();
  return res.status(200).json(jsend.success({ modelIds: failed }));
};
```

E registrado a rota no [`certificationRoutes.ts`](backend/src/routes/certificationRoutes.ts):

```typescript
// GET /api/certification/all-failed-models (retorna TODOS os modelos com status 'failed')
router.get(
  '/all-failed-models',
  queryLimiter,
  certificationController.getAllFailedModels
);
```

### 3. Frontend: Novo Método no Service

Adicionado método no [`certificationService.ts`](frontend/src/services/certificationService.ts):

```typescript
/**
 * Lista TODOS os modelos com status 'failed' (para exibir badge vermelho)
 * @param forceRefresh - Se true, ignora cache e busca do backend
 */
async getAllFailedModels(forceRefresh = false): Promise<string[]> {
  // ... implementação com cache
  const response = await api.get('/certification/all-failed-models');
  return response.data.modelIds || [];
}
```

### 4. Frontend: Atualização do AWSProviderPanel

Atualizado [`AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx) para usar o novo método:

```typescript
// ✅ CORREÇÃO: Usar getAllFailedModels() para pegar TODOS os modelos com status 'failed'
const [certified, allFailed, warnings] = await Promise.all([
  certificationService.getCertifiedModels(),
  certificationService.getAllFailedModels(), // ← Mudança aqui
  certificationService.getQualityWarningModels()
]);

setUnavailableModels(allFailed); // Usar lista completa de modelos failed
```

## 📊 Resultado

Agora **TODOS** os modelos com status `failed` aparecem com badge vermelho "❌ Indisponível" na lista de modelos, independente da categoria de erro.

### Badges Exibidos Corretamente

- ✅ **Badge Verde "✅ Certificado"**: Modelos com `status = 'certified'`
- ⚠️ **Badge Amarelo "⚠️ Qualidade"**: Modelos com `status = 'quality_warning'`
- ❌ **Badge Vermelho "❌ Indisponível"**: Modelos com `status = 'failed'` (qualquer categoria de erro)

### Comportamento do Checkbox

- Modelos com status `failed`: Checkbox **desmarcado e desabilitado**
- Modelos com `quality_warning`: Checkbox **marcado** (se selecionado)
- Modelos com `certified`: Checkbox **marcado** (se selecionado)

## 🔍 Arquivos Modificados

### Backend
1. [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts)
   - Adicionado método `getAllFailedModels()`

2. [`backend/src/controllers/certificationController.ts`](backend/src/controllers/certificationController.ts)
   - Adicionado controller `getAllFailedModels`

3. [`backend/src/routes/certificationRoutes.ts`](backend/src/routes/certificationRoutes.ts)
   - Adicionada rota `GET /all-failed-models`

### Frontend
4. [`frontend/src/services/certificationService.ts`](frontend/src/services/certificationService.ts)
   - Adicionado método `getAllFailedModels()`

5. [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx)
   - Atualizado para usar `getAllFailedModels()` em vez de `getUnavailableModels()`

## 🎯 Compatibilidade

- ✅ Mantida compatibilidade com método `getUnavailableModels()` existente
- ✅ Novo endpoint não quebra código existente
- ✅ Cache implementado para performance
- ✅ Rate limiting aplicado (30 req/min)

## 📝 Notas Técnicas

### Diferença entre Endpoints

1. **`/unavailable-models`** (existente):
   - Retorna apenas modelos com erros **críticos** (UNAVAILABLE, PERMISSION_ERROR, etc.)
   - Usado para lógica de negócio que precisa distinguir tipos de erro

2. **`/all-failed-models`** (novo):
   - Retorna **TODOS** os modelos com status `failed`
   - Usado para exibir badges no frontend

### Cache

Ambos os métodos usam o mesmo cache (`unavailableModels`) com TTL de 5 minutos para otimizar performance.

## ✅ Testes Recomendados

1. Certificar modelos com diferentes categorias de erro
2. Verificar se badges aparecem corretamente na lista
3. Verificar se checkboxes estão desabilitados para modelos failed
4. Testar reload da página (badges devem persistir)
5. Verificar cache (segunda chamada deve ser instantânea)

## 🔗 Referências

- [STANDARDS.md](docs/STANDARDS.md)
- [CORREÇÃO-BADGE-FALHOU.md](docs/CORREÇÃO-BADGE-FALHOU.md)
- [CORREÇÃO-BADGES-QUALITY-WARNING.md](docs/CORREÇÃO-BADGES-QUALITY-WARNING.md)
