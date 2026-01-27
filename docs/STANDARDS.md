# 🛑 LEIA-ME: PADRÕES DE DESENVOLVIMENTO

> **AVISO PARA IAs, COPILOTS E DESENVOLVEDORES:**
> As regras aqui descritas **devem ser seguidas estritamente** ao criar ou modificar qualquer outro arquivo do projeto.

---

# Padrões de Desenvolvimento – MyIA

> **NOTA SOBRE NUMERAÇÃO:** As seções têm gaps intencionais (ex: Seção 8 não existe) para permitir futuras adições sem renumerar todo o documento. Isso preserva referências existentes em código e documentação.

Este documento define regras **estritas e imutáveis** de arquitetura e codificação para o projeto MyIA.
**ESCOPO:** Estas regras aplicam-se a **TODOS** os diretórios (Frontend, Backend, Scripts e Docs).

---

## 📑 Índice

### 🎯 Fundamentos
- 1. [Convenções de Arquivos](#1-convenções-de-arquivos-header-obrigatório)
- 2. [Convenção de Nomes](#2-convenção-de-nomes-naming-convention)
- 13. [Sistema de Logging Estruturado](#13-sistema-de-logging-estruturado)

### 🎨 Frontend
- 3. [Arquitetura Frontend](#3-arquitetura-frontend)
- 6. [ObservabilityPageLayout](#6-observabilitypagelayout-padrão-obrigatório-para-páginas-complexas)
- 10. [Identidade Visual e Design System](#10-identidade-visual-e-design-system)

### ⚙️ Backend
- 4. [Arquitetura Backend](#4-arquitetura-backend)
- 5. [Fonte Única de Verdade](#5-fonte-única-de-verdade-regra-arquitetural-imutável)
- 7. [Armazenamento Lean](#7-armazenamento-lean-anti-duplicação-de-dados)
- 11. [Versionamento de Mensagens](#11-versionamento-de-mensagens-arquitetura-preparada)
- 12. [Padronização de API (JSend)](#12-padronização-de-api-e-respostas-jsend)

### 🔒 Segurança
- 9. [Segurança (Padrões Obrigatórios)](#9-segurança-padrões-obrigatórios)

### 📋 Desenvolvimento
- 14. [Commits e Versionamento](#14-commits-e-versionamento)

---

## 1. Convenções de Arquivos (Header Obrigatório)

- **Caminho Relativo:** Todo arquivo de código **DEVE** iniciar, obrigatoriamente na **primeira linha**, com um comentário indicando seu caminho relativo.
  - *Exemplo:* `// backend/src/services/ai/index.ts`
  - Caso não encontre ou saiba o caminho, deixe apenas // NULL

- **Referência aos Padrões:** Logo abaixo, deve haver a referência a este documento.
  - *Exemplo:* `// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)`

---

## 2. Convenção de Nomes (Naming Convention)

### Arquivos e Pastas
- **Arquivos TS/JS (Lógica):** `camelCase` (Ex: `chatController.ts`, `api.ts`)
- **Arquivos React (Componentes):** `PascalCase` (Ex: `ChatInput.tsx`)
- **Hooks:** `camelCase` com prefixo `use` (Ex: `useChatLogic.ts`)

### Código
- **Interfaces e Tipos:** `PascalCase`. **NÃO** use prefixo "I" (ex: `User`, não `IUser`).
- **Componentes React:** `PascalCase`.
- **Services (Instâncias):** `camelCase` (Ex: `chatService`).
- **DTOs:** Seguem padrão de Interfaces.

---

## 3. Arquitetura Frontend

### 3.0 Separação Estrita (View/Logic)

- **Arquivo `.tsx` (View):** Apenas JSX e estilos. Sem lógica de estado complexa.
- **Arquivo `useX.ts` (Lógica):** Regras de negócio, `useState`, `useEffect` e handlers devem ser extraídos para **Custom Hooks**.

### 3.1 Arquitetura de Layout (Scroll & Viewport)

- **Scroll vertical da aplicação é responsabilidade EXCLUSIVA do `MainContentWrapper`.**
- O layout raiz (`MainLayout`) **DEVE** usar `overflow: hidden`.
- Páginas (ex: Chat, AuditPage, Settings) **NUNCA** devem controlar scroll global.
- ❌ É proibido usar `overflow`, `height: 100vh` ou controle de scroll em páginas.
- ✅ Qualquer página deve assumir que o scroll já está resolvido pelo layout.

### 3.2 Centralização Total de Cores no theme.ts

- **Todas as cores da aplicação DEVEM ser definidas explicitamente em `frontend/src/theme.ts`.**
- **É proibido usar valores default do MUI sem que estejam declarados no theme.ts.**
- **Novos tokens de cor DEVEM ser criados no theme.ts antes de serem usados.**
- **A adição de qualquer cor nova deve ser feita exclusivamente em theme.ts.**

#### Exemplo de implementação correta:

```typescript
// theme.ts
palette: {
  primary: { main: '#1976d2' },
  error: { main: '#e53935' },
  custom: { matrix: '#00FF41', hackerBg: '#0d1117' },
  status: { warning: '#ffb300', info: '#0288d1' }
}

// Uso:
sx={{ color: theme.palette.status.warning }}
```

#### Justificativa

- Garante rastreabilidade, branding e fácil manutenção.
- Permite dark/light mode real e branding dinâmico.
- Evita inconsistências visuais e dependência de defaults do MUI.

---

## 4. Arquitetura Backend

- **Modularidade (Factory Pattern):** Lógica de IA deve usar `ProviderFactory`.
- **Database-Driven:** Configurações residem no banco, nunca hardcoded.
- **Banco de Dados:** Models em `PascalCase`, tabelas em `snake_case`.

---

## 5. Fonte Única de Verdade (Regra Arquitetural Imutável)

- **Qualquer entidade auditável, persistida ou governável DEVE ter sua identidade criada exclusivamente no backend.**
- O frontend **NUNCA** é fonte de verdade para:
  - IDs de mensagens
  - IDs de inferências
  - IDs de auditoria
  - Decisões, custos ou status de execução

### Definições

- **Frontend:** camada de visualização e interação.
- **Backend:** fonte única de verdade (persistência, auditoria, governança).

### Regras Práticas

- ❌ Proibido gerar IDs auditáveis no frontend (`Date.now()`, `uuid()`, etc).
- ✅ O frontend deve sempre consumir IDs retornados pelo backend.
- ✅ Se um dado pode ser auditado, ele **não pode** nascer no frontend.

### Justificativa

Auditoria, governança e compliance exigem:
- Persistência
- Rastreabilidade
- Consistência histórica

Esses requisitos **só podem ser garantidos pelo backend**.

> 📌 **Regra de ouro:**  
> *Se pode ser auditado, não pode ter identidade criada no frontend.*

---

## 6. ObservabilityPageLayout (Padrão Obrigatório para Páginas Complexas)

O `ObservabilityPageLayout` é o layout base ("framework interno") para páginas densas e observáveis
(ex.: Audit, PromptTrace, futuras páginas com sidebar, seções e navegação interna).

### Regras

- Páginas complexas/observáveis **DEVEM** utilizar `ObservabilityPageLayout`.
- Features **NÃO DEVEM** recriar estruturas próprias de:
  - sidebar + drawer
  - header de seção
  - navegação interna / scroll spy
  - wrappers de layout equivalentes ao Observability
- Controle de scroll/viewport **NÃO** deve ser feito pela feature/página.

### Quando usar ObservabilityPageLayout?
Use quando a página tiver pelo menos um dos seguintes:
- múltiplas seções com navegação/âncoras
- sidebar persistente ou drawer contextual
- visualização de dados (tabelas, gráficos, timelines)
- necessidade de inspeção de registros (ex.: modais de detalhes/trace)

### Motivação
- padronização de UX
- consistência de scroll e performance
- manutenção mais simples e previsível

---

## 7. Armazenamento Lean (Anti-Duplicação de Dados)

O sistema **NÃO DEVE** duplicar conteúdo que já existe em tabelas normalizadas.

### Regra

- **Salvar apenas metadados e referências (IDs), nunca conteúdo duplicado.**
- Dados de auditoria/trace devem armazenar **ponteiros** para entidades, não cópias.

### Aplicação: `sentContext` (Prompt Trace)

O campo `sentContext` da tabela `messages` armazena metadados de auditoria da inferência.

✅ **O que DEVE ser salvo:**
```typescript
{
  config_V47: { mode, model, provider, timestamp, strategy, params },
  systemPrompt: "Você é uma IA útil...",  // ← ÚNICO! Não está no banco
  messageIds: ["uuid1", "uuid2", ...],  // ← IDs do histórico, não conteúdo!
  userMessageId: "uuid-da-pergunta",
  pinnedStepIndices: [0, 2, 5],
  stepOrigins: { "0": "pinned", "1": "rag" },
  preflightTokenCount: 1500
}
```

❌ **O que NÃO DEVE ser salvo:**
```typescript
{
  payloadSent: [{ role: "user", content: "texto enorme..." }]  // ← DUPLICAÇÃO!
}
```

### Justificativa

| Abordagem | 1.000 chats × 50 msgs | 10.000 chats |
|-----------|----------------------|--------------|
| Com duplicação | ~2.5 GB | ~25 GB |
| Lean (só IDs) | ~50 MB | ~500 MB |

**Economia: ~98% de espaço.**

### Reconstrução sob Demanda

O `promptTraceController` deve **reconstruir** o payload original usando os `messageIds` salvos:
```typescript
const messages = await prisma.message.findMany({
  where: { id: { in: savedMessageIds } },
  orderBy: { createdAt: 'asc' }
});
```

<!-- Seção 8: RESERVADA para futuras adições -->

---

## 9. Segurança (Padrões Obrigatórios)

### 9.1 Regra de Segurança Zero-Trust

**TODA aplicação DEVE seguir os padrões de segurança desde o primeiro commit.**

- Secrets validados na inicialização (exit se ausentes/inseguros)
- Rate limiting aplicado em TODAS as rotas expostas
- Validação Zod em TODAS as rotas POST/PUT/PATCH/DELETE
- Helmet configurado com CSP em produção
- HTTPS obrigatório em produção (redirect automático)

### 9.2 Documento de Referência

Para padrões detalhados de segurança, consulte: **[SECURITY-STANDARDS.md](SECURITY-STANDARDS.md)**

### 9.3 Checklist Pré-Commit (Segurança)

Antes de qualquer commit que modifique:
- Rotas de API → Verificar rate limiting + validação Zod
- Autenticação → Verificar authMiddleware aplicado
- Variáveis de ambiente → Verificar validação obrigatória
- Queries ao banco → Verificar uso de Prisma (NUNCA raw SQL)

### 9.4 Testes de Segurança Obrigatórios

```bash
# Executar ANTES de push/deploy
cd backend
./security-tests.sh

# Resultado esperado: 100% PASS (7/7 testes)
```

### 9.5 Princípio de Fail-Secure

```typescript
// ❌ PROIBIDO - Fail-open (inseguro)
const secret = process.env.JWT_SECRET || 'dev-secret';
const user = await findUser(input) || { role: 'guest' };

// ✅ OBRIGATÓRIO - Fail-secure (exit/error se inseguro)
if (!process.env.JWT_SECRET) process.exit(1);
if (!user) throw new AppError('Unauthorized', 401);
```

**Regra:** Em caso de falha de segurança, o sistema DEVE falhar de forma segura (negar acesso, exit), NUNCA permitir por padrão.

---

## 10. Identidade Visual e Design System

> **Documento Completo:** [docs/VISUAL-IDENTITY-GUIDE.md](VISUAL-IDENTITY-GUIDE.md)

### Princípios Fundamentais

1. **Theme-First:** NUNCA usar cores hardcoded (`#HEX`, `rgba()`)
2. **Consistência de Ícones:** Material Icons (Outlined padrão)
3. **Acessibilidade:** Todo IconButton DEVE ter Tooltip
4. **Hierarquia Clara:** Primário → Secundário → Terciário
5. **Animações Suaves:** Transições de 0.2s-0.3s

### Paleta de Cores (Tokens Obrigatórios)

**❌ PROIBIDO:**
```typescript
color: '#00FF41'
bgcolor: 'rgba(255,255,255,0.1)'
borderColor: 'rgba(0,0,0,0.2)'
background: alpha(theme.palette.primary.main, 0.2)
```

**✅ PERMITIDO:**
```typescript
color: 'text.secondary'
bgcolor: 'grey.100'
borderColor: 'divider'
opacity: 0.8
```

### Ícones Padronizados

| Categoria | Ícones | Uso |
|-----------|--------|-----|
| Mensagens | `Send`, `Stop`, `PushPin` | Enviar, parar, fixar |
| Edição | `CopyAll`, `Edit`, `Delete` | Copiar, editar, deletar |
| Debug | `DataObject`, `Timeline` | Payload, trace |
| Estado | `Warning`, `Error`, `CheckCircle` | Avisos, erros, sucesso |
| IA | `SmartToy`, `AutoAwesome` | Avatar bot, recursos IA |

### Espaçamento (Grid 8px)

```typescript
gap: 0.5   // 4px
gap: 1     // 8px  (padrão ícones)
gap: 1.5   // 12px (confortável)
gap: 2     // 16px (generoso)
gap: 3     // 24px (seções)
```

### Componentes de Ação

**IconButton Template:**
```typescript
<Tooltip title="Ação">
  <IconButton
    size="small"
    sx={{
      color: 'text.secondary',
      '&:hover': {
        color: 'primary.main',
        transform: 'scale(1.1)',
      },
      transition: 'all 0.2s',
    }}
  >
    <Icon fontSize="small" />
  </IconButton>
</Tooltip>
```

**Botão Primário (Gradiente):**
```typescript
<IconButton
  sx={{
    background: theme.palette.gradients.primary,
    color: 'white',
    width: 48,
    height: 48,
    '&:hover': { transform: 'scale(1.05)' },
    transition: 'all 0.2s',
  }}
>
  <SendIcon />
</IconButton>
```

### Checklist de Conformidade Visual

- [ ] Usa apenas tokens do tema
- [ ] Todos IconButtons têm Tooltip
- [ ] Ícones Material Icons (Outlined)
- [ ] Espaçamento múltiplo de 8px
- [ ] Transições suaves (0.2s/0.3s)
- [ ] Responsivo (xs/sm/md)
- [ ] Hover states definidos
- [ ] Border radius consistente (1, 2, 3)

---

## 11. Versionamento de Mensagens (Arquitetura Preparada)

Quando a edição de mensagens for implementada, o sistema **DEVE** preservar a integridade do histórico de traces.

### Regra Arquitetural

- **Editar uma mensagem NÃO sobrescreve o original.**
- Edições criam uma **nova versão** (branch), preservando o conteúdo original para traces existentes.

### Estrutura Preparada (Schema Futuro)

```prisma
model Message {
  id              String    @id @default(uuid())
  // ... campos existentes ...
  
  // === VERSIONAMENTO (FUTURO) ===
  version         Int       @default(1)
  originalId      String?   // Aponta para a mensagem original (se for edição)
  original        Message?  @relation("MessageVersions", fields: [originalId], references: [id])
  versions        Message[] @relation("MessageVersions")
  isLatest        Boolean   @default(true)  // Marca a versão mais recente
  editedAt        DateTime? // Quando foi editada
}
```

### Comportamento Esperado

| Ação | Resultado |
|------|-----------|
| Criar mensagem | `version: 1`, `originalId: null`, `isLatest: true` |
| Editar mensagem | Original: `isLatest: false`. Nova: `version: 2`, `originalId: original.id`, `isLatest: true` |
| Buscar para chat | Filtrar por `isLatest: true` |
| Reconstruir trace | Usar `messageIds` salvos (aponta para versão exata no momento do trace) |

### Benefícios

1. **Traces Imutáveis:** O trace sempre mostra exatamente o que foi enviado à IA
2. **Histórico Completo:** Todas as versões são preservadas
3. **Plug-and-Play:** Quando edição for implementada, a arquitetura já suporta

### Implementação Atual (Stub)

Até a edição ser implementada:
- Campo `version` pode não existir ainda no schema
- O código deve ser escrito de forma **defensiva** (assume `version: 1` se ausente)
- `messageIds` no `sentContext` já garante rastreabilidade futura

---

## 12. Padronização de API e Respostas (JSend)

Toda comunicação entre Backend e Frontend deve seguir o padrão **JSend** para garantir previsibilidade.

### Formato de Resposta
- **Sucesso (200, 201):** `{ "status": "success", "data": { ... } }`
- **Falha de Cliente/Validação (400, 403):** `{ "status": "fail", "data": { "campo": "mensagem" } }`
- **Erro de Servidor (500):** `{ "status": "error", "message": "Descrição amigável", "code": 500 }`

### Validação e Fluxo
1. **Zod Middleware:** Nenhuma rota deve processar dados sem antes passar pelo middleware `validate(schema)`.
2. **Controller:** Deve ser focado apenas na orquestração (chamar services/providers e retornar `ApiResponse`).
3. **Segurança:** 
   - Senhas nunca devem ser salvas em texto puro (usar `bcrypt` com salt de 10).
   - O objeto de usuário retornado jamais deve incluir o campo `password`.
4. **Erros:** Proibido o uso de `try/catch` genérico dentro dos controllers para retornar erro. Os erros devem ser lançados (`throw`) e capturados pelo `errorHandler` global.

### Frontend: Interceptor JSend (Desembrulhamento Automático)

**Regra Arquitetural:** O frontend possui um interceptor Axios (`frontend/src/services/api.ts`) que **desembrulha automaticamente** respostas JSend.

**Comportamento:**
```typescript
// Backend retorna (JSend completo):
{ "status": "success", "data": { "user": {...} } }

// Interceptor transforma em:
{ "user": {...} }

// Frontend acessa:
const user = response.data.user; // ✅ CORRETO
const user = response.data.data.user; // ❌ ERRADO
```

**Implementação do Interceptor:**
```typescript
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status === 'success') {
      return { ...response, data: response.data.data };
    }
    return response;
  }
);
```

**Padrão Obrigatório:**
- ✅ Backend SEMPRE retorna JSend completo: `jsend.success({ user })`
- ✅ Frontend SEMPRE acessa dados desembrulhados: `response.data.user`
- ❌ NUNCA acessar `response.data.data.X` no frontend (duplicação)
- ❌ NUNCA retornar dados sem JSend no backend

### 12.5 Tratamento de Erros (Error Handling)

**Princípio:** Erros devem ser informativos para o desenvolvedor, mas seguros para o usuário final.

#### Regras de Implementação

1. **Stack Traces:**
   - ✅ Permitido em desenvolvimento (`NODE_ENV=development`)
   - ❌ Proibido em produção (expõe estrutura interna)

2. **Validação Zod:**
   ```typescript
   // ❌ PROIBIDO - Expor erro bruto do Zod
   return res.status(400).json({ error: zodError });
   
   // ✅ OBRIGATÓRIO - Formatar com JSend
   return res.status(400).json({
     status: 'fail',
     data: { email: 'Email inválido', password: 'Mínimo 8 caracteres' }
   });
   ```

3. **Rate Limiting:**
   - Status: `429 Too Many Requests`
   - Formato: `{ status: 'fail', data: { message: 'Muitas tentativas' } }`
   - Headers: `Retry-After` (segundos até reset)

4. **Erros de Autenticação:**
   - `401 Unauthorized`: Token ausente/inválido
   - `403 Forbidden`: Token válido mas sem permissão
   - Mensagem genérica (não revelar se usuário existe)

5. **Erros de Servidor (500):**
   ```typescript
   // ✅ Mensagem amigável
   { status: 'error', message: 'Erro interno do servidor', code: 500 }
   
   // ✅ Log completo (backend only)
   logger.error('Database connection failed', { error, userId, timestamp });
   ```

#### Frontend: Tratamento de Erros

```typescript
// Interceptor automático (api.ts)
if (error.response?.status === 429) {
  // Não mostrar erro genérico, deixar UI tratar
  return Promise.reject(error);
}

// Componente
try {
  await api.post('/chat', data);
} catch (error) {
  if (error.response?.status === 429) {
    setError('Aguarde antes de enviar outra mensagem');
  } else {
    setError(error.response?.data?.message || 'Erro desconhecido');
  }
}
```

#### Checklist de Conformidade

- [ ] Erros 4xx usam JSend `fail` com campo específico
- [ ] Erros 5xx usam JSend `error` com mensagem genérica
- [ ] Stack traces removidos em produção
- [ ] Rate limit retorna 429 com `Retry-After`
- [ ] Frontend trata 429 sem mostrar erro genérico
- [ ] Logs estruturados com Winston (não `console.log`) — Ver [Seção 13](#13-sistema-de-logging-estruturado)

---

## 13. Sistema de Logging Estruturado

### 13.1 Princípios Fundamentais

**Logging estruturado é OBRIGATÓRIO em todo o projeto.**

- ❌ **PROIBIDO:** `console.log()`, `console.error()`, `console.warn()`
- ✅ **OBRIGATÓRIO:** `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`

> **Integração com APIs:** Para tratamento de erros em rotas REST, veja [Seção 12.5](#125-tratamento-de-erros-error-handling)

---

### 13.2 Estrutura de Log Padronizada

Todo log DEVE seguir a interface [`LogEntry`](../backend/src/types/logging.ts):

```typescript
// backend/src/types/logging.ts
interface LogEntry {
  // Metadados obrigatórios
  timestamp: string;        // ISO 8601
  level: LogLevel;          // 'info' | 'warn' | 'error' | 'debug'
  message: string;
  
  // Contexto de requisição
  requestId?: string;       // UUID da requisição HTTP
  userId?: string;          // ID do usuário autenticado
  
  // Contexto de inferência
  inferenceId?: string;     // ID da inferência (se aplicável)
  provider?: string;        // Provider usado (bedrock, openai)
  model?: string;           // Modelo usado
  
  // Dados adicionais
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;         // APENAS em desenvolvimento
  };
  
  // Performance e auditoria
  duration?: number;        // Duração da operação (ms)
  statusCode?: number;      // HTTP status code
  action?: string;          // Ação executada
  resource?: string;        // Recurso afetado
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
```

> **Detalhes de implementação:** Veja [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md)

---

### 13.3 Níveis de Log

| Nível | Uso | Exemplo |
|-------|-----|---------|
| `info` | Operações normais | Login, inferência concluída, requisição processada |
| `warn` | Situações anormais (não críticas) | Rate limit atingido, cache miss, retry |
| `error` | Erros que impedem operação | Falha de autenticação, erro de API, timeout |
| `debug` | Informações detalhadas (dev) | Payload enviado, resposta recebida, estado interno |

---

### 13.4 Uso Básico

#### Exemplo 1: Log Simples (Informação)

```typescript
import { logger } from '../utils/logger';

// Log básico sem contexto adicional
logger.info('Aplicação iniciada');

// Log com contexto simples
logger.info('Usuário autenticado', {
  userId: 'user-123',
  requestId: req.id
});
```

#### Exemplo 2: Log em Controller (Requisição HTTP)

```typescript
// backend/src/controllers/authController.ts
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';

export async function login(req: AuthRequest, res: Response) {
  const startTime = Date.now();
  
  try {
    logger.info('Login attempt', {
      requestId: req.id,
      email: req.body.email // ❌ NÃO FAZER - dados sensíveis
    });
    
    // ✅ CORRETO - apenas ID do usuário
    logger.info('Login attempt', {
      requestId: req.id,
      // Não logar email ou senha
    });
    
    const user = await authService.login(req.body);
    
    logger.info('Login successful', {
      requestId: req.id,
      userId: user.id,
      duration: Date.now() - startTime
    });
    
    return res.json(jsend.success({ user, token }));
    
  } catch (error) {
    logger.error('Login failed', {
      requestId: req.id,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}
```

#### Exemplo 3: Log em Service (Inferência de IA)

```typescript
// backend/src/services/ai/adapters/anthropic.adapter.ts
import { logger } from '../../../utils/logger';

export class AnthropicAdapter {
  async generate(payload: any, options: any) {
    const startTime = Date.now();
    
    logger.info('Starting AI inference', {
      requestId: options.requestId,
      userId: options.userId,
      provider: 'anthropic',
      model: options.modelId,
      metadata: {
        messageCount: payload.length,
        estimatedTokens: this.estimateTokens(payload)
      }
    });
    
    try {
      const response = await this.client.messages.create({
        model: options.modelId,
        messages: payload,
        max_tokens: options.maxTokens || 4096
      });
      
      logger.info('AI inference completed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: 'anthropic',
        model: options.modelId,
        duration: Date.now() - startTime,
        metadata: {
          tokensIn: response.usage.input_tokens,
          tokensOut: response.usage.output_tokens,
          cost: this.calculateCost(response.usage)
        }
      });
      
      return response;
      
    } catch (error) {
      logger.error('AI inference failed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: 'anthropic',
        model: options.modelId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined
      });
      
      throw error;
    }
  }
}
```

#### Exemplo 4: Log de Aviso (Warning)

```typescript
import { logger } from '../utils/logger';

// Rate limit atingido
logger.warn('Rate limit approaching', {
  requestId: req.id,
  userId: req.user.id,
  metadata: {
    currentRequests: 45,
    limit: 50,
    resetAt: new Date(Date.now() + 60000).toISOString()
  }
});

// Cache miss
logger.warn('Cache miss', {
  requestId: req.id,
  metadata: {
    cacheKey: 'user-settings-123',
    fallbackUsed: 'database'
  }
});

// Retry de operação
logger.warn('Retrying operation', {
  requestId: req.id,
  metadata: {
    operation: 'fetch-embeddings',
    attempt: 2,
    maxAttempts: 3,
    reason: 'timeout'
  }
});
```

#### Exemplo 5: Log de Debug (Desenvolvimento)

```typescript
import { logger } from '../utils/logger';

// Debug de payload (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  logger.debug('Request payload', {
    requestId: req.id,
    metadata: {
      body: req.body,
      query: req.query,
      params: req.params
    }
  });
}

// Debug de estado interno
logger.debug('Context service state', {
  requestId: req.id,
  metadata: {
    historySize: historyMessages.length,
    pinnedCount: pinnedMessages.length,
    ragEnabled: isRagMode,
    estimatedTokens: totalTokens
  }
});
```

> **Guia completo de uso:** Veja [`LOGGING-USAGE-GUIDE.md`](./LOGGING-USAGE-GUIDE.md:1)

---

### 13.5 Segurança e Dados Sensíveis

**REGRAS ESTRITAS:**

- ❌ **NUNCA** logar senhas, tokens, chaves de API
- ❌ **NUNCA** logar dados pessoais (CPF, cartão de crédito)
- ❌ **NUNCA** logar payloads completos (podem conter dados sensíveis)
- ✅ Logar apenas IDs de usuários (não nomes/emails)
- ✅ Sanitizar inputs antes de logar
- ✅ Stack traces **APENAS** em desenvolvimento

```typescript
// ❌ PROIBIDO
logger.info('User login', {
  email: user.email,
  password: user.password
});

// ✅ PERMITIDO
logger.info('User login', {
  userId: user.id,
  requestId: req.id
});
```

---

### 13.6 Performance

**Logs NÃO DEVEM impactar performance da aplicação.**

- ❌ Evitar logar objetos pesados (arrays grandes, payloads completos)
- ✅ Logar apenas resumos ou tamanhos
- ✅ Usar logs assíncronos (Winston cuida disso)

```typescript
// ❌ PROIBIDO
logger.info('Processing data', { data: heavyArray });

// ✅ PERMITIDO
logger.info('Processing data', {
  dataSize: heavyArray.length,
  summary: heavyArray.slice(0, 5)
});
```

---

### 13.7 Correlação de Logs

**Todo log DEVE incluir `requestId` quando disponível.**

```typescript
// Middleware de requestId (obrigatório)
// backend/src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}
```

**Uso em toda a aplicação:**

```typescript
logger.info('Operation', {
  requestId: req.id,  // ✅ SEMPRE incluir
  userId: req.user?.id,
  // ... outros campos
});
```

> **Implementação completa:** Veja [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md#2-middleware-de-request-id)

---

### 13.8 Checklist de Conformidade

Antes de commitar código que usa logging:

- [ ] Usa `logger.info/warn/error/debug` (não `console.log`)
- [ ] Inclui `requestId` quando disponível
- [ ] Inclui `userId` quando disponível
- [ ] NÃO loga dados sensíveis (senhas, tokens)
- [ ] Stack traces apenas em desenvolvimento
- [ ] Contexto rico (metadata relevante)
- [ ] Nível de log correto (info/warn/error/debug)
- [ ] Performance considerada (não loga objetos pesados)

---

### 13.9 Exemplo de Log Completo

```json
{
  "timestamp": "2026-01-26T18:00:00.000Z",
  "level": "info",
  "message": "Inference completed successfully",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "inferenceId": "inf-456",
  "provider": "bedrock",
  "model": "anthropic.claude-3-sonnet-20240229-v1:0",
  "duration": 1234,
  "statusCode": 200,
  "metadata": {
    "tokens": 500,
    "cost": 0.01,
    "strategy": "rag"
  }
}
```

---

### 13.10 Referências

- **Proposta Completa:** [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md)
- **ADR:** [ADR-005-LOGGING-SYSTEM.md](./architecture/ADR-005-LOGGING-SYSTEM.md)

---

## 14. Commits e Versionamento

### 14.1 Formato de Commit (Conventional Commits)

Todo commit DEVE seguir o padrão:

```
<type>: <description>

[optional body]
[optional footer]
```

**Types Permitidos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração sem mudança de comportamento
- `test`: Adição/correção de testes
- `chore`: Tarefas de manutenção (deps, config)
- `perf`: Melhoria de performance
- `style`: Formatação (não afeta lógica)

**Exemplos:**
```bash
feat: add JSend standardization to all controllers
fix: resolve JWT payload mismatch (userId vs id)
docs: update STANDARDS.md with Section 14
refactor: extract chat logic to custom hook
test: add security test suite (7 categories)
chore: update dependencies to latest versions
```

### 14.2 Mensagens de Commit

**Regras:**
- Idioma: Inglês (padrão internacional)
- Tamanho: Máximo 72 caracteres no título
- Imperativo: "add" não "added", "fix" não "fixed"
- Minúsculo: Após o tipo (exceto nomes próprios)
- Sem ponto final no título

**❌ PROIBIDO:**
```bash
Fixed bug in chat  # Passado
Added new feature.  # Ponto final
FEAT: BIG CHANGE  # Maiúsculas
fixed stuff  # Sem tipo
```

**✅ PERMITIDO:**
```bash
fix: resolve race condition in AuthContext
feat: implement prompt trace visualization
docs: add API endpoints documentation
```

### 14.3 Estratégia de Branches

**Branches Principais:**
- `main`: Código em produção (protegido)
- `develop`: Integração de features (opcional)

**Branches de Trabalho:**
- `feature/nome-da-feature`: Novas funcionalidades
- `fix/nome-do-bug`: Correções
- `docs/nome-do-doc`: Documentação
- `refactor/nome-da-refatoracao`: Refatorações

**Exemplo de Fluxo:**
```bash
# Criar branch
git checkout -b feature/jsend-migration

# Commits incrementais
git commit -m "feat: add JSend helper utility"
git commit -m "refactor: migrate aiController to JSend"
git commit -m "test: validate JSend format in 10 routes"

# Merge para main
git checkout main
git merge feature/jsend-migration
```

### 14.4 Checklist Pré-Commit

Antes de cada commit, verificar:

- [ ] **ESLint passa sem erros** (`npm run lint` - 0 errors obrigatório)
- [ ] **TypeScript compila** (`npm run type-check` - 0 errors obrigatório)
- [ ] Código compila sem erros (`npm run build`)
- [ ] Testes passam (`npm test` se aplicável)
- [ ] Headers obrigatórios em novos arquivos (Seção 1)
- [ ] Sem cores hardcoded (Seção 3.2)
- [ ] JSend em novas rotas (Seção 12)
- [ ] Segurança validada se modificou rotas (Seção 9.3)

**Quality Gates (Portões de Qualidade):**
```bash
# Executar ANTES de cada commit
npm run lint        # Deve retornar: 0 errors (warnings são aceitáveis)
npm run type-check  # Deve retornar: exit code 0
```

**Regra:** Commits com erros de ESLint ou TypeScript são **proibidos**.

### 14.5 Versionamento Semântico (SemVer)

**Formato:** `MAJOR.MINOR.PATCH` (ex: `1.3.2`)

- **MAJOR:** Mudanças incompatíveis (breaking changes)
- **MINOR:** Novas funcionalidades (compatível)
- **PATCH:** Correções de bugs (compatível)

**Exemplos:**
- `1.0.0 → 1.1.0`: Adicionado chat multi-provider
- `1.1.0 → 1.1.1`: Corrigido bug de autenticação
- `1.1.1 → 2.0.0`: Migrado de REST para GraphQL (breaking)

**Quando Incrementar:**
- Após merge de feature → MINOR
- Após hotfix → PATCH
- Após refatoração grande → MAJOR (se quebrar API)

### 14.6 Changelog (Recomendado)

Manter arquivo `CHANGELOG.md` na raiz:

```markdown
# Changelog

## [1.3.0] - 2024-01-15
### Added
- JSend standardization across all REST endpoints
- Security test suite with 7 categories

### Fixed
- JWT payload mismatch (userId vs id)
- Race condition in AuthContext

## [1.2.0] - 2024-01-10
### Added
- Analytics dashboard with 3 charts
- Telemetry tracking per message
```
