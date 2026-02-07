# Plano de Modularização: providersController.ts

**Data:** 2026-02-07  
**Arquivo Alvo:** [`backend/src/controllers/providersController.ts`](../backend/src/controllers/providersController.ts) (755 linhas)  
**Meta:** Reduzir para ≤200 linhas (padrão rigoroso para controllers)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Métricas do Arquivo

| Métrica | Valor | Status |
|---------|-------|--------|
| **Linhas Totais** | 755 | 🚨 Crítico (>400) |
| **Linhas de Código** | ~575 | 🚨 Crítico |
| **Métodos** | 4 | ✅ OK |
| **Funções Auxiliares** | 4 | ⚠️ Devem ser extraídas |
| **Dependências Diretas** | 8 | ⚠️ Alto acoplamento |

### 1.2 Estrutura de Métodos

```typescript
providersController = {
  validateAWS()           // Linhas 24-198  (174 linhas) 🚨
  getAvailableModels()    // Linhas 204-363 (159 linhas) 🚨
  getByVendor()           // Linhas 369-551 (182 linhas) 🚨
  getModelsWithRating()   // Linhas 557-677 (120 linhas) ⚠️
}

// Funções auxiliares (linhas 680-755)
extractVendor()           // 9 linhas
getVendorName()           // 10 linhas
extractVersion()          // 22 linhas
getCertificationForModel() // 27 linhas
```

### 1.3 Dependências Identificadas

**Imports Diretos:**
- `express` (Response, AuthRequest)
- `prisma` (acesso direto ao banco)
- `encryptionService` (criptografia de credenciais)
- `BedrockProvider` (validação AWS)
- `jsend` (padronização de respostas)
- `AppError` (tratamento de erros)
- `ModelRegistry` (metadados de modelos)
- `logger` (logging estruturado)
- `VendorGroup`, `CertificationInfo` (tipos)

**Dependências Indiretas:**
- `userSettings` (tabela Prisma)
- `providerCredentialValidation` (tabela Prisma)
- `aIProvider` (tabela Prisma)
- `aIModel` (tabela Prisma)
- `modelCertification` (tabela Prisma)

---

## 🎯 2. Identificação de Responsabilidades

### 2.1 Responsabilidades Atuais (Violações SRP)

O controller atualmente viola o **Single Responsibility Principle** ao executar:

#### **R1: Validação de Credenciais AWS**
- Resolução de credenciais (stored vs. novas)
- Descriptografia de credenciais
- Validação via AWS Bedrock SDK
- Persistência de credenciais validadas
- Registro de validação no banco
- Tratamento de erros específicos da AWS

#### **R2: Busca de Modelos AWS Disponíveis**
- Recuperação de credenciais do usuário
- Descriptografia de credenciais
- Chamada ao AWS Bedrock API
- Filtragem por modelos suportados (ModelRegistry)
- Enriquecimento com dados do banco
- Filtragem por modalidades (TEXT)
- Filtragem por compatibilidade de chat

#### **R3: Agrupamento por Vendor**
- Busca de configurações do usuário
- Validação de credenciais AWS
- Busca de providers ativos
- Filtragem de providers configurados
- Criação de modelos dinâmicos (AWS)
- Agrupamento por vendor
- Enriquecimento com certificações
- Enriquecimento com metadata do registry

#### **R4: Listagem de Modelos com Rating**
- Busca de configurações do usuário
- Validação de credenciais AWS
- Busca de providers ativos
- Filtragem de providers configurados
- Criação de modelos dinâmicos (AWS)
- Busca de certificações
- Formatação flat com rating

#### **R5: Funções Auxiliares**
- Extração de vendor do modelId
- Mapeamento de nomes de vendors
- Extração de versão do modelId
- Busca de certificações por modelo

### 2.2 Responsabilidades Corretas (Controller)

Segundo [STANDARDS.md Seção 12](../docs/STANDARDS.md:535), controllers devem **apenas orquestrar**:

```typescript
// ✅ CORRETO - Controller apenas orquestra
export async function getByVendor(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const vendors = await vendorService.getVendorsWithModels(userId);
  return res.json(jsend.success({ vendors }));
}
```

---

## 🏗️ 3. Proposta de Divisão em Services

### 3.1 Arquitetura Proposta

```
backend/src/
├── controllers/
│   └── providersController.ts          (≤200 linhas) ✅
│
├── services/
│   └── providers/
│       ├── index.ts                     (exports públicos)
│       ├── aws-credentials.service.ts   (R1: Validação AWS)
│       ├── aws-models.service.ts        (R2: Modelos AWS)
│       ├── vendor-aggregation.service.ts (R3: Agrupamento)
│       ├── model-rating.service.ts      (R4: Rating)
│       ├── provider-filter.service.ts   (Lógica de filtragem)
│       └── utils/
│           ├── model-parser.ts          (R5: Parsing)
│           └── vendor-mapper.ts         (R5: Mapeamento)
│
└── types/
    └── providers/
        ├── aws-validation.types.ts
        ├── model-enrichment.types.ts
        └── vendor-group.types.ts (já existe)
```

