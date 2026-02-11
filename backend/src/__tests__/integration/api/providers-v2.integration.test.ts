// backend/src/__tests__/integration/api/providers-v2.integration.test.ts
// Standards: docs/STANDARDS.md

import request from 'supertest';
import express, { Express } from 'express';
import { PrismaClient, ProviderType } from '@prisma/client';
import { modelsRouter, deploymentsRouter, providersRouter } from '../../../routes/modelsRoutes-v2';
import { errorHandler } from '../../../middleware/errorHandler';

// ============================================================================
// TEST SETUP
// ============================================================================

const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Cria um provider de teste
 */
async function createTestProvider(options?: {
  slug?: string;
  name?: string;
  type?: ProviderType;
  isActive?: boolean;
}): Promise<{ id: string; slug: string; name: string }> {
  const uniqueSlug = options?.slug || `test-provider-${Date.now()}`;
  const provider = await prisma.provider.create({
    data: {
      name: options?.name || `Test Provider ${Date.now()}`,
      slug: uniqueSlug,
      type: options?.type || ProviderType.AWS_BEDROCK,
      isActive: options?.isActive ?? true
    }
  });
  return { id: provider.id, slug: provider.slug, name: provider.name };
}

/**
 * Cria um modelo base de teste
 */
async function createTestBaseModel(name?: string): Promise<{ id: string; name: string }> {
  const uniqueName = name || `Test Provider Model ${Date.now()}`;
  const model = await prisma.baseModel.create({
    data: {
      name: uniqueName,
      vendor: 'Test Vendor',
      capabilities: { streaming: true },
      deprecated: false
    }
  });
  return { id: model.id, name: model.name };
}

/**
 * Cria um deployment de teste
 */
async function createTestDeployment(
  baseModelId: string,
  providerId: string,
  deploymentId?: string
): Promise<{ id: string; deploymentId: string }> {
  const uniqueDeploymentId = deploymentId || `test-provider-deployment-${Date.now()}`;
  const deployment = await prisma.modelDeployment.create({
    data: {
      baseModelId,
      providerId,
      deploymentId: uniqueDeploymentId,
      costPer1MInput: 3.0,
      costPer1MOutput: 15.0,
      isActive: true
    }
  });
  return { id: deployment.id, deploymentId: deployment.deploymentId };
}

/**
 * Limpa dados de teste
 */
async function cleanupTestData(): Promise<void> {
  await prisma.modelCertification.deleteMany({
    where: { deployment: { deploymentId: { startsWith: 'test-' } } }
  });
  await prisma.modelDeployment.deleteMany({
    where: { deploymentId: { startsWith: 'test-' } }
  });
  await prisma.baseModel.deleteMany({
    where: { name: { startsWith: 'Test ' } }
  });
  await prisma.provider.deleteMany({
    where: { slug: { startsWith: 'test-' } }
  });
}

// ============================================================================
// TEST SUITE: Providers API v2
// ============================================================================

