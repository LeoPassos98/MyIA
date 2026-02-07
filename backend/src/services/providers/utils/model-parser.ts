// backend/src/services/providers/utils/model-parser.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Utility para parsing de informações de modelos
 * Funções puras extraídas do providersController
 */

export class ModelParser {
  /**
   * Extrai vendor do apiModelId
   * Ex: "anthropic.claude-sonnet-4" → "anthropic"
   * 
   * @param apiModelId - ID do modelo no formato vendor.model-name
   * @returns Vendor extraído ou 'unknown'
   */
  extractVendor(apiModelId: string): string {
    // Padrão: vendor.model-name
    const parts = apiModelId.split('.');
    return parts[0] || 'unknown';
  }

  /**
   * Extrai versão do apiModelId
   * Ex: "anthropic.claude-sonnet-4-20250514-v1:0" → "4.0"
   * Ex: "anthropic.claude-3.5-sonnet" → "3.5"
   * 
   * @param apiModelId - ID do modelo
   * @returns Versão extraída ou undefined
   */
  extractVersion(apiModelId: string): string | undefined {
    // Tentar extrair versão do formato v1:0
    const versionMatch = apiModelId.match(/v(\d+):(\d+)/);
    if (versionMatch) {
      return `${versionMatch[1]}.${versionMatch[2]}`;
    }
    
    // Tentar extrair do nome do modelo (ex: claude-3.5-sonnet)
    const modelMatch = apiModelId.match(/-([\d.]+)-/);
    if (modelMatch) {
      return modelMatch[1];
    }
    
    return undefined;
  }

  /**
   * Normaliza modelId para formato padrão
   * Remove sufixos de versão e normaliza formato
   * 
   * @param modelId - ID do modelo
   * @returns ModelId normalizado
   */
  normalizeModelId(modelId: string): string {
    // Remove sufixos de versão (v1:0, v2:0, etc)
    return modelId.replace(/(-v\d+:\d+)$/, '');
  }
}
