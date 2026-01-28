// frontend/src/components/ModelRating/documentation.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Documentação Técnica - Componentes de Rating de Modelos
 * 
 * Este arquivo contém a documentação técnica completa do sistema de rating,
 * incluindo tipos, interfaces, e guias de uso.
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

/**
 * Badge visual que representa a qualidade do modelo
 * 
 * @example
 * const badge: ModelBadge = 'PREMIUM';
 */
export type ModelBadge = 
  | 'PREMIUM'           // 5.0 - Perfeito (🏆)
  | 'RECOMENDADO'       // 4.0-4.9 - Ótimo (✅)
  | 'FUNCIONAL'         // 3.0-3.9 - Bom (⚠️)
  | 'LIMITADO'          // 2.0-2.9 - Regular (🔶)
  | 'NAO_RECOMENDADO'   // 1.0-1.9 - Ruim (⚠️)
  | 'INDISPONIVEL';     // 0.0-0.9 - Crítico (❌)

/**
 * Métricas coletadas durante os testes de certificação
 * 
 * @example
 * const metrics: ModelMetrics = {
 *   successRate: 100,
 *   averageRetries: 0,
 *   averageLatency: 1285,
 *   errorCount: 0,
 *   totalTests: 7,
 *   testsPassed: 7
 * };
 */
export interface ModelMetrics {
  successRate: number;        // 0-100 (%)
  averageRetries: number;     // 0-6
  averageLatency: number;     // ms
  errorCount: number;         // 0-totalTests
  totalTests: number;         // 7 (padrão)
  testsPassed: number;        // 0-7
}

/**
 * Scores individuais que compõem o rating final
 * 
 * @example
 * const scores: ModelScores = {
 *   success: 4.0,      // 40% do rating
 *   resilience: 1.0,   // 20% do rating
 *   performance: 1.0,  // 20% do rating
 *   stability: 1.0     // 20% do rating
 * };
 */
export interface ModelScores {
  success: number;      // 0-4.0 (40% do rating)
  resilience: number;   // 0-1.0 (20% do rating)
  performance: number;  // 0-1.0 (20% do rating)
  stability: number;    // 0-1.0 (20% do rating)
}

/**
 * Modelo com informações de rating
 * 
 * @example
 * const model: ModelWithRating = {
 *   id: 'model-123',
 *   name: 'Amazon Nova Micro',
 *   provider: 'Amazon',
 *   isAvailable: true,
 *   rating: 5.0,
 *   badge: 'PREMIUM',
 *   metrics: { ... },
 *   scores: { ... },
 *   ratingUpdatedAt: '2026-01-27T17:00:00.000Z'
 * };
 */
export interface ModelWithRating {
  id: string;
  name: string;
  provider: string;
  isAvailable: boolean;
  rating?: number;
  badge?: ModelBadge;
  metrics?: ModelMetrics;
  scores?: ModelScores;
  ratingUpdatedAt?: string;
  capabilities?: string[];
  contextWindow?: number;
  apiModelId?: string;
}

// ============================================
// GUIA DE USO
// ============================================

