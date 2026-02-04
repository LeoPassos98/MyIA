# 🚀 Guia de Scripts de Inicialização MyIA

Este guia documenta os scripts de inicialização disponíveis para o sistema MyIA.

---

## 📋 Visão Geral

O sistema MyIA possui **3 scripts de inicialização** diferentes, cada um com um propósito específico:

| Script | Propósito | Quando Usar |
|--------|-----------|-------------|
| [`start.sh`](../start.sh) | Inicialização básica (Backend + Frontend) | Desenvolvimento rápido |
| [`start_full.sh`](../start_full.sh) | Inicialização completa automática | Ambiente completo sem interação |
| [`start_interactive.sh`](../start_interactive.sh) | Menu interativo com seleção | Controle granular dos serviços |

---

## 1️⃣ start.sh - Inicialização Básica

### 📝 Descrição
Script original que gerencia **Backend** e **Frontend Principal**.

### 🎯 Uso
```bash
./start.sh {start|stop|restart|status} {backend|frontend|both}
```

### 📦 Serviços Gerenciados
- **Backend API** (porta 3001)
- **Frontend Principal** (porta 3000)

### 💡 Exemplos
```bash
# Iniciar ambos
./start.sh start both

# Iniciar apenas backend
./start.sh start backend

# Ver status
./start.sh status

# Parar tudo
./start.sh stop both

# Reiniciar frontend
./start.sh restart frontend
```

### ✨ Features
- ✅ Quality Gates automáticos (ESLint + TypeScript)
- ✅ Gerenciamento de processos em background
- ✅ Logs estruturados em `logs/`
- ✅ Limpeza automática de portas
- ✅ Health check com timeout

---

## 2️⃣ start_full.sh - Inicialização Completa

### 📝 Descrição
Inicia **TODOS os 7 serviços** da aplicação automaticamente, sem interação do usuário.

### 🎯 Uso
```bash
./start_full.sh
```

### 📦 Serviços Iniciados (em ordem)

| # | Serviço | Porta | Descrição |
|---|---------|-------|-----------|
| 1 | **Redis** | 6379 | Banco de dados em memória para filas |
| 2 | **PostgreSQL** | 5432 | Banco de dados principal |
| 3 | **Backend API** | 3001 | Servidor da API REST |
| 4 | **Worker** | 3004 | Processador de certificações assíncronas |
| 5 | **Frontend** | 3000 | Interface do usuário |
| 6 | **Frontend Admin** | 3003 | Interface de administração |
| 7 | **Grafana** | 3002 | Sistema de observabilidade |

### 🔧 Pré-requisitos Verificados
- ✅ Node.js
- ✅ npm
- ✅ Docker (para Redis e Grafana)
- ✅ docker-compose (para Grafana)
- ✅ lsof (para verificação de portas)

### 📊 Saída do Script

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Inicialização Completa do Sistema MyIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/7] ▶ Verificando pré-requisitos
✓ Node.js v20.11.0 detectado
✓ npm 10.2.4 detectado
✓ Docker 24.0.7 detectado
✓ Docker daemon está rodando
✓ Todos os pré-requisitos atendidos!

[2/7] ▶ Iniciando Redis (porta 6379)
ℹ Iniciando container Redis...
✓ Redis iniciado com sucesso

[3/7] ▶ Verificando PostgreSQL (porta 5432)
✓ PostgreSQL já está rodando (local)

[4/7] ▶ Iniciando Backend e Frontend Principal
✓ Backend e Frontend Principal iniciados com sucesso

[5/7] ▶ Iniciando Worker (porta 3004)
✓ Worker iniciado com sucesso (PID 12345)

[6/7] ▶ Iniciando Frontend Admin (porta 3003)
✓ Frontend Admin iniciado com sucesso (PID 12346)

[7/7] ▶ Iniciando Grafana (porta 3002)
✓ Grafana iniciado com sucesso

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Verificação de Health dos Serviços
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Redis (porta 6379): ✓ OK
PostgreSQL (porta 5432): ✓ OK
Backend (porta 3001): ✓ OK
Frontend (porta 3000): ✓ OK
Worker: ✓ OK (PID 12345)
Frontend Admin (porta 3003): ✓ OK
Grafana (porta 3002): ✓ OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 URLs de Acesso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • Frontend Principal:    http://localhost:3000
  • Frontend Admin:        http://localhost:3003
  • Backend API:           http://localhost:3001
  • Backend Health:        http://localhost:3001/health
  • Grafana:               http://localhost:3002 (admin/admin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Sistema MyIA pronto para uso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 📝 Logs Gerados
