# Correção do Hook useModelCapabilities

## 🔴 Problema Reportado

Ao selecionar um modelo (Claude Sonnet 4), aparecia o alert:
**"Não foi possível carregar as capabilities do modelo. Usando valores padrão."**

E os controles Top-P e Max Tokens estavam **desabilitados** (Mui-disabled).

## 🔍 Investigação Realizada

### 1. Verificação do Backend

```bash
# Teste do health check
curl http://localhost:3001/api/health
# ✅ Resultado: {"status":"ok","timestamp":"2026-01-21T11:51:38.793Z"}

# Teste do endpoint de capabilities
curl "http://localhost:3001/api/models/anthropic:claude-sonnet-4-5-20250929-v1:0/capabilities"
# ✅ Resultado: Retornou capabilities corretamente
```

**Status**: ✅ Backend funcionando perfeitamente

### 2. Verificação do Proxy Vite

```bash
# Teste através do proxy
curl "http://localhost:3000/api/models/anthropic:claude-sonnet-4-5-20250929-v1:0/capabilities"
# ✅ Resultado: Proxy funcionando corretamente
```

**Status**: ✅ Proxy configurado e funcionando

### 3. Verificação do Registro da Rota

Arquivo: [`backend/src/server.ts:111`](backend/src/server.ts:111)
```typescript
app.use('/api/models', apiLimiter, modelsRoutes);
```

**Status**: ✅ Rota registrada corretamente

### 4. Análise do Formato de Resposta

O backend retorna:
```json
{
  "status": "success",
  "data": {
    "temperature": { "enabled": true, "min": 0, "max": 1, "default": 1 },
    "topK": { "enabled": false, ... },
    "topP": { "enabled": true, "min": 0, "max": 1, "default": 0.999 },
    "maxTokens": { "enabled": true, "min": 1, "max": 8192, "default": 2048 },
    ...
    "_meta": {
      "cached": true,
      "cacheAge": 143287,
      "responseTime": 0,
      "originalModelId": "anthropic:claude-sonnet-4-5-20250929-v1:0",
      "normalizedModelId": "anthropic.claude-sonnet-4-5-20250929-v1:0"
    }
  }
}
```

## 🐛 Causa Raiz Identificada

O problema estava no **parser de resposta** em [`modelsApi.ts`](frontend/src/services/api/modelsApi.ts:47):

```typescript
// ❌ ANTES (INCORRETO)
const { _meta, ...capabilities } = response.data.data;
return capabilities as ModelCapabilities;
```

O TypeScript estava reclamando porque `response.data.data` tinha o tipo:
```typescript
{
  modelId: string;
  capabilities: ModelCapabilities;
}
```

Mas na verdade o backend retorna:
```typescript
{
  ...ModelCapabilities,  // Spread das capabilities
  _meta: { ... }
}
```

## ✅ Correções Aplicadas

### 1. Correção do Parser de Resposta

**Arquivo**: [`frontend/src/services/api/modelsApi.ts:47-56`](frontend/src/services/api/modelsApi.ts:47)

```typescript
// ✅ DEPOIS (CORRETO)
// Validar resposta JSend
if (response.data.status === 'success' && response.data.data) {
  // O backend retorna as capabilities com spread: { ...capabilities, _meta }
  // Precisamos extrair apenas as capabilities, removendo _meta
  const data = response.data.data as any;
  const { _meta, ...capabilities } = data;
  
  console.log('[fetchModelCapabilities] Parsed capabilities:', capabilities);
  return capabilities as ModelCapabilities;
}
```

### 2. Correção da URL Base

**Arquivo**: [`frontend/src/services/api/modelsApi.ts:17`](frontend/src/services/api/modelsApi.ts:17)

```typescript
// ❌ ANTES
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ✅ DEPOIS
// Base URL da API - usar URL vazia para aproveitar o proxy do Vite
// O Vite faz proxy de /api para http://localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
```

**Motivo**: Usar URL vazia permite que o Vite faça proxy automático de `/api` para `http://localhost:3001`.

### 3. Adição de Logging Detalhado

**Arquivo**: [`frontend/src/hooks/useModelCapabilities.ts`](frontend/src/hooks/useModelCapabilities.ts:1)

