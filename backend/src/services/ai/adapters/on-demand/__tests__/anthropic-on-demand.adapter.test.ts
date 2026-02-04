/**
 * @file anthropic-on-demand.adapter.test.ts
 * @description Testes para AnthropicOnDemandAdapter
 */

import { AnthropicOnDemandAdapter } from '../anthropic-on-demand.adapter';
import { Message, UniversalOptions } from '../../base.adapter';

describe('AnthropicOnDemandAdapter', () => {
  let adapter: AnthropicOnDemandAdapter;

  beforeEach(() => {
    adapter = new AnthropicOnDemandAdapter();
  });

  describe('inferenceType', () => {
    it('deve retornar ON_DEMAND', () => {
      expect(adapter.inferenceType).toBe('ON_DEMAND');
    });
  });

  describe('vendor', () => {
    it('deve retornar anthropic', () => {
      expect(adapter.vendor).toBe('anthropic');
    });
  });

  describe('displayName', () => {
    it('deve retornar nome formatado com inference type', () => {
      expect(adapter.displayName).toBe('Anthropic ON_DEMAND Adapter');
    });
  });

  describe('supportsModel', () => {
    it('deve suportar Claude 3.5 Sonnet sem prefixo', () => {
      expect(adapter.supportsModel('anthropic.claude-3-5-sonnet-20241022-v2:0')).toBe(true);
    });

    it('deve suportar Claude 3.5 Haiku', () => {
      expect(adapter.supportsModel('anthropic.claude-3-5-haiku-20241022-v1:0')).toBe(true);
    });

    it('deve suportar Claude 3 Haiku', () => {
      expect(adapter.supportsModel('anthropic.claude-3-haiku-20240307-v1:0')).toBe(true);
    });

    it('deve suportar Claude Haiku 4.5', () => {
      expect(adapter.supportsModel('anthropic.claude-haiku-4-5-20251001-v1:0')).toBe(true);
    });

    it('deve suportar Claude Sonnet 4', () => {
      expect(adapter.supportsModel('anthropic.claude-sonnet-4-20250514-v1:0')).toBe(true);
    });

    it('deve suportar modelos com wildcard', () => {
      expect(adapter.supportsModel('anthropic.claude-3-opus-20240229-v1:0')).toBe(true);
    });

    it('NÃO deve suportar Claude 4.x com INFERENCE_PROFILE (us.anthropic)', () => {
      expect(adapter.supportsModel('us.anthropic.claude-sonnet-4-5-20250929-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos com prefixo regional eu', () => {
      expect(adapter.supportsModel('eu.anthropic.claude-3-sonnet-20240229-v1:0')).toBe(false);
    });

    it('NÃO deve suportar modelos com prefixo regional apac', () => {
      expect(adapter.supportsModel('apac.anthropic.claude-haiku-4-20250514-v1:0')).toBe(false);
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
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
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
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.max_tokens).toBe(2048);
      expect(result.body.temperature).toBe(0.7);
    });

    it('deve priorizar temperature sobre top_p', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.5,
        topP: 0.9,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.temperature).toBe(0.5);
      expect(result.body.top_p).toBeUndefined();
    });

    it('deve usar temperature padrão quando não especificado (prioridade sobre topP)', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        topP: 0.95,
      };

      const result = adapter.formatRequest(messages, options);

      // Temperature tem prioridade e usa valor padrão (0.7)
      expect(result.body.temperature).toBe(0.7);
      expect(result.body.top_p).toBeUndefined();
    });

    it('deve separar system message das mensagens de conversação', () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      const options: UniversalOptions = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
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
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
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
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        stopSequences: [],
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.stop_sequences).toBeUndefined();
    });

    it('deve adicionar top_k quando fornecido', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        topK: 50,
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.top_k).toBe(50);
    });

    it('NÃO deve adicionar top_k quando não fornecido', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Test' },
      ];
      const options: UniversalOptions = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      };

      const result = adapter.formatRequest(messages, options);

      expect(result.body.top_k).toBeUndefined();
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

    it('deve retornar error para chunk com error property', () => {
      const chunk = {
        error: 'Something went wrong',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'error',
        error: 'Something went wrong',
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
      const result = adapter.parseChunk(null);

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

    it('deve retornar chunk vazio para content_block_delta sem delta', () => {
      const chunk = {
        type: 'content_block_delta',
      };
      const result = adapter.parseChunk(chunk);

      expect(result).toEqual({
        type: 'chunk',
        content: '',
      });
    });
  });
});