```
logs/
├── backend.out.log
├── backend.err.log
├── frontend.out.log
├── frontend.err.log
├── worker.out.log
├── worker.err.log
├── frontend-admin.out.log
└── frontend-admin.err.log
```

### 🛑 Como Parar os Serviços

```bash
# Parar Backend e Frontend Principal
./start.sh stop both

# Parar Worker
kill $(cat logs/worker.pid)

# Parar Frontend Admin
kill $(cat logs/frontend-admin.pid)

# Parar Redis
docker stop myia-redis

# Parar Grafana
cd observability && ./stop.sh
```

---

## 3️⃣ start_interactive.sh - Menu Interativo

### 📝 Descrição
Menu interativo com **seleção de serviços** e **barras de progresso visuais** em tempo real.

### 🎯 Uso
```bash
./start_interactive.sh
```

### 🎨 Interface do Menu

```
╔════════════════════════════════════════════════════════════╗
║              🚀 MyIA - Gerenciador de Serviços             ║
╚════════════════════════════════════════════════════════════╝

Selecione os serviços que deseja iniciar:

 [ ] 1. Banco de Dados (Redis + PostgreSQL)
     └─ Armazena informações e gerencia filas de tarefas

 [ ] 2. API do Sistema (Backend)
     └─ Servidor que processa requisições e se comunica com IA

 [ ] 3. Interface do Usuário (Frontend)
     └─ Tela principal onde você conversa com os modelos de IA

 [ ] 4. Painel de Administração (Frontend Admin)
     └─ Tela para gerenciar e testar modelos de IA

 [ ] 5. Processador de Tarefas (Worker)
     └─ Executa testes de modelos em segundo plano

 [ ] 6. Monitoramento (Grafana)
     └─ Visualiza logs, erros e métricas do sistema

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 [x] 7. INICIAR TUDO (Recomendado)
 [ ] 8. Status dos Serviços
 [ ] 9. Parar Todos os Serviços
 [ ] 0. Sair

Opção: _
```

### 🎮 Como Usar

#### Selecionar Serviços Individuais
1. Digite o número do serviço (1-6) e pressione ENTER
2. O checkbox mudará de `[ ]` para `[x]`
3. Digite novamente para desmarcar
4. Pressione ENTER sem digitar nada para iniciar os selecionados

#### Iniciar Tudo
1. Digite `7` e pressione ENTER
2. Todos os serviços serão iniciados automaticamente

#### Ver Status
1. Digite `8` e pressione ENTER
2. Veja o status de todos os serviços

#### Parar Tudo
1. Digite `9` e pressione ENTER
2. Todos os serviços serão parados

### 📊 Barras de Progresso

Durante a inicialização, você verá barras de progresso em tempo real:

```
╔════════════════════════════════════════════════════════════╗
║              🚀 Iniciando Serviços MyIA...              ║
╚════════════════════════════════════════════════════════════╝

[1/6] Banco de Dados      ████████████████████ 100% ✅
[2/6] API do Sistema      ███████████████░░░░░  75% ⏳
[3/6] Interface           ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
[4/6] Painel Admin        ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
[5/6] Processador         ░░░░░░░░░░░░░░░░░░░░   0% ⏸️
[6/6] Monitoramento       ░░░░░░░░░░░░░░░░░░░░   0% ⏸️

TOTAL                     ██████░░░░░░░░░░░░░░  29% 🚀
```

### 🎨 Símbolos de Status

| Símbolo | Status | Descrição |
|---------|--------|-----------|
| ⏸️  | Pendente | Aguardando inicialização |
| ⏳ | Iniciando | Em processo de inicialização |
| ✅ | Rodando | Serviço iniciado com sucesso |
| ❌ | Erro | Falha na inicialização |

### 💡 Cenários de Uso

