# Scripts de Manutenção (Backend)

Scripts TypeScript para manutenção e limpeza do sistema.

## Scripts de Limpeza

### Logs
- **cleanup-logs.ts** - Limpar logs antigos

### Jobs e Certificações
- **cleanup-old-jobs.ts** - Limpar jobs antigos
- **cleanup-all-certifications.ts** - Limpar todas as certificações
- **cleanup-all-queued-jobs.ts** - Limpar todos os jobs enfileirados
- **clear-all-certifications.ts** - Remover todas as certificações
- **clear-failed-certifications.ts** - Remover certificações falhadas

### Banco de Dados
- **cleanupDatabase.ts** - Limpeza geral do banco de dados

### Gerenciamento de Jobs
- **check-jobs.mjs** - Verificar status dos jobs
- **cleanup-bad-jobs.mjs** - Limpar jobs com problemas

## Uso

```bash
# Limpar logs antigos
npx tsx cleanup-logs.ts

# Limpar jobs antigos
npx tsx cleanup-old-jobs.ts

# Verificar jobs
node check-jobs.mjs

# Limpar certificações falhadas
npx tsx clear-failed-certifications.ts
```

## Descrição

Estes scripts fornecem ferramentas essenciais para manter o sistema limpo e otimizado, removendo dados obsoletos e gerenciando recursos.
