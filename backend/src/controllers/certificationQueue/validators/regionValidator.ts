// backend/src/controllers/certificationQueue/validators/regionValidator.ts
// Standards: docs/STANDARDS.md

import { logger } from '../../../utils/logger';

/**
 * Interface para região AWS
 */
export interface Region {
  id: string;
  name: string;
}

/**
 * Lista de regiões AWS Bedrock disponíveis
 */
const AVAILABLE_REGIONS: Region[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'Europe (Ireland)' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' }
];

/**
 * Validador de regiões AWS para certificação
 * 
 * Responsabilidades:
 * - Validar se uma região é válida
 * - Fornecer lista de regiões disponíveis
 * - Validar múltiplas regiões de uma vez
 */
export class RegionValidator {
  /**
   * Obtém lista de regiões AWS Bedrock disponíveis
   * 
   * @returns Array de regiões disponíveis
   */
  getAvailableRegions(): Region[] {
    return AVAILABLE_REGIONS;
  }

  /**
   * Verifica se uma região é válida
   * 
   * @param region - ID da região (ex: "us-east-1")
   * @returns true se a região é válida, false caso contrário
   */
  isValidRegion(region: string): boolean {
    const isValid = AVAILABLE_REGIONS.some(r => r.id === region);
    
    if (!isValid) {
      logger.debug('[RegionValidator] Região inválida', {
        region,
        availableRegions: AVAILABLE_REGIONS.map(r => r.id)
      });
    }
    
    return isValid;
  }

  /**
   * Valida uma região e retorna informações detalhadas
   * 
   * @param region - ID da região
   * @returns Objeto com informações de validação
   */
  validateRegion(region: string): { valid: boolean; region?: Region; error?: string } {
    logger.debug('[RegionValidator] Validando região', { region });

    if (!region || typeof region !== 'string') {
      return {
        valid: false,
        error: 'Region must be a non-empty string'
      };
    }

    const foundRegion = AVAILABLE_REGIONS.find(r => r.id === region);
    
    if (!foundRegion) {
      return {
        valid: false,
        error: `Invalid region: ${region}. Available regions: ${AVAILABLE_REGIONS.map(r => r.id).join(', ')}`
      };
    }

    logger.debug('[RegionValidator] Região válida', {
      region: foundRegion.id,
      name: foundRegion.name
    });

    return {
      valid: true,
      region: foundRegion
    };
  }

  /**
   * Valida múltiplas regiões de uma vez
   * 
   * @param regions - Array de IDs de regiões
   * @returns Objeto com regiões válidas e inválidas
   */
  validateMultipleRegions(regions: string[]): {
    valid: Region[];
    invalid: string[];
    allValid: boolean;
  } {
    logger.debug('[RegionValidator] Validando múltiplas regiões', {
      count: regions.length,
      regions
    });

    const valid: Region[] = [];
    const invalid: string[] = [];

    for (const regionId of regions) {
      const result = this.validateRegion(regionId);
      
      if (result.valid && result.region) {
        valid.push(result.region);
      } else {
        invalid.push(regionId);
      }
    }

    logger.info('[RegionValidator] Validação de múltiplas regiões concluída', {
      total: regions.length,
      valid: valid.length,
      invalid: invalid.length
    });

    return {
      valid,
      invalid,
      allValid: invalid.length === 0
    };
  }

  /**
   * Obtém nome amigável de uma região
   * 
   * @param regionId - ID da região
   * @returns Nome da região ou o ID se não encontrada
   */
  getRegionName(regionId: string): string {
    const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
    return region ? region.name : regionId;
  }
}

// Exportar instância singleton
export const regionValidator = new RegionValidator();
