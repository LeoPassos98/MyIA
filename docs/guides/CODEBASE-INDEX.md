# 📚 CODEBASE INDEX - MyIA

> **Documento de Indexação da Codebase**  
> Este arquivo serve como referência rápida para IAs e desenvolvedores entenderem a estrutura, arquitetura e padrões do projeto MyIA.  
> **Última Atualização:** 2026-01-15

---

## 📋 VISÃO GERAL DO PROJETO

### Nome
**MyIA** - Hub de IA Multi-Provider

### Descrição
Painel de controle de engenharia completo para monitorar custos, uso e performance de múltiplos provedores de IA em tempo real. Sistema de chat conversacional com suporte a 6+ providers de IA, telemetria completa, analytics avançado e sistema de auditoria.

### Versão Atual
1.0.0

### Stack Principal
- **Backend:** Node.js 22+, TypeScript, Express.js, Prisma ORM, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Material-UI v6, MUI X-Charts
- **Banco de Dados:** PostgreSQL com extensão pgvector (para RAG)
- **Autenticação:** JWT (jsonwebtoken), Passport.js (OAuth)
- **Segurança:** Helmet, express-rate-limit, Zod, bcrypt, AES-256

---

## 🏗️ ARQUITETURA DO SISTEMA

### Padrões Arquiteturais

#### 1. **Factory Pattern (Providers de IA)**
- **Localização:** [`backend/src/services/ai/providers/factory.ts`](backend/src/services/ai/providers/factory.ts)
- **Objetivo:** Instanciar providers de IA dinamicamente baseado em configuração do banco de dados
- **Benefício:** Adicionar novos providers sem modificar código (database-driven)

#### 2. **Database-Driven Configuration**
- Providers e modelos de IA são configurados no banco de dados (tabelas `ai_providers` e `ai_models`)
- Frontend busca lista de providers via API [`/api/ai/providers`](backend/src/routes/aiRoutes.ts)
- Permite ativar/desativar modelos sem deploy

#### 3. **Fonte Única de Verdade (Backend-First)**
- **Regra:** Toda entidade auditável DEVE ter identidade criada no backend
- Frontend NUNCA gera IDs de mensagens, inferências ou auditoria
- Garante rastreabilidade e compliance

#### 4. **JSend API Standard**
- **Formato de Resposta:**
  - Sucesso: `{ "status": "success", "data": {...} }`
  - Falha: `{ "status": "fail", "data": {...} }`
  - Erro: `{ "status": "error", "message": "...", "code": 500 }`
- **Interceptor Frontend:** Desembrulha automaticamente `response.data.data` → `response.data`

#### 5. **Armazenamento Lean (Anti-Duplicação)**
- Sistema salva apenas **metadados e referências (IDs)**, nunca conteúdo duplicado
- Campo `sentContext` armazena IDs de mensagens, não o payload completo
- Economia de ~98% de espaço em disco

---

## 📁 ESTRUTURA DE DIRETÓRIOS

