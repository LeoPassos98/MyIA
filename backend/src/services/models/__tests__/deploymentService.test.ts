// backend/src/services/models/__tests__/deploymentService.test.ts
// Standards: docs/STANDARDS.md

import { Prisma, InferenceType } from '@prisma/client';
import { deploymentService } from '../deploymentService';
import { prisma } from '../../../lib/prisma';

// Mock do Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    modelDeployment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
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

describe('DeploymentService', () => {
  // Dados de mock reutilizáveis
  const mockDeployment = {
    id: 'uuid-deployment-1',
    baseModelId: 'uuid-model-1',
    providerId: 'uuid-provider-1',
    deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    inferenceType: 'ON_DEMAND' as InferenceType,
    providerConfig: { region: 'us-east-1' },
    costPer1MInput: 3.0,
    costPer1MOutput: 15.0,
    costPerHour: null,
    customParams: { temperature: 0.7 },
    capabilitiesVerifiedAt: null,
    capabilitiesSource: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    baseModel: {
      id: 'uuid-model-1',
      name: 'Claude 3.5 Sonnet',
      vendor: 'Anthropic'
    },
    provider: {
      id: 'uuid-provider-1',
      name: 'AWS Bedrock',
      slug: 'bedrock'
    },
    certifications: []
  };

  const mockDeployment2 = {
    ...mockDeployment,
    id: 'uuid-deployment-2',
    deploymentId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    inferenceType: 'INFERENCE_PROFILE' as InferenceType
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // findAll
  // ============================================================================
  describe('findAll', () => {
    it('should return paginated deployments without filters', async () => {
      const mockDeployments = [mockDeployment, mockDeployment2];
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue(mockDeployments);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(2);

      const result = await deploymentService.findAll();

      expect(result.deployments).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { deploymentId: 'asc' }
        })
      );
    });

    it('should apply baseModelId filter correctly', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({ baseModelId: 'uuid-model-1' });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ baseModelId: 'uuid-model-1' })
        })
      );
    });

    it('should apply providerId filter correctly', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({ providerId: 'uuid-provider-1' });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ providerId: 'uuid-provider-1' })
        })
      );
    });

    it('should apply inferenceType filter correctly', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({ inferenceType: 'ON_DEMAND' });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ inferenceType: 'ON_DEMAND' })
        })
      );
    });

    it('should apply isActive filter correctly', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({ isActive: true });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true })
        })
      );
    });

    it('should apply search filter with OR conditions', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({ search: 'claude' });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ deploymentId: { contains: 'claude', mode: 'insensitive' } })
            ])
          })
        })
      );
    });

    it('should include related entities when requested', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      await deploymentService.findAll({}, {
        includeBaseModel: true,
        includeProvider: true,
        includeCertifications: true
      });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            baseModel: true,
            provider: true,
            certifications: true
          }
        })
      );
    });

    it('should respect pagination options', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(50);

      const result = await deploymentService.findAll({}, { page: 2, limit: 15 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(15);
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15
        })
      );
    });

    it('should apply custom ordering', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(0);

      await deploymentService.findAll({}, { orderBy: 'costPer1MInput', order: 'desc' });

      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { costPer1MInput: 'desc' }
        })
      );
    });
  });

  // ============================================================================
  // findById
  // ============================================================================
  describe('findById', () => {
    it('should return deployment when found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);

      const result = await deploymentService.findById('uuid-deployment-1');

      expect(result).toEqual(mockDeployment);
      expect(prisma.modelDeployment.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-deployment-1' },
        include: {
          baseModel: false,
          provider: false,
          certifications: false
        }
      });
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include related entities when requested', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);

      await deploymentService.findById('uuid-deployment-1', true, true, true);

      expect(prisma.modelDeployment.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-deployment-1' },
        include: {
          baseModel: true,
          provider: true,
          certifications: true
        }
      });
    });
  });

  // ============================================================================
  // findByDeploymentId
  // ============================================================================
  describe('findByDeploymentId', () => {
    it('should return deployment when found by composite key', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);

      const result = await deploymentService.findByDeploymentId(
        'uuid-provider-1',
        'anthropic.claude-3-5-sonnet-20241022-v2:0'
      );

      expect(result).toEqual(mockDeployment);
      expect(prisma.modelDeployment.findUnique).toHaveBeenCalledWith({
        where: {
          providerId_deploymentId: {
            providerId: 'uuid-provider-1',
            deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
          }
        },
        include: {
          baseModel: false,
          provider: false,
          certifications: false
        }
      });
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.findByDeploymentId(
        'uuid-provider-1',
        'non-existent-deployment'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // findByProvider
  // ============================================================================
  describe('findByProvider', () => {
    it('should return deployments filtered by provider', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      const result = await deploymentService.findByProvider('uuid-provider-1');

      expect(result.deployments).toHaveLength(1);
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ providerId: 'uuid-provider-1' })
        })
      );
    });
  });

  // ============================================================================
  // findByInferenceType
  // ============================================================================
  describe('findByInferenceType', () => {
    it('should return deployments filtered by inference type', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([mockDeployment]);
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(1);

      const result = await deploymentService.findByInferenceType('ON_DEMAND');

      expect(result.deployments).toHaveLength(1);
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ inferenceType: 'ON_DEMAND' })
        })
      );
    });
  });

  // ============================================================================
  // create
  // ============================================================================
  describe('create', () => {
    it('should create deployment with valid data', async () => {
      const createData = {
        baseModelId: 'uuid-model-1',
        providerId: 'uuid-provider-1',
        deploymentId: 'new-deployment-id',
        inferenceType: 'ON_DEMAND' as InferenceType,
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      };

      (prisma.modelDeployment.create as jest.Mock).mockResolvedValue({
        id: 'new-uuid',
        ...createData,
        providerConfig: null,
        costPerHour: null,
        customParams: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        baseModel: mockDeployment.baseModel,
        provider: mockDeployment.provider,
        certifications: []
      });

      const result = await deploymentService.create(createData);

      expect(result.id).toBe('new-uuid');
      expect(result.deploymentId).toBe('new-deployment-id');
      expect(prisma.modelDeployment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            baseModelId: 'uuid-model-1',
            providerId: 'uuid-provider-1',
            deploymentId: 'new-deployment-id',
            inferenceType: 'ON_DEMAND',
            isActive: true
          })
        })
      );
    });

    it('should throw error when unique constraint violated', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0'
      });
      (prisma.modelDeployment.create as jest.Mock).mockRejectedValue(error);

      await expect(
        deploymentService.create({
          baseModelId: 'uuid-model-1',
          providerId: 'uuid-provider-1',
          deploymentId: 'existing-deployment',
          costPer1MInput: 3.0,
          costPer1MOutput: 15.0
        })
      ).rejects.toThrow('Deployment with providerId');
    });

    it('should throw error when foreign key constraint fails', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0'
      });
      (prisma.modelDeployment.create as jest.Mock).mockRejectedValue(error);

      await expect(
        deploymentService.create({
          baseModelId: 'non-existent-model',
          providerId: 'uuid-provider-1',
          deploymentId: 'new-deployment',
          costPer1MInput: 3.0,
          costPer1MOutput: 15.0
        })
      ).rejects.toThrow('BaseModel or Provider does not exist');
    });
  });

  // ============================================================================
  // update
  // ============================================================================
  describe('update', () => {
    it('should update deployment with valid data', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        isActive: false
      });

      const result = await deploymentService.update('uuid-deployment-1', {
        isActive: false
      });

      expect(result?.isActive).toBe(false);
      expect(prisma.modelDeployment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-deployment-1' }
        })
      );
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.update('non-existent-id', {
        isActive: false
      });

      expect(result).toBeNull();
      expect(prisma.modelDeployment.update).not.toHaveBeenCalled();
    });

    it('should update costs correctly', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        costPer1MInput: 4.0,
        costPer1MOutput: 20.0
      });

      const result = await deploymentService.update('uuid-deployment-1', {
        costPer1MInput: 4.0,
        costPer1MOutput: 20.0
      });

      expect(result?.costPer1MInput).toBe(4.0);
      expect(result?.costPer1MOutput).toBe(20.0);
    });

    it('should handle null providerConfig correctly', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        providerConfig: null
      });

      const result = await deploymentService.update('uuid-deployment-1', {
        providerConfig: null
      });

      expect(result?.providerConfig).toBeNull();
    });
  });

  // ============================================================================
  // delete (soft delete)
  // ============================================================================
  describe('delete', () => {
    it('should soft delete deployment by marking as inactive', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        isActive: false
      });

      const result = await deploymentService.delete('uuid-deployment-1');

      expect(result?.isActive).toBe(false);
      expect(prisma.modelDeployment.update).toHaveBeenCalledWith({
        where: { id: 'uuid-deployment-1' },
        data: { isActive: false }
      });
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.delete('non-existent-id');

      expect(result).toBeNull();
      expect(prisma.modelDeployment.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // deleteHard
  // ============================================================================
  describe('deleteHard', () => {
    it('should permanently delete deployment', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.delete as jest.Mock).mockResolvedValue(mockDeployment);

      const result = await deploymentService.deleteHard('uuid-deployment-1');

      expect(result).toBe(true);
      expect(prisma.modelDeployment.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-deployment-1' }
      });
    });

    it('should return false when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.deleteHard('non-existent-id');

      expect(result).toBe(false);
      expect(prisma.modelDeployment.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // updateCosts
  // ============================================================================
  describe('updateCosts', () => {
    it('should update costs successfully', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        costPer1MInput: 5.0,
        costPer1MOutput: 25.0
      });

      const result = await deploymentService.updateCosts('uuid-deployment-1', 5.0, 25.0);

      expect(result?.costPer1MInput).toBe(5.0);
      expect(result?.costPer1MOutput).toBe(25.0);
      expect(prisma.modelDeployment.update).toHaveBeenCalledWith({
        where: { id: 'uuid-deployment-1' },
        data: {
          costPer1MInput: 5.0,
          costPer1MOutput: 25.0
        },
        include: {
          baseModel: true,
          provider: true
        }
      });
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.updateCosts('non-existent-id', 5.0, 25.0);

      expect(result).toBeNull();
      expect(prisma.modelDeployment.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // getCostEstimate
  // ============================================================================
  describe('getCostEstimate', () => {
    it('should calculate cost estimate correctly', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue({
        deploymentId: 'test-deployment',
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      });

      const result = await deploymentService.getCostEstimate(
        'uuid-deployment-1',
        1000,
        500
      );

      expect(result).not.toBeNull();
      expect(result?.deploymentId).toBe('test-deployment');
      expect(result?.inputTokens).toBe(1000);
      expect(result?.outputTokens).toBe(500);
      // 1000 tokens * (3.0 / 1_000_000) = 0.003
      expect(result?.inputCost).toBe(0.003);
      // 500 tokens * (15.0 / 1_000_000) = 0.0075
      expect(result?.outputCost).toBe(0.0075);
      expect(result?.totalCost).toBe(0.0105);
      expect(result?.currency).toBe('USD');
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.getCostEstimate(
        'non-existent-id',
        1000,
        500
      );

      expect(result).toBeNull();
    });

    it('should handle zero tokens correctly', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue({
        deploymentId: 'test-deployment',
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      });

      const result = await deploymentService.getCostEstimate(
        'uuid-deployment-1',
        0,
        0
      );

      expect(result?.inputCost).toBe(0);
      expect(result?.outputCost).toBe(0);
      expect(result?.totalCost).toBe(0);
    });

    it('should handle large token counts correctly', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue({
        deploymentId: 'test-deployment',
        costPer1MInput: 3.0,
        costPer1MOutput: 15.0
      });

      const result = await deploymentService.getCostEstimate(
        'uuid-deployment-1',
        1_000_000,
        500_000
      );

      expect(result?.inputCost).toBe(3.0);
      expect(result?.outputCost).toBe(7.5);
      expect(result?.totalCost).toBe(10.5);
    });
  });

  // ============================================================================
  // count
  // ============================================================================
  describe('count', () => {
    it('should return total count without filters', async () => {
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(10);

      const result = await deploymentService.count();

      expect(result).toBe(10);
      expect(prisma.modelDeployment.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return count with filters', async () => {
      (prisma.modelDeployment.count as jest.Mock).mockResolvedValue(5);

      const result = await deploymentService.count({
        providerId: 'uuid-provider-1',
        isActive: true
      });

      expect(result).toBe(5);
      expect(prisma.modelDeployment.count).toHaveBeenCalledWith({
        where: {
          providerId: 'uuid-provider-1',
          isActive: true
        }
      });
    });
  });

  // ============================================================================
  // getInferenceTypes
  // ============================================================================
  describe('getInferenceTypes', () => {
    it('should return unique inference types', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([
        { inferenceType: 'ON_DEMAND' },
        { inferenceType: 'INFERENCE_PROFILE' },
        { inferenceType: 'PROVISIONED' }
      ]);

      const result = await deploymentService.getInferenceTypes();

      expect(result).toEqual(['ON_DEMAND', 'INFERENCE_PROFILE', 'PROVISIONED']);
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith({
        select: { inferenceType: true },
        distinct: ['inferenceType'],
        orderBy: { inferenceType: 'asc' }
      });
    });
  });

  // ============================================================================
  // getProviders
  // ============================================================================
  describe('getProviders', () => {
    it('should return unique providers with deployments', async () => {
      (prisma.modelDeployment.findMany as jest.Mock).mockResolvedValue([
        { provider: { id: 'uuid-1', name: 'AWS Bedrock', slug: 'bedrock' } },
        { provider: { id: 'uuid-2', name: 'OpenAI', slug: 'openai' } }
      ]);

      const result = await deploymentService.getProviders();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'uuid-1', name: 'AWS Bedrock', slug: 'bedrock' });
      expect(prisma.modelDeployment.findMany).toHaveBeenCalledWith({
        select: {
          provider: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        distinct: ['providerId']
      });
    });
  });

  // ============================================================================
  // verifyCapabilities
  // ============================================================================
  describe('verifyCapabilities', () => {
    it('should update capabilities verification timestamp', async () => {
      const now = new Date();
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(mockDeployment);
      (prisma.modelDeployment.update as jest.Mock).mockResolvedValue({
        ...mockDeployment,
        capabilitiesVerifiedAt: now,
        capabilitiesSource: 'auto_test'
      });

      const result = await deploymentService.verifyCapabilities('uuid-deployment-1', 'auto_test');

      expect(result?.capabilitiesVerifiedAt).toEqual(now);
      expect(result?.capabilitiesSource).toBe('auto_test');
      expect(prisma.modelDeployment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-deployment-1' },
          data: expect.objectContaining({
            capabilitiesSource: 'auto_test'
          })
        })
      );
    });

    it('should return null when deployment not found', async () => {
      (prisma.modelDeployment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deploymentService.verifyCapabilities('non-existent-id', 'manual');

      expect(result).toBeNull();
      expect(prisma.modelDeployment.update).not.toHaveBeenCalled();
    });
  });
});
