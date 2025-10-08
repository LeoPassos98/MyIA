# 🏗️ Arquitetura do MVP - Assistente IA Conversacional

## 📋 Visão Geral

**Objetivo:** Criar um assistente conversacional baseado em OpenAI com autenticação simples e contexto de conversa em memória.

**Público:** Usuário único/pequeno grupo (MVP)

---

## 🎯 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Frontend** | React + TypeScript + MUI | Interface responsiva, tipagem forte |
| **Backend** | Node.js + Express + TypeScript | API REST escalável |
| **Banco de Dados** | PostgreSQL | Robusto para produção futura |
| **ORM** | Prisma | Type-safe, migrações facilitadas |
| **Auth** | JWT | Stateless, simples |
| **Contexto** | Map em memória | Sem dependências externas no MVP |
| **API IA** | OpenAI (GPT-4/3.5-turbo) | Modelo conversacional maduro |

---

## 📁 Estrutura de Pastas

```
projeto-ia-mvp/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   └── Layout/
│   │   │       ├── Navbar.tsx
│   │   │       └── MainLayout.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Chat.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   └── chatService.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── storage.ts
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── chatController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── openaiService.ts
│   │   │   └── contextService.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── chatRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── logger.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── architecture.md (este documento)
    ├── api-endpoints.md
    └── progress.md
```

<details><summary>Execute este comando único para criar toda a estrutura de pastas.</summary>

Comando:
```bash
mkdir -p frontend/src/components/{Chat,Auth,Layout} frontend/src/{pages,services,contexts,types,utils} frontend/public backend/src/{controllers,services,middleware,routes,types,config,utils,prisma} docs
```

Resultado: 
```bash
@LeoPassos98 ➜ /workspaces/MyIA (main) $ mkdir -p frontend/src/components/{Chat,Auth,Layout} frontend/src/{pages,services,contexts,types,utils} frontend/public backend/src/{controllers,services,middleware,routes,types,config,utils,prisma} docs
@LeoPassos98 ➜ /workspaces/MyIA (main) $ tree
.
├── README.md
├── backend
│   └── src
│       ├── config
│       ├── controllers
│       ├── middleware
│       ├── prisma
│       ├── routes
│       ├── services
│       ├── types
│       └── utils
├── docs
└── frontend
    ├── public
    └── src
        ├── components
        │   ├── Auth
        │   ├── Chat
        │   └── Layout
        ├── contexts
        ├── pages
        ├── services
        ├── types
        └── utils

24 directories, 1 file
```

</details>


<details><summary>Execute este comando único para criar todos os arquivos.</summary>

Comando:
```bash
touch backend/{package.json,tsconfig.json,.env.example,.gitignore} backend/src/server.ts backend/src/controllers/{authController,chatController}.ts backend/src/services/{authService,openaiService,contextService}.ts backend/src/middleware/{authMiddleware,errorHandler,validateRequest}.ts backend/src/routes/{authRoutes,chatRoutes}.ts backend/src/config/{database,env}.ts backend/src/utils/{jwt,logger}.ts backend/src/types/index.ts backend/src/prisma/schema.prisma frontend/{package.json,tsconfig.json,.env.example,.gitignore} frontend/src/{App,index}.tsx frontend/src/components/Chat/{ChatWindow,MessageList,MessageInput}.tsx frontend/src/components/Auth/{LoginForm,RegisterForm}.tsx frontend/src/components/Layout/{Navbar,MainLayout}.tsx frontend/src/pages/{Login,Register,Chat}.tsx frontend/src/services/{api,authService,chatService}.ts frontend/src/contexts/AuthContext.tsx frontend/src/types/index.ts frontend/src/utils/storage.ts docs/{api-endpoints,progress,architecture.md,setup-guide}.md
```

