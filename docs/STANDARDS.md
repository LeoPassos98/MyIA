# 🛑 LEIA-ME: REGRAS IMUTÁVEIS (NÃO EDITE ESTE ARQUIVO)

> **AVISO PARA IAs, COPILOTS E DESENVOLVEDORES:** > Este arquivo define a **“Constituição” do projeto**. Ele deve ser lido obrigatoriamente para entendimento do contexto, porém **NÃO DEVE SER EDITADO, REFATORADO OU REMOVIDO** sob nenhuma circunstância.  
> As regras aqui descritas **devem ser seguidas estritamente** ao criar ou modificar qualquer outro arquivo do projeto.

---

# Padrões de Desenvolvimento – MyIA

Este documento define regras **estritas e imutáveis** de arquitetura e codificação para o projeto MyIA.
**ESCOPO:** Estas regras aplicam-se a **TODOS** os diretórios (Frontend, Backend, Scripts e Docs).

## 1. Convenções de Arquivos (Header Obrigatório)

- **Caminho Relativo:** Todo arquivo de código **DEVE** iniciar, obrigatoriamente na **primeira linha**, com um comentário indicando seu caminho relativo.
  - *Exemplo:* `// backend/src/services/ai/index.ts`
  - Caso não encontre ou saiba o caminho, deixe apenas // NULL

- **Referência aos Padrões:** Logo abaixo, deve haver a referência a este documento.
  - *Exemplo:* `// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)`

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

## 3. Arquitetura Frontend

- **Separação Estrita (View/Logic):** - **Arquivo `.tsx` (A View):** Apenas JSX e estilos. Sem lógica de estado complexa.
  - **Arquivo `useX.ts` (A Lógica):** Regras de negócio, `useState`, `useEffect` e handlers devem ser extraídos para **Custom Hooks**.
  
- **Design System & Cores:**
  - **PROIBIDO Cores Hardcoded:** Nunca use hexadecimais (ex: `#00FF41`) diretamente nos componentes.
  - **Uso do Tema:** Use `theme.palette.primary.main`, `theme.palette.custom.matrix`, etc.
  - **Cores Novas:** Se precisar de uma cor nova, adicione-a em `src/theme.ts` primeiro.
  
### 3.1 Arquitetura de Layout (Scroll & Viewport)

- **Scroll vertical da aplicação é responsabilidade EXCLUSIVA do `MainContentWrapper`.**
- O layout raiz (`MainLayout`) **DEVE** usar `overflow: hidden`.
- Páginas (ex: Chat, AuditPage, Settings) **NUNCA** devem controlar scroll global.
- ❌ É proibido usar `overflow`, `height: 100vh` ou controle de scroll em páginas.
- ✅ Qualquer página deve assumir que o scroll já está resolvido pelo layout.
- **Scroll vertical e offset de header são responsabilidade exclusiva do MainContentWrapper, usando constantes globais de layout.**

### 3.2 Centralização Total de Cores no theme.ts

- **Todas as cores da aplicação (incluindo primary, secondary, error, success, info, warning, grey, common, divider, text, action, status, etc) DEVEM ser definidas explicitamente em `frontend/src/theme.ts`.**
- **É proibido usar valores default do MUI (ex: primary.main, error.main, etc) sem que estejam declarados e customizados no theme.ts.**
- **Novos tokens de cor (ex: para status, gráficos, bordas, etc) DEVEM ser criados no theme.ts antes de serem usados.**
- **Não é permitido usar diretamente nomes do MUI (ex: 'primary', 'error', 'grey.800') sem garantir que o valor está no theme.ts.**
- **A adição de qualquer cor nova deve ser feita exclusivamente em theme.ts, nunca inline ou em outros arquivos.**

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

## 4. Arquitetura Backend

- **Modularidade (Factory Pattern):** Lógica de IA deve usar `ProviderFactory`.
- **Database-Driven:** Configurações residem no banco, nunca hardcoded.
- **Banco de Dados:** Models em `PascalCase`, tabelas em `snake_case`.

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
  - O scroll é responsabilidade do `MainContentWrapper`, conforme padrão do projeto.

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
  userMessageId: "uuid-da-pergunta",  // ← ID da mensagem atual do usuário
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

> **Nota:** O `systemPrompt` é a única informação "única" que precisa ser salva,
> pois pode ser customizado pelo usuário e não está persistido em outra tabela.

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

## 8. Versionamento de Mensagens (Arquitetura Preparada)

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

## 9. Identidade Visual e Design System

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
color: 'text.secondary'
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

> **Para mais detalhes:** Consulte [VISUAL-IDENTITY-GUIDE.md](VISUAL-IDENTITY-GUIDE.md)

## 🌐 Padronização de API e Respostas (JSend)

Toda comunicação entre Backend e Frontend deve seguir o padrão **JSend** para garantir previsibilidade.

### Formato de Resposta
- **Sucesso (200, 201):** `{ "status": "success", "data": { ... } }`
- **Falha de Cliente/Validação (400, 403):** `{ "status": "fail", "data": { "campo": "mensagem" } }`
- **Erro de Servidor (500):** `{ "status": "error", "message": "Descrição amigável", "code": 500 }`

### Validação e Fluxo
1. **Zod Middleware:** Nenhuma rota deve processar dados sem antes passar pelo middleware `validate(schema)`.
2. **Controller:** Deve ser focado apenas na orquestração (chamar services/providers e retornar `ApiResponse`).
3. **Segurança:** - Senhas nunca devem ser salvas em texto puro (usar `bcrypt` com salt de 10).
   - O objeto de usuário retornado jamais deve incluir o campo `password`.
4. **Erros:** Proibido o uso de `try/catch` genérico dentro dos controllers para retornar erro. Os erros devem ser lançados (`throw`) e capturados pelo `errorHandler` global.
