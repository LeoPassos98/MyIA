// backend/src/__tests__/integration/api/models-v2.integration.test.ts
// Standards: docs/STANDARDS.md

import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, ProviderType, InferenceType } from '@prisma/client';
import { modelsRouter, deploymentsRouter, providersRouter } from '../../../routes/modelsRoutes-v2';
import { errorHandler } from '../../../middleware/errorHandler';

// ============================================================================
// TEST SETUP
// ============================================================================

const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error']
});

// JWT Secret para testes (deve corresponder ao .env de teste)
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-integration-tests-min-32-chars';

/**
 * Gera um token JWT válido para testes
 */
function generateTestToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Cria um usuário de teste e retorna o token
 */
async function createTestUser(): Promise<{ userId: string; token: string }> {
  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@integration.test`,
      password: 'hashed-password-not-used-in-tests',
      name: 'Test User'
    }
  });
  const token = generateTestToken(user.id, user.email);
  return { userId: user.id, token };
}

/**
 * Cria um provider de teste
 */
async function createTestProvider(slug?: string): Promise<{ id: string; slug: string }> {
  const uniqueSlug = slug || `test-provider-${Date.now()}`;
  const provider = await prisma.provider.create({
    data: {
      name: `Test Provider ${Date.now()}`,
      slug: uniqueSlug,
      type: ProviderType.AWS_BEDROCK,
      isActive: true
    }
  });
  return { id: provider.id, slug: provider.slug };
}

/**
 * Cria um modelo base de teste
 */
async function createTestBaseModel(name?: string): Promise<{ id: string; name: string }> {
  const uniqueName = name || `Test Model ${Date.now()}`;
  const model = await prisma.baseModel.create({
    data: {
      name: uniqueName,
      vendor: 'Test Vendor',
      family: 'Test Family',
      version: '1.0',
      capabilities: {
        streaming: true,
        vision: false,
        functionCalling: true,
        maxContextWindow: 128000,
        maxOutputTokens: 4096
      },
      defaultParams: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2048
      },
      description: 'Test model for integration tests',
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
  const uniqueDeploymentId = deploymentId || `test-deployment-${Date.now()}`;
  const deployment = await prisma.modelDeployment.create({
    data: {
      baseModelId,
      providerId,
      deploymentId: uniqueDeploymentId,
      inferenceType: InferenceType.ON_DEMAND,
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
  // Deletar em ordem reversa de dependências
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
  await prisma.user.deleteMany({
    where: { email: { contains: '@integration.test' } }
  });
}

// ============================================================================
// TEST SUITE: Models API v2
// ============================================================================

describe('Models API v2 - Integration Tests', () => {
  let app: Express;
  let testUser: { userId: string; token: string };
  let testProvider: { id: string; slug: string };

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

    // Criar usuário e provider de teste
    testUser = await createTestUser();
    testProvider = await createTestProvider();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // ==========================================================================
  // GET /api/v2/models - Listar modelos
  // ==========================================================================

  describe('GET /api/v2/models', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestBaseModel();
    });

    it('deve listar modelos com paginação padrão', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.models).toBeDefined();
      expect(Array.isArray(response.body.data.models)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('deve filtrar modelos por vendor', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .query({ vendor: 'Test Vendor' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.models.length).toBeGreaterThan(0);
      response.body.data.models.forEach((model: { vendor: string }) => {
        expect(model.vendor).toBe('Test Vendor');
      });
    });

    it('deve filtrar modelos por family', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .query({ family: 'Test Family' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.models.forEach((model: { family: string }) => {
        expect(model.family).toBe('Test Family');
      });
    });

    it('deve aplicar paginação customizada', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .query({ page: '1', limit: '5' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.models.length).toBeLessThanOrEqual(5);
    });

    it('deve buscar modelos por texto (search)', async () => {
      const response = await request(app)
        .get('/api/v2/models')
        .query({ search: 'Test Model' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.models.length).toBeGreaterThan(0);
    });

    it('deve incluir deployments quando solicitado', async () => {
      // Criar deployment para o modelo de teste
      await createTestDeployment(testModel.id, testProvider.id);

      const response = await request(app)
        .get('/api/v2/models')
        .query({ includeDeployments: 'true', vendor: 'Test Vendor' })
        .expect(200);

      expect(response.body.status).toBe('success');
      const modelWithDeployments = response.body.data.models.find(
        (m: { id: string }) => m.id === testModel.id
      );
      if (modelWithDeployments) {
        expect(modelWithDeployments.deployments).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // GET /api/v2/models/:id - Buscar modelo por ID
  // ==========================================================================

  describe('GET /api/v2/models/:id', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestBaseModel(`Test Model GetById ${Date.now()}`);
    });

    it('deve retornar modelo por ID válido', async () => {
      const response = await request(app)
        .get(`/api/v2/models/${testModel.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testModel.id);
      expect(response.body.data.name).toBe(testModel.name);
      expect(response.body.data.vendor).toBe('Test Vendor');
      expect(response.body.data.capabilities).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v2/models/${fakeId}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.id).toBe('Model not found');
    });

    it('deve incluir deployments quando solicitado', async () => {
      await createTestDeployment(testModel.id, testProvider.id, `test-deployment-getbyid-${Date.now()}`);

      const response = await request(app)
        .get(`/api/v2/models/${testModel.id}`)
        .query({ includeDeployments: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deployments).toBeDefined();
      expect(Array.isArray(response.body.data.deployments)).toBe(true);
    });
  });

  // ==========================================================================
  // POST /api/v2/models - Criar modelo
  // ==========================================================================

  describe('POST /api/v2/models', () => {
    it('deve criar modelo com dados válidos (autenticado)', async () => {
      const modelData = {
        name: `Test Model Create ${Date.now()}`,
        vendor: 'Test Vendor',
        family: 'Test Family',
        version: '2.0',
        capabilities: {
          streaming: true,
          vision: true,
          functionCalling: false,
          maxContextWindow: 200000,
          maxOutputTokens: 8192
        },
        defaultParams: {
          temperature: 0.5,
          topP: 0.95,
          maxTokens: 4096
        },
        description: 'Created via integration test'
      };

      const response = await request(app)
        .post('/api/v2/models')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(modelData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(modelData.name);
      expect(response.body.data.vendor).toBe(modelData.vendor);
      expect(response.body.data.capabilities.streaming).toBe(true);
      expect(response.body.data.capabilities.vision).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const modelData = {
        name: `Test Model NoAuth ${Date.now()}`,
        vendor: 'Test Vendor',
        capabilities: { streaming: true }
      };

      const response = await request(app)
        .post('/api/v2/models')
        .send(modelData)
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 409 para nome duplicado', async () => {
      const existingModel = await createTestBaseModel(`Test Model Duplicate ${Date.now()}`);

      const modelData = {
        name: existingModel.name,
        vendor: 'Test Vendor',
        capabilities: { streaming: true }
      };

      const response = await request(app)
        .post('/api/v2/models')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(modelData)
        .expect(409);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.name).toContain('already exists');
    });

    it('deve validar campos obrigatórios', async () => {
      const invalidData = {
        // name é obrigatório mas está faltando
        vendor: 'Test Vendor'
      };

      const response = await request(app)
        .post('/api/v2/models')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  // ==========================================================================
  // PUT /api/v2/models/:id - Atualizar modelo
  // ==========================================================================

  describe('PUT /api/v2/models/:id', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestBaseModel(`Test Model Update ${Date.now()}`);
    });

    it('deve atualizar modelo com dados válidos (autenticado)', async () => {
      const updateData = {
        description: 'Updated description via integration test',
        version: '2.1'
      };

      const response = await request(app)
        .put(`/api/v2/models/${testModel.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.version).toBe(updateData.version);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .put(`/api/v2/models/${testModel.id}`)
        .send({ description: 'Should fail' })
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/v2/models/${fakeId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ description: 'Should fail' })
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('deve atualizar capabilities parcialmente', async () => {
      const updateData = {
        capabilities: {
          streaming: false,
          vision: true
        }
      };

      const response = await request(app)
        .put(`/api/v2/models/${testModel.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.capabilities.streaming).toBe(false);
      expect(response.body.data.capabilities.vision).toBe(true);
    });
  });

  // ==========================================================================
  // DELETE /api/v2/models/:id - Deletar modelo
  // ==========================================================================

  describe('DELETE /api/v2/models/:id', () => {
    it('deve fazer soft delete do modelo (autenticado)', async () => {
      const modelToDelete = await createTestBaseModel(`Test Model SoftDelete ${Date.now()}`);

      const response = await request(app)
        .delete(`/api/v2/models/${modelToDelete.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deprecated).toBe(true);
    });

    it('deve fazer hard delete quando solicitado', async () => {
      const modelToDelete = await createTestBaseModel(`Test Model HardDelete ${Date.now()}`);

      const response = await request(app)
        .delete(`/api/v2/models/${modelToDelete.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ hard: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deleted).toBe(true);

      // Verificar que foi realmente deletado
      const checkResponse = await request(app)
        .get(`/api/v2/models/${modelToDelete.id}`)
        .expect(404);

      expect(checkResponse.body.status).toBe('fail');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const modelToDelete = await createTestBaseModel(`Test Model NoAuthDelete ${Date.now()}`);

      const response = await request(app)
        .delete(`/api/v2/models/${modelToDelete.id}`)
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v2/models/${fakeId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });
  });

  // ==========================================================================
  // GET /api/v2/models/capabilities - Buscar por capabilities
  // ==========================================================================

  describe('GET /api/v2/models/capabilities', () => {
    beforeAll(async () => {
      // Criar modelos com diferentes capabilities
      await prisma.baseModel.create({
        data: {
          name: `Test Model Vision ${Date.now()}`,
          vendor: 'Test Vendor',
          capabilities: {
            streaming: true,
            vision: true,
            functionCalling: false
          }
        }
      });

      await prisma.baseModel.create({
        data: {
          name: `Test Model FunctionCalling ${Date.now()}`,
          vendor: 'Test Vendor',
          capabilities: {
            streaming: true,
            vision: false,
            functionCalling: true
          }
        }
      });
    });

    it('deve filtrar modelos com streaming', async () => {
      const response = await request(app)
        .get('/api/v2/models/capabilities')
        .query({ streaming: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.models).toBeDefined();
    });

    it('deve filtrar modelos com vision', async () => {
      const response = await request(app)
        .get('/api/v2/models/capabilities')
        .query({ vision: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('deve filtrar modelos com functionCalling', async () => {
      const response = await request(app)
        .get('/api/v2/models/capabilities')
        .query({ functionCalling: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('deve aplicar múltiplos filtros de capabilities', async () => {
      const response = await request(app)
        .get('/api/v2/models/capabilities')
        .query({ streaming: 'true', vision: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /api/v2/models/provider/:providerId - Modelos por provider
  // ==========================================================================

  describe('GET /api/v2/models/provider/:providerId', () => {
    let modelForProvider: { id: string; name: string };

    beforeAll(async () => {
      modelForProvider = await createTestBaseModel(`Test Model Provider ${Date.now()}`);
      await createTestDeployment(
        modelForProvider.id,
        testProvider.id,
        `test-deployment-provider-${Date.now()}`
      );
    });

    it('deve listar modelos de um provider específico', async () => {
      const response = await request(app)
        .get(`/api/v2/models/provider/${testProvider.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.models).toBeDefined();
      expect(Array.isArray(response.body.data.models)).toBe(true);
    });

    it('deve filtrar por isActive', async () => {
      const response = await request(app)
        .get(`/api/v2/models/provider/${testProvider.id}`)
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('deve aplicar paginação', async () => {
      const response = await request(app)
        .get(`/api/v2/models/provider/${testProvider.id}`)
        .query({ page: '1', limit: '10' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
});
