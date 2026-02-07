# 🤖 Padrões para IAs e Copilots

> **Status:** Experimental — Ajuste conforme a prática real do projeto.

---

## 1. O Que É MyIA

Hub de IA multi-provider com chat persistente, auditoria e analytics. Permite conversar com múltiplas IAs (OpenAI, AWS Bedrock, Groq, Anthropic) em uma única interface, com contexto inteligente via RAG e histórico auditável.

**Stack:** React 18 + Vite + MUI v6 (frontend) | Express + Prisma + PostgreSQL + pgvector (backend)

---

## 2. Arquitetura de Alto Nível

```
Frontend (React)  →  REST/SSE  →  Backend (Express)  →  PostgreSQL + pgvector
                                        ↓
                                   Factory Pattern
                                        ↓
                          [OpenAI | Bedrock | Groq | Anthropic]
```

**Padrões dominantes:** Factory (providers de IA), Builder (auditoria), Repository (Prisma), Database-Driven (configurações no banco).

---

## 3. Estrutura de Diretórios

```
backend/src/
  controllers/      # Route handlers (orquestração)
  services/ai/      # Factory + adapters de providers
  services/chat/    # contextService (RAG), chatService
  audit/            # Builders, mappers (DDD-like)
  middleware/       # Auth, validation, errorHandler
  workers/          # Bull Queue workers (certificação)
  prisma/schema.prisma

frontend/src/
  features/         # chat/, audit/, settings/ (domínios)
    chat/components/  # Views (.tsx)
    chat/hooks/       # Lógica (useX.ts)
  components/Layout/  # MainLayout, MainContentWrapper
  theme.ts          # Design tokens centralizados

frontend-admin/src/
  pages/            # Login.tsx, Certifications.tsx
  components/       # ObservabilityPageLayout (compartilhado)
  theme/            # theme.ts (isolado do frontend principal)
```

---

## 4. Fluxos Críticos

### 1. Chat com IA (SSE Streaming)
`Frontend → POST /api/chat/send → chatController → AIProviderFactory → Adapter → SSE chunks → Frontend`

### 2. RAG Híbrido (Contexto Inteligente)
`Pinadas (prioridade) + RAG (semântica via pgvector) + Recentes → Budget de tokens (4000-6000) → Contexto final`

### 3. Auditoria (Prompt Trace)
`Mensagem → AuditRecordBuilder → Salva sentContext (metadados + messageIds) → Modal read-only no frontend`

### 4. Autenticação
`POST /api/auth/login → Validação Zod → authController → bcrypt verify → JWT token (HttpOnly cookie)`  
`OAuth: GitHub/Google → Passport.js → JWT token`

### 5. Validação de Credenciais de Providers
`Usuário salva chaves → Backend criptografa → Teste de validação → ProviderCredentialValidation (status: valid/invalid/expired)`  
`Endpoint: POST /api/providers/bedrock/available-models → Testa credenciais AWS → Retorna modelos disponíveis`

### 6. Certificação de Modelos (Assíncrona via Bull Queue)
`Frontend dispara → POST /api/certification-queue/certify → Job na fila (Bull) → Worker processa → Testes por região → ModelCertification (status: certified/failed/quality_warning)`

**Tipos de certificação:**
- Por modelo individual (`/certify-model`)
- Múltiplos modelos (`/certify-multiple`)
- Todos os modelos (`/certify-all`)

### 7. Analytics e Telemetria
`Message salvada com (tokensIn, tokensOut, costInUSD, provider, model) → GET /api/analytics → Agregação → Dashboard (gráficos de custo, uso, performance)`

**Regra:** Backend gera IDs auditáveis, frontend nunca.

---

## 5. Entidades Principais (Prisma)

- **User** → UserSettings (1:1), Chat (1:N), ApiCallLog (1:N)
- **Chat** → Message (1:N), User (N:1)
- **Message** → Chat (N:1), vector (RAG embeddings), sentContext (auditoria)
- **AIProvider** → AIModel (1:N), database-driven
- **AIModel** → AIProvider (N:1), JobCertification (1:N)

