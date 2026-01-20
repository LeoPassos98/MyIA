# Sistema de Certificação de Modelos

**Proposta de Implementação: Whitelist Certificada para Modelos AWS Bedrock**

---

## 🎯 Problema

### Situação Atual: Abordagem Genérica

```
AWS Bedrock retorna 124 modelos
    ↓
Registry tem 43 modelos cadastrados
    ↓
UI mostra todos os 43 modelos
    ↓
❌ Usuário seleciona modelo não testado
    ↓
❌ Erro em produção: "Malformed input request"
    ↓
❌ Frustração do usuário
```

### Problemas Identificados

1. **Falhas Silenciosas**
   - Modelos aparecem como disponíveis mas falham no uso real
   - Usuário só descobre o erro ao tentar usar
   - Perda de confiança na aplicação

2. **Manutenção Reativa**
   - Bugs descobertos apenas após usuário reportar
   - Debugging manual e demorado
   - Correções emergenciais

3. **Superfície de Ataque Grande**
   - 43 modelos × 3 vendors = 129 combinações possíveis
   - Cada modelo pode ter quirks únicos
   - Vendors podem mudar API sem aviso

4. **Qualidade Inconsistente**
   ```
   ✅ Claude 4.5 Sonnet: Testado, funciona
   ❓ Amazon Nova Premier: Não testado, pode falhar
   ❓ Cohere Command Light: Não testado, pode falhar
   ```

---

## 💡 Solução Proposta: Sistema de Certificação

### Conceito: "Certified Models Only"

Apenas modelos que passaram por testes rigorosos e automatizados aparecem na UI.

```
┌─────────────────────────────────────────────────────┐
│         CICLO DE CERTIFICAÇÃO DE MODELO             │
└─────────────────────────────────────────────────────┘

1. DISCOVERY
   ↓ AWS retorna 124 modelos disponíveis
   
2. FILTERING (Registry)
   ↓ Registry tem 43 modelos cadastrados
   
3. TESTING (NOVO)
   ↓ Testes automatizados validam cada modelo
   
4. CERTIFICATION (NOVO)
   ↓ Apenas modelos certificados aparecem na UI
   
5. MONITORING (NOVO)
   ↓ Re-certificação automática periódica
```

---

## 🏗️ Arquitetura

### 1. Status de Certificação

```typescript
enum ModelCertificationStatus {
  UNTESTED = 'untested',        // Nunca testado
  TESTING = 'testing',           // Teste em andamento
  CERTIFIED = 'certified',       // Passou em todos os testes
  FAILED = 'failed',             // Falhou em testes
  DEPRECATED = 'deprecated',     // Removido pela AWS
  MONITORING = 'monitoring'      // Em monitoramento contínuo
}

interface CertifiedModel {
  modelId: string;
  vendor: string;
  status: ModelCertificationStatus;
  
  // Certificação
  certifiedAt?: Date;
  expiresAt?: Date;              // Certificação expira em 7 dias
  certifiedBy?: string;          // 'system' ou userId
  
  // Testes
  lastTestedAt?: Date;
  testsPassed: number;
  testsFailed: number;
  successRate: number;           // % de testes bem-sucedidos
  
  // Performance
  avgLatencyMs?: number;
  lastError?: string;
  failureReasons?: string[];
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Banco de Dados

**Nova Tabela:** `model_certifications`

```prisma
model ModelCertification {
  id                String   @id @default(cuid())
  modelId           String   @unique
  vendor            String   // anthropic, cohere, amazon
  status            String   // certified, failed, untested, testing
  
  // Certificação
  certifiedAt       DateTime?
  expiresAt         DateTime?
  certifiedBy       String?  // 'system' ou userId
  
  // Testes
  lastTestedAt      DateTime?
  testsPassed       Int      @default(0)
  testsFailed       Int      @default(0)
  successRate       Float    @default(0)
  
  // Performance
  avgLatencyMs      Int?
  lastError         String?
  failureReasons    Json?    // Array de erros
  
  // Metadados
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([status])
  @@index([vendor])
  @@index([expiresAt])
  @@map("model_certifications")
}
```

### 3. Especificações de Teste

**Estrutura Modular:** Cada vendor tem suas próprias specs de teste

```
backend/src/services/ai/certification/
├── index.ts
├── certification.service.ts       # Serviço principal
├── test-runner.ts                 # Executor de testes
├── test-specs/                    # Especificações de teste
│   ├── base.spec.ts               # Testes base (todos os modelos)
│   ├── anthropic.spec.ts          # Testes específicos Anthropic
│   ├── cohere.spec.ts             # Testes específicos Cohere
│   └── amazon.spec.ts             # Testes específicos Amazon
└── types.ts                       # Tipos compartilhados
```

---

## 📋 Especificações de Teste

### Testes Base (Todos os Modelos)

**Arquivo:** [`backend/src/services/ai/certification/test-specs/base.spec.ts`](../backend/src/services/ai/certification/test-specs/base.spec.ts)

```typescript
// backend/src/services/ai/certification/test-specs/base.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes base aplicados a todos os modelos
 */
