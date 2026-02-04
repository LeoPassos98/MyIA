# Correções Gerais do Sistema

> **Fonte de Verdade:** Correções diversas aplicadas ao sistema  
> **Última atualização:** 04/02/2026  
> **Consolidado de:** 5 documentos da raiz do docs/

## 📖 Índice
1. [Correções de Badges](#correcoes-badges)
2. [Correção de Checkbox Visual](#checkbox-visual)
3. [Correção de Validação AWS Bedrock](#validacao-aws)
4. [Referências](#referencias)

---

## 🏷️ Correções de Badges {#correcoes-badges}

> **Origem:** 3 documentos consolidados  
> **Data:** 21-22/01/2026  
> **Status:** ✅ Resolvido

### 1. Badge de "Falhou" Não Aparece Corretamente

#### Problema Reportado

O modelo "Claude 4 Sonnet" (`anthropic.claude-sonnet-4-20250514-v1:0`) estava com:
- **Status exibido:** "Falhou"
- **Mensagem:** "❌ Modelo disponível mas com limitações de qualidade: No chunks received"
- **Problema:** O checkbox estava marcado (`checked=true`), indicando que o modelo estava disponível
- **Esperado:** O checkbox deveria estar desmarcado ou ter um badge visual de "Falhou"

#### Análise do Problema

**Componente Frontend Identificado:**
- **Arquivo:** `frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`
- **Componente:** `ModelCheckboxItem` (linha 77)
- **Problema:** O checkbox estava controlado apenas por `isSelected`, sem considerar `isUnavailable`

**Lógica de Certificação (Backend):**

O backend estava funcionando corretamente:
- Retorna `isAvailable: false` para modelos com status `failed`
- Retorna listas separadas:
  - `certifiedModels`: modelos com status `certified`
  - `unavailableModels`: modelos com status `failed` e erros críticos
  - `qualityWarningModels`: modelos com status `quality_warning`

**Badges Visuais:**

Os badges já estavam implementados corretamente:
- ✅ "Certificado" (verde) para `certified`
- ⚠️ "Qualidade" (amarelo) para `quality_warning`
- ❌ "Indisponível" (vermelho) para `failed`

#### Correção Implementada

**Correção do Checkbox (Linha 104-107):**

**Antes:**
```tsx
<Checkbox
  checked={isSelected}
  onChange={() => onToggle(model.apiModelId)}
  tabIndex={0}
/>
```

**Depois:**
```tsx
<Checkbox
  checked={isSelected && !isUnavailable}
  onChange={() => onToggle(model.apiModelId)}
  tabIndex={0}
  disabled={disabled || isUnavailable}
/>
```

**Mudanças:**
1. `checked={isSelected && !isUnavailable}` - Checkbox só fica marcado se o modelo estiver selecionado **E** não estiver indisponível
2. `disabled={disabled || isUnavailable}` - Checkbox fica desabilitado se o modelo estiver indisponível

#### Comportamento Esperado

| Status | Badge | Checkbox | Pode Selecionar |
|--------|-------|----------|-----------------|
| `certified` | ✅ Certificado | ✅ Marcado (se selecionado) | ✅ Sim |
| `quality_warning` | ⚠️ Qualidade | ✅ Marcado (se selecionado) | ✅ Sim |
| `failed` | ❌ Indisponível | ❌ Desmarcado | ❌ Não (desabilitado) |

### 2. Badges de Modelos Failed Não Aparecem na Lista

#### Problema Identificado

Os modelos com status `failed` não estavam aparecendo com badge vermelho "❌ Indisponível" na lista de modelos do AWSProviderPanel após a certificação.

**Comportamento Observado:**

**No diálogo de certificação** (funcionando corretamente):
- Claude 4 Sonnet: "❌ Indisponível" (vermelho)
- Claude 3.7 Sonnet: "⚠️ Disponível" (amarelo)
- Claude 4.1 Opus: "❌ Indisponível" (vermelho)

**Na lista de modelos do AWSProviderPanel** (NÃO funcionando):
- Claude 4 Sonnet: Checkbox marcado, **sem badge de status**
- Claude 4.1 Opus: Checkbox marcado, **sem badge de status**
- Claude 3.7 Sonnet: Checkbox marcado, badge "⚠️ Qualidade" (correto!)

#### Causa Raiz

O método `getUnavailableModels()` retornava apenas modelos com:
- `status = 'failed'` **E**
- `errorCategory IN ('UNAVAILABLE', 'PERMISSION_ERROR', 'AUTHENTICATION_ERROR', 'CONFIGURATION_ERROR')`

Isso significa que modelos com status `failed` mas com outras categorias de erro (como `TIMEOUT`, `VALIDATION_ERROR`, etc.) não apareciam na lista, e portanto não recebiam o badge vermelho.

#### Solução Implementada

**1. Backend: Novo Método `getAllFailedModels()`**

Criado novo método no `certification.service.ts` que retorna **TODOS** os modelos com status `failed`, independente da categoria de erro:

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

**2. Backend: Novo Endpoint `/all-failed-models`**

Adicionado novo endpoint no `certificationController.ts`:

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

**3. Frontend: Novo Método no Service**

Adicionado método no `certificationService.ts`:

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

**4. Frontend: Atualização do AWSProviderPanel**

Atualizado `AWSProviderPanel.tsx` para usar o novo método:

```typescript
// ✅ CORREÇÃO: Usar getAllFailedModels() para pegar TODOS os modelos com status 'failed'
const [certified, allFailed, warnings] = await Promise.all([
  certificationService.getCertifiedModels(),
  certificationService.getAllFailedModels(), // ← Mudança aqui
  certificationService.getQualityWarningModels()
]);

setUnavailableModels(allFailed); // Usar lista completa de modelos failed
```

#### Resultado

Agora **TODOS** os modelos com status `failed` aparecem com badge vermelho "❌ Indisponível" na lista de modelos, independente da categoria de erro.

**Badges Exibidos Corretamente:**
- ✅ **Badge Verde "✅ Certificado"**: Modelos com `status = 'certified'`
- ⚠️ **Badge Amarelo "⚠️ Qualidade"**: Modelos com `status = 'quality_warning'`
- ❌ **Badge Vermelho "❌ Indisponível"**: Modelos com `status = 'failed'` (qualquer categoria de erro)

**Comportamento do Checkbox:**
- Modelos com status `failed`: Checkbox **desmarcado e desabilitado**
- Modelos com `quality_warning`: Checkbox **marcado** (se selecionado)
- Modelos com `certified`: Checkbox **marcado** (se selecionado)

### 3. Badges de Quality Warning Aparecendo como "Falhou"

#### Problema Identificado

Modelos com status `quality_warning` estavam sendo exibidos incorretamente no diálogo de certificação:
- **Badge**: ❌ Vermelho "Falhou" (incorreto)
- **Esperado**: ⚠️ Amarelo "Disponível" ou "Com Limitações"

**Logs do Problema:**
```
[CertificationService] ❌ Modelos indisponíveis: 0 modelos
[CertificationService] ⚠️ Modelos com warning de qualidade: 3 modelos
```

Mas no diálogo:
- Claude 4.1 Opus: "❌ Falhou" com badge vermelho
- Claude 4 Sonnet: "❌ Falhou" com badge vermelho

#### Análise da Causa Raiz

**Backend (certificationController.ts):**

**Problema**: A condição na linha 129 estava incorreta:

```typescript
// ❌ INCORRETO
if (!result.isCertified || !result.isAvailable) {
  return res.status(400).json(jsend.fail({...}));
}
```

Para modelos com `quality_warning`:
- `status = 'quality_warning'`
- `isCertified = false` (não está certificado)
- `isAvailable = true` (está disponível para uso)

A condição usava OR (`||`), então:
- `!result.isCertified = !false = true`
- Como o primeiro termo é `true`, a condição toda é `true`
- Retornava HTTP 400 (erro) mesmo para modelos disponíveis

#### Solução Implementada

**1. Backend: Corrigir Ordem de Verificação**

```typescript
// ✅ CORRETO: Verificar isAvailable PRIMEIRO
// 1. Se isAvailable=false: retornar 400 (modelo não pode ser usado)
if (!result.isAvailable) {
  const errorMessage = result.categorizedError?.message ||
    'Modelo indisponível ou falhou nos testes de certificação';
  
  return res.status(400).json(jsend.fail({
    message: errorMessage,
    certification: result,
    isAvailable: false,
    categorizedError: result.categorizedError
  }));
}

// 2. Se isAvailable=true E status=quality_warning: retornar 200 com aviso
if (result.status === 'quality_warning') {
  return res.status(200).json(jsend.success({
    message: 'Modelo disponível mas com limitações de qualidade',
    certification: result,
    isAvailable: true,
    categorizedError: result.categorizedError
  }));
}

// 3. Se isAvailable=true E isCertified=true: retornar 200 (sucesso completo)
return res.status(200).json(jsend.success({
  message: 'Modelo certificado com sucesso',
  certification: result,
  isAvailable: true
}));
```

**2. Frontend: Melhorar Labels e Mensagens**

**Labels dos Badges:**

```typescript
// ✅ DEPOIS (mais claro)
if (model.status === 'success' && model.result?.status === 'quality_warning') {
  return '⚠️ Disponível';
}

switch (model.status) {
  case 'success':
    return '✅ Certificado';
  case 'error':
    return '❌ Indisponível'; // Mudou de "Falhou" para "Indisponível"
  // ...
}
```

**Mensagens de Conclusão:**

```typescript
{model.status === 'success' && model.result?.status === 'quality_warning' && (
  <Typography variant="caption" color="warning.main">
    ⚠️ Disponível com limitações em {Math.round((model.endTime - model.startTime) / 1000)}s
  </Typography>
)}

{model.status === 'success' && model.result?.status === 'certified' && (
  <Typography variant="caption" color="success.main">
    ✅ Certificado em {Math.round((model.endTime - model.startTime) / 1000)}s
  </Typography>
)}
```

**Alertas de Conclusão:**

```typescript
<Alert severity="warning">
  <strong>Alguns modelos não puderam ser certificados</strong>
  <br />
  Modelos indisponíveis podem ter IDs inválidos ou não estar disponíveis na sua região AWS.
</Alert>

<Alert severity="success">
  <strong>Certificação concluída!</strong>
  <br />
  Modelos certificados (✅) e disponíveis com limitações (⚠️) podem ser usados.
</Alert>
```

#### Comportamento Correto Após Correção

| Status | isCertified | isAvailable | HTTP | Badge | Checkbox |
|--------|-------------|-------------|------|-------|----------|
| `certified` | ✅ true | ✅ true | 200 | ✅ Verde "Certificado" | ✅ Marcado |
| `quality_warning` | ❌ false | ✅ true | 200 | ⚠️ Amarelo "Disponível" | ✅ Marcado |
| `failed` | ❌ false | ❌ false | 400 | ❌ Vermelho "Indisponível" | ❌ Desmarcado |

---

## ☑️ Correção de Checkbox Visual {#checkbox-visual}

> **Origem:** [`CORREÇÃO-CHECKBOX-VISUAL.md`](../archive/fixes/CORREÇÃO-CHECKBOX-VISUAL.md)  
> **Data:** 22/01/2026  
> **Status:** ✅ Resolvido

### Problema Relatado

O usuário reportou que ao marcar um checkbox de modelo na página AWS Bedrock:
- ❌ O checkbox não ficava visualmente marcado
- ✅ Mas o modelo aparecia como selecionado na lista abaixo
- 🔍 Isso indicava que o estado estava sendo atualizado, mas o checkbox não refletia visualmente

### Análise do Problema

#### Causa Raiz Identificada

Na linha 104 do componente `ModelCheckboxItem`, a prop `checked` do checkbox tinha a seguinte lógica:

```typescript
checked={isSelected && !isUnavailable}
```

**Problema:** O checkbox só ficava marcado se AMBAS as condições fossem verdadeiras:
1. `isSelected` = true (modelo está no array `selectedModels`)
2. `!isUnavailable` = true (ou seja, `isUnavailable` = false)

#### Fluxo do Bug

1. Usuário clica no checkbox de um modelo
2. A função `toggleModel` adiciona o modelo ao array `selectedModels`
3. `isSelected` se torna `true`
4. **MAS** se `isUnavailable` for `true`, a expressão `isSelected && !isUnavailable` resulta em `false`
5. O checkbox não marca visualmente, mesmo que o modelo esteja em `selectedModels`

#### Por Que Isso Acontecia?

A lógica original tentava usar a prop `checked` para controlar tanto:
- O estado de seleção do modelo
- A desabilitação visual de modelos indisponíveis

Isso criava um conflito onde modelos que deveriam ser marcáveis não marcavam visualmente.

### Solução Implementada

#### Mudança no Código

**ANTES:**
```typescript
<Checkbox
  checked={isSelected && !isUnavailable}
  onChange={() => onToggle(model.apiModelId)}
  tabIndex={0}
  disabled={disabled || isUnavailable}
/>
```

**DEPOIS:**
```typescript
<Checkbox
  // ✅ CORREÇÃO: O estado visual do checkbox deve refletir apenas isSelected
  // A lógica de desabilitar modelos failed é feita via disabled={isUnavailable}
  // Isso garante que:
  // - Modelos certified/quality_warning: checkbox marca/desmarca normalmente
  // - Modelos failed: checkbox sempre desmarcado (isSelected será false) e desabilitado
  checked={isSelected}
  onChange={() => onToggle(model.apiModelId)}
  tabIndex={0}
  disabled={disabled || isUnavailable}
/>
```

#### Explicação da Correção

A correção separa claramente as responsabilidades:

1. **`checked={isSelected}`**
   - Reflete apenas o estado real de seleção
   - Se o modelo está em `selectedModels`, o checkbox marca
   - Se não está, o checkbox desmarca

2. **`disabled={disabled || isUnavailable}`**
   - Controla a interatividade do checkbox
   - Modelos `failed` (isUnavailable=true) ficam desabilitados
   - Usuário não consegue clicar neles

### Comportamento Esperado Após Correção

**Modelos Certificados (✅ Certificado):**
- **isUnavailable:** `false`
- **disabled:** `false`
- **Comportamento:** Checkbox pode ser marcado/desmarcado livremente
- **Visual:** Marca quando selecionado, desmarca quando não selecionado

**Modelos com Quality Warning (⚠️ Qualidade):**
- **isUnavailable:** `false`
- **disabled:** `false`
- **Comportamento:** Checkbox pode ser marcado/desmarcado livremente
- **Visual:** Marca quando selecionado, desmarca quando não selecionado

**Modelos Failed (❌ Indisponível):**
- **isUnavailable:** `true`
- **disabled:** `true`
- **Comportamento:** Checkbox sempre desmarcado e desabilitado
- **Visual:** Não pode ser marcado, aparece desabilitado (cinza)

### Proteções Mantidas

A correção mantém todas as proteções de segurança:

1. **Modelos failed não podem ser selecionados**
   - `disabled={isUnavailable}` impede cliques
   - `toggleModel` nunca é chamado para modelos unavailable
   - Não há risco de adicionar modelos failed ao `selectedModels`

2. **Estado sempre sincronizado**
   - `checked={isSelected}` garante que o visual reflete o estado real
   - Não há mais discrepância entre estado e visual

3. **Lógica de certificação intacta**
   - Badges continuam funcionando corretamente
   - Modelos failed continuam marcados como indisponíveis
   - Sistema de certificação não foi afetado

---

## 🔐 Correção de Validação AWS Bedrock {#validacao-aws}

> **Origem:** [`CORREÇÃO-VALIDAÇÃO-AWS-BEDROCK.md`](../archive/fixes/CORREÇÃO-VALIDAÇÃO-AWS-BEDROCK.md)  
> **Data:** 23/01/2026  
> **Status:** ✅ Resolvido

### Resumo

Corrigidos dois erros críticos que impediam a validação de credenciais AWS Bedrock:

1. **ERRO 1**: `logger.log is not a function` no frontend
2. **ERRO 2**: 400 Bad Request ao validar credenciais válidas

### ERRO 1: `logger.log is not a function`

#### Stack Trace Original
```
AWSProviderPanel.tsx:266 Erro ao carregar certificações: TypeError: logger.log is not a function
    at CertificationService.getCertifiedModels (certificationService.ts:96:12)
    at loadCertifications (AWSProviderPanel.tsx:255:32)
```

#### Causa Raiz

O logger do frontend (`frontend/src/utils/logger.ts`) não possui o método `.log()`. Os métodos disponíveis são:
- `.debug()` - Logs de debug (apenas em desenvolvimento)
- `.info()` - Logs informativos (apenas em desenvolvimento)
- `.warn()` - Warnings (sempre exibidos)
- `.error()` - Erros (sempre exibidos)

#### Arquivos Afetados
- `frontend/src/services/certificationService.ts` - 15 ocorrências
- `frontend/src/features/settings/components/ModelsManagementTab.tsx` - 11 ocorrências

#### Correção Aplicada

Substituídas todas as chamadas `logger.log()` por `logger.debug()`:

```typescript
// ❌ ANTES
logger.log('[CertificationService] 🚀 Chamando API...');

// ✅ DEPOIS
logger.debug('[CertificationService] 🚀 Chamando API...');
```

#### Impacto
- ✅ Erro `logger.log is not a function` eliminado
- ✅ Logs de debug funcionando corretamente em desenvolvimento
- ✅ Sem impacto em produção (logs de debug não são exibidos)

### ERRO 2: 400 Bad Request na Validação AWS

#### Stack Trace Original
```
POST http://localhost:3001/api/providers/bedrock/validate 400 (Bad Request)
useAWSConfig.ts:154
```

#### Causa Raiz

O schema Zod (`backend/src/schemas/bedrockSchema.ts`) tinha dois problemas:

1. **Problema 1**: Lógica de validação incorreta no `refine()`
   - Não permitia "Teste Rápido" (quando o frontend não envia `secretKey`)
   - Rejeitava credenciais válidas quando `useStoredCredentials=false`

2. **Problema 2**: Estrutura do schema incompatível com `validateRequest` middleware
   - O middleware espera `{body, query, params}`
   - O schema estava validando apenas o body diretamente

#### Correção 1: Lógica de Validação

```typescript
// ❌ ANTES
.refine(
  (data) => {
    if (data.useStoredCredentials) {
      return true;
    } else {
      // Rejeitava quando secretKey não era enviada
      return (
        data.accessKey &&
        accessKeyRegex.test(data.accessKey) &&
        data.secretKey &&
        secretKeyRegex.test(data.secretKey)
      );
    }
  }
)

// ✅ DEPOIS
.refine(
  (data) => {
    // Permite "Teste Rápido" (sem secretKey) ou useStoredCredentials=true
    if (data.useStoredCredentials || !data.secretKey) {
      console.log('🔍 [bedrockSchema] Validação: usando credenciais armazenadas ou teste rápido');
      return true;
    }
    
    // Se tem secretKey, validar formato completo
    console.log('🔍 [bedrockSchema] Validação: credenciais novas fornecidas, validando formato...');
    const isValid = (
      data.accessKey &&
      accessKeyRegex.test(data.accessKey) &&
      data.secretKey &&
      secretKeyRegex.test(data.secretKey)
    );
    
    if (!isValid) {
      console.log('❌ [bedrockSchema] Validação falhou:', {
        hasAccessKey: !!data.accessKey,
        accessKeyValid: data.accessKey ? accessKeyRegex.test(data.accessKey) : false,
        hasSecretKey: !!data.secretKey,
        secretKeyValid: data.secretKey ? secretKeyRegex.test(data.secretKey) : false
      });
    }
    
    return isValid;
  }
)
```

#### Correção 2: Estrutura do Schema

```typescript
// ❌ ANTES
export const bedrockConfigSchema = z.object({
  useStoredCredentials: z.boolean().optional().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.enum(allowedRegions),
}).refine(...)

// ✅ DEPOIS
// Schema para validação do body
const bedrockConfigBodySchema = z.object({
  useStoredCredentials: z.boolean().optional().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.enum(allowedRegions),
}).refine(...)

// Schema completo para validateRequest middleware
export const bedrockConfigSchema = z.object({
  body: bedrockConfigBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export type BedrockConfig = z.infer<typeof bedrockConfigBodySchema>;
```

#### Correção 3: Controller

Removida validação duplicada no controller, pois o middleware já valida:

```typescript
// ❌ ANTES
const config = bedrockConfigSchema.parse(req.body);

// ✅ DEPOIS
// Validação já foi feita pelo middleware validateRequest
const config = req.body;
```

#### Correção 4: Logs Detalhados

Adicionados logs detalhados no controller para facilitar debugging:

```typescript
// ✅ LOG DETALHADO: Request recebido
console.log('\n🔍 [validateAWS] ========== INÍCIO DA VALIDAÇÃO ==========');
console.log('📥 [validateAWS] Request body recebido:', {
  hasAccessKey: !!req.body.accessKey,
  accessKeyLength: req.body.accessKey?.length,
  accessKeyPrefix: req.body.accessKey?.substring(0, 4),
  hasSecretKey: !!req.body.secretKey,
  secretKeyLength: req.body.secretKey?.length,
  region: req.body.region,
  useStoredCredentials: req.body.useStoredCredentials
});
```

### Fluxos de Validação

#### Fluxo 1: Primeira Configuração (Credenciais Novas)
```
1. Usuário insere Access Key + Secret Key + Região
2. Frontend envia para /api/providers/bedrock/validate
3. validateRequest middleware valida formato (Zod)
4. Controller testa credenciais na AWS (ListFoundationModelsCommand)
5. Se válido: salva no banco + retorna sucesso
6. Se inválido: retorna erro específico
```

#### Fluxo 2: Teste Rápido (Credenciais Salvas)
```
1. Usuário clica "Testar Credenciais"
2. Frontend envia { region, useStoredCredentials: true }
3. validateRequest middleware valida (Zod permite sem secretKey)
4. Controller busca credenciais do banco
5. Controller testa credenciais na AWS
6. Retorna resultado
```

#### Fluxo 3: Mudança de Região
```
1. Usuário altera região
2. Frontend envia { region, useStoredCredentials: true }
3. Validação passa (não precisa de secretKey)
4. Controller busca credenciais do banco
5. Controller testa na nova região
6. Se válido: atualiza região no banco
```

### Regex de Validação

**Access Key:**
```typescript
const accessKeyRegex = /^AKIA[0-9A-Z]{16}$/;
```
- Deve começar com `AKIA`
- Seguido de 16 caracteres alfanuméricos maiúsculos
- Total: 20 caracteres

**Secret Key:**
```typescript
const secretKeyRegex = /^[A-Za-z0-9/+]{40}$/;
```
- 40 caracteres alfanuméricos + `/` + `+`
- Formato base64

### Regiões Suportadas

```typescript
const allowedRegions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-southeast-1', 'ap-southeast-2',
  'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'sa-east-1'
] as const;
```

---

## 📚 Referências {#referencias}

### Arquivos do Frontend
- [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](../../frontend/src/features/settings/components/providers/AWSProviderPanel.tsx) - Painel de configuração AWS
- [`frontend/src/services/certificationService.ts`](../../frontend/src/services/certificationService.ts) - Serviço de certificação
- [`frontend/src/components/CertificationProgressDialog.tsx`](../../frontend/src/components/CertificationProgressDialog.tsx) - Diálogo de progresso
- [`frontend/src/features/settings/components/ModelsManagementTab.tsx`](../../frontend/src/features/settings/components/ModelsManagementTab.tsx) - Tab de gerenciamento
- [`frontend/src/utils/logger.ts`](../../frontend/src/utils/logger.ts) - Logger do frontend

### Arquivos do Backend
- [`backend/src/services/ai/certification/certification.service.ts`](../../backend/src/services/ai/certification/certification.service.ts) - Serviço de certificação
- [`backend/src/controllers/certificationController.ts`](../../backend/src/controllers/certificationController.ts) - Controller de certificação
- [`backend/src/controllers/providersController.ts`](../../backend/src/controllers/providersController.ts) - Controller de providers
- [`backend/src/routes/certificationRoutes.ts`](../../backend/src/routes/certificationRoutes.ts) - Rotas de certificação
- [`backend/src/schemas/bedrockSchema.ts`](../../backend/src/schemas/bedrockSchema.ts) - Schema de validação AWS

### Documentação Relacionada
- [`docs/STANDARDS.md`](../STANDARDS.md) - Padrões do projeto
- [`backend/docs/CERTIFICATION-CACHE-MANAGEMENT.md`](../../backend/docs/CERTIFICATION-CACHE-MANAGEMENT.md) - Gerenciamento de cache
- [`backend/docs/SSE-CERTIFICATION-EXAMPLE.md`](../../backend/docs/SSE-CERTIFICATION-EXAMPLE.md) - Exemplo SSE
- [`backend/src/services/ai/certification/types.ts`](../../backend/src/services/ai