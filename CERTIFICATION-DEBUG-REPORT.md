# 🐛 Relatório de Debug: Sistema de Certificação

**Data:** 2026-01-20  
**Modo:** Debug  
**Status:** ✅ Diagnóstico Completo

---

## 📋 Resumo Executivo

O sistema de certificação está **salvando corretamente** no banco de dados, mas há **3 bugs críticos** que impedem a exibição dos badges e detalhes no frontend:

1. ❌ Badge amarelo "⚠️ Qualidade" não aparece
2. ❌ Badge vermelho "❌ Indisponível" não aparece  
3. ❌ Modal de detalhes não mostra mensagens de erro nem ações sugeridas

**Causa Raiz:** Incompatibilidade entre estrutura de dados do backend e frontend.

---

## 🔍 Evidências Coletadas

### 1. Banco de Dados ✅ FUNCIONANDO

**Query executada:**
```bash
npx tsx backend/scripts/check-quality-warnings.ts
```

**Resultado:**
```
📊 Total de modelos com quality_warning: 3

1. amazon.nova-premier-v1:0:20k
   Status: quality_warning
   Categoria: QUALITY_ISSUE
   Severidade: LOW
   Testes: 2 passou / 4 falhou
   Taxa de sucesso: 33.33%

2. amazon.nova-premier-v1:0:mm
   Status: quality_warning
   Categoria: QUALITY_ISSUE
   Severidade: LOW
   Testes: 2 passou / 4 falhou
   Taxa de sucesso: 33.33%

3. amazon.nova-premier-v1:0:1000k
   Status: quality_warning
   Categoria: QUALITY_ISSUE
   Severidade: LOW
   Testes: 2 passou / 4 falhou
   Taxa de sucesso: 33.33%
```

**✅ CONCLUSÃO:** O backend está salvando corretamente o status `quality_warning` no banco.

---

## 🐛 Bug #1: Endpoint `/quality-warning-models` - Incompatibilidade de Campo

### Localização
- **Arquivo:** [`backend/src/controllers/certificationController.ts:260`](backend/src/controllers/certificationController.ts:260)
- **Severidade:** 🔴 CRÍTICA
- **Impacto:** Badges amarelos não aparecem

### Problema

**Backend retorna:**
```typescript
return res.status(200).json(jsend.success({
  models: warnings,      // ❌ Campo "models"
  count: warnings.length
}));
```

**Frontend espera:**
```typescript
// frontend/src/services/certificationService.ts:167
const modelIds = response.data.modelIds || [];  // ❌ Campo "modelIds"
```

### Resultado
- Frontend recebe `response.data.models = ['model1', 'model2', 'model3']`
- Frontend lê `response.data.modelIds = undefined`
- Array fica vazio: `modelIds = []`
- Badges não aparecem

### Evidência de Logs Adicionados

**Backend:**
```typescript
console.log('[CertificationController] 🔍 DEBUG: Retornando resposta com estrutura:', {
  models: warnings,
  count: warnings.length
});
```

**Frontend:**
```typescript
console.log('[CertificationService] 🔍 DEBUG: response.data.modelIds:', response.data.modelIds);
console.log('[CertificationService] 🔍 DEBUG: response.data.models:', response.data.models);
```

---

## 🐛 Bug #2: Endpoint `/unavailable-models` - Incompatibilidade de Campo

### Localização
- **Arquivo:** [`backend/src/controllers/certificationController.ts:238`](backend/src/controllers/certificationController.ts:238)
- **Severidade:** 🔴 CRÍTICA
- **Impacto:** Badges vermelhos não aparecem

### Problema

**Backend retorna:**
```typescript
return res.status(200).json(jsend.success({
  models: unavailable,   // ❌ Campo "models"
  count: unavailable.length
}));
```

**Frontend espera:**
```typescript
// frontend/src/services/certificationService.ts:141
const modelIds = response.data.modelIds || [];  // ❌ Campo "modelIds"
```

### Resultado
Mesmo problema do Bug #1: array vazio, badges não aparecem.

---

## 🐛 Bug #3: Endpoint `/details/:modelId` - Detalhes Incompletos

### Localização
- **Arquivo:** [`backend/src/services/ai/certification/certification.service.ts:522-537`](backend/src/services/ai/certification/certification.service.ts:522)
- **Severidade:** 🟡 ALTA
- **Impacto:** Modal não mostra mensagens de erro nem ações sugeridas

### Problema

**Backend retorna:**
```typescript
return {
  modelId: cert.modelId,
  status: cert.status,
  errorCategory: cert.errorCategory,    // ❌ String simples
  errorSeverity: cert.errorSeverity,    // ❌ String simples
  // ... outros campos
};
```

