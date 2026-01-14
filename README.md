# 🚀 MyIA - Hub de IA Multi-Provider

> Um painel de controle de engenharia completo para monitorar custos, uso e performance de múltiplos provedores de IA em tempo real.

---

## ✨ Features

### 🔐 Autenticação & Segurança
- **Autenticação JWT** com tokens seguros (mínimo 32 caracteres)
- **Registro e login** de usuários com bcrypt hash
- **Proteção de rotas** no frontend e backend
- **Middleware de autenticação** para todas as rotas protegidas
- **Rate Limiting** de 3 níveis (auth, chat, API global)
- **Helmet.js** - Headers de segurança (CSP, X-Frame-Options, etc)
- **Validação Zod** - Validação estrita de inputs em todas as rotas
- **Criptografia AES-256** - API keys armazenadas de forma segura
- **Proteção SQL Injection** - Prisma ORM com queries parametrizadas
- **CORS configurável** - Whitelist de origens permitidas
- **100% Testes de Segurança** - Suite automatizada com 7 categorias

### 💬 Chat Persistente
- **Histórico permanente** - Mensagens salvas no banco de dados
- **Múltiplas conversas** - Gerencie vários chats simultâneos
- **Barra lateral** - Lista de conversas com busca rápida
- **Seletor de IA** - Escolha entre 6 providers por mensagem
- **Telemetria por mensagem** - Rastreamento detalhado de custo e tokens

### 🎨 Personalização
- **Modo Escuro/Claro** com persistência no banco de dados
- **Sincronização automática** de preferências entre dispositivos
- **Tema Material-UI** totalmente responsivo
- **Gerenciamento de chaves de API** criptografadas (6 providers)

### 📊 Analytics & Telemetria
- **Telemetria Financeira**: Rastreamento de custos por token (entrada/saída)
- **Telemetria de Engenharia**: Contagem de palavras e bytes
- **3 Gráficos de Engenharia**:
  - 📈 **LineChart**: Custo total diário (últimos 30 dias)
  - 📊 **BarChart**: Eficiência de custo por provider ($/1k tokens)
  - 🎯 **ScatterChart**: Mapa de carga (tokens entrada vs. saída)
- **Logs detalhados** de todas as chamadas de API no banco de dados

### 🔧 Infraestrutura
- **Health Check** endpoint para monitoramento
- **Graceful Shutdown** com desconexão limpa do banco
- **Tratamento global de erros** não capturados
- **Logs estruturados** com Winston
- **CORS configurável** para múltiplas origens

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v22+) com TypeScript
- **Express.js** - Framework web
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** (jsonwebtoken) - Autenticação
- **Zod** - Validação de schemas
- **Bcrypt** - Hash de senhas
- **Winston** - Logging estruturado
- **Axios** - Cliente HTTP para APIs externas
- **OpenAI SDK** - Integração com múltiplos providers
- **Helmet** - Security headers (CSP, X-Frame-Options, etc)
- **express-rate-limit** - Proteção contra DDoS e brute force

### Frontend
- **React 18** com TypeScript
- **Vite** - Build tool e dev server
- **Material-UI (MUI) v6** - Biblioteca de componentes
- **MUI X-Charts** - Gráficos e visualizações
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **Context API** - Gerenciamento de estado (Auth, Theme)

---

## 🏃‍♂️ Como Rodar

### 1️⃣ Pré-requisitos
- **Node.js** 22+ instalado
- **PostgreSQL** rodando localmente ou remotamente
- **npm**

### 2️⃣ Instalação

Clone o repositório e instale as dependências:

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

> ℹ️ **Nota:** O `npm install` já instala todas as dependências necessárias, incluindo:
> - AWS SDK (`@aws-sdk/client-bedrock-runtime`)
> - Passport OAuth (`passport`, `passport-github2`, `passport-google-oauth20`)
> - Todas as outras dependências listadas em `package.json`

### 3️⃣ Configuração do Backend (.env)

Crie um arquivo `backend/.env` com base no `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

**Variáveis Essenciais:**

```env
# Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/myia"

# Autenticação (OBRIGATÓRIO - Min 32 chars)
JWT_SECRET="seu-jwt-secret-de-64-caracteres-gerado-com-crypto-randomBytes"

# Criptografia de Chaves de API (OBRIGATÓRIO - Min 32 chars)
ENCRYPTION_SECRET="seu-encryption-secret-de-64-caracteres-randomBytes"

# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:3000"

# Chaves de API dos Providers (Opcional - veja abaixo)
OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
ANTHROPIC_API_KEY="sk-ant-..."
TOGETHER_API_KEY="..."
PERPLEXITY_API_KEY="..."
MISTRAL_API_KEY="..."

# AWS Bedrock (Opcional)
# Formato: ACCESS_KEY:SECRET_KEY
# IMPORTANTE: A SECRET_KEY só aparece UMA VEZ ao criar a Access Key!
# Se perdeu, delete a key antiga e crie uma nova.
AWS_BEDROCK_CREDENTIALS="AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_BEDROCK_REGION="us-east-1"
```

> 🔒 **SEGURANÇA CRÍTICA**: Gere secrets fortes (≥32 chars) para produção:
> ```bash
> # Gerar JWT_SECRET
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> 
> # Gerar ENCRYPTION_SECRET
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> 
> ⚠️ **O servidor NÃO iniciará se JWT_SECRET ou ENCRYPTION_SECRET estiverem ausentes ou <32 chars**

> 💡 **Dica**: Consulte `backend/src/config/costMap.ts` para ver todos os modelos suportados e seus custos. Você não precisa configurar TODAS as chaves - apenas as dos providers que pretende usar. O sistema usa **mock responses** quando uma chave está faltando.

