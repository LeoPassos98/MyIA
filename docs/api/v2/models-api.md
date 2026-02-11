# 📡 API v2 - Models, Deployments & Providers

> **Versão:** 2.0  
> **Base URL:** `http://localhost:3001/api/v2`  
> **Formato:** JSON  
> **Padrão de Resposta:** JSend

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Padrão de Resposta (JSend)](#padrão-de-resposta-jsend)
- [Endpoints](#endpoints)
  - [Models](#models-apiv2models)
  - [Deployments](#deployments-apiv2deployments)
  - [Providers](#providers-apiv2providers)
- [Schemas de Dados](#schemas-de-dados)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

A API v2 fornece endpoints para gerenciamento de modelos de IA, seus deployments em diferentes providers e informações dos providers disponíveis.

### Arquitetura de Dados

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   BaseModel     │────<│  ModelDeployment │>────│   Provider  │
│ (Claude, GPT)   │     │ (instância real) │     │ (Bedrock)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

- **BaseModel**: Modelo base de IA (ex: Claude 3.5 Sonnet, GPT-4)
- **ModelDeployment**: Instância do modelo em um provider específico
- **Provider**: Provedor de infraestrutura (ex: AWS Bedrock)

---

## Autenticação

Endpoints de **leitura** (GET) são públicos. Endpoints de **escrita** (POST, PUT, DELETE) requerem autenticação via JWT Bearer Token.

### Header de Autenticação

```http
Authorization: Bearer <seu-token-jwt>
```

### Obtendo Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "sua-senha"}'
```

---

## Padrão de Resposta (JSend)

Todas as respostas seguem o padrão **JSend**:

### Sucesso (2xx)

```json
{
  "status": "success",
  "data": {
    // dados da resposta
  }
}
```

### Falha de Validação (4xx)

```json
{
  "status": "fail",
  "data": {
    "campo": "mensagem de erro"
  }
}
```

### Erro de Servidor (5xx)

```json
{
  "status": "error",
  "message": "Descrição do erro",
  "code": 500
}
```

---

## Endpoints

### Models (`/api/v2/models`)

#### GET /api/v2/models

Lista todos os modelos base com filtros e paginação.

**Autenticação:** ❌ Não requerida

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |
| `vendor` | string | - | Filtrar por vendor (ex: "Anthropic") |
| `family` | string | - | Filtrar por família (ex: "Claude") |
| `deprecated` | boolean | - | Filtrar por status deprecated |
| `search` | string | - | Busca em nome, vendor, família |
| `orderBy` | string | "name" | Campo de ordenação: `name`, `vendor`, `createdAt`, `updatedAt` |
| `order` | string | "asc" | Direção: `asc`, `desc` |
| `includeDeployments` | boolean | false | Incluir deployments relacionados |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "models": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Claude 3.5 Sonnet",
        "vendor": "Anthropic",
        "family": "Claude",
        "version": "3.5",
        "capabilities": {
          "streaming": true,
          "vision": true,
          "functionCalling": true,
          "maxContextWindow": 200000,
          "maxOutputTokens": 8192
        },
        "defaultParams": {
          "temperature": 1.0,
          "topP": 0.999,
          "maxTokens": 4096
        },
        "description": "Most intelligent model from Anthropic",
        "releaseDate": "2024-10-22T00:00:00.000Z",
        "deprecated": false,
        "replacedBy": null,
        "createdAt": "2026-02-01T10:00:00.000Z",
        "updatedAt": "2026-02-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/models?vendor=Anthropic&limit=10"
```

---

#### GET /api/v2/models/capabilities

Lista modelos por capabilities específicas.

**Autenticação:** ❌ Não requerida

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `streaming` | boolean | - | Suporte a streaming |
| `vision` | boolean | - | Suporte a visão |
| `functionCalling` | boolean | - | Suporte a function calling |
| `minContextWindow` | integer | - | Janela de contexto mínima |
| `minOutputTokens` | integer | - | Tokens de output mínimos |
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "models": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Claude 3.5 Sonnet",
        "vendor": "Anthropic",
        "capabilities": {
          "streaming": true,
          "vision": true,
          "functionCalling": true,
          "maxContextWindow": 200000,
          "maxOutputTokens": 8192
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/models/capabilities?vision=true&streaming=true"
```

---

#### GET /api/v2/models/provider/:providerId

Lista modelos disponíveis em um provider específico.

**Autenticação:** ❌ Não requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `providerId` | UUID | ID do provider |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |
| `isActive` | boolean | - | Filtrar por deployments ativos |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "models": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Claude 3.5 Sonnet",
        "vendor": "Anthropic",
        "family": "Claude"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/models/provider/550e8400-e29b-41d4-a716-446655440001"
```

---

#### GET /api/v2/models/:id

Obtém um modelo por ID.

**Autenticação:** ❌ Não requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do modelo |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `includeDeployments` | boolean | false | Incluir deployments relacionados |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Claude 3.5 Sonnet",
    "vendor": "Anthropic",
    "family": "Claude",
    "version": "3.5",
    "capabilities": {
      "streaming": true,
      "vision": true,
      "functionCalling": true,
      "maxContextWindow": 200000,
      "maxOutputTokens": 8192
    },
    "defaultParams": {
      "temperature": 1.0,
      "topP": 0.999,
      "maxTokens": 4096
    },
    "description": "Most intelligent model from Anthropic",
    "releaseDate": "2024-10-22T00:00:00.000Z",
    "deprecated": false,
    "replacedBy": null,
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z",
    "deployments": []
  }
}
```

**Response (404 Not Found):**

```json
{
  "status": "fail",
  "data": {
    "id": "Model not found"
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/models/550e8400-e29b-41d4-a716-446655440000?includeDeployments=true"
```

---

#### POST /api/v2/models

Cria um novo modelo base.

**Autenticação:** ✅ Requerida

**Request Body:**

```json
{
  "name": "Claude 4",
  "vendor": "Anthropic",
  "family": "Claude",
  "version": "4",
  "capabilities": {
    "streaming": true,
    "vision": true,
    "functionCalling": true,
    "maxContextWindow": 500000,
    "maxOutputTokens": 16384
  },
  "defaultParams": {
    "temperature": 1.0,
    "topP": 0.999,
    "maxTokens": 8192
  },
  "description": "Next generation Claude model",
  "releaseDate": "2026-03-01T00:00:00.000Z",
  "deprecated": false
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome único do modelo (1-255 chars) |
| `vendor` | string | ✅ | Nome do vendor (1-100 chars) |
| `family` | string | ❌ | Família do modelo (máx 100 chars) |
| `version` | string | ❌ | Versão do modelo (máx 50 chars) |
| `capabilities` | object | ✅ | Capabilities do modelo |
| `capabilities.streaming` | boolean | ❌ | Suporte a streaming |
| `capabilities.vision` | boolean | ❌ | Suporte a visão |
| `capabilities.functionCalling` | boolean | ❌ | Suporte a function calling |
| `capabilities.maxContextWindow` | integer | ❌ | Janela de contexto máxima |
| `capabilities.maxOutputTokens` | integer | ❌ | Tokens de output máximos |
| `defaultParams` | object | ❌ | Parâmetros padrão |
| `defaultParams.temperature` | number | ❌ | Temperatura (0-2) |
| `defaultParams.topP` | number | ❌ | Top P (0-1) |
| `defaultParams.maxTokens` | integer | ❌ | Max tokens padrão |
| `description` | string | ❌ | Descrição (máx 2000 chars) |
| `releaseDate` | string | ❌ | Data de lançamento (ISO 8601) |
| `deprecated` | boolean | ❌ | Se está deprecated |
| `replacedBy` | string | ❌ | Nome do modelo substituto |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Claude 4",
    "vendor": "Anthropic",
    "family": "Claude",
    "version": "4",
    "capabilities": {
      "streaming": true,
      "vision": true,
      "functionCalling": true,
      "maxContextWindow": 500000,
      "maxOutputTokens": 16384
    },
    "createdAt": "2026-02-10T03:00:00.000Z",
    "updatedAt": "2026-02-10T03:00:00.000Z"
  }
}
```

**Response (409 Conflict):**

```json
{
  "status": "fail",
  "data": {
    "name": "BaseModel with name \"Claude 4\" already exists"
  }
}
```

**Exemplo cURL:**

```bash
curl -X POST "http://localhost:3001/api/v2/models" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Claude 4",
    "vendor": "Anthropic",
    "family": "Claude",
    "capabilities": {
      "streaming": true,
      "vision": true
    }
  }'
```

---

#### PUT /api/v2/models/:id

Atualiza um modelo existente.

**Autenticação:** ✅ Requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do modelo |

**Request Body:**

```json
{
  "deprecated": true,
  "replacedBy": "Claude 4.1"
}
```

**Campos:** Todos os campos de criação são aceitos (todos opcionais).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Claude 3.5 Sonnet",
    "deprecated": true,
    "replacedBy": "Claude 4.1",
    "updatedAt": "2026-02-10T03:30:00.000Z"
  }
}
```

**Response (404 Not Found):**

```json
{
  "status": "fail",
  "data": {
    "id": "Model not found"
  }
}
```

**Exemplo cURL:**

```bash
curl -X PUT "http://localhost:3001/api/v2/models/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"deprecated": true, "replacedBy": "Claude 4.1"}'
```

---

#### DELETE /api/v2/models/:id

Remove um modelo (soft delete por padrão).

**Autenticação:** ✅ Requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do modelo |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `hard` | boolean | false | Se true, deleta permanentemente |
| `replacedBy` | string | - | Nome do modelo substituto (soft delete) |

**Response - Soft Delete (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Claude 3.5 Sonnet",
    "deprecated": true,
    "replacedBy": "Claude 4"
  }
}
```

**Response - Hard Delete (200 OK):**

```json
{
  "status": "success",
  "data": {
    "deleted": true,
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Exemplo cURL:**

```bash
# Soft delete
curl -X DELETE "http://localhost:3001/api/v2/models/550e8400-e29b-41d4-a716-446655440000?replacedBy=Claude%204" \
  -H "Authorization: Bearer <token>"

# Hard delete
curl -X DELETE "http://localhost:3001/api/v2/models/550e8400-e29b-41d4-a716-446655440000?hard=true" \
  -H "Authorization: Bearer <token>"
```

---

### Deployments (`/api/v2/deployments`)

#### GET /api/v2/deployments

Lista todos os deployments com filtros e paginação.

**Autenticação:** ❌ Não requerida

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |
| `baseModelId` | UUID | - | Filtrar por modelo base |
| `providerId` | UUID | - | Filtrar por provider |
| `inferenceType` | enum | - | Tipo: `ON_DEMAND`, `INFERENCE_PROFILE`, `PROVISIONED` |
| `isActive` | boolean | - | Filtrar por status ativo |
| `search` | string | - | Busca em deploymentId, modelo, provider |
| `orderBy` | string | "deploymentId" | Campo: `deploymentId`, `inferenceType`, `createdAt`, `updatedAt`, `costPer1MInput`, `costPer1MOutput` |
| `order` | string | "asc" | Direção: `asc`, `desc` |
| `includeBaseModel` | boolean | false | Incluir modelo base |
| `includeProvider` | boolean | false | Incluir provider |
| `includeCertifications` | boolean | false | Incluir certificações |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "deployments": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "baseModelId": "550e8400-e29b-41d4-a716-446655440000",
        "providerId": "770e8400-e29b-41d4-a716-446655440000",
        "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "inferenceType": "ON_DEMAND",
        "providerConfig": {
          "region": "us-east-1"
        },
        "costPer1MInput": 3.0,
        "costPer1MOutput": 15.0,
        "costPerHour": null,
        "customParams": null,
        "capabilitiesVerifiedAt": "2026-02-01T10:00:00.000Z",
        "capabilitiesSource": "auto_test",
        "isActive": true,
        "createdAt": "2026-02-01T10:00:00.000Z",
        "updatedAt": "2026-02-01T10:00:00.000Z",
        "baseModel": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Claude 3.5 Sonnet",
          "vendor": "Anthropic"
        },
        "provider": {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "name": "AWS Bedrock",
          "slug": "bedrock"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "totalPages": 6
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/deployments?isActive=true&includeBaseModel=true&includeProvider=true"
```

---

#### GET /api/v2/deployments/active

Lista apenas deployments ativos.

**Autenticação:** ❌ Não requerida

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "deployments": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "isActive": true,
        "baseModel": {
          "name": "Claude 3.5 Sonnet"
        },
        "provider": {
          "name": "AWS Bedrock"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/deployments/active"
```

---

#### GET /api/v2/deployments/model/:modelId

Lista deployments de um modelo específico.

**Autenticação:** ❌ Não requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `modelId` | UUID | ID do modelo base |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |
| `isActive` | boolean | - | Filtrar por status ativo |
| `includeProvider` | boolean | false | Incluir provider |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "deployments": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "inferenceType": "ON_DEMAND",
        "costPer1MInput": 3.0,
        "costPer1MOutput": 15.0,
        "isActive": true,
        "provider": {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "name": "AWS Bedrock"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/deployments/model/550e8400-e29b-41d4-a716-446655440000?includeProvider=true"
```

---

#### GET /api/v2/deployments/:id

Obtém um deployment por ID.

**Autenticação:** ❌ Não requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do deployment |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `includeBaseModel` | boolean | false | Incluir modelo base |
| `includeProvider` | boolean | false | Incluir provider |
| `includeCertifications` | boolean | false | Incluir certificações |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "baseModelId": "550e8400-e29b-41d4-a716-446655440000",
    "providerId": "770e8400-e29b-41d4-a716-446655440000",
    "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "inferenceType": "ON_DEMAND",
    "providerConfig": {
      "region": "us-east-1"
    },
    "costPer1MInput": 3.0,
    "costPer1MOutput": 15.0,
    "costPerHour": null,
    "customParams": null,
    "capabilitiesVerifiedAt": "2026-02-01T10:00:00.000Z",
    "capabilitiesSource": "auto_test",
    "isActive": true,
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z"
  }
}
```

**Response (404 Not Found):**

```json
{
  "status": "fail",
  "data": {
    "id": "Deployment not found"
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/deployments/660e8400-e29b-41d4-a716-446655440000?includeBaseModel=true"
```

---

#### POST /api/v2/deployments

Cria um novo deployment.

**Autenticação:** ✅ Requerida

**Request Body:**

```json
{
  "baseModelId": "550e8400-e29b-41d4-a716-446655440000",
  "providerId": "770e8400-e29b-41d4-a716-446655440000",
  "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "inferenceType": "ON_DEMAND",
  "providerConfig": {
    "region": "us-east-1",
    "arn": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
  },
  "costPer1MInput": 3.0,
  "costPer1MOutput": 15.0,
  "costPerHour": null,
  "customParams": {
    "temperature": 1.0,
    "maxTokens": 4096
  },
  "isActive": true
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `baseModelId` | UUID | ✅ | ID do modelo base |
| `providerId` | UUID | ✅ | ID do provider |
| `deploymentId` | string | ✅ | ID único no provider (1-500 chars) |
| `inferenceType` | enum | ❌ | `ON_DEMAND`, `INFERENCE_PROFILE`, `PROVISIONED` (padrão: ON_DEMAND) |
| `providerConfig` | object | ❌ | Configuração específica do provider |
| `providerConfig.arn` | string | ❌ | ARN do recurso AWS |
| `providerConfig.profileFormat` | string | ❌ | Formato do profile |
| `providerConfig.region` | string | ❌ | Região AWS |
| `costPer1MInput` | number | ✅ | Custo por 1M tokens de input (USD) |
| `costPer1MOutput` | number | ✅ | Custo por 1M tokens de output (USD) |
| `costPerHour` | number | ❌ | Custo por hora (provisioned) |
| `customParams` | object | ❌ | Parâmetros customizados |
| `customParams.temperature` | number | ❌ | Temperatura (0-2) |
| `customParams.topP` | number | ❌ | Top P (0-1) |
| `customParams.maxTokens` | integer | ❌ | Max tokens |
| `isActive` | boolean | ❌ | Se está ativo (padrão: true) |

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "baseModelId": "550e8400-e29b-41d4-a716-446655440000",
    "providerId": "770e8400-e29b-41d4-a716-446655440000",
    "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "inferenceType": "ON_DEMAND",
    "costPer1MInput": 3.0,
    "costPer1MOutput": 15.0,
    "isActive": true,
    "createdAt": "2026-02-10T03:00:00.000Z"
  }
}
```

**Response (409 Conflict):**

```json
{
  "status": "fail",
  "data": {
    "deploymentId": "Deployment with providerId \"...\" and deploymentId \"...\" already exists"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "status": "fail",
  "data": {
    "reference": "BaseModel or Provider does not exist"
  }
}
```

**Exemplo cURL:**

```bash
curl -X POST "http://localhost:3001/api/v2/deployments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "baseModelId": "550e8400-e29b-41d4-a716-446655440000",
    "providerId": "770e8400-e29b-41d4-a716-446655440000",
    "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "costPer1MInput": 3.0,
    "costPer1MOutput": 15.0
  }'
```

---

#### PUT /api/v2/deployments/:id

Atualiza um deployment existente.

**Autenticação:** ✅ Requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do deployment |

**Request Body:**

```json
{
  "isActive": false,
  "costPer1MInput": 3.5,
  "costPer1MOutput": 17.5
}
```

**Campos:** Todos os campos de criação são aceitos (todos opcionais).

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "isActive": false,
    "costPer1MInput": 3.5,
    "costPer1MOutput": 17.5,
    "updatedAt": "2026-02-10T03:30:00.000Z"
  }
}
```

**Exemplo cURL:**

```bash
curl -X PUT "http://localhost:3001/api/v2/deployments/660e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"isActive": false}'
```

---

#### DELETE /api/v2/deployments/:id

Remove um deployment (soft delete por padrão).

**Autenticação:** ✅ Requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do deployment |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `hard` | boolean | false | Se true, deleta permanentemente |

**Response - Soft Delete (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "deploymentId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "isActive": false
  }
}
```

**Response - Hard Delete (200 OK):**

```json
{
  "status": "success",
  "data": {
    "deleted": true,
    "id": "660e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Exemplo cURL:**

```bash
# Soft delete
curl -X DELETE "http://localhost:3001/api/v2/deployments/660e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"

# Hard delete
curl -X DELETE "http://localhost:3001/api/v2/deployments/660e8400-e29b-41d4-a716-446655440000?hard=true" \
  -H "Authorization: Bearer <token>"
```

---

### Providers (`/api/v2/providers`)

#### GET /api/v2/providers

Lista todos os providers.

**Autenticação:** ❌ Não requerida

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página |
| `limit` | integer | 20 | Itens por página (máx: 100) |
| `isActive` | boolean | - | Filtrar por status ativo |
| `search` | string | - | Busca em nome e slug |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "providers": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "AWS Bedrock",
        "slug": "bedrock",
        "type": "CLOUD",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/providers?isActive=true"
```

---

#### GET /api/v2/providers/:id

Obtém um provider por ID.

**Autenticação:** ❌ Não requerida

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | UUID | ID do provider |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `includeDeployments` | boolean | false | Incluir deployments relacionados |

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "AWS Bedrock",
    "slug": "bedrock",
    "type": "CLOUD",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "deployments": []
  }
}
```

**Response (404 Not Found):**

```json
{
  "status": "fail",
  "data": {
    "id": "Provider not found"
  }
}
```

**Exemplo cURL:**

```bash
curl "http://localhost:3001/api/v2/providers/770e8400-e29b-41d4-a716-446655440000?includeDeployments=true"
```

---

## Schemas de Dados

### BaseModel

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | string | Nome único do modelo (ex: "Claude 3.5 Sonnet") |
| `vendor` | string | Nome do vendor (ex: "Anthropic", "OpenAI") |
| `family` | string? | Família do modelo (ex: "Claude", "GPT") |
| `version` | string? | Versão do modelo (ex: "3.5", "4") |
| `capabilities` | object | Capabilities do modelo |
| `defaultParams` | object? | Parâmetros padrão |
| `description` | string? | Descrição do modelo |
| `releaseDate` | datetime? | Data de lançamento |
| `deprecated` | boolean | Se o modelo está deprecated |
| `replacedBy` | string? | Nome do modelo substituto |
| `createdAt` | datetime | Data de criação |
| `updatedAt` | datetime | Data de atualização |

### BaseModelCapabilities

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `streaming` | boolean? | Suporte a streaming de resposta |
| `vision` | boolean? | Suporte a análise de imagens |
| `functionCalling` | boolean? | Suporte a function calling / tools |
| `maxContextWindow` | integer? | Tamanho máximo da janela de contexto (tokens) |
| `maxOutputTokens` | integer? | Número máximo de tokens de output |

### BaseModelDefaultParams

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `temperature` | number? | Temperatura padrão (0-2) |
| `topP` | number? | Top P padrão (0-1) |
| `maxTokens` | integer? | Max tokens padrão |

### ModelDeployment

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `baseModelId` | UUID | ID do modelo base |
| `providerId` | UUID | ID do provider |
| `deploymentId` | string | ID único no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0") |
| `inferenceType` | enum | Tipo: `ON_DEMAND`, `INFERENCE_PROFILE`, `PROVISIONED` |
| `providerConfig` | object? | Configuração específica do provider |
| `costPer1MInput` | number | Custo por 1M tokens de input (USD) |
| `costPer1MOutput` | number | Custo por 1M tokens de output (USD) |
| `costPerHour` | number? | Custo por hora (para provisioned) |
| `customParams` | object? | Parâmetros customizados |
| `capabilitiesVerifiedAt` | datetime? | Data da última verificação |
| `capabilitiesSource` | enum? | Fonte: `manual`, `auto_test` |
| `isActive` | boolean | Se o deployment está ativo |
| `createdAt` | datetime | Data de criação |
| `updatedAt` | datetime | Data de atualização |

### ProviderConfig

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `arn` | string? | ARN do recurso AWS |
| `profileFormat` | string? | Formato do inference profile |
| `region` | string? | Região AWS (ex: "us-east-1") |

### Provider

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | string | Nome do provider (ex: "AWS Bedrock") |
| `slug` | string | Slug único (ex: "bedrock") |
| `type` | string? | Tipo do provider (ex: "CLOUD") |
| `isActive` | boolean | Se o provider está ativo |
| `createdAt` | datetime | Data de criação |
| `updatedAt` | datetime | Data de atualização |

### Pagination

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `page` | integer | Página atual |
| `limit` | integer | Itens por página |
| `total` | integer | Total de itens |
| `totalPages` | integer | Total de páginas |

---

## Códigos de Erro

### Códigos HTTP

| Código | Status | Descrição |
|--------|--------|-----------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos ou validação falhou |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: nome duplicado) |
| 500 | Internal Server Error | Erro interno do servidor |

### Erros de Validação (400)

```json
{
  "status": "fail",
  "data": {
    "name": "String must contain at least 1 character(s)",
    "costPer1MInput": "Number must be greater than or equal to 0",
    "id": "Invalid uuid"
  }
}
```

### Erros de Autenticação (401)

```json
{
  "status": "fail",
  "data": {
    "auth": "No token provided"
  }
}
```

### Erros de Conflito (409)

```json
{
  "status": "fail",
  "data": {
    "name": "BaseModel with name \"Claude 4\" already exists"
  }
}
```

### Erros de Referência (400)

```json
{
  "status": "fail",
  "data": {
    "reference": "BaseModel or Provider does not exist"
  }
}
```

---

## Exemplos de Uso

### Fluxo Completo: Criar Modelo e Deployment

```bash
# 1. Fazer login para obter token
TOKEN=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "leo@leo.com", "password": "leoleo"}' | jq -r '.token')

# 2. Criar modelo base
MODEL_ID=$(curl -s -X POST "http://localhost:3001/api/v2/models" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Claude 4 Opus",
    "vendor": "Anthropic",
    "family": "Claude",
    "version": "4",
    "capabilities": {
      "streaming": true,
      "vision": true,
      "functionCalling": true,
      "maxContextWindow": 500000,
      "maxOutputTokens": 16384
    }
  }' | jq -r '.data.id')

echo "Model ID: $MODEL_ID"

# 3. Obter ID do provider Bedrock
PROVIDER_ID=$(curl -s "http://localhost:3001/api/v2/providers?search=bedrock" \
  | jq -r '.data.providers[0].id')

echo "Provider ID: $PROVIDER_ID"

# 4. Criar deployment
curl -X POST "http://localhost:3001/api/v2/deployments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"baseModelId\": \"$MODEL_ID\",
    \"providerId\": \"$PROVIDER_ID\",
    \"deploymentId\": \"anthropic.claude-4-opus-20260301-v1:0\",
    \"inferenceType\": \"ON_DEMAND\",
    \"costPer1MInput\": 15.0,
    \"costPer1MOutput\": 75.0
  }"
```

### Listar Modelos com Filtros

```bash
# Listar modelos da Anthropic
curl "http://localhost:3001/api/v2/models?vendor=Anthropic"

# Listar modelos com suporte a vision
curl "http://localhost:3001/api/v2/models/capabilities?vision=true"

# Listar modelos de um provider específico
curl "http://localhost:3001/api/v2/models/provider/$PROVIDER_ID"
```

### Listar Deployments Ativos

```bash
# Todos os deployments ativos
curl "http://localhost:3001/api/v2/deployments/active"

# Deployments de um modelo específico
curl "http://localhost:3001/api/v2/deployments/model/$MODEL_ID?includeProvider=true"

# Deployments com filtros
curl "http://localhost:3001/api/v2/deployments?inferenceType=ON_DEMAND&isActive=true&includeBaseModel=true"
```

### Deprecar um Modelo

```bash
# Soft delete (marca como deprecated)
curl -X DELETE "http://localhost:3001/api/v2/models/$MODEL_ID?replacedBy=Claude%205" \
  -H "Authorization: Bearer $TOKEN"

# Ou via PUT
curl -X PUT "http://localhost:3001/api/v2/models/$MODEL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"deprecated": true, "replacedBy": "Claude 5"}'
```

### Desativar um Deployment

```bash
# Soft delete (marca como inativo)
curl -X DELETE "http://localhost:3001/api/v2/deployments/$DEPLOYMENT_ID" \
  -H "Authorization: Bearer $TOKEN"

# Ou via PUT
curl -X PUT "http://localhost:3001/api/v2/deployments/$DEPLOYMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isActive": false}'
```

---

## Referências

- **Rotas:** [`backend/src/routes/modelsRoutes-v2.ts`](../../../backend/src/routes/modelsRoutes-v2.ts)
- **Controllers:** 
  - [`backend/src/controllers/modelsController.ts`](../../../backend/src/controllers/modelsController.ts)
  - [`backend/src/controllers/deploymentsController.ts`](../../../backend/src/controllers/deploymentsController.ts)
- **Schemas:** [`backend/src/schemas/modelsSchemas.ts`](../../../backend/src/schemas/modelsSchemas.ts)
- **Services:**
  - [`backend/src/services/models/baseModelService.ts`](../../../backend/src/services/models/baseModelService.ts)
  - [`backend/src/services/models/deploymentService.ts`](../../../backend/src/services/models/deploymentService.ts)

---

**Última atualização:** 10/02/2026  
**Versão da API:** 2.0