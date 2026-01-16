# Análise do Fluxo de Dados dos Providers

## 📋 Visão Geral

Este documento mapeia o caminho completo que os dados de **providers** percorrem desde o banco de dados até os componentes [`ModelTab.tsx`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx) e [`AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx), explicando a relação entre eles e como os dados são salvos e recuperados.

---

## 🗄️ 1. Banco de Dados (Origem dos Dados)

### Tabelas Envolvidas

#### **`ai_providers`** (Providers Cadastrados)
```prisma
model AIProvider {
  id         String   @id @default(uuid())
  name       String   // Ex: "OpenAI", "AWS Bedrock"
  slug       String   @unique // Ex: "openai", "bedrock"
  isActive   Boolean  @default(true)
  websiteUrl String?
  logoUrl    String?
  baseUrl    String?
  models     AIModel[]
}
```

#### **`ai_models`** (Modelos Cadastrados)
```prisma
model AIModel {
  id              String  @id @default(uuid())
  name            String  // Ex: "Claude 3.5 Sonnet"
  apiModelId      String  // Ex: "anthropic.claude-3-5-sonnet-20240620-v1:0"
  contextWindow   Int     @default(4096)
  costPer1kInput  Float   @default(0)
  costPer1kOutput Float   @default(0)
  isActive        Boolean @default(true)
  providerId      String
  provider        AIProvider @relation(fields: [providerId], references: [id])
}
```

#### **`user_settings`** (Configurações do Usuário)
```prisma
model UserSettings {
  id               String   @id @default(uuid())
  userId           String   @unique
  
  // Credenciais AWS (criptografadas)
  awsAccessKey     String?
  awsSecretKey     String?
  awsRegion        String?  @default("us-east-1")
  awsEnabledModels String[] @default([]) // Array de apiModelId habilitados
  
  // Outras chaves de API
  openaiApiKey     String?
  groqApiKey       String?
  // ...
}
```

#### **`provider_credential_validations`** (Status de Validação)
```prisma
model ProviderCredentialValidation {
  id              String    @id @default(uuid())
  userId          String
  provider        String    // 'bedrock', 'azure', etc
  status          String    // 'valid', 'invalid', 'not_configured'
  lastValidatedAt DateTime?
  lastError       String?
  errorCode       String?
  validatedModels String[]  @default([])
  latencyMs       Int?
  
  @@unique([userId, provider])
}
```

---

## 🔄 2. Fluxo de Dados para o ModelTab

### 2.1. Caminho Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS (PostgreSQL)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ ai_providers │  │  ai_models   │  │  user_settings      │   │
│  │              │  │              │  │                     │   │
│  │ - openai     │  │ - gpt-4      │  │ - awsAccessKey      │   │
│  │ - groq       │  │ - llama-3    │  │ - awsEnabledModels  │   │
│  │ - bedrock    │  │ - claude-3.5 │  │ - awsRegion         │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + Prisma)                    │
│                                                                  │
│  📍 GET /api/providers/configured                                │
│  📄 backend/src/routes/providers.ts (linha 52-99)               │
│                                                                  │
│  Lógica:                                                         │
│  1. Busca user_settings do usuário                              │
│  2. Busca provider_credential_validations                       │
│  3. Busca todos ai_providers ativos com seus models             │
│  4. FILTRA providers baseado em:                                │
│     - Providers padrão (openai, groq, together): sempre visíveis│
│     - AWS Bedrock: só se validado E tem modelos habilitados     │
│  5. Para Bedrock, filtra apenas modelos em awsEnabledModels     │
│                                                                  │
│  Retorna: { providers: AIProvider[] }                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - SERVIÇO                            │
│                                                                  │
│  📄 frontend/src/services/aiProvidersService.ts                 │
│                                                                  │
│  aiProvidersService.getConfigured()                             │
│  → Faz GET /providers/configured                                │
│  → Retorna Promise<AIProvider[]>                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - COMPONENTE                         │
│                                                                  │
│  📄 frontend/src/features/chat/components/ControlPanel/          │
│     ModelTab.tsx (linha 49-90)                                  │
│                                                                  │
│  useEffect(() => {                                              │
│    const data = await aiProvidersService.getConfigured();       │
│    setProviders(data); // Estado local                          │
│                                                                  │
│    // Auto-seleção inteligente                                  │
│    if (!chatConfig.provider || !currentProviderValid) {         │
│      updateChatConfig({                                         │
│        provider: data[0].slug,                                  │
│        model: data[0].models[0].apiModelId                      │
│      });                                                        │
│    }                                                            │
│  }, []);                                                        │
│                                                                  │
│  // Listener para recarregar quando AWS for atualizado          │
│  window.addEventListener('aws-credentials-updated', loadData);  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Formato dos Dados no ModelTab

```typescript
// Tipo usado no ModelTab
interface AIProvider {
  id: string;
  name: string;       // Ex: "AWS Bedrock"
  slug: string;       // Ex: "bedrock"
  isActive: boolean;
  logoUrl?: string;
  models: AIModel[];  // Apenas modelos habilitados pelo usuário
}

interface AIModel {
  id: string;
  name: string;       // Ex: "Claude 3.5 Sonnet"
  apiModelId: string; // Ex: "anthropic.claude-3-5-sonnet-20240620-v1:0"
  contextWindow: number;
}
```

---

## 🔄 3. Fluxo de Dados para o AWSProviderPanel

### 3.1. Caminho Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS (PostgreSQL)                   │
│  ┌─────────────────────┐  ┌──────────────┐                      │
│  │  user_settings      │  │  ai_models   │                      │
│  │                     │  │              │                      │
│  │ - awsAccessKey      │  │ - claude-3.5 │                      │
│  │ - awsSecretKey      │  │ - llama-3    │                      │
│  │ - awsRegion         │  │ (bedrock)    │                      │
│  │ - awsEnabledModels  │  │              │                      │
│  └─────────────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - MÚLTIPLOS ENDPOINTS                 │
│                                                                  │
│  1️⃣ GET /api/settings                                           │
│     → Retorna configurações do usuário (sem secretKey)          │
│     → Usado para carregar estado inicial                        │
│                                                                  │
│  2️⃣ POST /api/providers/bedrock/validate                        │
│     📄 backend/src/controllers/providersController.ts (26-173)  │
│     → Valida credenciais AWS com Bedrock                        │
│     → Modo Edição (com secretKey): Valida E salva se válido    │
│     → Modo Teste (sem secretKey): Apenas valida credenciais já salvas │
│     → Atualiza provider_credential_validations                  │
│                                                                  │
│  3️⃣ GET /api/providers/bedrock/available-models                 │
│     📄 backend/src/controllers/providersController.ts (179-296) │
│     → Busca modelos DINÂMICOS da conta AWS do usuário           │
│     → Enriquece com dados do banco (custos, context window)     │
│     → Filtra apenas modelos de chat (TEXT input/output)         │
│                                                                  │
│  4️⃣ PUT /api/settings                                           │
│     → Salva todos os campos enviados (incluindo awsEnabledModels) │
│     → Backend retorna sucesso                                   │
│     → Frontend dispara evento 'aws-credentials-updated'         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - HOOK CUSTOMIZADO                   │
│                                                                  │
│  📄 frontend/src/features/settings/hooks/useAWSConfig.ts        │
│                                                                  │
│  useEffect(() => {                                              │
│    // 1. Carrega configurações salvas                           │
│    const settings = await userSettingsService.getSettings();    │
│    setFormState({                                               │
│      accessKey: settings.awsAccessKey,                          │
│      secretKey: '', // nunca retorna do backend                 │
│      region: settings.awsRegion                                 │
│    });                                                          │
│    setSelectedModels(settings.awsEnabledModels);                │
│                                                                  │
│    // 2. Busca modelos disponíveis dinamicamente                │
│    if (settings.awsAccessKey) {                                 │
│      const res = await api.get('/providers/bedrock/             │
│                                  available-models');            │
│      setAvailableModels(res.data.models);                       │
│    }                                                            │
│  }, []);                                                        │
│                                                                  │
│  handleValidate = async () => {                                 │
│    // Valida credenciais                                        │
│    await api.post('/providers/bedrock/validate', {              │
│      accessKey, secretKey, region                               │
│    });                                                          │
│    // Busca modelos disponíveis após validação                  │
│    const res = await api.get('/providers/bedrock/               │
│                                available-models');              │
│    setAvailableModels(res.data.models);                         │
│  };                                                             │
│                                                                  │
│  handleSave = async () => {                                     │
│    // Salva configurações                                       │
│    await userSettingsService.updateSettings({                   │
│      awsAccessKey, awsSecretKey, awsRegion,                     │
│      awsEnabledModels: selectedModels                           │
│    });                                                          │
│    // Dispara evento para atualizar ModelTab                    │
│    window.dispatchEvent(new CustomEvent(                        │
│      'aws-credentials-updated'                                  │
│    ));                                                          │
│  };                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND - COMPONENTE                         │
│                                                                  │
│  📄 frontend/src/features/settings/components/providers/        │
│     AWSProviderPanel.tsx                                        │
│                                                                  │
│  const {                                                        │
│    formState,           // { accessKey, secretKey, region }     │
│    availableModels,     // Modelos da AWS (dinâmicos)           │
│    selectedModels,      // IDs dos modelos habilitados          │
│    handleValidate,      // Valida credenciais                   │
│    handleSave,          // Salva configurações                  │
│    toggleModel          // Alterna seleção de modelo            │
│  } = useAWSConfig();                                            │
│                                                                  │
│  // UI para configurar credenciais e selecionar modelos         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Formato dos Dados no AWSProviderPanel

```typescript
// Modelos disponíveis (enriquecidos)
interface AvailableModel {
  id: string;
  apiModelId: string;           // Ex: "anthropic.claude-3-5-sonnet-20240620-v1:0"
  name: string;                 // Ex: "Claude 3.5 Sonnet"
  providerName: string;         // Ex: "Anthropic"
  costPer1kInput: number;       // Do banco de dados
  costPer1kOutput: number;      // Do banco de dados
  contextWindow: number;        // Do banco de dados
  inputModalities: string[];    // Da AWS API
  outputModalities: string[];   // Da AWS API
  responseStreamingSupported: boolean; // Da AWS API
  isInDatabase: boolean;        // Se tem informações no banco
}

// Estado do formulário
interface FormState {
  accessKey: string;  // Ex: "AKIAIOSFODNN7EXAMPLE"
  secretKey: string;  // Ex: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  region: string;     // Ex: "us-east-1"
}

// Modelos selecionados
selectedModels: string[] // Array de apiModelId
```

---

## 🔗 4. Relação Entre ModelTab e AWSProviderPanel

### 4.1. Diferenças Fundamentais

| Aspecto | ModelTab | AWSProviderPanel |
|---------|----------|------------------|
| **Propósito** | Selecionar provider/modelo para chat | Configurar credenciais AWS e habilitar modelos |
| **Dados Exibidos** | Apenas providers/modelos **configurados e habilitados** | **Todos** os modelos disponíveis na conta AWS |
| **Fonte de Dados** | `/providers/configured` (filtrado) | `/providers/bedrock/available-models` (dinâmico) |
| **Modelos Bedrock** | Apenas os em `awsEnabledModels` | Todos os modelos da conta AWS |
| **Interação** | Leitura (seleção) | Escrita (configuração) |

### 4.2. Fluxo de Comunicação

```
┌──────────────────────┐
│  AWSProviderPanel    │
│  (Configuração)      │
└──────────────────────┘
          │
          │ 1. Usuário configura credenciais
          │ 2. Valida com AWS
          │ 3. Seleciona modelos
          │ 4. Salva em user_settings.awsEnabledModels
          │
          ↓
┌──────────────────────────────────────┐
│  window.dispatchEvent(               │
│    'aws-credentials-updated'         │
│  )                                   │
└──────────────────────────────────────┘
          │
          │ Evento customizado
          │
          ↓
┌──────────────────────┐
│     ModelTab         │
│  (Seleção de IA)     │
└──────────────────────┘
          │
          │ 1. Escuta evento
          │ 2. Recarrega providers configurados
          │ 3. Atualiza lista de opções
          │ 4. Auto-seleciona se necessário
          │
          ↓
┌──────────────────────────────────────┐
│  GET /providers/configured           │
│  → Retorna apenas providers válidos  │
│  → Bedrock só aparece se configurado │
└──────────────────────────────────────┘
```

---

## 💾 5. Como os Dados São Salvos

### 5.1. Credenciais AWS (Segurança)

```typescript
// BACKEND: backend/src/controllers/providersController.ts

// 1. Resolução de Credenciais (Dois Modos)
let accessKey: string;
let secretKey: string;

if (config.secretKey) {
  // Modo Edição: Usar credenciais enviadas
  accessKey = config.accessKey!;
  secretKey = config.secretKey;
} else {
  // Modo Teste Rápido: Buscar credenciais salvas no banco
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true },
  });
  
  if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
    throw new Error('Nenhuma credencial AWS salva');
  }
  
  accessKey = encryptionService.decrypt(userSettings.awsAccessKey);
  secretKey = encryptionService.decrypt(userSettings.awsSecretKey);
}