### Backend (`/backend`)

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco (PostgreSQL + pgvector)
│   ├── dev.db                 # SQLite (deprecated, usar PostgreSQL)
│   └── seed.ts                # Seed inicial do banco
├── src/
│   ├── server.ts              # Entry point do servidor Express
│   ├── config/
│   │   ├── env.ts             # Validação de variáveis de ambiente
│   │   ├── database.ts        # Configuração do Prisma
│   │   ├── passport.ts        # OAuth (GitHub, Google)
│   │   └── providerMap.ts     # Mapa de custos de providers
│   ├── controllers/           # Lógica de negócio (orquestração)
│   │   ├── aiController.ts
│   │   ├── authController.ts
│   │   ├── chatController.ts
│   │   ├── analyticsController.ts
│   │   ├── auditController.ts
│   │   └── promptTraceController.ts
│   ├── services/              # Serviços de domínio
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── factory.ts      # Factory de providers
│   │   │   │   ├── base.ts         # Interface base
│   │   │   │   ├── openai.ts       # Driver universal OpenAI-compatible
│   │   │   │   └── bedrock.ts      # Driver AWS Bedrock
│   │   │   └── client/
│   │   │       ├── claudeClient.ts
│   │   │       └── azureEmbeddingClient.ts
│   │   ├── chat/
│   │   │   ├── contextService.ts   # Gerenciamento de contexto
│   │   │   └── costService.ts      # Cálculo de custos
│   │   ├── authService.ts
│   │   ├── analyticsService.ts
│   │   ├── ragService.ts           # RAG (pgvector)
│   │   └── encryptionService.ts    # AES-256 para API keys
│   ├── middleware/
│   │   ├── auth.ts                 # Middleware JWT
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts         # Error handler global
│   │   ├── rateLimiter.ts          # 3 níveis (auth, chat, API)
│   │   ├── validateRequest.ts      # Validação Zod
│   │   └── validators/             # Schemas Zod por domínio
│   ├── routes/                     # Definição de rotas
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── aiRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   ├── auditRoutes.ts
│   │   └── promptTraceRoutes.ts
│   ├── audit/                      # Sistema de auditoria
│   │   ├── domain/
│   │   │   ├── AuditRecord.ts      # Entidade de auditoria
│   │   │   └── AuditEnums.ts
│   │   ├── builders/
│   │   │   └── AuditRecordBuilder.ts
│   │   └── utils/
│   │       └── sentContextParser.ts
│   ├── lib/
│   │   └── prisma.ts               # Singleton do Prisma Client
│   ├── utils/
│   │   ├── logger.ts               # Winston logger
│   │   ├── jwt.ts                  # Helpers JWT
│   │   ├── jsend.ts                # JSend helpers
│   │   └── api-response.ts
│   └── types/
│       ├── index.ts
│       └── express/
│           └── index.d.ts          # Extensões de tipos Express
├── tests/
│   ├── unit/                       # Testes unitários
│   ├── integration/                # Testes de integração
│   └── manual/                     # Testes manuais
├── scripts/
│   ├── backfillEmbeddings.ts       # Script RAG
│   └── seedAudit.ts                # Seed de auditoria
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── App.tsx                     # Componente raiz + rotas
│   ├── index.tsx                   # Entry point
│   ├── theme.ts                    # Tema MUI (ÚNICA fonte de cores)
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx      # Layout principal (overflow: hidden)
│   │   │   ├── MainHeader.tsx      # Header global
│   │   │   ├── MainContentWrapper.tsx  # Controla scroll global
│   │   │   └── AppDrawers.tsx      # Drawers laterais
│   │   ├── PageLayout/
│   │   │   └── ObservabilityPageLayout/  # Layout para páginas complexas
│   │   │       ├── ObservabilityPageLayout.tsx
│   │   │       ├── ObservabilitySidebar.tsx
│   │   │       ├── ObservabilityDrawer.tsx
│   │   │       └── useScrollSpy.ts
│   │   └── Feedback/
│   │       └── LoadingScreen.tsx
│   ├── contexts/                   # Context API
│   │   ├── AuthContext.tsx         # Autenticação global
│   │   ├── ThemeContext.tsx        # Dark/Light mode
│   │   ├── LayoutContext.tsx       # Estado do layout
│   │   └── HeaderSlotsContext.tsx  # Slots do header
│   ├── features/                   # Features modulares
│   │   ├── chat/
│   │   │   ├── index.tsx           # Página principal
│   │   │   ├── components/
│   │   │   │   ├── input/
│   │   │   │   │   ├── ChatInput.tsx
│   │   │   │   │   ├── InputTextField.tsx
│   │   │   │   │   └── SendButton.tsx
│   │   │   │   ├── message/
│   │   │   │   │   ├── ChatMessage.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   ├── MessageActions.tsx
│   │   │   │   │   └── MessageMetadata.tsx
│   │   │   │   ├── ControlPanel/   # Painel de configuração
│   │   │   │   │   ├── ModelTab.tsx
│   │   │   │   │   ├── ContextConfigTab.tsx
│   │   │   │   │   ├── PinnedMessagesTab.tsx
│   │   │   │   │   └── ManualContextTab.tsx
│   │   │   │   ├── drawer/
│   │   │   │   │   └── HistorySidebar.tsx
│   │   │   │   └── DevConsole.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChatLogic.ts     # Lógica principal
│   │   │   │   └── useChatInput.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── audit/                  # Sistema de auditoria
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   │   └── AuditController.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuditLoader.ts
│   │   │   └── context/
│   │   │       └── AuditContext.tsx
│   │   ├── auditPage/              # Página de auditoria
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   │   ├── AuditTable.tsx
│   │   │   │   ├── AuditSummaryCards.tsx
│   │   │   │   ├── AuditCostChart.tsx
│   │   │   │   └── AuditProviderCharts.tsx
│   │   │   └── hooks/
│   │   │       ├── useAuditList.ts
│   │   │       └── useAuditSummary.ts
│   │   ├── auditViewer/            # Modal de visualização de auditoria
│   │   │   ├── AuditViewerModal.tsx
│   │   │   ├── AuditHeader.tsx
│   │   │   ├── AuditSummary.tsx
│   │   │   ├── AuditTrace.tsx
│   │   │   └── AuditUsage.tsx
│   │   ├── promptTrace/            # Rastreamento de prompts
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   │   ├── PromptTraceViewer.tsx
│   │   │   │   ├── PromptTraceTimeline.tsx
│   │   │   │   └── PromptTraceStepDetails.tsx
│   │   │   └── hooks/
│   │   │       └── usePromptTraceLoader.ts
│   │   ├── settings/               # Configurações do usuário
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   │   ├── ProfileTab.tsx
│   │   │   │   ├── AppearanceTab.tsx
│   │   │   │   ├── ApiKeysTab.tsx
│   │   │   │   └── providers/
│   │   │   │       ├── StandardProviderPanel.tsx
│   │   │   │       ├── AWSProviderPanel.tsx
│   │   │   │       └── AzureProviderPanel.tsx
│   │   │   └── hooks/
│   │   │       ├── useProfileTab.ts
│   │   │       ├── useApiKeysTab.ts
│   │   │       └── useAWSConfig.ts
│   │   ├── login/
│   │   │   ├── LoginPage.tsx
│   │   │   └── hooks/
│   │   │       └── useLogin.ts
│   │   ├── register/
│   │   │   ├── RegisterPage.tsx
│   │   │   └── hooks/
│   │   │       └── useRegister.ts
│   │   └── landing/
│   │       ├── components/
│   │       │   └── LandingPage.tsx
│   │       └── hooks/
│   │           └── useLandingPage.ts
│   ├── services/                   # API clients
│   │   ├── api.ts                  # Axios instance + interceptor JSend
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── chatHistoryService.ts
│   │   ├── aiProvidersService.ts
│   │   ├── analyticsService.ts
│   │   ├── auditService.ts
│   │   └── userSettingsService.ts
│   ├── pages/
│   │   └── AuthSuccess.tsx         # OAuth callback
│   ├── types/
│   │   └── ai.ts
│   └── assets/
│       ├── brand/
│       │   └── logo.svg
│       └── providers/              # Logos de providers
│           ├── openai.svg
│           ├── groq.svg
│           └── default.svg
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### Documentação (`/docs`)

