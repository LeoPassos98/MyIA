// backend/src/services/ai/adapters/__tests__/adapter-factory.test.ts
// Standards: docs/STANDARDS.md

import { AdapterFactory } from '../adapter-factory';
import { AnthropicAdapter } from '../anthropic.adapter';
import { AmazonAdapter } from '../amazon.adapter';
import { CohereAdapter } from '../cohere.adapter';
import { AnthropicProfileAdapter } from '../inference-profile/anthropic-profile.adapter';
import { AmazonProfileAdapter } from '../inference-profile/amazon-profile.adapter';

describe('AdapterFactory', () => {
  beforeEach(() => {
    // Clear cache before each test
    AdapterFactory.clearCache();
    // Reset environment variable
    delete process.env.USE_NEW_ADAPTERS;
  });

  describe('detectInferenceType', () => {
    it('deve detectar INFERENCE_PROFILE com prefixo us', () => {
      expect(AdapterFactory.detectInferenceType('us.anthropic.claude-sonnet-4-5-20250929-v1:0'))
        .toBe('INFERENCE_PROFILE');
    });

    it('deve detectar INFERENCE_PROFILE com prefixo eu', () => {
      expect(AdapterFactory.detectInferenceType('eu.amazon.nova-pro-v1:0'))
        .toBe('INFERENCE_PROFILE');
    });

    it('deve detectar INFERENCE_PROFILE com prefixo apac', () => {
      expect(AdapterFactory.detectInferenceType('apac.anthropic.claude-3-sonnet-20240229-v1:0'))
        .toBe('INFERENCE_PROFILE');
    });

    it('deve detectar ON_DEMAND para modelos sem prefixo regional', () => {
      expect(AdapterFactory.detectInferenceType('anthropic.claude-3-sonnet-20240229-v1:0'))
        .toBe('ON_DEMAND');
    });

    it('deve detectar ON_DEMAND para modelos Amazon sem prefixo', () => {
      expect(AdapterFactory.detectInferenceType('amazon.nova-pro-v1:0'))
        .toBe('ON_DEMAND');
    });

    it('deve detectar PROVISIONED para ARN', () => {
      expect(AdapterFactory.detectInferenceType('arn:aws:bedrock:us-east-1:123456789012:provisioned-model/abc'))
        .toBe('PROVISIONED');
    });

    it('deve detectar ON_DEMAND como padrão', () => {
      expect(AdapterFactory.detectInferenceType('cohere.command-r-v1:0'))
        .toBe('ON_DEMAND');
    });
  });

  describe('detectVendor', () => {
    it('deve detectar vendor de Inference Profile', () => {
      expect(AdapterFactory.detectVendor('us.anthropic.claude-sonnet-4-5-20250929-v1:0'))
        .toBe('anthropic');
    });

    it('deve detectar vendor de formato padrão', () => {
      expect(AdapterFactory.detectVendor('anthropic.claude-3-sonnet-20240229-v1:0'))
        .toBe('anthropic');
    });

    it('deve detectar vendor Amazon', () => {
      expect(AdapterFactory.detectVendor('amazon.nova-pro-v1:0'))
        .toBe('amazon');
    });

    it('deve detectar vendor Cohere', () => {
      expect(AdapterFactory.detectVendor('cohere.command-r-v1:0'))
        .toBe('cohere');
    });

    it('deve retornar null para vendor desconhecido', () => {
      expect(AdapterFactory.detectVendor('unknown.model-v1:0'))
        .toBeNull();
    });
  });

  describe('createAdapter (Legacy Mode - USE_NEW_ADAPTERS=false)', () => {
    beforeEach(() => {
      process.env.USE_NEW_ADAPTERS = 'false';
    });

    it('deve criar AnthropicAdapter para anthropic', () => {
      const adapter = AdapterFactory.createAdapter('anthropic', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      expect(adapter.vendor).toBe('anthropic');
      expect(adapter.inferenceType).toBe('ON_DEMAND');
    });

    it('deve criar AmazonAdapter para amazon', () => {
      const adapter = AdapterFactory.createAdapter('amazon', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(AmazonAdapter);
      expect(adapter.vendor).toBe('amazon');
      expect(adapter.inferenceType).toBe('ON_DEMAND');
    });

    it('deve criar CohereAdapter para cohere', () => {
      const adapter = AdapterFactory.createAdapter('cohere', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(CohereAdapter);
      expect(adapter.vendor).toBe('cohere');
      expect(adapter.inferenceType).toBe('ON_DEMAND');
    });

    it('deve lançar erro para vendor não suportado', () => {
      expect(() => AdapterFactory.createAdapter('unknown', 'ON_DEMAND'))
        .toThrow('Unsupported vendor: unknown');
    });
  });

  describe('createAdapter (New Mode - USE_NEW_ADAPTERS=true)', () => {
    it('deve criar AnthropicProfileAdapter para INFERENCE_PROFILE', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('anthropic', 'INFERENCE_PROFILE');
      expect(adapter).toBeInstanceOf(AnthropicProfileAdapter);
      expect(adapter.vendor).toBe('anthropic');
      expect(adapter.inferenceType).toBe('INFERENCE_PROFILE');
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve criar AnthropicAdapter para ON_DEMAND', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('anthropic', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      expect(adapter.vendor).toBe('anthropic');
      expect(adapter.inferenceType).toBe('ON_DEMAND');
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve criar AmazonProfileAdapter para INFERENCE_PROFILE', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('amazon', 'INFERENCE_PROFILE');
      expect(adapter).toBeInstanceOf(AmazonProfileAdapter);
      expect(adapter.vendor).toBe('amazon');
      expect(adapter.inferenceType).toBe('INFERENCE_PROFILE');
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve criar AmazonAdapter para ON_DEMAND', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('amazon', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(AmazonAdapter);
      expect(adapter.vendor).toBe('amazon');
      expect(adapter.inferenceType).toBe('ON_DEMAND');
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve usar ON_DEMAND como fallback para inference type não suportado', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('anthropic', 'PROVISIONED');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      expect(adapter.inferenceType).toBe('ON_DEMAND');
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve usar legacy adapter para vendor não encontrado no mapa', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.createAdapter('anthropic', 'ON_DEMAND');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      delete process.env.USE_NEW_ADAPTERS;
    });
  });

  describe('getAdapterForModel', () => {
    it('deve retornar AnthropicProfileAdapter para Inference Profile', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.getAdapterForModel('us.anthropic.claude-sonnet-4-5-20250929-v1:0');
      expect(adapter).toBeInstanceOf(AnthropicProfileAdapter);
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve retornar AnthropicAdapter para ON_DEMAND', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.getAdapterForModel('anthropic.claude-3-sonnet-20240229-v1:0');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve retornar AmazonProfileAdapter para Inference Profile', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.getAdapterForModel('us.amazon.nova-pro-v1:0');
      expect(adapter).toBeInstanceOf(AmazonProfileAdapter);
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve retornar AmazonAdapter para ON_DEMAND', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      const adapter = AdapterFactory.getAdapterForModel('amazon.nova-pro-v1:0');
      expect(adapter).toBeInstanceOf(AmazonAdapter);
      delete process.env.USE_NEW_ADAPTERS;
    });

    it('deve lançar erro para modelo não suportado', () => {
      expect(() => AdapterFactory.getAdapterForModel('unknown.model-v1:0'))
        .toThrow('No adapter found for model: unknown.model-v1:0');
    });
  });

  describe('isModelSupported', () => {
    it('deve retornar true para modelo suportado', () => {
      expect(AdapterFactory.isModelSupported('anthropic.claude-3-sonnet-20240229-v1:0'))
        .toBe(true);
    });

    it('deve retornar true para Inference Profile suportado', () => {
      process.env.USE_NEW_ADAPTERS = 'true';
      expect(AdapterFactory.isModelSupported('us.anthropic.claude-sonnet-4-5-20250929-v1:0'))
        .toBe(true);
    });

    it('deve retornar false para modelo não suportado', () => {
      expect(AdapterFactory.isModelSupported('unknown.model-v1:0'))
        .toBe(false);
    });
  });

  describe('getAdapter (Legacy Method)', () => {
    it('deve retornar adapter cacheado', () => {
      const adapter1 = AdapterFactory.getAdapter('anthropic');
      const adapter2 = AdapterFactory.getAdapter('anthropic');
      expect(adapter1).toBe(adapter2); // Same instance
    });

    it('deve criar novo adapter se não cacheado', () => {
      const adapter = AdapterFactory.getAdapter('anthropic');
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('deve lançar erro para vendor não suportado', () => {
      expect(() => AdapterFactory.getAdapter('unknown'))
        .toThrow('Unsupported vendor: unknown');
    });
  });

  describe('getAllAdapters', () => {
    it('deve retornar todos os adapters registrados', () => {
      const adapters = AdapterFactory.getAllAdapters();
      expect(adapters).toHaveLength(3);
      expect(adapters[0]).toBeInstanceOf(AnthropicAdapter);
      expect(adapters[1]).toBeInstanceOf(CohereAdapter);
      expect(adapters[2]).toBeInstanceOf(AmazonAdapter);
    });

    it('deve retornar mesma instância em chamadas subsequentes', () => {
      const adapters1 = AdapterFactory.getAllAdapters();
      const adapters2 = AdapterFactory.getAllAdapters();
      expect(adapters1).toBe(adapters2);
    });
  });

  describe('clearCache', () => {
    it('deve limpar cache de adapters', () => {
      const adapter1 = AdapterFactory.getAdapter('anthropic');
      AdapterFactory.clearCache();
      const adapter2 = AdapterFactory.getAdapter('anthropic');
      expect(adapter1).not.toBe(adapter2); // Different instances
    });

    it('deve limpar lista de todos os adapters', () => {
      const adapters1 = AdapterFactory.getAllAdapters();
      AdapterFactory.clearCache();
      const adapters2 = AdapterFactory.getAllAdapters();
      expect(adapters1).not.toBe(adapters2); // Different arrays
    });
  });
});
