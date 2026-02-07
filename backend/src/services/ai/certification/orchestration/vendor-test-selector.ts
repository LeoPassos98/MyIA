// backend/src/services/ai/certification/orchestration/vendor-test-selector.ts
// Standards: docs/STANDARDS.md

import { TestSpec } from '../types';
import { baseTestSpecs } from '../test-specs/base.spec';
import { anthropicTestSpecs } from '../test-specs/anthropic.spec';
import { cohereTestSpecs } from '../test-specs/cohere.spec';
import { amazonTestSpecs } from '../test-specs/amazon.spec';
import { logger } from '../../../../utils/logger';

/**
 * Seleciona testes apropriados baseado no vendor do modelo
 * 
 * Responsabilidades:
 * - Mapear vendor para suite de testes
 * - Combinar testes base + testes específicos do vendor
 * - Fornecer fallback para vendors desconhecidos
 * 
 * @example
 * const selector = new VendorTestSelector();
 * const tests = selector.getTestsForVendor('anthropic');
 * // Retorna: [...baseTestSpecs, ...anthropicTestSpecs]
 */
export class VendorTestSelector {
  /**
   * Retorna testes base + testes específicos do vendor
   *
   * @param vendor - Nome do vendor (anthropic, cohere, amazon)
   * @returns Array de especificações de teste
   */
  getTestsForVendor(vendor: string): TestSpec[] {
    const vendorLower = vendor.toLowerCase();
    
    logger.info('[VendorTestSelector] Selecionando testes', {
      vendor: vendorLower
    });
    
    let vendorTests: TestSpec[];
    
    switch (vendorLower) {
      case 'anthropic':
        vendorTests = [...baseTestSpecs, ...anthropicTestSpecs];
        break;
      
      case 'cohere':
        vendorTests = [...baseTestSpecs, ...cohereTestSpecs];
        break;
      
      case 'amazon':
        vendorTests = [...baseTestSpecs, ...amazonTestSpecs];
        break;
      
      default:
        logger.warn('[VendorTestSelector] Vendor desconhecido, usando apenas testes base', {
          vendor: vendorLower
        });
        vendorTests = baseTestSpecs;
    }
    
    logger.info('[VendorTestSelector] Testes selecionados', {
      vendor: vendorLower,
      count: vendorTests.length
    });
    
    return vendorTests;
  }
}