```
docs/
├── README.md                       # Índice da documentação
├── ARCHITECTURE.md                 # Arquitetura do sistema
├── STANDARDS.md                    # ⚠️ LEITURA OBRIGATÓRIA - Padrões imutáveis
├── VISUAL-IDENTITY-GUIDE.md        # Guia de identidade visual
├── SECURITY-STANDARDS.md           # Padrões de segurança
├── api-endpoints.md                # Documentação completa da API
├── setup-guide.md                  # Guia de instalação
├── AWS-BEDROCK-SETUP.md            # Setup AWS Bedrock
├── progress.md                     # Progresso do projeto
├── audit/
│   ├── README.md                   # Sistema de auditoria
│   └── audit-v1.4.md
├── tests/
│   ├── TEST-PLAN-AUTOMATED.md
│   ├── TEST-PLAN-MANUAL.md
│   └── testing.md
├── fazer/
│   └── fazer.md                    # Tarefas pendentes
└── archive/                        # Documentos históricos
    ├── JSEND-COMPLETE.md
    ├── STANDARDS-COMPLIANCE-REPORT.md
    └── ...
```

---

## 🗄️ BANCO DE DADOS (PostgreSQL)

### Schema Principal ([`backend/prisma/schema.prisma`](backend/prisma/schema.prisma))

#### Tabelas Core

**`users`**
- `id` (UUID, PK)
- `email` (unique)
- `password` (bcrypt hash)
- `name`
- `createdAt`, `updatedAt`

**`user_settings`** (1:1 com `users`)
- `id` (UUID, PK)
- `userId` (FK → users.id, unique)
- `theme` (light/dark)
- API Keys criptografadas:
  - `openaiApiKey`, `groqApiKey`, `claudeApiKey`
  - `togetherApiKey`, `perplexityApiKey`, `mistralApiKey`
- AWS Bedrock:
  - `awsAccessKey`, `awsSecretKey`, `awsRegion`
  - `awsEnabledModels` (array)

**`chats`** (Conversas)
- `id` (UUID, PK)
- `userId` (FK → users.id)
- `title` (string)
- `provider` (string)
- `createdAt`, `updatedAt`

**`messages`** (Histórico de mensagens)
- `id` (UUID, PK)
- `chatId` (FK → chats.id)
- `role` (user/assistant)
- `content` (texto)
- `isPinned` (boolean)
- `createdAt`
- **Telemetria (apenas para assistant):**
  - `provider`, `model`
  - `tokensIn`, `tokensOut`, `costInUSD`
- **Auditoria:**
  - `sentContext` (JSON) - Metadados da inferência
- **RAG:**
  - `vector` (pgvector 1536) - Embedding para busca semântica

**`api_call_logs`** (Telemetria)
- `id` (UUID, PK)
- `userId` (FK → users.id)
- `timestamp`
- `provider`, `model`
- `tokensIn`, `tokensOut`, `costInUSD`
- `wordsIn`, `wordsOut`, `bytesIn`, `bytesOut`

#### Sistema Modular de IA

**`ai_providers`** (Providers de IA)
- `id` (UUID, PK)
- `name` (ex: "OpenAI")
- `slug` (ex: "openai", usado no código)
- `isActive` (boolean)
- `baseUrl` (URL da API)
- `websiteUrl`, `logoUrl`

**`ai_models`** (Modelos de IA)
- `id` (UUID, PK)
- `providerId` (FK → ai_providers.id)
- `name` (ex: "GPT-4 Turbo")
- `apiModelId` (ex: "gpt-4-0125-preview")
- `contextWindow` (int)
- `costPer1kInput`, `costPer1kOutput` (float)
- `isActive` (boolean)

**`user_provider_credentials`** (BYOK - Bring Your Own Key)
- `id` (UUID, PK)
- `userId` (FK → users.id)
- `providerId` (FK → ai_providers.id)
- `apiKey` (criptografado)
- Unique: `(userId, providerId)`

**`provider_credential_validations`** (Validação de credenciais)
- `id` (UUID, PK)
- `userId` (FK → users.id)
- `provider` (string)
- `status` (not_configured/validating/valid/invalid/expired)
- `lastValidatedAt`, `lastError`, `errorCode`
- `validatedModels` (array)
- `latencyMs` (int)

---

## 🔐 SEGURANÇA

### Camadas de Segurança Implementadas

#### 1. **Autenticação JWT**
- Token mínimo 32 caracteres
- Validade: 7 dias
- Algoritmo: HS256
- Validação em todas as rotas protegidas

#### 2. **Rate Limiting (3 Níveis)**
- **Auth:** 5 req/15min (proteção brute force)
- **Chat:** 20 req/min (proteção spam)
- **API Global:** 100 req/15min

#### 3. **Helmet.js**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)

#### 4. **Validação Zod**
- Todas as rotas POST/PUT/PATCH/DELETE
- Validação estrita de inputs
- Mensagens de erro formatadas (JSend)

#### 5. **Criptografia AES-256**
- API keys armazenadas criptografadas
- Serviço: [`backend/src/services/encryptionService.ts`](backend/src/services/encryptionService.ts)
- Secret: `ENCRYPTION_SECRET` (min 32 chars)

