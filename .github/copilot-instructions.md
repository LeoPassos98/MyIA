# MyIA - Copilot Instructions

## Visão Geral

**MyIA** é um hub de IA multi-provider com chat persistente, auditoria e analytics.

**Stack:**
- Frontend: React 18 + Vite + MUI v6
- Backend: Express + Prisma + PostgreSQL
- IA: Multi-provider (Groq, AWS Bedrock, OpenAI, etc)

## 🔴 Regra #1: Sempre leia STANDARDS.md

**[docs/STANDARDS.md](../docs/STANDARDS.md)** é a constituição do projeto. Contém:
- Headers obrigatórios
- Naming conventions
- Separação view/logic
- Cores via tema
- Validação, segurança, logging
- Limites de arquivos (≤400 linhas)

**Leia antes de modificar qualquer código.**

## Variáveis de Ambiente

Arquivo: `backend/.env` (copiar de `.env.example`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `JWT_SECRET` | ✅ | Secret para tokens JWT |
| `REDIS_HOST` | Não | Host Redis (padrão: localhost) |
| `REDIS_PORT` | Não | Porta Redis (padrão: 6379) |
| `USE_NEW_ADAPTERS` | Não | `true` para Claude 4.x (Inference Profiles) |
| `CORS_ORIGIN` | Não | Origens permitidas (separadas por vírgula) |
| `CERTIFICATION_SIMULATION` | Não | `true` para simular certificações (dev) |

Chaves de API dos providers: **criptografadas no banco** (`user_settings`), não em `.env`.

## Comandos de Desenvolvimento

```bash
# Iniciar tudo
./start.sh start both

# Backend apenas
cd backend && npm run dev

# Frontend apenas
cd frontend && npm run dev

# Prisma
cd backend
npm run prisma:migrate    # aplicar migrations
npm run prisma:studio     # GUI do banco

# Validação (obrigatória após modificar TS/TSX)
cd backend && npm run type-check && npm run lint
cd frontend && npm run type-check && npm run lint
```

## Estrutura de Diretórios

```
backend/
  src/
    services/ai/providers/  # Factory + adapters de IA
    audit/                  # Builders, mappers (DDD-like)
    controllers/            # Route handlers
    middleware/             # Auth, validation, error handling
  prisma/schema.prisma      # Schema do banco

frontend/
  src/
    features/               # chat/, audit/, settings/, etc
      chat/
        components/         # .tsx (views)
        hooks/              # useX.ts (lógica)
    components/Layout/      # MainLayout, MainContentWrapper
    theme.ts                # Design tokens centralizados
```

## Fluxos Críticos do Sistema

### 1. Chat com IA (SSE Streaming)

```
Frontend → POST /api/chat/send
         → chatController.sendMessage()
         → AIProviderFactory.getProviderInstance(provider)
         → Adapter específico (groq, bedrock, openai)
         → SSE streaming de volta
         → Frontend renderiza chunks em tempo real
```

### 2. Sistema RAG Híbrido (Contexto Inteligente)

**Arquivo:** `backend/src/services/chat/contextService.ts`

**Estratégia com prioridade:**

1. **📌 Mensagens Pinadas** — Sempre incluídas (prioridade máxima)
2. **🧠 Busca Semântica (RAG)** — `ragService.findSimilarMessages()` via embeddings
3. **🕐 Memória Recente** — Últimas N mensagens do chat

**Algoritmo de orçamento de tokens:**
```typescript
// FASE 1: Inclui TODAS as mensagens pinadas (obrigatório)
// FASE 2: Combina RAG + Recentes (remove duplicatas)
// FASE 3: Preenche até MAX_CONTEXT_TOKENS (padrão: 4000-6000)
```

**Endpoints relacionados:**
- `PATCH /api/chat-history/message/:id/pin` — Fixar/desafixar mensagem
- Frontend envia eventos SSE de debug (`type: 'debug'`) mostrando construção do contexto

### 3. Auditoria e Prompt Trace

**Regra arquitetural:** Backend é fonte única de verdade para IDs auditáveis.

**Fluxo:**
```
Mensagem enviada → chatController
                 → AuditRecordBuilder.build()
                 → Salva sentContext (metadados + messageIds, NÃO conteúdo duplicado)
                 → Frontend consulta via modal read-only
```

**Campo `sentContext` na tabela `messages`:**
```typescript
{
  config_V47: { mode, model, provider, timestamp },
  systemPrompt: "...",        // Único que se repete (não está no banco)
  messageIds: ["uuid1"...],   // Ponteiros, não conteúdo
  pinnedStepIndices: [0, 2],
  stepOrigins: { "0": "pinned", "1": "rag" },
  preflightTokenCount: 1500
}
```

### 4. Providers Dinâmicos (Database-Driven)

Configurações de IA vêm do banco (`ai_providers`), não código.

**Para adicionar nova IA:**
1. INSERT na tabela `ai_providers`
2. Criar adapter em `backend/src/services/ai/adapters/`
3. Registrar no Factory

Frontend consulta `GET /api/ai/providers` para listar dinamicamente.

---

**Leia também:** [docs/copilot_ai/standards_ai.md](../docs/copilot_ai/standards_ai.md) — Regras de comportamento para IA.
