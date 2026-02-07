// frontend/src/features/chat/components/ControlPanel/ModelCard/utils/modelNameFormatter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Model Name Formatting Utilities
 * 
 * Utilitários puros para formatação de nomes de modelos.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/utils
 */

/**
 * Extrai nome resumido do modelo para exibição colapsada
 * 
 * Remove prefixos de vendor e sufixos de versão detalhada,
 * convertendo para formato legível e compacto.
 * 
 * @param fullName - Nome completo do modelo (ex: "anthropic.claude-sonnet-4-5-20250929-v1:0")
 * @returns Nome resumido (ex: "CLAUDE SONNET 4.5")
 * 
 * @example
 * ```typescript
 * formatModelShortName("anthropic.claude-sonnet-4-5-20250929-v1:0")
 * // → "CLAUDE SONNET 4.5"
 * 
 * formatModelShortName("amazon.titan-text-express-v1")
 * // → "TITAN TEXT EXPRESS"
 * ```
 */
export function formatModelShortName(fullName: string): string {
  // Remove prefixo do vendor (ex: "anthropic.", "amazon.")
  const withoutVendor = fullName.includes('.')
    ? fullName.split('.')[1]
    : fullName;
  
  // Remove sufixos de versão detalhada (ex: "-20250929-v1:0")
  const withoutDetailedVersion = withoutVendor
    .replace(/-\d{8}-v\d+:\d+$/, '') // Remove "-20250929-v1:0"
    .replace(/-v\d+:\d+$/, '')        // Remove "-v1:0"
    .replace(/-v\d+$/, '');           // Remove "-v1"
  
  // Converte para uppercase e substitui hífens por espaços
  const formatted = withoutDetailedVersion
    .replace(/-/g, ' ')
    .toUpperCase();
  
  // Limita a 4 palavras principais para manter compacto
  const words = formatted.split(' ');
  return words.slice(0, 4).join(' ');
}