#### 6. **Proteção SQL Injection**
- Prisma ORM (queries parametrizadas)
- NUNCA usar raw SQL

#### 7. **CORS Configurável**
- Whitelist de origens (`CORS_ORIGIN`)
- Credentials: true
- Métodos permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS

#### 8. **HTTPS Obrigatório (Produção)**
- Redirect automático HTTP → HTTPS
- Verificação via header `x-forwarded-proto`

### Testes de Segurança

**Script:** [`backend/security-tests.sh`](backend/security-tests.sh)

```bash
cd backend
./security-tests.sh
# Resultado esperado: 7/7 testes PASS
```

**Categorias:**
1. Secrets validation
2. Rate limiting
3. Helmet headers
4. Zod validation
5. SQL injection protection
6. CORS configuration
7. HTTPS redirect

### Variáveis de Ambiente Críticas

```env
# OBRIGATÓRIAS (min 32 chars)
JWT_SECRET="..."
ENCRYPTION_SECRET="..."

# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/myia"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Providers (opcional)
OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
ANTHROPIC_API_KEY="sk-ant-..."
# ... outros providers

# AWS Bedrock (opcional)
AWS_BEDROCK_CREDENTIALS="ACCESS_KEY:SECRET_KEY"
AWS_BEDROCK_REGION="us-east-1"
```

---

## 🎨 PADRÕES DE CÓDIGO

### Convenções de Nomes

#### Arquivos
- **Lógica TS/JS:** `camelCase` (ex: `chatController.ts`)
- **Componentes React:** `PascalCase` (ex: `ChatInput.tsx`)
- **Hooks:** `camelCase` com prefixo `use` (ex: `useChatLogic.ts`)

