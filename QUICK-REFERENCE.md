# 🚀 QUICK REFERENCE - MyIA

> **Referência Rápida para Desenvolvimento**  
> Consulte [`CODEBASE-INDEX.md`](CODEBASE-INDEX.md) para documentação completa

---

## 📌 ESSENCIAIS

### Documentos Obrigatórios
1. **[`docs/STANDARDS.md`](docs/STANDARDS.md)** ⚠️ **LEIA ANTES DE CODIFICAR**
2. **[`CODEBASE-INDEX.md`](CODEBASE-INDEX.md)** - Indexação completa da codebase
3. **[`ARCHITECTURE-DIAGRAMS.md`](ARCHITECTURE-DIAGRAMS.md)** - Diagramas visuais da arquitetura
4. **[`docs/SECURITY-STANDARDS.md`](docs/SECURITY-STANDARDS.md)** - Padrões de segurança

### Comandos Rápidos

```bash
# Iniciar tudo
./start.sh start both

# Parar tudo
./start.sh stop both

# Ver status
./start.sh status

# Quality gates
npm run lint && npm run type-check

# Testes de segurança
cd backend && ./security-tests.sh
```

---

## 🏗️ ARQUITETURA EM 1 MINUTO

### Stack
- **Backend:** Node.js + TypeScript + Express + Prisma + PostgreSQL
- **Frontend:** React 18 + TypeScript + Vite + Material-UI v6
- **Auth:** JWT + Passport.js (OAuth)
- **Security:** Helmet + Rate Limiting + Zod + AES-256

### Padrões Principais
1. **Factory Pattern** - Providers de IA dinâmicos
2. **Database-Driven** - Configuração no banco, não no código
3. **JSend API** - Formato padrão de resposta
4. **Backend-First** - Fonte única de verdade
5. **Lean Storage** - Salvar IDs, não conteúdo duplicado

### Estrutura de Pastas

```
MyIA/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Orquestração
│   │   ├── services/       # Lógica de negócio
│   │   ├── middleware/     # Auth, validação, rate limit
│   │   ├── routes/         # Definição de rotas
│   │   └── audit/          # Sistema de auditoria
│   └── prisma/
│       └── schema.prisma   # Schema do banco
├── frontend/
│   ├── src/
│   │   ├── features/       # Features modulares
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Context API
│   │   ├── services/       # API clients
│   │   └── theme.ts        # ÚNICA fonte de cores
└── docs/                   # Documentação
```

---

## 🔐 SEGURANÇA - CHECKLIST

### Antes de Commitar
- [ ] ESLint: 0 errors (`npm run lint`)
- [ ] TypeScript: 0 errors (`npm run type-check`)
- [ ] Headers obrigatórios em novos arquivos
- [ ] Sem cores hardcoded (usar `theme.ts`)
- [ ] JSend em novas rotas
- [ ] Rate limiting aplicado
- [ ] Validação Zod em POST/PUT/PATCH/DELETE

### Variáveis Críticas (.env)
```env
# OBRIGATÓRIAS (min 32 chars)
JWT_SECRET="<gerar com crypto.randomBytes(32)>"
ENCRYPTION_SECRET="<gerar com crypto.randomBytes(32)>"
DATABASE_URL="postgresql://user:pass@localhost:5432/myia"
CORS_ORIGIN="http://localhost:3000"
```

### Testes de Segurança
```bash
cd backend
./security-tests.sh  # Deve passar 7/7 testes
```

---

## 📡 API - ENDPOINTS PRINCIPAIS

### Autenticação
```bash
POST /api/auth/register    # Criar conta
POST /api/auth/login       # Login (retorna JWT)
GET  /api/auth/me          # Dados do usuário (protegido)
```

### Chat
```bash
POST   /api/chat/message           # Enviar mensagem
GET    /api/chat-history           # Listar conversas
GET    /api/chat-history/:chatId   # Mensagens de uma conversa
DELETE /api/chat-history/:chatId   # Deletar conversa
```

