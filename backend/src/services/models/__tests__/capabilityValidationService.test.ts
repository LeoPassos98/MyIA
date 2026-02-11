// backend/src/services/models/__tests__/capabilityValidationService.test.ts
// Standards: docs/STANDARDS.md

import { capabilityValidationService } from '../capabilityValidationService';
import { modelCacheService } from '../modelCacheService';
import { prisma } from '../../../lib/prisma';

// Mock do modelCacheService
jest.mock('../modelCacheService', () => ({
  modelCacheService: {
    getBaseModel: jest.fn(),
    invalidateBaseModel: jest.fn()
  }
}));

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    baseModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
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

describe('CapabilityValidationService', () => {
  // Dados de mock reutilizáveis
  const mockBaseModel = {
    id: 'uuid-model-1',
    name: 'Claude 3.5 Sonnet',
    vendor: 'Anthropic',
    family: 'Claude',
    version: '3.5',
    capabilities: {
      chat: true,
      streaming: true,
      vision: true,
      functionCalling: true,
      maxContextWindow: 200000,
      maxOutputTokens: 8192,
      languages: ['en', 'pt', 'es']
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

  const mockBaseModel2 = {
    ...mockBaseModel,
    id: 'uuid-model-2',
    name: 'GPT-4 Turbo',
    vendor: 'OpenAI',
    capabilities: {
      chat: true,
      streaming: true,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      maxContextWindow: 128000,
      maxOutputTokens: 4096
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // validateCapabilities
  // ============================================================================
  describe('validateCapabilities', () => {
    it('should validate correct capabilities object', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: true,
        streaming: true,
        vision: false,
        maxContextWindow: 200000,
        maxOutputTokens: 8192,
        languages: ['en', 'pt']
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error for non-object input', () => {
      const result = capabilityValidationService.validateCapabilities(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capabilities deve ser um objeto');
    });

    it('should return error for string input', () => {
      const result = capabilityValidationService.validateCapabilities('invalid');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capabilities deve ser um objeto');
    });

    it('should return error for boolean capability with wrong type', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: 'yes' // Deveria ser boolean
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capability "chat" deve ser boolean, recebido: string');
    });

    it('should return error for numeric capability with wrong type', () => {
      const result = capabilityValidationService.validateCapabilities({
        maxContextWindow: 'large' // Deveria ser number
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capability "maxContextWindow" deve ser número positivo, recebido: string');
    });

    it('should return error for negative numeric capability', () => {
      const result = capabilityValidationService.validateCapabilities({
        maxOutputTokens: -100
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capability "maxOutputTokens" deve ser número positivo, recebido: number');
    });

    it('should return error for list capability with wrong type', () => {
      const result = capabilityValidationService.validateCapabilities({
        languages: 'en,pt' // Deveria ser array
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capability "languages" deve ser array, recebido: string');
    });

    it('should return error for list capability with non-string items', () => {
      const result = capabilityValidationService.validateCapabilities({
        languages: ['en', 123, 'pt']
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Capability "languages" deve ser array de strings');
    });

    it('should return warning for unknown capability', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: true,
        unknownCapability: true
      });

      expect(result.valid).toBe(true); // Warnings não invalidam
      expect(result.warnings).toContain('Capability desconhecida: "unknownCapability"');
    });

    it('should validate empty object as valid', () => {
      const result = capabilityValidationService.validateCapabilities({});

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ============================================================================
  // hasCapability
  // ============================================================================
  describe('hasCapability', () => {
    it('should return true for existing boolean capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'vision');

      expect(result).toBe(true);
    });

    it('should return false for false boolean capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { ...mockBaseModel.capabilities, vision: false }
      });

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'vision');

      expect(result).toBe(false);
    });

    it('should return true for existing numeric capability with value > 0', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'maxContextWindow');

      expect(result).toBe(true);
    });

    it('should return false for numeric capability with value 0', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { ...mockBaseModel.capabilities, maxContextWindow: 0 }
      });

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'maxContextWindow');

      expect(result).toBe(false);
    });

    it('should return true for non-empty list capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'languages');

      expect(result).toBe(true);
    });

    it('should return false for empty list capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { ...mockBaseModel.capabilities, languages: [] }
      });

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'languages');

      expect(result).toBe(false);
    });

    it('should return false when model not found', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(null);

      const result = await capabilityValidationService.hasCapability('non-existent', 'chat');

      expect(result).toBe(false);
    });

    it('should return false for unknown capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasCapability('uuid-model-1', 'unknownCap');

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // hasAllCapabilities
  // ============================================================================
  describe('hasAllCapabilities', () => {
    it('should return true when model has all capabilities', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasAllCapabilities(
        'uuid-model-1',
        ['chat', 'streaming', 'vision']
      );

      expect(result).toBe(true);
    });

    it('should return false when model is missing one capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasAllCapabilities(
        'uuid-model-1',
        ['chat', 'streaming', 'embeddings'] // embeddings não existe
      );

      expect(result).toBe(false);
    });

    it('should return true for empty capabilities list', async () => {
      const result = await capabilityValidationService.hasAllCapabilities('uuid-model-1', []);

      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // hasAnyCapability
  // ============================================================================
  describe('hasAnyCapability', () => {
    it('should return true when model has at least one capability', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasAnyCapability(
        'uuid-model-1',
        ['embeddings', 'vision'] // vision existe
      );

      expect(result).toBe(true);
    });

    it('should return false when model has none of the capabilities', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.hasAnyCapability(
        'uuid-model-1',
        ['embeddings', 'reasoning'] // nenhum existe
      );

      expect(result).toBe(false);
    });

    it('should return false for empty capabilities list', async () => {
      const result = await capabilityValidationService.hasAnyCapability('uuid-model-1', []);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // findModelsWithCapability
  // ============================================================================
  describe('findModelsWithCapability', () => {
    it('should return models with specific boolean capability', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithCapability('vision');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Claude 3.5 Sonnet');
    });

    it('should return models with specific numeric capability', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithCapability('maxContextWindow');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no models have capability', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithCapability('embeddings');

      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // findModelsWithAllCapabilities
  // ============================================================================
  describe('findModelsWithAllCapabilities', () => {
    it('should return models with all specified capabilities', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithAllCapabilities([
        'chat',
        'streaming',
        'functionCalling'
      ]);

      expect(result).toHaveLength(2);
    });

    it('should filter out models missing any capability', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithAllCapabilities([
        'chat',
        'vision'
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Claude 3.5 Sonnet');
    });

    it('should return all models for empty capabilities list', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findModelsWithAllCapabilities([]);

      expect(result).toHaveLength(2);
    });
  });

  // ============================================================================
  // validateContextWindow
  // ============================================================================
  describe('validateContextWindow', () => {
    it('should return true when token count fits in context window', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateContextWindow('uuid-model-1', 50000);

      expect(result).toBe(true);
    });

    it('should return false when token count exceeds context window', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateContextWindow('uuid-model-1', 250000);

      expect(result).toBe(false);
    });

    it('should return true when token count equals context window', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateContextWindow('uuid-model-1', 200000);

      expect(result).toBe(true);
    });

    it('should return false when model not found', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(null);

      const result = await capabilityValidationService.validateContextWindow('non-existent', 1000);

      expect(result).toBe(false);
    });

    it('should return false when maxContextWindow not defined', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { chat: true }
      });

      const result = await capabilityValidationService.validateContextWindow('uuid-model-1', 1000);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // validateOutputTokens
  // ============================================================================
  describe('validateOutputTokens', () => {
    it('should return true when requested tokens within limit', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateOutputTokens('uuid-model-1', 4096);

      expect(result).toBe(true);
    });

    it('should return false when requested tokens exceed limit', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateOutputTokens('uuid-model-1', 10000);

      expect(result).toBe(false);
    });

    it('should return true when requested tokens equal limit', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await capabilityValidationService.validateOutputTokens('uuid-model-1', 8192);

      expect(result).toBe(true);
    });

    it('should return false when model not found', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue(null);

      const result = await capabilityValidationService.validateOutputTokens('non-existent', 1000);

      expect(result).toBe(false);
    });

    it('should return false when maxOutputTokens not defined', async () => {
      (modelCacheService.getBaseModel as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { chat: true }
      });

      const result = await capabilityValidationService.validateOutputTokens('uuid-model-1', 1000);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // compareCapabilities
  // ============================================================================
  describe('compareCapabilities', () => {
    it('should compare capabilities between two models', async () => {
      (modelCacheService.getBaseModel as jest.Mock)
        .mockResolvedValueOnce(mockBaseModel)
        .mockResolvedValueOnce(mockBaseModel2);

      const result = await capabilityValidationService.compareCapabilities(
        'uuid-model-1',
        'uuid-model-2'
      );

      expect(result).not.toBeNull();
      expect(result?.model1Id).toBe('uuid-model-1');
      expect(result?.model2Id).toBe('uuid-model-2');
      expect(result?.common).toContain('chat');
      expect(result?.common).toContain('streaming');
      expect(result?.common).toContain('functionCalling');
      expect(result?.onlyInModel1).toContain('vision');
      expect(result?.onlyInModel2).toContain('jsonMode');
    });

    it('should compare numeric capabilities correctly', async () => {
      (modelCacheService.getBaseModel as jest.Mock)
        .mockResolvedValueOnce(mockBaseModel)
        .mockResolvedValueOnce(mockBaseModel2);

      const result = await capabilityValidationService.compareCapabilities(
        'uuid-model-1',
        'uuid-model-2'
      );

      expect(result?.numericComparison).toContainEqual(
        expect.objectContaining({
          capability: 'maxContextWindow',
          model1Value: 200000,
          model2Value: 128000,
          winner: 'model1'
        })
      );
    });

    it('should return null when first model not found', async () => {
      (modelCacheService.getBaseModel as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockBaseModel2);

      const result = await capabilityValidationService.compareCapabilities(
        'non-existent',
        'uuid-model-2'
      );

      expect(result).toBeNull();
    });

    it('should return null when second model not found', async () => {
      (modelCacheService.getBaseModel as jest.Mock)
        .mockResolvedValueOnce(mockBaseModel)
        .mockResolvedValueOnce(null);

      const result = await capabilityValidationService.compareCapabilities(
        'uuid-model-1',
        'non-existent'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // findBestModelForTask
  // ============================================================================
  describe('findBestModelForTask', () => {
    it('should find best model based on required and preferred capabilities', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findBestModelForTask(
        ['chat', 'streaming'],
        ['vision', 'functionCalling']
      );

      expect(result).not.toBeNull();
      expect(result?.modelName).toBe('Claude 3.5 Sonnet');
      expect(result?.matchedCapabilities).toContain('chat');
      expect(result?.matchedCapabilities).toContain('streaming');
      expect(result?.matchedCapabilities).toContain('vision');
    });

    it('should return null when no models match required capabilities', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel, mockBaseModel2]);

      const result = await capabilityValidationService.findBestModelForTask(
        ['embeddings'], // Nenhum modelo tem
        []
      );

      expect(result).toBeNull();
    });

    it('should calculate score correctly', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);

      const result = await capabilityValidationService.findBestModelForTask(
        ['chat'],
        ['vision', 'functionCalling']
      );

      expect(result?.score).toBeGreaterThan(50); // Base score + preferred caps
    });

    it('should include missing capabilities in result', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);

      const result = await capabilityValidationService.findBestModelForTask(
        ['chat'],
        ['vision', 'embeddings'] // embeddings não existe
      );

      expect(result?.missingCapabilities).toContain('embeddings');
    });
  });

  // ============================================================================
  // updateCapabilities
  // ============================================================================
  describe('updateCapabilities', () => {
    it('should update capabilities successfully', async () => {
      const newCapabilities = { chat: true, streaming: true, vision: true };
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: newCapabilities
      });

      const result = await capabilityValidationService.updateCapabilities(
        'uuid-model-1',
        newCapabilities
      );

      expect(result?.capabilities).toEqual(newCapabilities);
      expect(modelCacheService.invalidateBaseModel).toHaveBeenCalledWith('uuid-model-1');
    });

    it('should throw error for invalid capabilities', async () => {
      await expect(
        capabilityValidationService.updateCapabilities('uuid-model-1', {
          chat: 'yes' // Invalid type
        } as unknown as Record<string, boolean>)
      ).rejects.toThrow('Invalid capabilities');
    });

    it('should return null when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await capabilityValidationService.updateCapabilities('non-existent', {
        chat: true
      });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // mergeCapabilities
  // ============================================================================
  describe('mergeCapabilities', () => {
    it('should merge new capabilities with existing ones', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: {
          ...mockBaseModel.capabilities,
          reasoning: true
        }
      });

      const result = await capabilityValidationService.mergeCapabilities('uuid-model-1', {
        reasoning: true
      });

      expect(result?.capabilities).toHaveProperty('reasoning', true);
      expect(result?.capabilities).toHaveProperty('chat', true); // Mantém existente
      expect(modelCacheService.invalidateBaseModel).toHaveBeenCalledWith('uuid-model-1');
    });

    it('should throw error for invalid new capabilities', async () => {
      await expect(
        capabilityValidationService.mergeCapabilities('uuid-model-1', {
          maxContextWindow: -100
        })
      ).rejects.toThrow('Invalid capabilities');
    });

    it('should return null when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await capabilityValidationService.mergeCapabilities('non-existent', {
        chat: true
      });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Métodos Auxiliares
  // ============================================================================
  describe('getAllCapabilityNames', () => {
    it('should return all capability names', () => {
      const names = capabilityValidationService.getAllCapabilityNames();

      expect(names).toContain('chat');
      expect(names).toContain('streaming');
      expect(names).toContain('maxContextWindow');
      expect(names).toContain('languages');
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('getBooleanCapabilityNames', () => {
    it('should return only boolean capability names', () => {
      const names = capabilityValidationService.getBooleanCapabilityNames();

      expect(names).toContain('chat');
      expect(names).toContain('streaming');
      expect(names).toContain('vision');
      expect(names).not.toContain('maxContextWindow');
      expect(names).not.toContain('languages');
    });
  });

  describe('getNumericCapabilityNames', () => {
    it('should return only numeric capability names', () => {
      const names = capabilityValidationService.getNumericCapabilityNames();

      expect(names).toContain('maxContextWindow');
      expect(names).toContain('maxOutputTokens');
      expect(names).not.toContain('chat');
      expect(names).not.toContain('languages');
    });
  });

  describe('getListCapabilityNames', () => {
    it('should return only list capability names', () => {
      const names = capabilityValidationService.getListCapabilityNames();

      expect(names).toContain('languages');
      expect(names).toContain('supportedInputFormats');
      expect(names).not.toContain('chat');
      expect(names).not.toContain('maxContextWindow');
    });
  });
});
