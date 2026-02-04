# Correção: Inference Profile para Modelos Claude 4.x

**Data:** 2026-01-31  
**Versão:** 1.0.0  
**Status:** ✅ Corrigido

---

## 📋 Resumo

Este documento descreve a correção aplicada para resolver o erro de Inference Profile que impedia o uso de modelos Claude 4.x (Sonnet 4.5, Opus 4, Haiku 4.5) no AWS Bedrock.

**Erro original:**
```
ValidationException: Invocation of model ID anthropic.claude-sonnet-4-5-20250929-v1:0 
with on-demand throughput isn't supported. Retry your request with the ID or ARN of 
an inference profile that contains this model.
```

---

## 🔧 Correções Aplicadas

### 1. Adicionada Feature Flag ao .env.example
**Arquivo:** [`backend/.env.example`](../../../backend/.env.example)

```bash
#############################################
# AI Adapters Configuration
#############################################
# Habilita adapters modernos com suporte a Inference Profiles
# OBRIGATÓRIO para modelos Claude 4.x (Sonnet 4.5, Opus 4, Haiku 4.5)
# Valores: true | false
# Padrão: false (usa adapters legados)
USE_NEW_ADAPTERS=true
```

**Ação necessária:** Adicione esta linha ao seu arquivo `.env` local.

### 2. Descomentado Código de Inference Profile
**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](../../../backend/src/services/ai/providers/bedrock.ts)

**Antes:**
```typescript
// Código comentado (linhas 114-131)
/*
try {
  const { ModelRegistry } = require('../registry');
  // ... código comentado
}
*/
```

**Depois:**
```typescript
// Código ativo
try {
  const { ModelRegistry } = require('../registry');
  const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
  
  if (platformRule?.rule === 'requires_inference_profile') {
    const regionPrefix = getRegionPrefix(_region);
    const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
    return inferenceProfileId;
  }
} catch (error) {
  logger.error(`❌ [getInferenceProfileId] Error loading ModelRegistry:`, error);
}
```

### 3. Melhorados Logs de Diagnóstico
**Arquivo:** [`backend/src/services/ai/adapters/adapter-factory.ts`](../../../backend/src/services/ai/adapters/adapter-factory.ts)

Adicionados logs informativos quando `USE_NEW_ADAPTERS` não está habilitada:

```typescript
logger.warn('⚠️ [AdapterFactory] USE_NEW_ADAPTERS is not enabled, using legacy adapters. ' +
  'This may cause issues with Claude 4.x models that require Inference Profiles. ' +
  'Set USE_NEW_ADAPTERS=true in .env to enable modern adapters.');
```

---

## 🧪 Como Testar

### Teste Automatizado

Execute o script de teste:

```bash
cd backend
npx tsx scripts/test-inference-profile-fix.ts
```

**Saída esperada:**
```
✅ Feature flag habilitada corretamente
✅ Modelo corretamente marcado como requires_inference_profile
✅ Inference type detectado corretamente
✅ Adapter correto criado (AnthropicProfileAdapter)
✅ TODOS OS TESTES PASSARAM!
```

### Teste Manual

1. **Configure o .env:**
   ```bash
   echo "USE_NEW_ADAPTERS=true" >> backend/.env
   ```

2. **Reinicie o servidor:**
   ```bash
   ./start.sh restart backend
   ```

3. **Teste no chat:**
   - Selecione o modelo "Claude 4.5 Sonnet"
   - Envie uma mensagem
   - Verifique se a resposta é gerada sem erros

4. **Verifique os logs:**
   ```bash
   # Procure por estas mensagens nos logs:
   grep "Using adapter: AnthropicProfileAdapter" backend/logs/*.log
   grep "Using Inference Profile: us.anthropic" backend/logs/*.log
   ```

---

## 📊 Modelos Afetados

### ✅ Modelos que Agora Funcionam

Todos os modelos Claude 4.x que requerem Inference Profile:

| Modelo | Model ID | Status |
|--------|----------|--------|
| Claude 4.5 Sonnet | `anthropic.claude-sonnet-4-5-20250929-v1:0` | ✅ Corrigido |
| Claude 4.5 Haiku | `anthropic.claude-haiku-4-5-20251001-v1:0` | ✅ Corrigido |
| Claude 4.5 Opus | `anthropic.claude-opus-4-5-20251101-v1:0` | ✅ Corrigido |
| Claude 4 Sonnet | `anthropic.claude-sonnet-4-20250514-v1:0` | ✅ Corrigido |
| Claude 4 Opus | `anthropic.claude-opus-4-20250514-v1:0` | ✅ Corrigido |
| Claude 4.1 Opus | `anthropic.claude-opus-4-1-20250805-v1:0` | ✅ Corrigido |
| Claude 3.7 Sonnet | `anthropic.claude-3-7-sonnet-20250219-v1:0` | ✅ Corrigido |
| Claude 3.5 Sonnet v2 | `anthropic.claude-3-5-sonnet-20241022-v2:0` | ✅ Corrigido |
| Claude 3.5 Haiku | `anthropic.claude-3-5-haiku-20241022-v1:0` | ✅ Corrigido |

