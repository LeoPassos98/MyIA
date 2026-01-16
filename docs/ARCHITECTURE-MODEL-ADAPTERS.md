# Architecture: Model Adapters & Registry System

## 🎯 Problem Statement

Currently, model-specific formatting logic is embedded within platform providers (e.g., BedrockProvider). This creates several issues:

### Current Issues

1. **Code Duplication**: If we want to use Cohere via AWS Bedrock AND via direct API, we need to duplicate the Cohere formatting logic
2. **No Centralized Model Knowledge**: The system doesn't know which models are supported or their capabilities
3. **No Automatic Filtering**: UI shows all available models, even if we don't have adapters for them
4. **Platform-Specific Rules Not Tracked**: Some models require special handling (e.g., Inference Profiles) but this isn't centralized
5. **Hard to Maintain**: Changes to a model's format require finding all places where it's used

### Example of Current Problem

```typescript
// ❌ Current: Logic duplicated across providers
class BedrockProvider {
  createCoherePayload() { /* Cohere format */ }
}

class DirectCohereProvider {
  createCoherePayload() { /* Same Cohere format - DUPLICATED! */ }
}

class AzureProvider {
  createCoherePayload() { /* Same Cohere format - DUPLICATED AGAIN! */ }
}
```

---

## 💡 Proposed Solution: Model Adapters + Registry

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                    (Controllers, Services)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Service Factory                      │
│              (Chooses Provider + Adapter)                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬───────────────┐
         ▼                  ▼                  ▼               ▼
┌────────────────┐  ┌────────────────┐  ┌──────────┐  ┌──────────┐
│ Platform       │  │ Platform       │  │ Platform │  │ Platform │
│ Providers      │  │ Providers      │  │ Providers│  │ Providers│
├────────────────┤  ├────────────────┤  ├──────────┤  ├──────────┤
│ BedrockProvider│  │ AzureProvider  │  │ Vertex   │  │ Direct   │
│                │  │                │  │ Provider │  │ Provider │
└────────┬───────┘  └────────┬───────┘  └────┬─────┘  └────┬─────┘
         │                   │               │             │
         └───────────────────┴───────────────┴─────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────────┐
         │          Model Adapters                   │
         │      (Format Conversion Layer)            │
         ├───────────────────────────────────────────┤
         │ • AnthropicAdapter                        │
         │ • CohereAdapter                           │
         │ • AmazonAdapter                           │
         │ • OpenAIAdapter                           │
         │ • AI21Adapter                             │
         │ • MetaAdapter                             │
         │ • MistralAdapter                          │
         └───────────────────┬───────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────────┐
         │          Model Registry                   │
         │      (Centralized Model Metadata)         │
         ├───────────────────────────────────────────┤
         │ • Model capabilities                      │
         │ • Supported platforms                     │
         │ • Platform-specific rules                 │
         │ • Adapter mappings                        │
         └───────────────────────────────────────────┘
```

---

## 🏗️ Component Design

### 1. Model Adapters

**Purpose**: Convert between universal message format and model-specific format

**Location**: `backend/src/services/ai/adapters/`

**Interface**:
```typescript
// backend/src/services/ai/adapters/base.adapter.ts

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UniversalOptions {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface AdapterPayload {
  body: any;
  contentType?: string;
  accept?: string;
}

export interface AdapterChunk {
  type: 'chunk' | 'error' | 'done';
  content?: string;
  error?: string;
  metadata?: any;
}

export abstract class BaseModelAdapter {
  /**
   * Model vendor name (e.g., 'anthropic', 'cohere', 'amazon')
   */
  abstract readonly vendor: string;

  /**
   * Supported model IDs for this adapter
   */
  abstract readonly supportedModels: string[];

  /**
   * Convert universal format to model-specific format
   */
  abstract formatRequest(
    messages: Message[],
    options: UniversalOptions
  ): AdapterPayload;

  /**
   * Parse model-specific response chunk to universal format
   */
  abstract parseChunk(chunk: any): AdapterChunk;

  /**
   * Check if this adapter supports a given model
   */
  supportsModel(modelId: string): boolean {
    return this.supportedModels.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(modelId);
      }
      return pattern === modelId;
    });
  }
}
```

**Example Implementation**:
```typescript
// backend/src/services/ai/adapters/cohere.adapter.ts