/**
 * GUIA RÁPIDO: Como usar os componentes
 * 
 * 1. IMPORTAR COMPONENTES
 * ```tsx
 * import { 
 *   ModelRatingStars, 
 *   ModelBadge, 
 *   ModelMetricsTooltip,
 *   ModelListFilters,
 *   ModelRatingDashboard
 * } from '@/components/ModelRating';
 * ```
 * 
 * 2. IMPORTAR HOOK
 * ```tsx
 * import { useModelRating } from '@/hooks/useModelRating';
 * ```
 * 
 * 3. USAR NO COMPONENTE
 * ```tsx
 * function MyComponent() {
 *   const { filteredModels, filters, setFilters } = useModelRating();
 *   
 *   return (
 *     <div>
 *       <ModelListFilters 
 *         onFilterChange={setFilters}
 *         currentFilters={filters}
 *       />
 *       {filteredModels.map(model => (
 *         <div key={model.id}>
 *           <h3>{model.name}</h3>
 *           <ModelRatingStars rating={model.rating} showValue />
 *           <ModelBadge badge={model.badge} />
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================
// CÁLCULO DE RATING
// ============================================

/**
 * FÓRMULA DE CÁLCULO DO RATING
 * 
 * Rating = Success + Resilience + Performance + Stability
 * 
 * Onde:
 * - Success (40%): (successRate / 100) * 4.0
 * - Resilience (20%): (1 - (averageRetries / 6)) * 1.0
 * - Performance (20%): (1 - (latency / 10000)) * 1.0
 * - Stability (20%): (1 - (errorCount / totalTests)) * 1.0
 * 
 * @example
 * // Modelo perfeito (5.0)
 * Success: 100% → 4.0
 * Resilience: 0 retries → 1.0
 * Performance: 0ms → 1.0
 * Stability: 0 errors → 1.0
 * Total: 5.0 ⭐⭐⭐⭐⭐
 * 
 * // Modelo bom (4.2)
 * Success: 85.7% → 3.43
 * Resilience: 0.5 retries → 0.92
 * Performance: 2000ms → 0.80
 * Stability: 1 error → 0.86
 * Total: 4.2 ⭐⭐⭐⭐
 */

// ============================================
// BADGES E CORES
// ============================================

/**
 * MAPEAMENTO DE BADGES
 * 
 * Rating → Badge → Cor → Emoji
 * 
 * 5.0         → PREMIUM           → #FFD700 (Dourado)  → 🏆
 * 4.0-4.9     → RECOMENDADO       → #10B981 (Verde)    → ✅
 * 3.0-3.9     → FUNCIONAL         → #F59E0B (Amarelo)  → ⚠️
 * 2.0-2.9     → LIMITADO          → #F97316 (Laranja)  → 🔶
 * 1.0-1.9     → NAO_RECOMENDADO   → #EF4444 (Vermelho) → ⚠️
 * 0.0-0.9     → INDISPONIVEL      → #6B7280 (Cinza)    → ❌
 */

// ============================================
// ACESSIBILIDADE
// ============================================

/**
 * DIRETRIZES DE ACESSIBILIDADE (WCAG 2.1 AA)
 *
 * ✅ IMPLEMENTADO:
 * - ARIA labels em todos os elementos interativos
 * - role="img" para estrelas com aria-label descritivo
 * - role="status" para badges
 * - role="progressbar" para barras de progresso
 * - Navegação por teclado (Tab, Enter, Space)
 * - Contraste de cores adequado (mínimo 4.5:1)
 * - Estados de foco visíveis
 * - Suporte a leitores de tela
 * - aria-live="polite" para atualizações dinâmicas
 *
 * Exemplos de ARIA:
 * - Estrelas: role="img" aria-label="Rating: 4.3 de 5 estrelas"
 * - Badge: role="status" aria-label="Modelo premium com desempenho perfeito"
 * - Barra: role="progressbar" aria-valuenow={4.0} aria-valuemin={0} aria-valuemax={4.0}
 */

// ============================================
// RESPONSIVIDADE
// ============================================

/**
 * BREAKPOINTS E COMPORTAMENTO
 * 
 * Desktop (> 768px):
 * - Dashboard: Grid 3 colunas
 * - Filtros: Layout horizontal
 * - Cards: Grid responsivo
 * 
 * Tablet (768px):
 * - Dashboard: Grid 2 colunas
 * - Filtros: Layout horizontal compacto
 * - Cards: Grid 2 colunas
 * 
 * Mobile (< 768px):
 * - Dashboard: Grid 1 coluna
 * - Filtros: Layout vertical
 * - Cards: Lista vertical
 * - Tooltip: Largura reduzida (240px)
 * 
 * @example
 * // CSS Media Query
 * @media (max-width: 768px) {
 *   .model-rating-dashboard__stats {
 *     grid-template-columns: 1fr;
 *   }
 * }
 */

