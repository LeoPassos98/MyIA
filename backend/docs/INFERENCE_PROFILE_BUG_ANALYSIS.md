# Análise do Bug: Inference Profile Desabilitado

**Data:** 2026-01-31  
**Erro Reportado:** `ValidationException: Invocation of model ID anthropic.claude-sonnet-4-5-20250929-v1:0 with on-demand throughput isn't supported`

---

## 🔍 Diagnóstico Completo

### Causa Raiz Identificada

O sistema possui **DOIS mecanismos desabilitados** que impedem o uso correto de Inference Profiles:

#### 1. Feature Flag Desabilitada (Causa Principal)
**Arquivo:** [`backend/src/services/ai/adapters/adapter-factory.ts:26-28`](backend/src/services/ai/adapters/adapter-factory.ts:26-28)

```typescript
function isUseNewAdapters(): boolean {
  return process.env.USE_NEW_ADAPTERS === 'true';
}
```

**Problema:**
- A variável `USE_NEW_ADAPTERS` **NÃO está configurada** no `.env`
- Quando desabilitada, o sistema usa adapters legados (linha 69-71)
- Adapters legados **NÃO suportam** Inference Profiles

**Impacto:**
- Todos os modelos Claude 4.x falham
- Sistema ignora a configuração correta do registry
- Usa `AnthropicAdapter` (legado) ao invés de `AnthropicProfileAdapter`

#### 2. Código de Inference Profile Comentado (Causa Secundária)
**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts:114-131`](backend/src/services/ai/providers/bedrock.ts:114-131)

```typescript
// ✅ REATIVADO: Adicionar prefixo regional para modelos que requerem Inference Profile
// TODO: Refatorar para usar import estático após resolver dependência circular
// Temporariamente desabilitado para permitir commit sem erros ESLint
/*
try {
  const { ModelRegistry } = require('../registry');
  const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
  
  logger.info(`🔍 [getInferenceProfileId] Platform rule for ${baseModelId}:`, platformRule);
  
  if (platformRule?.rule === 'requires_inference_profile') {
    // Usar system-defined inference profile
    const regionPrefix = getRegionPrefix(region); // ✅ CORRETO: 'apac' para regiões ap-*
    const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
    logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId} (region: ${region})`);
    return inferenceProfileId;
  }
} catch (error) {
  logger.error(`❌ [getInferenceProfileId] Error loading ModelRegistry:`, error);
}
*/
```

**Problema:**
- Código que adiciona prefixo regional está **comentado**
- Mesmo com feature flag habilitada, o prefixo não seria adicionado
- Comentário menciona "dependência circular" como motivo

**Impacto:**
- Mesmo habilitando `USE_NEW_ADAPTERS`, o modelId seria enviado sem prefixo
- Linha 275 força `requiresInferenceProfile = false`

---

## 📊 Fluxo Atual (Quebrado)

```
1. Chat Request com modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0"
   ↓
2. AdapterFactory.getAdapterForModel()
   ↓
3. isUseNewAdapters() → false (USE_NEW_ADAPTERS não configurada)
   ↓
4. createLegacyAdapter('anthropic') → AnthropicAdapter (ON_DEMAND)
   ↓
5. BedrockProvider.streamChat()
   ↓
6. getInferenceProfileId() → retorna modelId SEM prefixo (código comentado)
   ↓
7. AWS Bedrock recebe: "anthropic.claude-sonnet-4-5-20250929-v1:0"
   ↓
8. ❌ ValidationException: Model requires Inference Profile
```

---

## ✅ Fluxo Correto (Esperado)

```
1. Chat Request com modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0"
   ↓
2. AdapterFactory.getAdapterForModel()
   ↓
3. isUseNewAdapters() → true (USE_NEW_ADAPTERS='true')
   ↓
4. detectInferenceType() → INFERENCE_PROFILE (consulta registry)
   ↓
5. createAdapter('anthropic', 'INFERENCE_PROFILE') → AnthropicProfileAdapter
   ↓
6. BedrockProvider.streamChat()
   ↓
7. getInferenceProfileId() → adiciona prefixo regional
   ↓
8. AWS Bedrock recebe: "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
   ↓
