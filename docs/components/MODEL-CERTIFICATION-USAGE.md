# Sistema de Certificação de Modelos - Guia de Uso

## Visão Geral

O Sistema de Certificação valida automaticamente modelos AWS Bedrock antes de disponibilizá-los na UI, garantindo que apenas modelos testados e funcionais sejam oferecidos aos usuários.

## Endpoints de API

### 1. Certificar Modelo Individual

**POST** `/api/certification/certify-model`

Certifica um modelo específico executando testes automatizados.

**Request:**
```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "credentials": {
    "accessKey": "AWS_ACCESS_KEY",
    "secretKey": "AWS_SECRET_KEY",
    "region": "us-east-1"
  }
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "data": {
    "certification": {
      "modelId": "anthropic.claude-3-5-sonnet-20240620-v1:0",
      "status": "certified",
      "testsPassed": 6,
      "testsFailed": 0,
      "successRate": 100,
      "avgLatencyMs": 1250,
      "isCertified": true,
      "results": [...]
    }
  }
}
```

**Rate Limit:** 5 requisições/minuto

---

### 2. Certificar Vendor

**POST** `/api/certification/certify-vendor`

Certifica todos os modelos de um vendor (anthropic, cohere, amazon).

**Request:**
```json
{
  "vendor": "anthropic",
  "credentials": {
    "accessKey": "AWS_ACCESS_KEY",
    "secretKey": "AWS_SECRET_KEY",
    "region": "us-east-1"
  }
}
```

**Response:** Array de certificações

**Rate Limit:** 2 requisições/minuto

---

### 3. Certificar Todos os Modelos

**POST** `/api/certification/certify-all`

Certifica todos os modelos disponíveis no registry.

**Request:**
```json
{
  "credentials": {
    "accessKey": "AWS_ACCESS_KEY",
    "secretKey": "AWS_SECRET_KEY",
    "region": "us-east-1"
  }
}
```

**Rate Limit:** 1 requisição/5 minutos

---

### 4. Listar Modelos Certificados

**GET** `/api/certification/certified-models`

Retorna lista de modelIds certificados e não expirados.

**Response:**
```json
{
  "status": "success",
  "data": {
    "modelIds": [
      "anthropic.claude-3-5-sonnet-20240620-v1:0",
      "cohere.command-r-plus-v1:0"
    ]
  }
}
```

**Rate Limit:** 30 requisições/minuto

---

### 5. Verificar Certificação

**GET** `/api/certification/is-certified/:modelId`

Verifica se um modelo específico está certificado.

**Response:**
```json
{
  "status": "success",
  "data": {
    "modelId": "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "isCertified": true
  }
}
```

**Rate Limit:** 30 requisições/minuto

---

## Uso Programático

### Backend (TypeScript)

```typescript
import { ModelCertificationService } from './services/ai/certification';

const service = new ModelCertificationService();

// Certificar modelo
const result = await service.certifyModel(
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  { accessKey, secretKey, region: 'us-east-1' }
);

// Verificar certificação
const isCertified = await service.isCertified(modelId);

// Listar certificados
const certifiedModels = await service.getCertifiedModels();
```

---

## Testes Executados

### Testes Base (Todos os Modelos)
1. **Basic Prompt Test**: Resposta a prompt simples
2. **Streaming Test**: Validação de streaming
3. **Parameter Validation Test**: Aceitação de parâmetros
4. **Error Handling Test**: Tratamento de erros

### Testes Específicos por Vendor
- **Anthropic**: System messages, Temperature+TopP
- **Cohere**: Chat history, Preamble
- **Amazon**: Text generation, Max tokens

---

## Critérios de Certificação

- **Threshold**: 80% de testes bem-sucedidos
- **Expiração**: 7 dias
- **Re-certificação**: Automática ao expirar

---

## Monitoramento

Consulte a tabela `model_certifications` no Prisma Studio para visualizar:
- Status de certificação
- Métricas de performance
- Histórico de testes
- Motivos de falha

```bash
cd backend
npx prisma studio
```

---

**Autor:** Kilo Code  
**Data:** 2026-01-20  
**Versão:** 1.0