**Modelos do Banco de Dados** (veja em `backend/prisma/schema.prisma`):
- `User` - Usuários do sistema
- `UserSettings` - Preferências (tema, chaves de API criptografadas)
- `ApiCallLog` - Telemetria de chamadas de IA
- `Chat` - Conversas do usuário (múltiplas conversas por usuário)
- `Message` - Histórico de mensagens com telemetria integrada (persistente)

### 4️⃣ Configuração do Banco de Dados

Execute as migrations do Prisma:

```bash
cd backend
npx prisma migrate dev
```

Isso criará todas as tabelas necessárias no PostgreSQL.

### 5️⃣ Rodando os Servidores

**Método Recomendado** (usando o script `start.sh`):

O projeto inclui um script de gerenciamento na raiz:

```bash
# Iniciar backend e frontend juntos
./start.sh start both

# Ou individualmente
./start.sh start backend    # Apenas backend
./start.sh start frontend   # Apenas frontend

# Ver status
./start.sh status

# Parar os servidores
./start.sh stop both

# Reiniciar
./start.sh restart both
```

> 📚 **Documentação completa:** [START-SH-DOCS.md](START-SH-DOCS.md)

**Features do start.sh:**
- ✅ Quality Gates automáticos (ESLint + TypeScript)
- ✅ Gerenciamento de processos em background
- ✅ Logs estruturados em `logs/`
- ✅ Limpeza automática de portas
- ✅ Health check com timeout

**Método Manual**:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6️⃣ Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📸 Screenshots

### Chat Multi-Provider
![Imagem do Chat](docs/screenshots/chat.png)
> Adicione um screenshot do chat aqui

### Painel de Analytics
![Imagem do Painel de Analytics](docs/screenshots/analytics.png)
> Adicione um screenshot dos gráficos de analytics aqui

### Modo Escuro
![Imagem do Modo Escuro](docs/screenshots/dark-mode.png)
> Adicione um screenshot do modo escuro aqui

---

## 📝 Documentação

### 📚 Scripts & Ferramentas

- **[START-SH-DOCS.md](START-SH-DOCS.md)** - Documentação completa do `start.sh`
- **[QUALITY-GATES-SETUP.md](QUALITY-GATES-SETUP.md)** - Git Hooks e Quality Gates
- **[.husky/README.md](.husky/README.md)** - Documentação dos Git Hooks

### 🔐 Segurança (LEITURA OBRIGATÓRIA)

- **[SECURITY-STANDARDS.md](docs/SECURITY-STANDARDS.md)** - Padrões de segurança e checklist de produção
- **[SECURITY-SETUP.md](docs/SECURITY-SETUP.md)** - Guia de configuração inicial de segurança
- **[security-tests.sh](backend/security-tests.sh)** - Suite automatizada de testes (7 categorias)

**Execute os testes de segurança:**
```bash
cd backend
./security-tests.sh  # Deve passar 100% (7/7 testes)
```

### 📖 Arquitetura & Padrões

- **[STANDARDS.md](docs/STANDARDS.md)** - **LEITURA OBRIGATÓRIA** - Padrões de código e arquitetura
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Visão geral da arquitetura do sistema
- **[API Endpoints](docs/api-endpoints.md)** - Documentação completa da API REST
- **[Audit System](docs/audit/README.md)** - Sistema de auditoria e rastreabilidade
- **[Testing Guide](docs/testing.md)** - Testes unitários e de integração

### 📊 Relatórios de Implementação

- **[SECURITY-PHASE1-DONE.md](docs/SECURITY-PHASE1-DONE.md)** - ✅ Fase 1: Validação de Secrets
- **[SECURITY-PHASE2-DONE.md](docs/SECURITY-PHASE2-DONE.md)** - ✅ Fase 2: Rate Limiting + Helmet + Validação
- **[STANDARDS-CONFORMANCE-REPORT.md](docs/STANDARDS-CONFORMANCE-REPORT.md)** - Relatório de conformidade (100%)

### Documentação Adicional Recomendada

Para manter este README enxuto, considere criar:

1. **`backend/README.md`** - Documentação detalhada do backend:
   - Lista completa de variáveis de ambiente
   - Explicação de cada provider de IA
   - Estrutura de pastas do backend
   - Como adicionar novos providers

2. **`CHANGELOG.md`** - Histórico de versões:
   - v1.0.0: Sistema de autenticação JWT
   - v1.1.0: Chat multi-provider implementado
   - v1.2.0: Sistema de tema (dark mode)
   - v1.3.0: Painel de analytics com telemetria completa

3. **`CONTRIBUTING.md`** - Guia para contribuidores:
   - Padrões de código
   - Como submeter PRs
   - Estrutura de commits

### Estrutura do Projeto

```
MyIA/
├── backend/
│   ├── prisma/              # Schema e migrations do banco
│   ├── src/
│   │   ├── config/          # Configurações (env, costMap)
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # Definição de rotas
│   │   ├── services/        # Serviços (AI, analytics, auth)
│   │   ├── lib/             # Prisma client singleton
│   │   └── utils/           # Utilidades (logger, jwt)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Auth, Theme contexts
│   │   ├── pages/           # Chat, Settings, Login, Register
│   │   ├── services/        # API clients (axios)
│   │   └── App.tsx
│   └── package.json
├── start.sh                 # Script de gerenciamento
└── README.md                # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🙏 Agradecimentos

- [OpenAI](https://openai.com) - GPT models
- [Groq](https://groq.com) - LLaMA models
- [Anthropic](https://anthropic.com) - Claude models
- [Material-UI](https://mui.com) - Componentes React
- [Prisma](https://prisma.io) - ORM incrível

---

**Feito com ❤️ e muita IA**
