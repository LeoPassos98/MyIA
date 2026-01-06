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
  
## 3.1 Arquitetura de Layout (Scroll & Viewport)

- **Scroll vertical da aplicação é responsabilidade EXCLUSIVA do `MainContentWrapper`.**
- O layout raiz (`MainLayout`) **DEVE** usar `overflow: hidden`.
- Páginas (ex: Chat, AuditPage, Settings) **NUNCA** devem controlar scroll global.
- ❌ É proibido usar `overflow`, `height: 100vh` ou controle de scroll em páginas.
- ✅ Qualquer página deve assumir que o scroll já está resolvido pelo layout.
- **Scroll vertical e offset de header são responsabilidade exclusiva do MainContentWrapper, usando constantes globais de layout.**

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