export class CohereAdapter extends BaseModelAdapter {
  readonly vendor = 'cohere';
  readonly supportedModels = [
    'cohere.command-r-v1:0',
    'cohere.command-r-plus-v1:0',
    'cohere.command-*'
  ];

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    const chatHistory = conversationMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content
    }));
    
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    
    const body: any = {
      message: lastMessage?.content || '',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    if (chatHistory.length > 0) {
      body.chat_history = chatHistory;
    }

    if (systemMessage) {
      body.preamble = systemMessage.content;
    }

    if (options.topP !== undefined) {
      body.p = options.topP;
    }

    return {
      body,
      contentType: 'application/json',
      accept: 'application/json'
    };
  }

  parseChunk(chunk: any): AdapterChunk {
    if (chunk.text) {
      return { type: 'chunk', content: chunk.text };
    }
    
    if (chunk.is_finished) {
      return { type: 'done' };
    }

    if (chunk.error) {
      return { type: 'error', error: chunk.error };
    }

    return { type: 'chunk', content: '' };
  }
}
```

---

### 2. Model Registry

**Purpose**: Centralized metadata about all supported models

**Location**: `backend/src/services/ai/registry/`

**Interface**:
```typescript
// backend/src/services/ai/registry/model-registry.ts

export interface ModelCapabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxContextWindow: number;
  maxOutputTokens: number;
}

export interface PlatformRule {
  platform: 'bedrock' | 'azure' | 'vertex' | 'direct';
  rule: string; // e.g., 'requires_inference_profile', 'region_specific'
  config?: any; // Additional configuration
}

export interface ModelMetadata {
  modelId: string;
  vendor: string;
  displayName: string;
  description?: string;
  capabilities: ModelCapabilities;
  supportedPlatforms: string[];
  platformRules?: PlatformRule[];
  adapterClass: string; // e.g., 'CohereAdapter'
  deprecated?: boolean;
  replacedBy?: string;
}

export class ModelRegistry {
  private static models: Map<string, ModelMetadata> = new Map();

  /**
   * Register a model in the registry
   */
  static register(metadata: ModelMetadata): void {
    this.models.set(metadata.modelId, metadata);
  }

  /**
   * Get metadata for a specific model
   */
  static getModel(modelId: string): ModelMetadata | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models for a specific vendor
   */
  static getModelsByVendor(vendor: string): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => m.vendor === vendor);
  }

  /**
   * Get all models supported on a specific platform
   */
  static getModelsByPlatform(platform: string): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => m.supportedPlatforms.includes(platform));
  }

  /**
   * Check if a model is supported
   */
  static isSupported(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /**
   * Get platform-specific rules for a model
   */
  static getPlatformRules(
    modelId: string,
    platform: string
  ): PlatformRule | undefined {
    const model = this.getModel(modelId);
    return model?.platformRules?.find(r => r.platform === platform);
  }

  /**
   * Get all supported models (non-deprecated)
   */
  static getAllSupported(): ModelMetadata[] {
    return Array.from(this.models.values())
      .filter(m => !m.deprecated);
  }
}
```

**Example Registration**:
```typescript
// backend/src/services/ai/registry/models/cohere.models.ts

import { ModelRegistry } from '../model-registry';

// Register Cohere Command R
ModelRegistry.register({
  modelId: 'cohere.command-r-v1:0',
  vendor: 'cohere',
  displayName: 'Cohere Command R',
  description: 'Cohere\'s flagship model for complex tasks',
  capabilities: {
    streaming: true,
    vision: false,
    functionCalling: false,
    maxContextWindow: 128000,
    maxOutputTokens: 4096
  },
  supportedPlatforms: ['bedrock', 'direct'],
  adapterClass: 'CohereAdapter'
});

// Register Cohere Command R Plus
ModelRegistry.register({
  modelId: 'cohere.command-r-plus-v1:0',
  vendor: 'cohere',
  displayName: 'Cohere Command R+',
  description: 'Enhanced version with better reasoning',
  capabilities: {
    streaming: true,
    vision: false,
    functionCalling: false,
    maxContextWindow: 128000,
    maxOutputTokens: 4096
  },
  supportedPlatforms: ['bedrock', 'direct'],
  adapterClass: 'CohereAdapter'
});
```

**Example with Platform Rules**:
```typescript
// backend/src/services/ai/registry/models/anthropic.models.ts

