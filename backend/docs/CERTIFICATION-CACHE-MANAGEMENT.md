# Gerenciamento de Cache de Certificações

Este documento descreve como funciona o sistema de cache de certificações e como gerenciá-lo efetivamente.

## 📋 Índice

1. [Como Funciona o Cache](#como-funciona-o-cache)
2. [Forçar Re-certificação](#forçar-re-certificação)
3. [Limpar Certificações Falhadas](#limpar-certificações-falhadas)
4. [Deletar Certificação via API](#deletar-certificação-via-api)
5. [Casos de Uso Comuns](#casos-de-uso-comuns)

---

## Como Funciona o Cache

### Estratégia de Cache

O sistema de certificação utiliza cache em banco de dados para evitar re-executar testes desnecessariamente:

- **Certificações bem-sucedidas**: Cache válido por **7 dias**
- **Certificações falhadas**: Sem expiração automática (devem ser limpas manualmente)
- **Verificação de cache**: Sempre executada ANTES de aplicar rate limiting

### Fluxo de Certificação

```
1. Frontend chama GET /api/certification/check/:modelId (sem rate limit)
   ↓
2. Se cached=true: Retorna resultado do cache
   ↓
3. Se cached=false: Frontend chama POST /api/certification/certify-model
   ↓
4. Rate limiting aplicado (10 req/min)
   ↓
5. Service verifica cache novamente (double-check)
   ↓
6. Se cache miss: Executa testes e salva resultado
```

### Estrutura do Cache

```typescript
interface CachedCertification {
  modelId: string;
  status: 'certified' | 'quality_warning' | 'failed';
  testsPassed: number;
  testsFailed: number;
  successRate: number;
  avgLatencyMs: number;
  certifiedAt: Date | null;
  expiresAt: Date | null;  // 7 dias para certified, null para failed
  lastTestedAt: Date;
  errorCategory: string | null;
  errorSeverity: string | null;
  lastError: string | null;
}
```

---

## Forçar Re-certificação

### Quando Usar

Use o parâmetro `force=true` quando:

- ✅ Configurações de timeout foram alteradas (ex: 10s → 30s)
- ✅ Credenciais AWS foram atualizadas
- ✅ Modelo foi atualizado pelo provedor
- ✅ Cache está retornando resultados incorretos/desatualizados
- ✅ Você quer garantir que o teste seja executado novamente

### Via API

**Endpoint**: `POST /api/certification/certify-model`

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "force": true
}
```

**Resposta de Sucesso (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Modelo certificado com sucesso",
    "certification": {
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "status": "certified",
      "testsPassed": 6,
      "testsFailed": 0,
      "successRate": 100,
      "avgLatencyMs": 2500,
      "isCertified": true,
      "isAvailable": true
    },
    "isAvailable": true
  }
}
```

### Exemplo cURL

```bash
curl -X POST https://api.myia.com/api/certification/certify-model \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "force": true
  }'
```

### Exemplo JavaScript/TypeScript

```typescript
import axios from 'axios';

const response = await axios.post(
  '/api/certification/certify-model',
  {
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    force: true  // Ignora cache e força re-certificação
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

console.log('Certificação:', response.data.certification);
```

---

## Limpar Certificações Falhadas

### Script de Limpeza

O script [`clear-failed-certifications.ts`](../scripts/clear-failed-certifications.ts) permite limpar certificações falhadas do banco de dados.

### Uso

#### Limpar TODAS as certificações falhadas

```bash
# 1. Ver quais serão deletadas (dry-run)
npx ts-node backend/scripts/clear-failed-certifications.ts

# 2. Confirmar e executar
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts
```

#### Limpar modelo específico

```bash
# 1. Ver detalhes (dry-run)
npx ts-node backend/scripts/clear-failed-certifications.ts anthropic.claude-3-5-sonnet-20241022-v2:0

# 2. Confirmar e executar
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts anthropic.claude-3-5-sonnet-20241022-v2:0
```

### O que o Script Faz

1. **Busca certificações** com:
   - `status = 'failed'`
   - `errorCategory IN ('TIMEOUT', 'UNAVAILABLE', 'PERMISSION_ERROR', etc)`

2. **Mostra preview** das certificações que serão deletadas:
   ```
   📋 Certificações que serão deletadas (3):

   1. anthropic.claude-3-5-sonnet-20241022-v2:0
      Status: failed
      Categoria: TIMEOUT
      Último teste: 2026-01-21T20:30:00.000Z
      Erro: ThrottlingException: Rate exceeded...
   ```

3. **Aguarda confirmação** (via `CONFIRM=true`)

4. **Deleta do banco** e mostra resumo:
   ```
   ✅ Limpeza concluída com sucesso!
      Certificações deletadas: 3
   ```

### Segurança

- ⚠️ **Operação irreversível**: Certificações deletadas não podem ser recuperadas
- 🔒 **Confirmação obrigatória**: Requer `CONFIRM=true` (exceto em CI/CD)
- 📝 **Preview antes de deletar**: Sempre mostra o que será deletado

---

## Deletar Certificação via API

### Endpoint DELETE

**Endpoint**: `DELETE /api/certification/:modelId`

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "status": "success",
  "data": {
    "message": "Certificação deletada com sucesso",
    "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "previousStatus": "failed"
  }
}
```

**Resposta de Erro (404)**:
```json
{
  "status": "fail",
  "data": {
    "message": "Certification not found for this model"
  }
}
```

### Exemplo cURL

```bash
curl -X DELETE https://api.myia.com/api/certification/anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Exemplo JavaScript/TypeScript

```typescript
import axios from 'axios';

const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

const response = await axios.delete(
  `/api/certification/${modelId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

console.log('Deletado:', response.data.message);
```

### Rate Limiting

- **Limite**: 30 requisições por minuto
- **Compartilhado com**: Outros endpoints de query (GET)

---

## Casos de Uso Comuns

### 1. Timeout Aumentado (10s → 30s)

**Problema**: Modelos Claude estão retornando cache antigo com timeout de 10s.

**Solução**:
```bash
# Opção A: Limpar certificações falhadas e re-certificar
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts

# Opção B: Forçar re-certificação via API (modelo específico)
curl -X POST /api/certification/certify-model \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0", "force": true}'
```

### 2. Credenciais AWS Atualizadas

**Problema**: Credenciais foram atualizadas, mas cache ainda usa as antigas.

**Solução**:
```bash
# Limpar todas as certificações falhadas
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts

# Re-certificar todos os modelos
curl -X POST /api/certification/certify-all \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Modelo Específico com Erro

**Problema**: Um modelo específico está com erro de certificação.

**Solução**:
```bash
# Opção A: Deletar via script
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts \
  anthropic.claude-3-5-sonnet-20241022-v2:0

# Opção B: Deletar via API
curl -X DELETE /api/certification/anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -H "Authorization: Bearer $TOKEN"

# Re-certificar com force=true
curl -X POST /api/certification/certify-model \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0", "force": true}'
```

### 4. Limpar Cache Antigo (Manutenção)

**Problema**: Muitas certificações antigas no banco.

**Solução**:
```bash
# Limpar todas as certificações falhadas
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts

# Certificações bem-sucedidas expiram automaticamente após 7 dias
```

### 5. Desenvolvimento/Testes

**Problema**: Testando mudanças no sistema de certificação.

**Solução**:
```bash
# Limpar tudo
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts

# Re-certificar com force=true para garantir execução
curl -X POST /api/certification/certify-model \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"modelId": "test-model", "force": true}'
```

---

## Fluxo Completo: Invalidar e Re-certificar

### Cenário: Timeout alterado de 10s para 30s

```bash
# 1. Verificar certificações falhadas atuais
npx ts-node backend/scripts/check-failed-certifications.ts

# 2. Limpar certificações falhadas (dry-run)
npx ts-node backend/scripts/clear-failed-certifications.ts

# 3. Confirmar e executar limpeza
CONFIRM=true npx ts-node backend/scripts/clear-failed-certifications.ts

# 4. Re-certificar modelos específicos com force=true
curl -X POST /api/certification/certify-model \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "force": true
  }'

# 5. Verificar resultado
curl -X GET /api/certification/details/anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoramento

### Verificar Status de Certificações

```bash
# Modelos certificados
curl -X GET /api/certification/certified-models \
  -H "Authorization: Bearer $TOKEN"

# Modelos com falha
curl -X GET /api/certification/failed-models \
  -H "Authorization: Bearer $TOKEN"

# Modelos indisponíveis
curl -X GET /api/certification/unavailable-models \
  -H "Authorization: Bearer $TOKEN"

# Modelos com warning de qualidade
curl -X GET /api/certification/quality-warning-models \
  -H "Authorization: Bearer $TOKEN"
```

### Detalhes de Modelo Específico

```bash
curl -X GET /api/certification/details/anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Boas Práticas

### ✅ Recomendado

- Verificar cache antes de forçar re-certificação (`GET /check/:modelId`)
- Usar `force=true` apenas quando necessário (economiza rate limit)
- Limpar certificações falhadas periodicamente (manutenção)
- Monitorar modelos com `quality_warning` (podem ter problemas)
- Usar script de limpeza com `CONFIRM=true` em produção

### ❌ Evitar

- Forçar re-certificação sem necessidade (consome rate limit)
- Deletar certificações bem-sucedidas (expiram automaticamente)
- Executar script sem preview (sempre verificar o que será deletado)
- Ignorar warnings de qualidade (podem indicar problemas reais)

---

## Troubleshooting

### Problema: "Rate limit exceeded"

**Causa**: Muitas requisições de certificação em curto período.

**Solução**:
```bash
# Verificar cache primeiro
curl -X GET /api/certification/check/MODEL_ID

# Se cached=true, usar resultado do cache
# Se cached=false, aguardar rate limit resetar (1 minuto)
```

### Problema: "Certification not found"

**Causa**: Modelo nunca foi certificado ou certificação foi deletada.

**Solução**:
```bash
# Certificar modelo
curl -X POST /api/certification/certify-model \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"modelId": "MODEL_ID"}'
```

### Problema: Cache retornando resultados antigos

**Causa**: Configurações foram alteradas mas cache não foi invalidado.

**Solução**:
```bash
# Opção 1: Forçar re-certificação
curl -X POST /api/certification/certify-model \
  -d '{"modelId": "MODEL_ID", "force": true}'

# Opção 2: Deletar e re-certificar
curl -X DELETE /api/certification/MODEL_ID
curl -X POST /api/certification/certify-model \
  -d '{"modelId": "MODEL_ID"}'
```

---

## Referências

- [Documentação de Certificação](./SSE-CERTIFICATION-EXAMPLE.md)
- [Script de Verificação](../scripts/check-failed-certifications.ts)
- [Script de Limpeza](../scripts/clear-failed-certifications.ts)
- [Controller de Certificação](../src/controllers/certificationController.ts)
- [Service de Certificação](../src/services/ai/certification/certification.service.ts)
