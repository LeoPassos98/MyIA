// backend/src/services/models/__tests__/baseModelService.test.ts
// Standards: docs/STANDARDS.md

import { Prisma } from '@prisma/client';
import { baseModelService } from '../baseModelService';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    baseModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

// Mock do logger para evitar output durante testes
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('BaseModelService', () => {
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
      functionCalling: true,
      maxContextWindow: 200000,
      maxOutputTokens: 8192
    },
    defaultParams: {
      temperature: 0.7,
      topP: 0.9
    },
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
    family: 'GPT',
    version: '4-turbo'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // findAll
  // ============================================================================
  describe('findAll', () => {
    it('should return paginated models without filters', async () => {
      const mockModels = [mockBaseModel, mockBaseModel2];
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue(mockModels);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(2);

      const result = await baseModelService.findAll();

      expect(result.models).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' }
        })
      );
    });

    it('should apply vendor filter correctly', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      const result = await baseModelService.findAll({ vendor: 'Anthropic' });

      expect(result.models).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vendor: 'Anthropic' })
        })
      );
    });

    it('should apply family filter correctly', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      const result = await baseModelService.findAll({ family: 'Claude' });

      expect(result.models).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ family: 'Claude' })
        })
      );
    });

    it('should apply deprecated filter correctly', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(0);

      await baseModelService.findAll({ deprecated: true });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deprecated: true })
        })
      );
    });

    it('should apply search filter with OR conditions', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      await baseModelService.findAll({ search: 'Claude' });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Claude', mode: 'insensitive' } })
            ])
          })
        })
      );
    });

    it('should respect pagination options', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(50);

      const result = await baseModelService.findAll({}, { page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10
        })
      );
    });

    it('should limit maximum items to 100', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(0);

      await baseModelService.findAll({}, { limit: 500 });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100
        })
      );
    });

    it('should include deployments when requested', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      await baseModelService.findAll({}, { includeDeployments: true });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { deployments: true }
        })
      );
    });

    it('should apply custom ordering', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(0);

      await baseModelService.findAll({}, { orderBy: 'createdAt', order: 'desc' });

      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });
  });

  // ============================================================================
  // findById
  // ============================================================================
  describe('findById', () => {
    it('should return model when found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await baseModelService.findById('uuid-model-1');

      expect(result).toEqual(mockBaseModel);
      expect(prisma.baseModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-model-1' },
        include: { deployments: false }
      });
    });

    it('should return null when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await baseModelService.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include deployments when requested', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);

      await baseModelService.findById('uuid-model-1', true);

      expect(prisma.baseModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-model-1' },
        include: { deployments: true }
      });
    });
  });

  // ============================================================================
  // findByName
  // ============================================================================
  describe('findByName', () => {
    it('should return model when found by name', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await baseModelService.findByName('Claude 3.5 Sonnet');

      expect(result).toEqual(mockBaseModel);
      expect(prisma.baseModel.findUnique).toHaveBeenCalledWith({
        where: { name: 'Claude 3.5 Sonnet' },
        include: { deployments: false }
      });
    });

    it('should return null when model name not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await baseModelService.findByName('Non-existent Model');

      expect(result).toBeNull();
    });

    it('should include deployments when requested', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);

      await baseModelService.findByName('Claude 3.5 Sonnet', true);

      expect(prisma.baseModel.findUnique).toHaveBeenCalledWith({
        where: { name: 'Claude 3.5 Sonnet' },
        include: { deployments: true }
      });
    });
  });

  // ============================================================================
  // findByVendor
  // ============================================================================
  describe('findByVendor', () => {
    it('should return models filtered by vendor', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      const result = await baseModelService.findByVendor('Anthropic');

      expect(result.models).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vendor: 'Anthropic' })
        })
      );
    });
  });

  // ============================================================================
  // findByFamily
  // ============================================================================
  describe('findByFamily', () => {
    it('should return models filtered by family', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      const result = await baseModelService.findByFamily('Claude');

      expect(result.models).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ family: 'Claude' })
        })
      );
    });
  });

  // ============================================================================
  // findActive
  // ============================================================================
  describe('findActive', () => {
    it('should return only non-deprecated models', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([mockBaseModel]);
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(1);

      const result = await baseModelService.findActive();

      expect(result.models).toHaveLength(1);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deprecated: false })
        })
      );
    });
  });

  // ============================================================================
  // create
  // ============================================================================
  describe('create', () => {
    it('should create model with valid data', async () => {
      const createData = {
        name: 'New Model',
        vendor: 'TestVendor',
        family: 'TestFamily',
        version: '1.0',
        capabilities: { streaming: true },
        defaultParams: { temperature: 0.5 },
        description: 'Test model'
      };

      (prisma.baseModel.create as jest.Mock).mockResolvedValue({
        id: 'new-uuid',
        ...createData,
        deprecated: false,
        replacedBy: null,
        releaseDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deployments: []
      });

      const result = await baseModelService.create(createData);

      expect(result.id).toBe('new-uuid');
      expect(result.name).toBe('New Model');
      expect(prisma.baseModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Model',
            vendor: 'TestVendor',
            deprecated: false
          })
        })
      );
    });

    it('should throw error when name already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0'
      });
      (prisma.baseModel.create as jest.Mock).mockRejectedValue(error);

      await expect(
        baseModelService.create({
          name: 'Existing Model',
          vendor: 'TestVendor',
          capabilities: {}
        })
      ).rejects.toThrow('BaseModel with name "Existing Model" already exists');
    });

    it('should propagate unknown errors', async () => {
      const error = new Error('Database connection failed');
      (prisma.baseModel.create as jest.Mock).mockRejectedValue(error);

      await expect(
        baseModelService.create({
          name: 'New Model',
          vendor: 'TestVendor',
          capabilities: {}
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ============================================================================
  // update
  // ============================================================================
  describe('update', () => {
    it('should update model with valid data', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        description: 'Updated description'
      });

      const result = await baseModelService.update('uuid-model-1', {
        description: 'Updated description'
      });

      expect(result?.description).toBe('Updated description');
      expect(prisma.baseModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-model-1' }
        })
      );
    });

    it('should return null when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await baseModelService.update('non-existent-id', {
        description: 'Updated'
      });

      expect(result).toBeNull();
      expect(prisma.baseModel.update).not.toHaveBeenCalled();
    });

    it('should throw error on duplicate name', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0'
      });
      (prisma.baseModel.update as jest.Mock).mockRejectedValue(error);

      await expect(
        baseModelService.update('uuid-model-1', { name: 'Existing Name' })
      ).rejects.toThrow('BaseModel with name "Existing Name" already exists');
    });

    it('should update capabilities correctly', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        capabilities: { streaming: true, vision: false }
      });

      const result = await baseModelService.update('uuid-model-1', {
        capabilities: { streaming: true, vision: false }
      });

      expect(result?.capabilities).toEqual({ streaming: true, vision: false });
    });
  });

  // ============================================================================
  // delete (soft delete)
  // ============================================================================
  describe('delete', () => {
    it('should soft delete model by marking as deprecated', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        deprecated: true,
        replacedBy: 'Claude 4'
      });

      const result = await baseModelService.delete('uuid-model-1', 'Claude 4');

      expect(result?.deprecated).toBe(true);
      expect(result?.replacedBy).toBe('Claude 4');
      expect(prisma.baseModel.update).toHaveBeenCalledWith({
        where: { id: 'uuid-model-1' },
        data: {
          deprecated: true,
          replacedBy: 'Claude 4'
        }
      });
    });

    it('should return null when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await baseModelService.delete('non-existent-id');

      expect(result).toBeNull();
      expect(prisma.baseModel.update).not.toHaveBeenCalled();
    });

    it('should soft delete without replacedBy', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.update as jest.Mock).mockResolvedValue({
        ...mockBaseModel,
        deprecated: true,
        replacedBy: null
      });

      const result = await baseModelService.delete('uuid-model-1');

      expect(result?.deprecated).toBe(true);
      expect(result?.replacedBy).toBeNull();
    });
  });

  // ============================================================================
  // deleteHard
  // ============================================================================
  describe('deleteHard', () => {
    it('should permanently delete model', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.delete as jest.Mock).mockResolvedValue(mockBaseModel);

      const result = await baseModelService.deleteHard('uuid-model-1');

      expect(result).toBe(true);
      expect(prisma.baseModel.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-model-1' }
      });
    });

    it('should return false when model not found', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await baseModelService.deleteHard('non-existent-id');

      expect(result).toBe(false);
      expect(prisma.baseModel.delete).not.toHaveBeenCalled();
    });

    it('should propagate errors on delete failure', async () => {
      (prisma.baseModel.findUnique as jest.Mock).mockResolvedValue(mockBaseModel);
      (prisma.baseModel.delete as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint')
      );

      await expect(baseModelService.deleteHard('uuid-model-1')).rejects.toThrow(
        'Foreign key constraint'
      );
    });
  });

  // ============================================================================
  // count
  // ============================================================================
  describe('count', () => {
    it('should return total count without filters', async () => {
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(10);

      const result = await baseModelService.count();

      expect(result).toBe(10);
      expect(prisma.baseModel.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return count with vendor filter', async () => {
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(3);

      const result = await baseModelService.count({ vendor: 'Anthropic' });

      expect(result).toBe(3);
      expect(prisma.baseModel.count).toHaveBeenCalledWith({
        where: { vendor: 'Anthropic' }
      });
    });

    it('should return count with multiple filters', async () => {
      (prisma.baseModel.count as jest.Mock).mockResolvedValue(2);

      const result = await baseModelService.count({
        vendor: 'Anthropic',
        family: 'Claude',
        deprecated: false
      });

      expect(result).toBe(2);
      expect(prisma.baseModel.count).toHaveBeenCalledWith({
        where: {
          vendor: 'Anthropic',
          family: 'Claude',
          deprecated: false
        }
      });
    });
  });

  // ============================================================================
  // getVendors
  // ============================================================================
  describe('getVendors', () => {
    it('should return unique vendors', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([
        { vendor: 'Anthropic' },
        { vendor: 'OpenAI' },
        { vendor: 'Meta' }
      ]);

      const result = await baseModelService.getVendors();

      expect(result).toEqual(['Anthropic', 'OpenAI', 'Meta']);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith({
        select: { vendor: true },
        distinct: ['vendor'],
        orderBy: { vendor: 'asc' }
      });
    });

    it('should return empty array when no vendors', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([]);

      const result = await baseModelService.getVendors();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // getFamilies
  // ============================================================================
  describe('getFamilies', () => {
    it('should return unique families excluding nulls', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([
        { family: 'Claude' },
        { family: 'GPT' },
        { family: 'Llama' }
      ]);

      const result = await baseModelService.getFamilies();

      expect(result).toEqual(['Claude', 'GPT', 'Llama']);
      expect(prisma.baseModel.findMany).toHaveBeenCalledWith({
        select: { family: true },
        distinct: ['family'],
        where: { family: { not: null } },
        orderBy: { family: 'asc' }
      });
    });

    it('should return empty array when no families', async () => {
      (prisma.baseModel.findMany as jest.Mock).mockResolvedValue([]);

      const result = await baseModelService.getFamilies();

      expect(result).toEqual([]);
    });
  });
});