ModelRegistry.register({
  modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  vendor: 'anthropic',
  displayName: 'Claude 4.5 Haiku',
  capabilities: {
    streaming: true,
    vision: true,
    functionCalling: true,
    maxContextWindow: 200000,
    maxOutputTokens: 8192
  },
  supportedPlatforms: ['bedrock', 'direct'],
  platformRules: [
    {
      platform: 'bedrock',
      rule: 'requires_inference_profile',
      config: {
        profileFormat: '{region}.{modelId}'
      }
    }
  ],
  adapterClass: 'AnthropicAdapter'
});
```

---

### 3. Platform Providers (Refactored)

**Purpose**: Handle platform-specific communication, use adapters for formatting

**Example**:
```typescript
// backend/src/services/ai/providers/bedrock.ts (refactored)

import { BaseAIProvider } from './base';
import { ModelRegistry } from '../registry/model-registry';
import { AdapterFactory } from '../adapters/adapter-factory';

export class BedrockProvider extends BaseAIProvider {
  async *streamChat(messages: any[], options: AIRequestOptions) {
    // 1. Get model metadata from registry
    const modelMetadata = ModelRegistry.getModel(options.modelId);
    
    if (!modelMetadata) {
      yield {
        type: 'error',
        error: `Model ${options.modelId} is not supported`
      };
      return;
    }

    // 2. Check platform-specific rules
    const platformRule = ModelRegistry.getPlatformRules(
      options.modelId,
      'bedrock'
    );

    let effectiveModelId = options.modelId;
    
    if (platformRule?.rule === 'requires_inference_profile') {
      const regionPrefix = this.region.split('-')[0];
      effectiveModelId = `${regionPrefix}.${options.modelId}`;
      console.log(`Using inference profile: ${effectiveModelId}`);
    }

    // 3. Get appropriate adapter
    const adapter = AdapterFactory.getAdapter(modelMetadata.vendor);

    // 4. Format request using adapter
    const { body, contentType, accept } = adapter.formatRequest(
      messages,
      options
    );

    // 5. Send request to AWS Bedrock
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: effectiveModelId,
      contentType: contentType || 'application/json',
      accept: accept || 'application/json',
      body: JSON.stringify(body)
    });

    const response = await this.client.send(command);

    // 6. Process response using adapter
    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        const parsed = adapter.parseChunk(chunk);
        
        if (parsed.type === 'chunk' && parsed.content) {
          yield { type: 'chunk', content: parsed.content };
        } else if (parsed.type === 'done') {
          break;
        } else if (parsed.type === 'error') {
          yield { type: 'error', error: parsed.error };
          break;
        }
      }
    }
  }
}
```

---

### 4. Adapter Factory

**Purpose**: Create and cache adapter instances

```typescript
// backend/src/services/ai/adapters/adapter-factory.ts

import { BaseModelAdapter } from './base.adapter';
import { AnthropicAdapter } from './anthropic.adapter';
import { CohereAdapter } from './cohere.adapter';
import { AmazonAdapter } from './amazon.adapter';
import { OpenAIAdapter } from './openai.adapter';

export class AdapterFactory {
  private static adapters: Map<string, BaseModelAdapter> = new Map();

  /**
   * Get adapter for a specific vendor
   */
  static getAdapter(vendor: string): BaseModelAdapter {
    // Return cached adapter if exists
    if (this.adapters.has(vendor)) {
      return this.adapters.get(vendor)!;
    }

    // Create new adapter
    let adapter: BaseModelAdapter;

    switch (vendor.toLowerCase()) {
      case 'anthropic':
        adapter = new AnthropicAdapter();
        break;
      case 'cohere':
        adapter = new CohereAdapter();
        break;
      case 'amazon':
        adapter = new AmazonAdapter();
        break;
      case 'openai':
        adapter = new OpenAIAdapter();
        break;
      default:
        throw new Error(`No adapter found for vendor: ${vendor}`);
    }

    // Cache and return
    this.adapters.set(vendor, adapter);
    return adapter;
  }

