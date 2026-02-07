// backend/src/services/providers/utils/vendor-mapper.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Utility para mapeamento de vendors
 * Funções puras para conversão de slugs em nomes amigáveis
 */

export class VendorMapper {
  private static readonly VENDOR_NAMES: Record<string, string> = {
    'anthropic': 'Anthropic',
    'amazon': 'Amazon',
    'cohere': 'Cohere',
    'meta': 'Meta',
    'mistral': 'Mistral AI',
    'ai21': 'AI21 Labs',
    'stability': 'Stability AI'
  };

  /**
   * Retorna nome amigável do vendor
   * 
   * @param vendor - Slug do vendor (ex: 'anthropic')
   * @returns Nome amigável (ex: 'Anthropic')
   */
  getVendorName(vendor: string): string {
    return VendorMapper.VENDOR_NAMES[vendor] 
      || vendor.charAt(0).toUpperCase() + vendor.slice(1);
  }

  /**
   * Retorna path do logo do vendor
   * 
   * @param vendor - Slug do vendor
   * @returns Path relativo do logo
   */
  getVendorLogo(vendor: string): string {
    return `/assets/vendors/${vendor}.svg`;
  }

  /**
   * Retorna slug do vendor (normalizado)
   * 
   * @param vendor - Nome ou slug do vendor
   * @returns Slug normalizado
   */
  getVendorSlug(vendor: string): string {
    return vendor.toLowerCase().replace(/\s+/g, '-');
  }
}