### 3.2 Detalhamento dos Services

#### **Service 1: AWSCredentialsService**
**Arquivo:** `backend/src/services/providers/aws-credentials.service.ts`  
**Responsabilidade:** Gerenciar validação e persistência de credenciais AWS  
**Linhas Estimadas:** ~150

```typescript
export class AWSCredentialsService {
  /**
   * Valida credenciais AWS Bedrock
   * - Resolve credenciais (stored vs. novas)
   * - Descriptografa credenciais
   * - Valida via AWS SDK
   * - Persiste se válidas
   * - Registra validação
   */
  async validateCredentials(
    userId: string,
    config: BedrockConfig
  ): Promise<ValidationResult>

  /**
   * Recupera credenciais descriptografadas do usuário
   */
  async getDecryptedCredentials(
    userId: string
  ): Promise<AWSCredentials | null>

  /**
   * Persiste credenciais criptografadas
   */
  private async saveCredentials(
    userId: string,
    credentials: AWSCredentials
  ): Promise<void>

  /**
   * Registra resultado da validação
   */
  private async recordValidation(
    userId: string,
    result: ValidationResult
  ): Promise<void>
}
```

**Dependências:**
- `encryptionService`
- `BedrockProvider`
- `prisma` (userSettings, providerCredentialValidation)
- `logger`

---

#### **Service 2: AWSModelsService**
**Arquivo:** `backend/src/services/providers/aws-models.service.ts`  
**Responsabilidade:** Buscar e enriquecer modelos AWS disponíveis  
**Linhas Estimadas:** ~180

```typescript
export class AWSModelsService {
  constructor(
    private credentialsService: AWSCredentialsService,
    private modelParser: ModelParser
  ) {}

  /**
   * Busca modelos disponíveis na conta AWS do usuário
   * - Recupera credenciais
   * - Chama AWS Bedrock API
   * - Filtra por suportados (ModelRegistry)
   * - Enriquece com dados do banco
   * - Filtra por modalidades e compatibilidade
   */
  async getAvailableModels(
    userId: string
  ): Promise<EnrichedModel[]>

  /**
   * Enriquece modelos AWS com dados do banco e registry
   */
  private async enrichModels(
    awsModels: AWSModel[]
  ): Promise<EnrichedModel[]>

  /**
   * Filtra apenas modelos de chat (TEXT input/output)
   */
  private filterChatModels(
    models: EnrichedModel[]
  ): EnrichedModel[]
}
```

**Dependências:**
- `AWSCredentialsService`
- `BedrockProvider`
- `ModelRegistry`
- `prisma` (aIModel)
- `logger`

---

#### **Service 3: VendorAggregationService**
**Arquivo:** `backend/src/services/providers/vendor-aggregation.service.ts`  
**Responsabilidade:** Agrupar modelos por vendor com multi-provider  
**Linhas Estimadas:** ~200

```typescript
export class VendorAggregationService {
  constructor(
    private providerFilter: ProviderFilterService,
    private modelParser: ModelParser,
    private vendorMapper: VendorMapper
  ) {}

  /**
   * Retorna modelos agrupados por vendor
   * - Busca providers configurados
   * - Agrupa modelos por vendor
   * - Enriquece com certificações
   * - Enriquece com metadata do registry
   */
  async getVendorsWithModels(
    userId: string
  ): Promise<VendorGroup[]>

  /**
   * Agrupa modelos por vendor
   */
  private groupModelsByVendor(
    providers: Provider[]
  ): Map<string, VendorGroup>

  /**
   * Enriquece vendor group com certificações
   */
  private async enrichWithCertifications(
    vendorGroups: Map<string, VendorGroup>
  ): Promise<void>
}
```

**Dependências:**
- `ProviderFilterService`
- `ModelRegistry`
- `prisma` (modelCertification)
- `logger`

---

#### **Service 4: ModelRatingService**
**Arquivo:** `backend/src/services/providers/model-rating.service.ts`  
**Responsabilidade:** Listar modelos em formato flat com rating  
**Linhas Estimadas:** ~120

