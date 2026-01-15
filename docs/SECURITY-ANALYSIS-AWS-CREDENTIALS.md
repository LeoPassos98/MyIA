# Análise de Segurança: Vulnerabilidade de Corrupção de Credenciais AWS

**Data:** 2026-01-15  
**Severidade:** 🔴 **CRÍTICA**  
**Status:** ⚠️ **VULNERABILIDADE CONFIRMADA - REQUER CORREÇÃO IMEDIATA**

---

## 1. Resumo Executivo

Foi identificada uma vulnerabilidade crítica de segurança e integridade de dados no fluxo de salvamento de credenciais AWS. A vulnerabilidade permite que credenciais AWS válidas e criptografadas sejam permanentemente corrompidas no banco de dados quando o usuário salva configurações sem modificar o campo de senha.

**Impacto:** Perda permanente de credenciais AWS do usuário, impossibilitando o uso do serviço Bedrock até que novas credenciais sejam configuradas.

---

## 2. Análise Técnica Detalhada

### 2.1. Fluxo de Dados Identificado

#### **Passo 1: Carregamento Inicial (GET /api/settings)**

**Arquivo:** [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts:55-81)

```typescript
// Linhas 67-73
for (const key of encryptedKeys) {
  const encryptedValue = settings[key as keyof typeof settings] as string;
  if (encryptedValue) {
    const decryptedKey = encryptionService.decrypt(encryptedValue);
    (safeSettings as any)[key] = encryptionService.getPlaceholder(decryptedKey);
  }
}
```

**Comportamento:**
- Backend descriptografa `awsSecretKey` armazenada (ex: `"U2FsdGVkX1...abc123"`)
- Gera placeholder usando [`encryptionService.getPlaceholder()`](backend/src/services/encryptionService.ts:55-64)
- Retorna ao frontend: `"wJal...EKEY"` (primeiros 4 + últimos 4 caracteres)

#### **Passo 2: Renderização no Frontend**

**Arquivo:** [`frontend/src/features/settings/hooks/useAWSConfig.ts`](frontend/src/features/settings/hooks/useAWSConfig.ts:62-85)

```typescript
// Linhas 71-75
setFormState({
  accessKey: settings.awsAccessKey || '',
  secretKey: '', // ⚠️ SEMPRE VAZIO, NUNCA RECEBE O PLACEHOLDER
  region: settings.awsRegion || 'us-east-1'
});
```

**Arquivo:** [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx:115-124)

```typescript
// Linhas 115-124
<TextField
  fullWidth
  type="password"
  label="Secret Access Key"
  placeholder={formState.secretKey ? '********' : 'Secret Access Key - Ex: ...'}
  value={formState.secretKey}
  onChange={e => handleFieldChange('secretKey', e.target.value.trim())}
/>
```

**Comportamento:**
- `formState.secretKey` é inicializado como string vazia (`''`)
- Campo de senha mostra placeholder `"********"` quando vazio
- **PROBLEMA:** Usuário vê `"********"` mas o valor real é `""`

#### **Passo 3: Salvamento sem Modificação**

**Cenário Crítico:**
1. Usuário carrega a página
2. Vê o campo de senha com placeholder `"********"`
3. Modifica apenas a região ou modelos habilitados
4. Clica em "Testar e Salvar" **SEM** modificar o campo de senha

**Arquivo:** [`frontend/src/features/settings/hooks/useAWSConfig.ts`](frontend/src/features/settings/hooks/useAWSConfig.ts:149-171)

```typescript
// Linhas 158-163
await userSettingsService.updateSettings({
  awsAccessKey: formState.accessKey,
  awsSecretKey: formState.secretKey, // ⚠️ ENVIA STRING VAZIA ""
  awsRegion: formState.region,
  awsEnabledModels: selectedModels
});
```

**Payload enviado ao backend:**
```json
{
  "awsAccessKey": "AKIAIOSFODNN7EXAMPLE",
  "awsSecretKey": "",  // ⚠️ STRING VAZIA
  "awsRegion": "us-east-1",
  "awsEnabledModels": ["anthropic.claude-v2"]
}
```

#### **Passo 4: Processamento no Backend**

**Arquivo:** [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts:83-124)

```typescript
// Linhas 92-99
for (const key of encryptedKeys) {
  if (updateData[key]) {  // ⚠️ "" é falsy, NÃO ENTRA AQUI
    const plainTextKey = updateData[key];
    updateData[key] = encryptionService.encrypt(plainTextKey);
  }
}
```

**Comportamento:**
- `updateData.awsSecretKey` contém `""`
- Condição `if (updateData[key])` avalia `if ("")` → **false**
- **NÃO criptografa** a string vazia
- Passa string vazia diretamente para o Prisma