**Frontend espera:**
```typescript
// frontend/src/components/ModelInfoDrawer.tsx:319
{certDetails.categorizedError?.message}  // ❌ Objeto não existe

// frontend/src/components/ModelInfoDrawer.tsx:321-333
{certDetails.categorizedError?.suggestedActions.map(...)}  // ❌ Objeto não existe
```

### Resultado
- Modal abre mas não mostra mensagens de erro
- Ações sugeridas não aparecem
- Usuário não sabe o que fazer para resolver o problema

### Análise do Schema Prisma

```prisma
model ModelCertification {
  errorCategory     String?  // ❌ Apenas string
  errorSeverity     String?  // ❌ Apenas string
  lastError         String?  // ❌ Apenas string
  failureReasons    Json?    // ✅ Poderia conter o objeto completo
}
```

**Problema:** O backend não reconstrói o objeto `categorizedError` ao retornar detalhes.

---

## 📊 Comparação: Endpoint Funcionando vs. Quebrados

### ✅ Endpoint `/certified-models` (FUNCIONANDO)

**Backend:**
```typescript
return res.status(200).json(jsend.success({ 
  modelIds  // ✅ Campo correto
}));
```

**Frontend:**
```typescript
const modelIds = response.data.modelIds || [];  // ✅ Campo correto
```

**Resultado:** ✅ Badges verdes aparecem corretamente

### ❌ Endpoints `/quality-warning-models` e `/unavailable-models` (QUEBRADOS)

**Backend:**
```typescript
return res.status(200).json(jsend.success({ 
  models,  // ❌ Campo errado
  count 
}));
```

**Frontend:**
```typescript
const modelIds = response.data.modelIds || [];  // ❌ Espera campo diferente
```

**Resultado:** ❌ Arrays vazios, badges não aparecem

---

## 🔧 Plano de Correção Detalhado

### Correção #1: Padronizar Resposta de `/quality-warning-models`

**Arquivo:** [`backend/src/controllers/certificationController.ts:260`](backend/src/controllers/certificationController.ts:260)

**Antes:**
```typescript
return res.status(200).json(jsend.success({
  models: warnings,
  count: warnings.length
}));
```

**Depois:**
```typescript
return res.status(200).json(jsend.success({
  modelIds: warnings  // ✅ Padronizado com /certified-models
}));
```

**Impacto:** Badges amarelos voltam a funcionar

---

### Correção #2: Padronizar Resposta de `/unavailable-models`

**Arquivo:** [`backend/src/controllers/certificationController.ts:238`](backend/src/controllers/certificationController.ts:238)

**Antes:**
```typescript
return res.status(200).json(jsend.success({
  models: unavailable,
  count: unavailable.length
}));
```

**Depois:**
```typescript
return res.status(200).json(jsend.success({
  modelIds: unavailable  // ✅ Padronizado com /certified-models
}));
```

**Impacto:** Badges vermelhos voltam a funcionar

---

### Correção #3: Reconstruir Objeto `categorizedError` em `getCertificationDetails()`

**Arquivo:** [`backend/src/services/ai/certification/certification.service.ts:490-537`](backend/src/services/ai/certification/certification.service.ts:490)

**Estratégia:** Reconstruir o objeto `categorizedError` a partir de `errorCategory`, `errorSeverity` e `lastError`.

**Implementação:**

```typescript
async getCertificationDetails(modelId: string): Promise<{
  // ... campos existentes
  categorizedError?: CategorizedError;  // ✅ Adicionar campo
}> {
  const cert = await prisma.modelCertification.findUnique({
    where: { modelId }
  });
  
  if (!cert) {
    return null;
  }
  
  // ✅ NOVO: Reconstruir categorizedError se houver erro
  let categorizedError: CategorizedError | undefined;
  if (cert.errorCategory && cert.lastError) {
    // Recategorizar o erro para obter message e suggestedActions
    categorizedError = categorizeError(cert.lastError);
  }
  
  return {
    modelId: cert.modelId,
    status: cert.status,
    // ... outros campos
    errorCategory: cert.errorCategory,
    errorSeverity: cert.errorSeverity,
    categorizedError  // ✅ Adicionar objeto completo
  };
}
```

**Impacto:** Modal volta a mostrar mensagens e ações sugeridas

---

## 🧪 Testes de Validação

### Teste 1: Verificar Badges Amarelos

1. Abrir painel AWS no frontend
2. Verificar console do browser:
   ```
   [CertificationService] 🔍 DEBUG: response.data.modelIds: ['model1', 'model2', 'model3']
   [AWSProviderPanel] 🔍 DEBUG: Warnings: ['model1', 'model2', 'model3']
   ```
3. Verificar que badges amarelos aparecem nos modelos corretos

### Teste 2: Verificar Badges Vermelhos

1. Certificar um modelo indisponível (sem permissão)
2. Verificar console do browser:
   ```
   [CertificationService] 🔍 DEBUG: response.data.modelIds: ['unavailable-model']
   [AWSProviderPanel] 🔍 DEBUG: Indisponíveis: ['unavailable-model']
   ```