Resultado: 
```bash
@LeoPassos98 ➜ /workspaces/MyIA (main) $ touch backend/{package.json,tsconfig.json,.env.example,.gitignore} backend/src/server.ts backend/src/controllers/{authController,chatController}.ts backend/src/services/{authService,openaiService,contextService}.ts backend/src/middleware/{authMiddleware,errorHandler,validateRequest}.ts backend/src/routes/{authRoutes,chatRoutes}.ts backend/src/config/{database,env}.ts backend/src/utils/{jwt,logger}.ts backend/src/types/index.ts backend/src/prisma/schema.prisma frontend/{package.json,tsconfig.json,.env.example,.gitignore} frontend/src/{App,index}.tsx frontend/src/components/Chat/{ChatWindow,MessageList,MessageInput}.tsx frontend/src/components/Auth/{LoginForm,RegisterForm}.tsx frontend/src/components/Layout/{Navbar,MainLayout}.tsx frontend/src/pages/{Login,Register,Chat}.tsx frontend/src/services/{api,authService,chatService}.ts frontend/src/contexts/AuthContext.tsx frontend/src/types/index.ts frontend/src/utils/storage.ts docs/{api-endpoints,progress}.md
@LeoPassos98 ➜ /workspaces/MyIA (main) $ tree
.
├── README.md
├── backend
│   ├── package.json
│   ├── src
│   │   ├── config
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── controllers
│   │   │   ├── authController.ts
│   │   │   └── chatController.ts
│   │   ├── middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── prisma
│   │   │   └── schema.prisma
│   │   ├── routes
│   │   │   ├── authRoutes.ts
│   │   │   └── chatRoutes.ts
│   │   ├── server.ts
│   │   ├── services
│   │   │   ├── authService.ts
│   │   │   ├── contextService.ts
│   │   │   └── openaiService.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       ├── jwt.ts
│   │       └── logger.ts
│   └── tsconfig.json
├── docs
│   ├── api-endpoints.md
│   └── progress.md
└── frontend
    ├── package.json
    ├── public
    ├── src
    │   ├── App.tsx
    │   ├── components
    │   │   ├── Auth
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── RegisterForm.tsx
    │   │   ├── Chat
    │   │   │   ├── ChatWindow.tsx
    │   │   │   ├── MessageInput.tsx
    │   │   │   └── MessageList.tsx
    │   │   └── Layout
    │   │       ├── MainLayout.tsx
    │   │       └── Navbar.tsx
    │   ├── contexts
    │   │   └── AuthContext.tsx
    │   ├── index.tsx
    │   ├── pages
    │   │   ├── Chat.tsx
    │   │   ├── Login.tsx
    │   │   └── Register.tsx
    │   ├── services
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   └── chatService.ts
    │   ├── types
    │   │   └── index.ts
    │   └── utils
    │       └── storage.ts
    └── tsconfig.json
24 directories, 42 files
```
</details>

---

## 🗄️ Modelos de Dados

### **User (PostgreSQL via Prisma)**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // hash bcrypt
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### **Message (Memória - não persistido)**

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  userId: string;
  messages: Message[];
  lastActivity: Date;
}

// Map<userId, ChatContext>
```

---

## 🔐 Fluxo de Autenticação

```
[Frontend]           [Backend]              [PostgreSQL]
    |                    |                        |
    |-- POST /register -->|                        |
    |                    |--- INSERT user -------->|
    |                    |<------------------------|
    |<-- 201 Created ----|                        |
    |                    |                        |
    |-- POST /login ---->|                        |
    |                    |--- SELECT user -------->|
    |                    |<--- user data ----------|
    |                    |--- verify password      |
    |                    |--- generate JWT         |
    |<-- JWT token ------|                        |
    |                    |                        |
    | (store JWT)        |                        |
    |                    |                        |
    |-- GET /chat ------>|                        |
    | (Authorization:    |                        |
    |  Bearer <JWT>)     |                        |
    |                    |--- verify JWT           |
    |<-- 200 OK ---------|                        |
```

---

## 💬 Fluxo de Chat com Contexto

```
[Frontend]           [Backend]              [OpenAI]         [Map Memory]
    |                    |                      |                 |
    |-- POST /chat ----->|                      |                 |
    | { message: "Oi" }  |                      |                 |
    |                    |--- get context ----->|                 |
    |                    |<-- last 15 msgs -----|                 |
    |                    |                      |                 |
    |                    |--- API call -------->|                 |
    |                    | (with context)       |                 |
    |                    |<-- response ---------|                 |
    |                    |                      |                 |
    |                    |--- update context -->|                 |
    |                    | (add user msg +      |                 |
    |                    |  assistant msg)      |                 |
    |<-- response -------|                      |                 |
