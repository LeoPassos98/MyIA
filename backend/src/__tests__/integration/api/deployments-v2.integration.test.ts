// backend/src/__tests__/integration/api/deployments-v2.integration.test.ts
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

// JWT Secret para testes
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
      email: `test-deploy-${Date.now()}@integration.test`,
      password: 'hashed-password-not-used-in-tests',
      name: 'Test User Deployments'
    }
  });
  const token = generateTestToken(user.id, user.email);
  return { userId: user.id, token };
}

/**
 * Cria um provider de teste
 */
async function createTestProvider(slug?: string): Promise<{ id: string; slug: string; name: string }> {
  const uniqueSlug = slug || `test-deploy-provider-${Date.now()}`;
  const provider = await prisma.provider.create({
    data: {
      name: `Test Deploy Provider ${Date.now()}`,
      slug: uniqueSlug,
      type: ProviderType.AWS_BEDROCK,
      isActive: true
    }
  });
  return { id: provider.id, slug: provider.slug, name: provider.name };
}

/**
 * Cria um modelo base de teste
 */
async function createTestBaseModel(name?: string): Promise<{ id: string; name: string }> {
  const uniqueName = name || `Test Deploy Model ${Date.now()}`;
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
  deploymentId?: string,
  options?: {
    inferenceType?: InferenceType;
    isActive?: boolean;
    costPer1MInput?: number;
    costPer1MOutput?: number;
  }
): Promise<{ id: string; deploymentId: string }> {
  const uniqueDeploymentId = deploymentId || `test-deployment-${Date.now()}`;
  const deployment = await prisma.modelDeployment.create({
    data: {
      baseModelId,
      providerId,
      deploymentId: uniqueDeploymentId,
      inferenceType: options?.inferenceType || InferenceType.ON_DEMAND,
      costPer1MInput: options?.costPer1MInput ?? 3.0,
      costPer1MOutput: options?.costPer1MOutput ?? 15.0,
      isActive: options?.isActive ?? true
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
  await prisma.user.deleteMany({
    where: { email: { contains: '@integration.test' } }
  });
}

// ============================================================================
// TEST SUITE: Deployments API v2
// ============================================================================

describe('Deployments API v2 - Integration Tests', () => {
  let app: Express;
  let testUser: { userId: string; token: string };
  let testProvider: { id: string; slug: string; name: string };
  let testBaseModel: { id: string; name: string };

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

    // Criar dados de teste base uma vez para toda a suite
    testUser = await createTestUser();
    testProvider = await createTestProvider();
    testBaseModel = await createTestBaseModel();
  });

  afterAll(async () => {
    // Limpar dados após todos os testes
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // ==========================================================================
  // GET /api/v2/deployments - Listar deployments
  // ==========================================================================

  describe('GET /api/v2/deployments', () => {
    it('deve listar deployments com paginação padrão', async () => {
      // Criar deployments para o teste
      await createTestDeployment(testBaseModel.id, testProvider.id, `test-list-deploy-1-${Date.now()}`);
      await createTestDeployment(testBaseModel.id, testProvider.id, `test-list-deploy-2-${Date.now()}`);

      const response = await request(app)
        .get('/api/v2/deployments')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deployments).toBeDefined();
      expect(Array.isArray(response.body.data.deployments)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('deve filtrar deployments por baseModelId', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ baseModelId: testBaseModel.id })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.deployments.forEach((d: { baseModelId: string }) => {
        expect(d.baseModelId).toBe(testBaseModel.id);
      });
    });

    it('deve filtrar deployments por providerId', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ providerId: testProvider.id })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.deployments.forEach((d: { providerId: string }) => {
        expect(d.providerId).toBe(testProvider.id);
      });
    });

    it('deve filtrar deployments por inferenceType', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ inferenceType: 'ON_DEMAND' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.deployments.forEach((d: { inferenceType: string }) => {
        expect(d.inferenceType).toBe('ON_DEMAND');
      });
    });

    it('deve filtrar deployments por isActive', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.deployments.forEach((d: { isActive: boolean }) => {
        expect(d.isActive).toBe(true);
      });
    });

    it('deve aplicar paginação customizada', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ page: '1', limit: '5' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.deployments.length).toBeLessThanOrEqual(5);
    });

    it('deve incluir baseModel quando solicitado', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ includeBaseModel: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      if (response.body.data.deployments.length > 0) {
        expect(response.body.data.deployments[0].baseModel).toBeDefined();
      }
    });

    it('deve incluir provider quando solicitado', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ includeProvider: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      if (response.body.data.deployments.length > 0) {
        expect(response.body.data.deployments[0].provider).toBeDefined();
      }
    });

    it('deve ordenar por costPer1MInput', async () => {
      const response = await request(app)
        .get('/api/v2/deployments')
        .query({ orderBy: 'costPer1MInput', order: 'asc' })
        .expect(200);

      expect(response.body.status).toBe('success');
      const deployments = response.body.data.deployments;
      for (let i = 1; i < deployments.length; i++) {
        expect(deployments[i].costPer1MInput).toBeGreaterThanOrEqual(deployments[i - 1].costPer1MInput);
      }
    });
  });

  // ==========================================================================
  // GET /api/v2/deployments/:id - Buscar deployment por ID
  // ==========================================================================

  describe('GET /api/v2/deployments/:id', () => {
    it('deve retornar deployment por ID válido', async () => {
      const testDeployment = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-getbyid-deploy-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/${testDeployment.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testDeployment.id);
      expect(response.body.data.deploymentId).toBe(testDeployment.deploymentId);
      expect(response.body.data.costPer1MInput).toBeDefined();
      expect(response.body.data.costPer1MOutput).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v2/deployments/${fakeId}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.id).toBe('Deployment not found');
    });

    it('deve incluir baseModel quando solicitado', async () => {
      const testDeployment = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-include-basemodel-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/${testDeployment.id}`)
        .query({ includeBaseModel: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.baseModel).toBeDefined();
      expect(response.body.data.baseModel.id).toBe(testBaseModel.id);
    });

    it('deve incluir provider quando solicitado', async () => {
      const testDeployment = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-include-provider-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/${testDeployment.id}`)
        .query({ includeProvider: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.provider).toBeDefined();
      expect(response.body.data.provider.id).toBe(testProvider.id);
    });

    it('deve incluir certifications quando solicitado', async () => {
      const testDeployment = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-include-certs-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/${testDeployment.id}`)
        .query({ includeCertifications: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.certifications).toBeDefined();
      expect(Array.isArray(response.body.data.certifications)).toBe(true);
    });
  });

  // ==========================================================================
  // GET /api/v2/deployments/active - Listar deployments ativos
  // ==========================================================================

  describe('GET /api/v2/deployments/active', () => {
    it('deve listar apenas deployments ativos', async () => {
      await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-active-deploy-${Date.now()}`,
        { isActive: true }
      );
      await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-inactive-deploy-${Date.now()}`,
        { isActive: false }
      );

      const response = await request(app)
        .get('/api/v2/deployments/active')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deployments).toBeDefined();
      response.body.data.deployments.forEach((d: { isActive: boolean }) => {
        expect(d.isActive).toBe(true);
      });
    });

    it('deve incluir baseModel e provider', async () => {
      const response = await request(app)
        .get('/api/v2/deployments/active')
        .expect(200);

      expect(response.body.status).toBe('success');
      if (response.body.data.deployments.length > 0) {
        expect(response.body.data.deployments[0].baseModel).toBeDefined();
        expect(response.body.data.deployments[0].provider).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // GET /api/v2/deployments/model/:modelId - Deployments por modelo
  // ==========================================================================

  describe('GET /api/v2/deployments/model/:modelId', () => {
    it('deve listar deployments de um modelo específico', async () => {
      const modelForDeployments = await createTestBaseModel(`Test Model ForDeployments ${Date.now()}`);
      await createTestDeployment(
        modelForDeployments.id,
        testProvider.id,
        `test-model-deploy-1-${Date.now()}`
      );
      await createTestDeployment(
        modelForDeployments.id,
        testProvider.id,
        `test-model-deploy-2-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/model/${modelForDeployments.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deployments).toBeDefined();
      expect(response.body.data.deployments.length).toBeGreaterThanOrEqual(2);
      response.body.data.deployments.forEach((d: { baseModelId: string }) => {
        expect(d.baseModelId).toBe(modelForDeployments.id);
      });
    });

    it('deve filtrar por isActive', async () => {
      const modelForDeployments = await createTestBaseModel(`Test Model ForDeployments Active ${Date.now()}`);
      await createTestDeployment(
        modelForDeployments.id,
        testProvider.id,
        `test-model-deploy-active-${Date.now()}`,
        { isActive: true }
      );

      const response = await request(app)
        .get(`/api/v2/deployments/model/${modelForDeployments.id}`)
        .query({ isActive: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.deployments.forEach((d: { isActive: boolean }) => {
        expect(d.isActive).toBe(true);
      });
    });

    it('deve aplicar paginação', async () => {
      const modelForDeployments = await createTestBaseModel(`Test Model ForDeployments Pag ${Date.now()}`);
      await createTestDeployment(
        modelForDeployments.id,
        testProvider.id,
        `test-model-deploy-pag-1-${Date.now()}`
      );
      await createTestDeployment(
        modelForDeployments.id,
        testProvider.id,
        `test-model-deploy-pag-2-${Date.now()}`
      );

      const response = await request(app)
        .get(`/api/v2/deployments/model/${modelForDeployments.id}`)
        .query({ page: '1', limit: '1' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.deployments.length).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================================
  // POST /api/v2/deployments - Criar deployment
  // ==========================================================================

  describe('POST /api/v2/deployments', () => {
    it('deve criar deployment com dados válidos (autenticado)', async () => {
      const deploymentData = {
        baseModelId: testBaseModel.id,
        providerId: testProvider.id,
        deploymentId: `test-create-deploy-${Date.now()}`,
        inferenceType: 'ON_DEMAND',
        costPer1MInput: 5.0,
        costPer1MOutput: 25.0,
        isActive: true
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(deploymentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.deploymentId).toBe(deploymentData.deploymentId);
      expect(response.body.data.costPer1MInput).toBe(deploymentData.costPer1MInput);
      expect(response.body.data.costPer1MOutput).toBe(deploymentData.costPer1MOutput);
    });

    it('deve criar deployment com INFERENCE_PROFILE', async () => {
      const deploymentData = {
        baseModelId: testBaseModel.id,
        providerId: testProvider.id,
        deploymentId: `test-profile-deploy-${Date.now()}`,
        inferenceType: 'INFERENCE_PROFILE',
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0,
        providerConfig: {
          profileFormat: 'us.{modelId}',
          region: 'us-east-1'
        }
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(deploymentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.inferenceType).toBe('INFERENCE_PROFILE');
      expect(response.body.data.providerConfig).toBeDefined();
    });

    it('deve criar deployment com PROVISIONED', async () => {
      const deploymentData = {
        baseModelId: testBaseModel.id,
        providerId: testProvider.id,
        deploymentId: `test-provisioned-deploy-${Date.now()}`,
        inferenceType: 'PROVISIONED',
        costPer1MInput: 0,
        costPer1MOutput: 0,
        costPerHour: 50.0,
        providerConfig: {
          arn: 'arn:aws:bedrock:us-east-1:123456789:provisioned-model/test'
        }
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(deploymentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.inferenceType).toBe('PROVISIONED');
      expect(response.body.data.costPerHour).toBe(50.0);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const deploymentData = {
        baseModelId: testBaseModel.id,
        providerId: testProvider.id,
        deploymentId: `test-noauth-deploy-${Date.now()}`,
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .send(deploymentData)
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 409 para deploymentId duplicado no mesmo provider', async () => {
      const existingDeployment = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-duplicate-deploy-${Date.now()}`
      );

      const deploymentData = {
        baseModelId: testBaseModel.id,
        providerId: testProvider.id,
        deploymentId: existingDeployment.deploymentId,
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(deploymentData)
        .expect(409);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.deploymentId).toContain('already exists');
    });

    it('deve retornar 400 para baseModelId inválido', async () => {
      const deploymentData = {
        baseModelId: '00000000-0000-0000-0000-000000000000',
        providerId: testProvider.id,
        deploymentId: `test-invalid-model-${Date.now()}`,
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(deploymentData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.data.reference).toContain('does not exist');
    });

    it('deve validar campos obrigatórios', async () => {
      const invalidData = {
        baseModelId: testBaseModel.id,
        deploymentId: `test-missing-provider-${Date.now()}`
      };

      const response = await request(app)
        .post('/api/v2/deployments')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  // ==========================================================================
  // PUT /api/v2/deployments/:id - Atualizar deployment
  // ==========================================================================

  describe('PUT /api/v2/deployments/:id', () => {
    it('deve atualizar deployment com dados válidos (autenticado)', async () => {
      const deploymentToUpdate = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-update-deploy-${Date.now()}`
      );

      const updateData = {
        costPer1MInput: 4.0,
        costPer1MOutput: 20.0,
        isActive: false
      };

      const response = await request(app)
        .put(`/api/v2/deployments/${deploymentToUpdate.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.costPer1MInput).toBe(updateData.costPer1MInput);
      expect(response.body.data.costPer1MOutput).toBe(updateData.costPer1MOutput);
      expect(response.body.data.isActive).toBe(false);
    });

    it('deve atualizar inferenceType', async () => {
      const deploymentToUpdate = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-update-inference-${Date.now()}`
      );

      const updateData = {
        inferenceType: 'INFERENCE_PROFILE',
        providerConfig: {
          profileFormat: 'eu.{modelId}',
          region: 'eu-west-1'
        }
      };

      const response = await request(app)
        .put(`/api/v2/deployments/${deploymentToUpdate.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.inferenceType).toBe('INFERENCE_PROFILE');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const deploymentToUpdate = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-update-noauth-${Date.now()}`
      );

      const response = await request(app)
        .put(`/api/v2/deployments/${deploymentToUpdate.id}`)
        .send({ costPer1MInput: 5.0 })
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/v2/deployments/${fakeId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ costPer1MInput: 5.0 })
        .expect(404);

      expect(response.body.status).toBe('fail');
    });

    it('deve atualizar customParams', async () => {
      const deploymentToUpdate = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-update-params-${Date.now()}`
      );

      const updateData = {
        customParams: {
          temperature: 0.8,
          topP: 0.95,
          maxTokens: 4096
        }
      };

      const response = await request(app)
        .put(`/api/v2/deployments/${deploymentToUpdate.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.customParams).toBeDefined();
      expect(response.body.data.customParams.temperature).toBe(0.8);
    });
  });

  // ==========================================================================
  // DELETE /api/v2/deployments/:id - Deletar deployment
  // ==========================================================================

  describe('DELETE /api/v2/deployments/:id', () => {
    it('deve fazer soft delete do deployment (autenticado)', async () => {
      const deploymentToDelete = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-softdelete-deploy-${Date.now()}`
      );

      const response = await request(app)
        .delete(`/api/v2/deployments/${deploymentToDelete.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.isActive).toBe(false);
    });

    it('deve fazer hard delete quando solicitado', async () => {
      const deploymentToDelete = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-harddelete-deploy-${Date.now()}`
      );

      const response = await request(app)
        .delete(`/api/v2/deployments/${deploymentToDelete.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .query({ hard: 'true' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deleted).toBe(true);

      // Verificar que foi realmente deletado
      const checkResponse = await request(app)
        .get(`/api/v2/deployments/${deploymentToDelete.id}`)
        .expect(404);

      expect(checkResponse.body.status).toBe('fail');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const deploymentToDelete = await createTestDeployment(
        testBaseModel.id,
        testProvider.id,
        `test-noauth-delete-deploy-${Date.now()}`
      );

      const response = await request(app)
        .delete(`/api/v2/deployments/${deploymentToDelete.id}`)
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v2/deployments/${fakeId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });
  });
});