// 2. Valida com AWS Bedrock
const bedrockProvider = new BedrockProvider(config.region);
const apiKey = `${accessKey}:${secretKey}`;
const isValid = await bedrockProvider.validateKey(apiKey);

if (!isValid) {
  throw new Error('Credenciais inválidas ou sem permissão no Bedrock');
}

// Obtém contagem de modelos
const modelsCount = await bedrockProvider.getModelsCount(apiKey);

// 3. Persistência (Safe-Save): Só salvar se sucesso E credenciais novas foram enviadas
if (config.secretKey) {
  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      awsAccessKey: encryptionService.encrypt(accessKey),    // ✅ Criptografado
      awsSecretKey: encryptionService.encrypt(secretKey),    // ✅ Criptografado
      awsRegion: config.region
    },
    create: {
      userId,
      awsAccessKey: encryptionService.encrypt(accessKey),
      awsSecretKey: encryptionService.encrypt(secretKey),
      awsRegion: config.region
    }
  });
}

// 4. Registra validação bem-sucedida
await prisma.providerCredentialValidation.upsert({
  where: { userId_provider: { userId, provider: 'bedrock' } },
  update: {
    status: 'valid',
    lastValidatedAt: new Date(),
    latencyMs: responseTime
  }
});
```

### 5.2. Modelos Habilitados

```typescript
// BACKEND: backend/src/controllers/userSettingsController.ts

