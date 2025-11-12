# 🤖 MyIA - Assistente Conversacional Inteligente

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[![Tests](https://img.shields.io/badge/Tests-70%20passing-brightgreen)](docs/testing.md)
[![Coverage](https://img.shields.io/badge/Coverage-Critical%20Code%2090%25-brightgreen)](docs/testing.md)

> Assistente de IA conversacional full-stack com autenticação JWT, suporte a 6 providers de IA e interface moderna.

[Demo](#-demo) • [Recursos](#-recursos) • [Instalação](#-instalação-rápida) • [Documentação](#-documentação) • [Roadmap](#-roadmap)

---

## 📖 Sobre

**MyIA** é uma aplicação full-stack completa que permite conversar com múltiplos providers de IA com **contexto de conversa inteligente**, **autenticação segura** e **interface responsiva**.

**Ideal para:**
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

### 💬 Chat Inteligente com Multi-Provider
- **6 providers de IA suportados:**
  - OpenAI (GPT-3.5/GPT-4)
  - Claude (Anthropic 3.5 Sonnet)
  - Groq (Llama 3.1 - **100% gratuito**)
  - Together.ai (Llama 3.1)
  - Perplexity (Sonar)
  - Mistral (Mistral Small)
- Seleção de provider por requisição
- Contexto de conversa (últimas 15 mensagens)
- Modo mock quando API key não configurada
- Botão de limpar histórico

### 🎨 Interface Moderna
- Design responsivo com Material-UI
- Scroll automático de mensagens
- Loading states e feedback visual
- Modo claro (expansível para escuro)

### 🏗️ Arquitetura Profissional
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Banco de dados:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma com migrações
- **Validação:** Zod schemas
- **Arquitetura modular** para fácil expansão

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

---

## 🤖 Providers de IA Suportados

MyIA suporta **6 providers diferentes**, permitindo flexibilidade e redundância:

| Provider | Modelo Padrão | Custo | Link |
|----------|--------------|-------|------|
| **Groq** | Llama 3.1 8B | **100% Gratuito** ⭐ | [Obter chave](https://console.groq.com/) |
| **OpenAI** | GPT-3.5-turbo | Pago | [Obter chave](https://platform.openai.com/api-keys) |
| **Claude** | Claude 3.5 Sonnet | Pago | [Obter chave](https://console.anthropic.com/) |
| **Together.ai** | Llama 3.1 8B | Pago | [Obter chave](https://api.together.ai/) |
| **Perplexity** | Sonar Small | Pago | [Obter chave](https://www.perplexity.ai/settings/api) |
| **Mistral** | Mistral Small | Pago | [Obter chave](https://console.mistral.ai/) |

### Como usar

```bash
# Usar provider padrão (definido em API_PROVIDER)
POST /api/chat/message
{ "message": "Olá!" }

# Especificar provider
POST /api/chat/message
{ "message": "Olá!", "provider": "groq" }
```

**Modo Mock:** Funciona sem API keys, retornando respostas de exemplo.

---

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- npm ou yarn
- (Opcional) Chave de API de algum provider

### 1. Clone e configure

```bash
# Clone o repositório
git clone https://github.com/LeoPassos98/MyIA.git
cd MyIA

# Configure o Backend
cd backend
npm install
cp .env.example .env
# Edite .env e adicione suas API keys (opcional)

# Execute migrações do banco
npm run prisma:migrate

# Inicie o backend
npm run dev
```

O backend estará em `http://localhost:3001`

### 2. Configure o Frontend

```bash
# Em outro terminal
cd frontend
npm install

# Inicie o frontend
npm run dev
```

O frontend estará em `http://localhost:3000`

### 3. Acesse

Abra [http://localhost:3000](http://localhost:3000) no navegador!

---

## 🔧 Configuração

### Variáveis de Ambiente Backend

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_EXPIRES_IN=7d

# Provider padrão
API_PROVIDER=groq

# Contexto
MAX_CONTEXT_MESSAGES=15
CONTEXT_CLEANUP_INTERVAL=3600000

# CORS
# Lista de origens permitidas, separadas por vírgula (sem espaço)
# Exemplo para dev local + codespace
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# API Keys (todas opcionais)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
TOGETHER_API_KEY=...
PERPLEXITY_API_KEY=...
MISTRAL_API_KEY=...
```

### Variáveis de Ambiente Frontend

```env
VITE_API_URL=http://localhost:3001/api
```

---

## 📚 Documentação

### Documentos Disponíveis

- 📐 **[Arquitetura](docs/architecture.md)** - Visão técnica completa
- 🛠️ **[Setup Guide](docs/setup-guide.md)** - Guia passo a passo detalhado
- 📡 **[API Endpoints](docs/api-endpoints.md)** - Documentação da API REST
- 🧪 **[Guia de Testes](docs/testing.md)** - Documentação completa de testes
- 📊 **[Progress Log](docs/progress.md)** - Histórico de desenvolvimento

### Endpoints da API

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| POST | `/api/chat/message` | Enviar mensagem | ✅ |
| DELETE | `/api/chat/context` | Limpar histórico | ✅ |
| GET | `/api/ai/providers` | Listar providers | ❌ |
| POST | `/api/ai/test/:provider` | Testar conexão | ❌ |
| GET | `/health` | Status do servidor | ❌ |

---

## 🛠️ Stack Tecnológica

### Backend
- Node.js 18+ + Express.js
- TypeScript
- SQLite (dev) / PostgreSQL (prod)
- Prisma ORM
- JWT + bcrypt
- Zod (validação)
- 6 AI providers

### Frontend
- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- React Router v6
- Axios
- Context API

### DevOps
- Git
- GitHub Actions (planejado)
- Vercel + Railway (planejado)

---

## 🗺️ Roadmap

### v1.1 (Em breve)
- [ ] Modo escuro
- [ ] Múltiplas conversas por usuário

### v1.2
- [ ] Persistir histórico no banco
- [ ] Upload de imagens
- [ ] Streaming de respostas (SSE)
- [ ] Rate limiting

### v2.0
- [ ] Redis para cache
- [ ] Busca semântica com embeddings
- [ ] Dashboard de analytics
- [ ] Suporte a múltiplos idiomas

---

## 👤 Autor

**Leonardo Passos**

- GitHub: [@LeoPassos98](https://github.com/LeoPassos98)
- LinkedIn: [Leonardo Passos](https://linkedin.com/in/seu-usuario)

---

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pela API de IA
- [Anthropic](https://www.anthropic.com/) pelo Claude
- [Groq](https://groq.com/) pelo acesso gratuito
- [Material-UI](https://mui.com/) pelos componentes
- [Prisma](https://www.prisma.io/) pelo ORM

---

## 📞 Suporte

- 🐛 [Reportar Bug](https://github.com/LeoPassos98/MyIA/issues)
- 💡 [Solicitar Feature](https://github.com/LeoPassos98/MyIA/issues)
- 💬 [Discussões](https://github.com/LeoPassos98/MyIA/discussions)

---

<div align="center">

**Feito com ❤️ por [Leonardo Passos](https://github.com/LeoPassos98)**

[⬆ Voltar ao topo](#-myia---assistente-conversacional-inteligente)

</div>

---