// ============================================
// PERFORMANCE
// ============================================

/**
 * OTIMIZAÇÕES DE PERFORMANCE
 * 
 * ✅ IMPLEMENTADO:
 * - React.memo em todos os componentes
 * - useMemo para cálculos pesados
 * - useCallback para funções
 * - Lazy loading de tooltips (render on demand)
 * - CSS animations com GPU (transform + opacity)
 * - Debounce em filtros (300ms)
 * - Virtual scrolling para listas grandes (futuro)
 * 
 * MÉTRICAS ESPERADAS:
 * - First Contentful Paint: < 1s
 * - Time to Interactive: < 2s
 * - Lighthouse Score: > 90
 */

// ============================================
// TESTES
// ============================================

/**
 * ESTRATÉGIA DE TESTES
 * 
 * UNITÁRIOS (Jest + React Testing Library):
 * - Renderização de componentes
 * - Props e estados
 * - Eventos de usuário
 * - Cálculos e formatações
 * 
 * INTEGRAÇÃO:
 * - Fluxo completo de filtros
 * - Integração com API
 * - Navegação entre componentes
 * 
 * E2E (Playwright - futuro):
 * - Fluxo de usuário completo
 * - Testes de acessibilidade
 * - Testes de responsividade
 * 
 * @example
 * // Teste unitário
 * describe('ModelRatingStars', () => {
 *   it('deve renderizar 5 estrelas cheias para rating 5.0', () => {
 *     render(<ModelRatingStars rating={5.0} />);
 *     expect(screen.getByLabelText('Rating: 5.0 de 5 estrelas')).toBeInTheDocument();
 *   });
 * });
 */

// ============================================
// API REFERENCE
// ============================================

/**
 * ENDPOINTS DA API
 * 
 * GET /api/providers/models
 * Retorna lista de modelos com rating
 * 
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "model-123",
 *       "name": "Amazon Nova Micro",
 *       "provider": "Amazon",
 *       "isAvailable": true,
 *       "rating": 5.0,
 *       "badge": "PREMIUM",
 *       "metrics": { ... },
 *       "scores": { ... },
 *       "ratingUpdatedAt": "2026-01-27T17:00:00.000Z"
 *     }
 *   ]
 * }
 */

// ============================================
// TROUBLESHOOTING
// ============================================

/**
 * PROBLEMAS COMUNS E SOLUÇÕES
 * 
 * 1. Estrelas não aparecem:
 *    - Verificar se rating está definido
 *    - Verificar se CSS foi importado
 *    - Verificar console para erros
 * 
 * 2. Tooltip não funciona:
 *    - Verificar se metrics e scores estão definidos
 *    - Verificar se OptimizedTooltip está importado
 *    - Verificar z-index do container
 * 
 * 3. Filtros não funcionam:
 *    - Verificar se onFilterChange está definido
 *    - Verificar se currentFilters está atualizado
 *    - Verificar console para erros
 * 
 * 4. Performance lenta:
 *    - Verificar se React.memo está sendo usado
 *    - Verificar se há re-renders desnecessários
 *    - Usar React DevTools Profiler
 */

// ============================================
// CHANGELOG
// ============================================

/**
 * HISTÓRICO DE VERSÕES
 * 
 * v1.0.0 (2026-01-27)
 * - Implementação inicial
 * - ModelRatingStars
 * - ModelBadge
 * - ModelMetricsTooltip
 * - ModelListFilters
 * - ModelRatingDashboard
 * - Hook useModelRating
 * - Documentação completa
 * - Exemplos de uso
 * - Testes unitários
 * - Acessibilidade WCAG 2.1 AA
 * - Responsividade mobile-first
 */

export const DOCUMENTATION_VERSION = '1.0.0';
export const LAST_UPDATED = '2026-01-27';
