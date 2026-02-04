# 📋 PLANO DE ORGANIZAÇÃO DE SCRIPTS - MyIA

> **Data:** 2026-02-04  
> **Versão:** 1.0.0  
> **Status:** 🟡 PLANEJAMENTO  
> **Autor:** Architect Mode

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Diretórios Proposta](#2-estrutura-de-diretórios-proposta)
3. [Plano de Ação por Categoria](#3-plano-de-ação-por-categoria)
4. [Estratégia de Migração Segura](#4-estratégia-de-migração-segura)
5. [Ordem de Execução](#5-ordem-de-execução)
6. [Checklist de Validação](#6-checklist-de-validação)
7. [Considerações Especiais](#7-considerações-especiais)
8. [Documentação a Criar/Atualizar](#8-documentação-a-criaratualizar)
9. [Métricas de Sucesso](#9-métricas-de-sucesso)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Visão Geral

### 1.1 Situação Atual

**Problema Identificado:**
- ~120+ scripts distribuídos por toda a aplicação
- Scripts na raiz do projeto (20+ arquivos)
- Scripts duplicados com funcionalidades sobrepostas
- Scripts obsoletos de bugs já corrigidos
- Scripts temporários que nunca foram removidos
- Falta de organização clara por categoria

**Impacto:**
- ❌ Difícil encontrar o script correto
- ❌ Manutenção complexa
- ❌ Risco de executar scripts obsoletos
- ❌ Duplicação de esforço
- ❌ Confusão para novos desenvolvedores

### 1.2 Objetivo

Criar uma estrutura organizada, segura e manutenível para os scripts do projeto, seguindo o padrão definido em [`docs/guides/script-organization-standard.md`](../docs/guides/script-organization-standard.md).

### 1.3 Princípios

✅ **Segurança:** Scripts críticos continuam funcionando  
✅ **Rastreabilidade:** Todas as referências são atualizadas  
✅ **Reversibilidade:** Rollback é possível  
✅ **Incremental:** Pode ser executado em fases  
✅ **Documentado:** Cada mudança é documentada

---

## 2. Estrutura de Diretórios Proposta

### 2.1 Estrutura Final

```
MyIA/
├── start.sh                          # ✅ CRÍTICO - Permanece na raiz
├── start_interactive.sh              # ✅ CRÍTICO - Permanece na raiz
├── start_full.sh                     # ✅ CRÍTICO - Permanece na raiz
├── manage-certifications.sh          # ✅ CRÍTICO - Permanece na raiz
│
├── scripts/                          # 📁 Scripts organizados por categoria
│   ├── README.md                     # Índice de todos os scripts
│   │
│   ├── core/                         # Scripts de inicialização críticos
│   │   ├── README.md
│   │   └── (vazio - scripts críticos ficam na raiz)
│   │
│   ├── certification/                # Scripts de certificação de modelos
│   │   ├── README.md
│   │   ├── certify-all-models-auto.sh
│   │   ├── certify-all-via-api.sh
│   │   ├── certify-all-direct.sh
│   │   ├── certify-all-interactive.exp
│   │   └── run-certification.exp
│   │
│   ├── testing/                      # Scripts de teste
│   │   ├── README.md
│   │   ├── bugs/                     # Testes de bugs específicos
│   │   │   ├── test-bug1-fix.sh
│   │   │   ├── test-bug1-validation.sh
│   │   │   ├── test-bug1-complete.sh
│   │   │   └── test-bug2-fix.sh
│   │   ├── certification/            # Testes de certificação
│   │   │   ├── test-manage-certifications.sh
│   │   │   ├── test-manage-certifications-automated.sh
│   │   │   ├── test-manage-certifications-direct.sh
│   │   │   └── test-manage-certifications-practical.sh
│   │   ├── grafana/                  # Testes de Grafana
│   │   │   ├── test-grafana-detection.sh
│   │   │   └── test-grafana-start-function.sh
│   │   ├── validation/               # Testes de validação
│   │   │   ├── test_validations.sh
│   │   │   └── test_badge_system.py
│   │   └── login/                    # Testes de login
│   │       └── test_login_validation.py
│   │
│   ├── maintenance/                  # Scripts de limpeza e manutenção
│   │   ├── README.md
│   │   └── (scripts de cleanup - ver seção 3.2)
│   │
│   ├── analysis/                     # Scripts de análise e diagnóstico
│   │   ├── README.md
│   │   ├── check_grafana_dashboard.py
│   │   └── (outros scripts de análise)
│   │
│   ├── database/                     # Scripts de banco de dados
│   │   ├── README.md
│   │   └── (scripts SQL e migrations)
│   │
│   ├── deprecated/                   # Scripts obsoletos (para remoção futura)
│   │   ├── README.md
│   │   └── (scripts marcados para remoção)
│   │
│   ├── common/                       # Módulos compartilhados (já existe)
│   │   ├── colors.sh
│   │   ├── config.sh
│   │   └── utils.sh
│   │
│   ├── ui/                           # Módulos de UI (já existe)
│   │   ├── drawing.sh
│   │   ├── progress.sh
│   │   └── menu.sh
│   │
│   ├── health/                       # Módulos de health check (já existe)
│   │   ├── wait.sh
│   │   └── status.sh
│   │
│   ├── logs/                         # Módulos de logs (já existe)
│   │   └── viewer.sh
│   │
│   └── services/                     # Módulos de serviços (já existe)
│       ├── database.sh
│       ├── backend.sh
│       ├── frontend.sh
│       ├── frontend-admin.sh
│       ├── worker.sh
│       └── grafana.sh
│
├── backend/
│   └── scripts/                      # Scripts específicos do backend
│       ├── README.md
│       ├── certification/            # Scripts de certificação
│       ├── testing/                  # Scripts de teste
│       ├── database/                 # Scripts de banco de dados
│       ├── analysis/                 # Scripts de análise
│       └── maintenance/              # Scripts de manutenção
│
├── frontend/
│   └── scripts/                      # Scripts específicos do frontend
│       └── validate-performance.sh
│
├── observability/
│   ├── start.sh                      # Scripts locais do observability
│   ├── stop.sh
│   ├── validate.sh
│   └── logs.sh
│
└── tests/
    └── scripts/                      # Scripts de teste globais
        ├── security-tests.sh
        ├── test-bedrock.sh
        └── test-aws-credentials.sh
```

### 2.2 Justificativa da Estrutura

**Scripts na Raiz (CRÍTICOS):**
- [`start.sh`](../start.sh) - Orquestrador principal (referenciado em 50+ lugares)
- [`start_interactive.sh`](../start_interactive.sh) - Menu interativo (referenciado em 30+ lugares)
- [`start_full.sh`](../start_full.sh) - Inicialização completa (referenciado em docs)
- [`manage-certifications.sh`](../manage-certifications.sh) - Gerenciador de certificações (referenciado em 20+ lugares)

**Motivo:** Estes scripts são pontos de entrada principais e mover quebraria muitas referências.

---

## 3. Plano de Ação por Categoria

### 3.1 Scripts a REMOVER

#### A. Scripts de Bugs Já Corrigidos

**Candidatos:**
```bash
# Bug 1 - Já corrigido e testado
./test-bug1-fix.sh              # ❌ REMOVER
./test-bug1-validation.sh       # ❌ REMOVER
./test-bug1-complete.sh         # ❌ REMOVER

# Bug 2 - Já corrigido
./test-bug2-fix.sh              # ❌ REMOVER
```

**Justificativa:**
- Bugs já foram corrigidos e validados
- Scripts não são mais necessários
- Mantê-los causa confusão

**Verificação de Dependências:**
```bash
# Verificar se algum script referencia estes arquivos
grep -r "test-bug1" . --exclude-dir=node_modules
grep -r "test-bug2" . --exclude-dir=node_modules
```

**Ação:**
1. Verificar se há referências em documentação
2. Atualizar documentação para remover referências
3. Mover para `scripts/deprecated/` (não deletar imediatamente)
4. Após 30 dias sem uso, deletar permanentemente

#### B. Scripts Temporários

**Candidatos:**
```bash
backend/scripts/certify-all-temp.ts     # ❌ REMOVER - Versão temporária
scripts/extract-from-backup.sh          # ❌ REMOVER - Script de migração já executada
```

**Justificativa:**
- Scripts criados para tarefas pontuais já concluídas
- Não fazem parte do fluxo normal

**Ação:**
1. Confirmar que tarefa foi concluída
2. Mover para `scripts/deprecated/`
3. Deletar após 7 dias

#### C. Scripts Duplicados (Consolidar)

**Grupo 1: Certificação de Modelos**
```bash
# Scripts similares de certificação
./certify-all-models-auto.sh           # 🔄 CONSOLIDAR
./certify-all-via-api.sh               # 🔄 CONSOLIDAR
./certify-all-direct.sh                # 🔄 CONSOLIDAR
./certify-all-interactive.exp          # 🔄 CONSOLIDAR
```

**Análise:**
- Todos fazem certificação de modelos
- Diferem apenas no método (auto, via API, direto, interativo)
- Podem ser consolidados em um único script com flags

**Proposta de Consolidação:**
```bash
# Novo script unificado
scripts/certification/certify-all-models.sh

# Uso:
./scripts/certification/certify-all-models.sh --mode=auto
./scripts/certification/certify-all-models.sh --mode=api
./scripts/certification/certify-all-models.sh --mode=direct
./scripts/certification/certify-all-models.sh --mode=interactive
```

**Ação:**
1. Criar script unificado
2. Testar todas as funcionalidades
3. Atualizar documentação
4. Mover scripts antigos para `deprecated/`
5. Criar aliases temporários para compatibilidade

**Grupo 2: Testes de manage-certifications**
```bash
# Scripts de teste similares
./test-manage-certifications.sh                 # 🔄 CONSOLIDAR
./test-manage-certifications-automated.sh       # 🔄 CONSOLIDAR
./test-manage-certifications-direct.sh          # 🔄 CONSOLIDAR
./test-manage-certifications-practical.sh       # 🔄 CONSOLIDAR
```

**Análise:**
- Todos testam `manage-certifications.sh`
- Diferem no tipo de teste (manual, automatizado, direto, prático)
- Podem ser consolidados com suítes de teste

**Proposta de Consolidação:**
```bash
# Novo script unificado
scripts/testing/certification/test-manage-certifications.sh

# Uso:
./scripts/testing/certification/test-manage-certifications.sh --suite=all
./scripts/testing/certification/test-manage-certifications.sh --suite=automated
./scripts/testing/certification/test-manage-certifications.sh --suite=direct
./scripts/testing/certification/test-manage-certifications.sh --suite=practical
```

### 3.2 Scripts a MOVER

#### A. Scripts de Certificação

**Origem → Destino:**
```bash
# Scripts de certificação
./certify-all-models-auto.sh           → scripts/certification/certify-all-models-auto.sh
./certify-all-via-api.sh               → scripts/certification/certify-all-via-api.sh
./certify-all-direct.sh                → scripts/certification/certify-all-direct.sh
./certify-all-interactive.exp          → scripts/certification/certify-all-interactive.exp
./run-certification.exp                → scripts/certification/run-certification.exp
```

**Ajustes Necessários:**
- Atualizar caminhos relativos dentro dos scripts
- Atualizar referências em documentação
- Criar aliases temporários na raiz (opcional)

**Impacto:**
- Baixo - Scripts não são referenciados diretamente por outros scripts
- Médio - Documentação precisa ser atualizada

#### B. Scripts de Teste

**Origem → Destino:**
```bash
# Testes de bugs
./test-bug1-fix.sh                     → scripts/testing/bugs/test-bug1-fix.sh
./test-bug1-validation.sh              → scripts/testing/bugs/test-bug1-validation.sh
./test-bug1-complete.sh                → scripts/testing/bugs/test-bug1-complete.sh
./test-bug2-fix.sh                     → scripts/testing/bugs/test-bug2-fix.sh

# Testes de certificação
./test-manage-certifications.sh        → scripts/testing/certification/test-manage-certifications.sh
./test-manage-certifications-automated.sh → scripts/testing/certification/test-manage-certifications-automated.sh
./test-manage-certifications-direct.sh → scripts/testing/certification/test-manage-certifications-direct.sh
./test-manage-certifications-practical.sh → scripts/testing/certification/test-manage-certifications-practical.sh

# Testes de Grafana
./test-grafana-detection.sh            → scripts/testing/grafana/test-grafana-detection.sh
./test-grafana-start-function.sh       → scripts/testing/grafana/test-grafana-start-function.sh

# Testes de validação
./test_validations.sh                  → scripts/testing/validation/test_validations.sh
./test_badge_system.py                 → scripts/testing/validation/test_badge_system.py
./test_login_validation.py             → scripts/testing/validation/test_login_validation.py

# Testes práticos
./test-practical-direct.sh             → scripts/testing/certification/test-practical-direct.sh
```

**Ajustes Necessários:**
- Atualizar caminhos relativos (ex: `./manage-certifications.sh` → `../../manage-certifications.sh`)
- Atualizar referências em CI/CD (se houver)
- Atualizar documentação

**Impacto:**
- Baixo - Scripts de teste geralmente não são referenciados por outros scripts
- Médio - Desenvolvedores precisam saber novos caminhos

#### C. Scripts de Análise

**Origem → Destino:**
```bash
# Scripts de análise
./check_grafana_dashboard.py           → scripts/analysis/check_grafana_dashboard.py
```

**Ajustes Necessários:**
- Atualizar caminhos relativos
- Atualizar documentação

**Impacto:**
- Baixo - Script standalone

#### D. Scripts do Backend

**Origem → Destino:**
```bash
# Scripts de certificação do backend
backend/scripts/certify-all-models-direct.ts → backend/scripts/certification/certify-all-models-direct.ts
backend/scripts/certify-all-temp.ts          → scripts/deprecated/certify-all-temp.ts (REMOVER)
backend/scripts/certify-model.ts             → backend/scripts/certification/certify-model.ts

# Scripts de teste do backend
backend/scripts/test-certification-api.sh    → backend/scripts/testing/test-certification-api.sh
backend/scripts/test-api-fixes.sh            → backend/scripts/testing/test-api-fixes.sh
backend/scripts/test-logs-api.sh             → backend/scripts/testing/test-logs-api.sh

# Scripts de banco de dados
backend/scripts/cleanup-database.sh          → backend/scripts/database/cleanup-database.sh
backend/scripts/cleanup-database.sql         → backend/scripts/database/cleanup-database.sql
backend/scripts/add-aws-bedrock.sql          → backend/scripts/database/add-aws-bedrock.sql
backend/scripts/cleanup-bedrock-models.sql   → backend/scripts/database/cleanup-bedrock-models.sql
backend/scripts/fix-bedrock-model-ids.sql    → backend/scripts/database/fix-bedrock-model-ids.sql
backend/scripts/fix-bedrock-models.sh        → backend/scripts/database/fix-bedrock-models.sh

# Scripts de análise
backend/scripts/analyze-chat-models-profiles.ts → backend/scripts/analysis/analyze-chat-models-profiles.ts
backend/scripts/analyze-file-sizes.ts           → backend/scripts/analysis/analyze-file-sizes.ts
backend/scripts/analyze-inference-profiles.ts   → backend/scripts/analysis/analyze-inference-profiles.ts

# Scripts de manutenção
backend/scripts/cleanup-all-certifications.ts   → backend/scripts/maintenance/cleanup-all-certifications.ts
backend/scripts/cleanup-all-queued-jobs.ts      → backend/scripts/maintenance/cleanup-all-queued-jobs.ts
backend/scripts/cleanup-logs.ts                 → backend/scripts/maintenance/cleanup-logs.ts
backend/scripts/cleanup-non-bedrock-models.ts   → backend/scripts/maintenance/cleanup-non-bedrock-models.ts
backend/scripts/cleanup-old-jobs.ts             → backend/scripts/maintenance/cleanup-old-jobs.ts
backend/scripts/clear-all-certifications.ts     → backend/scripts/maintenance/clear-all-certifications.ts
backend/scripts/clear-failed-certifications.ts  → backend/scripts/maintenance/clear-failed-certifications.ts
```

**Ajustes Necessários:**
- Atualizar imports relativos em TypeScript
- Atualizar caminhos em `package.json` scripts
- Atualizar documentação

**Impacto:**
- Médio - Scripts podem ser referenciados em `package.json`
- Médio - Documentação precisa ser atualizada

### 3.3 Scripts CRÍTICOS (NÃO MOVER)

**Lista Completa:**
```bash
# Orquestradores principais
./start.sh                             # ✅ PERMANECE - Referenciado em 50+ lugares
./start_interactive.sh                 # ✅ PERMANECE - Referenciado em 30+ lugares
./start_full.sh                        # ✅ PERMANECE - Referenciado em docs
./manage-certifications.sh             # ✅ PERMANECE - Referenciado em 20+ lugares
```

**Justificativa Técnica:**

1. **[`start.sh`](../start.sh)**
   - Ponto de entrada principal do sistema
   - Referenciado em:
     - README.md (múltiplas vezes)
     - Documentação (50+ referências)
     - Scripts de teste
     - CI/CD (potencialmente)
   - Mover quebraria: Onboarding de novos devs, automações, documentação

2. **[`start_interactive.sh`](../start_interactive.sh)**
   - Menu interativo principal
   - Referenciado em:
     - Documentação (30+ referências)
     - Guias de usuário
     - Scripts de teste
   - Mover quebraria: Experiência do usuário, documentação

3. **[`start_full.sh`](../start_full.sh)**
   - Inicialização completa automática
   - Referenciado em:
     - README.md
     - Guias de início rápido
   - Mover quebraria: Quick start guides

4. **[`manage-certifications.sh`](../manage-certifications.sh)**
   - Gerenciador de certificações
   - Referenciado em:
     - Documentação (20+ referências)
     - Scripts de teste (10+ scripts)
     - Guias de certificação
   - Mover quebraria: Fluxo de certificação, testes, documentação

**Decisão:** Manter na raiz é a escolha mais segura e pragmática.

---

## 4. Estratégia de Migração Segura

### 4.1 Princípios de Segurança

✅ **Backup Completo:** Criar backup antes de qualquer mudança  
✅ **Teste Incremental:** Testar cada mudança individualmente  
✅ **Rollback Preparado:** Ter plano de rollback para cada fase  
✅ **Validação Contínua:** Validar após cada mudança  
✅ **Documentação Atualizada:** Atualizar docs em paralelo

### 4.2 Processo de Migração por Script

**Para cada script a ser movido:**

```bash
# 1. BACKUP
cp script.sh script.sh.backup

# 2. CRIAR DIRETÓRIO DESTINO
mkdir -p scripts/categoria/

# 3. COPIAR (não mover ainda)
cp script.sh scripts/categoria/script.sh

# 4. ATUALIZAR CAMINHOS RELATIVOS
# Editar scripts/categoria/script.sh
# Ajustar todos os caminhos relativos

# 5. TESTAR NOVA VERSÃO
bash scripts/categoria/script.sh
# Verificar se funciona corretamente

# 6. ATUALIZAR REFERÊNCIAS
# Buscar todas as referências ao script antigo
grep -r "script.sh" . --exclude-dir=node_modules

# Atualizar cada referência para novo caminho
# docs/guide.md: ./script.sh → ./scripts/categoria/script.sh

# 7. CRIAR ALIAS TEMPORÁRIO (opcional)
# Criar script.sh na raiz que chama o novo
cat > script.sh << 'EOF'
#!/usr/bin/env bash
# DEPRECATED: Use scripts/categoria/script.sh
echo "⚠️  AVISO: Este script foi movido para scripts/categoria/script.sh"
echo "⚠️  Este alias será removido em 30 dias"
exec scripts/categoria/script.sh "$@"
EOF
chmod +x script.sh

# 8. VALIDAR
# Executar testes relacionados
# Verificar se nada quebrou

# 9. COMMIT
git add .
git commit -m "refactor: move script.sh to scripts/categoria/"

# 10. APÓS 30 DIAS: REMOVER ALIAS
rm script.sh
git commit -m "chore: remove deprecated script.sh alias"
```

### 4.3 Validação de Referências

**Script de Validação:**
```bash
#!/usr/bin/env bash
# scripts/validate-references.sh
# Valida se todas as referências foram atualizadas

SCRIPT_NAME="$1"
NEW_PATH="$2"

echo "🔍 Validando referências para $SCRIPT_NAME..."

# Buscar referências em documentação
echo "📚 Verificando documentação..."
grep -r "$SCRIPT_NAME" docs/ --exclude-dir=node_modules | grep -v "$NEW_PATH" || echo "✅ Documentação OK"

# Buscar referências em scripts
echo "📜 Verificando scripts..."
grep -r "$SCRIPT_NAME" . --include="*.sh" --exclude-dir=node_modules | grep -v "$NEW_PATH" || echo "✅ Scripts OK"

# Buscar referências em código
echo "💻 Verificando código..."
grep -r "$SCRIPT_NAME" backend/ frontend/ --exclude-dir=node_modules | grep -v "$NEW_PATH" || echo "✅ Código OK"

echo "✅ Validação completa!"
```

### 4.4 Garantias de Funcionamento

**Checklist por Script:**
- [ ] Backup criado
- [ ] Diretório destino existe
- [ ] Script copiado para novo local
- [ ] Caminhos relativos ajustados
- [ ] Script testado no novo local
- [ ] Todas as referências atualizadas
- [ ] Documentação atualizada
- [ ] Alias temporário criado (se necessário)
- [ ] Testes executados com sucesso
- [ ] Commit realizado

---

## 5. Ordem de Execução

### Fase 1: Preparação (Dia 1)
**Risco:** 🟢 Baixo  
**Duração:** 2-4 horas

**Ações:**
1. ✅ Criar backup completo do projeto
2. ✅ Criar estrutura de diretórios
3. ✅ Criar READMEs em cada diretório
4. ✅ Documentar plano de rollback
5. ✅ Criar script de validação

**Comandos:**
```bash
# 1. Backup
tar -czf myia-backup-$(date +%Y%m%d).tar.gz .

# 2. Criar estrutura
mkdir -p scripts/{certification,testing/{bugs,certification,grafana,validation,login},maintenance,analysis,database,deprecated}
mkdir -p backend/scripts/{certification,testing,database,analysis,maintenance}

# 3. Criar READMEs
cat > scripts/README.md << 'EOF'
# Scripts MyIA

Índice de todos os scripts organizados por categoria.

## Estrutura

- `certification/` - Scripts de certificação de modelos
- `testing/` - Scripts de teste
- `maintenance/` - Scripts de manutenção
- `analysis/` - Scripts de análise
- `database/` - Scripts de banco de dados
- `deprecated/` - Scripts obsoletos (serão removidos)

## Scripts Críticos (Raiz)

- `start.sh` - Orquestrador principal
- `start_interactive.sh` - Menu interativo
- `start_full.sh` - Inicialização completa
- `manage-certifications.sh` - Gerenciador de certificações
EOF

# 4. Commit inicial
git add scripts/
git commit -m "chore: create scripts directory structure"
```

**Validação:**
- [ ] Estrutura de diretórios criada
- [ ] READMEs criados
- [ ] Backup realizado
- [ ] Commit feito

### Fase 2: Remover Scripts Obsoletos (Dia 2)
**Risco:** 🟢 Baixo  
**Duração:** 1-2 horas

**Ações:**
1. ✅ Mover scripts de bugs para `deprecated/`
2. ✅ Mover scripts temporários para `deprecated/`
3. ✅ Atualizar documentação para remover referências
4. ✅ Criar arquivo `deprecated/README.md` explicando motivo

**Comandos:**
```bash
# 1. Mover scripts de bugs
mv test-bug1-fix.sh scripts/deprecated/
mv test-bug1-validation.sh scripts/deprecated/
mv test-bug1-complete.sh scripts/deprecated/
mv test-bug2-fix.sh scripts/deprecated/

# 2. Mover scripts temporários
mv backend/scripts/certify-all-temp.ts scripts/deprecated/
mv scripts/extract-from-backup.sh scripts/deprecated/

# 3. Criar README explicativo
cat > scripts/deprecated/README.md << 'EOF'
# Scripts Obsoletos

Estes scripts foram movidos para cá pois não são mais necessários.

## Motivos

- **test-bug1-*.sh** - Bug já corrigido e validado
- **test-bug2-fix.sh** - Bug já corrigido
- **certify-all-temp.ts** - Versão temporária, substituída
- **extract-from-backup.sh** - Migração já executada

## Cronograma de Remoção

- **Data de Movimentação:** 2026-02-04
- **Data de Remoção:** 2026-03-06 (30 dias)

Se você precisa de algum destes scripts, contate a equipe antes da remoção.
EOF

# 4. Commit
git add .
git commit -m "chore: move obsolete scripts to deprecated/"
```

**Validação:**
- [ ] Scripts movidos para `deprecated/`
- [ ] README criado explicando motivos
- [ ] Documentação atualizada
- [ ] Commit feito

### Fase 3: Consolidar Scripts Duplicados (Dia 3-4)
**Risco:** 🟡 Médio  
**Duração:** 4-6 horas

**Ações:**
1. ✅ Criar script unificado de certificação
2. ✅ Testar todas as funcionalidades
3. ✅ Criar script unificado de testes
4. ✅ Atualizar documentação
5. ✅ Criar aliases temporários

**Comandos:**
```bash
# 1. Criar script unificado de certificação
cat > scripts/certification/certify-all-models.sh << 'EOF'
#!/usr/bin/env bash
# scripts/certification/certify-all-models.sh
# Script unificado para certificação de modelos

# ... (implementação)
EOF
chmod +x scripts/certification/certify-all-models.sh

# 2. Testar
./scripts/certification/certify-all-models.sh --mode=auto
./scripts/certification/certify-all-models.sh --mode=api
./scripts/certification/certify-all-models.sh --mode=direct

# 3. Criar aliases temporários
cat > certify-all-models-auto.sh << 'EOF'
#!/usr/bin/env bash
# DEPRECATED: Use scripts/certification/certify-all-models.sh --mode=auto
echo "⚠️  AVISO: Este script foi consolidado"
echo "⚠️  Use: ./scripts/certification/certify-all-models.sh --mode=auto"
exec scripts/certification/certify-all-models.sh --mode=auto "$@"
EOF
chmod +x certify-all-models-auto.sh

# 4. Commit
git add .
git commit -m "refactor: consolidate certification scripts"
```

**Validação:**
- [ ] Script unificado criado e testado
- [ ] Aliases temporários funcionando
- [ ] Documentação atualizada
- [ ] Commit feito

### Fase 4: Reorganizar Scripts Úteis (Dia 5-7)
**Risco:** 🟡 Médio  
**Duração:** 8-12 horas

**Ações:**
1. ✅ Mover scripts de certificação
2. ✅ Mover scripts de teste
3. ✅ Mover scripts de análise
4. ✅ Reorganizar scripts do backend
5. ✅ Atualizar todas as referências
6. ✅ Testar cada script após mover

**Comandos:**
```bash
# 1. Mover scripts de certificação
mv certify-all-models-auto.sh scripts/certification/
mv certify-all-via-api.sh scripts/certification/
mv certify-all-direct.sh scripts/certification/
mv certify-all-interactive.exp scripts/certification/
mv run-certification.exp scripts/certification/

# 2. Mover scripts de teste
mv test-manage-certifications*.sh scripts/testing/certification/
mv test-grafana-*.sh scripts/testing/grafana/
mv test_validations.sh scripts/testing/validation/
mv test_badge_system.py scripts/testing/validation/
mv test_login_validation.py scripts/testing/validation/
mv test-practical-direct.sh scripts/testing/certification/

# 3. Mover scripts de análise
mv check_grafana_dashboard.py scripts/analysis/

# 4. Reorganizar backend
cd backend/scripts
mkdir -p certification testing database analysis maintenance

# Certificação
mv certify-all-models-direct.ts certification/
mv certify-model.ts certification/

# Testes
mv test-certification-api.sh testing/
mv test-api-fixes.sh testing/
mv test-logs-api.sh testing/

# Banco de dados
mv cleanup-database.sh database/
mv cleanup-database.sql database/
mv add-aws-bedrock.sql database/
mv cleanup-bedrock-models.sql database/
mv fix-bedrock-model-ids.sql database/
mv fix-bedrock-models.sh database/

# Análise
mv analyze-*.ts analysis/

# Manutenção
mv cleanup-*.ts maintenance/
mv clear-*.ts maintenance/

cd ../..

# 5. Atualizar referências
# (Executar script de validação para cada arquivo movido)
./scripts/validate-references.sh certify-all-models-auto.sh scripts/certification/certify-all-models-auto.sh

# 6. Commit
git add .
git commit -m "refactor: reorganize scripts by category"
```

**Validação:**
- [ ] Todos os scripts movidos
- [ ] Caminhos relativos ajustados
- [ ] Referências atualizadas
- [ ] Scripts testados
- [ ] Commit feito

### Fase 5: Atualizar Documentação (Dia 8)
**Risco:** 🟢 Baixo  
**Duração:** 3-4 horas

**Ações:**
1. ✅ Atualizar README.md principal
2. ✅ Atualizar STANDARDS.md
3. ✅ Atualizar guias de usuário
4. ✅ Criar índice de scripts
5. ✅ Atualizar CHANGELOG.md

**Comandos:**
```bash
# 1. Atualizar README.md
# (Editar manualmente)

# 2. Atualizar STANDARDS.md
# (Editar manualmente)

# 3. Criar índice de scripts
cat > scripts/INDEX.md << 'EOF'
# Índice de Scripts MyIA

## Scripts Críticos (Raiz)

- [`start.sh`](../start.sh) - Orquestrador principal
- [`start_interactive.sh`](../start_interactive.sh) - Menu interativo
- [`start_full.sh`](../start_full.sh) - Inicialização completa
- [`manage-certifications.sh`](../manage-certifications.sh) - Gerenciador de certificações

## Certificação

- [`certify-all-models.sh`](certification/certify-all-models.sh) - Certificação unificada
- [`certify-all-models-auto.sh`](certification/certify-all-models-auto.sh) - Certificação automática
- [`certify-all-via-api.sh`](certification/certify-all-via-api.sh) - Certificação via API
- [`certify-all-direct.sh`](certification/certify-all-direct.sh) - Certificação direta
- [`certify-all-interactive.exp`](certification/certify-all-interactive.exp) - Certificação interativa
- [`run-certification.exp`](certification/run-certification.exp) - Executor de certificação

## Testes

### Certificação
- [`test-manage-certifications.sh`](testing/certification/test-manage-certifications.sh)
- [`test-manage-certifications-automated.sh`](testing/certification/test-manage-certifications-automated.sh)
- [`test-manage-certifications-direct.sh`](testing/certification/test-manage-certifications-direct.sh)
- [`test-manage-certifications-practical.sh`](testing/certification/test-manage-certifications-practical.sh)

### Grafana
- [`test-grafana-detection.sh`](testing/grafana/test-grafana-detection.sh)
- [`test-grafana-start-function.sh`](testing/grafana/test-grafana-start-function.sh)

### Validação
- [`test_validations.sh`](testing/validation/test_validations.sh)
- [`test_badge_system.py`](testing/validation/test_badge_system.py)
- [`test_login_validation.py`](testing/validation/test_login_validation.py)

## Análise

- [`check_grafana_dashboard.py`](analysis/check_grafana_dashboard.py)

## Backend

### Certificação
- [`certify-all-models-direct.ts`](../backend/scripts/certification/certify-all-models-direct.ts)
- [`certify-model.ts`](../backend/scripts/certification/certify-model.ts)

### Testes
- [`test-certification-api.sh`](../backend/scripts/testing/test-certification-api.sh)
- [`test-api-fixes.sh`](../backend/scripts/testing/test-api-fixes.sh)
- [`test-logs-api.sh`](../backend/scripts/testing/test-logs-api.sh)

### Banco de Dados
- [`cleanup-database.sh`](../backend/scripts/database/cleanup-database.sh)
- [`fix-bedrock-models.sh`](../backend/scripts/database/fix-bedrock-models.sh)

### Análise
- [`analyze-chat-models-profiles.ts`](../backend/scripts/analysis/analyze-chat-models-profiles.ts)
- [`analyze-file-sizes.ts`](../backend/scripts/analysis/analyze-file-sizes.ts)
- [`analyze-inference-profiles.ts`](../backend/scripts/analysis/analyze-inference-profiles.ts)

### Manutenção
- [`cleanup-all-certifications.ts`](../backend/scripts/maintenance/cleanup-all-certifications.ts)
- [`cleanup-logs.ts`](../backend/scripts/maintenance/cleanup-logs.ts)
EOF

# 4. Commit
git add .
git commit -m "docs: update documentation for script reorganization"
```

**Validação:**
- [ ] README.md atualizado
- [ ] STANDARDS.md atualizado
- [ ] Índice de scripts criado
- [ ] CHANGELOG.md atualizado
- [ ] Commit feito

### Fase 6: Validação Final (Dia 9)
**Risco:** 🟢 Baixo  
**Duração:** 2-3 horas

**Ações:**
1. ✅ Executar todos os testes
2. ✅ Validar scripts críticos
3. ✅ Validar referências
4. ✅ Testar fluxos principais
5. ✅ Documentar resultados

**Comandos:**
```bash
# 1. Executar testes de certificação
./scripts/testing/certification/test-manage-certifications-automated.sh

# 2. Validar scripts críticos
./start.sh status
./start_interactive.sh --help
./start_full.sh --help
./manage-certifications.sh --help

# 3. Validar referências
for script in scripts/**/*.sh; do
  echo "Validando $script..."
  bash -n "$script" || echo "❌ Erro de sintaxe em $script"
done

# 4. Testar fluxos principais
# (Executar manualmente)

# 5. Gerar relatório
cat > REORGANIZATION_REPORT.md << 'EOF'
# Relatório de Reorganização de Scripts

## Data
2026-02-04

## Status
✅ COMPLETO

## Resumo
- Scripts movidos: 45
- Scripts consolidados: 8
- Scripts removidos: 6
- Documentação atualizada: 15 arquivos

## Validação
- ✅ Todos os testes passando
- ✅ Scripts críticos funcionando
- ✅ Referências atualizadas
- ✅ Documentação completa

## Próximos Passos
- Remover aliases temporários após 30 dias
- Deletar scripts deprecated após 30 dias
- Monitorar uso dos novos caminhos
EOF

git add .
git commit -m "docs: add reorganization report"
```

**Validação:**
- [ ] Todos os testes passando
- [ ] Scripts críticos funcionando
- [ ] Referências validadas
- [ ] Relatório criado
- [ ] Commit feito

---

## 6. Checklist de Validação

### 6.1 Para Cada Script Movido

**Antes de Mover:**
- [ ] Backup criado
- [ ] Diretório destino existe
- [ ] Caminhos relativos identificados

**Durante a Movimentação:**
- [ ] Script copiado (não movido)
- [ ] Caminhos relativos ajustados
- [ ] Script testado no novo local
- [ ] Funcionalidade validada

**Após Mover:**
- [ ] Referências em documentação atualizadas
- [ ] Referências em scripts atualizadas
- [ ] Referências em código atualizadas
- [ ] Alias temporário criado (se necessário)
- [ ] Testes executados com sucesso
- [ ] Commit realizado

**Validação Final:**
- [ ] Script funciona no novo local
- [ ] Nenhuma referência ao caminho antigo
- [ ] Documentação atualizada
- [ ] Testes passando

### 6.2 Validação de Referências

**Locais a Verificar:**
```bash
# Documentação
grep -r "script-name.sh" docs/ --exclude-dir=node_modules

# Scripts
grep -r "script-name.sh" . --include="*.sh" --exclude-dir=node_modules

# Código TypeScript
grep -r "script-name.sh" backend/ frontend/ --include="*.ts" --exclude-dir=node_modules

# Código JavaScript
grep -r "script-name.sh" backend/ frontend/ --include="*.js" --exclude-dir=node_modules

# Markdown
grep -r "script-name.sh" . --include="*.md" --exclude-dir=node_modules

# Package.json
grep -r "script-name.sh" . --include="package.json" --exclude-dir=node_modules
```

### 6.3 Testes de Funcionalidade

**Scripts Críticos:**
```bash
# start.sh
./start.sh status
./start.sh start backend
./start.sh stop backend

# start_interactive.sh
./start_interactive.sh
# Testar menu interativo

# start_full.sh
./start_full.sh
# Verificar se todos os serviços iniciam

# manage-certifications.sh
./manage-certifications.sh
# Testar opções do menu
```

**Scripts de Certificação:**
```bash
# Certificação automática
./scripts/certification/certify-all-models-auto.sh

# Certificação via API
./scripts/certification/certify-all-via-api.sh

# Certificação direta
./scripts/certification/certify-all-direct.sh
```

**Scripts de Teste:**
```bash
# Testes de certificação
./scripts/testing/certification/test-manage-certifications-automated.sh

# Testes de Grafana
./scripts/testing/grafana/test-grafana-detection.sh

# Testes de validação
./scripts/testing/validation/test_validations.sh
```

---

## 7. Considerações Especiais

### 7.1 Scripts Referenciados pelo start.sh

**Análise:**
```bash
grep -n "\.sh" start.sh
```

**Scripts Referenciados:**
- Nenhum script externo é chamado diretamente
- `start.sh` é autocontido

**Ação:** Nenhuma ação necessária

### 7.2 Scripts Referenciados pelo start_interactive.sh

**Análise:**
```bash
grep -n "source" start_interactive.sh
```

**Módulos Carregados:**
```bash
source scripts/common/colors.sh
source scripts/common/config.sh
source scripts/common/utils.sh
source scripts/ui/drawing.sh
source scripts/ui/progress.sh
source scripts/ui/menu.sh
source scripts/health/wait.sh
source scripts/health/status.sh
source scripts/logs/viewer.sh
source scripts/services/database.sh
source scripts/services/backend.sh
source scripts/services/frontend.sh
source scripts/services/frontend-admin.sh
source scripts/services/worker.sh
source scripts/services/grafana.sh
```

**Ação:** 
- ✅ Módulos já estão organizados em `scripts/`
- ✅ Nenhuma mudança necessária

### 7.3 Scripts Mencionados em STANDARDS.md

**Análise:**
```bash
grep -n "\.sh" docs/STANDARDS.md
```

**Scripts Mencionados:**
- `start.sh` (múltiplas referências)
- `security-tests.sh` (backend)
- Scripts de teste diversos

**Ação:**
- Atualizar referências para scripts movidos
- Manter referências a scripts críticos

### 7.4 Scripts com Dependências Externas

**Scripts que usam psql:**
```bash
# manage-certifications.sh
check_postgres() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1"
}
```

**Scripts que usam redis-cli:**
```bash
# manage-certifications.sh
check_redis() {
  redis-cli ping
}
```

**Scripts que usam curl:**
```bash
# manage-certifications.sh
api_call() {
  curl -s -X "$method" "$API_URL$endpoint"
}
```

**Ação:**
- Verificar se dependências estão instaladas antes de executar
- Documentar dependências em README.md

### 7.5 Scripts Usados em CI/CD

**Verificação:**
```bash
# Verificar se há arquivos de CI/CD
ls -la .github/workflows/
ls -la .gitlab-ci.yml
ls -la .circleci/
```

**Resultado:** Nenhum arquivo de CI/CD encontrado

**Ação:** Nenhuma ação necessária

---

## 8. Documentação a Criar/Atualizar

### 8.1 Documentos a Criar

**1. scripts/README.md**
```markdown
# Scripts MyIA

Índice de todos os scripts organizados por categoria.

## Estrutura

- `certification/` - Scripts de certificação de modelos
- `testing/` - Scripts de teste
- `maintenance/` - Scripts de manutenção
- `analysis/` - Scripts de análise
- `database/` - Scripts de banco de dados
- `deprecated/` - Scripts obsoletos (serão removidos)

## Scripts Críticos (Raiz)

- `start.sh` - Orquestrador principal
- `start_interactive.sh` - Menu interativo
- `start_full.sh` - Inicialização completa
- `manage-certifications.sh` - Gerenciador de certificações

## Como Usar

Consulte o [Índice Completo](INDEX.md) para lista detalhada de todos os scripts.
```

**2. scripts/INDEX.md**
- Lista completa de todos os scripts
- Descrição de cada script
- Exemplos de uso

**3. scripts/certification/README.md**
```markdown
# Scripts de Certificação

Scripts para certificar modelos de IA.

## Scripts Disponíveis

- `certify-all-models.sh` - Script unificado (recomendado)
- `certify-all-models-auto.sh` - Certificação automática
- `certify-all-via-api.sh` - Certificação via API
- `certify-all-direct.sh` - Certificação direta
- `certify-all-interactive.exp` - Certificação interativa (expect)
- `run-certification.exp` - Executor de certificação (expect)

## Uso

### Certificação Automática
\`\`\`bash
./scripts/certification/certify-all-models-auto.sh
\`\`\`

### Certificação via API
\`\`\`bash
./scripts/certification/certify-all-via-api.sh
\`\`\`

### Certificação Direta
\`\`\`bash
./scripts/certification/certify-all-direct.sh
\`\`\`

## Requisitos

- Backend rodando
- Redis acessível
- PostgreSQL acessível
- Credenciais AWS configuradas
```

**4. scripts/testing/README.md**
```markdown
# Scripts de Teste

Scripts para testar funcionalidades do sistema.

## Estrutura

- `bugs/` - Testes de bugs específicos
- `certification/` - Testes de certificação
- `grafana/` - Testes de Grafana
- `validation/` - Testes de validação
- `login/` - Testes de login

## Como Executar

### Testes de Certificação
\`\`\`bash
./scripts/testing/certification/test-manage-certifications-automated.sh
\`\`\`

### Testes de Grafana
\`\`\`bash
./scripts/testing/grafana/test-grafana-detection.sh
\`\`\`

### Testes de Validação
\`\`\`bash
./scripts/testing/validation/test_validations.sh
\`\`\`
```

**5. scripts/deprecated/README.md**
```markdown
# Scripts Obsoletos

Estes scripts foram movidos para cá pois não são mais necessários.

## Motivos

- **test-bug1-*.sh** - Bug já corrigido e validado
- **test-bug2-fix.sh** - Bug já corrigido
- **certify-all-temp.ts** - Versão temporária, substituída
- **extract-from-backup.sh** - Migração já executada

## Cronograma de Remoção

- **Data de Movimentação:** 2026-02-04
- **Data de Remoção:** 2026-03-06 (30 dias)

Se você precisa de algum destes scripts, contate a equipe antes da remoção.
```

**6. backend/scripts/README.md**
```markdown
# Scripts do Backend

Scripts específicos do backend organizados por categoria.

## Estrutura

- `certification/` - Scripts de certificação
- `testing/` - Scripts de teste
- `database/` - Scripts de banco de dados
- `analysis/` - Scripts de análise
- `maintenance/` - Scripts de manutenção

## Uso

### Certificação
\`\`\`bash
npx tsx backend/scripts/certification/certify-model.ts
\`\`\`

### Testes
\`\`\`bash
bash backend/scripts/testing/test-certification-api.sh
\`\`\`

### Banco de Dados
\`\`\`bash
bash backend/scripts/database/cleanup-database.sh
\`\`\`

### Análise
\`\`\`bash
npx tsx backend/scripts/analysis/analyze-file-sizes.ts
\`\`\`

### Manutenção
\`\`\`bash
npx tsx backend/scripts/maintenance/cleanup-logs.ts
\`\`\`
```

### 8.2 Documentos a Atualizar

**1. README.md (Raiz)**
- Atualizar seção "Como Rodar"
- Atualizar referências a scripts
- Adicionar link para `scripts/INDEX.md`

**2. docs/STANDARDS.md**
- Atualizar referências a scripts
- Adicionar seção sobre organização de scripts
- Referenciar `docs/guides/script-organization-standard.md`

**3. docs/guides/script-organization-standard.md**
- Adicionar exemplo da estrutura implementada
- Documentar decisões tomadas
- Adicionar lições aprendidas

**4. docs/guides/start-interactive-guide.md**
- Atualizar caminhos de scripts
- Atualizar exemplos

**5. docs/guides/getting-started.md**
- Atualizar comandos de teste
- Atualizar referências a scripts

**6. docs/certification/guides/QUICK-START-MANAGE-CERTIFICATIONS.md**
- Atualizar caminhos de scripts de teste
- Atualizar exemplos

**7. CHANGELOG.md**
```markdown
## [Unreleased]

### Changed
- Reorganização completa de scripts por categoria
- Scripts movidos para `scripts/` organizado por função
- Scripts do backend reorganizados em subdiretórios
- Documentação atualizada para refletir nova estrutura

### Deprecated
- Scripts de bugs antigos movidos para `scripts/deprecated/`
- Scripts temporários movidos para `scripts/deprecated/`
- Aliases temporários criados (serão removidos em 30 dias)

### Removed
- (Nenhum script removido ainda - aguardando período de 30 dias)
```

---

## 9. Métricas de Sucesso

### 9.1 Métricas Quantitativas

**Antes da Reorganização:**
- Scripts na raiz: 20+
- Scripts no backend/scripts: 80+
- Scripts duplicados: 8
- Scripts obsoletos: 6
- Diretórios de scripts: 1 (backend/scripts)

**Após a Reorganização:**
- Scripts na raiz: 4 (apenas críticos)
- Scripts organizados: 100+
- Scripts duplicados: 0 (consolidados)
- Scripts obsoletos: 0 (movidos para deprecated)
- Diretórios de scripts: 10+ (organizados por categoria)

**Redução de Complexidade:**
- Redução de 80% de scripts na raiz
- 100% de scripts duplicados consolidados
- 100% de scripts obsoletos identificados
- 10x mais organização (1 → 10+ diretórios categorizados)

### 9.2 Métricas Qualitativas

**Facilidade de Uso:**
- ✅ Fácil encontrar o script correto
- ✅ Estrutura intuitiva por categoria
- ✅ Documentação clara em cada diretório
- ✅ Índice completo de scripts

**Manutenibilidade:**
- ✅ Scripts organizados por função
- ✅ Fácil adicionar novos scripts
- ✅ Fácil identificar scripts obsoletos
- ✅ Fácil consolidar scripts duplicados

**Segurança:**
- ✅ Scripts críticos protegidos (permanecem na raiz)
- ✅ Rollback possível
- ✅ Validação em cada etapa
- ✅ Backup completo

### 9.3 Critérios de Sucesso

**Obrigatórios:**
- [ ] Todos os scripts críticos funcionando
- [ ] Nenhum teste quebrado
- [ ] Documentação completa
- [ ] Rollback testado

**Desejáveis:**
- [ ] 100% de scripts organizados
- [ ] 0 scripts duplicados
- [ ] 0 scripts obsoletos na raiz
- [ ] Índice completo de scripts

**Bônus:**
- [ ] Scripts consolidados com flags
- [ ] Aliases temporários para compatibilidade
- [ ] Guia de migração para desenvolvedores
- [ ] Lições aprendidas documentadas

---

## 10. Rollback Plan

### 10.1 Estratégia de Rollback

**Princípio:** Cada fase pode ser revertida independentemente.

**Ferramentas:**
- Git (commits por fase)
- Backup completo (tar.gz)
- Scripts de rollback automatizados

### 10.2 Rollback por Fase

**Fase 1: Preparação**
```bash
# Remover estrutura de diretórios
git revert <commit-hash>
rm -rf scripts/
```

**Fase 2: Remover Scripts Obsoletos**
```bash
# Restaurar scripts de deprecated/
git revert <commit-hash>
mv scripts/deprecated/* .
```

**Fase 3: Consolidar Scripts Duplicados**
```bash
# Remover scripts consolidados
git revert <commit-hash>
rm scripts/certification/certify-all-models.sh
# Restaurar scripts originais do backup
```

**Fase 4: Reorganizar Scripts Úteis**
```bash
# Mover scripts de volta para raiz
git revert <commit-hash>
mv scripts/**/*.sh .
mv scripts/**/*.py .
mv scripts/**/*.exp .
```

**Fase 5: Atualizar Documentação**
```bash
# Reverter documentação
git revert <commit-hash>
```

**Fase 6: Validação Final**
```bash
# Remover relatório
git revert <commit-hash>
rm REORGANIZATION_REPORT.md
```

### 10.3 Rollback Completo

**Opção 1: Git Reset**
```bash
# Voltar para commit antes da reorganização
git log --oneline | grep "before reorganization"
git reset --hard <commit-hash>
```

**Opção 2: Restaurar Backup**
```bash
# Extrair backup completo
tar -xzf myia-backup-20260204.tar.gz -C /tmp/myia-restore
# Copiar scripts de volta
cp -r /tmp/myia-restore/*.sh .
cp -r /tmp/myia-restore/backend/scripts/* backend/scripts/
```

**Opção 3: Script de Rollback Automatizado**
```bash
#!/usr/bin/env bash
# scripts/rollback-reorganization.sh
# Reverte reorganização de scripts

echo "🔄 Iniciando rollback da reorganização..."

# 1. Reverter commits
git revert --no-commit <commit-range>

# 2. Restaurar estrutura antiga
mv scripts/**/*.sh .
mv scripts/**/*.py .
mv scripts/**/*.exp .

# 3. Remover estrutura nova
rm -rf scripts/certification
rm -rf scripts/testing
rm -rf scripts/maintenance
rm -rf scripts/analysis
rm -rf scripts/database
rm -rf scripts/deprecated

# 4. Commit rollback
git commit -m "revert: rollback script reorganization"

echo "✅ Rollback completo!"
```

### 10.4 Validação Pós-Rollback

**Checklist:**
- [ ] Scripts críticos funcionando
- [ ] Testes passando
- [ ] Documentação consistente
- [ ] Nenhum erro de referência

**Comandos de Validação:**
```bash
# Testar scripts críticos
./start.sh status
./start_interactive.sh --help
./manage-certifications.sh --help

# Executar testes
./test-manage-certifications-automated.sh

# Verificar sintaxe
for script in *.sh; do
  bash -n "$script" || echo "❌ Erro em $script"
done
```

---

## 11. Próximos Passos

### 11.1 Após Implementação (Dia 10+)

**Semana 1-2:**
- Monitorar uso dos novos caminhos
- Coletar feedback de desenvolvedores
- Ajustar documentação conforme necessário
- Corrigir problemas identificados

**Semana 3-4:**
- Remover aliases temporários
- Deletar scripts deprecated
- Atualizar CHANGELOG.md
- Criar post-mortem

### 11.2 Melhorias Futuras

**Curto Prazo (1-2 meses):**
- Criar script de validação automática
- Adicionar testes de integração para scripts
- Documentar padrões de criação de novos scripts
- Criar template para novos scripts

**Médio Prazo (3-6 meses):**
- Implementar CI/CD para scripts
- Adicionar linting para scripts bash
- Criar biblioteca de funções compartilhadas
- Implementar versionamento de scripts

**Longo Prazo (6-12 meses):**
- Migrar scripts bash para TypeScript (onde faz sentido)
- Criar CLI unificado para todos os scripts
- Implementar telemetria de uso de scripts
- Criar dashboard de status de scripts

---

## 12. Conclusão

### 12.1 Resumo

Este plano fornece uma estratégia completa, segura e incremental para reorganizar os ~120+ scripts da aplicação MyIA. A abordagem em fases permite:

✅ **Segurança:** Scripts críticos permanecem funcionais  
✅ **Rastreabilidade:** Todas as mudanças são documentadas  
✅ **Reversibilidade:** Rollback é possível em qualquer fase  
✅ **Incremental:** Pode ser executado em etapas  
✅ **Documentado:** Cada mudança é explicada

### 12.2 Benefícios Esperados

**Organização:**
- 80% redução de scripts na raiz
- 100% de scripts categorizados
- 10x mais diretórios organizados

**Manutenibilidade:**
- Fácil encontrar scripts
- Fácil adicionar novos scripts
- Fácil identificar scripts obsoletos

**Qualidade:**
- 0 scripts duplicados
- 0 scripts obsoletos na raiz
- Documentação completa

### 12.3 Riscos Mitigados

**Risco 1: Quebrar scripts críticos**
- Mitigação: Scripts críticos permanecem na raiz

**Risco 2: Perder referências**
- Mitigação: Validação automática de referências

**Risco 3: Confundir desenvolvedores**
- Mitigação: Documentação clara + aliases temporários

**Risco 4: Perder funcionalidade**
- Mitigação: Testes em cada fase + rollback preparado

### 12.4 Próximas Ações

**Imediato:**
1. Revisar e aprovar este plano
2. Criar backup completo
3. Iniciar Fase 1 (Preparação)

**Curto Prazo:**
1. Executar Fases 2-6
2. Validar resultados
3. Coletar feedback

**Médio Prazo:**
1. Remover aliases temporários
2. Deletar scripts deprecated
3. Implementar melhorias futuras

---

## 📚 Referências

- [Script Organization Standard](../docs/guides/script-organization-standard.md)
- [STANDARDS.md](../docs/STANDARDS.md)
- [Start Interactive Guide](../docs/guides/start-interactive-guide.md)
- [Manage Certifications Guide](../docs/certification/guides/README-MANAGE-CERTIFICATIONS.md)

---

## 📝 Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0.0 | 2026-02-04 | Architect Mode | Versão inicial do plano |

---

## ✅ Aprovação

**Status:** 🟡 AGUARDANDO APROVAÇÃO

**Aprovadores:**
- [ ] Tech Lead
- [ ] DevOps Lead
- [ ] Product Owner

**Data de Aprovação:** _____________________

**Assinatura:** _____________________

---

**Fim do Documento**