```typescript
export class ModelRatingService {
  constructor(
    private providerFilter: ProviderFilterService
  ) {}

  /**
   * Retorna todos os modelos configurados com rating
   * - Busca providers configurados
   * - Converte para formato flat
   * - Enriquece com certificações e rating
   */
  async getModelsWithRating(
    userId: string
  ): Promise<ModelWithRating[]>

  /**
   * Converte providers para formato flat
   */
  private flattenProviders(
    providers: Provider[]
  ): FlatModel[]

  /**
   * Enriquece com dados de certificação
   */
  private async enrichWithRating(
    models: FlatModel[]
  ): Promise<ModelWithRating[]>
}
```

**Dependências:**
- `ProviderFilterService`
- `prisma` (modelCertification)
- `logger`

---

#### **Service 5: ProviderFilterService**
**Arquivo:** `backend/src/services/providers/provider-filter.service.ts`  
**Responsabilidade:** Filtrar providers configurados pelo usuário  
**Linhas Estimadas:** ~150

```typescript
export class ProviderFilterService {
  /**
   * Busca providers configurados para o usuário
   * - Busca configurações do usuário
   * - Busca validação AWS
   * - Busca providers ativos
   * - Filtra por configuração
   * - Cria modelos dinâmicos (AWS)
   */
  async getConfiguredProviders(
    userId: string
  ): Promise<Provider[]>

  /**
   * Filtra provider AWS baseado em validação
   */
  private async filterAWSProvider(
    provider: Provider,
    userId: string
  ): Promise<boolean>

  /**
   * Cria modelos dinâmicos para IDs não cadastrados
   */
  private createDynamicModels(
    provider: Provider,
    enabledModelIds: string[]
  ): Model[]
}
```

**Dependências:**
- `prisma` (userSettings, providerCredentialValidation, aIProvider)
- `logger`

---

#### **Utility 1: ModelParser**
**Arquivo:** `backend/src/services/providers/utils/model-parser.ts`  
**Responsabilidade:** Parsing de informações de modelos  
**Linhas Estimadas:** ~60

```typescript
export class ModelParser {
  /**
   * Extrai vendor do apiModelId
   * Ex: "anthropic.claude-sonnet-4" → "anthropic"
   */
  extractVendor(apiModelId: string): string

  /**
   * Extrai versão do apiModelId
   * Ex: "anthropic.claude-sonnet-4-20250514-v1:0" → "4.0"
   */
  extractVersion(apiModelId: string): string | undefined

  /**
   * Normaliza modelId para formato padrão
   */
  normalizeModelId(modelId: string): string
}
```

---

#### **Utility 2: VendorMapper**
**Arquivo:** `backend/src/services/providers/utils/vendor-mapper.ts`  
**Responsabilidade:** Mapeamento de vendors  
**Linhas Estimadas:** ~40

```typescript
export class VendorMapper {
  /**
   * Retorna nome amigável do vendor
   */
  getVendorName(vendor: string): string

  /**
   * Retorna logo path do vendor
   */
  getVendorLogo(vendor: string): string

  /**
   * Retorna slug do vendor
   */
  getVendorSlug(vendor: string): string
}
```

---

### 3.3 Controller Refatorado

**Arquivo:** `backend/src/controllers/providersController.ts`  
**Linhas Estimadas:** ~150 (dentro do limite de 200)

