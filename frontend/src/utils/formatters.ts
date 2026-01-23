// frontend/src/utils/formatters.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Formata uma data ISO para exibição amigável em português
 * @param isoDate - Data em formato ISO string
 * @returns String formatada (ex: "hoje", "há 3 dias", "21/01/2026")
 */
export function formatRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    
    // Validar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('[formatters] Data inválida:', isoDate);
      return 'data inválida';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'hoje';
    } else if (diffDays === 1) {
      return 'ontem';
    } else if (diffDays < 7) {
      return `há ${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('[formatters] Erro ao formatar data:', isoDate, error);
    return 'data desconhecida';
  }
}

/**
 * Formata número com separador de milhares
 * @param num - Número a ser formatado
 * @returns String formatada (ex: "1.000", "10.500")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

/**
 * Formata tokens para exibição (ex: 1000 → "1K", 8000 → "8K")
 * @param tokens - Número de tokens
 * @returns String formatada
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}K`;
  }
  return tokens.toString();
}

/**
 * Formata percentual com 0 casas decimais
 * @param value - Valor atual
 * @param max - Valor máximo
 * @returns String formatada (ex: "75%")
 */
export function formatPercentage(value: number, max: number): string {
  return `${((value / max) * 100).toFixed(0)}%`;
}