// O método updateSettings é GENÉRICO e atualiza todos os campos enviados
const updateData = { ...req.body }; // Inclui awsEnabledModels e outros campos

// Aplica criptografia apenas nas chaves sensíveis
for (const key of encryptedKeys) {
  if (updateData[key]) {
    updateData[key] = encryptionService.encrypt(updateData[key]);
  }
}

// Atualiza TODOS os campos enviados (incluindo awsEnabledModels)
await prisma.userSettings.update({
  where: { userId },
  data: updateData
});
```

**Nota:** Não existe código específico para `awsEnabledModels`. Ele é salvo junto com outros campos através do método genérico `updateSettings`.

### 5.3. Recuperação de Dados

```typescript
// BACKEND: backend/src/routes/providers.ts (linha 52-99)

// 1. Busca configurações do usuário
const settings = await prisma.userSettings.findUnique({
  where: { userId }
});

// 2. Busca validação AWS
const awsValidation = await prisma.providerCredentialValidation.findUnique({
  where: { userId_provider: { userId, provider: 'bedrock' } }
});

// 3. Busca todos providers ativos
const allProviders = await prisma.aIProvider.findMany({
  where: { isActive: true },
  include: { models: { where: { isActive: true } } }
});

// 4. FILTRA providers baseado em configuração
const configuredProviders = allProviders.filter(provider => {
  // Providers padrão sempre disponíveis
  if (['openai', 'groq', 'together'].includes(provider.slug)) {
    return true;
  }
  
  // AWS Bedrock: só se validado E tem modelos habilitados
  if (provider.slug === 'bedrock') {
    if (awsValidation?.status === 'valid' && settings?.awsEnabledModels?.length) {
      // Filtra apenas modelos habilitados
      provider.models = provider.models.filter(m => 
        settings.awsEnabledModels.includes(m.apiModelId)
      );
      return provider.models.length > 0;
    }
    return false;
  }
  
  return true;
});
```

---

## 🎯 6. Formato Unificado

### 6.1. Ambos Usam o Mesmo Tipo Base

```typescript
// frontend/src/types/ai.ts

