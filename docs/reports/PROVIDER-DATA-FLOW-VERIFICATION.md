# Verificação de Erros no Código - Evidências Reais

## 📋 Verificação Completa com Código Real

Este documento apresenta evidências diretas do código para confirmar os erros identificados no [`PROVIDER-DATA-FLOW-ANALYSIS.md`](docs/PROVIDER-DATA-FLOW-ANALYSIS.md).

---

## ✅ ERRO 1: Evento Disparado pelo Frontend, NÃO pelo Backend

### 🔍 Verificação no Backend

**Busca realizada:**
```bash
grep -r "window.dispatchEvent.*aws-credentials-updated" backend/src/
```

**Resultado:** ❌ **0 resultados encontrados**

O backend **NÃO dispara** o evento `'aws-credentials-updated'`.

### 🔍 Verificação no Frontend

**Busca realizada:**
```bash
grep -r "window.dispatchEvent.*aws-credentials-updated" frontend/src/
```

**Resultado:** ✅ **1 resultado encontrado**

**Arquivo:** [`frontend/src/features/settings/hooks/useAWSConfig.ts`](frontend/src/features/settings/hooks/useAWSConfig.ts:201-202)

```typescript
// Linha 201-202
// Disparar evento customizado para atualizar lista de providers no ControlPanel
window.dispatchEvent(new CustomEvent('aws-credentials-updated'));
```

**Contexto completo:**
```typescript
// Linha 183-208
handleSave = useCallback(async () => {
  if (validationStatus !== 'valid') {
    setError('Valide as credenciais antes de salvar');
    return;
  }
  setIsSaving(true);
  setError(null);
  setSuccess(null);
  try {
    await userSettingsService.updateSettings({
      awsAccessKey: formState.accessKey,
      awsSecretKey: formState.secretKey,
      awsRegion: formState.region,
      awsEnabledModels: selectedModels
    });
    setSuccess('Configuração AWS salva com sucesso!');
    setIsDirty(false);
    
    // Disparar evento customizado para atualizar lista de providers no ControlPanel
    window.dispatchEvent(new CustomEvent('aws-credentials-updated'));
  } catch (err: any) {
    setError(err.response?.data?.message || 'Erro ao salvar configuração');
  } finally {
    setIsSaving(false);
  }
}, [formState, selectedModels, validationStatus]);
```

### ✅ Conclusão

**CONFIRMADO:** O evento é disparado pelo **frontend** após salvar com sucesso, não pelo backend.

---

## ✅ ERRO 2: Não Existe Código Específico para `awsEnabledModels`

### 🔍 Verificação no Backend

**Busca realizada:**
```bash
grep -r "awsEnabledModels.*update\|update.*awsEnabledModels" backend/src/controllers/
```

**Resultado:** ❌ **0 resultados encontrados**

Não existe código específico que atualiza apenas `awsEnabledModels`.

### 🔍 Código Real do Controller

**Arquivo:** [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts:83-139)

```typescript
// Linha 83-139
updateSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const updateData = { ...req.body }; // ← Recebe TODOS os campos do body

    // --- LÓGICA DO COFRE (UPDATE) ---
    for (const key of encryptedKeys) {
      const value = updateData[key];
      
      // Se o campo foi enviado no payload
      if (value !== undefined) {
        // Ignorar strings vazias, null ou placeholders (proteção contra corrupção)
        if (!value || value === '' || value.trim() === '') {
          delete updateData[key]; // Não atualizar este campo
          continue;
        }
        
        // Ignorar placeholders comuns (ex: "********", "AKIA...EKEY")
        if (value.match(/^\*+$/) || value.match(/^.{4}\.\.\..{4}$/)) {
          delete updateData[key]; // Não atualizar este campo
          continue;
        }
        
        // 1. Pegue a chave em texto puro enviada pelo frontend
        const plainTextKey = value;
        // 2. Criptografe-a
        updateData[key] = encryptionService.encrypt(plainTextKey);
      }
    }
    // --- FIM DA LÓGICA ---

    await findOrCreateSettings(req.userId);

    const updatedSettings = await prisma.userSettings.update({
      where: { userId: req.userId },
      data: updateData, // ← Atualiza TODOS os campos enviados
    });

    // (Repetir a lógica do GET para retornar os placeholders)
    const safeSettings = { ...updatedSettings };
    for (const key of encryptedKeys) {
      const encryptedValue = updatedSettings[key as keyof typeof updatedSettings] as string;
      if (encryptedValue) {
        const decryptedKey = encryptionService.decrypt(encryptedValue);
        (safeSettings as any)[key] = encryptionService.getPlaceholder(decryptedKey);
      }
    }

    return res.json(jsend.success(safeSettings));

  } catch (error) {
    return next(error);
  }
},
```