Schema completo: `backend/prisma/schema.prisma`

---

## 6. Comandos Essenciais

```bash
# === INICIAR APLICAÇÃO ===

# Modo Interativo (Recomendado)
./start_interactive.sh   # Menu: escolher '7' para iniciar todos os serviços

# Serviços individuais (scripts/services/)
scripts/services/backend.sh start    # Apenas backend
scripts/services/frontend.sh start   # Apenas frontend
scripts/services/frontend-admin.sh start  # Painel admin
scripts/services/worker.sh start     # Worker de certificação
scripts/services/grafana.sh start    # Observabilidade (Grafana/Loki)
scripts/services/database.sh start   # PostgreSQL (se aplicável)

# Parar serviços
scripts/services/backend.sh stop
scripts/services/worker.sh stop
# (cada script tem start/stop/restart)

# === DESENVOLVIMENTO MANUAL ===

# Backend
cd backend
npm run dev              # Dev server (watch mode)
npm run worker:dev       # Worker em dev mode

# Frontend
cd frontend
npm run dev              # Vite dev server (porta 3000)

# Frontend Admin
cd frontend-admin
npm run dev              # Vite dev server (porta 3003)

# === PRISMA (DATABASE) ===

cd backend
npm run prisma:migrate   # Aplicar migrations (dev)
npm run prisma:studio    # GUI do banco
npm run prisma:generate  # Gerar Prisma Client

# === VALIDAÇÃO (Obrigatória após .ts/.tsx) ===

# Backend
cd backend
npm run type-check       # TypeScript check
npm run lint             # ESLint (0 errors obrigatório)

# Frontend
cd frontend
npm run type-check
npm run lint

# Frontend Admin
cd frontend-admin
npm run type-check       # Não tem lint configurado ainda

# === TESTES ===

cd backend
npm run test             # Rodar todos os testes
npm run test:unit        # Apenas unit tests
npm run test:integration # Apenas integration tests
npm run test:e2e         # Apenas e2e tests
npm run test:coverage    # Com coverage report

# === BUILD (PRODUÇÃO) ===

cd backend && npm run build           # Compila para dist/
cd frontend && npm run build          # Compila para dist/
cd frontend-admin && npm run build    # Compila para dist/

# === OBSERVABILIDADE ===

# Grafana + Loki (Docker)
cd observability
./start.sh               # Inicia stack completa
./stop.sh                # Para stack
./logs.sh                # Ver logs em tempo real
./validate.sh            # Validar configuração

# Acessos:
# - Grafana: http://localhost:3100 (admin/admin)
# - Loki API: http://localhost:3101

# === UTILITÁRIOS ===

cd backend
npm run cleanup:db       # Limpar banco (cuidado!)
npm run worker:logs      # Ver logs do worker
npm run diagnose:sync    # Diagnosticar certificações
```

---

## 7. Variáveis de Ambiente

**Obrigatórias:** `DATABASE_URL`, `JWT_SECRET`  
**Opcionais:** `CORS_ORIGIN`, `NODE_ENV`

Chaves de API dos providers: **criptografadas no banco** (`user_settings`), não em `.env`.

---

## 8. Regras de Negócio Chave

- **Backend é fonte de verdade** para IDs auditáveis (mensagens, inferências, auditoria)
- **Mensagens pinadas sempre incluídas** no contexto RAG (prioridade máxima, desconta do budget mesmo se estourar)
- **Orçamento de tokens padrão: 4000** (conservador para Groq free tier: 12K TPM limit)
- **Providers via Model Registry** — código-driven (200+ modelos em `registry/models/`), não banco
  - Modelos auto-registrados via `ModelRegistry.registerMany()` ao iniciar app
  - Banco (`ai_providers`, `ai_models`) usado apenas para metadados/configurações do usuário
- **Sistema RAG híbrido:** Pinned (obrigatório) + RAG (semântico top-K) + Recentes (fallback)
- **Certificações por região:** Modelos AWS Bedrock certificados por região (us-east-1, us-west-2, etc)

---

## 9. Integrações Externas

