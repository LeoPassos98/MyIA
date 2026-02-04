# 📜 Padrão de Organização de Scripts

> **Status:** Proposta para inclusão no [STANDARDS.md](docs/STANDARDS.md)  
> **Data:** 2026-02-03  
> **Autor:** Leonardo  
> **Versão:** 1.0

---

## 🎯 Princípio Fundamental

**Scripts devem estar o mais próximo da raiz quanto possível, a menos que seu escopo seja exclusivo de um subsistema específico.**

---

## 📂 Estrutura de Diretórios

```
MyIA/
├── scripts/                    # ← Scripts multi-contexto (escopo global)
│   ├── frontend/              # Scripts específicos do frontend
│   ├── backend/               # Scripts específicos do backend
│   ├── certification/         # Scripts de certificação de modelos
│   ├── aws/                   # Scripts de integração AWS
│   ├── observability/         # Scripts de Grafana/Loki/Promtail
│   ├── database/              # Scripts de migração/seed/backup
│   └── deployment/            # Scripts de deploy/CI/CD
│
├── start_interactive.sh       # ← Orquestrador principal (raiz)
├── start.sh                   # ← Starter simples (raiz)
├── start_full.sh              # ← Starter completo (raiz)
│
├── frontend/                  # Código-fonte do frontend
│   └── scripts/              # ← Scripts EXCLUSIVOS do frontend
│       └── build-optimize.sh  # (escopo mínimo = frontend)
│
├── backend/                   # Código-fonte do backend
│   └── scripts/              # ← Scripts EXCLUSIVOS do backend
│       └── prisma-reset.sh    # (escopo mínimo = backend)
│
└── observability/             # Stack de observabilidade
    ├── start.sh              # Script local (escopo = observability)
    └── validate.sh
```

---

## 📋 Regras de Localização

### Regra 1: Scripts na Raiz (`/`)

**Quando usar:**
- Script **orquestra múltiplos subsistemas**
- Script é **ponto de entrada principal** da aplicação
- Script **não tem dependências específicas** de uma pasta

**Exemplos:**
- ✅ `start_interactive.sh` - inicia TODOS os serviços
- ✅ `start.sh` - starter simples (backend + frontend)
- ✅ `stop.sh` - para todos os serviços

### Regra 2: Scripts em `/scripts/<contexto>/`

**Quando usar:**
- Script **lida com múltiplos arquivos** de um contexto
- Script **pode ser chamado de fora** do contexto
- Script **não precisa estar dentro do código-fonte**

**Exemplos:**
```bash
scripts/
├── frontend/
│   ├── start-frontend.sh      # Inicia frontend
│   └── health-check.sh        # Verifica saúde do frontend
├── backend/
│   ├── start-backend.sh       # Inicia backend
│   └── health-check.sh        # Verifica saúde do backend
├── certification/
│   ├── certify-all-models.sh  # Certifica todos os modelos
│   └── generate-report.sh     # Gera relatório de certificações
└── aws/
    ├── setup-bedrock.sh       # Configura AWS Bedrock
    └── test-credentials.sh    # Testa credenciais AWS
```

### Regra 3: Scripts em `/<subsistema>/scripts/`

**Quando usar:**
- Script **só funciona dentro do contexto** do subsistema
- Script **depende de arquivos locais** (package.json, tsconfig.json, etc)
- Script **nunca é chamado de fora** do subsistema

**Exemplos:**
```bash
frontend/scripts/
└── build-optimize.sh    # Usa package.json local, webpack.config, etc

backend/scripts/
├── prisma-reset.sh      # Depende de schema.prisma local
└── seed-dev-data.sh     # Acessa ./prisma/seed.ts
```

---

## 🚦 Fluxograma de Decisão

```
Script a ser criado
       ↓
Orquestra múltiplos subsistemas?
   ├── SIM → Raiz (/)
   └── NÃO → Qual contexto?
              ├── Frontend → scripts/frontend/
              ├── Backend → scripts/backend/
              ├── Certificação → scripts/certification/
              ├── AWS → scripts/aws/
              └── Outro → scripts/<contexto>/
                          ↓
              Depende de arquivos locais do subsistema?
                  ├── SIM → <subsistema>/scripts/
                  └── NÃO → scripts/<contexto>/
```

---

## 📊 Comparação Antes/Depois

### ❌ Antes (Desorganizado)

