# Scripts de Certificação (Backend)

Scripts TypeScript para certificação de modelos de IA.

## Scripts Principais

### Certificação
- **certify-model.ts** - Certificar um modelo específico
- **certify-all-models-direct.ts** - Certificar todos os modelos diretamente
- **recertify-all-models.ts** - Recertificar todos os modelos

### Verificação
- **check-certifications.ts** - Verificar status de certificações
- **check-failed-certifications.ts** - Verificar certificações falhadas
- **check-sonnet-certifications.ts** - Verificar certificações do Sonnet

### Testes
- **test-certification-api.sh** - Testar API de certificação
- **test-certification-queue.ts** - Testar fila de certificação
- **test-sse-certification.js** - Testar SSE de certificação
- **test-worker.ts** - Testar worker de certificação
- **test-sync-banco-fila.ts** - Testar sincronização banco/fila
- **test-job-details.ts** - Testar detalhes de jobs
- **test-queue-basic.ts** - Testes básicos de fila

## Uso

```bash
# Certificar um modelo específico
npx tsx certify-model.ts <model-id>

# Recertificar todos os modelos
npx tsx recertify-all-models.ts

# Verificar status das certificações
npx tsx check-certifications.ts
```

## Descrição

Estes scripts fornecem funcionalidades completas para gerenciar o ciclo de vida de certificação de modelos de IA no backend.
