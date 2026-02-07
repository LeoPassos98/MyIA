# Plano de Modularização: BedrockProvider

## 1. Objetivo da Modularização

Refatorar [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:1) (553 linhas) para:

- **Eliminar loop triplo aninhado** (variações × retries × chunks) que gera complexidade ciclomática 38
- **Separar responsabilidades** em módulos coesos e testáveis
- **Reutilizar retry logic** em outros providers (OpenAI, etc.)
- **Facilitar manutenção** de normalização de modelId e error handling
- **Reduzir tamanho** de 553 para ~200 linhas no provider principal

---

## 2. Análise de Responsabilidades Atuais

### 2.1 Loop Triplo Aninhado (Linhas 310-430)
```typescript
// PROBLEMA: 3 níveis de aninhamento
for (variação in modelIdVariations) {           // Nível 1: 1-3 variações
  for (attempt in maxRetries) {                 // Nível 2: 2 retries
    for await (chunk in response.body) {        // Nível 3: N chunks
      // Processamento + error handling
    }
  }
}
```

**Complexidade:** 3 variações × 2 retries × N chunks = até 6N operações aninhadas

### 2.2 Responsabilidades Identificadas

| Responsabilidade | Linhas | Complexidade | Módulo Proposto |
|-----------------|--------|--------------|-----------------|
| Normalização de modelId | 69-132 | Média | `modelId/ModelIdNormalizer.ts` |
| Geração de variações | 286-302 | Baixa | `modelId/ModelIdVariationGenerator.ts` |
| Resolução de inference profile | 101-132 | Alta | `modelId/InferenceProfileResolver.ts` |
| Detecção de rate limit | 172-190 | Baixa | `errors/RateLimitDetector.ts` |
| Cálculo de backoff | 195-204 | Baixa | `retry/BackoffCalculator.ts` |
| Estratégia de retry | 315-422 | Alta | `retry/RetryStrategy.ts` |
| Parse de chunks | 334-350 | Média | `streaming/ChunkParser.ts` |
| Processamento de stream | 324-353 | Média | `streaming/StreamProcessor.ts` |
| Parse de erros AWS | 355-396 | Alta | `errors/AWSErrorParser.ts` |

---

## 3. Estrutura de Módulos Proposta

```
backend/src/services/ai/providers/bedrock/
├── BedrockProvider.ts (200 linhas)
│   └── Orquestração principal + validação de credenciais
│
├── streaming/
│   ├── StreamProcessor.ts (120 linhas)
│   │   └── Gerencia stream completo (setup + processamento)
│   └── ChunkParser.ts (80 linhas)
│       └── Parse de chunks por adapter
│
├── retry/
│   ├── RetryStrategy.ts (100 linhas)
│   │   └── Executa retry com backoff (REUTILIZÁVEL)
│   └── BackoffCalculator.ts (60 linhas)
│       └── Calcula delays com jitter (REUTILIZÁVEL)
│
├── modelId/
│   ├── ModelIdNormalizer.ts (80 linhas)
│   │   └── Remove sufixos (:8k, :20k, :mm)
│   ├── InferenceProfileResolver.ts (90 linhas)
│   │   └── Resolve inference profiles (us., eu., apac.)
│   └── ModelIdVariationGenerator.ts (70 linhas)
│       └── Gera variações de teste (com/sem profile, sem "2")
│
└── errors/
    ├── AWSErrorParser.ts (100 linhas)
    │   └── Extrai metadata de erros AWS SDK v3
    └── RateLimitDetector.ts (50 linhas)
        └── Detecta ThrottlingException + keywords
```

**Total:** ~750 linhas (vs. 553 original) - Aumento justificado por:
- Separação de responsabilidades
- Interfaces explícitas
- Documentação inline
- Testabilidade individual

---

## 4. Interfaces e Contratos entre Módulos

### 4.1 Retry Strategy (REUTILIZÁVEL)

```typescript
// retry/RetryStrategy.ts
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface RetryableOperation<T> {
  execute: () => Promise<T>;
  shouldRetry: (error: unknown) => boolean;
  onRetry?: (attempt: number, delay: number) => void;
}

export class RetryStrategy {
  async executeWithRetry<T>(
    operation: RetryableOperation<T>,
    config: RetryConfig
  ): Promise<T>
}
```

### 4.2 Model ID Resolution

```typescript
// modelId/ModelIdVariationGenerator.ts
export interface ModelIdVariation {
  modelId: string;
  type: 'inference_profile' | 'normalized' | 'legacy';
  priority: number;
}

export class ModelIdVariationGenerator {
  generateVariations(
    originalModelId: string,
    requiresInferenceProfile: boolean,
    region: string
  ): ModelIdVariation[]
}
```

