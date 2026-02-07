// backend/src/services/ai/providers/bedrock/modelId/ModelIdNormalizer.ts

/**
 * Sufixos conhecidos de context window que devem ser removidos
 */
export const KNOWN_SUFFIXES = [
  ':8k',
  ':20k',
  ':24k',
  ':128k',
  ':256k',
  ':300k',
  ':1000k',
  ':mm', // multimodal
] as const;

/**
 * Normaliza model IDs removendo sufixos de context window
 * 
 * AWS Bedrock não aceita sufixos no model ID. Esta classe remove
 * sufixos conhecidos para garantir compatibilidade.
 * 
 * @example
 * ```typescript
 * const normalizer = new ModelIdNormalizer();
 * 
 * normalizer.normalize('amazon.nova-premier-v1:0:8k');
 * // → 'amazon.nova-premier-v1:0'
 * 
 * normalizer.normalize('amazon.nova-lite-v1:0:300k');
 * // → 'amazon.nova-lite-v1:0'
 * 
 * normalizer.normalize('amazon.nova-premier-v1:0:mm');
 * // → 'amazon.nova-premier-v1:0'
 * ```
 */
export class ModelIdNormalizer {
  /**
   * Regex pattern para remover sufixos conhecidos
   * Construído dinamicamente a partir de KNOWN_SUFFIXES
   */
  private readonly suffixPattern: RegExp;

  constructor() {
    // Criar pattern: :(8k|20k|24k|128k|256k|300k|1000k|mm)$
    const suffixes = KNOWN_SUFFIXES.map(s => s.slice(1)).join('|'); // Remove ':' inicial
    this.suffixPattern = new RegExp(`:(?:${suffixes})$`, 'i');
  }

  /**
   * Normaliza um model ID removendo sufixos conhecidos
   * 
   * @param modelId ID do modelo (pode conter sufixo)
   * @returns ID do modelo normalizado (sem sufixo)
   */
  normalize(modelId: string): string {
    return modelId.replace(this.suffixPattern, '');
  }

  /**
   * Verifica se um model ID tem sufixo
   * 
   * @param modelId ID do modelo
   * @returns true se o model ID tem sufixo conhecido
   */
  hasSuffix(modelId: string): boolean {
    return this.suffixPattern.test(modelId);
  }

  /**
   * Extrai o sufixo de um model ID
   * 
   * @param modelId ID do modelo
   * @returns Sufixo extraído ou null se não houver
   */
  extractSuffix(modelId: string): string | null {
    const match = modelId.match(this.suffixPattern);
    return match ? match[0] : null;
  }

  /**
   * Retorna a lista de sufixos conhecidos
   */
  getKnownSuffixes(): readonly string[] {
    return [...KNOWN_SUFFIXES];
  }
}