```
MyIA/
├── start.sh
├── start_interactive.sh
├── start_full.sh
├── certify-all-models-auto.sh
├── certify-all-via-api.sh
├── certify-all-direct.sh
├── manage-certifications.sh
├── test-bug1-fix.sh
├── test-manage-certifications.sh
├── check_grafana_dashboard.py
└── ... (20+ scripts na raiz)
```

**Problemas:**
- 🔴 Raiz poluída com 20+ scripts
- 🔴 Difícil encontrar scripts relacionados
- 🔴 Sem separação de contexto
- 🔴 Scripts de teste misturados com produção

### ✅ Depois (Organizado)

```
MyIA/
├── scripts/
│   ├── certification/
│   │   ├── certify-all-models.sh
│   │   ├── certify-via-api.sh
│   │   └── manage-certifications.sh
│   ├── frontend/
│   │   ├── start-frontend.sh
│   │   └── health-check.sh
│   ├── backend/
│   │   ├── start-backend.sh
│   │   └── health-check.sh
│   ├── observability/
│   │   └── check-grafana-dashboard.py
│   └── testing/
│       ├── test-bug-fix.sh
│       └── test-certifications.sh
│
├── start_interactive.sh  # Orquestrador principal
├── start.sh              # Starter simples
└── stop.sh               # Stopper global
```

**Benefícios:**
- ✅ Raiz limpa (apenas orquestradores)
- ✅ Scripts agrupados por contexto
- ✅ Fácil navegação e manutenção
- ✅ Separação clara de responsabilidades

---

## 🔍 Exemplos Práticos

### Exemplo 1: Script de Certificação

**Arquivo:** `certify-all-models-auto.sh`

**Análise:**
- ❓ Orquestra múltiplos subsistemas? **NÃO** (só certificação)
- ❓ Contexto principal? **Certificação**
- ❓ Depende de arquivos locais? **NÃO** (usa API remota)

**Decisão:** `scripts/certification/certify-all-models.sh`

### Exemplo 2: Script de Prisma Reset

**Arquivo:** `prisma-reset.sh`

**Análise:**
- ❓ Orquestra múltiplos subsistemas? **NÃO** (só backend)
- ❓ Contexto principal? **Backend**
- ❓ Depende de arquivos locais? **SIM** (schema.prisma, .env)

**Decisão:** `backend/scripts/prisma-reset.sh`

### Exemplo 3: Script de Inicialização Interativa

**Arquivo:** `start_interactive.sh`

**Análise:**
- ❓ Orquestra múltiplos subsistemas? **SIM** (todos os 6 serviços)
- ❓ Ponto de entrada principal? **SIM**

**Decisão:** `start_interactive.sh` (raiz)

---

## 📏 Tamanho de Arquivos