### 4.3 Stream Processing

```typescript
// streaming/StreamProcessor.ts
export interface StreamConfig {
  client: BedrockRuntimeClient;
  modelId: string;
  body: any;
  adapter: BaseAdapter;
}

export class StreamProcessor {
  async *processStream(
    config: StreamConfig
  ): AsyncGenerator<StreamChunk>
}
```

### 4.4 Error Parsing

```typescript
// errors/AWSErrorParser.ts
export interface ParsedAWSError {
  code: string;
  message: string;
  httpStatus?: number;
  requestId?: string;
  isRetryable: boolean;
  isRateLimit: boolean;
  metadata: Record<string, any>;
}

export class AWSErrorParser {
  parse(error: unknown): ParsedAWSError
}
```

---

## 5. Fluxo de Dados e Orquestração

### 5.1 Fluxo Simplificado (SEM loop triplo)

```
BedrockProvider.streamChat()
│
├─► ModelIdNormalizer.normalize(modelId)
│   └─► Remove sufixos (:8k, :20k, :mm)
│
├─► InferenceProfileResolver.resolve(modelId, region)
│   └─► Verifica ModelRegistry + adiciona prefixo regional
│
├─► ModelIdVariationGenerator.generateVariations()
│   └─► Retorna [inferenceProfile, normalized, legacy]
│
└─► Para cada variação:
    │
    ├─► RetryStrategy.executeWithRetry({
    │     execute: () => StreamProcessor.processStream(),
    │     shouldRetry: (err) => RateLimitDetector.isRateLimit(err)
    │   })
    │   │
    │   ├─► StreamProcessor.processStream()
    │   │   ├─► Envia comando AWS
    │   │   └─► ChunkParser.parseChunks() → yield chunks
    │   │
    │   └─► Se erro:
    │       ├─► AWSErrorParser.parse(error)
    │       ├─► RateLimitDetector.isRateLimit(error)
    │       └─► BackoffCalculator.calculate(attempt)
    │
    └─► Se sucesso: RETORNA (não tenta outras variações)
```

### 5.2 Desacoplamento do Loop Triplo

**ANTES (3 níveis aninhados):**
```typescript
for (variação) {
  for (retry) {
    for await (chunk) { ... }
  }
}
```

**DEPOIS (separado em camadas):**
```typescript
// Camada 1: Variações (BedrockProvider)
for (const variation of variations) {
  
  // Camada 2: Retry (RetryStrategy)
  const result = await retryStrategy.executeWithRetry({
    
    // Camada 3: Streaming (StreamProcessor)
    execute: () => streamProcessor.processStream(variation)
  });
  
  if (result.success) return result;
}
```

**Benefícios:**
- Cada camada testável isoladamente
- Retry reutilizável em outros providers
- Streaming independente de retry logic
- Complexidade ciclomática reduzida de 38 para ~8

---

## 6. Estratégia de Migração

### Fase 1: Criar Módulos Base (Sem Breaking Changes)
**Duração:** 2-3 horas

1. **Criar estrutura de diretórios:**
   ```bash
   mkdir -p backend/src/services/ai/providers/bedrock/{streaming,retry,modelId,errors}
   ```

2. **Extrair módulos utilitários (sem dependências):**
   - `retry/BackoffCalculator.ts` (linhas 195-204)
   - `errors/RateLimitDetector.ts` (linhas 172-190)
   - `modelId/ModelIdNormalizer.ts` (linhas 69-72)

3. **Criar testes unitários para cada módulo:**
   ```typescript
   // retry/__tests__/BackoffCalculator.test.ts
   describe('BackoffCalculator', () => {
     it('calcula delay com jitter', () => { ... });
     it('respeita maxDelay', () => { ... });
   });
   ```

### Fase 2: Extrair Módulos com Dependências
**Duração:** 3-4 horas

4. **Extrair módulos de modelId:**
   - `modelId/InferenceProfileResolver.ts` (linhas 101-132)
   - `modelId/ModelIdVariationGenerator.ts` (linhas 286-302)

5. **Extrair módulos de error handling:**
   - `errors/AWSErrorParser.ts` (linhas 355-396)

6. **Criar testes de integração:**
   ```typescript
   // modelId/__tests__/integration.test.ts
   describe('ModelId Resolution Flow', () => {
     it('normaliza → resolve → gera variações', () => { ... });
   });
   ```

### Fase 3: Extrair Streaming e Retry
**Duração:** 4-5 horas