```

---

## 🌐 Endpoints da API

### **Autenticação**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| GET | `/api/auth/me` | Dados do usuário | Sim |

### **Chat**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/chat/message` | Enviar mensagem | Sim |
| DELETE | `/api/chat/context` | Limpar contexto | Sim |

---

## 📦 Detalhamento dos Endpoints

### **POST /api/auth/register**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "userId": "uuid-aqui"
}
```

---

### **POST /api/auth/login**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "token": "jwt-token-aqui",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "João Silva"
  }
}
```

---

### **POST /api/chat/message**

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "message": "Olá, como você está?"
}
```

**Response (200):**
```json
{
  "response": "Estou bem, obrigado! Como posso ajudar?",
  "contextSize": 2
}
```

---

### **DELETE /api/chat/context**

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "message": "Contexto limpo com sucesso"
}
```

---

## ⚙️ Variáveis de Ambiente

### **Backend (.env)**

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ia_mvp"

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Context
MAX_CONTEXT_MESSAGES=15
CONTEXT_CLEANUP_INTERVAL=3600000
```

### **Frontend (.env)**

```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🔧 Lógica de Contexto (Backend)

```typescript
// contextService.ts
class ContextService {
  private contexts: Map<string, ChatContext>;

  constructor() {
    this.contexts = new Map();
    this.startCleanupTask();
  }

  addMessage(userId: string, message: Message): void {
    // Adiciona mensagem ao contexto
    // Mantém apenas últimas 15 mensagens
  }

  getContext(userId: string): Message[] {
    // Retorna mensagens do usuário
  }

  clearContext(userId: string): void {
    // Remove contexto do usuário
  }

  private startCleanupTask(): void {
    // Remove contextos inativos a cada 1h
  }
}
```

---

## 🚀 Fluxo de Desenvolvimento

### **Fase 1: Setup Inicial**
1. Criar estrutura de pastas
2. Configurar TypeScript (backend + frontend)
3. Configurar PostgreSQL + Prisma
4. Setup Express + middlewares básicos
5. Setup React + MUI

### **Fase 2: Autenticação**
1. Modelo User no Prisma
2. Endpoints de registro/login
3. Middleware de autenticação JWT
4. Páginas de login/registro (frontend)
5. Context API para auth (frontend)

### **Fase 3: Chat Básico**
1. Integração com OpenAI
2. Service de contexto em memória
3. Endpoint de chat
4. Interface de chat (frontend)
5. Comunicação frontend-backend

### **Fase 4: Refinamento**
1. Tratamento de erros
2. Loading states
3. Validações
4. Limpeza de contexto
5. Testes básicos

---

## 📊 Estimativa de Custos (OpenAI)

| Modelo | Input (1k tokens) | Output (1k tokens) | Conversa média (20 msgs) |
|--------|-------------------|-------------------|-------------------------|
| GPT-3.5-turbo | $0.0005 | $0.0015 | ~$0.02 |
| GPT-4o-mini | $0.00015 | $0.0006 | ~$0.008 |

**Recomendação inicial:** GPT-3.5-turbo (balanço custo/qualidade).

---

## ⚠️ Limitações do MVP

1. **Contexto não persistido:** Perdido ao reiniciar servidor
2. **Sessão única:** Um contexto por usuário (não múltiplas conversas)
3. **Sem histórico:** Mensagens antigas não são salvas
4. **Sem rate limiting:** Pode gerar custos altos
5. **Auth simples:** Sem recuperação de senha, verificação de email

---

## 🔮 Próximas Evoluções (Pós-MVP)

1. Persistir histórico de conversas (PostgreSQL)
2. Múltiplas conversas por usuário
3. Redis para contexto
4. Rate limiting
5. Streaming de respostas
6. Upload de arquivos
7. Busca semântica (embeddings)
8. Fine-tuning customizado

---

## 📝 Checklist de Implementação

- [ ] Setup backend (Express + TypeScript)
- [ ] Setup frontend (React + TypeScript + MUI)
- [ ] Configurar PostgreSQL + Prisma
- [ ] Implementar autenticação (JWT)
- [ ] Criar service OpenAI
- [ ] Criar service de contexto
- [ ] Implementar endpoints de chat
- [ ] Criar interface de login
- [ ] Criar interface de chat
- [ ] Testar fluxo completo
- [ ] Documentar uso

---

**Data:** 2025-10-08  
**Versão:** 1.0  
**Status:** Pronto para implementação