**Aplicam-se as regras do [STANDARDS.md § 15](docs/STANDARDS.md#15-tamanho-de-arquivos-e-manutenibilidade):**

- ✅ **Recomendado:** ≤250 linhas
- ⚠️ **Warning:** >300 linhas
- 🚫 **Bloqueado:** >400 linhas

**Se um script exceder 400 linhas, DEVE ser modularizado.**

---

## 🎯 Checklist de Conformidade

Antes de criar/mover um script:

- [ ] Script está no local correto segundo as regras acima?
- [ ] Nome do arquivo é descritivo? (ex: `start-frontend.sh` não `start.sh`)
- [ ] Script tem header obrigatório? (caminho + referência ao STANDARDS.md)
- [ ] Script tem permissão de execução? (`chmod +x`)
- [ ] Script está documentado? (comentários explicativos)
- [ ] Script respeita limite de 400 linhas?
- [ ] Script tem shebang? (`#!/usr/bin/env bash`)

---

## 🔧 Migração de Scripts Existentes

### Fase 1: Auditoria (Fazer ANTES de mover)

```bash
# Listar todos os scripts na raiz
find . -maxdepth 1 -type f -name "*.sh" -o -name "*.py" | sort

# Contar scripts por tipo
echo "Certificação: $(ls certify-*.sh 2>/dev/null | wc -l)"
echo "Testes: $(ls test-*.sh 2>/dev/null | wc -l)"
echo "Inicialização: $(ls start*.sh 2>/dev/null | wc -l)"
```

### Fase 2: Criação da Estrutura

```bash
mkdir -p scripts/{frontend,backend,certification,aws,observability,database,deployment,testing}
```

### Fase 3: Migração Gradual

**Prioridade ALTA (Fazer primeiro):**
```bash
# Scripts de certificação (muitos na raiz)
mv certify-*.sh scripts/certification/
mv manage-certifications.sh scripts/certification/

# Scripts de teste (poluição)
mv test-*.sh scripts/testing/
```

**Prioridade MÉDIA:**
```bash
# Scripts de observabilidade
mv check_grafana_dashboard.py scripts/observability/
```

**Prioridade BAIXA (Manter na raiz):**
```bash
# Orquestradores principais (NÃO MOVER)
# start_interactive.sh
# start.sh
# start_full.sh
# stop.sh
```

---

## 🚨 Anti-Padrões (Evitar)

### ❌ Anti-Padrão 1: Tudo na Raiz
```
MyIA/
├── script1.sh
├── script2.sh
├── script3.sh
... (20+ arquivos)
```

### ❌ Anti-Padrão 2: Scripts sem Contexto
```
scripts/
├── script1.sh
├── script2.sh
└── utils.sh
```

### ❌ Anti-Padrão 3: Duplicação de Lógica
```
frontend/scripts/health-check.sh       # 50 linhas
backend/scripts/health-check.sh        # 50 linhas (mesmo código!)
```
**Solução:** Criar `scripts/common/health-check.sh` e reutilizar.

---

## 🎓 Justificativa da Regra

### Problema Identificado

O projeto MyIA tinha **20+ scripts na raiz**, dificultando:
- 🔴 Navegação (`ls` retorna 50+ itens)
- 🔴 Manutenção (qual script faz o quê?)
- 🔴 Onboarding (novos devs não sabem por onde começar)

### Solução Proposta

Organizar por **contexto funcional** (não técnico):
- ✅ `scripts/certification/` - todos os scripts de certificação juntos
- ✅ `scripts/frontend/` - scripts de frontend isolados
- ✅ Raiz limpa - apenas orquestradores principais

### Benefícios Esperados

1. **Navegabilidade:** `ls scripts/certification/` mostra só certificações
2. **Descoberta:** Novos devs sabem onde procurar
3. **Manutenção:** Scripts relacionados estão próximos
4. **Escalabilidade:** Fácil adicionar novos contextos

---

## 📝 Avaliação para Inclusão no STANDARDS.md

### ✅ Argumentos A Favor

1. **Consistência:** Define regra clara de onde colocar scripts
2. **Escalabilidade:** Estrutura cresce organicamente
3. **Manutenibilidade:** Reduz poluição da raiz
4. **Onboarding:** Novos devs entendem a estrutura rapidamente
5. **Precedente:** Outras seções do STANDARDS.md cobrem organização de código

### ⚠️ Argumentos Contra

1. **Complexidade:** Mais uma regra para seguir
2. **Migração:** Requer mover 20+ scripts existentes
3. **Subjetividade:** "Contexto" pode ser ambíguo em alguns casos
4. **Overhead:** Criar subpastas para 1-2 scripts parece excessivo

### 🎯 Recomendação Final

**SIM, deve ir para STANDARDS.md** como nova seção **§16: Organização de Scripts**.

**Motivos:**
1. ✅ Problema real identificado (20+ scripts na raiz)
2. ✅ Solução escalável e testável
3. ✅ Benefícios claros de manutenibilidade
4. ✅ Alinhado com filosofia do STANDARDS.md (ordem e previsibilidade)
5. ✅ Fácil de validar via pre-commit hook (contar scripts na raiz)

**Sugestão de Pre-Commit Hook:**
```bash
# Bloquear commit se > 10 scripts na raiz (excluindo orquestradores)
ROOT_SCRIPTS=$(find . -maxdepth 1 -type f \( -name "*.sh" -o -name "*.py" \) ! -name "start*.sh" ! -name "stop.sh" | wc -l)
if [ $ROOT_SCRIPTS -gt 10 ]; then
  echo "❌ Muitos scripts na raiz ($ROOT_SCRIPTS). Mova para scripts/<contexto>/"
  exit 1
fi
```

---

## 📚 Referências

- [STANDARDS.md § 1 - Convenções de Arquivos](docs/STANDARDS.md#1-convenções-de-arquivos-header-obrigatório)
- [STANDARDS.md § 15 - Tamanho de Arquivos](docs/STANDARDS.md#15-tamanho-de-arquivos-e-manutenibilidade)
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)

---

**Versão:** 1.0  
**Última Atualização:** 2026-02-03  
**Status:** 🟡 Proposta (aguardando aprovação para inclusão no STANDARDS.md)