7. **Extrair streaming:**
   - `streaming/ChunkParser.ts` (linhas 334-350)
   - `streaming/StreamProcessor.ts` (linhas 324-353)

8. **Extrair retry strategy:**
   - `retry/RetryStrategy.ts` (linhas 315-422)
   - **IMPORTANTE:** Tornar genérico para reutilização

9. **Validar com testes end-to-end:**
   ```bash
   npm test -- bedrock
   ```

### Fase 4: Refatorar BedrockProvider
**Duração:** 2-3 horas

10. **Simplificar `streamChat()` usando módulos:**
    - Remover loop triplo aninhado
    - Delegar para `RetryStrategy` + `StreamProcessor`
    - Reduzir de ~250 linhas para ~80 linhas

11. **Atualizar imports e exports:**
    ```typescript
    // bedrock/index.ts
    export { BedrockProvider } from './BedrockProvider';
    export * from './retry';
    export * from './streaming';
    export * from './modelId';
    export * from './errors';
    ```

### Fase 5: Validação e Documentação
**Duração:** 2-3 horas

12. **Executar suite completa de testes:**
    ```bash
    npm test
    npm run test:integration
    ```

13. **Validar com modelos reais:**
    ```bash
    npm run test:amazon-models
    ```

14. **Atualizar documentação:**
    - `backend/docs/BEDROCK-PROVIDER-ARCHITECTURE.md`
    - Diagramas de fluxo (Mermaid)
    - Exemplos de uso

---

## 7. Pontos Críticos Específicos

### 7.1 Loop Triplo Aninhado (Linhas 310-430)

**Estratégia de Desacoplamento:**

```typescript
// ANTES: Tudo aninhado
for (const variation of variations) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.send(command);
      for await (const event of response.body) {
        // Parse chunk
      }
    } catch (error) {
      // Retry logic
    }
  }
}

// DEPOIS: Separado em camadas
const variations = variationGenerator.generate(modelId, region);

for (const variation of variations) {
  const result = await retryStrategy.executeWithRetry({
    execute: async () => {
      return streamProcessor.processStream({
        client,
        modelId: variation.modelId,
        body,
        adapter
      });
    },
    shouldRetry: (error) => rateLimitDetector.isRateLimit(error),
    onRetry: (attempt, delay) => {
      yield { type: 'debug', log: `Retry ${attempt} após ${delay}ms` };
    }
  });
  
  if (result.success) {
    yield* result.stream;
    return;
  }
}
```

### 7.2 Retry Logic Reutilizável

**Design Pattern:** Strategy + Template Method

```typescript
// retry/RetryStrategy.ts
export class RetryStrategy {
  constructor(
    private config: RetryConfig,
    private backoffCalculator: BackoffCalculator
  ) {}
  
  async executeWithRetry<T>(
    operation: RetryableOperation<T>
  ): Promise<RetryResult<T>> {
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation.execute();
        return { success: true, result };
      } catch (error) {
        if (!operation.shouldRetry(error) || attempt === this.config.maxRetries) {
          return { success: false, error };
        }
        
        const delay = this.backoffCalculator.calculate(attempt);
        operation.onRetry?.(attempt, delay);
        await sleep(delay);
      }
    }
  }
}
```

**Uso em outros providers:**
```typescript
// providers/openai.ts
const retryStrategy = new RetryStrategy(config, backoffCalculator);
await retryStrategy.executeWithRetry({
  execute: () => openai.chat.completions.create(...),
  shouldRetry: (err) => err.status === 429
});
```

### 7.3 Model ID Normalization (Linhas 69-132)

**Problema:** 3 funções interdependentes
- `normalizeModelId()` - Remove sufixos
- `getRegionPrefix()` - Extrai prefixo regional
- `getInferenceProfileId()` - Resolve profile

**Solução:** Pipeline pattern
```typescript
// modelId/ModelIdPipeline.ts
export class ModelIdPipeline {
  constructor(
    private normalizer: ModelIdNormalizer,
    private profileResolver: InferenceProfileResolver,
    private variationGenerator: ModelIdVariationGenerator
  ) {}
  
  async process(modelId: string, region: string): Promise<ModelIdVariation[]> {
    const normalized = this.normalizer.normalize(modelId);
    const withProfile = await this.profileResolver.resolve(normalized, region);
    return this.variationGenerator.generate(normalized, withProfile, region);
  }
}
```

### 7.4 Error Categorization (Linhas 355-460)

**Problema:** 100+ linhas de error handling inline