### Configurações
```bash
GET /api/settings    # Buscar configurações
PUT /api/settings    # Atualizar configurações
```

### Analytics & Auditoria
```bash
GET /api/analytics                  # Telemetria e gráficos
GET /api/audit                      # Registros de auditoria
GET /api/prompt-trace/:messageId    # Rastreamento de prompt
```

**Formato JSend:**
```json
// Sucesso
{ "status": "success", "data": {...} }

// Falha
{ "status": "fail", "data": {"campo": "mensagem"} }

// Erro
{ "status": "error", "message": "...", "code": 500 }
```

---

## 🎨 FRONTEND - REGRAS DE OURO

### 1. Cores (CRÍTICO)
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

**Fonte Única:** [`frontend/src/theme.ts`](frontend/src/theme.ts)

### 2. Separação View/Logic
```typescript
// ChatPage.tsx (View - apenas JSX)
import { useChatLogic } from './hooks/useChatLogic';

export function ChatPage() {
  const { messages, sendMessage } = useChatLogic();
  return <div>...</div>;
}

// hooks/useChatLogic.ts (Logic - estado e handlers)
export function useChatLogic() {
  const [messages, setMessages] = useState([]);
  const sendMessage = async (text: string) => { ... };
  return { messages, sendMessage };
}
```

### 3. Layout e Scroll
- Scroll é responsabilidade do [`MainContentWrapper`](frontend/src/components/Layout/MainContentWrapper.tsx)
- Páginas NUNCA devem usar `overflow: auto` ou `height: 100vh`
- Layout raiz usa `overflow: hidden`

### 4. ObservabilityPageLayout
Use para páginas complexas com:
- Múltiplas seções + navegação
- Sidebar ou drawer
- Visualização de dados

**Exemplos:** AuditPage, PromptTracePage

---

## 🗄️ BANCO DE DADOS - SCHEMA RÁPIDO

### Tabelas Principais

**users** - Usuários do sistema
```sql
id, email, password, name, createdAt, updatedAt
```

**user_settings** - Configurações (1:1 com users)
```sql
id, userId, theme, openaiApiKey, groqApiKey, ...
```

**chats** - Conversas
```sql
id, userId, title, provider, createdAt, updatedAt
```

**messages** - Histórico de mensagens
```sql
id, chatId, role, content, isPinned, createdAt
provider, model, tokensIn, tokensOut, costInUSD
sentContext (JSON), vector (pgvector)
```

**api_call_logs** - Telemetria
```sql
id, userId, timestamp, provider, model
tokensIn, tokensOut, costInUSD
wordsIn, wordsOut, bytesIn, bytesOut
```

**ai_providers** - Providers de IA
```sql
id, name, slug, isActive, baseUrl
```

**ai_models** - Modelos de IA
```sql
id, providerId, name, apiModelId, contextWindow
costPer1kInput, costPer1kOutput, isActive
```

### Comandos Prisma
```bash
npx prisma migrate dev        # Criar migration
npx prisma generate           # Gerar client
npx prisma studio             # Interface visual
npx prisma db seed            # Executar seed
```

---

## 🧩 FEATURES - LOCALIZAÇÃO RÁPIDA

