// backend/src/services/models/__tests__/modelCacheService.test.ts
// Standards: docs/STANDARDS.md

import { modelCacheService } from '../modelCacheService';
import { baseModelService } from '../baseModelService';
import { deploymentService } from '../deploymentService';

// Mock dos services dependentes
jest.mock('../baseModelService', () => ({
  baseModelService: {
    findById: jest.fn(),
    findByName: jest.fn()
  }
}));

jest.mock('../deploymentService', () => ({
  deploymentService: {
    findById: jest.fn(),
    findByDeploymentId: jest.fn(),
    findAll: jest.fn()
  }
}));

// Mock do logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('ModelCacheService', () => {
  // Dados de mock reutilizáveis
  const mockBaseModel = {
    id: 'uuid-model-1',
    name: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    family: 'Claude',
    version: '3.5',
    capabilities: {
      streaming: true,
      vision: true,
      maxContextWindow: 200000
    },
    defaultParams: { temperature: 0.7 },
    description: 'Advanced AI model',
    releaseDate: new Date('2024-06-01'),
    deprecated: false,
    replacedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deployments: []
  };

  const mockDeployment = {
    id: 'uuid-deployment-1',
    baseModelId: 'uuid-model-1',
    providerId: 'uuid-provider-1',
    deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    inferenceType: 'ON_DEMAND',
    providerConfig: { region: 'us-east-1' },
    costPer1MInput: 3.0,
    costPer1MOutput: 15.0,
    costPerHour: null,
    customParams: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    baseModel: mockBaseModel,
    provider: { id: 'uuid-provider-1', name: 'AWS Bedrock', slug: 'bedrock' },
    certifications: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar cache antes de cada teste
    modelCacheService.invalidateAll();
    modelCacheService.resetStats();
    // Resetar configuração para padrão
    modelCacheService.configure({ ttlMs: 5 * 60 * 1000, maxItems: 1000 });
  });

  // ============================================================================
  // Cache Hit e Miss para BaseModel
  // ============================================================================
  describe('getBaseModel - Cache Hit/Miss', () => {
    it('should return cache miss on first call and cache hit on second call', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);

      // Primeira chamada - cache miss
      const result1 = await modelCacheService.getBaseModel('uuid-model-1');
      expect(result1).toEqual(mockBaseModel);
      expect(baseModelService.findById).toHaveBeenCalledTimes(1);

      // Segunda chamada - cache hit
      const result2 = await modelCacheService.getBaseModel('uuid-model-1');
      expect(result2).toEqual(mockBaseModel);
      expect(baseModelService.findById).toHaveBeenCalledTimes(1); // Não deve chamar novamente

      // Verificar estatísticas
      const stats = modelCacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should return null when model not found', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(null);

      const result = await modelCacheService.getBaseModel('non-existent-id');

      expect(result).toBeNull();
      expect(baseModelService.findById).toHaveBeenCalledWith('non-existent-id', false);
    });
  });

  // ============================================================================
  // Cache Hit e Miss para BaseModel por Nome
  // ============================================================================
  describe('getBaseModelByName - Cache Hit/Miss', () => {
    it('should cache model by name and return from cache on second call', async () => {
      (baseModelService.findByName as jest.Mock).mockResolvedValue(mockBaseModel);

      // Primeira chamada - cache miss
      const result1 = await modelCacheService.getBaseModelByName('Claude 3.5 Sonnet');
      expect(result1).toEqual(mockBaseModel);
      expect(baseModelService.findByName).toHaveBeenCalledTimes(1);

      // Segunda chamada - cache hit
      const result2 = await modelCacheService.getBaseModelByName('Claude 3.5 Sonnet');
      expect(result2).toEqual(mockBaseModel);
      expect(baseModelService.findByName).toHaveBeenCalledTimes(1);
    });

    it('should return null when model name not found', async () => {
      (baseModelService.findByName as jest.Mock).mockResolvedValue(null);

      const result = await modelCacheService.getBaseModelByName('Non-existent Model');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Cache Hit e Miss para Deployment
  // ============================================================================
  describe('getDeployment - Cache Hit/Miss', () => {
    it('should return cache miss on first call and cache hit on second call', async () => {
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Primeira chamada - cache miss
      const result1 = await modelCacheService.getDeployment('uuid-deployment-1');
      expect(result1).toEqual(mockDeployment);
      expect(deploymentService.findById).toHaveBeenCalledTimes(1);

      // Segunda chamada - cache hit
      const result2 = await modelCacheService.getDeployment('uuid-deployment-1');
      expect(result2).toEqual(mockDeployment);
      expect(deploymentService.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when deployment not found', async () => {
      (deploymentService.findById as jest.Mock).mockResolvedValue(null);

      const result = await modelCacheService.getDeployment('non-existent-id');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Cache Hit e Miss para Deployment por DeploymentId
  // ============================================================================
  describe('getDeploymentByDeploymentId - Cache Hit/Miss', () => {
    it('should cache deployment by composite key', async () => {
      (deploymentService.findByDeploymentId as jest.Mock).mockResolvedValue(mockDeployment);

      // Primeira chamada - cache miss
      const result1 = await modelCacheService.getDeploymentByDeploymentId(
        'uuid-provider-1',
        'anthropic.claude-3-5-sonnet-20241022-v2:0'
      );
      expect(result1).toEqual(mockDeployment);
      expect(deploymentService.findByDeploymentId).toHaveBeenCalledTimes(1);

      // Segunda chamada - cache hit
      const result2 = await modelCacheService.getDeploymentByDeploymentId(
        'uuid-provider-1',
        'anthropic.claude-3-5-sonnet-20241022-v2:0'
      );
      expect(result2).toEqual(mockDeployment);
      expect(deploymentService.findByDeploymentId).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // TTL (Expiração)
  // ============================================================================
  describe('TTL - Cache Expiration', () => {
    it('should expire cache entries after TTL', async () => {
      // Configurar TTL muito curto para teste
      modelCacheService.configure({ ttlMs: 100 });

      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);

      // Primeira chamada - cache miss
      await modelCacheService.getBaseModel('uuid-model-1');
      expect(baseModelService.findById).toHaveBeenCalledTimes(1);

      // Segunda chamada imediata - cache hit
      await modelCacheService.getBaseModel('uuid-model-1');
      expect(baseModelService.findById).toHaveBeenCalledTimes(1);

      // Esperar TTL expirar
      await new Promise(resolve => setTimeout(resolve, 150));

      // Terceira chamada após expiração - cache miss
      await modelCacheService.getBaseModel('uuid-model-1');
      expect(baseModelService.findById).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // Invalidação Manual
  // ============================================================================
  describe('invalidateBaseModel', () => {
    it('should invalidate specific base model from cache', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);

      // Primeira chamada - cache miss
      await modelCacheService.getBaseModel('uuid-model-1');
      expect(baseModelService.findById).toHaveBeenCalledTimes(1);

      // Invalidar cache
      modelCacheService.invalidateBaseModel('uuid-model-1');

      // Segunda chamada após invalidação - cache miss
      await modelCacheService.getBaseModel('uuid-model-1');
      expect(baseModelService.findById).toHaveBeenCalledTimes(2);
    });

    it('should also invalidate name index when invalidating by id', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);
      (baseModelService.findByName as jest.Mock).mockResolvedValue(mockBaseModel);

      // Carregar no cache por ID
      await modelCacheService.getBaseModel('uuid-model-1');

      // Invalidar por ID
      modelCacheService.invalidateBaseModel('uuid-model-1');

      // Buscar por nome deve ser cache miss
      await modelCacheService.getBaseModelByName('Claude 3.5 Sonnet');
      expect(baseModelService.findByName).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateDeployment', () => {
    it('should invalidate specific deployment from cache', async () => {
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Primeira chamada - cache miss
      await modelCacheService.getDeployment('uuid-deployment-1');
      expect(deploymentService.findById).toHaveBeenCalledTimes(1);

      // Invalidar cache
      modelCacheService.invalidateDeployment('uuid-deployment-1');

      // Segunda chamada após invalidação - cache miss
      await modelCacheService.getDeployment('uuid-deployment-1');
      expect(deploymentService.findById).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateAll', () => {
    it('should clear all cache entries', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Carregar dados no cache
      await modelCacheService.getBaseModel('uuid-model-1');
      await modelCacheService.getDeployment('uuid-deployment-1');

      // Verificar que estão no cache
      const statsBefore = modelCacheService.getStats();
      expect(statsBefore.baseModelCacheSize).toBe(1);
      expect(statsBefore.deploymentCacheSize).toBe(1);

      // Invalidar tudo
      modelCacheService.invalidateAll();

      // Verificar que cache está vazio
      const statsAfter = modelCacheService.getStats();
      expect(statsAfter.baseModelCacheSize).toBe(0);
      expect(statsAfter.deploymentCacheSize).toBe(0);
    });
  });

  // ============================================================================
  // Estatísticas (getStats)
  // ============================================================================
  describe('getStats', () => {
    it('should return correct statistics', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Gerar algumas operações
      await modelCacheService.getBaseModel('uuid-model-1'); // miss
      await modelCacheService.getBaseModel('uuid-model-1'); // hit
      await modelCacheService.getDeployment('uuid-deployment-1'); // miss
      await modelCacheService.getDeployment('uuid-deployment-1'); // hit
      await modelCacheService.getDeployment('uuid-deployment-1'); // hit

      const stats = modelCacheService.getStats();

      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.6);
      expect(stats.baseModelCacheSize).toBe(1);
      expect(stats.deploymentCacheSize).toBe(1);
      expect(stats.totalSize).toBe(2);
      expect(stats.config.ttlMs).toBe(5 * 60 * 1000);
    });

    it('should return zero hit rate when no operations', () => {
      const stats = modelCacheService.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset hit/miss counters', async () => {
      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);

      // Gerar algumas operações
      await modelCacheService.getBaseModel('uuid-model-1');
      await modelCacheService.getBaseModel('uuid-model-1');

      const statsBefore = modelCacheService.getStats();
      expect(statsBefore.hits).toBe(1);
      expect(statsBefore.misses).toBe(1);

      // Resetar estatísticas
      modelCacheService.resetStats();

      const statsAfter = modelCacheService.getStats();
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
      // Cache ainda deve ter os dados
      expect(statsAfter.baseModelCacheSize).toBe(1);
    });
  });

  // ============================================================================
  // Cleanup de Entradas Expiradas
  // ============================================================================
  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      // Configurar TTL muito curto
      modelCacheService.configure({ ttlMs: 50 });

      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Carregar dados no cache
      await modelCacheService.getBaseModel('uuid-model-1');
      await modelCacheService.getDeployment('uuid-deployment-1');

      // Verificar que estão no cache
      expect(modelCacheService.getStats().totalSize).toBe(2);

      // Esperar expiração
      await new Promise(resolve => setTimeout(resolve, 100));

      // Executar cleanup
      const removed = modelCacheService.cleanup();

      expect(removed).toBeGreaterThan(0);
      expect(modelCacheService.getStats().totalSize).toBe(0);
    });

    it('should not remove non-expired entries', async () => {
      // TTL longo
      modelCacheService.configure({ ttlMs: 60000 });

      (baseModelService.findById as jest.Mock).mockResolvedValue(mockBaseModel);

      await modelCacheService.getBaseModel('uuid-model-1');

      const removed = modelCacheService.cleanup();

      expect(removed).toBe(0);
      expect(modelCacheService.getStats().baseModelCacheSize).toBe(1);
    });
  });

  // ============================================================================
  // getAllActiveDeployments
  // ============================================================================
  describe('getAllActiveDeployments', () => {
    it('should cache active deployments list', async () => {
      const mockDeployments = [mockDeployment];
      (deploymentService.findAll as jest.Mock).mockResolvedValue({
        deployments: mockDeployments,
        pagination: { page: 1, limit: 1000, total: 1, totalPages: 1 }
      });

      // Primeira chamada - cache miss
      const result1 = await modelCacheService.getAllActiveDeployments();
      expect(result1).toEqual(mockDeployments);
      expect(deploymentService.findAll).toHaveBeenCalledTimes(1);

      // Segunda chamada - cache hit
      const result2 = await modelCacheService.getAllActiveDeployments();
      expect(result2).toEqual(mockDeployments);
      expect(deploymentService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should also cache individual deployments', async () => {
      const mockDeployments = [mockDeployment];
      (deploymentService.findAll as jest.Mock).mockResolvedValue({
        deployments: mockDeployments,
        pagination: { page: 1, limit: 1000, total: 1, totalPages: 1 }
      });
      (deploymentService.findById as jest.Mock).mockResolvedValue(mockDeployment);

      // Carregar lista
      await modelCacheService.getAllActiveDeployments();

      // Buscar deployment individual deve ser cache hit
      const result = await modelCacheService.getDeployment('uuid-deployment-1');
      expect(result).toEqual(mockDeployment);
      // findById não deve ser chamado pois já está no cache
      expect(deploymentService.findById).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Configuração
  // ============================================================================
  describe('configure', () => {
    it('should update cache configuration', () => {
      modelCacheService.configure({ ttlMs: 10 * 60 * 1000, maxItems: 500 });

      const stats = modelCacheService.getStats();
      expect(stats.config.ttlMs).toBe(10 * 60 * 1000);
      expect(stats.config.maxItems).toBe(500);
    });

    it('should allow partial configuration updates', () => {
      modelCacheService.configure({ ttlMs: 1000 });

      const stats = modelCacheService.getStats();
      expect(stats.config.ttlMs).toBe(1000);
      expect(stats.config.maxItems).toBe(1000); // Mantém valor anterior
    });
  });

  // ============================================================================
  // LRU Eviction
  // ============================================================================
  describe('LRU Eviction', () => {
    it('should evict least recently used entry when max items reached', async () => {
      // Configurar limite muito baixo
      modelCacheService.configure({ maxItems: 2 });

      const model1 = { ...mockBaseModel, id: 'model-1', name: 'Model 1' };
      const model2 = { ...mockBaseModel, id: 'model-2', name: 'Model 2' };
      const model3 = { ...mockBaseModel, id: 'model-3', name: 'Model 3' };

      (baseModelService.findById as jest.Mock)
        .mockResolvedValueOnce(model1)
        .mockResolvedValueOnce(model2)
        .mockResolvedValueOnce(model3)
        .mockResolvedValueOnce(model1); // Para quando model-1 for buscado novamente

      // Carregar 2 modelos (limite)
      await modelCacheService.getBaseModel('model-1');
      await modelCacheService.getBaseModel('model-2');

      // Acessar model-1 novamente para atualizar lastAccessedAt
      await modelCacheService.getBaseModel('model-1');

      // Carregar terceiro modelo - deve evictar model-2 (LRU)
      await modelCacheService.getBaseModel('model-3');

      // model-2 deve ter sido evictado, então buscar novamente deve chamar o service
      (baseModelService.findById as jest.Mock).mockResolvedValueOnce(model2);
      await modelCacheService.getBaseModel('model-2');

      // Verificar que findById foi chamado para model-2 após eviction
      expect(baseModelService.findById).toHaveBeenCalledWith('model-2', false);
    });
  });
});