**Solução:** Chain of Responsibility
```typescript
// errors/ErrorHandlerChain.ts
export class ErrorHandlerChain {
  private handlers: ErrorHandler[] = [
    new RateLimitErrorHandler(),
    new ValidationErrorHandler(),
    new AuthenticationErrorHandler(),
    new GenericAWSErrorHandler()
  ];
  
  handle(error: unknown): HandledError {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        return handler.handle(error);
      }
    }
    return this.defaultHandler.handle(error);
  }
}
```

---

## 8. Checklist de Validação

### 8.1 Testes Unitários
- [ ] `BackoffCalculator` calcula delays corretamente
- [ ] `RateLimitDetector` identifica ThrottlingException
- [ ] `ModelIdNormalizer` remove todos os sufixos conhecidos
- [ ] `InferenceProfileResolver` adiciona prefixos corretos (us, eu, apac)
- [ ] `ModelIdVariationGenerator` gera 1-3 variações conforme regra
- [ ] `AWSErrorParser` extrai metadata completa
- [ ] `ChunkParser` parse chunks de diferentes adapters
- [ ] `StreamProcessor` gerencia stream completo

### 8.2 Testes de Integração
- [ ] Pipeline completo: normalize → resolve → generate variations
- [ ] Retry strategy com backoff exponencial + jitter
- [ ] Stream processing com error handling
- [ ] Error handler chain processa todos os tipos de erro

### 8.3 Testes End-to-End
- [ ] `BedrockProvider.streamChat()` funciona com modelos reais
- [ ] Retry automático em rate limit (429)
- [ ] Auto-test de variações (inference profile → normalized → legacy)
- [ ] Error messages amigáveis com sugestões

### 8.4 Validação de Regressão
- [ ] Todos os testes existentes passam
- [ ] `npm run test:amazon-models` executa sem erros
- [ ] Certificação de modelos mantém mesma taxa de sucesso
- [ ] Performance não degrada (latência < 5% de aumento)

### 8.5 Validação de Código
- [ ] Nenhum arquivo > 300 linhas
- [ ] Complexidade ciclomática < 10 por função
- [ ] Cobertura de testes > 80%
- [ ] Zero warnings do ESLint
- [ ] Documentação inline completa (JSDoc)

### 8.6 Validação de Arquitetura
- [ ] Retry logic reutilizável em outros providers
- [ ] Módulos independentes (baixo acoplamento)
- [ ] Interfaces bem definidas
- [ ] Dependências unidirecionais (sem ciclos)

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de compatibilidade com adapters | Média | Alto | Manter interfaces existentes + testes de regressão |
| Performance degradada por overhead de módulos | Baixa | Médio | Benchmarks antes/depois + lazy loading |
| Retry logic não funciona em edge cases | Média | Alto | Testes com mocks de erros AWS reais |
| Variações de modelId não cobrem todos os casos | Alta | Alto | Validar com 100+ modelos do registry |

---

## 10. Métricas de Sucesso

### Antes da Modularização
- **Linhas:** 553 (bedrock.ts)
- **Complexidade Ciclomática:** 38
- **Funções > 50 linhas:** 1 (`streamChat()` com 280 linhas)
- **Testabilidade:** Baixa (lógica acoplada)
- **Reutilização:** Nenhuma (retry logic específico)

### Depois da Modularização
- **Linhas:** ~200 (BedrockProvider) + ~550 (módulos)
- **Complexidade Ciclomática:** < 10 por função
- **Funções > 50 linhas:** 0
- **Testabilidade:** Alta (módulos isolados)
- **Reutilização:** Retry logic usado em 3+ providers

### KPIs
- ✅ Redução de 85% na complexidade ciclomática (38 → 8)
- ✅ Aumento de 40% na cobertura de testes (60% → 85%)
- ✅ Redução de 65% no tamanho da função principal (280 → 80 linhas)
- ✅ 100% dos testes de regressão passando

---

## 11. Próximos Passos

1. **Aprovação do plano** pela equipe
2. **Criar branch:** `refactor/bedrock-modularization`
3. **Executar Fase 1-5** (estimativa: 13-18 horas)
4. **Code review** com foco em:
   - Reutilização de retry logic
   - Testabilidade dos módulos
   - Performance (benchmarks)
5. **Merge para develop** após validação completa
6. **Aplicar padrão** em outros providers (OpenAI, Anthropic)

---

## Referências

- [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:1) - Arquivo original
- [`docs/STANDARDS.md`](docs/STANDARDS.md:1) - Padrões do projeto
- [`backend/docs/ADAPTER_MIGRATION_GUIDE.md`](backend/docs/ADAPTER_MIGRATION_GUIDE.md:1) - Guia de adapters
- AWS SDK v3 Error Handling: https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md
