# Scripts de Banco de Dados (Backend)

Scripts para gerenciamento e manutenção do banco de dados.

## Scripts SQL

### Limpeza
- **cleanup-database.sh** - Script shell para limpeza do banco
- **cleanup-database.sql** - SQL para limpeza geral
- **cleanup-bedrock-models.sql** - Limpar modelos Bedrock

### Configuração e Correção
- **add-aws-bedrock.sql** - Adicionar AWS Bedrock
- **fix-bedrock-model-ids.sql** - Corrigir IDs de modelos Bedrock
- **fix-bedrock-models.sh** - Script para corrigir modelos Bedrock

## Scripts TypeScript

### Dados
- **backfillEmbeddings.ts** - Preencher embeddings retroativamente
- **seedAudit.ts** - Popular dados de auditoria

### Modelos
- **add-models-to-registry.ts** - Adicionar modelos ao registro
- **list-available-bedrock-models.ts** - Listar modelos Bedrock disponíveis
- **list-registry-models.ts** - Listar modelos no registro
- **sync-models-to-db.ts** - Sincronizar modelos com o banco

## Uso

```bash
# Limpar banco de dados
./cleanup-database.sh

# Adicionar modelos ao registro
npx tsx add-models-to-registry.ts

# Sincronizar modelos
npx tsx sync-models-to-db.ts

# Listar modelos disponíveis
npx tsx list-available-bedrock-models.ts
```

## Descrição

Estes scripts fornecem ferramentas completas para gerenciar o banco de dados, incluindo limpeza, sincronização de modelos e manutenção de dados.