#### Código
- **Interfaces/Tipos:** `PascalCase` (ex: `User`, não `IUser`)
- **Componentes React:** `PascalCase`
- **Services:** `camelCase` (ex: `chatService`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_TOKENS`)

### Headers Obrigatórios

**Todo arquivo de código DEVE iniciar com:**

```typescript
// backend/src/services/ai/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
```

### Separação View/Logic (Frontend)

- **`.tsx` (View):** Apenas JSX e estilos
- **`useX.ts` (Logic):** Estado, efeitos, handlers

**Exemplo:**
```typescript
// ChatPage.tsx (View)
import { useChatLogic } from './hooks/useChatLogic';

export function ChatPage() {
  const { messages, sendMessage, loading } = useChatLogic();
  return <div>...</div>;
}

// hooks/useChatLogic.ts (Logic)
export function useChatLogic() {
  const [messages, setMessages] = useState([]);
  const sendMessage = async (text: string) => { ... };
  return { messages, sendMessage, loading };
}
```

### Tema e Cores (Frontend)

**REGRA CRÍTICA:** NUNCA usar cores hardcoded

❌ **PROIBIDO:**
```typescript
color: '#00FF41'
bgcolor: 'rgba(255,255,255,0.1)'
background: alpha(theme.palette.primary.main, 0.2)
```

✅ **PERMITIDO:**
```typescript
color: 'text.secondary'
bgcolor: 'grey.100'
borderColor: 'divider'
opacity: 0.8
```

**Fonte Única de Cores:** [`frontend/src/theme.ts`](frontend/src/theme.ts)

### Layout e Scroll (Frontend)

**Regra Arquitetural:**
- Scroll vertical é responsabilidade EXCLUSIVA do [`MainContentWrapper`](frontend/src/components/Layout/MainContentWrapper.tsx)
- Layout raiz ([`MainLayout`](frontend/src/components/Layout/MainLayout.tsx)) usa `overflow: hidden`
- Páginas NUNCA devem controlar scroll global

❌ **PROIBIDO em páginas:**
```typescript
overflow: 'auto'
height: '100vh'
```

✅ **PERMITIDO:**
```typescript
// Assumir que scroll já está resolvido pelo layout
<Box sx={{ padding: 2 }}>
  <Typography>Conteúdo</Typography>
</Box>
```

### ObservabilityPageLayout

**Quando usar:**
- Páginas com múltiplas seções + navegação
- Sidebar persistente ou drawer contextual
- Visualização de dados (tabelas, gráficos)
- Inspeção de registros (modais de detalhes)

**Exemplos:**
- [`AuditPage`](frontend/src/features/auditPage/index.tsx)
- [`PromptTracePage`](frontend/src/features/promptTrace/index.tsx)

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Autenticação

```
1. POST /api/auth/register
   → Cria usuário (bcrypt hash)
   → Cria UserSettings padrão (theme: light)
   
2. POST /api/auth/login
   → Valida credenciais
   → Gera JWT token (7 dias)
   → Retorna { token, user }
   
3. Frontend armazena token
   → localStorage.setItem('token', token)
   → Inclui em todas as requisições: Authorization: Bearer <token>
```

### 2. Envio de Mensagem (Chat)

```
1. Frontend: POST /api/chat/message
   Body: { message, provider, chatId }
   
2. Backend: chatController.ts
   → Valida input (Zod)
   → Busca/cria chat
   → Busca histórico (últimas 10 mensagens)
   → Aplica contexto (pinned messages, RAG)
   
3. Backend: ai/providers/factory.ts
   → Seleciona provider
   → Instancia driver correto
   → Envia para API externa (OpenAI, Groq, etc)
   
4. Backend: Salva mensagens
   → Mensagem do usuário (role: user)
   → Resposta da IA (role: assistant + telemetria)
   → Atualiza ApiCallLog
   
5. Backend: Retorna resposta
   → JSend: { status: "success", data: { response, chatId } }
   
6. Frontend: Atualiza UI
   → Adiciona mensagens ao estado
   → Exibe resposta com markdown
```

### 3. Auditoria (Prompt Trace)

```
1. Backend: Ao enviar mensagem
   → Salva sentContext em messages.sentContext
   → Formato: { config_V47, systemPrompt, messageIds, ... }
   
2. Frontend: Clica em "Ver Trace"
   → GET /api/prompt-trace/:messageId
   
3. Backend: promptTraceController.ts
   → Busca message.sentContext
   → Reconstrói payload usando messageIds
   → Retorna trace completo
   
4. Frontend: PromptTraceViewer
   → Exibe timeline de steps
   → Mostra payload enviado
   → Exibe telemetria (tokens, custo)
```

### 4. Analytics

```
1. Frontend: GET /api/analytics
   
2. Backend: analyticsService.ts
   → Busca ApiCallLog do usuário
   → Agrupa por data (últimos 30 dias)
   → Calcula métricas:
     - Custo total por dia
     - Eficiência por provider ($/1k tokens)
     - Mapa de carga (tokens in/out)
   
3. Frontend: Renderiza gráficos
   → LineChart: Custo ao longo do tempo
   → BarChart: Eficiência por provider
   → ScatterChart: Mapa de carga
```

---

## 📡 API ENDPOINTS

### Autenticação (Público)
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/github` - OAuth GitHub
- `GET /api/auth/google` - OAuth Google

### Autenticação (Protegido)
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/change-password` - Alterar senha

### Chat
- `POST /api/chat/message` - Enviar mensagem
- `GET /api/chat-history` - Listar conversas
- `GET /api/chat-history/:chatId` - Mensagens de uma conversa
- `DELETE /api/chat-history/:chatId` - Deletar conversa

### Configurações
- `GET /api/settings` - Buscar configurações
- `PUT /api/settings` - Atualizar configurações

### Analytics
- `GET /api/analytics` - Dados de telemetria e gráficos

### Auditoria
- `GET /api/audit` - Listar registros de auditoria
- `GET /api/audit/:id` - Detalhes de um registro

### Prompt Trace
- `GET /api/prompt-trace/:messageId` - Rastreamento de prompt

### Providers
- `GET /api/ai/providers` - Listar providers disponíveis
- `GET /api/providers/validate/:provider` - Validar credenciais

### Perfil
- `PUT /api/user/profile` - Atualizar nome

### Health Check
- `GET /api/health` - Status do servidor

**Documentação Completa:** [`docs/api-endpoints.md`](docs/api-endpoints.md)

---

## 🧩 FEATURES PRINCIPAIS

### 1. Chat Multi-Provider

**Localização:** [`frontend/src/features/chat/`](frontend/src/features/chat/)

**Componentes:**
- [`ChatInput`](frontend/src/features/chat/components/input/ChatInput.tsx) - Input de mensagem
- [`MessageList`](frontend/src/features/chat/components/message/MessageList.tsx) - Lista de mensagens
- [`ControlPanel`](frontend/src/features/chat/components/ControlPanel/) - Painel de configuração
- [`HistorySidebar`](frontend/src/features/chat/components/drawer/HistorySidebar.tsx) - Histórico de conversas

**Hooks:**
- [`useChatLogic`](frontend/src/features/chat/hooks/useChatLogic.ts) - Lógica principal do chat
- [`useChatInput`](frontend/src/features/chat/hooks/useChatInput.ts) - Lógica do input

**Funcionalidades:**
- ✅ Suporte a 6+ providers (OpenAI, Groq, Claude, Together, Perplexity, Mistral)
- ✅ Histórico persistente no banco de dados
- ✅ Múltiplas conversas simultâneas
- ✅ Pinned messages (fixar mensagens importantes)
- ✅ Contexto manual (adicionar texto customizado)
- ✅ RAG (busca semântica com pgvector)
- ✅ Markdown rendering com syntax highlighting
- ✅ Telemetria por mensagem (tokens, custo)
- ✅ Streaming de respostas (futuro)

### 2. Sistema de Auditoria

**Localização:** [`backend/src/audit/`](backend/src/audit/) + [`frontend/src/features/audit/`](frontend/src/features/audit/)

**Backend:**
- [`AuditRecord`](backend/src/audit/domain/AuditRecord.ts) - Entidade de auditoria
- [`AuditRecordBuilder`](backend/src/audit/builders/AuditRecordBuilder.ts) - Builder pattern
- [`sentContextParser`](backend/src/audit/utils/sentContextParser.ts) - Parser de contexto

**Frontend:**
- [`AuditPage`](frontend/src/features/auditPage/index.tsx) - Página principal
- [`AuditTable`](frontend/src/features/auditPage/components/AuditTable.tsx) - Tabela de registros
- [`AuditViewerModal`](frontend/src/features/auditViewer/AuditViewerModal.tsx) - Modal de detalhes

**Funcionalidades:**
- ✅ Rastreamento completo de inferências
- ✅ Visualização de payload enviado
- ✅ Telemetria detalhada (tokens, custo, latência)
- ✅ Filtros por provider, data, status
- ✅ Exportação de dados (futuro)

### 3. Prompt Trace

**Localização:** [`frontend/src/features/promptTrace/`](frontend/src/features/promptTrace/)

**Componentes:**
- [`PromptTraceViewer`](frontend/src/features/promptTrace/components/PromptTraceViewer.tsx) - Visualizador principal
- [`PromptTraceTimeline`](frontend/src/features/promptTrace/components/PromptTraceTimeline.tsx) - Timeline de steps
- [`PromptTraceStepDetails`](frontend/src/features/promptTrace/components/PromptTraceStepDetails.tsx) - Detalhes de cada step

**Funcionalidades:**
- ✅ Reconstrução de payload enviado à IA
- ✅ Timeline visual de steps (system prompt, histórico, RAG, pinned)
- ✅ Visualização de tokens por step
- ✅ Exportação de trace (JSON)

### 4. Analytics Dashboard

**Localização:** [`frontend/src/features/analytics/`](frontend/src/features/analytics/) (não listado, verificar)

**Gráficos:**
- **LineChart:** Custo total diário (últimos 30 dias)
- **BarChart:** Eficiência de custo por provider ($/1k tokens)
- **ScatterChart:** Mapa de carga (tokens entrada vs. saída)

**Funcionalidades:**
- ✅ Telemetria financeira (custo por token)
- ✅ Telemetria de engenharia (palavras, bytes)
- ✅ Comparação entre providers
- ✅ Filtros por período

### 5. Configurações (Settings)

**Localização:** [`frontend/src/features/settings/`](frontend/src/features/settings/)

**Abas:**
- **Profile:** Nome do usuário, email
- **Appearance:** Tema (dark/light)
- **API Keys:** Gerenciamento de chaves de API (criptografadas)

**Providers Suportados:**
- Standard: OpenAI, Groq, Claude, Together, Perplexity, Mistral
- AWS Bedrock: Access Key, Secret Key, Region, Modelos habilitados
- Azure (futuro)

**Funcionalidades:**
- ✅ Criptografia AES-256 de API keys
- ✅ Validação de credenciais em tempo real
- ✅ Sincronização automática entre dispositivos
- ✅ Placeholders de segurança (ex: `sk-...1234`)

### 6. Autenticação

**Localização:** [`frontend/src/features/login/`](frontend/src/features/login/) + [`frontend/src/features/register/`](frontend/src/features/register/)

**Métodos:**
- Email/Password (JWT)
- OAuth GitHub (Passport.js)
- OAuth Google (Passport.js)

**Funcionalidades:**
- ✅ JWT com validade de 7 dias
- ✅ Refresh token (futuro)
- ✅ Proteção de rotas (ProtectedRoute)
- ✅ Context API (AuthContext)

---

## 🛠️ FERRAMENTAS E SCRIPTS

### Scripts de Gerenciamento

**[`start.sh`](start.sh)** - Script principal de gerenciamento

```bash
# Iniciar backend e frontend
./start.sh start both

# Apenas backend
./start.sh start backend

# Apenas frontend
./start.sh start frontend

# Ver status
./start.sh status

# Parar servidores
./start.sh stop both

# Reiniciar
./start.sh restart both
```

**Features:**
- ✅ Quality Gates automáticos (ESLint + TypeScript)
- ✅ Gerenciamento de processos em background
- ✅ Logs estruturados em `logs/`
- ✅ Limpeza automática de portas
- ✅ Health check com timeout

**Documentação:** [`START-SH-DOCS.md`](START-SH-DOCS.md)

### Scripts de Segurança

**[`backend/security-tests.sh`](backend/security-tests.sh)** - Suite de testes de segurança

```bash
cd backend
./security-tests.sh
# Resultado esperado: 7/7 testes PASS
```

**Categorias:**
1. Secrets validation (JWT_SECRET, ENCRYPTION_SECRET)
2. Rate limiting (auth, chat, API)
3. Helmet headers (CSP, X-Frame-Options)
4. Zod validation (todas as rotas)
5. SQL injection protection (Prisma)
6. CORS configuration
7. HTTPS redirect (produção)

### Scripts de Banco de Dados

**Migrations:**
```bash
cd backend
npx prisma migrate dev        # Criar migration
npx prisma migrate deploy     # Aplicar em produção
npx prisma generate           # Gerar Prisma Client
npx prisma studio             # Interface visual
```

**Seed:**
```bash
cd backend
npx prisma db seed            # Executar seed.ts
```

**Scripts Customizados:**
- [`backend/scripts/backfillEmbeddings.ts`](backend/scripts/backfillEmbeddings.ts) - Gerar embeddings para RAG
- [`backend/scripts/seedAudit.ts`](backend/scripts/seedAudit.ts) - Seed de auditoria
- [`backend/scripts/testEmbedding.ts`](backend/scripts/testEmbedding.ts) - Testar embeddings

### Git Hooks (Husky)

**Localização:** [`.husky/`](.husky/)

**Pre-commit:**
```bash
# Executado automaticamente antes de cada commit
npm run lint        # ESLint (0 errors obrigatório)
npm run type-check  # TypeScript (0 errors obrigatório)
```

**Documentação:** [`.husky/README.md`](.husky/README.md) + [`QUALITY-GATES-SETUP.md`](QUALITY-GATES-SETUP.md)

---

## 📚 DOCUMENTAÇÃO ESSENCIAL

### Leitura Obrigatória

1. **[`docs/STANDARDS.md`](docs/STANDARDS.md)** ⚠️ **CRÍTICO**
   - Padrões arquiteturais imutáveis
   - Convenções de código
   - Regras de segurança
   - Identidade visual
   - JSend API standard
   - Commits e versionamento

2. **[`docs/SECURITY-STANDARDS.md`](docs/SECURITY-STANDARDS.md)**
   - Checklist de segurança
   - Padrões de produção
   - Testes obrigatórios

3. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**
   - Visão geral da arquitetura
   - Factory Pattern
   - Database-Driven Configuration

4. **[`ARCHITECTURE-DIAGRAMS.md`](ARCHITECTURE-DIAGRAMS.md)**
   - Diagramas visuais do sistema
   - Fluxos de autenticação, chat, auditoria
   - Modelo de dados

### Documentação Técnica

- **[`docs/api-endpoints.md`](docs/api-endpoints.md)** - API REST completa
- **[`docs/setup-guide.md`](docs/setup-guide.md)** - Guia de instalação
- **[`docs/AWS-BEDROCK-SETUP.md`](docs/AWS-BEDROCK-SETUP.md)** - Setup AWS Bedrock
- **[`docs/VISUAL-IDENTITY-GUIDE.md`](docs/VISUAL-IDENTITY-GUIDE.md)** - Guia de design

### Documentação de Features

- **[`docs/audit/README.md`](docs/audit/README.md)** - Sistema de auditoria
- **[`docs/tests/testing.md`](docs/tests/testing.md)** - Guia de testes

### Relatórios de Implementação

- **[`backend/SECURITY-PHASE1-DONE.md`](backend/SECURITY-PHASE1-DONE.md)** - ✅ Fase 1: Validação de Secrets
- **[`backend/SECURITY-PHASE2-DONE.md`](backend/SECURITY-PHASE2-DONE.md)** - ✅ Fase 2: Rate Limiting + Helmet
- **[`docs/JSEND-FINAL-REPORT.md`](docs/JSEND-FINAL-REPORT.md)** - ✅ Migração JSend completa

---

## 🚀 COMO COMEÇAR

### Pré-requisitos

- Node.js 22+
- PostgreSQL 14+
- npm ou yarn

### Instalação

```bash
# 1. Clonar repositório
git clone <repo-url>
cd MyIA

# 2. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 3. Configurar backend
cd backend
cp .env.example .env
# Editar .env com suas credenciais

# 4. Configurar banco de dados
npx prisma migrate dev
npx prisma generate

# 5. Iniciar servidores
cd ..
./start.sh start both
```

### Acessar Aplicação

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

### Primeiro Uso

1. Registrar conta em `/register`
2. Fazer login em `/login`
3. Configurar API keys em `/settings`
4. Iniciar chat em `/chat`

---

## 🧪 TESTES

### Backend

```bash
cd backend

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage

# Testes de segurança
./security-tests.sh
```

### Frontend

```bash
cd frontend

# Testes (futuro)
npm test

# Lint
npm run lint

# Type check
npm run type-check
```

### Quality Gates

```bash
# Executar ANTES de cada commit
npm run lint        # 0 errors obrigatório
npm run type-check  # 0 errors obrigatório
```

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

### Backend

**Core:**
- `express` - Framework web
- `@prisma/client` - ORM
- `typescript` - Linguagem

**Autenticação:**
- `jsonwebtoken` - JWT
- `bcrypt` - Hash de senhas
- `passport` - OAuth
- `passport-github2` - OAuth GitHub
- `passport-google-oauth20` - OAuth Google

**Segurança:**
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `zod` - Validação de schemas
- `crypto-js` - Criptografia AES-256
- `cors` - CORS

**IA:**
- `openai` - SDK OpenAI (universal)
- `@anthropic-ai/sdk` - Claude
- `@aws-sdk/client-bedrock-runtime` - AWS Bedrock
- `tiktoken` - Contagem de tokens

**Utilidades:**
- `winston` - Logging
- `axios` - Cliente HTTP
- `dotenv` - Variáveis de ambiente

### Frontend

**Core:**
- `react` - Biblioteca UI
- `react-dom` - React DOM
- `react-router-dom` - Roteamento
- `typescript` - Linguagem
- `vite` - Build tool

**UI:**
- `@mui/material` - Componentes Material-UI
- `@mui/icons-material` - Ícones
- `@mui/x-charts` - Gráficos
- `@emotion/react` - CSS-in-JS
- `@emotion/styled` - Styled components

**Markdown:**
- `react-markdown` - Renderização Markdown
- `react-syntax-highlighter` - Syntax highlighting
- `remark-gfm` - GitHub Flavored Markdown

**Utilidades:**
- `axios` - Cliente HTTP
- `tiktoken` - Contagem de tokens (client-side)

---

## 🔧 VARIÁVEIS DE AMBIENTE

### Backend (`.env`)

```env
# === OBRIGATÓRIAS ===

# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/myia"

# Segurança (min 32 chars)
JWT_SECRET="<gerar com crypto.randomBytes(32).toString('hex')>"
ENCRYPTION_SECRET="<gerar com crypto.randomBytes(32).toString('hex')>"

# CORS
CORS_ORIGIN="http://localhost:3000"

# === OPCIONAIS ===

# Ambiente
NODE_ENV="development"  # development | production
PORT="3001"

# Providers de IA (configurar apenas os que usar)
OPENAI_API_KEY="sk-..."
GROQ_API_KEY="gsk_..."
ANTHROPIC_API_KEY="sk-ant-..."
TOGETHER_API_KEY="..."
PERPLEXITY_API_KEY="..."
MISTRAL_API_KEY="..."

# AWS Bedrock
AWS_BEDROCK_CREDENTIALS="ACCESS_KEY:SECRET_KEY"
AWS_BEDROCK_REGION="us-east-1"

# OAuth (se usar)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Frontend (`.env`)

```env
# API URL
VITE_API_URL="http://localhost:3001"
```

---

## 🐛 TROUBLESHOOTING

### Problemas Comuns

#### 1. Erro: "No token provided"
**Causa:** Token JWT não enviado no header  
**Solução:** Verificar se `Authorization: Bearer <token>` está presente

#### 2. Erro: "Invalid token"
**Causa:** Token expirado ou inválido  
**Solução:** Fazer login novamente

#### 3. Erro 500 em `/api/settings`
**Causa:** Dados órfãos no banco (foreign key constraint)  
**Solução:** Ver [`docs/api-endpoints.md`](docs/api-endpoints.md) seção "Solução: Erro 500"

#### 4. CORS Error
**Causa:** Origem não permitida  
**Solução:** Ajustar `CORS_ORIGIN` no `.env`

#### 5. ESLint errors no commit
**Causa:** Quality gates falhando  
**Solução:** Executar `npm run lint:fix` e corrigir erros restantes

#### 6. TypeScript errors no commit
**Causa:** Erros de tipo  
**Solução:** Executar `npm run type-check` e corrigir erros

#### 7. Porta 3001 já em uso
**Causa:** Backend já rodando ou porta ocupada  
**Solução:** `./start.sh stop backend` ou `lsof -ti:3001 | xargs kill -9`

---

## 📈 ROADMAP

### Implementado ✅

- [x] Autenticação JWT
- [x] Chat multi-provider
- [x] Histórico persistente
- [x] Telemetria completa
- [x] Analytics dashboard
- [x] Sistema de auditoria
- [x] Prompt trace
- [x] Dark/Light mode
- [x] Criptografia de API keys
- [x] Rate limiting
- [x] Helmet security headers
- [x] Validação Zod
- [x] JSend API standard
- [x] OAuth (GitHub, Google)
- [x] RAG (pgvector)
- [x] Pinned messages
- [x] Quality gates (ESLint + TypeScript)

### Em Desenvolvimento 🚧

- [ ] Streaming de respostas
- [ ] Edição de mensagens (versionamento)
- [ ] Exportação de dados (CSV, JSON)
- [ ] Painel admin (gerenciar providers)
- [ ] Testes automatizados (Jest)
- [ ] CI/CD (GitHub Actions)

### Planejado 📋

- [ ] Suporte a imagens (GPT-4 Vision)
- [ ] Suporte a áudio (Whisper)
- [ ] Compartilhamento de conversas
- [ ] Temas customizados
- [ ] Plugins/extensões
- [ ] API pública (webhooks)
- [ ] Mobile app (React Native)

---

## 🤝 CONTRIBUINDO

### Fluxo de Trabalho

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie branch** de feature: `git checkout -b feature/minha-feature`
4. **Faça commits** seguindo [Conventional Commits](#commits-e-versionamento)
5. **Execute quality gates:** `npm run lint && npm run type-check`
6. **Execute testes:** `npm test`
7. **Push** para seu fork: `git push origin feature/minha-feature`
8. **Abra Pull Request**

### Padrões de Commit

**Formato:**
```
<type>: <description>

[optional body]
[optional footer]
```

**Types:**
- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `refactor` - Refatoração
- `test` - Testes
- `chore` - Manutenção
- `perf` - Performance
- `style` - Formatação

**Exemplos:**
```bash
feat: add streaming support for chat responses
fix: resolve JWT payload mismatch (userId vs id)
docs: update CODEBASE-INDEX with new sections
refactor: extract chat logic to custom hook
test: add security test suite (7 categories)
```

### Checklist Pré-Commit

- [ ] ESLint passa sem erros (`npm run lint`)
- [ ] TypeScript compila (`npm run type-check`)
- [ ] Testes passam (`npm test`)
- [ ] Headers obrigatórios em novos arquivos
- [ ] Sem cores hardcoded (usar theme.ts)
- [ ] JSend em novas rotas
- [ ] Documentação atualizada

---

## 📄 LICENÇA

MIT License - Ver arquivo `LICENSE`

---

## 👥 AUTORES

- **Leonardo Passos** (@LeoPassos98) - Desenvolvedor Principal

---

## 🙏 AGRADECIMENTOS

- [OpenAI](https://openai.com) - GPT models
- [Groq](https://groq.com) - LLaMA models
- [Anthropic](https://anthropic.com) - Claude models
- [Material-UI](https://mui.com) - Componentes React
- [Prisma](https://prisma.io) - ORM incrível

---

## 📞 SUPORTE

- **Issues:** GitHub Issues
- **Documentação:** [`docs/`](docs/)
- **Email:** (adicionar se aplicável)

---

**Última Atualização:** 2026-01-15  
**Versão do Documento:** 1.0  
**Mantido por:** @LeoPassos98

---

## 🔖 TAGS PARA BUSCA RÁPIDA

`#architecture` `#backend` `#frontend` `#database` `#security` `#api` `#chat` `#ai` `#providers` `#audit` `#telemetry` `#analytics` `#authentication` `#jwt` `#oauth` `#prisma` `#postgresql` `#react` `#typescript` `#material-ui` `#express` `#nodejs` `#jsend` `#rate-limiting` `#helmet` `#zod` `#encryption` `#rag` `#pgvector` `#openai` `#groq` `#claude` `#bedrock` `#quality-gates` `#eslint` `#testing` `#documentation`