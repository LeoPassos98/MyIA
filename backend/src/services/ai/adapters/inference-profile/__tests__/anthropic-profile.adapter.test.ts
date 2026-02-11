/**
 * @file anthropic-profile.adapter.test.ts
 * @description Testes para AnthropicProfileAdapter
 */

import { AnthropicProfileAdapter } from '../anthropic-profile.adapter';
import { Message, UniversalOptions } from '../../base.adapter';

describe('AnthropicProfileAdapter', () => {
  let adapter: AnthropicProfileAdapter;

  beforeEach(() => {
    adapter = new AnthropicProfileAdapter();
  });

  describe('inferenceType', () => {
    it('deve retornar INFERENCE_PROFILE', () => {
      expect(adapter.inferenceType).toBe('INFERENCE_PROFILE');
    });
  });

  describe('vendor', () => {
    it('deve retornar anthropic', () => {
      expect(adapter.vendor).toBe('anthropic');
    });
  });

  describe('displayName', () => {
    it('deve retornar nome formatado com inference type', () => {
      expect(adapter.displayName).toBe('Anthropic INFERENCE_PROFILE Adapter');
    });
  });

  describe('supportsModel', () => {
    it('deve suportar Claude Sonnet 4.5 com inference profile', () => {
      expect(adapter.supportsModel('us.anthropic.claude-sonnet-4-5-20250929-v1:0')).toBe(true);
    });

    it('deve suportar Claude Opus 4 com inference profile', () => {
      expect(adapter.supportsModel('eu.anthropic.claude-opus-4-20250514-v1:0')).toBe(true);
    });

    it('deve suportar Claude Haiku 4 com inference profile', () => {
      expect(adapter.supportsModel('apac.anthropic.claude-haiku-4-20250514-v1:0')).toBe(true);
    });

    it('deve suportar Claude Sonnet 4.5 sem prefixo regional', () => {
      expect(adapter.supportsModel('anthropic.claude-sonnet-4-5-20250929-v1:0')).toBe(true);
    });

    it('deve suportar Claude Opus 4 sem prefixo regional', () => {
      expect(adapter.supportsModel('anthropic.claude-opus-4-20250514-v1:0')).toBe(true);
    });

    it('NÃO deve suportar Claude 3.x (ON_DEMAND)', () => {
      expect(adapter.supportsModel('anthropic.claude-3-sonnet-20240229-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos de outros vendors', () => {
      expect(adapter.supportsModel('amazon.nova-pro-v1:0')).toBe(false);
    });
  });

  describe('formatRequest', () => {
    it('deve formatar request corretamente', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        maxTokens: 2000,
        temperature: 0.8,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result).toEqual({
        body: {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.8,
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
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.max_tokens).toBe(4096);
      expect(result.body.temperature).toBe(0.7);
    });

    it('deve priorizar temperature sobre top_p', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        temperature: 0.5,
        topP: 0.9,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.temperature).toBe(0.5);
      expect(result.body.top_p).toBeUndefined();
    });

    it('deve usar top_p quando temperature não está definido', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        topP: 0.9,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.top_p).toBe(0.9);
      expect(result.body.temperature).toBeUndefined();
    });

    it('deve separar system message das mensagens de conversação', () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.system).toBe('You are a helpful assistant');
      expect(result.body.messages).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ]);
    });

    it('deve adicionar stop_sequences quando fornecido', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        stopSequences: ['STOP', 'END'],
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.stop_sequences).toEqual(['STOP', 'END']);
    });

    it('NÃO deve adicionar stop_sequences quando vazio', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        stopSequences: [],
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.stop_sequences).toBeUndefined();
    });
  });

  describe('parseChunk', () => {
    it('deve extrair texto de chunk válido', () => {
      const chunk = {
        type: 'content_block_delta',
        delta: { text: 'Hello' },
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: 'Hello',
      });
    });

    it('deve retornar done para message_stop', () => {
      const chunk = { type: 'message_stop' };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'done',
      });
    });

    it('deve retornar error para chunk com erro', () => {
      const chunk = {
        type: 'error',
        error: { message: 'Rate limit exceeded' },
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'Rate limit exceeded',
      });
    });

    it('deve retornar error para chunk com message de erro', () => {
      const chunk = {
        type: 'error',
        message: 'Invalid request',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'Invalid request',
      });
    });

    it('deve retornar error genérico quando não há mensagem', () => {
      const chunk = {
        type: 'error',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'Unknown error',
      });
    });

    it('deve retornar chunk vazio para tipos desconhecidos', () => {
      const chunk = { type: 'message_start' };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar chunk vazio para chunk null', () => {
      const result = adapter.parseChunk(null as unknown as Record<string, unknown>);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });

    it('deve retornar chunk vazio para content_block_delta sem texto', () => {
      const chunk = {
        type: 'content_block_delta',
        delta: {},
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });
  });
});