**Providers AWS Bedrock (via Model Registry):**
- **Anthropic:** Claude (Sonnet, Opus, Haiku) — Inference Profiles + On-Demand
- **Amazon:** Titan (Text, Embeddings, Multimodal)
- **Cohere:** Command (R, R+, Light, Text) + Rerank
- **Meta:** Llama (2, 3, 3.1, 3.2, 3.3)
- **Mistral:** Mistral (7B, Large, Small)
- **AI21:** Jamba 1.5 (Large, Mini)
- **Google:** Gemma 3 (4B, 12B, 27B)
- **Qwen:** Qwen3 (32B, Coder-30B)
- **NVIDIA:** Nemotron, Llama Nemotron
- **OpenAI:** GPT-4o, GPT-4o-mini (via Bedrock)
- **Minimax, Moonshot, 12Labs:** Modelos adicionais

**Arquitetura:**
- **AdapterFactory:** Cria adapters por vendor + inference type (`ON_DEMAND`, `INFERENCE_PROFILE`, `PROVISIONED`)
- **Model Registry:** 200+ modelos registrados em `backend/src/services/ai/registry/models/`
- **Configuração:** Database-driven via tabelas `ai_providers` e `ai_models` (não hardcoded)
- **Feature Flag:** `USE_NEW_ADAPTERS=true` para suporte a Claude 4.x com Inference Profiles

**Endpoints:**
- `GET /api/ai/providers` — Lista providers dinamicamente do banco
- `GET /api/ai/models` — Lista modelos disponíveis
- `POST /api/providers/bedrock/available-models` — Testa credenciais AWS e retorna modelos acessíveis

---

## 10. Autoridade (Documentação)

| Prioridade | Documento | Quando consultar |
|-----------|-----------|------------------|
| 🔴 P0 | [STANDARDS.md](../STANDARDS.md) | **Sempre** antes de modificar código |
| 🟠 P1 | [copilot-instructions.md](../../.github/copilot-instructions.md) | Fluxos detalhados (RAG, SSE, auditoria) |
| 🟡 P2 | [SECURITY-STANDARDS.md](../security/SECURITY-STANDARDS.md) | Auth, rotas, secrets |
| 🟢 P3 | [LOGGING-SYSTEM.md](../logging/LOGGING-SYSTEM.md) | Logs estruturados |

---

## 11. Regras para IAs (Comportamento)

### Fluxo de Trabalho
```
1. Entender requisito
2. Ler código relacionado (grep, semantic search)
3. Implementar (create_file / replace_string_in_file)
4. Validar (type-check + lint) — apenas se modificou .ts/.tsx
5. Responder conciso
```

### Validação
```bash
# Backend
cd backend && npm run type-check && npm run lint

# Frontend
cd frontend && npm run type-check && npm run lint
```
**Critério:** 0 errors. Warnings OK.

### Formato de Resposta

**Mudança simples (< 20 linhas):** Implementar + validar + 1-2 frases.  
**Mudança complexa:** Implementar + validar + bullet points do que foi feito.

**Princípio:** Ser conciso, não verboso.

### Conflito com STANDARDS.md

STANDARDS.md vence. Sempre. Citar a seção específica.

---

## 12. Resumo das Regras de Código (STANDARDS.md)

- **Header obrigatório:** `// caminho/relativo/arquivo.ts` + referência ao STANDARDS.md
- **Naming:** `camelCase` (lógica), `PascalCase` (componentes/interfaces), `useX` (hooks)
- **Cores:** Tudo via `theme.ts`, nunca hardcoded (`#HEX`, `rgba()`)
- **Logger:** `logger.info/warn/error/debug`, não `console.log`
- **API:** JSend (`{ status, data }` ou `{ status, message }`)
- **Validação:** Zod em toda rota POST/PUT/PATCH/DELETE
- **Arquivos:** ≤ 400 linhas (idealmente ≤ 250)

---

> **📌 Versão:** 2.0.0-experimental | **Data:** 2026-02-06  
> **Referência mãe:** [STANDARDS.md](../STANDARDS.md)