describe('Providers API v2 - Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Setup Express app para testes
    app = express();
    app.use(express.json());
    app.use('/api/v2/models', modelsRouter);
    app.use('/api/v2/deployments', deploymentsRouter);
    app.use('/api/v2/providers', providersRouter);
    app.use(errorHandler);

    // Conectar ao banco
    await prisma.$connect();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // ==========================================================================
  // GET /api/v2/providers - Listar providers
  // ==========================================================================

  describe('GET /api/v2/providers', () => {
    beforeAll(async () => {
      // Criar providers de teste
      await createTestProvider({ slug: `test-list-provider-1-${Date.now()}`, name: 'Test List Provider 1' });
      await createTestProvider({ slug: `test-list-provider-2-${Date.now()}`, name: 'Test List Provider 2' });
      await createTestProvider({ 
        slug: `test-inactive-provider-${Date.now()}`, 
        name: 'Test Inactive Provider',
        isActive: false 
      });
    });

    it('deve listar providers com paginação padrão', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.providers).toBeDefined();
      expect(Array.isArray(response.body.data.providers)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('deve filtrar providers por isActive', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.providers.forEach((p: { isActive: boolean }) => {
        expect(p.isActive).toBe(true);
      });
    });

    it('deve filtrar providers inativos', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ isActive: 'false' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.providers.forEach((p: { isActive: boolean }) => {
        expect(p.isActive).toBe(false);
      });
    });

    it('deve buscar providers por texto (search)', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ search: 'Test List' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.providers.length).toBeGreaterThan(0);
    });

    it('deve aplicar paginação customizada', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ page: '1', limit: '5' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.providers.length).toBeLessThanOrEqual(5);
    });

    it('deve ordenar providers por nome', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .expect(200);

      expect(response.body.status).toBe('success');
      const providers = response.body.data.providers;
      for (let i = 1; i < providers.length; i++) {
        expect(providers[i].name.localeCompare(providers[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve retornar totalPages correto', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ limit: '2' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.totalPages).toBeDefined();
      expect(response.body.data.pagination.total).toBeDefined();
      expect(response.body.data.pagination.totalPages).toBe(
        Math.ceil(response.body.data.pagination.total / 2)
      );
    });
  });

  // ==========================================================================
  // GET /api/v2/providers/:id - Buscar provider por ID
  // ==========================================================================

  describe('GET /api/v2/providers/:id', () => {
    let testProvider: { id: string; slug: string; name: string };

    beforeAll(async () => {
      testProvider = await createTestProvider({ 
        slug: `test-getbyid-provider-${Date.now()}`,
        name: 'Test GetById Provider'
      });
    });

    it('deve retornar provider por ID válido', async () => {
      const response = await request(app)
        .get(`/api/v2/providers/${testProvider.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testProvider.id);
      expect(response.body.data.slug).toBe(testProvider.slug);
      expect(response.body.data.name).toBe(testProvider.name);
      expect(response.body.data.type).toBe('AWS_BEDROCK');
      expect(response.body.data.isActive).toBe(true);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v2/providers/${fakeId}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.id).toBe('Provider not found');
    });

    it('deve incluir deployments quando solicitado', async () => {
      // Criar modelo e deployment para o provider
      const model = await createTestBaseModel(`Test Model for Provider ${Date.now()}`);
      await createTestDeployment(model.id, testProvider.id, `test-provider-deploy-${Date.now()}`);

      const response = await request(app)
        .get(`/api/v2/providers/${testProvider.id}`)
        .query({ includeDeployments: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deployments).toBeDefined();
      expect(Array.isArray(response.body.data.deployments)).toBe(true);
      expect(response.body.data.deployments.length).toBeGreaterThan(0);
    });

    it('deve não incluir deployments por padrão', async () => {
      const response = await request(app)
        .get(`/api/v2/providers/${testProvider.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deployments).toBeUndefined();
    });

    it('deve retornar todos os campos do provider', async () => {
      const response = await request(app)
        .get(`/api/v2/providers/${testProvider.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('slug');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('isActive');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });

  // ==========================================================================
  // Testes de diferentes tipos de provider
  // ==========================================================================

  describe('Provider Types', () => {
    it('deve criar e listar provider AWS_BEDROCK', async () => {
      const provider = await createTestProvider({
        slug: `test-bedrock-${Date.now()}`,
        name: 'Test Bedrock Provider',
        type: ProviderType.AWS_BEDROCK
      });

      const response = await request(app)
        .get(`/api/v2/providers/${provider.id}`)
        .expect(200);

      expect(response.body.data.type).toBe('AWS_BEDROCK');
    });

    it('deve criar e listar provider AZURE_OPENAI', async () => {
      const provider = await createTestProvider({
        slug: `test-azure-${Date.now()}`,
        name: 'Test Azure Provider',
        type: ProviderType.AZURE_OPENAI
      });

      const response = await request(app)
        .get(`/api/v2/providers/${provider.id}`)
        .expect(200);

      expect(response.body.data.type).toBe('AZURE_OPENAI');
    });

    it('deve criar e listar provider OPENAI_DIRECT', async () => {
      const provider = await createTestProvider({
        slug: `test-openai-${Date.now()}`,
        name: 'Test OpenAI Provider',
        type: ProviderType.OPENAI_DIRECT
      });

      const response = await request(app)
        .get(`/api/v2/providers/${provider.id}`)
        .expect(200);

      expect(response.body.data.type).toBe('OPENAI_DIRECT');
    });

    it('deve criar e listar provider GOOGLE_VERTEX', async () => {
      const provider = await createTestProvider({
        slug: `test-vertex-${Date.now()}`,
        name: 'Test Vertex Provider',
        type: ProviderType.GOOGLE_VERTEX
      });

      const response = await request(app)
        .get(`/api/v2/providers/${provider.id}`)
        .expect(200);

      expect(response.body.data.type).toBe('GOOGLE_VERTEX');
    });
  });

  // ==========================================================================
  // Testes de performance
  // ==========================================================================

  describe('Performance', () => {
    it('deve responder em tempo razoável para listagem', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v2/providers')
        .expect(200);
      const elapsed = Date.now() - startTime;

      expect(response.body.status).toBe('success');
      expect(elapsed).toBeLessThan(500); // Menos de 500ms
    });

    it('deve responder em tempo razoável para busca por ID', async () => {
      const provider = await createTestProvider({
        slug: `test-perf-${Date.now()}`,
        name: 'Test Performance Provider'
      });

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/v2/providers/${provider.id}`)
        .expect(200);
      const elapsed = Date.now() - startTime;

      expect(response.body.status).toBe('success');
      expect(elapsed).toBeLessThan(200); // Menos de 200ms
    });

    it('deve processar múltiplas requisições em paralelo', async () => {
      const providers = await Promise.all([
        createTestProvider({ slug: `test-parallel-1-${Date.now()}` }),
        createTestProvider({ slug: `test-parallel-2-${Date.now()}` }),
        createTestProvider({ slug: `test-parallel-3-${Date.now()}` })
      ]);

      const startTime = Date.now();
      const responses = await Promise.all(
        providers.map(p => request(app).get(`/api/v2/providers/${p.id}`))
      );
      const elapsed = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });

      expect(elapsed).toBeLessThan(500); // Todas em menos de 500ms
    });
  });

  // ==========================================================================
  // Testes de edge cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('deve lidar com página inexistente', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ page: '9999' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.providers).toEqual([]);
      expect(response.body.data.pagination.page).toBe(9999);
    });

    it('deve lidar com limite muito grande', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ limit: '1000' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.limit).toBe(1000);
    });

    it('deve lidar com search vazio', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ search: '' })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('deve lidar com search sem resultados', async () => {
      const response = await request(app)
        .get('/api/v2/providers')
        .query({ search: 'XXXXXXXXXXXXXXXXXXXXXXXX' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.providers).toEqual([]);
    });

    it('deve retornar erro para UUID inválido', async () => {
      const response = await request(app)
        .get('/api/v2/providers/invalid-uuid')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });
});