  /**
   * Get adapter for a specific model ID
   */
  static getAdapterForModel(modelId: string): BaseModelAdapter {
    // Try all adapters to find one that supports this model
    for (const adapter of this.adapters.values()) {
      if (adapter.supportsModel(modelId)) {
        return adapter;
      }
    }

    // If not cached, try creating adapters
    const vendors = ['anthropic', 'cohere', 'amazon', 'openai'];
    
    for (const vendor of vendors) {
      const adapter = this.getAdapter(vendor);
      if (adapter.supportsModel(modelId)) {
        return adapter;
      }
    }

    throw new Error(`No adapter found for model: ${modelId}`);
  }
}
```

---

## 📊 Usage Examples

### Example 1: Using Cohere via AWS Bedrock

```typescript
const provider = new BedrockProvider('us-east-1');
const messages = [
  { role: 'user', content: 'Hello!' }
];

// Registry automatically:
// 1. Finds CohereAdapter
// 2. Formats request in Cohere format
// 3. Sends to AWS Bedrock
// 4. Parses response using CohereAdapter

for await (const chunk of provider.streamChat(messages, {
  modelId: 'cohere.command-r-v1:0',
  apiKey: 'ACCESS_KEY:SECRET_KEY'
})) {
  console.log(chunk);
}
```

### Example 2: Using Cohere via Direct API

```typescript
const provider = new DirectProvider('https://api.cohere.ai');
const messages = [
  { role: 'user', content: 'Hello!' }
];

// SAME adapter, different provider!
// No code duplication needed

for await (const chunk of provider.streamChat(messages, {
  modelId: 'command-r',
  apiKey: 'COHERE_API_KEY'
})) {
  console.log(chunk);
}
```

### Example 3: Filtering Supported Models in UI

```typescript
// backend/src/controllers/providersController.ts

async getAvailableModels(req: AuthRequest, res: Response) {
  // Get all models from AWS
  const awsModels = await bedrockClient.listFoundationModels();
  
  // Filter only supported models
  const supportedModels = awsModels.filter(model => 
    ModelRegistry.isSupported(model.modelId)
  );

  // Enrich with metadata
  const enrichedModels = supportedModels.map(model => {
    const metadata = ModelRegistry.getModel(model.modelId);
    return {
      ...model,
      displayName: metadata?.displayName,
      capabilities: metadata?.capabilities,
      vendor: metadata?.vendor
    };
  });

  return res.json(jsend.success({
    models: enrichedModels,
    totalCount: enrichedModels.length
  }));
}
```

### Example 4: Handling Platform-Specific Rules

```typescript
// Automatically handled by provider
const provider = new BedrockProvider('us-east-1');

// This model requires inference profile
// Provider automatically detects and applies the rule
for await (const chunk of provider.streamChat(messages, {
  modelId: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  apiKey: 'ACCESS_KEY:SECRET_KEY'
})) {
  console.log(chunk);
}

