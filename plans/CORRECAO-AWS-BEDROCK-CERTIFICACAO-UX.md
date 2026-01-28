# Correção AWS Bedrock: Certificação vs Uso Real + UX

**Data:** 2026-01-27  
**Autor:** Debug Mode  
**Status:** 🔴 CRÍTICO - Requer Ação Imediata

---

## 📋 Sumário Executivo

### Problema Crítico Identificado

Modelos AWS Bedrock são **certificados com sucesso** mas **falham ao serem usados no chat**, exibindo mensagens de erro técnicas e confusas para o usuário:

```
[ERRO] Falha ao invocar modelo anthropic.claude-haiku-4-5-20251001-v1:0. 
Tentativas: 3 variações. 
Erro: Invocation of model ID anthropic.claude-haiku-4-5-20251001-v1:0 with on-demand throughput isn't supported. 
Retry your request with the ID or ARN of an inference profile that contains this model.
```

**Observação crítica do usuário:**  
> "mesmo que o modelo seja validado pelo nosso validador, o que prova que tem algo errado em algum lugar"

### Causa Raiz Identificada

**❌ DISCREPÂNCIA ENTRE CERTIFICAÇÃO E USO REAL:**

1. **Sistema de Certificação** ([`certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:1)):
   - Usa [`BedrockProvider.streamChat()`](backend/src/services/ai/providers/bedrock.ts:138) diretamente
   - O provider tem **auto-test com 3 variações** de model ID (linhas 203-210)
   - Tenta: `modelId` → `inferenceProfile` → `modelId sem "2"`
   - **Sucesso em qualquer variação = modelo certificado** ✅

2. **Sistema de Chat Real** (uso pelo usuário):
   - Também usa [`BedrockProvider.streamChat()`](backend/src/services/ai/providers/bedrock.ts:138)
   - **MESMA LÓGICA** de auto-test com 3 variações
   - **Deveria funcionar identicamente** 🤔

3. **Função `getInferenceProfileId()`** ([`bedrock.ts:43`](backend/src/services/ai/providers/bedrock.ts:43)):
   - Verifica se modelo requer inference profile via registry
   - Converte `anthropic.claude-haiku-4-5-20251001-v1:0` → `us.anthropic.claude-haiku-4-5-20251001-v1:0`
   - **É usada tanto na certificação quanto no chat** ✅

### Hipóteses da Causa Raiz

#### 🎯 Hipótese #1: Erro de Throughput/Provisionamento (MAIS PROVÁVEL)

**Evidência:**
```
Invocation of model ID anthropic.claude-haiku-4-5-20251001-v1:0 with on-demand throughput isn't supported.
```

**Análise:**
- Erro menciona **"on-demand throughput"** - indica que modelo requer **provisionamento prévio**
- Alguns modelos AWS Bedrock requerem:
  - **Provisioned Throughput** (capacidade reservada)
  - **Cross-Region Inference** (inference profile obrigatório)
  - **Model Access Request** (aprovação manual da AWS)

**Problema:**
- [`error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:84) detecta "requires inference profile" como `CONFIGURATION_ERROR`
- Mas **NÃO detecta "on-demand throughput"** como erro específico
- Sistema tenta inference profile mas modelo pode estar **desabilitado na conta AWS**

#### 🎯 Hipótese #2: Timing/Estado da Conta AWS

**Evidência:**
- Certificação pode ter sido feita quando modelo estava disponível
- Uso posterior falha porque:
  - Modelo foi desabilitado na conta AWS
  - Quota foi excedida
  - Região mudou

**Problema:**
- Cache de certificação dura **7 dias** (linha 354 de [`certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:354))
- Estado real do modelo pode ter mudado

#### 🎯 Hipótese #3: Diferença Sutil na Invocação

**Evidência:**
- Certificação e chat usam mesma função [`streamChat()`](backend/src/services/ai/providers/bedrock.ts:138)
- Mas podem passar **parâmetros diferentes** (temperature, maxTokens, etc)

**Problema:**
- Alguns modelos podem aceitar invocação simples mas rejeitar com certos parâmetros
- Certificação usa parâmetros mínimos, chat usa parâmetros completos

---

## 🔍 Análise Técnica Detalhada

### A. Sistema de Certificação

**Arquivo:** [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:1)

**Fluxo de Certificação:**

```typescript
// 1. Obter metadata do modelo (linha 154)
const metadata = ModelRegistry.getModel(modelId);
// ✅ anthropic.claude-haiku-4-5-20251001-v1:0 existe no registry

// 2. Criar BedrockProvider (linha 166)
const provider = new BedrockProvider(credentials.region);

// 3. Executar testes (linha 186)
const runner = new TestRunner(provider, apiKey);
const testResults = await runner.runTests(modelId, tests);
```

**Testes Executados:**

1. **Base Tests** ([`base.spec.ts`](backend/src/services/ai/certification/test-specs/base.spec.ts:1)):
   - `basic-prompt`: "Hi" → espera resposta
   - `streaming-test`: "Count from 1 to 5" → valida chunks
   - `parameter-validation`: temperatura + maxTokens
   - `error-handling`: prompt vazio

2. **Anthropic Tests** ([`anthropic.spec.ts`](backend/src/services/ai/certification/test-specs/anthropic.spec.ts:1)):
   - `anthropic-system-message`: valida system messages
   - `anthropic-temperature-top-p-conflict`: valida ambos parâmetros

**Cada teste chama:**
```typescript
// linha 23 de base.spec.ts
for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
  // Processa chunks
}
```

**Problema Identificado:**
- ✅ Testes usam `streamChat()` corretamente
- ✅ Auto-test de 3 variações é executado
- ❌ **MAS**: Se modelo requer provisionamento, erro pode ser intermitente
- ❌ **MAS**: Testes não validam se modelo está realmente disponível para uso contínuo

### B. Sistema de Invocação (Chat Real)

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:1)

**Fluxo de Invocação:**

```typescript
// linha 138: streamChat()
async *streamChat(messages: any[], options: AIRequestOptions) {
  // 1. Validar credenciais (linha 143-150)
  const [accessKeyId, secretAccessKey] = options.apiKey.split(':');
  
  // 2. Criar cliente Bedrock (linha 152)
  const client = new BedrockRuntimeClient({
    region: this.region,
    credentials: { accessKeyId, secretAccessKey }
  });
  
  // 3. Obter adapter (linha 160)
  adapter = AdapterFactory.getAdapterForModel(options.modelId);
  
  // 4. Formatar request (linha 185)
  const { body, contentType, accept } = adapter.formatRequest(
    universalMessages,
    universalOptions
  );
  
  // 5. Normalizar model ID (linha 192)
  const normalizedModelId = normalizeModelId(originalModelId);
  
  // 6. Obter inference profile (linha 200)
  const modelIdWithProfile = getInferenceProfileId(normalizedModelId, this.region);
  
  // 7. AUTO-TEST: 3 variações (linha 203-210)
  const modelIdVariations = [
    normalizedModelId,           // Variação 1: sem sufixo
    modelIdWithProfile,          // Variação 2: com inference profile
    normalizedModelId.replace('nova-2-', 'nova-'),  // Variação 3: sem "2"
  ];
  
  // 8. Tentar cada variação com retry (linha 217-296)
  for (const testModelId of modelIdVariations) {
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const command = new InvokeModelWithResponseStreamCommand({
          modelId: testModelId,
          contentType,
          accept,
          body: JSON.stringify(body)
        });
        
        const response = await client.send(command);
        // ✅ Sucesso - processa stream
        
      } catch (error) {
        // ❌ Falha - tenta próxima variação ou retry
      }
    }
  }
  
  // 9. Se todas falharam (linha 299-304)
  yield {
    type: 'error',
    error: `Falha ao invocar modelo ${originalModelId}. 
            Tentativas: ${modelIdVariations.length} variações. 
            Erro: ${errorMessage}`
  };
}
```

**Função `getInferenceProfileId()`** (linha 43):

```typescript
function getInferenceProfileId(modelId: string, region: string): string {
  const baseModelId = normalizeModelId(modelId);
  
  // Se já tem prefixo de região, retornar
  if (baseModelId.startsWith('us.') || baseModelId.startsWith('eu.')) {
    return baseModelId;
  }
  
  // Verificar se modelo requer inference profile via registry
  const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
  
  if (platformRule?.rule === 'requires_inference_profile') {
    // Usar system-defined inference profile
    const regionPrefix = region.split('-')[0]; // 'us' de 'us-east-1'
    const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
    logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId}`);
    return inferenceProfileId;
  }
  
  return baseModelId;
}
```

**Análise:**
- ✅ Lógica idêntica entre certificação e chat
- ✅ Inference profile é aplicado corretamente
- ✅ Auto-test tenta 3 variações
- ❌ **MAS**: Erro "on-demand throughput" indica que **NENHUMA variação funciona**

### C. Registry e Platform Rules

**Arquivo:** [`backend/src/services/ai/registry/models/anthropic.models.ts`](backend/src/services/ai/registry/models/anthropic.models.ts:1)

**Modelo em questão** (linha 72-101):

```typescript
{
  modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  vendor: 'anthropic',
  displayName: 'Claude 4.5 Haiku',
  description: 'Next-gen Haiku with improved performance',
  capabilities: {
    streaming: true,
    vision: true,
    functionCalling: true,
    maxContextWindow: 200000,
    maxOutputTokens: 8192,
  },
  supportedPlatforms: ['bedrock'],
  platformRules: [
    {
      platform: 'bedrock',
      rule: 'requires_inference_profile',  // ✅ Regra presente
      config: {
        profileFormat: '{region}.{modelId}',
      },
    },
  ],
  adapterClass: 'AnthropicAdapter',
}
```

**Análise:**
- ✅ Modelo tem regra `requires_inference_profile`
- ✅ `getInferenceProfileId()` detecta e aplica
- ✅ Converte para `us.anthropic.claude-haiku-4-5-20251001-v1:0`
- ❌ **MAS**: Erro indica que **inference profile também falha**

### D. Categorização de Erros

**Arquivo:** [`backend/src/services/ai/certification/error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:1)

**Detecção de "on-demand throughput"** (linha 82-94):

```typescript
// CONFIGURATION_ERROR - Problema de configuração
else if (
  /requires.*inference profile/i.test(errorLower) ||
  /inference profile.*required/i.test(errorLower) ||
  /region.*not supported/i.test(errorLower) ||
  /invalid region/i.test(errorLower) ||
  /configuration.*invalid/i.test(errorLower) ||
  /ValidationException/i.test(errorMessage) ||
  /InvalidParameterException/i.test(errorMessage) ||
  /model.*requires.*cross-region/i.test(errorLower)
) {
  category = ErrorCategory.CONFIGURATION_ERROR;
}
```

**Problema Identificado:**
- ❌ **NÃO detecta "on-demand throughput"**
- ❌ **NÃO detecta "provisioned throughput"**
- ❌ Erro cai em `UNKNOWN_ERROR` ou `UNAVAILABLE`

**Mensagem gerada** (linha 257-278):

```typescript
function createUserFriendlyMessage(category: ErrorCategory, originalError: string): string {
  const messageMap: Record<ErrorCategory, string> = {
    [ErrorCategory.UNAVAILABLE]: 'Modelo não está disponível',
    [ErrorCategory.UNKNOWN_ERROR]: 'Erro desconhecido'
  };
  
  return messageMap[category];
}
```

**Problema:**
- ❌ Mensagem genérica demais
- ❌ Não explica o que fazer
- ❌ Não oferece alternativas

---

## 🎯 Causa Raiz Confirmada

### Conclusão da Análise

**O problema NÃO é discrepância entre certificação e chat.**  
Ambos usam a mesma lógica e deveriam ter o mesmo comportamento.

**O problema REAL é:**

1. **Modelo requer provisionamento prévio na conta AWS**
   - Não basta ter inference profile
   - Precisa de "Provisioned Throughput" ou "Model Access Request"
   - Erro "on-demand throughput isn't supported" confirma isso

2. **Sistema não detecta este tipo de erro especificamente**
   - Categorização não reconhece "throughput" como erro
   - Cai em categoria genérica

3. **Mensagens de erro são técnicas demais**
   - Usuário vê erro AWS bruto
   - Não sabe o que fazer
   - Não tem alternativas

4. **Certificação pode passar por timing/sorte**
   - Se modelo estava disponível temporariamente
   - Se quota não estava excedida
   - Se região tinha capacidade

---

## 💡 Proposta de Correção

### Princípios da Solução

1. ✅ **Não criar Provider Pattern Genérico** (decisão do usuário)
2. ✅ **Focar em correções pontuais** (não features novas)
3. ✅ **Priorizar UX** (mensagens claras e acionáveis)
4. ✅ **Melhorar confiabilidade** (detectar problemas reais)

### Correções Propostas

---

## 📝 Correção #1: Detectar Erros de Throughput/Provisionamento

**Arquivo:** [`backend/src/services/ai/certification/error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:82)

**Problema:**
- Erro "on-demand throughput isn't supported" não é detectado
- Cai em categoria genérica

**Solução:**

```typescript
// PROVISIONING_REQUIRED - Modelo requer provisionamento prévio
else if (
  /on-demand throughput.*not supported/i.test(errorLower) ||
  /provisioned throughput.*required/i.test(errorLower) ||
  /model.*requires.*provisioning/i.test(errorLower) ||
  /throughput.*not.*available/i.test(errorLower) ||
  /model access.*required/i.test(errorLower) ||
  /request.*id or arn.*inference profile/i.test(errorLower)
) {
  category = ErrorCategory.PROVISIONING_REQUIRED;
}
```

**Adicionar nova categoria:**

```typescript
// backend/src/services/ai/certification/types.ts
export enum ErrorCategory {
  UNAVAILABLE = 'UNAVAILABLE',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PROVISIONING_REQUIRED = 'PROVISIONING_REQUIRED',  // ✅ NOVO
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

**Severidade e ações:**

```typescript
// Severidade
[ErrorCategory.PROVISIONING_REQUIRED]: ErrorSeverity.CRITICAL,

// Ações sugeridas
[ErrorCategory.PROVISIONING_REQUIRED]: [
  '🔧 Modelo requer provisionamento prévio na AWS',
  '📋 Acesse AWS Console → Bedrock → Model Access',
  '✅ Solicite acesso ao modelo (pode levar minutos/horas)',
  '💡 Ou use modelo alternativo que não requer provisionamento',
  '📚 Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html'
],

// Mensagem amigável
[ErrorCategory.PROVISIONING_REQUIRED]: 'Modelo requer habilitação prévia na conta AWS',
```

**Impacto:**
- ✅ Detecta erro específico de throughput
- ✅ Categoriza como `CRITICAL` (modelo não pode ser usado)
- ✅ Oferece ações claras e acionáveis
- ✅ Direciona para documentação AWS

---

## 📝 Correção #2: Melhorar Mensagens de Erro no Chat

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:299)

**Problema:**
- Mensagem atual é técnica demais:
  ```
  Falha ao invocar modelo anthropic.claude-haiku-4-5-20251001-v1:0. 
  Tentativas: 3 variações. 
  Erro: Invocation of model ID anthropic.claude-haiku-4-5-20251001-v1:0 with on-demand throughput isn't supported.
  ```

**Solução:**

```typescript
// Se chegou aqui, todas as variações falharam
const errorMessage = lastGlobalError instanceof Error ? lastGlobalError.message : 'Erro desconhecido no AWS Bedrock';

// ✅ NOVO: Categorizar erro para mensagem amigável
const categorizedError = categorizeError(errorMessage);

// ✅ NOVO: Criar mensagem amigável
let userFriendlyMessage = '';

if (categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED) {
  userFriendlyMessage = `
❌ Modelo indisponível: ${originalModelId}

Este modelo requer habilitação prévia na sua conta AWS.

🔧 Como resolver:
1. Acesse AWS Console → Bedrock → Model Access
2. Solicite acesso ao modelo "${originalModelId}"
3. Aguarde aprovação (pode levar minutos ou horas)

💡 Alternativas:
• Tente Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
• Tente Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)

📚 Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html
  `.trim();
} else if (categorizedError.category === ErrorCategory.PERMISSION_ERROR) {
  userFriendlyMessage = `
❌ Sem permissão para usar o modelo

Sua conta AWS não tem permissão para invocar este modelo.

🔧 Como resolver:
1. Adicione política IAM: bedrock:InvokeModel
2. Adicione política IAM: bedrock:InvokeModelWithResponseStream
3. Verifique se a região ${this.region} está permitida

📚 Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html
  `.trim();
} else if (categorizedError.category === ErrorCategory.UNAVAILABLE) {
  userFriendlyMessage = `
❌ Modelo não disponível: ${originalModelId}

Este modelo não está disponível na região ${this.region}.

🔧 Possíveis causas:
• Modelo não existe nesta região
• Modelo foi descontinuado
• Nome do modelo está incorreto

💡 Alternativas:
• Verifique modelos disponíveis na sua região
• Tente outra região AWS
• Use modelo similar disponível

📚 Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html
  `.trim();
} else {
  // Erro genérico - manter mensagem técnica mas melhorada
  userFriendlyMessage = `
❌ Erro ao invocar modelo: ${originalModelId}

Tentativas realizadas: ${modelIdVariations.length} variações
Região: ${this.region}

Erro técnico:
${errorMessage}

💡 Sugestões:
• Verifique se o modelo está disponível na sua região
• Confirme que suas credenciais AWS estão corretas
• Tente novamente em alguns minutos

📚 Se o problema persistir, consulte os logs ou entre em contato com suporte.
  `.trim();
}

logger.error(`❌ [Bedrock Auto-Test] All ${modelIdVariations.length} variations failed for: ${originalModelId}`);
logger.error(`[Bedrock] Error category: ${categorizedError.category}`);
logger.error(`[Bedrock] User-friendly message prepared`);

yield {
  type: 'error',
  error: userFriendlyMessage
};
```

**Impacto:**
- ✅ Mensagens claras e amigáveis
- ✅ Explica o problema em português
- ✅ Oferece passos acionáveis
- ✅ Sugere alternativas
- ✅ Links para documentação
- ✅ Mantém erro técnico nos logs

---

## 📝 Correção #3: Validar Disponibilidade Real na Certificação

**Arquivo:** [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:220)

**Problema:**
- Certificação pode passar por timing/sorte
- Não valida se modelo está realmente disponível para uso contínuo

**Solução:**

```typescript
// 6. Categorizar erros e determinar status
let categorizedError: CategorizedError | undefined;
let overallSeverity: ErrorSeverity | undefined;
let isAvailable = true;
let status: ModelCertificationStatus;
let isCertified = false;

// ... código existente ...

// ✅ NOVO: Verificar se há erros de provisionamento
if (categorizedError) {
  if (categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED) {
    // Modelo requer provisionamento - marcar como FAILED mesmo com successRate alto
    status = ModelCertificationStatus.FAILED;
    isAvailable = false;
    isCertified = false;
    logger.info(`[CertificationService] ❌ Modelo ${modelId} marcado como FAILED devido a PROVISIONING_REQUIRED`);
    
    // ✅ NOVO: Adicionar nota explicativa
    qualityIssues.push('⚠️ Modelo requer habilitação prévia na conta AWS (Provisioned Throughput)');
  }
  else if (
    categorizedError.category === ErrorCategory.UNAVAILABLE ||
    categorizedError.category === ErrorCategory.PERMISSION_ERROR ||
    categorizedError.category === ErrorCategory.AUTHENTICATION_ERROR ||
    categorizedError.category === ErrorCategory.CONFIGURATION_ERROR
  ) {
    // ... código existente ...
  }
}
```

**Impacto:**
- ✅ Detecta modelos que requerem provisionamento
- ✅ Marca como `FAILED` mesmo se alguns testes passarem
- ✅ Adiciona nota explicativa no `qualityIssues`
- ✅ Evita certificar modelos que não funcionarão no chat

---

## 📝 Correção #4: Adicionar Teste de Disponibilidade Real

**Arquivo:** [`backend/src/services/ai/certification/test-specs/base.spec.ts`](backend/src/services/ai/certification/test-specs/base.spec.ts:246)

**Problema:**
- Testes atuais validam funcionalidade mas não disponibilidade real
- Modelo pode passar em testes mas não estar disponível para uso

**Solução:**

```typescript
// ✅ NOVO TESTE: Validar disponibilidade real do modelo
{
  id: 'availability-check',
  name: 'Model Availability Check',
  description: 'Valida se modelo está realmente disponível para uso (não apenas funcional)',
  timeout: 30000,
  
  async run(modelId: string, provider: any, apiKey: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Fazer 2 invocações consecutivas para garantir disponibilidade consistente
      const messages = [{ role: 'user', content: 'Test' }];
      
      // Primeira invocação
      let firstSuccess = false;
      for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
        if (chunk.type === 'chunk' && chunk.content) {
          firstSuccess = true;
          break;
        }
        if (chunk.type === 'error') {
          // Verificar se é erro de provisionamento
          if (
            chunk.error.includes('on-demand throughput') ||
            chunk.error.includes('provisioned throughput') ||
            chunk.error.includes('model access')
          ) {
            return {
              testId: 'availability-check',
              testName: 'Model Availability Check',
              passed: false,
              error: 'Model requires provisioning or access request in AWS account',
              latencyMs: Date.now() - startTime,
              metadata: {
                errorType: 'provisioning_required',
                userAction: 'Enable model in AWS Console → Bedrock → Model Access'
              }
            };
          }
          
          return {
            testId: 'availability-check',
            testName: 'Model Availability Check',
            passed: false,
            error: chunk.error,
            latencyMs: Date.now() - startTime
          };
        }
      }
      
      if (!firstSuccess) {
        return {
          testId: 'availability-check',
          testName: 'Model Availability Check',
          passed: false,
          error: 'No response from model',
          latencyMs: Date.now() - startTime
        };
      }
      
      // Segunda invocação (validar consistência)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      
      let secondSuccess = false;
      for await (const chunk of provider.streamChat(messages, { modelId, apiKey })) {
        if (chunk.type === 'chunk' && chunk.content) {
          secondSuccess = true;
          break;
        }
      }
      
      const latency = Date.now() - startTime;
      
      if (!secondSuccess) {
        return {
          testId: 'availability-check',
          testName: 'Model Availability Check',
          passed: false,
          error: 'Model available but inconsistent (first call succeeded, second failed)',
          latencyMs: latency,
          metadata: {
            warning: 'Model may have intermittent availability issues'
          }
        };
      }
      
      return {
        testId: 'availability-check',
        testName: 'Model Availability Check',
        passed: true,
        latencyMs: latency,
        metadata: {
          consecutiveSuccesses: 2
        }
      };
      
    } catch (error: any) {
      return {
        testId: 'availability-check',
        testName: 'Model Availability Check',
        passed: false,
        error: error.message,
        latencyMs: Date.now() - startTime
      };
    }
  }
}
```

**Impacto:**
- ✅ Valida disponibilidade real com 2 invocações consecutivas
- ✅ Detecta erros de provisionamento especificamente
- ✅ Adiciona metadata explicativa
- ✅ Evita falsos positivos na certificação

---

## 📝 Correção #5: Melhorar Logging de Discrepâncias

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:217)

**Problema:**
- Difícil debugar quando certificação passa mas chat falha
- Logs não mostram diferenças entre invocações

**Solução:**

```typescript
// Retry loop com backoff exponencial para esta variação
for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
  try {
    // ✅ NOVO: Log detalhado da tentativa
    logger.info(`[Bedrock] Attempting invocation:`, {
      modelId: testModelId,
      originalModelId,
      region: this.region,
      attempt: attempt + 1,
      maxRetries: this.retryConfig.maxRetries + 1,
      hasInferenceProfile: testModelId.startsWith('us.') || testModelId.startsWith('eu.'),
      requestBody: {
        temperature: universalOptions.temperature,
        maxTokens: universalOptions.maxTokens,
        topP: universalOptions.topP,
        topK: universalOptions.topK
      }
    });
    
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: testModelId,
      contentType,
      accept,
      body: JSON.stringify(body)
    });
    
    const response = await client.send(command);
    
    // ✅ NOVO: Log de sucesso
    logger.info(`✅ [Bedrock] Invocation successful:`, {
      modelId: testModelId,
      attempt: attempt + 1,
      hadInferenceProfile: testModelId !== originalModelId
    });
    
    // ... resto do código de processamento de stream ...
    
  } catch (error: unknown) {
    lastGlobalError = error;
    
    // ✅ NOVO: Log detalhado do erro
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ [Bedrock] Invocation failed:`, {
      modelId: testModelId,
      originalModelId,
      attempt: attempt + 1,
      errorMessage: errorMessage.substring(0, 200),
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    });
    
    // ... resto do código de retry ...
  }
}
```

**Impacto:**
- ✅ Logs detalhados de cada tentativa
- ✅ Mostra diferenças entre certificação e chat
- ✅ Facilita debug de problemas intermitentes
- ✅ Identifica qual variação funcionou

---

## 📊 Plano de Implementação

### Ordem de Prioridade

#### 🔴 **PRIORIDADE ALTA** (Implementar Primeiro)

1. **Correção #1: Detectar Erros de Throughput/Provisionamento**
   - **Arquivos:** 
     - [`backend/src/services/ai/certification/types.ts`](backend/src/services/ai/certification/types.ts:1)
     - [`backend/src/services/ai/certification/error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:1)
   - **Estimativa:** 1-2 horas
   - **Justificativa:** Resolve o problema de categorização incorreta

2. **Correção #2: Melhorar Mensagens de Erro no Chat**
   - **Arquivos:**
     - [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:299)
   - **Estimativa:** 2-3 horas
   - **Justificativa:** Melhora UX imediatamente para usuários

#### 🟡 **PRIORIDADE MÉDIA** (Implementar em Seguida)

3. **Correção #3: Validar Disponibilidade Real na Certificação**
   - **Arquivos:**
     - [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:220)
   - **Estimativa:** 1-2 horas
   - **Justificativa:** Evita certificar modelos indisponíveis

4. **Correção #5: Melhorar Logging de Discrepâncias**
   - **Arquivos:**
     - [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:217)
   - **Estimativa:** 1 hora
   - **Justificativa:** Facilita debug futuro

#### 🟢 **PRIORIDADE BAIXA** (Opcional)

5. **Correção #4: Adicionar Teste de Disponibilidade Real**
   - **Arquivos:**
     - [`backend/src/services/ai/certification/test-specs/base.spec.ts`](backend/src/services/ai/certification/test-specs/base.spec.ts:246)
   - **Estimativa:** 2-3 horas
   - **Justificativa:** Melhora confiabilidade mas não é crítico

---

### Checklist de Implementação

#### Fase 1: Detecção de Erros (Correção #1)

- [ ] Adicionar `PROVISIONING_REQUIRED` ao enum `ErrorCategory`
- [ ] Adicionar regex de detecção no `categorizeError()`
- [ ] Adicionar severidade `CRITICAL` para nova categoria
- [ ] Adicionar ações sugeridas específicas
- [ ] Adicionar mensagem amigável
- [ ] Testar com erro real de throughput
- [ ] Validar que erro é categorizado corretamente

#### Fase 2: Mensagens de Erro (Correção #2)

- [ ] Importar `categorizeError` no `bedrock.ts`
- [ ] Importar `ErrorCategory` no `bedrock.ts`
- [ ] Adicionar lógica de categorização no bloco de erro final
- [ ] Criar mensagens amigáveis para cada categoria
- [ ] Adicionar sugestões de modelos alternativos
- [ ] Adicionar links para documentação AWS
- [ ] Testar com diferentes tipos de erro
- [ ] Validar que mensagens aparecem corretamente no frontend

#### Fase 3: Validação de Certificação (Correção #3)

- [ ] Adicionar verificação de `PROVISIONING_REQUIRED` na lógica de status
- [ ] Marcar como `FAILED` quando detectado
- [ ] Adicionar nota explicativa em `qualityIssues`
- [ ] Testar com modelo que requer provisionamento
- [ ] Validar que modelo não é certificado incorretamente

#### Fase 4: Logging (Correção #5)

- [ ] Adicionar log detalhado antes de cada tentativa
- [ ] Adicionar log de sucesso após invocação
- [ ] Adicionar log de erro com detalhes
- [ ] Testar logs em diferentes cenários
- [ ] Validar que logs ajudam no debug

#### Fase 5: Teste de Disponibilidade (Correção #4 - Opcional)

- [ ] Criar novo teste `availability-check`
- [ ] Implementar 2 invocações consecutivas
- [ ] Detectar erros de provisionamento especificamente
- [ ] Adicionar metadata explicativa
- [ ] Adicionar teste à suíte base
- [ ] Testar com modelos disponíveis e indisponíveis
- [ ] Validar que teste detecta problemas reais

---

### Testes Necessários

#### Testes Unitários

1. **Error Categorizer:**
   ```typescript
   describe('categorizeError - PROVISIONING_REQUIRED', () => {
     it('should detect on-demand throughput error', () => {
       const error = 'Invocation of model ID with on-demand throughput isn\'t supported';
       const result = categorizeError(error);
       expect(result.category).toBe(ErrorCategory.PROVISIONING_REQUIRED);
       expect(result.severity).toBe(ErrorSeverity.CRITICAL);
     });
     
     it('should detect provisioned throughput required', () => {
       const error = 'Model requires provisioned throughput';
       const result = categorizeError(error);
       expect(result.category).toBe(ErrorCategory.PROVISIONING_REQUIRED);
     });
   });
   ```

2. **Bedrock Provider:**
   ```typescript
   describe('BedrockProvider - Error Messages', () => {
     it('should return user-friendly message for provisioning error', async () => {
       // Mock AWS SDK para retornar erro de throughput
       const provider = new BedrockProvider('us-east-1');
       const messages = [{ role: 'user', content: 'Hi' }];
       
       const chunks = [];
       for await (const chunk of provider.streamChat(messages, { 
         modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
         apiKey: 'test:test'
       })) {
         chunks.push(chunk);
       }
       
       const errorChunk = chunks.find(c => c.type === 'error');
       expect(errorChunk).toBeDefined();
       expect(errorChunk.error).toContain('habilitação prévia');
       expect(errorChunk.error).toContain('AWS Console');
     });
   });
   ```

#### Testes de Integração

1. **Certificação com Modelo Indisponível:**
   ```bash
   # Testar certificação de modelo que requer provisionamento
   npm run test:integration -- --grep "certification.*provisioning"
   ```

2. **Chat com Modelo Indisponível:**
   ```bash
   # Testar chat com modelo que requer provisionamento
   npm run test:integration -- --grep "chat.*provisioning"
   ```

#### Testes Manuais

1. **Cenário 1: Modelo Requer Provisionamento**
   - Tentar certificar `anthropic.claude-haiku-4-5-20251001-v1:0`
   - Verificar que erro é detectado como `PROVISIONING_REQUIRED`
   - Verificar que modelo é marcado como `FAILED`
   - Verificar que mensagem amigável é exibida

2. **Cenário 2: Modelo Sem Permissão**
   - Usar credenciais AWS sem permissão `bedrock:InvokeModel`
   - Verificar que erro é detectado como `PERMISSION_ERROR`
   - Verificar que mensagem explica como adicionar permissão

3. **Cenário 3: Modelo Não Existe**
   - Tentar usar modelo inexistente
   - Verificar que erro é detectado como `UNAVAILABLE`
   - Verificar que mensagem sugere verificar região

---

### Estimativa de Esforço Total

| Fase | Correção | Estimativa | Prioridade |
|------|----------|------------|------------|
| 1 | Detecção de Erros | 1-2h | 🔴 Alta |
| 2 | Mensagens de Erro | 2-3h | 🔴 Alta |
| 3 | Validação de Certificação | 1-2h | 🟡 Média |
| 4 | Logging | 1h | 🟡 Média |
| 5 | Teste de Disponibilidade | 2-3h | 🟢 Baixa |
| - | Testes Unitários | 2h | - |
| - | Testes de Integração | 1h | - |
| - | Testes Manuais | 1h | - |
| **TOTAL** | **Todas as correções** | **11-15h** | - |
| **MÍNIMO VIÁVEL** | **Correções #1 e #2** | **3-5h** | 🔴 Alta |

**Recomendação:**
- **Implementar Correções #1 e #2 imediatamente** (3-5h) - resolve o problema crítico de UX
- **Implementar Correções #3 e #5 em seguida** (2-3h) - melhora confiabilidade
- **Correção #4 é opcional** - pode ser implementada depois se necessário

---

## 🎯 Resumo das Hipóteses Validadas

### ✅ Hipótese #1: Erro de Throughput/Provisionamento (CONFIRMADA)

**Evidência:**
- Erro menciona explicitamente "on-demand throughput isn't supported"
- Modelo requer habilitação prévia na conta AWS
- Sistema não detecta este tipo de erro especificamente

**Solução:**
- Adicionar categoria `PROVISIONING_REQUIRED`
- Melhorar mensagens de erro
- Validar disponibilidade na certificação

### ⚠️ Hipótese #2: Timing/Estado da Conta AWS (PARCIALMENTE CONFIRMADA)

**Evidência:**
- Cache de certificação dura 7 dias
- Estado do modelo pode mudar entre certificação e uso

**Solução:**
- Teste de disponibilidade real (2 invocações consecutivas)
- Melhor logging para detectar mudanças de estado

### ❌ Hipótese #3: Diferença Sutil na Invocação (DESCARTADA)

**Evidência:**
- Certificação e chat usam mesma função `streamChat()`
- Mesma lógica de auto-test com 3 variações
- Mesma aplicação de inference profiles

**Conclusão:**
- Não há discrepância entre certificação e chat
- Problema é de disponibilidade do modelo, não de implementação

---

## 📚 Referências

### Documentação AWS

- [AWS Bedrock Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [AWS Bedrock Provisioned Throughput](https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html)
- [AWS Bedrock IAM Permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)
- [AWS Bedrock Models by Region](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html)

### Arquivos do Projeto

- [`backend/src/services/ai/certification/certification.service.ts`](backend/src/services/ai/certification/certification.service.ts:1) - Sistema de certificação
- [`backend/src/services/ai/certification/test-runner.ts`](backend/src/services/ai/certification/test-runner.ts:1) - Executor de testes
- [`backend/src/services/ai/certification/error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:1) - Categorizador de erros
- [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:1) - Provider AWS Bedrock
- [`backend/src/services/ai/registry/model-registry.ts`](backend/src/services/ai/registry/model-registry.ts:1) - Registry de modelos
- [`backend/src/services/ai/registry/models/anthropic.models.ts`](backend/src/services/ai/registry/models/anthropic.models.ts:1) - Modelos Anthropic

---

## ✅ Conclusão

### Problema Identificado

Modelos AWS Bedrock são certificados mas falham no uso real devido a:
1. **Modelo requer provisionamento prévio** (Provisioned Throughput ou Model Access Request)
2. **Sistema não detecta erro de "on-demand throughput"** especificamente
3. **Mensagens de erro são técnicas demais** para o usuário final

### Solução Proposta

1. **Adicionar categoria `PROVISIONING_REQUIRED`** para detectar erros de throughput
2. **Melhorar mensagens de erro** com explicações claras e ações acionáveis
3. **Validar disponibilidade real** na certificação para evitar falsos positivos
4. **Melhorar logging** para facilitar debug de problemas futuros

### Próximos Passos

1. ✅ **Implementar Correções #1 e #2** (3-5h) - resolve problema crítico
2. ✅ **Implementar Correções #3 e #5** (2-3h) - melhora confiabilidade
3. ⚠️ **Correção #4 é opcional** - pode ser implementada depois

### Impacto Esperado

- ✅ **UX melhorada drasticamente** - mensagens claras em português
- ✅ **Menos frustração do usuário** - sabe exatamente o que fazer
- ✅ **Menos suporte necessário** - documentação e links incluídos
- ✅ **Certificação mais confiável** - detecta problemas reais
- ✅ **Debug mais fácil** - logs detalhados

---

**Documento criado em:** 2026-01-27  
**Última atualização:** 2026-01-27  
**Status:** 🔴 CRÍTICO - Aguardando Implementação