9. ✅ Sucesso!
```

---

## 🔧 Soluções Necessárias

### Solução 1: Habilitar Feature Flag (Imediato)
**Arquivo:** `backend/.env`

```bash
# Adicionar linha:
USE_NEW_ADAPTERS=true
```

**Prós:**
- Solução rápida
- Sem mudanças de código
- Habilita adapters modernos

**Contras:**
- Ainda depende da Solução 2 para funcionar completamente
- Não resolve o código comentado

### Solução 2: Descomentar Código de Inference Profile (Crítico)
**Arquivo:** `backend/src/services/ai/providers/bedrock.ts:114-131`

**Ação:**
1. Descomentar o bloco try-catch
2. Resolver dependência circular (se existir)
3. Testar com modelos Claude 4.x

**Prós:**
- Resolve o problema completamente
- Usa lógica já implementada
- Suporta todos os modelos que requerem profile

**Contras:**
- Pode ter dependência circular (mencionada no comentário)
- Requer testes mais extensivos

### Solução 3: Remover Feature Flag (Longo Prazo)
**Arquivo:** `backend/src/services/ai/adapters/adapter-factory.ts`

**Ação:**
1. Remover verificação de `USE_NEW_ADAPTERS`
2. Usar sempre adapters modernos
3. Deprecar adapters legados

**Prós:**
- Simplifica código
- Remove ponto de falha
- Força uso de adapters corretos

**Contras:**
- Requer migração completa
- Pode quebrar código legado
- Requer testes extensivos

---

## 🚨 Problemas Maiores Identificados

### 1. Arquitetura com Feature Flags Não Documentadas
**Problema:**
- `USE_NEW_ADAPTERS` não está no `.env.example`
- Não há documentação sobre quando/como usar
- Desenvolvedores não sabem que precisa habilitar

**Impacto:**
- Modelos novos falham silenciosamente
- Difícil diagnosticar problemas
- Experiência ruim para usuários

**Recomendação:**
- Adicionar `USE_NEW_ADAPTERS` ao `.env.example`
- Documentar no README
- Considerar remover feature flag (já está maduro)

### 2. Código Crítico Comentado em Produção
**Problema:**
- Função `getInferenceProfileId()` tem lógica comentada
- Comentário menciona "dependência circular" mas não resolve
- Código fica em estado "temporário" indefinidamente

**Impacto:**
- Sistema não funciona mesmo com feature flag habilitada
- Dificulta manutenção
- Cria débito técnico

**Recomendação:**
- Resolver dependência circular imediatamente
- Se não for possível, usar outra abordagem
- Nunca deixar código crítico comentado

### 3. Falta de Validação de Configuração
**Problema:**
- Sistema não valida se `USE_NEW_ADAPTERS` está configurada
- Não há warning quando modelos requerem profile mas flag está desabilitada
- Erro só aparece no runtime

**Impacto:**
- Difícil diagnosticar problemas
- Usuários não sabem o que fazer
- Suporte recebe muitos tickets

**Recomendação:**
- Adicionar validação no startup
- Logar warning se modelos Claude 4.x estão disponíveis mas flag desabilitada
- Melhorar mensagens de erro

### 4. Dependência Circular Não Resolvida
**Problema:**
- `bedrock.ts` precisa de `ModelRegistry`
- Mas importação causa erro circular
- Solução temporária: comentar código

**Impacto:**
- Funcionalidade crítica desabilitada
- Código não funciona como esperado
- Débito técnico acumula

**Recomendação:**
- Refatorar para injeção de dependência
- Ou mover lógica para camada superior
- Ou usar lazy loading

---

## 📋 Plano de Ação Recomendado

### Fase 1: Correção Imediata (1-2 horas)
1. ✅ Adicionar `USE_NEW_ADAPTERS=true` ao `.env`
2. ✅ Adicionar ao `.env.example` com documentação
3. ✅ Descomentar código em `getInferenceProfileId()`
4. ✅ Testar com Claude 4.5 Sonnet
5. ✅ Verificar se dependência circular realmente existe

### Fase 2: Validação e Logs (2-4 horas)
1. ✅ Adicionar validação de configuração no startup
2. ✅ Melhorar logs em `AdapterFactory`
3. ✅ Adicionar warning se modelos requerem profile mas flag desabilitada
4. ✅ Testar com todos os modelos Claude 4.x

### Fase 3: Refatoração (1-2 dias)
1. ✅ Resolver dependência circular definitivamente
2. ✅ Remover feature flag `USE_NEW_ADAPTERS`
3. ✅ Deprecar adapters legados
4. ✅ Atualizar documentação
5. ✅ Adicionar testes automatizados

---

## 🧪 Testes Necessários

### Teste 1: Feature Flag Habilitada
```bash
# .env
USE_NEW_ADAPTERS=true

# Testar:
- Claude 4.5 Sonnet
- Claude 4 Opus
- Claude 3.5 Haiku
- Claude 3 Haiku (legado)
```

### Teste 2: Inference Profile
```bash
# Verificar logs:
- "Using adapter: AnthropicProfileAdapter"
- "Using Inference Profile: us.anthropic.claude-sonnet-4-5-20250929-v1:0"
- Sucesso na resposta
```

### Teste 3: Modelos Legados
```bash
# Testar que modelos antigos ainda funcionam:
- Claude 3 Haiku (sem profile)
- Amazon Nova (ON_DEMAND)
- Cohere Command R
```

---

## 📚 Documentação Necessária

### 1. README.md
- Adicionar seção sobre configuração de adapters
- Explicar quando usar `USE_NEW_ADAPTERS`
- Listar modelos que requerem Inference Profile

### 2. .env.example
```bash
#############################################
# AI Adapters Configuration
#############################################
# Habilita adapters modernos com suporte a Inference Profiles
# OBRIGATÓRIO para modelos Claude 4.x
# Valores: true | false
USE_NEW_ADAPTERS=true
```

### 3. TROUBLESHOOTING.md
- Adicionar seção sobre erros de Inference Profile
- Explicar como diagnosticar problemas
- Listar soluções comuns

---

## 🎯 Conclusão

O bug é causado por **dois problemas simultâneos**:
1. Feature flag `USE_NEW_ADAPTERS` não configurada
2. Código de Inference Profile comentado

**Solução imediata:**
1. Adicionar `USE_NEW_ADAPTERS=true` ao `.env`
2. Descomentar código em `getInferenceProfileId()`

**Problemas maiores:**
1. Arquitetura com feature flags não documentadas
2. Código crítico comentado em produção
3. Falta de validação de configuração
4. Dependência circular não resolvida

**Recomendação:**
- Aplicar correção imediata (Fase 1)
- Planejar refatoração (Fase 3)
- Melhorar documentação e validação