### ✅ Conclusão

**CONFIRMADO:** O método `updateSettings` é **genérico** e atualiza todos os campos enviados no `req.body`, incluindo `awsEnabledModels`. Não há código específico para esse campo.

---

## ✅ ERRO 3: Endpoint Correto é `/api/settings`, NÃO `/api/user/settings`

### 🔍 Verificação das Rotas

**Arquivo:** [`backend/src/server.ts`](backend/src/server.ts:101)

```typescript
// Linha 101
app.use('/api/settings', apiLimiter, userSettingsRoutes);
```

**Arquivo:** [`backend/src/routes/userSettingsRoutes.ts`](backend/src/routes/userSettingsRoutes.ts:16-17)

```typescript
// Linha 16-17
router.get('/', authMiddleware, userSettingsController.getSettings);
router.put('/', authMiddleware, validateRequest(updateSettingsSchema), userSettingsController.updateSettings);
```

### ✅ Conclusão

**CONFIRMADO:** O endpoint correto é:
- ✅ `GET /api/settings` (não `/api/user/settings`)
- ✅ `PUT /api/settings` (não `/api/user/settings`)

O documento menciona `/api/user/settings` em alguns lugares, o que está **incorreto**.

---

## ✅ ERRO 4: Validação AWS Tem Dois Modos

### 🔍 Código Real da Validação

**Arquivo:** [`backend/src/controllers/providersController.ts`](backend/src/controllers/providersController.ts:36-119)

```typescript
// Linha 36-59: Resolução de Credenciais
let accessKey: string;
let secretKey: string;

// Resolução de Credenciais
if (config.secretKey) {
  // Caso A: Edição - Usar credenciais enviadas
  accessKey = config.accessKey!;
  secretKey = config.secretKey;
} else {
  // Caso B: Teste Rápido - Buscar credenciais salvas no banco
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true },
  });

  if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
    return res.status(400).json(jsend.fail({
      credentials: 'Nenhuma credencial AWS salva. Forneça accessKey e secretKey.',
    }));
  }

  accessKey = encryptionService.decrypt(userSettings.awsAccessKey);
  secretKey = encryptionService.decrypt(userSettings.awsSecretKey);
}

// Linha 103-119: Persistência (Safe-Save)
// Persistência (Safe-Save): Só salvar se sucesso E credenciais novas foram enviadas
if (config.secretKey) {
  await prisma.userSettings.upsert({
    where: { userId },
    update: {
      awsAccessKey: encryptionService.encrypt(accessKey),
      awsSecretKey: encryptionService.encrypt(secretKey),
      awsRegion: config.region,
    },
    create: {
      userId,
      awsAccessKey: encryptionService.encrypt(accessKey),
      awsSecretKey: encryptionService.encrypt(secretKey),
      awsRegion: config.region,
    },
  });
}
```

### ✅ Conclusão

**CONFIRMADO:** A validação tem **dois modos distintos**:

1. **Modo Edição** (`config.secretKey` presente):
   - Usa credenciais enviadas no payload
   - Valida com AWS
   - **Salva** se válido

2. **Modo Teste Rápido** (`config.secretKey` ausente):
   - Busca credenciais já salvas no banco
   - Descriptografa
   - Valida com AWS
   - **NÃO salva** (apenas testa)

O documento simplifica demais, não deixando claro essa distinção importante.

---

## ✅ ERRO 5: Método `getModelsCount` Já Existe

### 🔍 Código Real

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:229-239)

```typescript
// Linha 229-239
// Novo método para obter contagem de modelos (usado na validação)
async getModelsCount(apiKey: string): Promise<number> {
  const [accessKeyId, secretAccessKey] = apiKey.split(':');
  const client = new BedrockClient({
    region: this.region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const response = await client.send(new ListFoundationModelsCommand({}));
  return response.modelSummaries?.length || 0;
}
```

### 🔍 Uso no Controller

**Arquivo:** [`backend/src/controllers/providersController.ts`](backend/src/controllers/providersController.ts:66-79)

```typescript
// Linha 66-79
try {
  const bedrockProvider = new BedrockProvider(config.region);
  const apiKey = `${accessKey}:${secretKey}`;

  // Simular chamada para validar (usar método existente ou adicionar)
  const isValid = await bedrockProvider.validateKey(apiKey);
  if (!isValid) {
    throw new Error('Credenciais inválidas ou sem permissão no Bedrock');
  }

  // Para obter contagem de modelos, podemos adicionar um método ou usar o SDK diretamente
  // Assumindo que adicionamos um método getModelsCount no BedrockProvider
  modelsCount = await bedrockProvider.getModelsCount(apiKey);
  latencyMs = Date.now() - startTime;
}
```

