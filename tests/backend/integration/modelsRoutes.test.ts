// tests/backend/integration/modelsRoutes.test.ts
// Standards: docs/STANDARDS.md

import request from 'supertest';
import express, { Express } from 'express';
import modelsRoutes from '../../../backend/src/routes/modelsRoutes';

// Import dos modelos para popular o registry
import '../../../backend/src/services/ai/registry/models/anthropic.models';
import '../../../backend/src/services/ai/registry/models/amazon.models';
import '../../../backend/src/services/ai/registry/models/cohere.models';

describe('Models Routes - Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app para testes
    app = express();
    app.use(express.json());
    app.use('/api/models', modelsRoutes);
  });

  afterEach(() => {
    // Limpa cache entre testes
    return request(app).delete('/api/models/capabilities/cache');
  });

  describe('GET /api/models/:modelId/capabilities', () => {
    it('deve retornar capabilities corretas para modelo Anthropic (sem topK)', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();

      const capabilities = response.body.data;

      // Anthropic NÃO suporta topK
      expect(capabilities.topK.enabled).toBe(false);

      // Anthropic suporta topP
      expect(capabilities.topP.enabled).toBe(true);
      expect(capabilities.topP.min).toBe(0);
      expect(capabilities.topP.max).toBe(1);
      expect(capabilities.topP.default).toBe(0.999);

      // Anthropic suporta temperature
      expect(capabilities.temperature.enabled).toBe(true);
      expect(capabilities.temperature.min).toBe(0);
      expect(capabilities.temperature.max).toBe(1);
      expect(capabilities.temperature.default).toBe(1);

      // Verifica outras capabilities
      expect(capabilities.streaming.enabled).toBe(true);
      expect(capabilities.vision.enabled).toBe(true);
      expect(capabilities.functionCalling.enabled).toBe(true);
      expect(capabilities.systemPrompt.enabled).toBe(true);
      expect(capabilities.requiresInferenceProfile).toBe(true);

      // Verifica metadata
      expect(capabilities._meta).toBeDefined();
      expect(capabilities._meta.cached).toBe(false);
      expect(capabilities._meta.responseTime).toBeDefined();
    });

    it('deve retornar capabilities corretas para modelo Amazon (com topK)', async () => {
      const modelId = 'amazon.titan-text-express-v1';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();

      const capabilities = response.body.data;

      // Amazon suporta topK
      expect(capabilities.topK.enabled).toBe(true);
      expect(capabilities.topK.min).toBe(1);
      expect(capabilities.topK.max).toBe(500);
      expect(capabilities.topK.default).toBe(250);

      // Amazon suporta topP
      expect(capabilities.topP.enabled).toBe(true);
      expect(capabilities.topP.default).toBe(0.9);

      // Amazon suporta temperature
      expect(capabilities.temperature.enabled).toBe(true);
      expect(capabilities.temperature.default).toBe(0.7);

      // Verifica outras capabilities
      expect(capabilities.streaming.enabled).toBe(true);
      expect(capabilities.requiresInferenceProfile).toBe(false);
    });

    it('deve retornar capabilities corretas para modelo Cohere (com topK)', async () => {
      const modelId = 'cohere.command-r-v1:0';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();

      const capabilities = response.body.data;

      // Cohere suporta topK
      expect(capabilities.topK.enabled).toBe(true);
      expect(capabilities.topK.min).toBe(0);
      expect(capabilities.topK.max).toBe(500);
      expect(capabilities.topK.default).toBe(0);

      // Cohere suporta topP
      expect(capabilities.topP.enabled).toBe(true);
      expect(capabilities.topP.default).toBe(0.75);

      // Cohere suporta temperature
      expect(capabilities.temperature.enabled).toBe(true);
      expect(capabilities.temperature.default).toBe(0.3);

      // Verifica outras capabilities
      expect(capabilities.functionCalling.enabled).toBe(true);
    });

    it('deve retornar 404 para modelo inexistente', async () => {
      const modelId = 'invalid.model-id';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.modelId).toBe(modelId);
      expect(response.body.data.message).toContain('not found');
      expect(response.body.data.availableModels).toBeDefined();
      expect(Array.isArray(response.body.data.availableModels)).toBe(true);
    });

    it('deve usar cache na segunda requisição', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

      // Primeira requisição (cache miss)
      const response1 = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response1.body.data._meta.cached).toBe(false);

      // Segunda requisição (cache hit)
      const response2 = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response2.body.data._meta.cached).toBe(true);
      expect(response2.body.data._meta.cacheAge).toBeDefined();
      expect(response2.body.data._meta.cacheAge).toBeGreaterThanOrEqual(0);

      // Verifica que as capabilities são idênticas
      const { _meta: meta1, ...caps1 } = response1.body.data;
      const { _meta: meta2, ...caps2 } = response2.body.data;
      expect(caps1).toEqual(caps2);
    });

    it('deve ter performance < 50ms com cache', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

      // Primeira requisição para popular cache
      await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      // Segunda requisição (com cache) - deve ser rápida
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response.body.data._meta.cached).toBe(true);
      expect(response.body.data._meta.responseTime).toBeLessThan(50);
    });
  });

  describe('GET /api/models/capabilities', () => {
    it('deve retornar capabilities de todos os modelos', async () => {
      const response = await request(app)
        .get('/api/models/capabilities')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.models).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
      expect(response.body.data._meta).toBeDefined();
      expect(response.body.data._meta.responseTime).toBeDefined();
      expect(response.body.data._meta.cacheSize).toBeDefined();

      // Verifica que retornou capabilities para múltiplos modelos
      const models = response.body.data.models;
      expect(Object.keys(models).length).toBeGreaterThan(0);

      // Verifica estrutura de uma capability
      const firstModelId = Object.keys(models)[0];
      const firstCapabilities = models[firstModelId];
      expect(firstCapabilities.temperature).toBeDefined();
      expect(firstCapabilities.topK).toBeDefined();
      expect(firstCapabilities.topP).toBeDefined();
      expect(firstCapabilities.maxTokens).toBeDefined();
    });
  });

  describe('DELETE /api/models/capabilities/cache', () => {
    it('deve limpar o cache com sucesso', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

      // Popular cache
      await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      // Limpar cache
      const response = await request(app)
        .delete('/api/models/capabilities/cache')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.message).toContain('cleared');
      expect(response.body.data.entriesRemoved).toBeGreaterThanOrEqual(0);

      // Verificar que próxima requisição não usa cache
      const response2 = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      expect(response2.body.data._meta.cached).toBe(false);
    });
  });

  describe('Vendor-specific rules', () => {
    it('deve aplicar regras corretas para Anthropic', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      const caps = response.body.data;

      // Anthropic: topK disabled
      expect(caps.topK.enabled).toBe(false);

      // Anthropic: temperature default = 1
      expect(caps.temperature.default).toBe(1);

      // Anthropic: topP default = 0.999
      expect(caps.topP.default).toBe(0.999);

      // Anthropic: stopSequences max = 4
      expect(caps.stopSequences.max).toBe(4);
    });

    it('deve aplicar regras corretas para Amazon', async () => {
      const modelId = 'amazon.titan-text-express-v1';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      const caps = response.body.data;

      // Amazon: topK enabled
      expect(caps.topK.enabled).toBe(true);
      expect(caps.topK.min).toBe(1);
      expect(caps.topK.max).toBe(500);
      expect(caps.topK.default).toBe(250);

      // Amazon: temperature default = 0.7
      expect(caps.temperature.default).toBe(0.7);

      // Amazon: topP default = 0.9
      expect(caps.topP.default).toBe(0.9);
    });

    it('deve aplicar regras corretas para Cohere', async () => {
      const modelId = 'cohere.command-r-v1:0';
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);

      const caps = response.body.data;

      // Cohere: topK enabled com min = 0
      expect(caps.topK.enabled).toBe(true);
      expect(caps.topK.min).toBe(0);
      expect(caps.topK.default).toBe(0);

      // Cohere: temperature default = 0.3
      expect(caps.temperature.default).toBe(0.3);

      // Cohere: topP default = 0.75
      expect(caps.topP.default).toBe(0.75);
    });
  });

  describe('Error handling', () => {
    it('deve retornar 404 para modelo inexistente', async () => {
      // Testa com modelId que não existe no registry
      const response = await request(app)
        .get('/api/models/invalid-model-id/capabilities')
        .expect(404);

      // Deve retornar fail para modelo não encontrado
      expect(response.body.status).toBe('fail');
      expect(response.body.data.message).toContain('not found');
    });
  });

  describe('Performance benchmarks', () => {
    it('deve processar requisição sem cache em tempo razoável', async () => {
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      
      // Limpa cache primeiro
      await request(app).delete('/api/models/capabilities/cache');

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/models/${modelId}/capabilities`)
        .expect(200);
      const elapsed = Date.now() - startTime;

      // Sem cache, deve ser < 100ms
      expect(elapsed).toBeLessThan(100);
      expect(response.body.data._meta.responseTime).toBeLessThan(100);
    });

    it('deve processar múltiplas requisições em paralelo', async () => {
      const modelIds = [
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'amazon.titan-text-express-v1',
        'cohere.command-r-v1:0',
      ];

      const startTime = Date.now();
      const promises = modelIds.map(modelId =>
        request(app).get(`/api/models/${modelId}/capabilities`)
      );

      const responses = await Promise.all(promises);
      const elapsed = Date.now() - startTime;

      // Todas devem ter sucesso
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });

      // Processamento paralelo deve ser eficiente
      expect(elapsed).toBeLessThan(500);
    });
  });
});