export interface AIModel {
  id: string;
  name: string;       // Ex: "Claude 3.5 Sonnet"
  apiModelId: string; // Ex: "anthropic.claude-3-5-sonnet-20240620-v1:0"
  contextWindow: number;
}

export interface AIProvider {
  id: string;
  name: string;       // Ex: "AWS Bedrock"
  slug: string;       // Ex: "bedrock"
  isActive: boolean;
  logoUrl?: string;
  models: AIModel[];
}
```

### 6.2. Diferença na Fonte

- **ModelTab**: Recebe `AIProvider[]` filtrado (apenas configurados)
- **AWSProviderPanel**: Recebe modelos enriquecidos com metadados AWS

```typescript
// AWSProviderPanel recebe modelos com mais informações
interface EnrichedModel extends AIModel {
  providerName: string;         // Ex: "Anthropic"
  costPer1kInput: number;       // Do banco
  costPer1kOutput: number;      // Do banco
  inputModalities: string[];    // Da AWS
  outputModalities: string[];   // Da AWS
  responseStreamingSupported: boolean;
  isInDatabase: boolean;        // Se tem no banco
}
```

---

## 🔄 7. Ciclo de Vida Completo

```
1. CONFIGURAÇÃO (AWSProviderPanel)
   ↓
   Usuário insere credenciais AWS
   ↓
   POST /providers/bedrock/validate
   ↓
   Backend valida com AWS Bedrock
   ↓
   Se válido E secretKey enviado: Salva em user_settings (criptografado)
   Se válido E secretKey NÃO enviado: Apenas valida (não salva)
   ↓
   GET /providers/bedrock/available-models
   ↓
   Backend busca modelos da conta AWS
   ↓
   Enriquece com dados do banco (custos, context window)
   ↓
   Usuário seleciona modelos
   ↓
   PUT /api/settings (awsEnabledModels + outros campos)
   ↓
   Backend salva e retorna sucesso
   ↓
   Frontend dispara evento 'aws-credentials-updated'

