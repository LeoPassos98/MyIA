# Git Hooks - MyIA

## O que são Git Hooks?

Git Hooks são scripts automáticos que executam em momentos específicos do fluxo Git (antes de commit, push, etc).

## Hooks Configurados

### Pre-Commit Hook

**Localização:** `.husky/pre-commit`

**Executa automaticamente antes de cada commit:**

1. ✅ **ESLint** - Valida código (0 errors obrigatório)
2. ✅ **TypeScript** - Verifica tipos (0 errors obrigatório)

**Se algum teste falhar, o commit é BLOQUEADO.**

## Como Funciona?

```bash
# Você tenta commitar
git add .
git commit -m "feat: nova feature"

# Git AUTOMATICAMENTE executa:
# 1. .husky/pre-commit
# 2. npm run lint
# 3. npm run type-check
# 4. Se tudo passar → commit criado ✅
# 5. Se falhar → commit bloqueado ❌
```

## Instalação (Automática)

Os hooks são instalados automaticamente quando você roda:

```bash
npm install  # Executa "prepare": "husky" automaticamente
```

## Bypass (Emergências)

**⚠️ Use apenas em emergências!**

```bash
# Pular validação (NÃO RECOMENDADO)
git commit -m "fix: hotfix urgente" --no-verify
```

## Validação Manual

Você pode executar os mesmos testes manualmente:

```bash
# ESLint
npm run lint

# TypeScript
npm run type-check

# Ambos
npm run lint && npm run type-check
```

## Quality Gates no start.sh

O script `start.sh` também executa validações antes de iniciar a aplicação:

```bash
./start.sh start both
# Executa automaticamente:
# - npm run lint
# - npm run type-check
# - Inicia backend e frontend
```

**Diferença:**
- **Git Hooks**: BLOQUEIA commits ruins
- **start.sh**: AVISA sobre problemas mas continua

## Troubleshooting

### Hook não está executando

```bash
# Reinstalar hooks
npm run prepare

# Verificar permissões
chmod +x .husky/pre-commit
```

### Erro "husky command not found"

```bash
# Reinstalar Husky
npm install --save-dev husky
npm run prepare
```

### Desabilitar temporariamente

```bash
# Método 1: Usar --no-verify
git commit -m "mensagem" --no-verify

# Método 2: Desabilitar Husky (não recomendado)
export HUSKY=0
git commit -m "mensagem"
unset HUSKY
```

## Benefícios

✅ **Previne bugs** - Erros pegos antes do commit  
✅ **Mantém qualidade** - Código sempre compilável  
✅ **Economiza tempo** - Evita debug de erros bobos  
✅ **Padroniza** - Todos seguem as mesmas regras  
✅ **CI/CD ready** - Facilita automação futura

## Referências

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [STANDARDS.md - Seção 14.4](../docs/STANDARDS.md#144-checklist-pré-commit)