```typescript
// Linhas 104-107
const updatedSettings = await prisma.userSettings.update({
  where: { userId: req.userId },
  data: updateData, // ⚠️ Contém awsSecretKey: ""
});
```

**Resultado no Banco de Dados:**
```sql
UPDATE UserSettings 
SET awsSecretKey = ''  -- ⚠️ SOBRESCREVE VALOR CRIPTOGRAFADO VÁLIDO
WHERE userId = '...';
```

---

## 3. Confirmação da Vulnerabilidade

### 3.1. Evidências de Código

✅ **Frontend não diferencia entre "não modificado" e "vazio"**
- Arquivo: [`useAWSConfig.ts:73`](frontend/src/features/settings/hooks/useAWSConfig.ts:73)
- `secretKey: ''` sempre inicializado como vazio

✅ **Backend não valida se o valor é placeholder ou vazio**
- Arquivo: [`userSettingsController.ts:92-99`](backend/src/controllers/userSettingsController.ts:92-99)
- Apenas verifica `if (updateData[key])` (truthy check)
- String vazia passa direto para o banco

✅ **Não há flag "unchanged" ou "keep existing"**
- Nenhum mecanismo para indicar "não modificar este campo"
- Frontend sempre envia todos os campos, mesmo não modificados

### 3.2. Cenários de Reprodução

#### **Cenário 1: Usuário Existente Modifica Região**
1. Usuário tem credenciais AWS válidas salvas
2. Abre painel de configurações AWS
3. Altera região de `us-east-1` para `us-west-2`
4. Clica "Testar e Salvar"
5. **Resultado:** `awsSecretKey` sobrescrita com `""`

#### **Cenário 2: Usuário Habilita/Desabilita Modelos**
1. Usuário tem credenciais AWS válidas salvas
2. Abre painel de configurações AWS
3. Marca/desmarca modelos Bedrock
4. Clica "Salvar"
5. **Resultado:** `awsSecretKey` sobrescrita com `""`

#### **Cenário 3: Validação de Credenciais Existentes**
1. Usuário tem credenciais AWS válidas salvas
2. Clica "Testar e Salvar" sem modificar nada
3. **Resultado:** `awsSecretKey` sobrescrita com `""`

---

## 4. Impacto e Riscos

### 4.1. Severidade: CRÍTICA

| Aspecto | Avaliação |
|---------|-----------|
| **Confidencialidade** | ⚠️ Média - Não expõe credenciais, mas as perde |
| **Integridade** | 🔴 Crítica - Corrompe dados permanentemente |
| **Disponibilidade** | 🔴 Crítica - Impede uso do serviço Bedrock |
| **Facilidade de Exploração** | 🔴 Trivial - Ocorre em uso normal |
| **Reversibilidade** | 🔴 Impossível - Credencial original perdida |

### 4.2. Impacto no Usuário

- ❌ **Perda permanente** de credenciais AWS configuradas
- ❌ **Impossibilidade de usar** AWS Bedrock até reconfigurar
- ❌ **Frustração do usuário** ao descobrir que credenciais foram perdidas
- ❌ **Necessidade de gerar novas credenciais** na AWS Console
- ❌ **Possível perda de acesso** se usuário não tiver permissões IAM para criar novas keys

### 4.3. Impacto no Sistema

- ⚠️ **Chamadas de API falharão** silenciosamente
- ⚠️ **Logs de erro** indicando credenciais inválidas
- ⚠️ **Suporte técnico** receberá reclamações de "credenciais não funcionam"
- ⚠️ **Reputação do sistema** comprometida

---

## 5. Validações Ausentes

### 5.1. No Frontend

❌ **Falta:** Mecanismo para detectar campos não modificados
```typescript
// Deveria existir:
const [originalSecretKey, setOriginalSecretKey] = useState<string>('');
const isSecretKeyModified = formState.secretKey !== originalSecretKey;
```

❌ **Falta:** Omitir campos não modificados do payload
```typescript
// Deveria fazer:
const payload: any = {
  awsAccessKey: formState.accessKey,
  awsRegion: formState.region,
  awsEnabledModels: selectedModels
};
if (isSecretKeyModified && formState.secretKey) {
  payload.awsSecretKey = formState.secretKey;
}
```

### 5.2. No Backend

❌ **Falta:** Validação de placeholder/string vazia
```typescript
// Deveria validar:
for (const key of encryptedKeys) {
  if (updateData[key] !== undefined) {
    const value = updateData[key];
    
    // Ignorar strings vazias ou placeholders
    if (!value || value === '' || value.match(/^\*+$/)) {
      delete updateData[key]; // Não atualizar este campo
      continue;
    }
    
    updateData[key] = encryptionService.encrypt(value);
  }
}
```

❌ **Falta:** Uso de `undefined` vs `null` vs `""`
- `undefined`: Campo não enviado (não atualizar)
- `null`: Limpar campo intencionalmente
- `""`: Ambíguo - deveria ser tratado como "não modificar"

