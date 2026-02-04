/**
 * @file amazon-profile.adapter.test.ts
 * @description Testes para AmazonProfileAdapter
 */

import { AmazonProfileAdapter } from '../amazon-profile.adapter';
import { Message, UniversalOptions } from '../../base.adapter';

describe('AmazonProfileAdapter', () => {
  let adapter: AmazonProfileAdapter;

  beforeEach(() => {
    adapter = new AmazonProfileAdapter();
  });

  describe('inferenceType', () => {
    it('deve retornar INFERENCE_PROFILE', () => {
      expect(adapter.inferenceType).toBe('INFERENCE_PROFILE');
    });
  });

  describe('vendor', () => {
    it('deve retornar amazon', () => {
      expect(adapter.vendor).toBe('amazon');
    });
  });

  describe('displayName', () => {
    it('deve retornar nome formatado com inference type', () => {
      expect(adapter.displayName).toBe('Amazon INFERENCE_PROFILE Adapter');
    });
  });

  describe('supportsModel', () => {
    it('deve suportar Amazon Nova Pro com inference profile', () => {
      expect(adapter.supportsModel('us.amazon.nova-pro-v1:0')).toBe(true);
    });

    it('deve suportar Amazon Nova Lite', () => {
      expect(adapter.supportsModel('us.amazon.nova-lite-v1:0')).toBe(true);
    });

    it('deve suportar Amazon Nova Micro', () => {
      expect(adapter.supportsModel('us.amazon.nova-micro-v1:0')).toBe(true);
    });

    it('deve suportar Amazon Nova 2 Lite', () => {
      expect(adapter.supportsModel('us.amazon.nova-2-lite-v1:0')).toBe(true);
    });

    it('deve suportar Amazon Nova 2 Lite com context window', () => {
      expect(adapter.supportsModel('us.amazon.nova-2-lite-v1:0:256k')).toBe(true);
    });

    it('deve suportar Amazon Nova 2 Micro', () => {
      expect(adapter.supportsModel('us.amazon.nova-2-micro-v1:0')).toBe(true);
    });

    it('deve suportar Amazon Nova 2 Pro', () => {
      expect(adapter.supportsModel('us.amazon.nova-2-pro-v1:0')).toBe(true);
    });

    it('deve suportar prefixo eu', () => {
      expect(adapter.supportsModel('eu.amazon.nova-pro-v1:0')).toBe(true);
    });

    it('deve suportar prefixo apac', () => {
      expect(adapter.supportsModel('apac.amazon.nova-lite-v1:0')).toBe(true);
    });

    it('deve suportar wildcard para modelos eu', () => {
      expect(adapter.supportsModel('eu.amazon.nova-custom-v1:0')).toBe(true);
    });

    it('deve suportar wildcard para modelos apac', () => {
      expect(adapter.supportsModel('apac.amazon.nova-custom-v1:0')).toBe(true);
    });

    it('NÃO deve suportar Amazon Titan (ON_DEMAND)', () => {
      expect(adapter.supportsModel('amazon.titan-text-premier-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos sem prefixo regional', () => {
      expect(adapter.supportsModel('amazon.nova-pro-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos de outros vendors', () => {
      expect(adapter.supportsModel('anthropic.claude-3-sonnet-20240229-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos que não são nova', () => {
      expect(adapter.supportsModel('us.amazon.titan-text-v1:0')).toBe(false);
    });
  });

  describe('formatRequest', () => {
    it('deve formatar request corretamente', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
        maxTokens: 2000,
        temperature: 0.8,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result).toEqual({
        body: {
          messages: [{ role: 'user', content: [{ text: 'Hello' }] }],
          inferenceConfig: {
            maxTokens: 2000,
            temperature: 0.8,
            topP: 0.9,
          },
        },
        contentType: 'application/json',
        accept: 'application/json',
      });
    });

    it('deve usar valores padrão quando não especificados', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.inferenceConfig.maxTokens).toBe(2048);
      expect(result.body.inferenceConfig.temperature).toBe(0.7);
      expect(result.body.inferenceConfig.topP).toBe(0.9);
    });

    it('deve incluir stopSequences quando fornecido', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
        stopSequences: ['STOP', 'END'],
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.inferenceConfig.stopSequences).toEqual(['STOP', 'END']);
    });

    it('NÃO deve incluir stopSequences quando vazio', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
        stopSequences: [],
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.inferenceConfig.stopSequences).toBeUndefined();
    });

    it('deve separar system message das mensagens de conversação', () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.system).toEqual([{ text: 'You are a helpful assistant' }]);
      expect(result.body.messages).toEqual([
        { role: 'user', content: [{ text: 'Hello' }] },
        { role: 'assistant', content: [{ text: 'Hi there!' }] },
        { role: 'user', content: [{ text: 'How are you?' }] },
      ]);
    });

    it('NÃO deve adicionar system quando não existe', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.system).toBeUndefined();
    });

    it('deve formatar mensagens do assistant corretamente', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.messages[1]).toEqual({
        role: 'assistant',
        content: [{ text: 'Hi!' }],
      });
    });

    it('deve usar topP customizado', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.amazon.nova-pro-v1:0',
        topP: 0.95,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.inferenceConfig.topP).toBe(0.95);
    });

    it('deve funcionar sem modelId (fallback para defaults)', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        // Sem modelId
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.inferenceConfig.maxTokens).toBe(2048);
      expect(result.body.inferenceConfig.temperature).toBe(0.7);
      expect(result.body.inferenceConfig.topP).toBe(0.9);
    });
  });

  describe('parseChunk', () => {
    it('deve extrair texto de chunk válido', () => {
      const chunk = {
        contentBlockDelta: {
          delta: { text: 'Hello' },
        },
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: 'Hello',
      });
    });

    it('deve retornar done para messageStop', () => {
      const chunk = {
        messageStop: {
          stopReason: 'end_turn',
        },
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'done',
        metadata: {
          stopReason: 'end_turn',
        },
      });
    });

    it('deve retornar error para chunk com erro', () => {
      const chunk = {
        error: 'Rate limit exceeded',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'Rate limit exceeded',
      });
    });

    it('deve retornar error para chunk com message de erro', () => {
      const chunk = {
        message: 'error: Invalid request',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'error: Invalid request',
      });
    });

    it('deve retornar chunk vazio para tipos desconhecidos', () => {
      const chunk = { other: 'data' };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar chunk vazio para chunk null', () => {
      const result = adapter.parseChunk(null);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar chunk vazio para contentBlockDelta sem texto', () => {
      const chunk = {
        contentBlockDelta: {
          delta: {},
        },
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar chunk vazio para contentBlockDelta sem delta', () => {
      const chunk = {
        contentBlockDelta: {},
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar done para messageStop sem stopReason', () => {
      const chunk = {
        messageStop: {},
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'done',
        metadata: {
          stopReason: undefined,
        },
      });
    });
  });
});
