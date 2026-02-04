# Scripts de Análise (Backend)

Scripts TypeScript para análise e diagnóstico do sistema.

## Análise de Modelos

- **analyze-chat-models-profiles.ts** - Analisar perfis de modelos de chat
- **analyze-file-sizes.ts** - Analisar tamanhos de arquivos
- **analyze-inference-profiles.ts** - Analisar perfis de inferência
- **check-aws-models.ts** - Verificar modelos AWS
- **check-providers.ts** - Verificar provedores
- **check-quality-warnings.ts** - Verificar avisos de qualidade

## Diagnóstico

- **diagnose-aws-credentials.ts** - Diagnosticar credenciais AWS
- **diagnose-database-state.ts** - Diagnosticar estado do banco de dados
- **diagnose-log-sync.ts** - Diagnosticar sincronização de logs
- **diagnose-sonnet-4-5.ts** - Diagnosticar Sonnet 4.5

## Relatórios

- **generate-certification-report.ts** - Gerar relatório de certificações
- **generate-migration-report.ts** - Gerar relatório de migração
- **generate-models-report.ts** - Gerar relatório de modelos

## Validação

- **validate-logging-system.ts** - Validar sistema de logging
- **validate-adapter-migration.ts** - Validar migração de adaptadores
- **benchmark-logger.ts** - Benchmark do logger

## Uso

```bash
# Analisar modelos de chat
npx tsx analyze-chat-models-profiles.ts

# Diagnosticar AWS
npx tsx diagnose-aws-credentials.ts

# Gerar relatório de certificações
npx tsx generate-certification-report.ts

# Validar sistema de logging
npx tsx validate-logging-system.ts
```

## Descrição

Estes scripts fornecem ferramentas abrangentes para análise, diagnóstico e geração de relatórios sobre o estado do sistema.
