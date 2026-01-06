# MyIA - Copilot Instructions

## Visão Geral

MyIA é um hub de IA multi-provider com chat persistente, auditoria e analytics. Stack: React 18 + Vite (frontend), Express + Prisma + PostgreSQL (backend).

## Regra #1: STANDARDS.md é a Constituição

**SEMPRE leia [docs/STANDARDS.md](../docs/STANDARDS.md) antes de modificar qualquer arquivo.** Este documento define regras imutáveis de arquitetura e codificação que devem ser seguidas estritamente.

## Padrões de Código Obrigatórios

### Header de Arquivo (OBRIGATÓRIO em todo arquivo)
```typescript
// backend/src/services/ai/index.ts  <-- caminho relativo
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
```

### Naming Convention
- **Arquivos TS/JS (lógica):** `camelCase` → `chatController.ts`
- **Componentes React:** `PascalCase` → `ChatInput.tsx`
- **Hooks:** `camelCase` com prefixo `use` → `useChatLogic.ts`
- **Interfaces:** `PascalCase` **SEM** prefixo "I" → `User`, não `IUser`
- **Prisma Models:** `PascalCase`, tabelas `snake_case`

## Arquitetura Frontend (React + MUI v6)

### Separação View/Logic (CRÍTICO)
- **`.tsx` (View):** Apenas JSX e estilos, sem `useState`/`useEffect` complexos
- **`useX.ts` (Lógica):** Custom hooks contêm toda lógica de negócio

Exemplo: `ChatInput.tsx` usa `useChatInput.ts` para lógica

### Cores e Temas
```typescript
// ❌ PROIBIDO - cores hardcoded
<Box sx={{ color: '#00FF41' }} />

// ✅ CORRETO - usar tokens do tema
<Box sx={{ color: 'primary.main' }} />
<Box sx={{ color: theme.palette.custom.matrix }} />
```

Adicionar cores novas em [frontend/src/theme.ts](../frontend/src/theme.ts)

### Scroll e Layout
- **`MainContentWrapper`** é o ÚNICO responsável pelo scroll vertical
- Páginas **NUNCA** controlam scroll global (`overflow`, `height: 100vh` proibidos)
- Páginas observáveis complexas (audit, prompt-trace) devem usar `ObservabilityPageLayout`

## Arquitetura Backend (Express + Prisma)

### Factory Pattern para Providers de IA
```typescript
// ✅ CORRETO - usar factory
const provider = await AIProviderFactory.getProviderInstance('groq');
```

Configuração de providers é **database-driven** (tabela `ai_providers`). Para adicionar nova IA: INSERT no banco, não código.

### Validação com Zod
Usar middleware `validateRequest(schema)` para validar requests:
```typescript
router.post('/chat', authMiddleware, validateRequest(chatSchema), chatController.sendMessage);
```

### Auditoria (Regra Arquitetural Imutável)
- **Backend é a única fonte de verdade** para IDs auditáveis
- ❌ PROIBIDO gerar IDs de mensagens/inferências no frontend
- ✅ Frontend sempre consome IDs retornados pelo backend
- Builder pattern: `AuditRecordBuilder.build(input)` para criar registros

## Variáveis de Ambiente Críticas

Arquivo: `backend/.env` (copiar de `.env.example`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ Sim | Connection string PostgreSQL |
| `JWT_SECRET` | ✅ Sim | Secret para tokens JWT (inseguro se ausente) |
| `CORS_ORIGIN` | Não | Origens permitidas (ex: `http://localhost:3000,http://localhost:5173`) |

Chaves de API dos providers são armazenadas **criptografadas no banco** (tabela `user_settings`), não em `.env`.

## Comandos de Desenvolvimento

```bash
# Iniciar tudo (backend + frontend)
./start.sh start both

# Backend apenas
cd backend && npm run dev

# Frontend apenas
cd frontend && npm run dev

# Prisma
cd backend
npm run prisma:migrate    # aplicar migrations
npm run prisma:studio     # GUI do banco
```

## Estrutura de Diretórios Chave

```
backend/
  src/
    services/ai/providers/  # Factory + drivers de IA
    audit/                  # Domain, builders, mappers (DDD-like)
    controllers/            # Route handlers
    middleware/             # Auth, validation, error handling
  prisma/schema.prisma      # Single source of truth do schema

frontend/
  src/
    features/               # Feature folders (chat/, audit/, etc)
      chat/
        components/         # .tsx views
        hooks/              # useX.ts logic
    components/Layout/      # MainLayout, MainHeader, MainContentWrapper
    theme.ts                # Design tokens centralizados
```

## Fluxo de Dados Crítico

1. **Chat com IA:** Frontend → `POST /api/chat/send` (SSE streaming) → `AIProviderFactory` → Provider específico
2. **Providers dinâmicos:** Frontend consulta `GET /api/ai/providers` (database-driven)
3. **Auditoria:** Mensagens → `AuditRecordBuilder` → Persistência → Audit Viewer (modal read-only)

## Sistema RAG Híbrido (Contexto Inteligente)

O `contextService` ([backend/src/services/chat/contextService.ts](../backend/src/services/chat/contextService.ts)) combina três estratégias com prioridade:

1. **📌 Mensagens Pinadas (Prioridade Máxima):** Sempre incluídas, independente do budget
2. **Busca Semântica (RAG):** `ragService.findSimilarMessages()` encontra mensagens semanticamente relevantes via embeddings
3. **Memória Recente (Fast):** Últimas 10 mensagens do chat

### Algoritmo de Orçamento de Tokens
```typescript
const MAX_CONTEXT_TOKENS = 6000;
// FASE 1: Inclui TODAS as mensagens pinadas (obrigatório)
// FASE 2: Combina RAG + Recentes, remove duplicatas
// FASE 3: Preenche com RAG/Recentes até estourar o budget
```

### Sistema de Pins (Mensagens Fixadas)
- **Backend:** Campo `isPinned` na tabela `messages`, endpoint `PATCH /api/chat-history/message/:messageId/pin`
- **Frontend:** Botão de pin em cada mensagem, aba "Fixadas" no Painel de Controle
- **Prompt Trace:** Mostra ícone 📌 em steps de mensagens pinadas

### Fluxo no Chat Controller
```typescript
// Modo automático (padrão) - inclui pinned automaticamente
const report = await contextService.getHybridRagHistory(chatId, userMessage, writeSSE);
historyMessages = report.finalContext; // Já contém pinnedMessages

// Modo manual (usuário seleciona mensagens específicas)
if (selectedMessageIds?.length > 0) { ... }
```

O frontend recebe eventos SSE de debug (`type: 'debug'`) mostrando o progresso da construção do contexto.