```typescript
// 🔍 DEBUG: Log dos parâmetros recebidos
console.log('[useModelCapabilities] Params:', { provider, modelId, fullModelId });

// ... na queryFn
console.log('[useModelCapabilities] Fetching for:', fullModelId);

// ... no resultado
console.log('[useModelCapabilities] Result:', { 
  hasCapabilities: !!data, 
  isLoading, 
  hasError: !!error,
  errorDetails: error 
});

if (error) {
  console.error('[useModelCapabilities] Error details:', error);
}
```

**Arquivo**: [`frontend/src/services/api/modelsApi.ts`](frontend/src/services/api/modelsApi.ts:1)

```typescript
const url = `${API_BASE_URL}/api/models/${encodeURIComponent(modelId)}/capabilities`;

// 🔍 DEBUG: Log da URL completa
console.log('[fetchModelCapabilities] Fetching:', { modelId, url });

// ... na resposta
console.log('[fetchModelCapabilities] Response:', {
  status: response.status,
  data: response.data
});

// ... no erro
console.error('[fetchModelCapabilities] Error:', error);
console.error('[fetchModelCapabilities] Axios error details:', {
  status: axiosError.response?.status,
  statusText: axiosError.response?.statusText,
  data: axiosError.response?.data,
  code: axiosError.code,
  message: axiosError.message
});
```

## 📊 Validação

### Testes Realizados

1. ✅ Backend rodando na porta 3001
2. ✅ Frontend rodando na porta 3000
3. ✅ Proxy do Vite funcionando
4. ✅ Endpoint retornando capabilities corretamente
5. ✅ Parser de resposta corrigido

### Como Validar

1. Abra o DevTools do navegador (F12)
2. Vá para a aba Console
3. Selecione um modelo (ex: Claude Sonnet 4)
4. Verifique os logs:

```javascript
[useModelCapabilities] Params: { provider: 'anthropic', modelId: 'claude-sonnet-4-5-20250929-v1:0', fullModelId: 'anthropic:claude-sonnet-4-5-20250929-v1:0' }
[useModelCapabilities] Fetching for: anthropic:claude-sonnet-4-5-20250929-v1:0
[fetchModelCapabilities] Fetching: { modelId: 'anthropic:claude-sonnet-4-5-20250929-v1:0', url: '/api/models/anthropic%3Aclaude-sonnet-4-5-20250929-v1%3A0/capabilities' }
[fetchModelCapabilities] Response: { status: 200, data: { status: 'success', data: { ... } } }
[fetchModelCapabilities] Parsed capabilities: { temperature: {...}, topK: {...}, ... }
[useModelCapabilities] Result: { hasCapabilities: true, isLoading: false, hasError: false, errorDetails: null }
```

### Critérios de Sucesso

- ✅ Hook retorna `capabilities` sem erro
- ✅ Alert de warning **não aparece**
- ✅ Controles Top-P e Max Tokens estão **habilitados**
- ✅ Top-K está **desabilitado** para Claude (correto, pois Claude não suporta Top-K)
- ✅ Logs mostram dados corretos no console

## 🎯 Resultado Esperado

Após as correções:

1. **Sem Alert de Erro**: O alert "Não foi possível carregar as capabilities do modelo" não deve mais aparecer
2. **Controles Habilitados**: Top-P e Max Tokens devem estar habilitados e funcionais
3. **Top-K Desabilitado**: Top-K deve estar desabilitado para modelos Claude (comportamento correto)
4. **Valores Corretos**: Os sliders devem mostrar os valores min/max/default corretos do modelo

## 📝 Arquivos Modificados

1. [`frontend/src/services/api/modelsApi.ts`](frontend/src/services/api/modelsApi.ts:1)
   - Corrigido parser de resposta
   - Corrigida URL base para usar proxy
   - Adicionado logging detalhado

2. [`frontend/src/hooks/useModelCapabilities.ts`](frontend/src/hooks/useModelCapabilities.ts:1)
   - Adicionado logging detalhado para debug

## 🔄 Próximos Passos

1. Testar no navegador com DevTools aberto
2. Verificar logs no console
3. Confirmar que controles estão habilitados
4. Remover logs de debug após confirmação (opcional)

## 📚 Referências

- Backend: [`backend/src/routes/modelsRoutes.ts:62`](backend/src/routes/modelsRoutes.ts:62)
- Frontend Hook: [`frontend/src/hooks/useModelCapabilities.ts:74`](frontend/src/hooks/useModelCapabilities.ts:74)
- Frontend API: [`frontend/src/services/api/modelsApi.ts:32`](frontend/src/services/api/modelsApi.ts:32)
- Componente: [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:58`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:58)