2. ATUALIZAÇÃO (ModelTab)
   ↓
   Escuta evento 'aws-credentials-updated'
   ↓
   GET /providers/configured
   ↓
   Backend filtra providers:
   - Bedrock só aparece se validado E tem modelos habilitados
   - Retorna apenas modelos em awsEnabledModels
   ↓
   ModelTab atualiza lista de opções
   ↓
   Usuário pode selecionar Bedrock no chat

3. USO (Chat)
   ↓
   Usuário seleciona provider "bedrock" e modelo
   ↓
   POST /chat/send
   ↓
   Backend usa credenciais descriptografadas
   ↓
   Chama AWS Bedrock com modelo selecionado
   ↓
   Retorna resposta ao usuário
```

---

## 📊 8. Diagrama de Relacionamento

```
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                            │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │ ai_providers │───→│  ai_models   │    │ user_settings │ │
│  │              │    │              │    │               │ │
│  │ - bedrock    │    │ - claude-3.5 │    │ - awsAccess   │ │
│  │ - openai     │    │ - gpt-4      │    │ - awsSecret   │ │
│  │ - groq       │    │ - llama-3    │    │ - awsEnabled  │ │
│  └──────────────┘    └──────────────┘    └───────────────┘ │
│                                                 ↓            │
│                           ┌─────────────────────────────┐   │
│                           │ provider_credential_        │   │
│                           │ validations                 │   │
│                           │ - status: 'valid'           │   │
│                           └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ROUTES                            │
│                                                              │
│  /providers/configured ──────────→ ModelTab                 │
│  (Filtrado, apenas habilitados)                             │
│                                                              │
│  /providers/bedrock/available-models ──→ AWSProviderPanel   │
│  (Dinâmico, todos da conta AWS)                             │
│                                                              │
│  /providers/bedrock/validate ────────→ AWSProviderPanel     │
│  (Valida e salva credenciais)                               │
│                                                              │
│  /api/settings ───────────────────────→ AWSProviderPanel    │
│  (Salva awsEnabledModels + outros campos)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                  │
│                                                              │
│  ┌─────────────────┐         ┌──────────────────────────┐  │
│  │   ModelTab      │←────────│  AWSProviderPanel        │  │
│  │                 │  evento │                          │  │
│  │ - Lê providers  │  'aws-  │ - Configura credenciais  │  │
│  │   configurados  │  creds  │ - Seleciona modelos      │  │
│  │ - Seleciona IA  │  -upd'  │ - Salva configuração     │  │
│  └─────────────────┘         └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 9. Resumo Executivo

