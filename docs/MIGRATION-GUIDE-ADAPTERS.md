# Migration Guide: Adapting Code to New Infrastructure

## 📋 Overview

This document lists all code points that need to be adapted to use the new Model Adapters + Registry infrastructure.

---

## 🎯 Files That Need Changes

### 1. **backend/src/services/ai/providers/bedrock.ts**

**Current State:** Has inline format logic (functions like `createAnthropicPayload`, `createCoherePayload`, etc.)

**Changes Needed:**

#### A. Remove Inline Functions (Lines 29-256)
Remove these functions (they're now in adapters):
- `enum ModelProvider` (lines 29-37)
- `function detectModelProvider()` (lines 42-64)
- `function createAnthropicPayload()` (lines 86-106)
- `function createCoherePayload()` (lines 111-151)
- `function createAmazonPayload()` (lines 156-178)
- `function createPayloadForProvider()` (lines 183-206)
- `function* processChunkForProvider()` (lines 211-256)

#### B. Add Imports (Top of file)
```typescript
import { AdapterFactory } from '../adapters';
import { ModelRegistry } from '../registry';
import type { Message, UniversalOptions } from '../adapters';
```

#### C. Update `streamChat` Method (Lines 327-453)

**Before (lines 346-351):**
```typescript
// Detecta o provedor do modelo
const provider = detectModelProvider(options.modelId);
console.log(`🔍 [Bedrock] Modelo: ${options.modelId}, Provedor detectado: ${provider}`);

// Cria payload específico para o provedor
const payload = createPayloadForProvider(provider, messages, options);
```

**After:**
```typescript
// Get adapter for this model
const adapter = AdapterFactory.getAdapterForModel(options.modelId);
console.log(`🔍 [Bedrock] Using adapter: ${adapter.displayName} for model: ${options.modelId}`);

// Convert to universal format
const universalMessages: Message[] = messages.map(m => ({
  role: m.role as 'system' | 'user' | 'assistant',
  content: m.content
}));

const universalOptions: UniversalOptions = {
  temperature: options.temperature,
  maxTokens: options.maxTokens,
  topK: options.topK,
  topP: options.topP,
};

// Format request using adapter
const { body, contentType, accept } = adapter.formatRequest(
  universalMessages,
  universalOptions
);
```

**Before (lines 358-366):**
```typescript
const command = new InvokeModelWithResponseStreamCommand({
  modelId,
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify(payload),
});
```

**After:**
```typescript
const command = new InvokeModelWithResponseStreamCommand({
  modelId,
  contentType: contentType || 'application/json',
  accept: accept || 'application/json',
  body: JSON.stringify(body),
});
```

**Before (lines 380-395):**
```typescript
// Processa chunk baseado no provedor
const chunkResults = processChunkForProvider(provider, chunk);
for (const result of chunkResults) {
  yield result;
}

// Verifica se é o fim do stream (específico por provedor)
const isFinished =
  (provider === ModelProvider.ANTHROPIC && chunk.type === 'message_stop') ||
  (provider === ModelProvider.COHERE && chunk.is_finished) ||
  (provider === ModelProvider.AMAZON && chunk.completionReason);

if (isFinished) {
  break;
}
```

**After:**
```typescript
// Parse chunk using adapter
const parsed = adapter.parseChunk(chunk);

if (parsed.type === 'chunk' && parsed.content) {
  yield { type: 'chunk', content: parsed.content };
} else if (parsed.type === 'done') {
  break;
} else if (parsed.type === 'error') {
  yield { type: 'error', error: parsed.error };
  break;
}
```

#### D. Update `getInferenceProfileId` (Lines 72-81)

**Before:**
```typescript
function getInferenceProfileId(modelId: string, region: string): string {
  if (REQUIRES_INFERENCE_PROFILE.includes(modelId)) {
    const regionPrefix = region.split('-')[0];
    const inferenceProfileId = `${regionPrefix}.${modelId}`;
    console.log(`🔄 [Bedrock] Usando Inference Profile: ${inferenceProfileId} (região: ${region})`);
    return inferenceProfileId;
  }
  return modelId;
}
```

**After:**
```typescript
function getInferenceProfileId(modelId: string, region: string): string {
  // Check if model requires inference profile
  const platformRule = ModelRegistry.getPlatformRules(modelId, 'bedrock');
  
  if (platformRule?.rule === 'requires_inference_profile') {
    const regionPrefix = region.split('-')[0];
    const inferenceProfileId = `${regionPrefix}.${modelId}`;
    console.log(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId} (region: ${region})`);
    return inferenceProfileId;
  }
  
  return modelId;
}
```

#### E. Remove `REQUIRES_INFERENCE_PROFILE` Constant (Lines 17-24)
This is now in the Model Registry, so remove:
```typescript
const REQUIRES_INFERENCE_PROFILE = [
  'anthropic.claude-haiku-4-5-20251001-v1:0',
  'anthropic.claude-sonnet-4-20250514-v1:0',
  'amazon.nova-2-lite-v1:0',
  'amazon.nova-2-lite-v1:0:256k',
  'amazon.nova-2-micro-v1:0',
  'amazon.nova-2-pro-v1:0'
];
```

---

### 2. **backend/src/controllers/providersController.ts**

**Current State:** Returns all AWS models without filtering

**Changes Needed:**

#### A. Add Import (Top of file)
```typescript
import { ModelRegistry } from '../services/ai/registry';
```

#### B. Update `getAvailableModels` Method (Lines 179-260)

**Find this section (around line 207):**
```typescript
const awsModels = await bedrockProvider.getAvailableModels(apiKey);
```

**Add filtering after this line:**
```typescript
const awsModels = await bedrockProvider.getAvailableModels(apiKey);

