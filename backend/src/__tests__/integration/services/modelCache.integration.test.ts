// backend/src/__tests__/integration/services/modelCache.integration.test.ts
// Standards: docs/STANDARDS.md

import { PrismaClient, ProviderType, InferenceType } from '@prisma/client';
import { modelCacheService } from '../../../services/models/modelCacheService';

// ============================================================================
// TEST SETUP
// ============================================================================

const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Cria um provider de teste
 */
async function createTestProvider(slug?: string): Promise<{ id: string; slug: string }> {
  const uniqueSlug = slug || `test-cache-provider-${Date.now()}`;
  const provider = await prisma.provider.create({
    data: {
      name: `Test Cache Provider ${Date.now()}`,
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
async function createTestModel(name?: string): Promise<{ id: string; name: string }> {
  const uniqueName = name || `Test Cache Model ${Date.now()}`;
  const model = await prisma.baseModel.create({
    data: {
      name: uniqueName,
      vendor: 'Test Vendor',
      family: 'Test Family',
      version: '1.0',
      capabilities: {
        chat: true,
        streaming: true,
        maxContextWindow: 100000
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
  deploymentId?: string
): Promise<{ id: string; deploymentId: string; providerId: string }> {
  const uniqueDeploymentId = deploymentId || `test-cache-deployment-${Date.now()}`;
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
  return { id: deployment.id, deploymentId: deployment.deploymentId, providerId };
}

/**
 * Limpa dados de teste
 */
async function cleanupTestData(): Promise<void> {
  await prisma.modelCertification.deleteMany({
    where: { deployment: { deploymentId: { startsWith: 'test-cache-' } } }
  });
  await prisma.modelDeployment.deleteMany({
    where: { deploymentId: { startsWith: 'test-cache-' } }
  });
  await prisma.baseModel.deleteMany({
    where: { name: { startsWith: 'Test Cache ' } }
  });
  await prisma.provider.deleteMany({
    where: { slug: { startsWith: 'test-cache-' } }
  });
}

// ============================================================================
// TEST SUITE: ModelCacheService
// ============================================================================

describe('ModelCacheService - Integration Tests', () => {
  let testProvider: { id: string; slug: string };
  let testModel: { id: string; name: string };

  beforeAll(async () => {
    await prisma.$connect();
    // Limpar cache e estatísticas antes dos testes
    modelCacheService.invalidateAll();
    modelCacheService.resetStats();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Criar dados de teste base
    testProvider = await createTestProvider();
    testModel = await createTestModel();
    // Limpar cache entre testes
    modelCacheService.invalidateAll();
    modelCacheService.resetStats();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  // ==========================================================================
  // Configuração do cache
  // ==========================================================================

  describe('configure', () => {
    it('deve permitir configurar TTL do cache', () => {
      modelCacheService.configure({ ttlMs: 10 * 60 * 1000 }); // 10 minutos

      const stats = modelCacheService.getStats();
      expect(stats.config.ttlMs).toBe(10 * 60 * 1000);
    });

    it('deve permitir configurar limite máximo de itens', () => {
      modelCacheService.configure({ maxItems: 500 });

      const stats = modelCacheService.getStats();
      expect(stats.config.maxItems).toBe(500);
    });

    it('deve manter configurações anteriores ao atualizar parcialmente', () => {
      modelCacheService.configure({ ttlMs: 10000, maxItems: 100 });
      modelCacheService.configure({ ttlMs: 20000 });

      const stats = modelCacheService.getStats();
      expect(stats.config.ttlMs).toBe(20000);
      expect(stats.config.maxItems).toBe(100);
    });
  });

  // ==========================================================================
  // Cache de BaseModel
  // ==========================================================================

  describe('getBaseModel', () => {
    it('deve buscar modelo do banco na primeira chamada (cache miss)', async () => {
      const model = await modelCacheService.getBaseModel(testModel.id);

      expect(model).not.toBeNull();
      expect(model?.id).toBe(testModel.id);
      expect(model?.name).toBe(testModel.name);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
    });

    it('deve retornar do cache na segunda chamada (cache hit)', async () => {
      // Primeira chamada - cache miss
      await modelCacheService.getBaseModel(testModel.id);

      // Segunda chamada - cache hit
      const model = await modelCacheService.getBaseModel(testModel.id);

      expect(model).not.toBeNull();
      expect(model?.id).toBe(testModel.id);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('deve retornar null para modelo inexistente', async () => {
      const model = await modelCacheService.getBaseModel('00000000-0000-0000-0000-000000000000');

      expect(model).toBeNull();

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
    });

    it('deve incluir deployments quando solicitado', async () => {
      await createTestDeployment(testModel.id, testProvider.id);

      const model = await modelCacheService.getBaseModel(testModel.id, true);

      expect(model).not.toBeNull();
      expect(model?.deployments).toBeDefined();
    });
  });

  describe('getBaseModelByName', () => {
    it('deve buscar modelo por nome do banco na primeira chamada', async () => {
      const model = await modelCacheService.getBaseModelByName(testModel.name);

      expect(model).not.toBeNull();
      expect(model?.name).toBe(testModel.name);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
    });

    it('deve retornar do cache na segunda chamada por nome', async () => {
      // Primeira chamada
      await modelCacheService.getBaseModelByName(testModel.name);

      // Segunda chamada
      const model = await modelCacheService.getBaseModelByName(testModel.name);

      expect(model).not.toBeNull();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
    });

    it('deve usar cache compartilhado entre busca por ID e nome', async () => {
      // Buscar por ID primeiro
      await modelCacheService.getBaseModel(testModel.id);

      // Buscar por nome deve usar cache
      const model = await modelCacheService.getBaseModelByName(testModel.name);

      expect(model).not.toBeNull();

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(1);
    });

    it('deve retornar null para nome inexistente', async () => {
      const model = await modelCacheService.getBaseModelByName('NonExistent Model Name');

      expect(model).toBeNull();
    });
  });

  describe('invalidateBaseModel', () => {
    it('deve invalidar modelo específico do cache', async () => {
      // Popular cache
      await modelCacheService.getBaseModel(testModel.id);

      // Invalidar
      modelCacheService.invalidateBaseModel(testModel.id);

      // Próxima busca deve ser cache miss
      await modelCacheService.getBaseModel(testModel.id);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(2);
    });

    it('deve remover índice secundário por nome ao invalidar', async () => {
      // Popular cache
      await modelCacheService.getBaseModel(testModel.id);

      // Invalidar
      modelCacheService.invalidateBaseModel(testModel.id);

      // Busca por nome deve ser cache miss
      await modelCacheService.getBaseModelByName(testModel.name);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(2);
    });

    it('deve não falhar ao invalidar modelo não cacheado', () => {
      expect(() => {
        modelCacheService.invalidateBaseModel('00000000-0000-0000-0000-000000000000');
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Cache de Deployment
  // ==========================================================================

  describe('getDeployment', () => {
    let testDeployment: { id: string; deploymentId: string; providerId: string };

    beforeEach(async () => {
      testDeployment = await createTestDeployment(testModel.id, testProvider.id);
    });

    it('deve buscar deployment do banco na primeira chamada', async () => {
      const deployment = await modelCacheService.getDeployment(testDeployment.id);

      expect(deployment).not.toBeNull();
      expect(deployment?.id).toBe(testDeployment.id);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(1);
    });

    it('deve retornar do cache na segunda chamada', async () => {
      await modelCacheService.getDeployment(testDeployment.id);
      const deployment = await modelCacheService.getDeployment(testDeployment.id);

      expect(deployment).not.toBeNull();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
    });

    it('deve incluir baseModel quando solicitado', async () => {
      const deployment = await modelCacheService.getDeployment(testDeployment.id, true);

      expect(deployment).not.toBeNull();
      expect(deployment?.baseModel).toBeDefined();
    });

    it('deve incluir provider quando solicitado', async () => {
      const deployment = await modelCacheService.getDeployment(testDeployment.id, false, true);

      expect(deployment).not.toBeNull();
      expect(deployment?.provider).toBeDefined();
    });

    it('deve retornar null para deployment inexistente', async () => {
      const deployment = await modelCacheService.getDeployment('00000000-0000-0000-0000-000000000000');

      expect(deployment).toBeNull();
    });
  });

  describe('getDeploymentByDeploymentId', () => {
    let testDeployment: { id: string; deploymentId: string; providerId: string };

    beforeEach(async () => {
      testDeployment = await createTestDeployment(testModel.id, testProvider.id);
    });

    it('deve buscar deployment por chave composta', async () => {
      const deployment = await modelCacheService.getDeploymentByDeploymentId(
        testDeployment.providerId,
        testDeployment.deploymentId
      );

      expect(deployment).not.toBeNull();
      expect(deployment?.deploymentId).toBe(testDeployment.deploymentId);
    });

    it('deve usar cache compartilhado entre busca por ID e chave composta', async () => {
      // Buscar por ID primeiro
      await modelCacheService.getDeployment(testDeployment.id);

      // Buscar por chave composta deve usar cache
      const deployment = await modelCacheService.getDeploymentByDeploymentId(
        testDeployment.providerId,
        testDeployment.deploymentId
      );

      expect(deployment).not.toBeNull();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
    });

    it('deve retornar null para chave composta inexistente', async () => {
      const deployment = await modelCacheService.getDeploymentByDeploymentId(
        testDeployment.providerId,
        'non-existent-deployment-id'
      );

      expect(deployment).toBeNull();
    });
  });

  describe('getAllActiveDeployments', () => {
    beforeEach(async () => {
      // Criar múltiplos deployments
      await createTestDeployment(testModel.id, testProvider.id, `test-cache-active-1-${Date.now()}`);
      await createTestDeployment(testModel.id, testProvider.id, `test-cache-active-2-${Date.now()}`);
    });

    it('deve buscar todos os deployments ativos', async () => {
      const deployments = await modelCacheService.getAllActiveDeployments();

      expect(deployments.length).toBeGreaterThanOrEqual(2);
      deployments.forEach(d => {
        expect(d.isActive).toBe(true);
      });
    });

    it('deve cachear lista de deployments ativos', async () => {
      // Primeira chamada
      await modelCacheService.getAllActiveDeployments();

      // Segunda chamada deve usar cache
      await modelCacheService.getAllActiveDeployments();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
    });

    it('deve incluir baseModel e provider por padrão', async () => {
      const deployments = await modelCacheService.getAllActiveDeployments();

      expect(deployments.length).toBeGreaterThan(0);
      expect(deployments[0].baseModel).toBeDefined();
      expect(deployments[0].provider).toBeDefined();
    });
  });

  describe('invalidateDeployment', () => {
    let testDeployment: { id: string; deploymentId: string; providerId: string };

    beforeEach(async () => {
      testDeployment = await createTestDeployment(testModel.id, testProvider.id);
    });

    it('deve invalidar deployment específico do cache', async () => {
      // Popular cache
      await modelCacheService.getDeployment(testDeployment.id);

      // Invalidar
      modelCacheService.invalidateDeployment(testDeployment.id);

      // Próxima busca deve ser cache miss
      await modelCacheService.getDeployment(testDeployment.id);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(2);
    });

    it('deve invalidar cache de lista de deployments ativos', async () => {
      // Popular cache de lista
      await modelCacheService.getAllActiveDeployments();

      // Invalidar um deployment
      modelCacheService.invalidateDeployment(testDeployment.id);

      // Próxima busca de lista deve ser cache miss
      await modelCacheService.getAllActiveDeployments();

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(2);
    });
  });

  // ==========================================================================
  // Invalidação e estatísticas
  // ==========================================================================

  describe('invalidateAll', () => {
    it('deve limpar todo o cache', async () => {
      // Popular cache
      await modelCacheService.getBaseModel(testModel.id);
      const deployment = await createTestDeployment(testModel.id, testProvider.id);
      await modelCacheService.getDeployment(deployment.id);

      const statsBefore = modelCacheService.getStats();
      expect(statsBefore.totalSize).toBeGreaterThan(0);

      // Invalidar tudo
      modelCacheService.invalidateAll();

      const statsAfter = modelCacheService.getStats();
      expect(statsAfter.baseModelCacheSize).toBe(0);
      expect(statsAfter.deploymentCacheSize).toBe(0);
      expect(statsAfter.totalSize).toBe(0);
    });

    it('deve manter estatísticas após invalidação', async () => {
      await modelCacheService.getBaseModel(testModel.id);
      await modelCacheService.getBaseModel(testModel.id);

      modelCacheService.invalidateAll();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', async () => {
      // Gerar algumas operações
      await modelCacheService.getBaseModel(testModel.id); // miss
      await modelCacheService.getBaseModel(testModel.id); // hit
      await modelCacheService.getBaseModel(testModel.id); // hit

      const stats = modelCacheService.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
      expect(stats.baseModelCacheSize).toBe(1);
    });

    it('deve retornar hitRate 0 quando não há operações', () => {
      const stats = modelCacheService.getStats();

      expect(stats.hitRate).toBe(0);
    });

    it('deve incluir configuração atual', () => {
      modelCacheService.configure({ ttlMs: 30000 });

      const stats = modelCacheService.getStats();

      expect(stats.config.ttlMs).toBe(30000);
    });
  });

  describe('resetStats', () => {
    it('deve resetar estatísticas de hits e misses', async () => {
      await modelCacheService.getBaseModel(testModel.id);
      await modelCacheService.getBaseModel(testModel.id);

      modelCacheService.resetStats();

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('deve manter cache após reset de estatísticas', async () => {
      await modelCacheService.getBaseModel(testModel.id);

      modelCacheService.resetStats();

      // Deve ainda ser cache hit
      await modelCacheService.getBaseModel(testModel.id);

      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });
  });

  // ==========================================================================
  // TTL e expiração
  // ==========================================================================

  describe('TTL e expiração', () => {
    it('deve expirar entradas após TTL', async () => {
      // Configurar TTL muito curto para teste
      modelCacheService.configure({ ttlMs: 100 }); // 100ms

      // Popular cache
      await modelCacheService.getBaseModel(testModel.id);

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 150));

      // Próxima busca deve ser cache miss
      await modelCacheService.getBaseModel(testModel.id);

      const stats = modelCacheService.getStats();
      expect(stats.misses).toBe(2);

      // Restaurar TTL padrão
      modelCacheService.configure({ ttlMs: 5 * 60 * 1000 });
    });

    it('deve limpar entradas expiradas com cleanup', async () => {
      // Configurar TTL muito curto
      modelCacheService.configure({ ttlMs: 50 });

      // Popular cache
      await modelCacheService.getBaseModel(testModel.id);

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 100));

      // Executar cleanup
      const removed = modelCacheService.cleanup();

      expect(removed).toBeGreaterThanOrEqual(1);

      const stats = modelCacheService.getStats();
      expect(stats.baseModelCacheSize).toBe(0);

      // Restaurar TTL padrão
      modelCacheService.configure({ ttlMs: 5 * 60 * 1000 });
    });
  });

  // ==========================================================================
  // LRU Eviction
  // ==========================================================================

  describe('LRU Eviction', () => {
    it('deve fazer eviction de entrada menos recente quando limite é atingido', async () => {
      // Configurar limite muito baixo
      modelCacheService.configure({ maxItems: 2 });

      // Criar 3 modelos
      const model1 = await createTestModel(`Test Cache LRU1 ${Date.now()}`);
      const model2 = await createTestModel(`Test Cache LRU2 ${Date.now()}`);
      const model3 = await createTestModel(`Test Cache LRU3 ${Date.now()}`);

      // Popular cache com 3 modelos (excede limite de 2)
      await modelCacheService.getBaseModel(model1.id);
      await modelCacheService.getBaseModel(model2.id);
      await modelCacheService.getBaseModel(model3.id);

      // Cache deve ter no máximo 2 itens
      const stats = modelCacheService.getStats();
      expect(stats.baseModelCacheSize).toBeLessThanOrEqual(2);

      // Restaurar limite padrão
      modelCacheService.configure({ maxItems: 1000 });
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('deve ser significativamente mais rápido com cache hit', async () => {
      // Primeira chamada (cache miss)
      const startMiss = Date.now();
      await modelCacheService.getBaseModel(testModel.id);
      const timeMiss = Date.now() - startMiss;

      // Segunda chamada (cache hit)
      const startHit = Date.now();
      await modelCacheService.getBaseModel(testModel.id);
      const timeHit = Date.now() - startHit;

      // Cache hit deve ser mais rápido (ou pelo menos não muito mais lento)
      expect(timeHit).toBeLessThanOrEqual(timeMiss + 10);
    });

    it('deve processar múltiplas requisições em paralelo eficientemente', async () => {
      const models = await Promise.all([
        createTestModel(`Test Cache Parallel1 ${Date.now()}`),
        createTestModel(`Test Cache Parallel2 ${Date.now()}`),
        createTestModel(`Test Cache Parallel3 ${Date.now()}`)
      ]);

      const startTime = Date.now();
      await Promise.all(models.map(m => modelCacheService.getBaseModel(m.id)));
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(500); // Todas em menos de 500ms
    });
  });
});