3. Verificar que badge vermelho aparece

### Teste 3: Verificar Modal de Detalhes

1. Clicar no ícone ℹ️ de um modelo com quality_warning
2. Verificar que o modal mostra:
   - ✅ Mensagem de erro clara
   - ✅ Lista de ações sugeridas
   - ✅ Categoria e severidade do erro

---

## 📝 Logs Estratégicos Adicionados

### Backend

**Arquivo:** [`backend/src/controllers/certificationController.ts`](backend/src/controllers/certificationController.ts)

```typescript
// Linha 256
console.log('[CertificationController] 🔍 DEBUG: Retornando resposta com estrutura:', {
  models: warnings,
  count: warnings.length
});

// Linha 233
console.log('[CertificationController] 🔍 DEBUG: Retornando resposta com estrutura:', {
  models: unavailable,
  count: unavailable.length
});
```

### Frontend

**Arquivo:** [`frontend/src/services/certificationService.ts`](frontend/src/services/certificationService.ts)

```typescript
// Linha 166-169
console.log('[CertificationService] 🔍 DEBUG: Resposta completa do backend:', response.data);
console.log('[CertificationService] 🔍 DEBUG: response.data.modelIds:', response.data.modelIds);
console.log('[CertificationService] 🔍 DEBUG: response.data.models:', response.data.models);

// Linha 139-142
console.log('[CertificationService] 🔍 DEBUG: Resposta completa do backend (unavailable):', response.data);
console.log('[CertificationService] 🔍 DEBUG: response.data.modelIds:', response.data.modelIds);
console.log('[CertificationService] 🔍 DEBUG: response.data.models:', response.data.models);
```

**Arquivo:** [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx)

```typescript
// Linha 239-244
console.log('[AWSProviderPanel] 🔍 DEBUG: Carregando certificações...');
console.log('[AWSProviderPanel] 🔍 DEBUG: Certificados:', certified);
console.log('[AWSProviderPanel] 🔍 DEBUG: Indisponíveis:', unavailable);
console.log('[AWSProviderPanel] 🔍 DEBUG: Warnings:', warnings);
```

---

## 🎯 Priorização de Correções

### 🔴 Prioridade CRÍTICA (Fazer Primeiro)
1. **Bug #1 e #2:** Corrigir endpoints `/quality-warning-models` e `/unavailable-models`
   - **Tempo estimado:** 5 minutos
   - **Impacto:** Badges voltam a funcionar imediatamente
   - **Risco:** Baixo (mudança simples)

### 🟡 Prioridade ALTA (Fazer em Seguida)
2. **Bug #3:** Reconstruir objeto `categorizedError` em `getCertificationDetails()`
   - **Tempo estimado:** 15 minutos
   - **Impacto:** Modal volta a mostrar detalhes completos
   - **Risco:** Médio (precisa importar e usar `categorizeError()`)

---

## 📦 Arquivos Modificados (Debug)

### Backend
- ✅ [`backend/src/controllers/certificationController.ts`](backend/src/controllers/certificationController.ts) - Logs adicionados
- ✅ [`backend/scripts/check-quality-warnings.ts`](backend/scripts/check-quality-warnings.ts) - Script de verificação criado

### Frontend
- ✅ [`frontend/src/services/certificationService.ts`](frontend/src/services/certificationService.ts) - Logs adicionados
- ✅ [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx) - Logs adicionados

---

## ✅ Checklist de Correção

- [ ] Corrigir endpoint `/quality-warning-models` (Bug #1)
- [ ] Corrigir endpoint `/unavailable-models` (Bug #2)
- [ ] Reconstruir `categorizedError` em `getCertificationDetails()` (Bug #3)
- [ ] Remover logs de debug após validação
- [ ] Testar badges amarelos
- [ ] Testar badges vermelhos
- [ ] Testar modal de detalhes
- [ ] Validar com usuário final

---

## 🚀 Próximos Passos

1. **Executar correções** na ordem de prioridade
2. **Testar cada correção** individualmente
3. **Validar com usuário** que reportou o problema
4. **Remover logs de debug** após confirmação
5. **Documentar mudanças** no CHANGELOG.md

---

## 📞 Contato

Se precisar de mais informações ou esclarecimentos sobre este diagnóstico, consulte:
- Código-fonte com logs: Arquivos listados acima
- Script de verificação: [`backend/scripts/check-quality-warnings.ts`](backend/scripts/check-quality-warnings.ts)
- Documentação de certificação: [`plans/certification-error-taxonomy.md`](plans/certification-error-taxonomy.md)

---

**Relatório gerado por:** Debug Mode  
**Data:** 2026-01-20 20:54 BRT  
**Status:** ✅ Diagnóstico completo e plano de correção pronto
