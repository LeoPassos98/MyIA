# Scripts Obsoletos (Deprecated)

Scripts que não são mais utilizados mas foram mantidos para referência histórica.

## ⚠️ AVISO

Estes scripts estão obsoletos e não devem ser utilizados em produção. Eles foram movidos para este diretório para manter o histórico, mas podem ser removidos no futuro.

## Scripts Disponíveis

### Movidos em 2026-02-10 (Clean Slate - Fase 7.6)

Estes scripts dependiam do `ModelRegistry` que foi removido durante o projeto Clean Slate:

| Script | Origem | Motivo |
|--------|--------|--------|
| `2026-02-10_add-models-to-registry.ts` | database/ | Dependia de ModelRegistry |
| `2026-02-10_sync-models-to-db.ts` | database/ | Dependia de ModelRegistry |
| `2026-02-10_list-registry-models.ts` | database/ | Dependia de ModelRegistry |
| `2026-02-10_check-data-inconsistencies.ts` | analysis/ | Dependia de ModelRegistry |
| `2026-02-10_recertify-all-models.ts` | certification/ | Dependia de ModelRegistry |
| `2026-02-10_generate-models-report.ts` | analysis/ | Dependia de ModelRegistry |
| `2026-02-10_diagnose-sonnet-4-5.ts` | analysis/ | Dependia de ModelRegistry |
| `2026-02-10_test-all-models.ts` | testing/ | Dependia de ModelRegistry |
| `2026-02-10_validate-certification-fixes.ts` | scripts/ | Dependia de ModelRegistry |
| `2026-02-10_validate-certification-fixes.test.ts` | scripts/ | Dependia de ModelRegistry |
| `2026-02-10_seedAudit.ts` | database/ | Dependia de providerMap (removido) |

### Scripts Anteriores

- **test-model-after-fix.ts** - Teste de modelo após correção (obsoleto)
- **verify-regional-certification-schema.ts** - Verificação de schema regional (obsoleto)

### Shell Scripts

- **fix-logger-imports.sh** - Correção de imports do logger (obsoleto)
- **migrate-console-logs.sh** - Migração de console.logs (obsoleto)

## Scripts Deletados em 2026-02-10

Os seguintes scripts foram permanentemente removidos por não terem mais utilidade:

- `test-inference-profile-fix.ts` - Já estava em deprecated, sem uso
- `cleanup-non-bedrock-models.ts` - Já estava em deprecated, sem uso

## Motivo da Obsolescência

### Clean Slate (2026-02-10)

O projeto Clean Slate removeu o `ModelRegistry` em favor de uma arquitetura mais simples baseada no banco de dados. Os scripts que dependiam do `ModelRegistry` foram movidos para deprecated.

**Referência:** [`plans/CLEAN-SLATE-ORCHESTRATION.md`](../../../plans/CLEAN-SLATE-ORCHESTRATION.md)

### Scripts Anteriores

Estes scripts foram substituídos por implementações mais modernas ou suas funcionalidades foram integradas ao sistema principal.

## Recomendação

Para funcionalidades equivalentes, use:
- [`backend/scripts/certification/`](../certification/README.md) - Para certificação
- [`backend/scripts/analysis/`](../analysis/README.md) - Para análise
- [`backend/scripts/database/`](../database/README.md) - Para banco de dados

## Convenção de Nomes

Scripts movidos para deprecated seguem o padrão:
```
YYYY-MM-DD_nome-original.ts
```

Isso permite identificar quando o script foi deprecado e facilita a limpeza futura.