### ✅ Conclusão

**CONFIRMADO:** O método `getModelsCount` **já existe** no código. O comentário "Assumindo que adicionamos" está **desatualizado**.

---

## ✅ ERRO 6: Listener do Evento no ModelTab

### 🔍 Código Real

**Arquivo:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:79-89)

```typescript
// Linha 79-89
// 2. Listener para recarregar quando credenciais AWS forem atualizadas
const handleAWSUpdate = () => {
  console.log('🔄 Credenciais AWS atualizadas, recarregando providers...');
  loadData();
};

window.addEventListener('aws-credentials-updated', handleAWSUpdate);

return () => {
  window.removeEventListener('aws-credentials-updated', handleAWSUpdate);
};
```

### ✅ Conclusão

**CONFIRMADO:** O [`ModelTab`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:85) escuta o evento `'aws-credentials-updated'` e recarrega os providers quando o evento é disparado.

---

## 📊 Resumo das Verificações

| Erro | Status | Evidência |
|------|--------|-----------|
| 1. Evento disparado pelo frontend | ✅ CONFIRMADO | [`useAWSConfig.ts:202`](frontend/src/features/settings/hooks/useAWSConfig.ts:202) |
| 2. Não há código específico para `awsEnabledModels` | ✅ CONFIRMADO | [`userSettingsController.ts:120`](backend/src/controllers/userSettingsController.ts:120) |
| 3. Endpoint é `/api/settings`, não `/api/user/settings` | ✅ CONFIRMADO | [`server.ts:101`](backend/src/server.ts:101) |
| 4. Validação tem dois modos | ✅ CONFIRMADO | [`providersController.ts:40-119`](backend/src/controllers/providersController.ts:40-119) |
| 5. Método `getModelsCount` já existe | ✅ CONFIRMADO | [`bedrock.ts:230-239`](backend/src/services/ai/providers/bedrock.ts:230-239) |
| 6. ModelTab escuta o evento | ✅ CONFIRMADO | [`ModelTab.tsx:85`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx:85) |

---

## 🔄 Fluxo Real Completo (Corrigido)

```
1. CONFIGURAÇÃO (AWSProviderPanel)
   ↓
   Usuário insere credenciais AWS
   ↓
   POST /api/providers/bedrock/validate
   ↓
   Backend valida com AWS Bedrock
   ↓
   Se válido E secretKey foi enviado: Salva em user_settings (criptografado)
   Se válido E secretKey NÃO foi enviado: Apenas valida (não salva)
   ↓
   GET /api/providers/bedrock/available-models
   ↓
   Backend busca modelos da conta AWS
   ↓
   Enriquece com dados do banco (custos, context window)
   ↓
   Usuário seleciona modelos
   ↓
   PUT /api/settings (awsEnabledModels + outros campos)
   ↓
   Backend salva (método genérico updateSettings)
   ↓
   Frontend recebe sucesso
   ↓
   Frontend dispara evento 'aws-credentials-updated'

2. ATUALIZAÇÃO (ModelTab)
   ↓
   Escuta evento 'aws-credentials-updated'
   ↓
   GET /api/providers/configured
   ↓
   Backend filtra providers:
   - Bedrock só aparece se validado E tem modelos habilitados
   - Retorna apenas modelos em awsEnabledModels
   ↓
   ModelTab atualiza lista de opções
   ↓
   Usuário pode selecionar Bedrock no chat
```

---

## 📝 Observações Finais

### Todos os Erros Foram Confirmados

Todos os 6 erros identificados no documento [`PROVIDER-DATA-FLOW-ANALYSIS-ERRORS.md`](docs/PROVIDER-DATA-FLOW-ANALYSIS-ERRORS.md) foram **verificados e confirmados** com evidências diretas do código.

### Arquivos Verificados

- ✅ [`backend/src/server.ts`](backend/src/server.ts)
- ✅ [`backend/src/routes/userSettingsRoutes.ts`](backend/src/routes/userSettingsRoutes.ts)
- ✅ [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts)
- ✅ [`backend/src/controllers/providersController.ts`](backend/src/controllers/providersController.ts)
- ✅ [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts)
- ✅ [`frontend/src/features/settings/hooks/useAWSConfig.ts`](frontend/src/features/settings/hooks/useAWSConfig.ts)
- ✅ [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx`](frontend/src/features/chat/components/ControlPanel/ModelTab.tsx)

### Métodos de Verificação

1. **Busca por padrões** (`grep`, `search_files`)
2. **Leitura direta do código**
3. **Análise de fluxo de execução**
4. **Verificação de rotas e endpoints**

---

**Documento gerado em**: 2026-01-16  
**Versão**: 1.0  
**Autor**: Análise de Código Automatizada com Verificação Completa
