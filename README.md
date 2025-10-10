# 🤖 MyIA - Assistente Conversacional Inteligente

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> Assistente de IA conversacional full-stack com autenticação JWT, contexto inteligente e interface moderna.

[Demo](#-demo) • [Recursos](#-recursos) • [Instalação](#-instalação-rápida) • [Documentação](#-documentação) • [Roadmap](#-roadmap)

---

## 📖 Sobre

**MyIA** é uma aplicação full-stack completa que permite conversar com uma IA (OpenAI GPT) com **contexto de conversa persistente**, **autenticação segura** e uma **interface moderna e responsiva**.

Ideal para:
- 💼 Assistente pessoal inteligente
- 📚 Base de conhecimento conversacional
- 🎓 Aprendizado sobre desenvolvimento full-stack
- 🚀 Base para projetos de chatbot customizados

---

## ✨ Recursos

### 🔐 Autenticação Completa
- Registro e login de usuários
- JWT com expiração de 7 dias
- Senhas criptografadas com bcrypt
- Proteção de rotas no frontend e backend

### 💬 Chat Inteligente
- Integração com OpenAI (GPT-3.5-turbo ou GPT-4)
- Contexto de conversa (últimas 15 mensagens)
- Respostas rápidas e precisas
- Botão de limpar histórico

### 🎨 Interface Moderna
- Design responsivo com Material-UI
- Modo claro (expansível para escuro)
- Scroll automático de mensagens
- Loading states e feedback visual

### 🏗️ Arquitetura Profissional
- Backend: Node.js + Express + TypeScript
- Frontend: React + TypeScript + Vite
- Banco de dados: SQLite (dev) / PostgreSQL (prod)
- ORM: Prisma com migrações
- Validação: Zod schemas

---

## 🎬 Demo

### Interface de Chat
```
┌─────────────────────────────────────────┐
│  MyIA - Assistente Conversacional       │
│  Olá, @usuario               [Sair]     │
├─────────────────────────────────────────┤
│                                    [🗑️] │
│  👤 Você: Olá, como você está?          │
│  🤖 IA: Estou bem! Como posso ajudar?   │
│  👤 Você: Me conte uma piada             │
│  🤖 IA: Por que o JavaScript foi...     │
├─────────────────────────────────────────┤
│  Digite sua mensagem...            [📤] │
└─────────────────────────────────────────┘
```

### Fluxo de Autenticação
```
Login/Registro → Chat → Conversa com IA → Logout
     ↓              ↓           ↓            ↓
  JWT Token    Contexto    OpenAI API   Limpar sessão
```

---

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- npm ou yarn
- Chave da API OpenAI ([Obter aqui](https://platform.openai.com/api-keys))

### 1. Clone o repositório

```bash
git clone https://github.com/LeoPassos98/MyIA.git
cd MyIA
```

### 2. Configure o Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Adicione sua OPENAI_API_KEY

# Execute as migrações do banco
npm run prisma:migrate

# Inicie o servidor
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 3. Configure o Frontend

```bash
cd ../frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# .env já está configurado para localhost:3001

# Inicie o app
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

### 4. Acesse a aplicação

Abra [http://localhost:3000](http://localhost:3000) no seu navegador!

---

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (`.env`)

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-proj-sua-chave-aqui
OPENAI_MODEL=gpt-3.5-turbo

# Contexto
MAX_CONTEXT_MESSAGES=15
CONTEXT_CLEANUP_INTERVAL=3600000

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

### Modo Mock (Sem chave OpenAI)

Se você **não tiver** uma chave da OpenAI, a aplicação funciona em **modo mock**, retornando respostas pré-definidas. Ideal para testar a interface!

---

## 📚 Documentação

### Documentos Disponíveis

- 📐 **[Arquitetura](docs/architecture.md)** - Visão técnica completa
- 🛠️ **[Setup Guide](docs/setup-guide.md)** - Guia passo a passo detalhado
- 📡 **[API Endpoints](docs/api-endpoints.md)** - Documentação da API REST
- 📊 **[Progress Log](docs/progress.md)** - Histórico de desenvolvimento

### Estrutura do Projeto

```
MyIA/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── controllers/    # Lógica dos endpoints
│   │   ├── services/       # Lógica de negócio
│   │   ├── middleware/     # Auth, validação, erros
│   │   ├── routes/         # Definição de rotas
│   │   └── server.ts       # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   └── dev.db             # Banco SQLite
│
├── frontend/          # App React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas (Login, Chat)
│   │   ├── services/       # Integração com API
│   │   ├── contexts/       # Estado global (Auth)
│   │   └── App.tsx         # Componente raiz
│   └── index.html
│
└── docs/              # Documentação completa
    ├── architecture.md
    ├── setup-guide.md
    ├── api-endpoints.md
    └── progress.md
```

### Endpoints da API

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| POST | `/api/chat/message` | Enviar mensagem | ✅ |
| DELETE | `/api/chat/context` | Limpar histórico | ✅ |
| GET | `/health` | Status do servidor | ❌ |

Veja a [documentação completa da API](docs/api-endpoints.md) para exemplos de uso.

---

## 🧪 Testes

### Testes Manuais

```bash
# Backend
cd backend

# 1. Health check
curl http://localhost:3001/health

# 2. Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test User"}'

# 3. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Testes Automatizados

🚧 **Em desenvolvimento** - Próxima versão incluirá:
- Jest para testes unitários
- React Testing Library
- Supertest para testes de API

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **Autenticação:** JWT + bcrypt
- **Validação:** Zod
- **AI:** OpenAI API (GPT-3.5/GPT-4)

### Frontend
- **Framework:** React 18
- **Linguagem:** TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI)
- **Roteamento:** React Router v6
- **HTTP Client:** Axios
- **Estado:** Context API

### DevOps
- **Versionamento:** Git
- **CI/CD:** GitHub Actions (planejado)
- **Deploy:** Vercel (frontend) + Railway (backend)
- **Monitoramento:** Logs estruturados

---

## 🗺️ Roadmap

### v1.1 (Em breve)
- [ ] Testes automatizados (Jest + RTL)
- [ ] Modo escuro
- [ ] Múltiplas conversas por usuário
- [ ] Pesquisa no histórico

### v1.2
- [ ] Persistir histórico de conversas no banco
- [ ] Upload de imagens
- [ ] Streaming de respostas (SSE)
- [ ] Rate limiting

### v2.0
- [ ] Redis para cache de contexto
- [ ] Busca semântica com embeddings
- [ ] Dashboard de analytics
- [ ] Suporte a múltiplos idiomas
- [ ] Fine-tuning customizado

Veja o [roadmap completo](docs/progress.md#-próximos-passos) para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas gerais
```

---

## 👤 Autor

**Leonardo Passos**

- GitHub: [@LeoPassos98](https://github.com/LeoPassos98)
- LinkedIn: [Leonardo Passos](https://linkedin.com/in/seu-usuario)
- Email: seu-email@example.com

---

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pela API de IA
- [Material-UI](https://mui.com/) pelos componentes
- [Prisma](https://www.prisma.io/) pelo ORM fantástico
- [Anthropic](https://www.anthropic.com/) pelo Claude (assistente de desenvolvimento)

---

## 📞 Contato e Suporte

Encontrou um bug? Tem uma sugestão?

- 🐛 [Reportar Bug](https://github.com/LeoPassos98/MyIA/issues)
- 💡 [Solicitar Feature](https://github.com/LeoPassos98/MyIA/issues)
- 💬 [Discussões](https://github.com/LeoPassos98/MyIA/discussions)

---

<div align="center">

**Feito com ❤️ por [Leonardo Passos](https://github.com/LeoPassos98)**

[⬆ Voltar ao topo](#-myia---assistente-conversacional-inteligente)

</div>