| Feature | Backend | Frontend |
|---------|---------|----------|
| **Chat** | [`controllers/chatController.ts`](backend/src/controllers/chatController.ts) | [`features/chat/`](frontend/src/features/chat/) |
| **Auditoria** | [`audit/`](backend/src/audit/) | [`features/audit/`](frontend/src/features/audit/) |
| **Prompt Trace** | [`controllers/promptTraceController.ts`](backend/src/controllers/promptTraceController.ts) | [`features/promptTrace/`](frontend/src/features/promptTrace/) |
| **Analytics** | [`services/analyticsService.ts`](backend/src/services/analyticsService.ts) | [`features/analytics/`](frontend/src/features/analytics/) |
| **Settings** | [`controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts) | [`features/settings/`](frontend/src/features/settings/) |
| **Auth** | [`controllers/authController.ts`](backend/src/controllers/authController.ts) | [`features/login/`](frontend/src/features/login/) |

---

## 🔧 PROVIDERS DE IA

### Suportados
- **OpenAI** (GPT-4, GPT-3.5)
- **Groq** (LLaMA 3.1, Mixtral)
- **Anthropic** (Claude 3.5 Sonnet)
- **Together AI** (Mixtral, LLaMA)
- **Perplexity** (Sonar models)
- **Mistral** (Mistral Large)
- **AWS Bedrock** (Claude, Titan, etc)

### Adicionar Novo Provider

**1. Banco de Dados:**
```sql
INSERT INTO ai_providers (name, slug, base_url, is_active)
VALUES ('DeepSeek', 'deepseek', 'https://api.deepseek.com/v1', true);

INSERT INTO ai_models (provider_id, name, api_model_id, ...)
VALUES (...);
```

**2. Driver (se necessário):**
- Se compatível com OpenAI: usar [`openai.ts`](backend/src/services/ai/providers/openai.ts)
- Se não: criar novo driver em [`backend/src/services/ai/providers/`](backend/src/services/ai/providers/)

**3. Frontend:**
- Nada! O frontend busca providers via API

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Erro | Solução |
|------|---------|
| `No token provided` | Adicionar `Authorization: Bearer <token>` |
| `Invalid token` | Fazer login novamente |
| `CORS error` | Ajustar `CORS_ORIGIN` no `.env` |
| Erro 500 em `/api/settings` | Ver [`docs/api-endpoints.md`](docs/api-endpoints.md) |
| ESLint errors | `npm run lint:fix` |
| TypeScript errors | `npm run type-check` |
| Porta ocupada | `./start.sh stop backend` |

---

## 📝 COMMITS - PADRÃO

**Formato:**
```
<type>: <description>
```

**Types:**
- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `refactor` - Refatoração
- `test` - Testes
- `chore` - Manutenção

**Exemplos:**
```bash
feat: add streaming support for chat
fix: resolve JWT payload mismatch
docs: update CODEBASE-INDEX
refactor: extract chat logic to hook
```

---

## 📚 LINKS ÚTEIS

### Documentação
- [CODEBASE-INDEX.md](CODEBASE-INDEX.md) - Indexação completa
- [docs/STANDARDS.md](docs/STANDARDS.md) - Padrões obrigatórios
- [docs/api-endpoints.md](docs/api-endpoints.md) - API REST
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura

### Scripts
- [start.sh](start.sh) - Gerenciamento de servidores
- [backend/security-tests.sh](backend/security-tests.sh) - Testes de segurança

### Configuração
- [backend/.env.example](backend/.env.example) - Exemplo de variáveis
- [frontend/.env.example](frontend/.env.example) - Exemplo frontend

---

## 🎯 PRÓXIMOS PASSOS

### Para Novos Desenvolvedores
1. Ler [`docs/STANDARDS.md`](docs/STANDARDS.md)
2. Ler [`CODEBASE-INDEX.md`](CODEBASE-INDEX.md)
3. Configurar ambiente (ver [README.md](README.md))
4. Executar `./start.sh start both`
5. Explorar código em [`backend/src/`](backend/src/) e [`frontend/src/`](frontend/src/)

### Para IAs/Copilots
1. Ler [`CODEBASE-INDEX.md`](CODEBASE-INDEX.md) para contexto completo
2. Consultar [`docs/STANDARDS.md`](docs/STANDARDS.md) antes de modificar código
3. Seguir padrões de commit e quality gates
4. Verificar segurança com `./security-tests.sh`

---

**Última Atualização:** 2026-01-15  
**Versão:** 1.0  
**Mantido por:** @LeoPassos98