// Internally:
// 1. Registry says: requires_inference_profile
// 2. Provider transforms: us.anthropic.claude-haiku-4-5-20251001-v1:0
// 3. Request succeeds
```

---

## 🎯 Benefits

### 1. **Code Reusability**
- Write Cohere formatting logic once
- Use it across AWS Bedrock, Direct API, Azure, etc.
- No duplication

### 2. **Centralized Knowledge**
- All model metadata in one place
- Easy to see what's supported
- Easy to add new models

### 3. **Automatic Filtering**
- UI only shows supported models
- No confusion for users
- Better UX

### 4. **Platform Rules**
- Inference profiles handled automatically
- Region-specific rules centralized
- Easy to add new rules

### 5. **Maintainability**
- Change Cohere format? Update one adapter
- Add new model? Register + create adapter if needed
- Clear separation of concerns

### 6. **Testability**
- Test adapters independently
- Test providers independently
- Test registry independently
- Mock easily

### 7. **Extensibility**
- New vendor? Create adapter + register models
- New platform? Create provider, reuse adapters
- New capability? Add to registry

---

## 📁 File Structure

```
backend/src/services/ai/
├── adapters/
│   ├── base.adapter.ts           # Base adapter interface
│   ├── adapter-factory.ts        # Adapter factory
│   ├── anthropic.adapter.ts      # Anthropic format
│   ├── cohere.adapter.ts         # Cohere format
│   ├── amazon.adapter.ts         # Amazon Titan/Nova format
│   ├── openai.adapter.ts         # OpenAI format
│   ├── ai21.adapter.ts           # AI21 format
│   ├── meta.adapter.ts           # Meta Llama format
│   └── mistral.adapter.ts        # Mistral format
│
├── registry/
│   ├── model-registry.ts         # Registry implementation
│   ├── models/
│   │   ├── anthropic.models.ts   # Anthropic models
│   │   ├── cohere.models.ts      # Cohere models
│   │   ├── amazon.models.ts      # Amazon models
│   │   ├── openai.models.ts      # OpenAI models
│   │   └── index.ts              # Auto-register all
│   └── index.ts
│
├── providers/
│   ├── base.ts                   # Base provider (unchanged)
│   ├── bedrock.ts                # AWS Bedrock (refactored)
│   ├── azure.ts                  # Azure OpenAI (refactored)
│   ├── vertex.ts                 # Google Vertex (new)
│   ├── direct.ts                 # Direct APIs (new)
│   └── factory.ts                # Provider factory (updated)
│
├── types.ts                      # Shared types
└── index.ts                      # Main exports
```

---

## 🚀 Migration Plan

### Phase 1: Create Infrastructure (No Breaking Changes)
1. Create adapter interfaces and base classes
2. Create registry infrastructure
3. Create adapter factory
4. **No changes to existing code yet**

### Phase 2: Implement Adapters
1. Extract existing format logic into adapters
2. Implement AnthropicAdapter
3. Implement CohereAdapter
4. Implement AmazonAdapter
5. Test adapters independently

### Phase 3: Register Models
1. Create model metadata for all supported models
2. Register in ModelRegistry
3. Add platform-specific rules
4. Test registry queries

### Phase 4: Refactor Providers
1. Update BedrockProvider to use adapters
2. Update other providers
3. Remove duplicated format logic
4. Test end-to-end

### Phase 5: Update Controllers
1. Use ModelRegistry for filtering
2. Enrich model lists with metadata
3. Add capability-based filtering
4. Update UI to show capabilities

### Phase 6: Documentation & Cleanup
1. Update API documentation
2. Create developer guide
3. Remove deprecated code
4. Final testing

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test adapter independently
describe('CohereAdapter', () => {
  const adapter = new CohereAdapter();

  it('should format request correctly', () => {
    const messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' }
    ];

    const result = adapter.formatRequest(messages, {
      temperature: 0.7,
      maxTokens: 2048
    });

    expect(result.body).toEqual({
      message: 'Hello',
      preamble: 'You are helpful',
      temperature: 0.7,
      max_tokens: 2048
    });
  });

  it('should parse chunk correctly', () => {
    const chunk = { text: 'Hello', is_finished: false };
    const result = adapter.parseChunk(chunk);

    expect(result).toEqual({
      type: 'chunk',
      content: 'Hello'
    });
  });
});
```

### Integration Tests

```typescript
// Test provider with adapter
describe('BedrockProvider with CohereAdapter', () => {
  it('should stream Cohere responses', async () => {
    const provider = new BedrockProvider('us-east-1');
    const messages = [{ role: 'user', content: 'Hello' }];

    const chunks: string[] = [];
    
    for await (const chunk of provider.streamChat(messages, {
      modelId: 'cohere.command-r-v1:0',
      apiKey: 'ACCESS_KEY:SECRET_KEY'
    })) {
      if (chunk.type === 'chunk') {
        chunks.push(chunk.content);
      }
    }

    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

---

## 📝 Next Steps

1. **Review this architecture** - Does it solve your problems?
2. **Decide on implementation** - Implement now or later?
3. **Prioritize phases** - Which phase is most important?
4. **Assign resources** - Who will implement what?

---

## ❓ Questions to Consider

1. Should we support custom adapters (user-defined)?
2. Should adapters be plugins (dynamically loaded)?
3. Should we version adapters (for API changes)?
4. Should we cache adapter instances globally or per-request?
5. Should we support adapter chaining (pre/post processing)?

---

**Document Version**: 1.0  
**Created**: 2026-01-16  
**Status**: 📋 Proposal - Awaiting Review
