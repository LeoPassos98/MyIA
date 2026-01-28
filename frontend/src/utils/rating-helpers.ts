// frontend/src/utils/rating-helpers.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { ModelBadge, ModelWithRating, ModelFilters } from '../types/model-rating';

/**
 * Retorna a cor associada a cada badge
 */
export function getBadgeColor(badge: ModelBadge): string {
  const colors: Record<ModelBadge, string> = {
    PREMIUM: '#FFD700',           // Dourado
    RECOMENDADO: '#10B981',       // Verde
    FUNCIONAL: '#F59E0B',         // Amarelo
    LIMITADO: '#F97316',          // Laranja
    NAO_RECOMENDADO: '#EF4444',   // Vermelho
    INDISPONIVEL: '#6B7280'       // Cinza
  };
  return colors[badge] || colors.INDISPONIVEL;
}

/**
 * Retorna o emoji associado a cada badge
 */
export function getBadgeEmoji(badge: ModelBadge): string {
  const emojis: Record<ModelBadge, string> = {
    PREMIUM: '🏆',
    RECOMENDADO: '✅',
    FUNCIONAL: '⚠️',
    LIMITADO: '🔶',
    NAO_RECOMENDADO: '⚠️',
    INDISPONIVEL: '❌'
  };
  return emojis[badge] || '❓';
}

/**
 * Retorna a descrição de cada badge
 */
export function getBadgeDescription(badge: ModelBadge): string {
  const descriptions: Record<ModelBadge, string> = {
    PREMIUM: 'Modelo premium com desempenho perfeito (5.0 estrelas)',
    RECOMENDADO: 'Modelo recomendado com ótimo desempenho (4.0-4.9 estrelas)',
    FUNCIONAL: 'Modelo funcional com bom desempenho (3.0-3.9 estrelas)',
    LIMITADO: 'Modelo com limitações e desempenho regular (2.0-2.9 estrelas)',
    NAO_RECOMENDADO: 'Modelo não recomendado com desempenho ruim (1.0-1.9 estrelas)',
    INDISPONIVEL: 'Modelo indisponível ou com problemas críticos (0.0-0.9 estrelas)'
  };
  return descriptions[badge] || 'Badge desconhecido';
}

/**
 * Formata latência em ms para string legível
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Formata taxa de sucesso para porcentagem
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Formata número de retries
 */
export function formatRetries(retries: number): string {
  return retries.toFixed(2);
}

/**
 * Calcula a porcentagem de preenchimento de uma estrela específica
 * @param rating Rating total (0-5)
 * @param starIndex Índice da estrela (0-4)
 * @returns Porcentagem de preenchimento (0-100)
 */
export function getStarFillPercentage(rating: number, starIndex: number): number {
  const fullStars = Math.floor(rating);
  if (starIndex < fullStars) return 100;
  if (starIndex === fullStars) return (rating - fullStars) * 100;
  return 0;
}

/**
 * Formata data relativa (ex: "há 2 horas")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('pt-BR');
}

/**
 * Filtra modelos baseado nos filtros fornecidos
 */
export function filterModels(models: ModelWithRating[], filters: ModelFilters): ModelWithRating[] {
  let filtered = [...models];

  // Filtro por rating mínimo
  if (filters.minRating !== undefined) {
    filtered = filtered.filter(model => 
      model.rating !== undefined && model.rating >= filters.minRating!
    );
  }

  // Filtro por badges
  if (filters.badges && filters.badges.length > 0) {
    filtered = filtered.filter(model => 
      model.badge && filters.badges!.includes(model.badge)
    );
  }

  // Filtro por termo de busca
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(model =>
      model.name.toLowerCase().includes(term) ||
      model.provider.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Ordena modelos baseado no critério fornecido
 */
export function sortModels(
  models: ModelWithRating[], 
  sortBy: 'rating' | 'name' | 'latency', 
  order: 'asc' | 'desc' = 'desc'
): ModelWithRating[] {
  const sorted = [...models];
  const multiplier = order === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return ((a.rating || 0) - (b.rating || 0)) * multiplier;
      
      case 'name':
        return a.name.localeCompare(b.name) * multiplier;
      
      case 'latency': {
        const latencyA = a.metrics?.averageLatency || Infinity;
        const latencyB = b.metrics?.averageLatency || Infinity;
        return (latencyA - latencyB) * multiplier;
      }
      
      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Calcula estatísticas de rating de uma lista de modelos
 */
export function calculateRatingStatistics(models: ModelWithRating[]) {
  const certifiedModels = models.filter(m => m.rating !== undefined);
  
  const totalCertified = certifiedModels.length;
  const averageRating = totalCertified > 0
    ? certifiedModels.reduce((sum, m) => sum + (m.rating || 0), 0) / totalCertified
    : 0;
  
  const premiumCount = certifiedModels.filter(m => m.badge === 'PREMIUM').length;
  
  const distributionByBadge = certifiedModels.reduce((acc, model) => {
    if (model.badge) {
      acc[model.badge] = (acc[model.badge] || 0) + 1;
    }
    return acc;
  }, {} as Record<ModelBadge, number>);
  
  const topModels = sortModels(certifiedModels, 'rating', 'desc').slice(0, 5);

  return {
    totalCertified,
    averageRating,
    premiumCount,
    distributionByBadge,
    topModels
  };
}

/**
 * Retorna a classe CSS para o badge
 */
export function getBadgeClassName(badge: ModelBadge): string {
  return `badge-${badge.toLowerCase().replace('_', '-')}`;
}

/**
 * Valida se um rating está no intervalo válido
 */
export function isValidRating(rating: number): boolean {
  return rating >= 0 && rating <= 5;
}

/**
 * Arredonda rating para 1 casa decimal
 */
export function roundRating(rating: number): number {
  return Math.round(rating * 10) / 10;
}