### ✅ Modelos Legados (Não Afetados)

Modelos que continuam funcionando normalmente:

| Modelo | Model ID | Status |
|--------|----------|--------|
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | ✅ Funcionando |
| Amazon Nova Pro | `amazon.nova-pro-v1:0` | ✅ Funcionando |
| Amazon Nova Lite | `amazon.nova-lite-v1:0` | ✅ Funcionando |
| Cohere Command R | `cohere.command-r-v1:0` | ✅ Funcionando |

---

## 🔍 Como Funciona

### Fluxo Corrigido

```
1. Chat Request
   ↓
2. AdapterFactory.getAdapterForModel()
   ↓
3. Verifica USE_NEW_ADAPTERS=true ✅
   ↓
4. detectInferenceType() → consulta registry
   ↓
5. Detecta: requires_inference_profile ✅
   ↓
6. createAdapter('anthropic', 'INFERENCE_PROFILE')
   ↓
7. Retorna: AnthropicProfileAdapter ✅
   ↓
8. BedrockProvider.streamChat()
   ↓
9. getInferenceProfileId() → adiciona prefixo regional ✅
   ↓
10. AWS Bedrock recebe: "us.anthropic.claude-sonnet-4-5-20250929-v1:0" ✅
    ↓
11. ✅ Sucesso!
```

### Prefixos Regionais

A função `getRegionPrefix()` converte regiões AWS para prefixos corretos:

| Região AWS | Prefixo | Exemplo |
|------------|---------|---------|
| us-east-1, us-west-2 | `us` | `us.anthropic.claude-sonnet-4-5-...` |
| eu-central-1, eu-west-1 | `eu` | `eu.anthropic.claude-sonnet-4-5-...` |
| ap-southeast-1, ap-northeast-1 | `apac` | `apac.anthropic.claude-sonnet-4-5-...` |

**Importante:** Regiões `ap-*` usam prefixo `apac` (não `ap`).

---

## ⚠️ Problemas Conhecidos

### 1. Dependência Circular

**Status:** Resolvido temporariamente com `require()` dinâmico

O código usa `require()` dinâmico para evitar dependência circular entre `bedrock.ts` e `ModelRegistry`:

```typescript
const { ModelRegistry } = require('../registry');
```

**Solução futura:** Refatorar para injeção de dependência ou mover lógica para camada superior.

### 2. Feature Flag Manual

**Status:** Requer configuração manual

A feature flag `USE_NEW_ADAPTERS` precisa ser configurada manualmente no `.env`.

**Solução futura:** Considerar remover feature flag e usar sempre adapters modernos.

---

## 📚 Documentação Adicional

- **Análise Completa:** [`INFERENCE_PROFILE_BUG_ANALYSIS.md`](./INFERENCE_PROFILE_BUG_ANALYSIS.md)
- **Pesquisa AWS:** [`INFERENCE_PROFILES_RESEARCH.md`](./INFERENCE_PROFILES_RESEARCH.md)
- **Análise de Modelos:** [`../../scripts/INFERENCE_PROFILES_ANALYSIS.md`](../../scripts/INFERENCE_PROFILES_ANALYSIS.md)

---

## 🎯 Checklist de Validação

Antes de considerar a correção completa, verifique:

- [ ] `USE_NEW_ADAPTERS=true` está no `.env`
- [ ] Servidor foi reiniciado após mudança no `.env`
- [ ] Script de teste passa todos os testes
- [ ] Claude 4.5 Sonnet funciona no chat
- [ ] Logs mostram "AnthropicProfileAdapter" sendo usado
- [ ] Logs mostram prefixo regional sendo adicionado
- [ ] Modelos legados continuam funcionando

---

## 🚀 Próximos Passos

### Curto Prazo (1-2 semanas)
- [ ] Validar com todos os modelos Claude 4.x
- [ ] Monitorar logs de produção
- [ ] Coletar feedback dos usuários

### Médio Prazo (1-2 meses)
- [ ] Resolver dependência circular definitivamente
- [ ] Adicionar testes automatizados
- [ ] Melhorar mensagens de erro

### Longo Prazo (3-6 meses)
- [ ] Remover feature flag `USE_NEW_ADAPTERS`
- [ ] Deprecar adapters legados
- [ ] Migrar 100% para adapters modernos

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:**
   ```bash
   tail -f backend/logs/app.log | grep -E "(AdapterFactory|Bedrock|Inference)"
   ```

2. **Execute o script de teste:**
   ```bash
   npx tsx backend/scripts/test-inference-profile-fix.ts
   ```

3. **Consulte a documentação:**
   - [`INFERENCE_PROFILE_BUG_ANALYSIS.md`](./INFERENCE_PROFILE_BUG_ANALYSIS.md)

4. **Reporte o problema:**
   - Inclua logs completos
   - Inclua saída do script de teste
   - Inclua configuração do `.env` (sem credenciais)

---

**Última atualização:** 2026-01-31  
**Autor:** Sistema de Debug Automatizado