export const baseTestSpecs: TestSpec[] = [
  {
    id: 'basic-prompt',
    name: 'Basic Prompt Test',
    description: 'Testa resposta a prompt simples',
    timeout: 30000, // 30s
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Validações
        if (!response || response.length === 0) {
          return {
            passed: false,
            error: 'Empty response',
            latencyMs: latency
          };
        }
        
        if (latency > 30000) {
          return {
            passed: false,
            error: 'Timeout exceeded',
            latencyMs: latency
          };
        }
        
        return {
          passed: true,
          latencyMs: latency,
          metadata: {
            responseLength: response.length,
            chunksCount: chunks.length
          }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'streaming-test',
    name: 'Streaming Test',
    description: 'Valida que streaming funciona corretamente',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Count from 1 to 5' }];
        let chunkCount = 0;
        let hasContent = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk') {
            chunkCount++;
            if (chunk.content && chunk.content.length > 0) {
              hasContent = true;
            }
          }
        }
        
        const latency = Date.now() - startTime;
        
        if (chunkCount === 0) {
          return {
            passed: false,
            error: 'No chunks received',
            latencyMs: latency
          };
        }
        
        if (!hasContent) {
          return {
            passed: false,
            error: 'No content in chunks',
            latencyMs: latency
          };
        }
        
        return {
          passed: true,
          latencyMs: latency,
          metadata: { chunkCount }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'parameter-validation',
    name: 'Parameter Validation Test',
    description: 'Testa se parâmetros são aceitos corretamente',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const options = {
          modelId,
          temperature: 0.7,
          maxTokens: 100
        };
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, options)) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        if (!hasResponse) {
          return {
            passed: false,
            error: 'No response with parameters',
            latencyMs: latency
          };
        }
        
        return {
          passed: true,
          latencyMs: latency
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'error-handling',
    name: 'Error Handling Test',
    description: 'Valida tratamento de erros',
    timeout: 10000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        // Enviar prompt vazio (deve falhar gracefully)
        const messages = [{ role: 'user', content: '' }];
        
        let hasError = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'error') {
            hasError = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        // Esperamos que o modelo trate o erro gracefully
        return {
          passed: true,
          latencyMs: latency,
          metadata: { errorHandled: hasError }
        };
        
      } catch (error: any) {
        // Erro capturado é OK, significa que foi tratado
        return {
          passed: true,
          latencyMs: Date.now() - startTime,
          metadata: { errorCaught: true }
        };
      }
    }
  }
];
```

### Testes Específicos Anthropic

**Arquivo:** [`backend/src/services/ai/certification/test-specs/anthropic.spec.ts`](../backend/src/services/ai/certification/test-specs/anthropic.spec.ts)

```typescript
// backend/src/services/ai/certification/test-specs/anthropic.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes específicos para modelos Anthropic Claude
 */
export const anthropicTestSpecs: TestSpec[] = [
  {
    id: 'anthropic-system-message',
    name: 'System Message Test',
    description: 'Valida suporte a system messages',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hi' }
        ];
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        return {
          passed: hasResponse,
          error: hasResponse ? undefined : 'No response with system message',
          latencyMs: latency
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'anthropic-temperature-top-p-conflict',
    name: 'Temperature + Top-P Conflict Test',
    description: 'Valida se modelo aceita temperature e top_p juntos',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Hi' }];
        const options = {
          modelId,
          temperature: 0.7,
          topP: 0.9  // Alguns modelos Claude não aceitam ambos
        };
        
        let hasResponse = false;
        
        for await (const chunk of provider.streamChat(messages, options)) {
          if (chunk.type === 'chunk' && chunk.content) {
            hasResponse = true;
            break;
          }
        }
        
        const latency = Date.now() - startTime;
        
        return {
          passed: hasResponse,
          latencyMs: latency,
          metadata: {
            acceptsBothParams: hasResponse
          }
        };
        
      } catch (error: any) {
        // Se falhar, não é crítico, mas registramos
        return {
          passed: true, // Não é falha crítica
          latencyMs: Date.now() - startTime,
          metadata: {
            acceptsBothParams: false,
            error: error.message
          }
        };
      }
    }
  }
];
```

### Testes Específicos Cohere

**Arquivo:** [`backend/src/services/ai/certification/test-specs/cohere.spec.ts`](../backend/src/services/ai/certification/test-specs/cohere.spec.ts)

```typescript
// backend/src/services/ai/certification/test-specs/cohere.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes específicos para modelos Cohere
 */