```typescript
// backend/src/controllers/providersController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { jsend } from '../utils/jsend';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import {
  AWSCredentialsService,
  AWSModelsService,
  VendorAggregationService,
  ModelRatingService
} from '../services/providers';

const awsCredentialsService = new AWSCredentialsService();
const awsModelsService = new AWSModelsService(awsCredentialsService);
const vendorAggregationService = new VendorAggregationService();
const modelRatingService = new ModelRatingService();

export const providersController = {
  /**
   * POST /api/providers/bedrock/validate
   * Validação de credenciais AWS Bedrock
   */
  async validateAWS(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      if (!userId) {
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      logger.info('Iniciando validação AWS Bedrock', {
        requestId: req.id,
        userId
      });

      const result = await awsCredentialsService.validateCredentials(
        userId,
        req.body
      );

      logger.info('AWS Bedrock validation success', {
        requestId: req.id,
        userId,
        latencyMs: result.latencyMs
      });

      return res.json(jsend.success({
        status: 'valid',
        message: `Credenciais válidas. ${result.modelsCount} modelos disponíveis.`,
        latencyMs: result.latencyMs,
        modelsCount: result.modelsCount
      }));

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Erro na validação AWS Bedrock', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return res.status(500).json(
        jsend.error('Erro interno na validação AWS', 500)
      );
    }
  },

  /**
   * GET /api/providers/bedrock/available-models
   * Retorna modelos disponíveis na conta AWS
   */
  async getAvailableModels(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de modelos AWS disponíveis', {
        requestId: req.id,
        userId
      });
      
      if (!userId) {
        return res.status(401).json(jsend.fail({ auth: 'Não autorizado' }));
      }

      const models = await awsModelsService.getAvailableModels(userId);
      
      logger.info('Modelos AWS Bedrock obtidos', {
        requestId: req.id,
        userId,
        totalModels: models.length
      });

      return res.json(jsend.success({
        models,
        totalCount: models.length
      }));

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Erro ao buscar modelos AWS Bedrock', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return res.status(500).json(
        jsend.error('Erro ao buscar modelos AWS', 500)
      );
    }
  },

  /**
   * GET /api/providers/by-vendor
   * Retorna modelos agrupados por vendor
   */
  async getByVendor(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de vendors', {
        requestId: req.id,
        userId
      });
      
      const vendors = await vendorAggregationService.getVendorsWithModels(userId);
      
      logger.info('Vendors obtidos com sucesso', {
        requestId: req.id,
        userId,
        totalVendors: vendors.length
      });
      
      return res.status(200).json(jsend.success({ vendors }));
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Erro ao buscar vendors', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return res.status(500).json(
        jsend.error('Erro ao buscar vendors', 500)
      );
    }
  },

  /**
   * GET /api/providers/models
   * Retorna modelos com rating em formato flat
   */
  async getModelsWithRating(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      logger.info('Iniciando busca de modelos com rating', {
        requestId: req.id,
        userId
      });
      
      const models = await modelRatingService.getModelsWithRating(userId);
      
      logger.info('Modelos com rating obtidos', {
        requestId: req.id,
        userId,
        totalModels: models.length
      });
      
      return res.status(200).json(jsend.success({ data: models }));
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Erro ao buscar modelos com rating', {
        requestId: req.id,
        userId: req.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return res.status(500).json(
        jsend.error('Erro ao buscar modelos', 500)
      );
    }
  }
};
```

---

## 📁 4. Estrutura de Diretórios Detalhada

```
backend/src/
│
├── controllers/
│   └── providersController.ts              (~150 linhas) ✅
│
├── services/
│   └── providers/
│       ├── index.ts                         (~30 linhas)
│       │   # Exports públicos de todos os services
│       │
│       ├── aws-credentials.service.ts       (~150 linhas)
│       │   # Validação e persistência de credenciais AWS
│       │
│       ├── aws-models.service.ts            (~180 linhas)
│       │   # Busca e enriquecimento de modelos AWS
│       │
│       ├── vendor-aggregation.service.ts    (~200 linhas)
│       │   # Agrupamento de modelos por vendor
│       │
│       ├── model-rating.service.ts          (~120 linhas)
│       │   # Listagem de modelos com rating
│       │
│       ├── provider-filter.service.ts       (~150 linhas)
│       │   # Filtragem de providers configurados
│       │
│       └── utils/
│           ├── model-parser.ts              (~60 linhas)
│           │   # Parsing de informações de modelos
│           │
│           └── vendor-mapper.ts             (~40 linhas)
│               # Mapeamento de vendors
│
└── types/
    └── providers/
        ├── index.ts                         (~20 linhas)
        │   # Re-exports de todos os tipos
        │
        ├── aws-validation.types.ts          (~50 linhas)
        │   # Tipos para validação AWS
        │
        ├── model-enrichment.types.ts        (~60 linhas)
        │   # Tipos para enriquecimento de modelos
        │
        └── vendor-group.types.ts            (já existe)
            # Tipos para agrupamento por vendor
```

### 4.1 Arquivo de Index (Barrel Export)

**`backend/src/services/providers/index.ts`**

```typescript
// backend/src/services/providers/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

export { AWSCredentialsService } from './aws-credentials.service';
export { AWSModelsService } from './aws-models.service';
export { VendorAggregationService } from './vendor-aggregation.service';
export { ModelRatingService } from './model-rating.service';
export { ProviderFilterService } from './provider-filter.service';

// Utils
export { ModelParser } from './utils/model-parser';
export { VendorMapper } from './utils/vendor-mapper';

// Types
export * from '../../types/providers';
```

---

## 🔄 5. Ordem de Implementação

### Fase 1: Preparação (Sem Breaking Changes)
**Objetivo:** Criar infraestrutura sem modificar controller existente

#### **Passo 1.1: Criar Estrutura de Diretórios**
```bash
mkdir -p backend/src/services/providers/utils
mkdir -p backend/src/types/providers
```

#### **Passo 1.2: Criar Tipos**
- ✅ Criar `aws-validation.types.ts`
- ✅ Criar `model-enrichment.types.ts`
- ✅ Criar `index.ts` (barrel export)

**Validação:** Compilação TypeScript sem erros

---

#### **Passo 1.3: Criar Utilities (Funções Puras)**
- ✅ Criar `model-parser.ts`
  - Migrar `extractVendor()`
  - Migrar `extractVersion()`
  - Adicionar testes unitários