// Filter only supported models
const supportedModels = awsModels.filter(model => 
  ModelRegistry.isSupported(model.modelId)
);

// Enrich with metadata from registry
const enrichedModels = supportedModels.map(model => {
  const metadata = ModelRegistry.getModel(model.modelId);
  return {
    ...model,
    // Add metadata from registry
    displayName: metadata?.displayName || model.modelName,
    description: metadata?.description,
    capabilities: metadata?.capabilities,
    vendor: metadata?.vendor,
  };
});
```

**Update the response (around line 215):**
```typescript
// Before:
const chatModels = awsModels
  .filter(m => m.inputModalities.includes('TEXT') && m.outputModalities.includes('TEXT'))
  .map(m => ({
    apiModelId: m.modelId,
    displayName: m.modelName,
    provider: m.providerName,
    supportsStreaming: m.responseStreamingSupported,
  }));

// After:
const chatModels = enrichedModels
  .filter(m => m.inputModalities.includes('TEXT') && m.outputModalities.includes('TEXT'))
  .map(m => ({
    apiModelId: m.modelId,
    displayName: m.displayName,
    provider: m.providerName,
    vendor: m.vendor,
    supportsStreaming: m.responseStreamingSupported,
    capabilities: m.capabilities,
    description: m.description,
  }));
```

---

### 3. **backend/src/services/ai/index.ts** (Optional Enhancement)

**Current State:** Uses provider factory

**Optional Changes:**

#### A. Add Registry Check Before Creating Provider
```typescript
import { ModelRegistry } from './registry';

// In streamChat function, add validation:
if (!ModelRegistry.isSupported(modelId)) {
  throw new Error(`Model ${modelId} is not supported`);
}
```

---

## 🔧 Testing Checklist

After making changes, test:

- [ ] **Anthropic Models** (Claude 3.5 Sonnet, Haiku)
  - [ ] Streaming works
  - [ ] System messages work
  - [ ] Temperature/tokens work

- [ ] **Cohere Models** (Command R, Command R+)
  - [ ] Streaming works
  - [ ] Chat history works
  - [ ] Preamble (system) works

- [ ] **Amazon Models** (Titan, Nova)
  - [ ] Streaming works
  - [ ] Formatted input works

- [ ] **Inference Profiles** (Claude 4.5, Nova 2)
  - [ ] Auto-detection works
  - [ ] Profile format correct

- [ ] **Model Filtering**
  - [ ] Only supported models shown in UI
  - [ ] Metadata displayed correctly

---

## 📊 Migration Impact

### Files to Modify: 2 files
1. `backend/src/services/ai/providers/bedrock.ts` (Major refactor)
2. `backend/src/controllers/providersController.ts` (Minor changes)

### Lines to Change: ~150 lines
- Remove: ~230 lines (inline functions)
- Add: ~80 lines (adapter usage)
- Net: -150 lines (code reduction!)

### Breaking Changes: None
- Existing API contracts unchanged
- Frontend doesn't need changes
- Backward compatible

---

## 🚀 Migration Strategy

### Option 1: Big Bang (Recommended)
1. Make all changes at once
2. Test thoroughly
3. Deploy

**Pros:** Clean, no hybrid state  
**Cons:** Larger PR, more testing

### Option 2: Gradual
1. Keep old code, add adapter usage alongside
2. Test with feature flag
3. Remove old code after validation

**Pros:** Safer, easier rollback  
**Cons:** Temporary code duplication

---

## 📝 Commit Message Template

```
refactor(ai): migrate to adapter + registry architecture

- Replace inline format logic with reusable adapters
- Add Model Registry for centralized metadata
- Filter unsupported models in controllers
- Enrich model list with capabilities

BREAKING CHANGE: None (backward compatible)

Closes: #XXX
```

---

## ❓ FAQ

**Q: Do I need to update the frontend?**  
A: No, the API contract is unchanged.

**Q: What if a model isn't in the registry?**  
A: It won't be shown in the UI (filtered out).

**Q: Can I add a new model?**  
A: Yes, just add it to the appropriate `models/*.ts` file.

**Q: What about other providers (Azure, Vertex)?**  
A: They can reuse the same adapters! That's the whole point.

---

**Document Version**: 1.0  
**Created**: 2026-01-16  
**Status**: 📋 Migration Guide
