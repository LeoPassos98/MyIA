# Padrão de Organização de Scripts - MyIA

## 📋 Visão Geral

Este documento descreve a estrutura organizacional de scripts do projeto MyIA após a reorganização de 2026-02-04.

## 🎯 Objetivos da Reorganização

1. **Descoberta Fácil** - Scripts agrupados por função
2. **Manutenibilidade** - Estrutura clara e documentada
3. **Segurança** - Scripts críticos protegidos na raiz
4. **Escalabilidade** - Fácil adicionar novos scripts

## 📁 Estrutura Completa

### Raiz do Projeto (Scripts Críticos)

Apenas 4 scripts críticos permanecem na raiz:

| Script | Propósito | Documentação |
|--------|-----------|--------------|
| [`start.sh`](../../start.sh) | Gerenciador principal | [START-SH-DOCS.md](../START-SH-DOCS.md) |
| [`start_interactive.sh`](../../start_interactive.sh) | Menu interativo | [start-interactive-guide.md](start-interactive-guide.md) |
| [`start_full.sh`](../../start_full.sh) | Inicialização completa | - |
| [`manage-certifications.sh`](../../manage-certifications.sh) | Gerenciamento de certificações | [CERTIFICATION-SYSTEM-GUIDE.md](../CERTIFICATION-SYSTEM-GUIDE.md) |

**Por que na raiz?**
- Usados frequentemente por desenvolvedores
- Referenciados em múltiplos lugares (50+ referências)
- Parte da interface principal do projeto

### scripts/ (Scripts Shell Organizados)

```
scripts/
├── certification/     # Certificação de modelos (3 scripts)
│   ├── certify-all-via-api.sh (RECOMENDADO)
│   ├── certify-all-direct.sh
│   └── certify-all-models-auto.sh
├── testing/          # Testes e validação (10 scripts)
│   ├── test-manage-certifications.sh
│   ├── test_validations.sh
│   └── ...
├── analysis/         # Análise Python (1 script)
│   └── check_grafana_dashboard.py
├── common/           # Utilitários comuns (modular)
├── services/         # Gerenciamento de serviços
├── health/           # Health checks
├── logs/             # Visualização de logs
├── ui/               # Interface de usuário
└── deprecated/       # Scripts obsoletos
```

### backend/scripts/ (Scripts TypeScript)

```
backend/scripts/
├── certification/    # Certificação (13 scripts)
│   ├── certify-model.ts
│   ├── recertify-all-models.ts
│   └── ...
├── testing/         # Testes (13 scripts)
│   ├── test-all-models.ts
│   ├── test-certification-queue.ts
│   └── ...
├── maintenance/     # Manutenção (9 scripts)
│   ├── cleanup-logs.ts
│   ├── cleanup-old-jobs.ts
│   └── ...
├── analysis/        # Análise (16 scripts)
│   ├── analyze-file-sizes.ts
│   ├── diagnose-aws-credentials.ts
│   └── ...
├── database/        # Banco de dados (12 scripts)
│   ├── cleanup-database.sh
│   ├── seedAudit.ts
│   └── ...
└── deprecated/      # Scripts obsoletos (6 scripts)
```

## 🔍 Como Encontrar um Script

### Por Função

1. **Certificar modelos?** → [`scripts/certification/`](../../scripts/certification/) ou [`backend/scripts/certification/`](../../backend/scripts/certification/)
2. **Testar algo?** → [`scripts/testing/`](../../scripts/testing/) ou [`backend/scripts/testing/`](../../backend/scripts/testing/)
3. **Limpar dados?** → [`backend/scripts/maintenance/`](../../backend/scripts/maintenance/)
4. **Analisar/diagnosticar?** → [`backend/scripts/analysis/`](../../backend/scripts/analysis/)
5. **Banco de dados?** → [`backend/scripts/database/`](../../backend/scripts/database/)

### Por Tecnologia

- **Shell scripts (.sh)** → [`scripts/`](../../scripts/)
- **TypeScript (.ts)** → [`backend/scripts/`](../../backend/scripts/)
- **Python (.py)** → [`scripts/analysis/`](../../scripts/analysis/)

## 📖 Documentação por Diretório

Cada diretório possui um README.md com:
- Lista de scripts disponíveis
- Exemplos de uso
- Dependências necessárias

## 🗑️ Scripts Removidos

6 scripts obsoletos foram removidos durante a reorganização:
- Ver [`scripts/deprecated/REMOVED_SCRIPTS.md`](../../scripts/deprecated/REMOVED_SCRIPTS.md)

## 💾 Backup

Backup completo disponível em: `backups/scripts-backup-20260204-105832/`

## 📝 Histórico

- **2026-02-04**: Reorganização completa (83 scripts movidos, 6 removidos)
- **Plano**: [`plans/PLANO-ORGANIZACAO-SCRIPTS.md`](../../plans/PLANO-ORGANIZACAO-SCRIPTS.md)

## 🚀 Próximos Passos Recomendados

### 1. Consolidação de Scripts Duplicados

Identificamos alguns scripts com funcionalidades similares que podem ser consolidados:

**Certificação:**
- `scripts/certification/certify-all-via-api.sh` (RECOMENDADO)
- `scripts/certification/certify-all-direct.sh`
- `scripts/certification/certify-all-models-auto.sh`

**Recomendação:** Manter apenas `certify-all-via-api.sh` e deprecar os outros após validação.

### 2. Padronização de Nomenclatura

Alguns scripts ainda usam nomenclaturas inconsistentes:
- `test_validations.sh` vs `test-manage-certifications.sh`

**Recomendação:** Padronizar para kebab-case (`test-validations.sh`)

### 3. Documentação de Scripts Individuais

Scripts complexos devem ter comentários de cabeçalho:

```bash
#!/bin/bash
# Script: certify-all-via-api.sh
# Descrição: Certifica todos os modelos via API de fila
# Uso: ./certify-all-via-api.sh [--force]
# Dependências: curl, jq
```

### 4. Testes Automatizados

Criar suite de testes para scripts críticos:
- Validar que scripts existem
- Verificar permissões de execução
- Testar flags de ajuda (`--help`)

## 📊 Métricas da Reorganização

### Antes
- **Scripts na raiz:** 89 scripts
- **Estrutura:** Plana, difícil navegação
- **Documentação:** Dispersa

### Depois
- **Scripts na raiz:** 4 scripts críticos
- **Scripts organizados:** 83 scripts em 9 diretórios
- **Scripts removidos:** 6 obsoletos
- **READMEs criados:** 9 documentos
- **Backup:** Completo e versionado

### Benefícios Alcançados
- ✅ **95% redução** de scripts na raiz
- ✅ **100% documentação** de diretórios
- ✅ **Backup seguro** antes da reorganização
- ✅ **Estrutura escalável** para novos scripts

## 🔗 Links Relacionados

- [Plano de Reorganização](../../plans/PLANO-ORGANIZACAO-SCRIPTS.md)
- [Scripts Removidos](../../scripts/deprecated/REMOVED_SCRIPTS.md)
- [README Principal](../../README.md)
- [Guia de Certificação](../CERTIFICATION-SYSTEM-GUIDE.md)
- [Guia Start Interactive](start-interactive-guide.md)