---

## 6. Soluções Propostas

### 6.1. Solução Imediata (Backend - Defensiva)

**Prioridade:** 🔴 URGENTE

**Implementação:** Adicionar validação no backend para ignorar strings vazias em campos criptografados

**Arquivo:** [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts:92-99)

```typescript
// ANTES:
for (const key of encryptedKeys) {
  if (updateData[key]) {
    const plainTextKey = updateData[key];
    updateData[key] = encryptionService.encrypt(plainTextKey);
  }
}

// DEPOIS:
for (const key of encryptedKeys) {
  const value = updateData[key];
  
  // Se o campo foi enviado
  if (value !== undefined) {
    // Se for vazio, null, ou placeholder, remover do update
    if (!value || value === '' || value.match(/^\*+$/) || value.match(/^.{4}\.\.\..{4}$/)) {
      delete updateData[key];
      continue;
    }
    
    // Criptografar apenas valores válidos
    updateData[key] = encryptionService.encrypt(value);
  }
}
```

**Vantagens:**
- ✅ Proteção imediata contra corrupção
- ✅ Não requer mudanças no frontend
- ✅ Backward compatible
- ✅ Implementação rápida (< 30 minutos)

**Desvantagens:**
- ⚠️ Não resolve o problema de UX (usuário não pode limpar campo intencionalmente)
- ⚠️ Solução defensiva, não ideal

### 6.2. Solução Ideal (Frontend + Backend)

**Prioridade:** 🟡 MÉDIO PRAZO

**Implementação:** Refatorar fluxo para diferenciar campos modificados

#### **Frontend:**

```typescript
// useAWSConfig.ts
const [originalState, setOriginalState] = useState<FormState>({
  accessKey: '',
  secretKey: '',
  region: 'us-east-1'
});

const [modifiedFields, setModifiedFields] = useState<Set<keyof FormState>>(new Set());

const handleFieldChange = (field: keyof FormState, value: string) => {
  setFormState(prev => ({ ...prev, [field]: value }));
  setModifiedFields(prev => new Set(prev).add(field));
  setIsDirty(true);
};

const handleSave = async () => {
  const payload: any = {
    awsRegion: formState.region,
    awsEnabledModels: selectedModels
  };
  
  // Apenas incluir campos modificados
  if (modifiedFields.has('accessKey')) {
    payload.awsAccessKey = formState.accessKey;
  }
  if (modifiedFields.has('secretKey')) {
    payload.awsSecretKey = formState.secretKey;
  }
  
  await userSettingsService.updateSettings(payload);
};
```

#### **Backend:**

```typescript
// userSettingsController.ts
for (const key of encryptedKeys) {
  // Apenas processar se o campo foi explicitamente enviado
  if (key in updateData) {
    const value = updateData[key];
    
    if (value === null) {
      // null = limpar campo intencionalmente
      updateData[key] = null;
    } else if (!value || value === '') {
      // Vazio = erro, não deveria acontecer
      throw new AppError(`Campo ${key} não pode ser vazio`, 400);
    } else {
      // Criptografar valor válido
      updateData[key] = encryptionService.encrypt(value);
    }
  }
  // Se não foi enviado, não fazer nada (manter valor existente)
}
```

**Vantagens:**
- ✅ Solução correta e semântica
- ✅ Permite limpar campos intencionalmente (com `null`)
- ✅ Melhor UX (apenas campos modificados são enviados)
- ✅ Reduz tráfego de rede

**Desvantagens:**
- ⚠️ Requer refatoração em frontend e backend
- ⚠️ Tempo de implementação maior (2-4 horas)
- ⚠️ Requer testes extensivos

### 6.3. Solução Alternativa (Placeholder Especial)

**Prioridade:** 🟢 OPCIONAL

**Implementação:** Usar placeholder especial que backend reconhece

```typescript
// Frontend - useAWSConfig.ts
const UNCHANGED_PLACEHOLDER = '__UNCHANGED__';

setFormState({
  accessKey: settings.awsAccessKey || '',
  secretKey: settings.awsSecretKey ? UNCHANGED_PLACEHOLDER : '',
  region: settings.awsRegion || 'us-east-1'
});

const handleSave = async () => {
  const payload = {
    awsAccessKey: formState.accessKey,
    awsSecretKey: formState.secretKey === UNCHANGED_PLACEHOLDER ? undefined : formState.secretKey,
    awsRegion: formState.region,
    awsEnabledModels: selectedModels
  };
  await userSettingsService.updateSettings(payload);
};
```

