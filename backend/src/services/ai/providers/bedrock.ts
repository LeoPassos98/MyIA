// backend/src/services/ai/providers/bedrock.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Re-export do BedrockProvider modularizado
 *
 * Este arquivo mantém backward compatibility com o código existente.
 * A implementação real está em ./bedrock/BedrockProvider.ts
 *
 * Estrutura modularizada:
 * - bedrock/BedrockProvider.ts - Provider principal (~200 linhas)
 * - bedrock/retry/ - Retry logic reutilizável
 * - bedrock/streaming/ - Processamento de streams
 * - bedrock/modelId/ - Normalização e variações de model ID
 * - bedrock/errors/ - Parse de erros AWS
 */

export { BedrockProvider } from './bedrock/BedrockProvider';

// Exportar função para testes (backward compatibility)
export { InferenceProfileResolver } from './bedrock/BedrockProvider';

// Helper para extrair prefixo regional (backward compatibility)
export function getRegionPrefix(region: string): string {
  if (region.startsWith('ap-')) {
    return 'apac';
  }
  return region.split('-')[0];
}