- ✅ Criar `vendor-mapper.ts`
  - Migrar `getVendorName()`
  - Adicionar testes unitários

**Validação:** Testes unitários passando

---

### Fase 2: Criação de Services (Bottom-Up)
**Objetivo:** Criar services independentes primeiro

#### **Passo 2.1: ProviderFilterService**
- ✅ Criar `provider-filter.service.ts`
- ✅ Implementar `getConfiguredProviders()`
- ✅ Implementar `filterAWSProvider()`
- ✅ Implementar `createDynamicModels()`
- ✅ Adicionar testes unitários

**Validação:** Testes unitários passando

---

#### **Passo 2.2: AWSCredentialsService**
- ✅ Criar `aws-credentials.service.ts`
- ✅ Implementar `validateCredentials()`
- ✅ Implementar `getDecryptedCredentials()`
- ✅ Implementar `saveCredentials()`
- ✅ Implementar `recordValidation()`
- ✅ Adicionar testes unitários

**Validação:** Testes unitários passando

---

#### **Passo 2.3: AWSModelsService**
- ✅ Criar `aws-models.service.ts`
- ✅ Implementar `getAvailableModels()`
- ✅ Implementar `enrichModels()`
- ✅ Implementar `filterChatModels()`
- ✅ Adicionar testes unitários

**Validação:** Testes unitários passando

---

#### **Passo 2.4: VendorAggregationService**
- ✅ Criar `vendor-aggregation.service.ts`
- ✅ Implementar `getVendorsWithModels()`
- ✅ Implementar `groupModelsByVendor()`
- ✅ Implementar `enrichWithCertifications()`
- ✅ Adicionar testes unitários

**Validação:** Testes unitários passando

---

#### **Passo 2.5: ModelRatingService**
- ✅ Criar `model-rating.service.ts`
- ✅ Implementar `getModelsWithRating()`
- ✅ Implementar `flattenProviders()`
- ✅ Implementar `enrichWithRating()`
- ✅ Adicionar testes unitários

**Validação:** Testes unitários passando

---

### Fase 3: Refatoração do Controller
**Objetivo:** Substituir lógica por chamadas aos services

#### **Passo 3.1: Criar Backup**
```bash
cp backend/src/controllers/providersController.ts \
   backend/src/controllers/providersController.ts.backup
```

#### **Passo 3.2: Refatorar validateAWS()**
- ✅ Substituir lógica por `awsCredentialsService.validateCredentials()`
- ✅ Manter tratamento de erros
- ✅ Manter logging
- ✅ Validar com testes de integração

**Validação:** 
- ✅ Rota `POST /api/providers/bedrock/validate` funcionando
- ✅ Testes de integração passando

---

#### **Passo 3.3: Refatorar getAvailableModels()**
- ✅ Substituir lógica por `awsModelsService.getAvailableModels()`
- ✅ Manter tratamento de erros
- ✅ Manter logging
- ✅ Validar com testes de integração

**Validação:**
- ✅ Rota `GET /api/providers/bedrock/available-models` funcionando
- ✅ Testes de integração passando

---

#### **Passo 3.4: Refatorar getByVendor()**
- ✅ Substituir lógica por `vendorAggregationService.getVendorsWithModels()`
- ✅ Manter tratamento de erros
- ✅ Manter logging
- ✅ Validar com testes de integração

**Validação:**
- ✅ Rota `GET /api/providers/by-vendor` funcionando
- ✅ Testes de integração passando

---

#### **Passo 3.5: Refatorar getModelsWithRating()**
- ✅ Substituir lógica por `modelRatingService.getModelsWithRating()`
- ✅ Manter tratamento de erros
- ✅ Manter logging
- ✅ Validar com testes de integração

**Validação:**
- ✅ Rota `GET /api/providers/models` funcionando
- ✅ Testes de integração passando

---

#### **Passo 3.6: Remover Funções Auxiliares**
- ✅ Remover `extractVendor()` (migrada para ModelParser)
- ✅ Remover `getVendorName()` (migrada para VendorMapper)
- ✅ Remover `extractVersion()` (migrada para ModelParser)
- ✅ Remover `getCertificationForModel()` (migrada para services)

**Validação:**
- ✅ Controller com ≤200 linhas
- ✅ Todas as rotas funcionando

---

### Fase 4: Validação Final
**Objetivo:** Garantir zero breaking changes

#### **Passo 4.1: Testes End-to-End**
- ✅ Testar todas as rotas via Postman/Insomnia
- ✅ Validar respostas JSend
- ✅ Validar códigos de status HTTP
- ✅ Validar logs estruturados

#### **Passo 4.2: Análise de Tamanho**
```bash
cd backend
npx tsx scripts/analysis/analyze-file-sizes.ts
```