### Origem dos Dados

1. **Providers e Modelos Base**: Vêm do banco de dados (`ai_providers` e `ai_models`)
2. **Credenciais AWS**: Salvas em `user_settings` (criptografadas)
3. **Modelos Habilitados**: Array `awsEnabledModels` em `user_settings`
4. **Status de Validação**: Tabela `provider_credential_validations`

### Formato dos Dados

- **ModelTab**: Usa `AIProvider[]` com apenas modelos habilitados
- **AWSProviderPanel**: Usa modelos enriquecidos com metadados AWS + banco
- **Ambos**: Compartilham o tipo base `AIProvider` e `AIModel`

### Como São Salvos

1. **Credenciais**: Criptografadas com `encryptionService` antes de salvar
2. **Modelos Habilitados**: Array de strings (`apiModelId`) em `awsEnabledModels`
3. **Validação**: Status, timestamp e latência em tabela separada

### Relação Entre Componentes

- **AWSProviderPanel**: Configuração (escrita)
- **ModelTab**: Seleção (leitura)
- **Comunicação**: Evento customizado `'aws-credentials-updated'`
- **Sincronização**: ModelTab recarrega quando AWSProviderPanel salva

### Fluxo de Dados

```
Configuração → Validação → Salvamento → Evento → Atualização → Uso
(AWS Panel)   (Backend)   (Database)   (Event)  (ModelTab)   (Chat)
```

---

## 📝 10. Observações Importantes

1. **Segurança**: Credenciais AWS são sempre criptografadas no banco
2. **Validação Dupla**: Dois modos - Edição (valida e salva) e Teste Rápido (apenas valida)
3. **Filtragem**: ModelTab só mostra Bedrock se validado E tem modelos habilitados
4. **Dinamismo**: AWSProviderPanel busca modelos direto da conta AWS do usuário
5. **Enriquecimento**: Modelos AWS são enriquecidos com dados do banco (custos, context window)
6. **Sincronização**: Evento customizado (disparado pelo frontend) mantém ModelTab atualizado
7. **Fallback**: Se falhar buscar modelos dinâmicos, usa modelos estáticos do banco
8. **Método Genérico**: `updateSettings` atualiza todos os campos enviados, não há código específico para `awsEnabledModels`

---

**Documento gerado em**: 2026-01-16  
**Versão**: 1.0  
**Autor**: Análise de Código Automatizada
