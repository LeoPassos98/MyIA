# start.sh - Gerenciador de Processos MyIA

Script de gerenciamento de processos para iniciar, parar e monitorar backend e frontend do MyIA.

## 📋 Índice

- [Uso Básico](#uso-básico)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Quality Gates](#quality-gates)
- [Logs](#logs)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Uso Básico

```bash
./start.sh <comando> <alvo>
```

**Comandos:** `start`, `stop`, `restart`, `status`  
**Alvos:** `backend`, `frontend`, `both`

---

## 📖 Comandos Disponíveis

### Start (Iniciar)

```bash
# Iniciar ambos (backend + frontend)
./start.sh start both

# Iniciar apenas backend
./start.sh start backend

# Iniciar apenas frontend
./start.sh start frontend
```

**O que acontece:**
1. ✅ Valida Node.js instalado
2. 🔍 Executa Quality Gates (ESLint + TypeScript)
3. 📦 Verifica/instala dependências
4. 🧹 Libera portas ocupadas
5. 🚀 Inicia processo em background
6. ⏳ Aguarda servidor responder
7. 📝 Salva logs em `logs/`

### Stop (Parar)

```bash
# Parar ambos
./start.sh stop both

# Parar apenas backend
./start.sh stop backend

# Parar apenas frontend
./start.sh stop frontend
```

**O que acontece:**
1. 🔍 Localiza processos (PID file + porta)
2. 🌳 Mata árvore completa de processos
3. 🧹 Libera portas
4. 🗑️ Remove PID files

### Restart (Reiniciar)

```bash
# Reiniciar ambos
./start.sh restart both

# Reiniciar apenas backend
./start.sh restart backend
```

**Equivalente a:** `stop` + `start`

### Status (Verificar)

```bash
./start.sh status
```

**Mostra:**
- ✅/❌ Status de cada servidor (rodando/parado)
- 🔢 PID do processo
- 🌐 URL de acesso
- ⚠️ Portas ocupadas por outros processos
- 📝 Localização dos logs

---

## 🔍 Quality Gates

**Executado automaticamente no `start backend` ou `start both`**

### O que valida?

1. **ESLint** - Verifica erros de código
2. **TypeScript** - Verifica erros de tipo

### Comportamento

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Quality Gates - Validação Pré-Start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Verificando ESLint...
✅ ESLint passou (0 errors)
🔧 Verificando TypeScript...
✅ TypeScript passou (0 errors)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Se falhar:**
- ⚠️ Mostra aviso
- ⚠️ Sugere comando para corrigir
- ✅ **Continua mesmo assim** (não bloqueia)

**Diferença do Git Hook:**
- **Git Hook**: BLOQUEIA commit se falhar
- **start.sh**: AVISA mas continua

---

## 📝 Logs

### Localização

```
logs/
├── backend.pid          # PID do processo backend
├── backend.out.log      # Saída padrão (stdout)
├── backend.err.log      # Erros (stderr)
├── frontend.pid         # PID do processo frontend
├── frontend.out.log     # Saída padrão
└── frontend.err.log     # Erros
```

### Visualizar Logs em Tempo Real

```bash
# Backend
tail -f logs/backend.out.log
tail -f logs/backend.err.log

# Frontend
tail -f logs/frontend.out.log
tail -f logs/frontend.err.log

# Ambos (erros)
tail -f logs/*.err.log
```

### Limpar Logs

```bash
rm -rf logs/*.log
```

---

## 🔧 Configuração

### Portas

```bash
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

**Para alterar:** Edite as variáveis no início do `start.sh`

### Timeouts

```bash
max_wait=30  # Segundos para aguardar servidor iniciar
```

**Localização:** Função `wait_for_server()`

---

## 🐛 Troubleshooting

### Problema: "Porta já em uso"

```bash
# Verificar o que está usando a porta
lsof -ti:3001  # Backend
lsof -ti:3000  # Frontend

# O script já faz isso automaticamente!
# Mas se precisar matar manualmente:
kill -9 $(lsof -ti:3001)
```

### Problema: "Servidor não responde"

```bash
# 1. Verificar logs de erro
tail -f logs/backend.err.log

# 2. Verificar se dependências estão instaladas
cd backend && npm install
cd frontend && npm install

# 3. Verificar variáveis de ambiente
cat backend/.env
```

### Problema: "Quality Gates falhando"

```bash
# Executar manualmente para ver erros
npm run lint
npm run type-check

# Corrigir erros automaticamente (quando possível)
npm run lint:fix
```

### Problema: "Processo não para"

```bash
# Matar processos manualmente
./start.sh stop both

# Se não funcionar, força kill nas portas
kill -9 $(lsof -ti:3001)
kill -9 $(lsof -ti:3000)

# Remover PID files órfãos
rm -f logs/*.pid
```

### Problema: "Node.js não encontrado"

```bash
# Verificar instalação
node --version
npm --version

# Se não instalado, instalar Node.js 22+
# https://nodejs.org/
```

---

## 🎯 Exemplos de Uso

### Desenvolvimento Normal

```bash
# Iniciar tudo
./start.sh start both

# Trabalhar...

# Ver status
./start.sh status

# Parar tudo ao final do dia
./start.sh stop both
```

### Desenvolvimento Backend Only

```bash
# Iniciar apenas backend
./start.sh start backend

# Testar API
curl http://localhost:3001/api/health

# Reiniciar após mudanças
./start.sh restart backend
```

### Debug de Problemas

```bash
# Parar tudo
./start.sh stop both

# Ver logs de erro
tail -f logs/backend.err.log

# Iniciar backend com logs visíveis
cd backend && npm run dev
# (Ctrl+C para parar)

# Depois voltar ao normal
./start.sh start both
```

---

## 🔄 Fluxo de Execução

### Start Backend

```
1. ensure_node()           → Valida Node.js instalado
2. run_quality_gates()     → ESLint + TypeScript
3. check_dependencies()    → Verifica node_modules
4. kill_port()             → Libera porta 3001
5. npm run dev (background)→ Inicia servidor
6. wait_for_server()       → Aguarda resposta (30s)
7. ✅ Sucesso              → Mostra URL e PID
```

### Stop Backend

```
1. kill_port()             → Mata processos na porta 3001
2. kill_process_tree()     → Mata PID e filhos
3. rm PID file             → Remove logs/backend.pid
4. ✅ Parado               → Confirma
```

---

## 📊 Códigos de Saída

| Código | Significado |
|--------|-------------|
| `0` | Sucesso |
| `1` | Erro de uso (argumentos inválidos) |
| `2` | Node.js não encontrado |

---

## 🎨 Cores no Output

| Cor | Uso |
|-----|-----|
| 🟢 Verde | Sucesso, confirmações |
| 🟡 Amarelo | Avisos, ações em progresso |
| 🔴 Vermelho | Erros |
| 🔵 Azul | Informações, títulos |

---

## 🔗 Referências

- [Node.js Documentation](https://nodejs.org/docs/)
- [Process Management](https://nodejs.org/api/process.html)
- [STANDARDS.md - Quality Gates](docs/STANDARDS.md#144-checklist-pré-commit)
- [Git Hooks Documentation](.husky/README.md)

---

## 📝 Notas Técnicas

### Gerenciamento de Processos

- Usa `&` para rodar em background
- Salva PID em arquivo para controle
- Mata árvore completa (processo + filhos)
- Usa `lsof` para verificar portas

### Segurança

- Timeout de 30s para evitar travamento
- Cleanup automático de processos órfãos
- Validação de Node.js antes de executar
- Logs separados (stdout/stderr)

### Compatibilidade

- ✅ Linux
- ✅ macOS
- ❌ Windows (use WSL ou Git Bash)

---

**Última atualização:** 2024-01-15  
**Versão:** 2.0 (com Quality Gates)