**Critérios de Sucesso:**
- ✅ `providersController.ts` ≤200 linhas
- ✅ Todos os services ≤250 linhas
- ✅ Utilities ≤150 linhas

#### **Passo 4.3: Code Review**
- ✅ Verificar conformidade com STANDARDS.md
- ✅ Verificar JSend em todas as respostas
- ✅ Verificar logging estruturado
- ✅ Verificar tratamento de erros
- ✅ Verificar rate limiting preservado

#### **Passo 4.4: Documentação**
- ✅ Atualizar comentários JSDoc
- ✅ Documentar novos services
- ✅ Atualizar README se necessário

---

## ⚠️ 6. Riscos Identificados e Mitigações

### Risco 1: Breaking Changes nas Rotas
**Probabilidade:** Média  
**Impacto:** Alto  
**Descrição:** Alterações na lógica podem quebrar contratos de API

**Mitigação:**
- ✅ Criar testes de integração ANTES da refatoração
- ✅ Manter assinaturas de resposta JSend idênticas
- ✅ Validar todas as rotas após cada fase
- ✅ Manter backup do controller original
- ✅ Implementar feature flag se necessário

**Plano de Rollback:**
```bash
# Se algo quebrar, reverter para backup
cp backend/src/controllers/providersController.ts.backup \
   backend/src/controllers/providersController.ts
```

---

### Risco 2: Perda de Contexto de Logging
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Descrição:** Logs podem perder `requestId` ao mover para services

**Mitigação:**
- ✅ Passar `requestId` como parâmetro para todos os services
- ✅ Incluir `requestId` em todos os logs dos services
- ✅ Validar correlação de logs após refatoração
- ✅ Usar AsyncLocalStorage se necessário (futuro)

**Exemplo:**
```typescript
// ✅ CORRETO - Passar requestId
await awsCredentialsService.validateCredentials(
  userId,
  config,
  { requestId: req.id } // Contexto de logging
);
```

---

### Risco 3: Duplicação de Lógica de Filtragem
**Probabilidade:** Média  
**Impacto:** Médio  
**Descrição:** Lógica de filtragem de providers AWS está duplicada

**Mitigação:**
- ✅ Centralizar em `ProviderFilterService`
- ✅ Reutilizar em todos os services que precisam
- ✅ Adicionar testes unitários para garantir consistência
- ✅ Documentar regras de filtragem

**Localização da Duplicação:**
- `getByVendor()` - linhas 407-456
- `getModelsWithRating()` - linhas 588-623
- `/configured` route - linhas 85-136

---

### Risco 4: Performance de Queries ao Banco
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Descrição:** Múltiplas chamadas ao banco podem impactar performance

**Mitigação:**
- ✅ Manter queries otimizadas (includes, selects)
- ✅ Não adicionar N+1 queries
- ✅ Considerar caching para dados estáticos (providers)
- ✅ Monitorar tempo de resposta das rotas

**Queries Críticas:**
```typescript
// ✅ MANTER - Query otimizada com include
const providers = await prisma.aIProvider.findMany({
  where: { isActive: true },
  include: { 
    models: { where: { isActive: true } } 
  }
});
```

---

### Risco 5: Inconsistência de Modelos Dinâmicos
**Probabilidade:** Média  
**Impacto:** Médio  
**Descrição:** Criação de modelos dinâmicos pode gerar inconsistências

**Mitigação:**
- ✅ Centralizar lógica em `ProviderFilterService.createDynamicModels()`
- ✅ Validar IDs contra ModelRegistry
- ✅ Adicionar logs de warning para modelos não cadastrados
- ✅ Documentar comportamento esperado

**Exemplo de Log:**
```typescript
logger.warn('Modelo dinâmico criado (não está no banco)', {
  modelId: apiModelId,
  userId,
  reason: 'Habilitado pelo usuário mas não cadastrado'
});
```

---

### Risco 6: Tratamento de Erros AWS
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Descrição:** Erros específicos da AWS podem não ser tratados corretamente

**Mitigação:**
- ✅ Manter mapeamento de erros AWS no service
- ✅ Retornar mensagens amigáveis
- ✅ Logar erros completos para debug
- ✅ Adicionar testes para cenários de erro

**Erros AWS Mapeados:**
- `UnrecognizedClientException` → "Credenciais AWS inválidas"
- `AccessDeniedException` → "Sem permissão para acessar Bedrock"
- `ThrottlingException` → "Limite de requisições atingido"

---

### Risco 7: Dependências Circulares
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Descrição:** Services podem criar dependências circulares