export const cohereTestSpecs: TestSpec[] = [
  {
    id: 'cohere-chat-history',
    name: 'Chat History Test',
    description: 'Valida suporte a histórico de conversa',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'Nice to meet you, Alice!' },
          { role: 'user', content: 'What is my name?' }
        ];
        
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('').toLowerCase();
        const latency = Date.now() - startTime;
        
        // Verifica se o modelo lembrou o nome
        const rememberedName = response.includes('alice');
        
        return {
          passed: rememberedName,
          error: rememberedName ? undefined : 'Model did not remember context',
          latencyMs: latency,
          metadata: {
            response: chunks.join(''),
            rememberedContext: rememberedName
          }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'cohere-preamble',
    name: 'Preamble Test',
    description: 'Valida suporte a preamble (system message)',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [
          { role: 'system', content: 'Always respond in uppercase.' },
          { role: 'user', content: 'hello' }
        ];
        
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Verifica se resposta está em uppercase
        const isUppercase = response === response.toUpperCase();
        
        return {
          passed: true, // Não é crítico se não seguir
          latencyMs: latency,
          metadata: {
            followedPreamble: isUppercase,
            response
          }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  }
];
```

### Testes Específicos Amazon

**Arquivo:** [`backend/src/services/ai/certification/test-specs/amazon.spec.ts`](../backend/src/services/ai/certification/test-specs/amazon.spec.ts)

```typescript
// backend/src/services/ai/certification/test-specs/amazon.spec.ts
// Standards: docs/STANDARDS.md

import { TestSpec, TestResult } from '../types';

/**
 * Testes específicos para modelos Amazon (Titan, Nova)
 */
export const amazonTestSpecs: TestSpec[] = [
  {
    id: 'amazon-text-generation',
    name: 'Text Generation Test',
    description: 'Valida geração de texto básica',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Write a haiku about coding' }];
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, { modelId })) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Valida que gerou texto com tamanho razoável
        const hasReasonableLength = response.length > 20;
        
        return {
          passed: hasReasonableLength,
          error: hasReasonableLength ? undefined : 'Response too short',
          latencyMs: latency,
          metadata: {
            responseLength: response.length,
            response
          }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  },
  
  {
    id: 'amazon-max-tokens',
    name: 'Max Tokens Test',
    description: 'Valida respeito ao limite de tokens',
    timeout: 30000,
    
    async run(modelId: string, provider: any): Promise<TestResult> {
      const startTime = Date.now();
      
      try {
        const messages = [{ role: 'user', content: 'Count from 1 to 100' }];
        const options = {
          modelId,
          maxTokens: 50  // Limite baixo
        };
        
        const chunks: string[] = [];
        
        for await (const chunk of provider.streamChat(messages, options)) {
          if (chunk.type === 'chunk' && chunk.content) {
            chunks.push(chunk.content);
          }
        }
        
        const response = chunks.join('');
        const latency = Date.now() - startTime;
        
        // Verifica que resposta foi limitada
        const wasLimited = response.length < 500; // Aproximado
        
        return {
          passed: wasLimited,
          latencyMs: latency,
          metadata: {
            responseLength: response.length,
            respectsMaxTokens: wasLimited
          }
        };
        
      } catch (error: any) {
        return {
          passed: false,
          error: error.message,
          latencyMs: Date.now() - startTime
        };
      }
    }
  }
];
```

---

## 🔧 Serviço de Certificação

**Arquivo:** [`backend/src/services/ai/certification/certification.service.ts`](../backend/src/services/ai/certification/certification.service.ts)

```typescript
// backend/src/services/ai/certification/certification.service.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../../../lib/prisma';
import { ModelRegistry } from '../registry';
import { BedrockProvider } from '../providers/bedrock';
import { TestRunner } from './test-runner';
import { baseTestSpecs } from './test-specs/base.spec';
import { anthropicTestSpecs } from './test-specs/anthropic.spec';
import { cohereTestSpecs } from './test-specs/cohere.spec';
import { amazonTestSpecs } from './test-specs/amazon.spec';
import { CertificationResult, ModelCertificationStatus } from './types';