```typescript
// Backend - userSettingsController.ts
for (const key of encryptedKeys) {
  const value = updateData[key];
  
  if (value === undefined) {
    // Não enviado, não atualizar
    delete updateData[key];
  } else if (value === '__UNCHANGED__') {
    // Placeholder especial, não atualizar
    delete updateData[key];
  } else if (!value || value === '') {
    // Vazio, não atualizar (proteção)
    delete updateData[key];
  } else {
    // Criptografar
    updateData[key] = encryptionService.encrypt(value);
  }
}
```

---

## 7. Recomendações

### 7.1. Ação Imediata (Hoje)

1. ✅ **Implementar Solução 6.1 (Backend Defensiva)**
   - Tempo estimado: 30 minutos
   - Risco: Baixo
   - Impacto: Previne corrupção imediatamente

2. ✅ **Adicionar testes automatizados**
   - Testar salvamento sem modificar `secretKey`
   - Testar salvamento com `secretKey` vazia
   - Testar salvamento com placeholder

3. ✅ **Adicionar logging**
   - Registrar quando campos criptografados são ignorados
   - Alertar se string vazia for detectada

### 7.2. Curto Prazo (Esta Semana)

1. ⚠️ **Implementar Solução 6.2 (Ideal)**
   - Refatorar frontend para rastrear campos modificados
   - Atualizar backend para validação estrita
   - Testes E2E completos

2. ⚠️ **Auditoria de outros campos**
   - Verificar se outros campos criptografados têm o mesmo problema
   - Revisar `openaiApiKey`, `claudeApiKey`, etc.

3. ⚠️ **Documentação**
   - Atualizar docs/SECURITY-STANDARDS.md
   - Adicionar ADR sobre gestão de campos sensíveis

### 7.3. Médio Prazo (Este Mês)

1. 📋 **Implementar sistema de versionamento de credenciais**
   - Manter histórico de credenciais (criptografadas)
   - Permitir rollback em caso de corrupção

2. 📋 **Adicionar validação de formato**
   - Validar formato de AWS Secret Key antes de salvar
   - Regex: `/^[0-9a-zA-Z/+]{40}$/`

3. 📋 **Melhorar UX**
   - Mostrar indicador visual de "campo não modificado"
   - Adicionar botão "Limpar credenciais" explícito

---

## 8. Conclusão

### 8.1. Resposta à Questão Original

> "Analyze whether this vulnerability exists, confirm the data flow from frontend placeholder rendering through the save operation to backend persistence, verify if backend validation prevents placeholder strings from overwriting real encrypted values, and provide a comprehensive assessment of whether this poses an actual risk requiring immediate remediation or if existing safeguards already prevent this scenario."

**Resposta:**

✅ **A vulnerabilidade EXISTE e está CONFIRMADA**

✅ **O fluxo de dados foi mapeado completamente:**
1. Backend retorna placeholder `"wJal...EKEY"`
2. Frontend inicializa `secretKey` como `""` (vazio)
3. Usuário vê `"********"` mas valor real é `""`
4. Frontend envia `awsSecretKey: ""` ao backend
5. Backend não valida, passa `""` para o banco
6. Credencial criptografada válida é sobrescrita com `""`

❌ **NÃO existem salvaguardas no backend:**
- Backend apenas verifica `if (updateData[key])` (truthy check)
- String vazia (`""`) é falsy, então não é criptografada
- Mas é passada para o Prisma, que sobrescreve o valor existente

🔴 **Risco CRÍTICO que requer remediação IMEDIATA:**
- Corrupção permanente de dados
- Perda de credenciais do usuário
- Ocorre em uso normal (não requer ataque)
- Facilmente reproduzível
- Sem mecanismo de recuperação

### 8.2. Priorização

| Ação | Prioridade | Prazo | Esforço |
|------|-----------|-------|---------|
| Implementar validação backend (6.1) | 🔴 CRÍTICA | Hoje | 30min |
| Adicionar testes automatizados | 🔴 CRÍTICA | Hoje | 1h |
| Refatorar frontend (6.2) | 🟡 ALTA | Esta semana | 3h |
| Auditoria outros campos | 🟡 ALTA | Esta semana | 2h |
| Sistema de versionamento | 🟢 MÉDIA | Este mês | 8h |

---

## 9. Referências

- [`frontend/src/features/settings/hooks/useAWSConfig.ts`](frontend/src/features/settings/hooks/useAWSConfig.ts)
- [`frontend/src/features/settings/components/providers/AWSProviderPanel.tsx`](frontend/src/features/settings/components/providers/AWSProviderPanel.tsx)
- [`backend/src/controllers/userSettingsController.ts`](backend/src/controllers/userSettingsController.ts)
- [`backend/src/services/encryptionService.ts`](backend/src/services/encryptionService.ts)
- [`frontend/src/services/userSettingsService.ts`](frontend/src/services/userSettingsService.ts)

---

**Documento gerado em:** 2026-01-15T15:03:02.490Z  
**Autor:** Análise de Segurança Automatizada  
**Versão:** 1.0
