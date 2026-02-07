# 🛑 LEIA-ME: PADRÕES DE DESENVOLVIMENTO

> **AVISO PARA IAs, COPILOTS E DESENVOLVEDORES:**
> As regras aqui descritas **devem ser seguidas estritamente** ao criar ou modificar qualquer outro arquivo do projeto.

---

# Padrões de Desenvolvimento – MyIA

Este documento define regras **estritas e imutáveis** de arquitetura e codificação para o projeto MyIA.
**ESCOPO:** Estas regras aplicam-se a **TODOS** os diretórios (Frontend, Backend, Scripts e Docs).

---

## 📑 Índice

### PARTE I: FUNDAMENTOS
- [1. Convenções de Arquivos (Header Obrigatório)](#1-convenções-de-arquivos-header-obrigatório)
- [2. Convenção de Nomes (Naming Convention)](#2-convenção-de-nomes-naming-convention)
- [3. Código Simulado e Transparência](#3-código-simulado-e-transparência)

### PARTE II: ARQUITETURA E MODULARIZAÇÃO
- [4. Princípios de Modularização](#4-princípios-de-modularização)
- [5. Arquitetura Frontend](#5-arquitetura-frontend)
  - [5.5 Estrutura de Features](#55-estrutura-de-features)
  - [5.6 Services Frontend](#56-services-frontend)
- [6. Arquitetura Backend](#6-arquitetura-backend)
  - [6.5 Workers e Filas (Bull/Redis)](#65-workers-e-filas-bullredis)
- [7. Tamanho de Arquivos (Sinalizador)](#7-tamanho-de-arquivos-sinalizador)

### PARTE III: DESIGN SYSTEM
- [8. Identidade Visual e Design System](#8-identidade-visual-e-design-system)

### PARTE IV: API E COMUNICAÇÃO
- [9. Padronização de API (JSend)](#9-padronização-de-api-jsend)
  - [9.5 Server-Sent Events (SSE)](#95-server-sent-events-sse)

### PARTE V: SEGURANÇA
- [10. Segurança (Padrões Obrigatórios)](#10-segurança-padrões-obrigatórios)

### PARTE VI: OBSERVABILIDADE
- [11. Sistema de Logging](#11-sistema-de-logging)
  - [11.8 Exceções Permitidas](#118-exceções-permitidas)

### PARTE VII: QUALIDADE
- [12. Commits e Versionamento](#12-commits-e-versionamento)
  - [12.6 Arquivos Proibidos no Repositório](#126-arquivos-proibidos-no-repositório)
- [13. Testes](#13-testes)

### APÊNDICES
- [A. Glossário de Termos](#a-glossário-de-termos)
- [B. Links para Documentos Externos](#b-links-para-documentos-externos)
- [C. Changelog do STANDARDS.md](#c-changelog-do-standardsmd)

---

# PARTE I: FUNDAMENTOS

---

## 1. Convenções de Arquivos (Header Obrigatório)

### 1.1 Caminho Relativo

Todo arquivo de código **DEVE** iniciar, obrigatoriamente na **primeira linha**, com um comentário indicando seu caminho relativo.

```typescript
// backend/src/services/ai/index.ts
```

**Regras:**
- ✅ Caminho relativo a partir da raiz do projeto
- ✅ Se desconhecido temporariamente: `// TODO: definir caminho`
- ❌ PROIBIDO deixar em branco ou omitir

### 1.2 Referência aos Padrões

Logo abaixo do caminho, deve haver a referência a este documento:

**Formato Completo (Arquivos de Produção):**
```typescript
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
```

**Formato Curto (Scripts e Utilitários):**
```typescript
// Standards: docs/STANDARDS.md
```

**Quando usar formato curto:**
- Scripts em `scripts/`
- Arquivos de seed/migration
- Arquivos de configuração
- Arquivos de teste (`*.test.ts`, `*.spec.ts`)

---

## 2. Convenção de Nomes (Naming Convention)

### 2.1 Arquivos e Pastas

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Arquivos TS/JS (Lógica)** | `camelCase` | `chatController.ts`, `api.ts` |
| **Arquivos React (Componentes)** | `PascalCase` | `ChatInput.tsx` |
| **Hooks** | `camelCase` com prefixo `use` | `useChatLogic.ts` |
| **Pastas de Padrões** | `kebab-case` ou `camelCase` | `builders/`, `handlers/` |

### 2.2 Código

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Interfaces e Tipos** | `PascalCase` (sem prefixo "I") | `User`, não `IUser` |
| **Componentes React** | `PascalCase` | `ChatMessage` |
| **Services (Instâncias)** | `camelCase` | `chatService` |
| **DTOs** | `PascalCase` | `CreateUserDto` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |

---

## 3. Código Simulado e Transparência

### 3.1 Princípio Fundamental

**Todo código que executa comportamento simulado (mock/fake/stub) DEVE ser explicitamente identificável.**

Esta regra existe para evitar situações onde código de simulação é confundido com código de produção.

### 3.2 Regras Obrigatórias

#### 3.2.1 Marcação Explícita no Código

```typescript
// ⚠️ SIMULAÇÃO: Este bloco NÃO executa lógica real
// TODO: Substituir por implementação real usando [serviço/API específica]
const passed = Math.random() > 0.3;
```

#### 3.2.2 Flag de Controle Obrigatória

```typescript
// ✅ CORRETO - Simulação controlada por flag
const USE_SIMULATION = process.env.CERTIFICATION_SIMULATION === 'true';

if (USE_SIMULATION) {
  logger.warn('🎭 MODO SIMULAÇÃO: Usando dados fake para certificação');
  return { passed: Math.random() > 0.3, simulated: true };
}

// Código real aqui
return await realCertificationService.certify(modelId);
```

#### 3.2.3 Logging de Alerta

```typescript
// ✅ OBRIGATÓRIO - Log visível quando simulação está ativa
logger.warn('🎭 SIMULAÇÃO ATIVA: [nome do serviço/funcionalidade]');
```

#### 3.2.4 Retorno Identificável

```typescript
// ✅ CORRETO - Resposta marcada como simulada
return {
  result: 'success',
  data: mockData,
  simulated: true,  // ← OBRIGATÓRIO
  simulatedAt: new Date().toISOString()
};
```

### 3.3 Anti-Padrões (PROIBIDO)

```typescript
// ❌ PROIBIDO - Simulação silenciosa sem marcação
const passed = Math.random() > 0.3;
return { passed, score: 75 };

// ❌ PROIBIDO - Simulação sem flag de controle
const result = generateFakeData();
return result;

// ❌ PROIBIDO - Simulação ativa por padrão
const USE_REAL = process.env.USE_REAL_API === 'true'; // Default é simulação!
```

### 3.4 Checklist Pré-Commit (Simulações)

- [ ] Bloco tem comentário `⚠️ SIMULAÇÃO` visível
- [ ] Controlado por variável de ambiente (não hardcoded `true`)
- [ ] Log de warning quando simulação está ativa
- [ ] Resposta inclui `simulated: true`
- [ ] TODO documentado para implementação real
- [ ] Padrão por default é **NÃO simular** (produção segura)

---

# PARTE II: ARQUITETURA E MODULARIZAÇÃO

---

## 4. Princípios de Modularização

### 4.1 Responsabilidade Única

**Cada arquivo DEVE ter uma única responsabilidade claramente nomeável.**

Se você não consegue descrever a responsabilidade do arquivo em **uma frase curta**, ele provavelmente faz coisas demais.

> **Relação com Seção 7:** Limites de linhas servem como **sinal de alerta**, não como regra primária. A regra primária é responsabilidade única. Se um arquivo tem 1 responsabilidade e 180 linhas, está OK. Se tem 1 responsabilidade e 400 linhas, a responsabilidade provavelmente é genérica demais.

### 4.2 Quando Modularizar

**Trigger obrigatório:** Arquivo com **≥2 responsabilidades distintas**, independente do tamanho.

**Trigger de investigação:** Arquivo com >200 linhas → perguntar:
- [ ] A responsabilidade é realmente **única e específica**?
- [ ] Posso descrevê-la em **uma frase**?
- [ ] A complexidade é **inerente ao domínio** (ex: parser de protocolo AWS)?
- [ ] O arquivo tem **coesão alta** (tudo fortemente relacionado)?

Se respondeu **"não"** a qualquer pergunta → modularizar.

### 4.3 Estrutura Padrão de Modularização

```
feature/
├── index.ts              # Re-exports (Nível raiz)
├── FeatureMain.ts        # Orquestrador (apenas delegação)
├── types.ts              # Tipos compartilhados (se necessário)
├── responsibility1/      # Subpasta por responsabilidade
│   ├── index.ts          # Re-exports (Nível subpasta)
│   └── Module1.ts
└── responsibility2/
    ├── index.ts
    └── Module2.ts
```

**Regras:**
- Arquivo original (`feature.ts`) vira **re-export** para manter compatibilidade
- Imports externos **NÃO devem quebrar** após modularização
- Cada subpasta tem seu `index.ts` com re-exports

### 4.4 Padrões de Design como Navegação Semântica

**Princípio:** O nome da pasta indica o **padrão de design implementado**, o **tipo de responsabilidade** e o **método público principal**. Isso torna o código auto-documentado e navegável.

#### Tabela de Referência

| Pasta | Padrão de Design | Método Principal | Responsabilidade |
|-------|------------------|------------------|------------------|
| `builders/` | Builder | `.build()` | Criação/montagem de objetos complexos |
| `handlers/` | Strategy / Chain of Responsibility | `.handle()` | Processamento de lógica condicional |
| `validators/` | Template Method | `.validate()` | Validação de dados (lança erro ou void) |
| `transformers/` | Transformer | `.transform()` | Conversão de formato/estrutura |
| `strategies/` | Strategy | `.execute()` | Algoritmos intercambiáveis |
| `matchers/` | Specification | `.matches()` | Verificação de condição (retorna boolean) |
| `registry/` | Registry | `.register()` / `.get()` | Catálogo de implementações |
| `factories/` | Factory | `.create()` | Instanciação de objetos |
| `loaders/` | Lazy Loading | `.load()` | Carregamento sob demanda |
| `adapters/` | Adapter | `.adapt()` | Conversão de interface externa |
| `categories/` | Strategy | `.match()` | Classificação por tipo |
| `errors/` | Template Method | `.categorize()` | Tratamento/classificação de erros |
| `repositories/` | Repository | `.find*()` / `.save()` | Acesso a dados |

#### Regras de Conformidade

- ✅ Classes dentro de `builders/` **DEVEM** ter método `.build()`
- ✅ Classes dentro de `handlers/` **DEVEM** ter método `.handle()`
- ✅ Classes dentro de `validators/` **DEVEM** ter método `.validate()`
- ❌ **PROIBIDO** misturar padrões (ex: `.validate()` dentro de `builders/`)

### 4.5 Classe Orquestradora

Após modularização, a classe principal **DEVE apenas delegar**:

```typescript
// ✅ CORRETO — Orquestrador delega tudo
class ChatOrchestrator {
  constructor(
    private configBuilder: ConfigBuilder,
    private validator: MessageValidator,
    private streamHandler: StreamHandler
  ) {}

  async orchestrate(input: ChatInput): Promise<ChatOutput> {
    const config = this.configBuilder.build(input);
    await this.validator.validate(config);
    return this.streamHandler.handle(config);
  }
}

// ❌ ERRADO — Orquestrador implementa lógica
class ChatOrchestrator {
  async orchestrate(input: ChatInput): Promise<ChatOutput> {
    // 200 linhas de lógica inline...
  }
}
```

**Regras:**
- Métodos públicos ≤20 linhas
- Injeção de dependências no construtor
- Sem lógica de negócio direta (apenas delegação e composição)

### 4.6 Anti-Padrões de Modularização (PROIBIDO)

| Anti-Padrão | Descrição | Solução |
|-------------|-----------|---------|
| **Over-modularização** | Criar pasta para 1 arquivo de 50 linhas | Manter arquivo único até ter ≥2 responsabilidades |
| **Modularização prematura** | Dividir antes de ter clareza das responsabilidades | Esperar padrões emergirem |
| **Pastas vazias** | Criar estrutura "para o futuro" sem implementação | Criar apenas quando necessário |
| **Mistura de padrões** | `.validate()` dentro de `builders/` | Respeitar tabela 4.4 |
| **God index.ts** | `index.ts` com lógica além de re-exports | Apenas re-exports |
| **Arquivos de tipos centralizados** | `types.ts` com 500+ linhas | Dividir por domínio |

### 4.7 Métricas de Qualidade

Após modularização, verificar:

- [ ] Cada arquivo tem ≤1 responsabilidade
- [ ] Cada arquivo é descritível em 1 frase
- [ ] Imports externos não quebraram
- [ ] Cobertura de testes mantida ou aumentada
- [ ] Tempo de navegação no código reduzido
- [ ] Nomes de pastas seguem tabela 4.4

### 4.8 Exemplo Completo

**ANTES (1 arquivo, 397 linhas, 5 responsabilidades):**
```typescript
// chatOrchestrator.service.ts
class ChatOrchestrator {
  buildConfig() { /* 80 linhas */ }
  buildPayload() { /* 70 linhas */ }
  validateMessage() { /* 50 linhas */ }
  validateContext() { /* 40 linhas */ }
  handleStream() { /* 60 linhas */ }
  handleError() { /* 50 linhas */ }
  handleSuccess() { /* 47 linhas */ }
}
```

**DEPOIS (8 arquivos, 1 responsabilidade cada):**
```
orchestrator/
├── index.ts                          # Re-exports
├── chatOrchestrator.ts               # Orquestrador (delegação)
│
├── builders/                         # Builder Pattern → .build()
│   ├── index.ts
│   ├── configBuilder.ts              # "Montar configuração"
│   └── payloadBuilder.ts             # "Montar payload"
│
├── validators/                       # Template Method → .validate()
│   ├── index.ts
│   ├── messageValidator.ts           # "Validar mensagem"
│   └── contextValidator.ts           # "Validar contexto"
│
└── handlers/                         # Strategy/Chain → .handle()
    ├── index.ts
    ├── streamErrorHandler.ts         # "Processar erros de stream"
    └── successHandler.ts             # "Processar resposta com sucesso"
```

---

## 5. Arquitetura Frontend

### 5.1 Separação Estrita (View/Logic)

| Arquivo | Responsabilidade | Conteúdo |
|---------|------------------|----------|
| **`.tsx` (View)** | Apenas JSX e estilos | Sem lógica de estado complexa |
| **`useX.ts` (Lógica)** | Regras de negócio | `useState`, `useEffect`, handlers |

**Regra:** Extrair lógica para **Custom Hooks** sempre que houver:
- Mais de 3 `useState`
- Lógica condicional complexa
- Chamadas de API
- Side effects (`useEffect`)

### 5.2 Arquitetura de Layout (Scroll & Viewport)

**Scroll vertical da aplicação é responsabilidade EXCLUSIVA do `MainContentWrapper`.**

| Componente | Responsabilidade |
|------------|------------------|
| `MainLayout` | `overflow: hidden` |
| `MainContentWrapper` | Controle de scroll |
| Páginas (Chat, Audit, etc.) | **NUNCA** controlam scroll |

**Regras:**
- ❌ PROIBIDO usar `overflow`, `height: 100vh` em páginas
- ✅ Páginas assumem que scroll já está resolvido pelo layout

### 5.3 ObservabilityPageLayout

O `ObservabilityPageLayout` é o layout base para páginas densas e observáveis.

**Quando usar:**
- Múltiplas seções com navegação/âncoras
- Sidebar persistente ou drawer contextual
- Visualização de dados (tabelas, gráficos, timelines)
- Inspeção de registros (modais de detalhes/trace)

**Regras:**
- Páginas complexas **DEVEM** utilizar `ObservabilityPageLayout`
- Features **NÃO DEVEM** recriar estruturas próprias de sidebar/drawer
- Controle de scroll/viewport **NÃO** deve ser feito pela feature/página

### 5.4 Mappers (Transformação de Dados)

Mappers são funções que transformam dados entre camadas (API → Frontend).

**Localização:** `features/{feature}/mappers/` ou `services/mappers/`

**Quando usar:**
- Conversão de snake_case para camelCase
- Adição de campos derivados/calculados
- Normalização de datas (string → Date)
- Transformação de estrutura de resposta

**Exemplo:**
```typescript
// features/audit/mappers/mapAuditRecord.ts

interface ApiAuditRecord {
  created_at: string;
  user_id: string;
  total_cost: number;
}

interface AuditRecord {
  createdAt: Date;
  userId: string;
  totalCost: number;
  formattedCost: string;  // Campo derivado
}

export function mapAuditRecord(raw: ApiAuditRecord): AuditRecord {
  return {
    createdAt: new Date(raw.created_at),
    userId: raw.user_id,
    totalCost: raw.total_cost,
    formattedCost: `$${raw.total_cost.toFixed(4)}`
  };
}
```

**Regras:**
- ✅ Mappers são funções puras (sem side effects)
- ✅ Tipagem explícita de entrada e saída
- ✅ Um mapper por entidade/domínio
- ❌ PROIBIDO fazer chamadas de API dentro de mappers

### 5.5 Estrutura de Features

Cada feature no frontend DEVE seguir a estrutura padrão para garantir consistência e manutenibilidade.

**Estrutura Padrão:**
```
features/
└── featureName/
    ├── index.tsx              # Re-export da página principal
    ├── FeaturePage.tsx        # Componente de página
    ├── components/            # Componentes específicos da feature
    │   ├── ComponentA.tsx
    │   └── ComponentB.tsx
    ├── hooks/                 # Hooks específicos da feature
    │   ├── useFeatureLogic.ts
    │   └── useFeatureData.ts
    ├── types.ts               # Tipos da feature (se necessário)
    ├── services/              # Services específicos (se necessário)
    │   └── featureService.ts
    └── mappers/               # Transformadores de dados (se necessário)
        └── mapFeatureData.ts
```

**Regras de Organização:**

1. **Re-export no index.tsx:**
```typescript
// features/chat/index.tsx
// ✅ CORRETO - Apenas re-export
export { default } from './ChatPage';

// ❌ ERRADO - Lógica no index
export default function ChatPage() {
  // 200 linhas de código...
}
```

2. **Extração de Hooks:**
- Extrair para `hooks/` quando houver **>3 useState**
- Extrair quando houver lógica condicional complexa
- Extrair quando houver chamadas de API ou side effects

```typescript
// ✅ CORRETO - Lógica extraída
// hooks/useChatLogic.ts
export function useChatLogic() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  
  // Lógica complexa aqui...
  
  return { messages, isLoading, error, config, sendMessage };
}

// ChatPage.tsx
function ChatPage() {
  const { messages, isLoading, sendMessage } = useChatLogic();
  return <div>{/* JSX apenas */}</div>;
}
```

3. **Divisão de Componentes:**
- Dividir quando componente exceder **>100 linhas**
- Dividir quando houver responsabilidades distintas
- Criar subpastas para componentes relacionados

```typescript
// ✅ CORRETO - Componentes divididos
features/chat/components/
├── ControlPanel/
│   ├── ControlPanel.tsx
│   ├── ModelSelector.tsx
│   └── ConfigPanel.tsx
├── input/
│   ├── ChatInput.tsx
│   └── SendButton.tsx
└── message/
    ├── MessageList.tsx
    ├── MessageItem.tsx
    └── MessageActions.tsx
```

4. **Regras de Importação:**
```typescript
// ❌ PROIBIDO - Importar diretamente de outra feature
import { useAuditLogic } from '@/features/audit/hooks/useAuditLogic';

// ✅ CORRETO - Usar services compartilhados
import { auditService } from '@/services/auditService';

// ✅ CORRETO - Importar de shared/common
import { Button } from '@/components/common/Button';
```

**Exemplo Real (Chat):**
```
features/chat/
├── index.tsx                  # Re-export
├── ChatPage.tsx               # Página principal (~80 linhas)
├── components/
│   ├── ControlPanel/          # Painel de controle
│   │   ├── ControlPanel.tsx
│   │   ├── ModelSelector.tsx
│   │   └── ConfigPanel.tsx
│   ├── input/                 # Input de mensagens
│   │   ├── ChatInput.tsx
│   │   └── SendButton.tsx
│   └── message/               # Mensagens
│       ├── MessageList.tsx
│       ├── MessageItem.tsx
│       └── MessageActions.tsx
├── hooks/
│   ├── useChatLogic.ts        # Lógica principal
│   ├── useChatMessages.ts     # Gerenciamento de mensagens
│   └── useChatStreaming.ts    # Streaming SSE
└── types/
    └── index.ts               # Tipos do chat
```

**Checklist de Conformidade:**
- [ ] `index.tsx` apenas re-exporta (sem lógica)
- [ ] Hooks extraídos quando >3 useState
- [ ] Componentes divididos quando >100 linhas
- [ ] Sem importações diretas entre features
- [ ] Services compartilhados em `services/`
- [ ] Tipos em `types.ts` quando necessário

### 5.6 Services Frontend

Services encapsulam chamadas de API e lógica de comunicação com o backend.

**Estrutura Padrão:**
```
frontend/src/services/
├── api.ts                    # Instância Axios configurada
├── authService.ts            # Autenticação
├── chatService.ts            # Chat/Streaming
├── certificationService.ts   # Certificações
├── modelsService.ts          # Modelos
└── api/                      # Services específicos por domínio
    ├── modelsApi.ts
    └── providersApi.ts
```

**Padrões Obrigatórios:**

#### 5.6.1 Singleton Export (Não Classes)

```typescript
// ✅ CORRETO - Export de objeto singleton
export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  }
};

// ❌ ERRADO - Export de classe
export class AuthService {
  async login(data: LoginData) { ... }
  async logout() { ... }
}
```

**Justificativa:** Singletons são mais simples, não requerem instanciação e facilitam mocking em testes.

#### 5.6.2 Tipagem Explícita de Retorno

```typescript
// ✅ CORRETO - Tipo explícito
async function fetchModels(): Promise<Model[]> {
  const response = await api.get('/models');
  return response.data;
}

// ❌ ERRADO - Tipo implícito
async function fetchModels() {
  const response = await api.get('/models');
  return response.data;
}
```

#### 5.6.3 Tratamento de Erros (Propagar, Não Silenciar)

```typescript
// ✅ CORRETO - Propagar erro para componente tratar
async function fetchData(): Promise<Data> {
  const response = await api.get('/data');
  return response.data;
  // Erro propagado automaticamente
}

// ❌ ERRADO - Silenciar erro
async function fetchData(): Promise<Data | null> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error(error);
    return null; // ← Erro silenciado! Componente não sabe que falhou
  }
}

// ✅ CORRETO - Transformar erro se necessário
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    // Transformar erro para formato específico
    throw new AppError('Falha ao buscar dados', error);
  }
}
```

**Regra:** Componentes devem decidir como tratar erros (toast, modal, retry). Services apenas propagam.

#### 5.6.4 Cache de Promises (Deduplicação)

```typescript
// ✅ CORRETO - Evitar requests duplicados
let cachedPromise: Promise<Model[]> | null = null;

export const modelsService = {
  getModels: async (): Promise<Model[]> => {
    if (cachedPromise) return cachedPromise;
    
    cachedPromise = api.get('/models')
      .then(response => response.data)
      .finally(() => {
        // Limpar cache após 5 minutos
        setTimeout(() => { cachedPromise = null; }, 5 * 60 * 1000);
      });
    
    return cachedPromise;
  },
  
  invalidateCache: () => {
    cachedPromise = null;
  }
};
```

**Benefício:** Se 3 componentes chamarem `getModels()` simultaneamente, apenas 1 request é feito.

#### 5.6.5 Estrutura de api.ts

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de request (adicionar token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response (desembrulhar JSend)
api.interceptors.response.use(
  (response) => {
    // Desembrulhar JSend: { status: 'success', data: {...} } → {...}
    if (response.data?.status === 'success') {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    // Tratar erros globais (401, 403, 500)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Anti-Padrões (PROIBIDO):**

| Anti-Padrão | Problema | Solução |
|-------------|----------|---------|
| Classes de Service | Requer instanciação, mais complexo | Usar singleton objects |
| Silenciar erros | Componente não sabe que falhou | Propagar erros |
| Tipo implícito | Dificulta manutenção e refatoração | Tipagem explícita |
| Requests duplicados | Desperdício de banda e processamento | Cache de promises |
| Lógica de negócio | Service não deve ter regras de negócio | Apenas comunicação |

**Checklist de Conformidade:**
- [ ] Export de singleton (não classe)
- [ ] Tipagem explícita de retorno
- [ ] Erros propagados (não silenciados)
- [ ] Cache de promises quando aplicável
- [ ] Interceptors configurados em `api.ts`
- [ ] Sem lógica de negócio (apenas comunicação)

---

## 6. Arquitetura Backend

### 6.1 Modularidade e Factory Pattern

**Princípios:**
- Lógica de IA deve usar `ProviderFactory` para instanciação
- Configurações residem no banco, nunca hardcoded
- Injeção de dependências via construtor

**Convenções de Banco:**
- Models em `PascalCase`
- Tabelas em `snake_case`

### 6.2 Fonte Única de Verdade

**Qualquer entidade auditável, persistida ou governável DEVE ter sua identidade criada exclusivamente no backend.**

O frontend **NUNCA** é fonte de verdade para:
- IDs de mensagens
- IDs de inferências
- IDs de auditoria
- Decisões, custos ou status de execução

**Regras Práticas:**
- ❌ PROIBIDO gerar IDs auditáveis no frontend (`Date.now()`, `uuid()`, etc)
- ✅ Frontend deve sempre consumir IDs retornados pelo backend
- ✅ Se um dado pode ser auditado, ele **não pode** nascer no frontend

> 📌 **Regra de ouro:** *Se pode ser auditado, não pode ter identidade criada no frontend.*

### 6.3 Armazenamento Lean (Anti-Duplicação)

O sistema **NÃO DEVE** duplicar conteúdo que já existe em tabelas normalizadas.

**Regra:** Salvar apenas metadados e referências (IDs), nunca conteúdo duplicado.

✅ **O que DEVE ser salvo:**
```typescript
{
  config_V47: { mode, model, provider, timestamp, strategy, params },
  systemPrompt: "Você é uma IA útil...",  // ← ÚNICO! Não está no banco
  messageIds: ["uuid1", "uuid2", ...],    // ← IDs do histórico, não conteúdo!
  userMessageId: "uuid-da-pergunta",
  pinnedStepIndices: [0, 2, 5],
  preflightTokenCount: 1500
}
```

❌ **O que NÃO DEVE ser salvo:**
```typescript
{
  payloadSent: [{ role: "user", content: "texto enorme..." }]  // ← DUPLICAÇÃO!
}
```

**Economia estimada:** ~98% de espaço (50 MB vs 2.5 GB para 1.000 chats × 50 msgs)

### 6.4 Versionamento de Mensagens (Arquitetura Preparada)

> ⚠️ **STATUS:** Esta seção descreve arquitetura planejada. Implementação atual usa apenas `messageIds` no `sentContext`.

Quando a edição de mensagens for implementada:
- Editar uma mensagem **NÃO sobrescreve** o original
- Edições criam uma **nova versão** (branch)
- Traces existentes preservam referência à versão original

### 6.5 Workers e Filas (Bull/Redis)

O sistema utiliza **Bull** (biblioteca de filas baseada em Redis) para processamento assíncrono de tarefas pesadas, especialmente certificação de modelos AI.

#### 6.5.1 Arquitetura de Workers

**Estrutura de Diretórios:**
```
backend/src/
├── workers/
│   └── certificationWorker.ts      # Worker dedicado para certificações
├── services/queue/
│   ├── QueueService.ts              # Gerenciamento genérico de filas
│   ├── CertificationQueueService.ts # Orquestrador de certificações
│   ├── validators/
│   │   └── ModelValidator.ts        # Validação de modelos
│   ├── creators/
│   │   └── JobCreator.ts            # Criação de jobs
│   ├── processors/
│   │   ├── JobProcessor.ts          # Processamento de jobs
│   │   └── StatusUpdater.ts         # Atualização de status
│   └── queries/
│       └── StatusQuery.ts           # Consultas de status
└── config/
    ├── redis.ts                     # Configuração Redis
    └── bullBoard.ts                 # Dashboard de monitoramento
```

**Princípios:**
- **Separação de Responsabilidades:** Worker apenas processa, service orquestra
- **Idempotência:** Jobs podem ser reprocessados sem efeitos colaterais
- **Rastreabilidade:** Logs estruturados em cada etapa
- **Resiliência:** Retry automático com backoff exponencial

#### 6.5.2 Configuração Redis

**Variáveis de Ambiente Obrigatórias:**
```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                      # Vazio em dev, obrigatório em prod
REDIS_DB=0

# Bull Queue
BULL_QUEUE_PREFIX=myia               # Prefixo para chaves Redis
CERTIFICATION_QUEUE_NAME=model-certification
CERTIFICATION_CONCURRENCY=3          # Jobs simultâneos (dev: 3, prod: 5-10)
CERTIFICATION_TIMEOUT=300000         # 5 minutos
CERTIFICATION_MAX_RETRIES=3
```

**Exemplo de Configuração ([`backend/src/config/redis.ts`](backend/src/config/redis.ts)):**
```typescript
import Redis from 'ioredis';
import { config } from './env';

export const redisClient = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  db: config.redisDb,
  maxRetriesPerRequest: null,  // Requerido por Bull
  enableReadyCheck: false
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis error', { error: err.message });
});
```

#### 6.5.3 Padrão de Jobs (CertificationQueueService)

**Criação de Job:**
```typescript
// backend/src/services/queue/CertificationQueueService.ts

// Job único (1 modelo, 1 região)
const { jobId, bullJobId } = await certificationQueueService.certifyModel(
  'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'us-east-1',
  'user-uuid'
);

// Job em lote (N modelos x M regiões)
const { jobId, totalJobs } = await certificationQueueService.certifyMultipleModels(
  ['model-1', 'model-2'],
  ['us-east-1', 'us-west-2'],
  'user-uuid'
);

// Certificar todos os modelos Bedrock
const { jobId, totalJobs } = await certificationQueueService.certifyAllModels(
  ['us-east-1', 'us-west-2'],
  'user-uuid'
);
```

**Estrutura de Job Data:**
```typescript
interface CertificationJobData {
  jobId: string;           // UUID do CertificationJob (banco)
  modelId: string;         // UUID do modelo no ModelRegistry
  region: string;          // Região AWS (ex: us-east-1)
  createdBy?: string;      // UUID do usuário que iniciou
  timestamp: string;       // ISO 8601
}
```

**Resultado de Job:**
```typescript
interface CertificationResult {
  modelId: string;
  region: string;
  passed: boolean;         // true se todos os testes passaram
  score: number;           // 0-100
  rating: string;          // 'A+', 'A', 'B', 'C', 'D', 'F'
  testsPassed: number;
  testsFailed: number;
  duration: number;        // Duração em ms
  results: TestResult[];   // Detalhes de cada teste
}
```

#### 6.5.4 Retry Strategies

**Configuração de Retry:**
```typescript
// backend/src/services/queue/QueueService.ts

const jobOptions = {
  attempts: 3,                    // Máximo 3 tentativas
  backoff: {
    type: 'exponential',
    delay: 5000                   // 5s, 25s, 125s
  },
  timeout: 300000,                // 5 minutos por tentativa
  removeOnComplete: false,        // Manter histórico
  removeOnFail: false
};
```

**Quando Retry é Acionado:**
- ❌ Timeout de certificação (>5 min)
- ❌ Erro de rede AWS (throttling, timeout)
- ❌ Erro temporário do modelo (503 Service Unavailable)
- ✅ Erro de validação (não faz retry)
- ✅ Modelo não existe (não faz retry)

**Logs de Retry:**
```typescript
logger.warn('🔄 Retrying job', {
  jobId: job.id,
  attempt: job.attemptsMade,
  maxAttempts: job.opts.attempts,
  error: error.message
});
```

#### 6.5.5 Monitoramento (Bull Board)

**Acesso ao Dashboard:**
```
URL: http://localhost:3001/admin/queues
Credenciais: admin / admin123 (configurável via .env)
```

**Funcionalidades:**
- 📊 Visualizar jobs ativos, completados, falhados
- 🔄 Retry manual de jobs falhados
- 🗑️ Limpeza de filas (completed/failed)
- 📈 Métricas de throughput e latência
- 🔍 Inspeção de payload e resultado

**Configuração ([`backend/src/config/bullBoard.ts`](backend/src/config/bullBoard.ts)):**
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { queueService } from '../services/queue/QueueService';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(queueService.getQueue({ name: 'model-certification' }))
  ],
  serverAdapter
});

// Proteger com autenticação básica
app.use('/admin/queues', basicAuth({
  users: {
    [config.bullBoardUsername]: config.bullBoardPassword
  },
  challenge: true
}));

app.use('/admin/queues', serverAdapter.getRouter());
```

#### 6.5.6 Checklist de Conformidade (Workers)

**Configuração:**
- [ ] Redis configurado e acessível
- [ ] Variáveis de ambiente definidas (`.env`)
- [ ] Concurrency ajustada para ambiente (dev: 3, prod: 5-10)
- [ ] Timeout adequado para operação (certificação: 5min)

**Código:**
- [ ] Worker registra processador via `queue.process()`
- [ ] Jobs são idempotentes (podem ser reprocessados)
- [ ] Logs estruturados em cada etapa (active, completed, failed)
- [ ] Retry configurado com backoff exponencial
- [ ] Erros propagados corretamente (não silenciados)

**Monitoramento:**
- [ ] Bull Board acessível e protegido
- [ ] Logs de jobs salvos no banco (CertificationJob)
- [ ] Métricas de fila monitoradas (waiting, active, completed, failed)

**Referências:**
- Guia completo: [`backend/docs/REDIS-BULL-SETUP.md`](backend/docs/REDIS-BULL-SETUP.md)
- Worker: [`backend/src/workers/certificationWorker.ts`](backend/src/workers/certificationWorker.ts)
- Service: [`backend/src/services/queue/CertificationQueueService.ts`](backend/src/services/queue/CertificationQueueService.ts)

---

## 7. Tamanho de Arquivos (Sinalizador)

### 7.1 Princípio

**Tamanho é um SINALIZADOR, não uma regra primária.**

A regra primária é **responsabilidade única** (Seção 4.1). Limites de linhas servem para alertar sobre possíveis violações.

### 7.2 Limites por Tipo de Arquivo

| Tipo | Recomendado | Warning | Bloqueado |
|------|-------------|---------|-----------|
| **Controllers** | ≤200 | >250 | >400 |
| **Services** | ≤250 | >300 | >400 |
| **Components (React)** | ≤200 | >250 | >400 |
| **Hooks** | ≤150 | >200 | >300 |
| **Utilities** | ≤150 | >200 | >300 |
| **Types/Interfaces** | ≤100 | >150 | >200 |

### 7.3 Pre-Commit Hook

O projeto possui um **pre-commit hook** que verifica automaticamente:

- **⚠️ WARNING (300-400 linhas):** Mostra aviso, permite commit
- **🚨 ERROR (>400 linhas):** Bloqueia commit, exige refatoração

**Localização:** [`.husky/check-file-size.sh`](../.husky/check-file-size.sh)

### 7.4 Quando Arquivo Grande é Aceitável

Arquivo entre 300-400 linhas é aceitável SE:
- [ ] Tem **1 responsabilidade única e específica**
- [ ] Responsabilidade é descritível em **1 frase**
- [ ] Complexidade é **inerente ao domínio**
- [ ] Coesão é **alta** (tudo fortemente relacionado)

**❌ Justificativas NÃO Aceitáveis:**
- "Não tive tempo de refatorar"
- "É mais fácil manter tudo junto"
- "Vou refatorar depois" (sem issue criada)

---

# PARTE III: DESIGN SYSTEM

---

## 8. Identidade Visual e Design System

### 8.1 Princípios Fundamentais

1. **Theme-First:** NUNCA usar cores hardcoded
2. **Consistência de Ícones:** Material Icons (Outlined padrão)
3. **Acessibilidade:** Todo IconButton DEVE ter Tooltip
4. **Hierarquia Clara:** Primário → Secundário → Terciário
5. **Animações Suaves:** Transições de 0.2s-0.3s

### 8.2 Centralização de Cores no theme.ts

**Todas as cores da aplicação DEVEM ser definidas em `frontend/src/theme.ts`.**

❌ **PROIBIDO:**
```typescript
color: '#00FF41'
bgcolor: 'rgba(255,255,255,0.1)'
borderColor: 'rgba(0,0,0,0.2)'
background: alpha(theme.palette.primary.main, 0.2)
```

✅ **PERMITIDO:**
```typescript
color: 'text.secondary'
bgcolor: 'grey.100'
borderColor: 'divider'
opacity: 0.8
```

**Regras:**
- ❌ PROIBIDO usar valores default do MUI sem declarar no theme.ts
- ✅ Novos tokens de cor DEVEM ser criados no theme.ts antes de usar
- ✅ Usar apenas tokens do tema para garantir dark/light mode

### 8.3 Ícones Padronizados

| Categoria | Ícones | Uso |
|-----------|--------|-----|
| Mensagens | `Send`, `Stop`, `PushPin` | Enviar, parar, fixar |
| Edição | `CopyAll`, `Edit`, `Delete` | Copiar, editar, deletar |
| Debug | `DataObject`, `Timeline` | Payload, trace |
| Estado | `Warning`, `Error`, `CheckCircle` | Avisos, erros, sucesso |
| IA | `SmartToy`, `AutoAwesome` | Avatar bot, recursos IA |

### 8.4 Espaçamento (Grid 8px)

```typescript
gap: 0.5   // 4px
gap: 1     // 8px  (padrão ícones)
gap: 1.5   // 12px (confortável)
gap: 2     // 16px (generoso)
gap: 3     // 24px (seções)
```

### 8.5 Componentes de Ação

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

### 8.6 Checklist de Conformidade Visual

- [ ] Usa apenas tokens do tema
- [ ] Todos IconButtons têm Tooltip
- [ ] Ícones Material Icons (Outlined)
- [ ] Espaçamento múltiplo de 8px
- [ ] Transições suaves (0.2s/0.3s)
- [ ] Responsivo (xs/sm/md)
- [ ] Hover states definidos

---

# PARTE IV: API E COMUNICAÇÃO

---

## 9. Padronização de API (JSend)

### 9.1 Formato de Resposta

Toda comunicação Backend ↔ Frontend segue o padrão **JSend**:

| Status | HTTP Code | Formato |
|--------|-----------|---------|
| **Sucesso** | 200, 201 | `{ "status": "success", "data": { ... } }` |
| **Falha de Cliente** | 400, 403 | `{ "status": "fail", "data": { "campo": "mensagem" } }` |
| **Erro de Servidor** | 500 | `{ "status": "error", "message": "Descrição", "code": 500 }` |

### 9.2 Validação e Fluxo

1. **Zod Middleware:** Nenhuma rota processa dados sem `validate(schema)`
2. **Controller:** Apenas orquestração (chamar services e retornar `ApiResponse`)
3. **Segurança:** Senhas com `bcrypt` (salt 10), nunca retornar `password`
4. **Erros:** Lançar (`throw`), capturar no `errorHandler` global

### 9.3 Frontend: Interceptor (Desembrulhamento)

O frontend possui interceptor Axios que **desembrulha automaticamente** respostas JSend:

```typescript
// Backend retorna:
{ "status": "success", "data": { "user": {...} } }

// Interceptor transforma em:
{ "user": {...} }

// Frontend acessa:
const user = response.data.user; // ✅ CORRETO
const user = response.data.data.user; // ❌ ERRADO
```

**Padrão Obrigatório:**
- ✅ Backend SEMPRE retorna JSend completo
- ✅ Frontend SEMPRE acessa dados desembrulhados
- ❌ NUNCA acessar `response.data.data.X` no frontend

### 9.4 Tratamento de Erros

#### 9.4.1 Stack Traces
- ✅ Permitido em desenvolvimento (`NODE_ENV=development`)
- ❌ PROIBIDO em produção

#### 9.4.2 Validação Zod
```typescript
// ❌ PROIBIDO - Expor erro bruto
return res.status(400).json({ error: zodError });

// ✅ OBRIGATÓRIO - Formatar com JSend
return res.status(400).json({
  status: 'fail',
  data: { email: 'Email inválido', password: 'Mínimo 8 caracteres' }
});
```

#### 9.4.3 Rate Limiting
- Status: `429 Too Many Requests`
- Headers: `Retry-After` (segundos até reset)

#### 9.4.4 Erros de Autenticação
- `401 Unauthorized`: Token ausente/inválido
- `403 Forbidden`: Token válido mas sem permissão
- Mensagem genérica (não revelar se usuário existe)

### 9.5 Server-Sent Events (SSE)

O sistema utiliza **Server-Sent Events (SSE)** para comunicação unidirecional em tempo real do backend para o frontend, especialmente para streaming de chat e feedback de progresso de certificações.

#### 9.5.1 Quando Usar SSE

**SSE é apropriado para:**
- ✅ Streaming de respostas de chat (tokens incrementais)
- ✅ Feedback de progresso de tarefas longas (certificação de modelos)
- ✅ Notificações em tempo real (atualizações de status)
- ✅ Logs de processamento em tempo real

**SSE NÃO é apropriado para:**
- ❌ Comunicação bidirecional (use WebSockets)
- ❌ Transferência de arquivos grandes (use HTTP multipart)
- ❌ Requisições simples request/response (use REST)

#### 9.5.2 Formato de Eventos SSE

**Estrutura Padrão:**
```
data: <JSON_PAYLOAD>\n\n
```

**Tipos de Eventos:**

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `progress` | Atualização de progresso | Certificação: teste 2/6 concluído |
| `chunk` | Fragmento de conteúdo | Chat: token incremental |
| `complete` | Conclusão com sucesso | Resultado final da operação |
| `error` | Erro durante processamento | Falha na certificação |

#### 9.5.3 Implementação Backend

**Configuração de Headers ([`backend/src/utils/chat/sseHandler.ts`](backend/src/utils/chat/sseHandler.ts)):**
```typescript
export const sseHandler = {
  setupHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // Desabilitar buffering nginx
    res.flushHeaders();
  },

  createWriter(res: Response): (data: StreamChunk) => void {
    return (data: StreamChunk) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
  }
};
```

**Exemplo de Controller:**
```typescript
// backend/src/controllers/certificationController.ts

export async function certifyModelStream(req: Request, res: Response) {
  const { modelId } = req.params;
  
  // Configurar SSE
  sseHandler.setupHeaders(res);
  const write = sseHandler.createWriter(res);
  
  try {
    // Evento inicial
    write({ type: 'progress', current: 0, total: 6, message: 'Iniciando certificação' });
    
    // Processar certificação com callbacks de progresso
    const result = await certificationService.certify(modelId, {
      onProgress: (current, total, testName, status) => {
        write({ type: 'progress', current, total, testName, status });
      }
    });
    
    // Evento de conclusão
    write({ type: 'complete', certification: result });
    res.end();
    
  } catch (error) {
    write({ type: 'error', message: error.message });
    res.end();
  }
}
```

#### 9.5.4 Implementação Frontend

**Usando EventSource (Browser Nativo):**
```typescript
// frontend/src/services/certificationService.ts

export const certificationService = {
  certifyWithProgress: (modelId: string, onProgress: (data: any) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      const eventSource = new EventSource(
        `/api/certification/certify-model/${modelId}/stream`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'progress':
            onProgress(data);
            break;
            
          case 'complete':
            eventSource.close();
            resolve(data.certification);
            break;
            
          case 'error':
            eventSource.close();
            reject(new Error(data.message));
            break;
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        reject(new Error('Erro na conexão SSE'));
      };
    });
  }
};
```

**Usando fetch (Mais Controle):**
```typescript
async function streamCertification(modelId: string) {
  const response = await fetch(`/api/certification/certify-model/${modelId}/stream`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        handleEvent(data);
      }
    }
  }
}
```

#### 9.5.5 Formato de Chunks (Chat Streaming)

**Estrutura de Chunk:**
```typescript
interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;           // Token incremental
  metadata?: {
    model?: string;
    provider?: string;
    inferenceId?: string;
  };
  error?: string;
}
```

**Exemplo de Sequência:**
```typescript
// 1. Início do stream
{ type: 'start', metadata: { model: 'claude-3-5-sonnet', inferenceId: 'uuid' } }

// 2. Chunks de conteúdo
{ type: 'chunk', content: 'Olá' }
{ type: 'chunk', content: ', como' }
{ type: 'chunk', content: ' posso' }
{ type: 'chunk', content: ' ajudar?' }

// 3. Fim do stream
{ type: 'end', metadata: { totalTokens: 150, duration: 2340 } }
```

#### 9.5.6 Tratamento de Erros em Stream

**Erros HTTP (Antes do SSE Iniciar):**
```typescript
// Backend
if (!modelId) {
  return res.status(400).json({
    status: 'fail',
    data: { modelId: 'modelId é obrigatório' }
  });
}

// Frontend
try {
  const eventSource = new EventSource(url);
} catch (error) {
  if (error.response?.status === 400) {
    showError('Parâmetros inválidos');
  }
}
```

**Erros Durante SSE:**
```typescript
// Backend - Enviar evento de erro
write({ type: 'error', message: 'Falha ao processar certificação' });
res.end();

// Frontend - Tratar evento de erro
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'error') {
    eventSource.close();
    showError(data.message);
  }
};
```

#### 9.5.7 Timeout e Reconexão

**Configuração de Timeout (Backend):**
```typescript
// Manter conexão viva com heartbeat
const heartbeatInterval = setInterval(() => {
  res.write(': heartbeat\n\n');  // Comentário SSE (ignorado pelo cliente)
}, 30000);  // 30 segundos

// Limpar ao finalizar
res.on('close', () => {
  clearInterval(heartbeatInterval);
});
```

**Reconexão Automática (Frontend):**
```typescript
let reconnectAttempts = 0;
const MAX_RECONNECTS = 3;

function connectSSE() {
  const eventSource = new EventSource(url);
  
  eventSource.onerror = () => {
    eventSource.close();
    
    if (reconnectAttempts < MAX_RECONNECTS) {
      reconnectAttempts++;
      setTimeout(() => connectSSE(), 2000 * reconnectAttempts);  // Backoff exponencial
    } else {
      showError('Falha ao conectar após 3 tentativas');
    }
  };
  
  eventSource.onopen = () => {
    reconnectAttempts = 0;  // Reset ao conectar com sucesso
  };
}
```

#### 9.5.8 Checklist de Conformidade (SSE)

**Backend:**
- [ ] Headers SSE configurados corretamente (`Content-Type`, `Cache-Control`, `Connection`)
- [ ] `X-Accel-Buffering: no` para desabilitar buffering de proxy
- [ ] Eventos seguem formato `data: <JSON>\n\n`
- [ ] Tipos de eventos padronizados (`progress`, `chunk`, `complete`, `error`)
- [ ] Heartbeat implementado para conexões longas (>30s)
- [ ] Cleanup de recursos ao fechar conexão (`res.on('close')`)

**Frontend:**
- [ ] EventSource ou fetch com ReadableStream
- [ ] Tratamento de todos os tipos de eventos
- [ ] Fechamento de conexão ao receber `complete` ou `error`
- [ ] Tratamento de erros de conexão (`onerror`)
- [ ] Reconexão automática com backoff exponencial
- [ ] Cleanup ao desmontar componente

**Segurança:**
- [ ] Autenticação via header `Authorization` (EventSource não suporta headers customizados nativamente)
- [ ] Rate limiting aplicado (mesmo limite de rotas REST equivalentes)
- [ ] Validação de parâmetros antes de iniciar stream
- [ ] Timeout de conexão configurado

**Referências:**
- Exemplo completo: [`backend/docs/SSE-CERTIFICATION-EXAMPLE.md`](backend/docs/SSE-CERTIFICATION-EXAMPLE.md)
- Handler SSE: [`backend/src/utils/chat/sseHandler.ts`](backend/src/utils/chat/sseHandler.ts)
- Controller: [`backend/src/controllers/certificationController.ts`](backend/src/controllers/certificationController.ts)

---

# PARTE V: SEGURANÇA

---

## 10. Segurança (Padrões Obrigatórios)

### 10.1 Regra Zero-Trust

**TODA aplicação DEVE seguir os padrões de segurança desde o primeiro commit.**

| Requisito | Implementação |
|-----------|---------------|
| Secrets | Validados na inicialização (exit se ausentes) |
| Rate Limiting | Aplicado em TODAS as rotas expostas |
| Validação | Zod em TODAS as rotas POST/PUT/PATCH/DELETE |
| Helmet | Configurado com CSP em produção |
| HTTPS | Obrigatório em produção (redirect automático) |

### 10.2 Princípio Fail-Secure

```typescript
// ❌ PROIBIDO - Fail-open (inseguro)
const secret = process.env.JWT_SECRET || 'dev-secret';
const user = await findUser(input) || { role: 'guest' };

// ✅ OBRIGATÓRIO - Fail-secure
if (!process.env.JWT_SECRET) process.exit(1);
if (!user) throw new AppError('Unauthorized', 401);
```

**Regra:** Em caso de falha, o sistema DEVE negar acesso, NUNCA permitir por padrão.

### 10.3 Checklist Pré-Commit (Segurança)

Antes de commit que modifique:
- [ ] Rotas de API → Verificar rate limiting + validação Zod
- [ ] Autenticação → Verificar authMiddleware aplicado
- [ ] Variáveis de ambiente → Verificar validação obrigatória
- [ ] Queries ao banco → Verificar uso de Prisma (NUNCA raw SQL)

### 10.4 Testes de Segurança

```bash
# Executar ANTES de push/deploy
cd backend
./security-tests.sh

# Resultado esperado: 100% PASS (7/7 testes)
```

### 10.5 Documento de Referência

Para padrões detalhados de segurança, consulte: **[SECURITY-STANDARDS.md](SECURITY-STANDARDS.md)**

---

# PARTE VI: OBSERVABILIDADE

---

## 11. Sistema de Logging

### 11.1 Princípios Fundamentais

**Logging estruturado é OBRIGATÓRIO em todo o projeto.**

| Proibido | Obrigatório |
|----------|-------------|
| `console.log()` | `logger.info()` |
| `console.error()` | `logger.error()` |
| `console.warn()` | `logger.warn()` |

### 11.2 Níveis de Log

| Nível | Uso | Exemplo |
|-------|-----|---------|
| `info` | Operações normais | Login, inferência concluída |
| `warn` | Situações anormais (não críticas) | Rate limit atingido, cache miss |
| `error` | Erros que impedem operação | Falha de autenticação, timeout |
| `debug` | Informações detalhadas (dev) | Payload enviado, estado interno |

### 11.3 Estrutura de Log Padronizada

```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: LogLevel;          // 'info' | 'warn' | 'error' | 'debug'
  message: string;
  requestId?: string;       // UUID da requisição HTTP
  userId?: string;          // ID do usuário autenticado
  inferenceId?: string;     // ID da inferência (se aplicável)
  provider?: string;        // Provider usado
  model?: string;           // Modelo usado
  duration?: number;        // Duração da operação (ms)
  metadata?: Record<string, unknown>;
}
```

### 11.4 Segurança e Dados Sensíveis

**REGRAS ESTRITAS:**
- ❌ **NUNCA** logar senhas, tokens, chaves de API
- ❌ **NUNCA** logar dados pessoais (CPF, cartão de crédito)
- ❌ **NUNCA** logar payloads completos
- ✅ Logar apenas IDs de usuários (não nomes/emails)
- ✅ Stack traces **APENAS** em desenvolvimento

```typescript
// ❌ PROIBIDO
logger.info('User login', { email: user.email, password: user.password });

// ✅ PERMITIDO
logger.info('User login', { userId: user.id, requestId: req.id });
```

### 11.5 Correlação de Logs

**Todo log DEVE incluir `requestId` quando disponível.**

```typescript
logger.info('Operation', {
  requestId: req.id,  // ✅ SEMPRE incluir
  userId: req.user?.id,
  // ... outros campos
});
```

### 11.6 Checklist de Conformidade (Logging)

- [ ] Usa `logger.info/warn/error/debug` (não `console.log`)
- [ ] Inclui `requestId` quando disponível
- [ ] Inclui `userId` quando disponível
- [ ] NÃO loga dados sensíveis
- [ ] Stack traces apenas em desenvolvimento
- [ ] Nível de log correto

### 11.7 Referências

- **Proposta Completa:** [logging/LOGGING-SYSTEM.md](./logging/LOGGING-SYSTEM.md)
- **ADR:** [ADR-005-LOGGING-SYSTEM.md](./architecture/ADR-005-LOGGING-SYSTEM.md)

### 11.8 Exceções Permitidas

**Contextos onde `console.*` é permitido:**

| Contexto | console.* Permitido? | Justificativa |
|----------|---------------------|---------------|
| Scripts CLI (`scripts/`) | ✅ Sim | Output direto para terminal |
| Seed/Migration | ✅ Sim | Feedback de progresso |
| Testes (`*.test.ts`, `*.spec.ts`) | ✅ Sim | Debug de testes |
| Frontend (dev only) | ✅ Condicional | Debug local |
| Frontend (produção) | ❌ Não | Usar logger frontend |
| Backend (produção) | ❌ Não | Usar Winston |

**Regra para Frontend:**
```typescript
// ✅ CORRETO - Condicional para dev
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug]', data);
}

// ✅ CORRETO - Usar logger do frontend (quando implementado)
import { logger } from '@/utils/logger';
logger.info('Operação concluída', { data });

// ❌ ERRADO - console.log em produção
console.log('Dados:', data);
```

**Checklist de Conformidade:**
- [ ] Scripts CLI podem usar `console.*` livremente
- [ ] Testes podem usar `console.*` para debug
- [ ] Frontend usa `console.*` apenas em dev (condicional)
- [ ] Backend produção usa APENAS `logger.*`

---

# PARTE VII: DESENVOLVIMENTO

---

## 12. Commits e Versionamento

### 12.1 Formato de Commit (Conventional Commits)

```
<type>: <description>

[optional body]
[optional footer]
```

**Types Permitidos:**

| Type | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição/correção de testes |
| `chore` | Tarefas de manutenção (deps, config) |
| `perf` | Melhoria de performance |
| `style` | Formatação (não afeta lógica) |

**Exemplos:**
```bash
feat: add JSend standardization to all controllers
fix: resolve JWT payload mismatch (userId vs id)
docs: update STANDARDS.md with Section 14
refactor: extract chat logic to custom hook
```

### 12.2 Regras de Mensagens

- **Idioma:** Inglês
- **Tamanho:** Máximo 72 caracteres no título
- **Verbo:** Imperativo ("add" não "added")
- **Caixa:** Minúsculo após o tipo
- **Pontuação:** Sem ponto final no título

```bash
# ❌ PROIBIDO
Fixed bug in chat  # Passado
Added new feature.  # Ponto final
FEAT: BIG CHANGE  # Maiúsculas

# ✅ PERMITIDO
fix: resolve race condition in AuthContext
feat: implement prompt trace visualization
```

### 12.3 Estratégia de Branches

**Branches Principais:**
- `main`: Código em produção (protegido)
- `develop`: Integração de features (opcional)

**Branches de Trabalho:**
- `feature/nome-da-feature`
- `fix/nome-do-bug`
- `docs/nome-do-doc`
- `refactor/nome-da-refatoracao`

### 12.4 Checklist Pré-Commit (Unificado)

Antes de cada commit, verificar:

**Quality Gates (Obrigatório):**
- [ ] `npm run lint` → 0 errors
- [ ] `npm run type-check` → exit code 0
- [ ] Pre-commit hook passou (tamanho de arquivos)

#### 12.4.1 ESLint Enforcement

**O projeto possui rules ESLint rigorosas para enforcement automático dos padrões do STANDARDS.md.**

**Rules Configuradas:**

| Rule | Severidade | Descrição | Exceções |
|------|-----------|-----------|----------|
| `no-console` | error | Proíbe `console.log()` (permite `warn`/`error`) | `scripts/**`, `**/*.test.ts`, `**/seed.ts` |
| `no-restricted-imports` | error | Proíbe imports relativos profundos (`../../..`) | Nenhuma |
| `no-restricted-syntax` | error | Proíbe cores hardcoded (`#FFF`, `rgba()`) | Apenas frontend |

**Arquivos de Configuração:**
- Backend: [`backend/.eslintrc.cjs`](../backend/.eslintrc.cjs)
- Frontend: [`.eslintrc.json`](./.eslintrc.json) (raiz do projeto)
- Ignore: [`backend/.eslintignore`](../backend/.eslintignore), [`.eslintignore`](./.eslintignore)

**Comandos:**
```bash
# Backend
cd backend && npm run lint
cd backend && npm run lint:fix

# Frontend (raiz)
npm run lint
npm run lint:fix
```

**Exceções Documentadas:**

1. **console.log permitido em:**
   - Scripts CLI (`scripts/**/*.ts`, `scripts/**/*.js`, `scripts/**/*.mjs`)
   - Testes (`**/*.test.ts`, `**/*.spec.ts`)
   - Seeds (`**/seed.ts`)

2. **Cores hardcoded:**
   - Rule aplicada APENAS em `frontend/**` e `frontend-admin/**`
   - Backend não tem restrição (não usa cores)

3. **Imports relativos profundos:**
   - Proibido em TODO o projeto
   - Use path aliases (`@/`) ou imports absolutos

**Resultado Esperado:**
- ⚠️ Warnings: Permitidos (não bloqueiam commit)
- 🚨 Errors: Bloqueiam commit (devem ser corrigidos)

**Nota:** Esta configuração pode detectar violações existentes no código legado. Corrija gradualmente ou adicione exceções específicas no `.eslintignore` se necessário.

**Código:**
- [ ] Headers obrigatórios em novos arquivos (Seção 1)
- [ ] Sem cores hardcoded (Seção 8.2)
- [ ] JSend em novas rotas (Seção 9)
- [ ] Arquivos não excedem 400 linhas (Seção 7)

**Segurança (se aplicável):**
- [ ] Rate limiting em novas rotas
- [ ] Validação Zod em rotas POST/PUT/PATCH/DELETE
- [ ] authMiddleware em rotas protegidas

**Simulações (se aplicável):**
- [ ] Marcação `⚠️ SIMULAÇÃO` visível
- [ ] Flag de controle por variável de ambiente
- [ ] Resposta inclui `simulated: true`

### 12.5 Versionamento Semântico (SemVer)

**Formato:** `MAJOR.MINOR.PATCH` (ex: `1.3.2`)

| Componente | Quando Incrementar |
|------------|-------------------|
| **MAJOR** | Mudanças incompatíveis (breaking changes) |
| **MINOR** | Novas funcionalidades (compatível) |
| **PATCH** | Correções de bugs (compatível) |

### 12.6 Arquivos Proibidos no Repositório

**Arquivos que NÃO devem ser commitados:**

| Padrão | Motivo | Alternativa |
|--------|--------|-------------|
| `*.backup` | Poluição do repositório | Usar branches ou stash |
| `*.bak` | Poluição do repositório | Usar branches ou stash |
| `*.old` | Poluição do repositório | Usar branches ou stash |
| `*.orig` | Arquivo de merge | Resolver conflitos e deletar |

**Regra:** Use `git stash` ou branches para preservar código temporariamente.

```bash
# ❌ PROIBIDO
cp arquivo.ts arquivo.ts.backup
git add arquivo.ts.backup

# ✅ CORRETO
git stash push -m "backup antes de refatorar"
# ou
git checkout -b backup/feature-x
```

---

## 13. Testes

### 13.1 Princípios Fundamentais

**Testes são parte integral do código, não um adicional.**

- ✅ Todo código crítico DEVE ter testes
- ✅ Testes devem ser mantidos junto com o código
- ❌ PROIBIDO commitar código quebrado que falha em testes existentes

### 13.2 Estrutura de Arquivos

| Tipo de Teste | Localização | Padrão de Nome |
|---------------|-------------|----------------|
| **Unitários** | `__tests__/` dentro do módulo | `*.test.ts` |
| **Integração** | `tests/integration/` | `*.integration.test.ts` |
| **E2E** | `tests/e2e/` | `*.e2e.test.ts` |

**Exemplo de estrutura:**
```
backend/src/services/ai/
├── aiService.ts
├── __tests__/
│   └── aiService.test.ts
└── adapters/
    ├── anthropic.adapter.ts
    └── __tests__/
        └── anthropic.adapter.test.ts
```

### 13.3 Ferramentas Padrão

| Ferramenta | Uso |
|------------|-----|
| **Jest** | Framework de testes (backend e frontend) |
| **@testing-library/react** | Testes de componentes React |
| **supertest** | Testes de API HTTP |
| **msw** | Mock de requisições HTTP |

### 13.4 Cobertura Mínima

| Tipo de Código | Cobertura Mínima |
|----------------|------------------|
| **Services críticos** | ≥70% |
| **Controllers** | ≥50% |
| **Utils/Helpers** | ≥80% |
| **Components React** | ≥50% (lógica) |

> **Nota:** Cobertura é um indicador, não um objetivo. Testes de qualidade > quantidade.

### 13.5 Padrões de Mocking

```typescript
// ✅ CORRETO - Mock explícito e tipado
jest.mock('../services/aiService', () => ({
  aiService: {
    generate: jest.fn().mockResolvedValue({ content: 'mocked response' })
  }
}));

// ❌ PROIBIDO - Mock genérico sem tipagem
jest.mock('../services/aiService');
```

### 13.6 Checklist de Conformidade (Testes)

- [ ] Testes em `__tests__/` ou `tests/`
- [ ] Nome segue padrão `*.test.ts`
- [ ] Mocks são explícitos e tipados
- [ ] Testes não dependem de ordem de execução
- [ ] Testes não dependem de estado externo (banco, API)
- [ ] Cleanup após cada teste (`afterEach`)

### 13.7 Referência

Para guia completo de testes: **[testing/TESTING-GUIDE.md](./testing/TESTING-GUIDE.md)** *(a ser criado)*

---

# APÊNDICES

---

## A. Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **JSend** | Especificação para respostas JSON padronizadas (success/fail/error) |
| **Lean Storage** | Estratégia de armazenamento que evita duplicação de dados |
| **Mapper** | Função pura que transforma dados entre camadas (ex: API → Frontend) |
| **Zero-Trust** | Modelo de segurança que não confia em nenhuma entidade por padrão |
| **Fail-Secure** | Princípio onde falhas resultam em negação de acesso |
| **Prompt Trace** | Registro de auditoria do contexto enviado para inferência de IA |
| **Factory Pattern** | Padrão de design para criação de objetos |
| **Builder Pattern** | Padrão de design para construção de objetos complexos |
| **Strategy Pattern** | Padrão de design para algoritmos intercambiáveis |
| **Orquestrador** | Classe que coordena outras classes sem implementar lógica própria |

---

## B. Links para Documentos Externos

| Documento | Descrição |
|-----------|-----------|
| [SECURITY-STANDARDS.md](SECURITY-STANDARDS.md) | Padrões detalhados de segurança |
| [VISUAL-IDENTITY-GUIDE.md](VISUAL-IDENTITY-GUIDE.md) | Guia completo de identidade visual |
| [logging/LOGGING-SYSTEM.md](./logging/LOGGING-SYSTEM.md) | Sistema de logging detalhado |
| [architecture/ADR-005-LOGGING-SYSTEM.md](./architecture/ADR-005-LOGGING-SYSTEM.md) | ADR do sistema de logging |
| [FILE_SIZE_ANALYSIS_REPORT.md](./FILE_SIZE_ANALYSIS_REPORT.md) | Relatório de análise de tamanho de arquivos |
| [.husky/check-file-size.sh](../.husky/check-file-size.sh) | Script de verificação de tamanho |

---

## C. Changelog do STANDARDS.md

### v2.1.5 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 12.6: Arquivos Proibidos no Repositório

**Melhorias:**
- Seção 12.6: Documentados padrões de arquivos proibidos (*.backup, *.bak, *.old, *.orig)
  - Tabela com padrões, motivos e alternativas
  - Regra: usar `git stash` ou branches para preservar código temporariamente
  - Exemplos de uso correto vs incorreto
- [`.gitignore`](.gitignore): Adicionados padrões de backup (*.backup, *.bak, *.old, *.orig)
- Índice: Adicionado link para Seção 12.6

**Arquivos Deletados:**
- Removidos 8 arquivos `.backup` do repositório:
  - `backend/src/controllers/providersController.ts.backup`
  - `backend/src/controllers/certificationQueueController.ts.backup`
  - `backend/src/services/ai/providers/bedrock.ts.backup`
  - `backend/src/services/ai/registry/models/cohere.models.ts.backup`
  - `backend/src/services/ai/registry/models/amazon.models.ts.backup`
  - `backend/src/services/queue/CertificationQueueService.ts.backup`
  - `docs/obsolete/start_interactive.sh.backup`
  - `frontend/src/features/chat/components/ControlPanel/ModelTab.tsx.backup`

**Justificativa:**
- Previne poluição do repositório com arquivos de backup
- Padroniza uso de `git stash` e branches para preservar código
- Melhora higiene do repositório e histórico do Git
- Reduz tamanho do repositório e facilita navegação

---

### v2.1.4 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 12.4.1: ESLint Enforcement

**Melhorias:**
- Seção 12.4: Documentado enforcement automático de padrões via ESLint
  - Rules rigorosas: `no-console`, `no-restricted-imports`, `no-restricted-syntax`
  - Exceções documentadas para scripts, testes e seeds
  - Configuração específica para backend e frontend
  - Comandos de lint e lint:fix
  - Tabela de rules com severidade e exceções

**Arquivos Modificados:**
- Criado [`backend/.eslintrc.cjs`](../backend/.eslintrc.cjs) com rules específicas do backend
- Criado [`backend/.eslintignore`](../backend/.eslintignore) para ignorar dist/
- Atualizado [`.eslintrc.json`](./.eslintrc.json) com rules do frontend
- Adicionados scripts `lint` e `lint:fix` no [`backend/package.json`](../backend/package.json)

**Justificativa:**
- Automatiza enforcement de padrões (console.log, cores hardcoded, imports profundos)
- Reduz revisões manuais de código
- Melhora qualidade e consistência do código
- Detecta violações antes do commit

---

### v2.1.3 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 6.5: Workers e Filas (Bull/Redis)
- Adicionada Seção 9.5: Server-Sent Events (SSE)

**Melhorias:**
- Seção 6: Documentada arquitetura de workers com Bull/Redis (~80 linhas)
  - Estrutura de diretórios e responsabilidades
  - Configuração Redis e variáveis de ambiente
  - Padrão de jobs (CertificationQueueService)
  - Retry strategies com backoff exponencial
  - Monitoramento com Bull Board
  - Checklist de conformidade para workers
- Seção 9: Documentado padrão de Server-Sent Events (~50 linhas)
  - Quando usar SSE vs WebSockets vs REST
  - Formato de eventos e tipos padronizados
  - Implementação backend (headers, streaming)
  - Implementação frontend (EventSource, fetch)
  - Tratamento de erros em stream
  - Timeout, heartbeat e reconexão automática
  - Checklist de conformidade para SSE
- Índice: Adicionados links para Seções 6.5 e 9.5

**Justificativa:**
- Documenta tecnologias críticas não documentadas (Bull/Redis, SSE)
- Padroniza implementação de workers e streaming
- Melhora onboarding de desenvolvedores em features assíncronas
- Resolve gap de documentação identificado na tarefa T4

---

### v2.1.2 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 5.5: Estrutura de Features (Frontend)
- Adicionada Seção 5.6: Services Frontend

**Melhorias:**
- Seção 5: Documentada estrutura padrão de `features/` com regras de organização
- Seção 5.5: Regras de extração de hooks (>3 useState), divisão de componentes (>100 linhas)
- Seção 5.5: Regras de importação entre features (proibido importar diretamente)
- Seção 5.6: Padrão de singleton exports (não classes) para services
- Seção 5.6: Tratamento de erros (propagar, não silenciar)
- Seção 5.6: Cache de promises para deduplicação de requests
- Seção 5.6: Estrutura de `api.ts` com interceptors
- Índice: Adicionados links para Seções 5.5 e 5.6

**Justificativa:**
- Padroniza organização de código frontend
- Resolve falta de documentação sobre estrutura de features
- Define padrões claros para services e comunicação com API
- Melhora manutenibilidade e consistência do código frontend

---

### v2.1.1 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 11.8: Exceções Permitidas (console.log)

**Melhorias:**
- Seção 11: Documentadas exceções para uso de `console.*` em scripts, testes e frontend dev
- Índice: Adicionado link para Seção 11.8

**Justificativa:**
- Resolve inconsistência entre regra estrita (linha 794) e realidade do projeto (300+ ocorrências)
- Permite uso pragmático de `console.*` em contextos apropriados
- Mantém rigor para código de produção (backend e frontend)

---

### v2.1.0 (2026-02-07)

**Novas Seções:**
- Adicionada Seção 5.4: Mappers (Transformação de Dados)
- Adicionada Seção 13: Testes

**Melhorias:**
- Seção 1.2: Adicionado formato curto de header para scripts/testes
- Glossário: Adicionado termo "Mapper"

---

### v2.0.0 (2026-02-07)

**Reestruturação Completa:**
- Reorganizado em 7 partes temáticas (vs 15 seções soltas)
- Adicionada Seção 4: Princípios de Modularização (nova)
- Unificadas regras de cores (antigas Seções 3.2 e 10)
- Consolidada arquitetura backend (antigas Seções 4, 5, 7, 11)
- Checklist pré-commit unificado (Seção 12.4)
- Adicionados Apêndices (Glossário, Links, Changelog)

**Mudanças Conceituais:**
- Tamanho de arquivo agora é "sinalizador", não regra primária
- Responsabilidade única é a regra primária
- Tabela de padrões de design para navegação semântica
- Anti-padrões de modularização documentados

### v1.0.0 (Original)

- Versão inicial com 15 seções