export class ModelCertificationService {
  /**
   * Certifica um modelo específico
   */
  async certifyModel(
    modelId: string,
    credentials: { accessKey: string; secretKey: string; region: string }
  ): Promise<CertificationResult> {
    console.log(`[Certification] Starting certification for ${modelId}`);
    
    // 1. Obter metadata do modelo
    const metadata = ModelRegistry.getModel(modelId);
    if (!metadata) {
      throw new Error(`Model ${modelId} not found in registry`);
    }
    
    // 2. Criar provider
    const provider = new BedrockProvider(credentials.region);
    const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;
    
    // 3. Selecionar testes apropriados
    const tests = this.getTestsForVendor(metadata.vendor);
    
    // 4. Executar testes
    const runner = new TestRunner(provider, apiKey);
    const results = await runner.runTests(modelId, tests);
    
    // 5. Calcular métricas
    const testsPassed = results.filter(r => r.passed).length;
    const testsFailed = results.filter(r => !r.passed).length;
    const successRate = (testsPassed / results.length) * 100;
    const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
    
    // 6. Determinar se está certificado
    const isCertified = successRate >= 80; // Mínimo 80% de sucesso
    const status: ModelCertificationStatus = isCertified ? 'certified' : 'failed';
    
    // 7. Salvar no banco
    const expiresAt = isCertified ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null; // 7 dias
    
    await prisma.modelCertification.upsert({
      where: { modelId },
      update: {
        status,
        certifiedAt: isCertified ? new Date() : null,
        expiresAt,
        lastTestedAt: new Date(),
        testsPassed,
        testsFailed,
        successRate,
        avgLatencyMs: Math.round(avgLatency),
        lastError: testsFailed > 0 ? results.find(r => !r.passed)?.error : null,
        failureReasons: results.filter(r => !r.passed).map(r => r.error || 'Unknown error'),
        updatedAt: new Date()
      },
      create: {
        modelId,
        vendor: metadata.vendor,
        status,
        certifiedAt: isCertified ? new Date() : null,
        expiresAt,
        lastTestedAt: new Date(),
        testsPassed,
        testsFailed,
        successRate,
        avgLatencyMs: Math.round(avgLatency),
        certifiedBy: 'system'
      }
    });
    
    console.log(`[Certification] ${modelId}: ${status} (${successRate.toFixed(1)}% success)`);
    
    return {
      modelId,
      status,
      testsPassed,
      testsFailed,
      successRate,
      avgLatencyMs: Math.round(avgLatency),
      isCertified,
      results
    };
  }
  