#### Desenvolvimento Frontend
```
Selecione:
[x] 1. Banco de Dados
[x] 2. API do Sistema
[x] 3. Interface do Usuário
```

#### Desenvolvimento Backend
```
Selecione:
[x] 1. Banco de Dados
[x] 2. API do Sistema
```

#### Testar Certificações
```
Selecione:
[x] 1. Banco de Dados
[x] 2. API do Sistema
[x] 4. Painel de Administração
[x] 5. Processador de Tarefas
```

#### Monitoramento Completo
```
Selecione:
[x] 7. INICIAR TUDO
```

---

## 🔄 Comparação dos Scripts

| Feature | start.sh | start_full.sh | start_interactive.sh |
|---------|----------|---------------|----------------------|
| **Serviços** | 2 | 7 | 1-7 (selecionável) |
| **Interativo** | ❌ | ❌ | ✅ |
| **Barras de Progresso** | ❌ | ❌ | ✅ |
| **Quality Gates** | ✅ | ✅ | ❌ |
| **Health Check** | ✅ | ✅ | ✅ |
| **Logs Estruturados** | ✅ | ✅ | ✅ |
| **Controle Granular** | ✅ | ❌ | ✅ |
| **Resumo Visual** | ✅ | ✅ | ✅ |

---

## 🎯 Recomendações de Uso

### Para Iniciantes
👉 Use [`start_interactive.sh`](../start_interactive.sh)
- Interface amigável
- Descrições claras
- Controle visual

### Para Desenvolvimento Rápido
👉 Use [`start.sh`](../start.sh)
- Rápido e simples
- Quality Gates automáticos
- Apenas o essencial

### Para Ambiente Completo
👉 Use [`start_full.sh`](../start_full.sh)
- Tudo de uma vez
- Sem interação necessária
- Ideal para CI/CD

### Para Testes Específicos
👉 Use [`start_interactive.sh`](../start_interactive.sh)
- Selecione apenas o necessário
- Economize recursos
- Controle total

---

## 🐛 Troubleshooting

### Porta já está em uso
```bash
# Ver o que está usando a porta
lsof -ti:3001

# Matar processo na porta
kill $(lsof -ti:3001)
```

### Docker não está rodando
```bash
# Verificar status do Docker
docker info

# Iniciar Docker (Linux)
sudo systemctl start docker
```

### Serviço não inicia
```bash
# Ver logs do serviço
tail -f logs/backend.err.log
tail -f logs/frontend.err.log
tail -f logs/worker.err.log
tail -f logs/frontend-admin.err.log
```

### Redis não conecta
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Ver logs do Redis
docker logs myia-redis

# Reiniciar Redis
docker restart myia-redis
```

### PostgreSQL não encontrado
```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432

# Iniciar PostgreSQL via Docker
docker run -d --name myia-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15-alpine
```

---

## 📚 Recursos Adicionais

- **Documentação do start.sh**: [`START-SH-DOCS.md`](START-SH-DOCS.md)
- **Sistema de Observabilidade**: [`observability/GRAFANA-TUTORIAL.md`](../observability/GRAFANA-TUTORIAL.md)
- **Certificação de Modelos**: [`CERTIFICATION-WORKER-GUIDE.md`](../backend/docs/CERTIFICATION-WORKER-GUIDE.md)
- **Arquitetura do Sistema**: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## 🤝 Contribuindo

Ao adicionar novos serviços ao sistema:

1. Atualize [`start_full.sh`](../start_full.sh) para incluir o novo serviço
2. Adicione o serviço ao menu do [`start_interactive.sh`](../start_interactive.sh)
3. Documente a porta e o propósito neste guia
4. Adicione health check apropriado
5. Configure logs estruturados

---

## 📝 Changelog

### v1.0.0 (2026-02-01)
- ✨ Criado [`start_full.sh`](../start_full.sh) - Inicialização completa automática
- ✨ Criado [`start_interactive.sh`](../start_interactive.sh) - Menu interativo
- 📝 Documentação completa dos 3 scripts
- 🎨 Barras de progresso visuais
- 🔧 Verificação de pré-requisitos
- 🏥 Health checks para todos os serviços
- 📊 Resumos visuais com URLs

---

**Desenvolvido com ❤️ para o projeto MyIA**
