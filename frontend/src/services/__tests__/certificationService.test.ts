// frontend/src/services/__tests__/certificationService.test.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Testes Unitários - certificationService
 *
 * Testa o serviço de certificação regional sem dependências do React Query
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificationService } from '../certificationService';
import { api } from '../api';
import type { RegionalCertification, AWSRegion } from '../../types/ai';

// Mock do axios/api
vi.mock('../api', () => ({
  api: {
    get: vi.fn()
  }
}));

// Dados de teste
const mockCertifications: RegionalCertification[] = [
  {
    region: 'us-east-1' as AWSRegion,
    status: 'certified',
    lastTestedAt: '2024-01-15T10:00:00Z',
    attempts: 5,
    successRate: 100
  },
  {
    region: 'us-west-2' as AWSRegion,
    status: 'certified',
    lastTestedAt: '2024-01-15T10:05:00Z',
    attempts: 3,
    successRate: 100
  },
  {
    region: 'eu-west-1' as AWSRegion,
    status: 'failed',
    lastTestedAt: '2024-01-15T10:10:00Z',
    attempts: 2,
    successRate: 0,
    error: 'Model not available in this region',
    errorCategory: 'UNAVAILABLE'
  },
  {
    region: 'ap-southeast-1' as AWSRegion,
    status: 'quality_warning',
    lastTestedAt: '2024-01-15T10:15:00Z',
    attempts: 4,
    successRate: 75
  }
];

describe('certificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRegionalCertifications', () => {
    it('deve buscar certificações de todas as regiões', async () => {
      // Arrange - O service espera { certifications: [...] } no response.data
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getAllRegionalCertifications(
        'anthropic:claude-3-5-sonnet',
        'aws-bedrock'
      );

      // Assert
      expect(result).toEqual(mockCertifications);
      expect(api.get).toHaveBeenCalledWith(
        '/certification-queue/certifications',
        {
          params: {
            modelId: 'anthropic:claude-3-5-sonnet',
            providerId: 'aws-bedrock',
            limit: 100
          }
        }
      );
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não há certificações', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: [] } });

      // Act
      const result = await certificationService.getAllRegionalCertifications(
        'anthropic:claude-3-5-sonnet',
        'aws-bedrock'
      );

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve lançar erro quando API falha', async () => {
      // Arrange
      const mockError = new Error('API Error: Network failure');
      vi.mocked(api.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        certificationService.getAllRegionalCertifications(
          'anthropic:claude-3-5-sonnet',
          'aws-bedrock'
        )
      ).rejects.toThrow('API Error: Network failure');
    });

    it('deve passar parâmetros corretos na query string', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      await certificationService.getAllRegionalCertifications(
        'test-model-id',
        'test-provider-id'
      );

      // Assert
      expect(api.get).toHaveBeenCalledWith(
        '/certification-queue/certifications',
        expect.objectContaining({
          params: {
            modelId: 'test-model-id',
            providerId: 'test-provider-id',
            limit: 100
          }
        })
      );
    });

    it('deve retornar certificações com todos os campos esperados', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getAllRegionalCertifications(
        'anthropic:claude-3-5-sonnet',
        'aws-bedrock'
      );

      // Assert
      expect(result[0]).toHaveProperty('region');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('lastTestedAt');
      expect(result[0]).toHaveProperty('attempts');
      expect(result[0]).toHaveProperty('successRate');
    });

    it('deve lidar com certificações com erro', async () => {
      // Arrange
      const certWithError: RegionalCertification[] = [
        {
          region: 'us-east-1' as AWSRegion,
          status: 'failed',
          attempts: 1,
          successRate: 0,
          error: 'Permission denied',
          errorCategory: 'UNAVAILABLE'
        }
      ];
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: certWithError } });

      // Act
      const result = await certificationService.getAllRegionalCertifications(
        'anthropic:claude-3-5-sonnet',
        'aws-bedrock'
      );

      // Assert
      expect(result[0].error).toBe('Permission denied');
      expect(result[0].errorCategory).toBe('UNAVAILABLE');
    });
  });

  describe('getRegionalCertification', () => {
    it('deve buscar certificação de região específica', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'us-east-1',
        'aws-bedrock'
      );

      // Assert
      expect(result).toEqual(mockCertifications[0]);
      expect(result?.region).toBe('us-east-1');
      expect(result?.status).toBe('certified');
    });

    it('deve retornar null para região não encontrada', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'ap-northeast-1' as AWSRegion,
        'aws-bedrock'
      );

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar null quando não há certificações', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: [] } });

      // Act
      const result = await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'us-east-1',
        'aws-bedrock'
      );

      // Assert
      expect(result).toBeNull();
    });

    it('deve buscar certificação com status failed', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'eu-west-1',
        'aws-bedrock'
      );

      // Assert
      expect(result).toEqual(mockCertifications[2]);
      expect(result?.status).toBe('failed');
      expect(result?.error).toBe('Model not available in this region');
    });

    it('deve buscar certificação com status quality_warning', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      const result = await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'ap-southeast-1',
        'aws-bedrock'
      );

      // Assert
      expect(result).toEqual(mockCertifications[3]);
      expect(result?.status).toBe('quality_warning');
      expect(result?.successRate).toBe(75);
    });

    it('deve lançar erro quando API falha', async () => {
      // Arrange
      const mockError = new Error('API Error: Timeout');
      vi.mocked(api.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        certificationService.getRegionalCertification(
          'anthropic:claude-3-5-sonnet',
          'us-east-1',
          'aws-bedrock'
        )
      ).rejects.toThrow('API Error: Timeout');
    });
  });

  describe('Integração entre métodos', () => {
    it('getRegionalCertification deve usar getAllRegionalCertifications internamente', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'us-east-1',
        'aws-bedrock'
      );

      // Assert - Deve ter chamado a API uma vez
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(
        '/certification-queue/certifications',
        expect.any(Object)
      );
    });

    it('múltiplas chamadas para mesma região devem fazer múltiplas requisições', async () => {
      // Arrange
      vi.mocked(api.get).mockResolvedValue({ data: { certifications: mockCertifications } });

      // Act
      await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'us-east-1',
        'aws-bedrock'
      );
      await certificationService.getRegionalCertification(
        'anthropic:claude-3-5-sonnet',
        'us-east-1',
        'aws-bedrock'
      );

      // Assert - Sem cache no serviço, deve chamar 2 vezes
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});