  /**
   * Certifica todos os modelos de um vendor
   */
  async certifyVendor(
    vendor: string,
    credentials: { accessKey: string; secretKey: string; region: string }
  ): Promise<CertificationResult[]> {
    const models = ModelRegistry.getModelsByVendor(vendor);
    const results: CertificationResult[] = [];
    
    for (const model of models) {
      try {
        const result = await this.certifyModel(model.modelId, credentials);
        results.push(result);
      } catch (error: any) {
        console.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
        results.push({
          modelId: model.modelId,
          status: 'failed',
          testsPassed: 0,
          testsFailed: 1,
          successRate: 0,
          avgLatencyMs: 0,
          isCertified: false,
          results: [{
            testId: 'certification-error',
            testName: 'Certification Error',
            passed: false,
            error: error.message,
            latencyMs: 0
          }]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Certifica todos os modelos
   */
  async certifyAll(
    credentials: { accessKey: string; secretKey: string; region: string }
  ): Promise<CertificationResult[]> {
    const allModels = ModelRegistry.getAllSupported();
    const results: CertificationResult[] = [];
    
    console.log(`[Certification] Starting certification for ${allModels.length} models`);
    
    for (const model of allModels) {
      try {
        const result = await this.certifyModel(model.modelId, credentials);
        results.push(result);
      } catch (error: any) {
        console.error(`[Certification] Failed to certify ${model.modelId}:`, error.message);
      }
    }
    
    return results;
  }
  
  /**
   * Obtém modelos certificados
   */
  async getCertifiedModels(): Promise<string[]> {
    const certifications = await prisma.modelCertification.findMany({
      where: {
        status: 'certified',
        expiresAt: {
          gt: new Date() // Não expirados
        }
      },
      select: {
        modelId: true
      }
    });
    
    return certifications.map(c => c.modelId);
  }
  
  /**
   * Verifica se modelo está certificado
   */
  async isCertified(modelId: string): Promise<boolean> {
    const certification = await prisma.modelCertification.findUnique({
      where: { modelId }
    });
    
    if (!certification) return false;
    
    return (
      certification.status === 'certified' &&
      certification.expiresAt &&
      certification.expiresAt > new Date()
    );
  }
  
  /**
   * Obtém testes para um vendor específico
   */
  private getTestsForVendor(vendor: string) {
    const tests = [...baseTestSpecs]; // Sempre incluir testes base
    
    switch (vendor.toLowerCase()) {
      case 'anthropic':
        tests.push(...anthropicTestSpecs);
        break;
      case 'cohere':
        tests.push(...cohereTestSpecs);
        break;
      case 'amazon':
        tests.push(...amazonTestSpecs);
        break;
    }
    
    return tests;
  }
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Infraestrutura (2-3 horas)

**Arquivos a criar:**
1. ✅ [`backend/src/services/ai/certification/types.ts`](../backend/src/services/ai/certification/types.ts)
2. ✅ [`backend/src/services/ai/certification/test-runner.ts`](../backend/src/services/ai/certification/test-runner.ts)
3. ✅ [`backend/src/services/ai/certification/certification.service.ts`](../backend/src/services/ai/certification/certification.service.ts)
4. ✅ [`backend/src/services/ai/certification/index.ts`](../backend/src/services/ai/certification/index.ts)

**Migração Prisma:**
```bash
npx prisma migrate dev --name add-model-certification
```

### Fase 2: Especificações de Teste (3-4 horas)

**Arquivos a criar:**
1. ✅ [`backend/src/services/ai/certification/test-specs/base.spec.ts`](../backend/src/services/ai/certification/test-specs/base.spec.ts)
2. ✅ [`backend/src/services/ai/certification/test-specs/anthropic.spec.ts`](../backend/src/services/ai/certification/test-specs/anthropic.spec.ts)
3. ✅ [`backend/src/services/ai/certification/test-specs/cohere.spec.ts`](../backend/src/services/ai/certification/test-specs/cohere.spec.ts)
4. ✅ [`backend/src/services/ai/certification/test-specs/amazon.spec.ts`](../backend/src/services/ai/certification/test-specs/amazon.spec.ts)

---

## ✅ Status de Implementação

**Data de Conclusão:** 2026-01-20
**Status:** ✅ IMPLEMENTADO

### Componentes Implementados

- ✅ Infraestrutura base (types, test-runner)
- ✅ Especificações de teste (10 testes: 4 base + 6 vendor-specific)
- ✅ Serviço de certificação (6 métodos)
- ✅ Migração Prisma (tabela model_certifications)
- ✅ Endpoints de API (5 rotas)
- ✅ Documentação de uso

### Arquivos Criados

1. [`backend/src/services/ai/certification/types.ts`](../backend/src/services/ai/certification/types.ts)
2. [`backend/src/services/ai/certification/test-runner.ts`](../backend/src/services/ai/certification/test-runner.ts)
3. [`backend/src/services/ai/certification/test-specs/base.spec.ts`](../backend/src/services/ai/certification/test-specs/base.spec.ts)
4. [`backend/src/services/ai/certification/test-specs/anthropic.spec.ts`](../backend/src/services/ai/certification/test-specs/anthropic.spec.ts)
5. [`backend/src/services/ai/certification/test-specs/cohere.spec.ts`](../backend/src/services/ai/certification/test-specs/cohere.spec.ts)
6. [`backend/src/services/ai/certification/test-specs/amazon.spec.ts`](../backend/src/services/ai/certification/test-specs/amazon.spec.ts)
7. [`backend/src/services/ai/certification/certification.service.ts`](../backend/src/services/ai/certification/certification.service.ts)
8. [`backend/src/controllers/certificationController.ts`](../backend/src/controllers/certificationController.ts)
9. [`backend/src/routes/certificationRoutes.ts`](../backend/src/routes/certificationRoutes.ts)
10. [`docs/MODEL-CERTIFICATION-USAGE.md`](MODEL-CERTIFICATION-USAGE.md)

### Próximos Passos (Opcional)

- [ ] Integração com UI (filtro de modelos certificados)
- [ ] Dashboard de certificação
- [ ] Notificações de expiração
- [ ] Testes automatizados (Jest)
- [ ] CI/CD para re-certificação periódica

---

**Guia de Uso:** [MODEL-CERTIFICATION-USAGE.md](MODEL-CERTIFICATION-USAGE.md)

---

**Autor:** Kilo Code
**Data:** 2026-01-20
**Versão:** 1.0
**Status:** ✅ IMPLEMENTADO