**Mitigação:**
- ✅ Seguir arquitetura bottom-up (utilities → services → controller)
- ✅ Evitar imports entre services do mesmo nível
- ✅ Usar injeção de dependências via constructor
- ✅ Validar com TypeScript (erro de compilação)

**Hierarquia de Dependências:**
```
Controller
  ↓
Services (mesmo nível, não dependem entre si)
  ↓
ProviderFilterService (compartilhado)
  ↓
Utilities (funções puras)
```

---

## 📊 7. Métricas de Sucesso

### 7.1 Métricas de Código

| Métrica | Antes | Meta | Validação |
|---------|-------|------|-----------|
| **Linhas do Controller** | 755 | ≤200 | ✅ Análise automática |
| **Linhas por Service** | N/A | ≤250 | ✅ Análise automática |
| **Complexidade Ciclomática** | Alta | Baixa | ⚠️ Manual |
| **Cobertura de Testes** | 0% | ≥80% | ✅ Jest coverage |
| **Duplicação de Código** | Alta | Baixa | ⚠️ Manual |

### 7.2 Métricas de Qualidade

| Métrica | Critério de Sucesso |
|---------|---------------------|
| **Zero Breaking Changes** | Todas as rotas funcionando identicamente |
| **JSend Compliance** | 100% das respostas no formato JSend |
| **Logging Estruturado** | 100% dos logs com `requestId` e contexto |
| **Rate Limiting** | Preservado em todas as rotas |
| **Validação Zod** | Preservada em todas as rotas POST |

### 7.3 Métricas de Performance

| Métrica | Antes | Meta | Validação |
|---------|-------|------|-----------|
| **Tempo de Resposta** | Baseline | ≤+10% | ✅ Testes de carga |
| **Queries ao Banco** | Baseline | Sem aumento | ✅ Prisma logs |
| **Uso de Memória** | Baseline | ≤+5% | ⚠️ Profiling |

---

## 🧪 8. Estratégia de Testes

### 8.1 Testes Unitários (Obrigatórios)

**Utilities:**
- ✅ `ModelParser.extractVendor()` - 5 casos
- ✅ `ModelParser.extractVersion()` - 8 casos
- ✅ `VendorMapper.getVendorName()` - 6 casos

**Services:**
- ✅ `AWSCredentialsService.validateCredentials()` - 10 casos
- ✅ `AWSModelsService.getAvailableModels()` - 8 casos
- ✅ `VendorAggregationService.getVendorsWithModels()` - 12 casos
- ✅ `ModelRatingService.getModelsWithRating()` - 6 casos
- ✅ `ProviderFilterService.getConfiguredProviders()` - 10 casos

**Total:** ~65 testes unitários

### 8.2 Testes de Integração (Obrigatórios)

**Rotas:**
- ✅ `POST /api/providers/bedrock/validate` - 6 cenários
- ✅ `GET /api/providers/bedrock/available-models` - 4 cenários
- ✅ `GET /api/providers/by-vendor` - 5 cenários
- ✅ `GET /api/providers/models` - 4 cenários

**Cenários de Erro:**
- ✅ Credenciais inválidas
- ✅ Usuário não autorizado
- ✅ Rate limiting
- ✅ Validação Zod
- ✅ Erros AWS específicos

**Total:** ~25 testes de integração

### 8.3 Testes de Regressão (Recomendados)

**Comparação Antes/Depois:**
- ✅ Capturar respostas das rotas ANTES da refatoração
- ✅ Validar respostas DEPOIS são idênticas (diff JSON)
- ✅ Validar tempos de resposta similares
- ✅ Validar logs estruturados mantidos

**Ferramenta:** Script de snapshot testing

---

## 📝 9. Checklist de Implementação

### Fase 1: Preparação
- [ ] Criar estrutura de diretórios
- [ ] Criar tipos em `types/providers/`
- [ ] Criar `ModelParser` utility
- [ ] Criar `VendorMapper` utility
- [ ] Adicionar testes unitários para utilities
- [ ] Validar compilação TypeScript

### Fase 2: Services
- [ ] Criar `ProviderFilterService`
- [ ] Criar `AWSCredentialsService`
- [ ] Criar `AWSModelsService`
- [ ] Criar `VendorAggregationService`
- [ ] Criar `ModelRatingService`
- [ ] Adicionar testes unitários para todos os services
- [ ] Validar testes passando

### Fase 3: Refatoração
- [ ] Criar backup do controller
- [ ] Refatorar `validateAWS()`
- [ ] Refatorar `getAvailableModels()`
- [ ] Refatorar `getByVendor()`
- [ ] Refatorar `getModelsWithRating()`
- [ ] Remover funções auxiliares
- [ ] Validar controller ≤200 linhas

