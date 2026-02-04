# Scripts de Teste (Backend)

Scripts TypeScript para testar funcionalidades do backend.

## Categorias

### Testes de Modelos
- **test-all-models.ts** - Testar todos os modelos
- **test-all-models-demo.ts** - Demo de testes de modelos
- **test-model-normalization.ts** - Testar normalização de modelos

### Testes de Adaptadores
- **test-adapter-factory-feature-flag.ts** - Testar feature flags do adapter factory
- **test-sonnet-4-5-env.ts** - Testar ambiente Sonnet 4.5
- **test-sonnet-4-5-real.ts** - Testar Sonnet 4.5 real

### Testes de Logging
- **test-aws-error-logging.ts** - Testar logging de erros AWS
- **test-logs-api.sh** - Testar API de logs
- **test-logs-api.ts** - Testar API de logs (TypeScript)
- **test-postgres-transport.ts** - Testar transporte PostgreSQL
- **test-logging-interface.ts** - Testar interface de logging

### Outros Testes
- **test-fallback.ts** - Testar sistema de fallback
- **testEmbedding.ts** - Testar embeddings

## Uso

```bash
# Testar todos os modelos
npx tsx test-all-models.ts

# Testar logging
npx tsx test-postgres-transport.ts

# Testar API de logs
./test-logs-api.sh
```

## Descrição

Estes scripts fornecem testes abrangentes para todas as funcionalidades críticas do backend.