### Fase 4: Validação
- [ ] Executar testes de integração
- [ ] Testar todas as rotas manualmente
- [ ] Validar respostas JSend
- [ ] Validar logs estruturados
- [ ] Executar análise de tamanho
- [ ] Code review
- [ ] Atualizar documentação

---

## 🎯 10. Próximos Passos (Pós-Refatoração)

### 10.1 Melhorias Futuras

1. **Caching de Providers**
   - Implementar cache Redis para lista de providers
   - TTL: 5 minutos
   - Invalidar ao salvar configurações

2. **AsyncLocalStorage para RequestId**
   - Eliminar necessidade de passar `requestId` manualmente
   - Contexto automático em todos os logs

3. **Testes de Performance**
   - Benchmark antes/depois
   - Identificar gargalos
   - Otimizar queries se necessário

4. **Documentação OpenAPI**
   - Adicionar schemas para todas as rotas
   - Gerar documentação automática
   - Incluir exemplos de respostas

### 10.2 Refatorações Relacionadas

**Arquivos Similares que Precisam de Refatoração:**
1. `aiController.ts` - 400+ linhas
2. `auditController.ts` - 300+ linhas
3. `analyticsController.ts` - 250+ linhas

**Padrão a Seguir:**
- Usar mesma estrutura de services
- Reutilizar utilities quando possível
- Manter consistência de nomenclatura

---

## 📚 11. Referências

### Documentação do Projeto
- [STANDARDS.md Seção 12](../docs/STANDARDS.md:535) - Padronização de Controllers
- [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) - Tamanho de Arquivos
- [STANDARDS.md Seção 13](../docs/STANDARDS.md:660) - Sistema de Logging

### Arquivos Relacionados
- [`backend/src/controllers/providersController.ts`](../backend/src/controllers/providersController.ts) - Arquivo original
- [`backend/src/routes/providers.ts`](../backend/src/routes/providers.ts) - Rotas
- [`backend/src/types/vendors.ts`](../backend/src/types/vendors.ts) - Tipos existentes
- [`backend/src/services/ai/registry/model-registry.ts`](../backend/src/services/ai/registry/model-registry.ts) - Registry

### Padrões Aplicados
- **Single Responsibility Principle (SRP)**
- **Dependency Injection**
- **Service Layer Pattern**
- **Repository Pattern** (via Prisma)
- **JSend API Response Standard**

---

## ✅ 12. Critérios de Aceitação

### Obrigatórios (Bloqueantes)
- ✅ Controller com ≤200 linhas
- ✅ Todos os services com ≤250 linhas
- ✅ Zero breaking changes nas rotas
- ✅ Todas as rotas retornando JSend
- ✅ Rate limiting preservado
- ✅ Validação Zod preservada
- ✅ Logging estruturado mantido
- ✅ Testes de integração passando
- ✅ Compilação TypeScript sem erros
- ✅ ESLint sem erros

### Recomendados (Não Bloqueantes)
- ⚠️ Cobertura de testes ≥80%
- ⚠️ Performance similar ou melhor
- ⚠️ Documentação atualizada
- ⚠️ Code review aprovado

---

## 📞 13. Suporte e Dúvidas

### Contatos
- **Arquiteto:** Consultar STANDARDS.md
- **Code Review:** Seguir checklist da Seção 9
- **Testes:** Seguir estratégia da Seção 8

### Recursos
- **Documentação:** `docs/STANDARDS.md`
- **Exemplos:** Outros controllers já refatorados
- **Testes:** `backend/src/__tests__/`

---

## 📅 14. Timeline Estimado

| Fase | Duração Estimada | Dependências |
|------|------------------|--------------|
| **Fase 1: Preparação** | 2-3 horas | Nenhuma |
| **Fase 2: Services** | 6-8 horas | Fase 1 completa |
| **Fase 3: Refatoração** | 4-5 horas | Fase 2 completa |
| **Fase 4: Validação** | 2-3 horas | Fase 3 completa |
| **TOTAL** | 14-19 horas | - |

**Nota:** Estimativas assumem desenvolvedor familiarizado com o projeto.

---

## 🏁 Conclusão

Este plano fornece uma estratégia detalhada e segura para modularizar o [`providersController.ts`](../backend/src/controllers/providersController.ts), reduzindo de **755 linhas** para **≤200 linhas** conforme [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199).

**Principais Benefícios:**
- ✅ **Manutenibilidade:** Código mais fácil de entender e modificar
- ✅ **Testabilidade:** Services isolados facilitam testes unitários
- ✅ **Reusabilidade:** Lógica pode ser reutilizada em outros controllers
- ✅ **Conformidade:** Atende padrões do projeto rigorosamente
- ✅ **Zero Breaking Changes:** Implementação segura e incremental

**Próximo Passo:** Executar Fase 1 (Preparação) em modo Code.