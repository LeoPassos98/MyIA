/**
 * README: Sistema de Rating de Modelos
 * 
 * Documentação completa sobre como usar e integrar o sistema de rating
 * de modelos no frontend.
 * 
 * @module components/ModelRating/README
 */

/**
 * ============================================
 * 📚 SISTEMA DE RATING DE MODELOS
 * ============================================
 * 
 * Este sistema fornece componentes e hooks para exibir ratings de modelos
 * de IA baseados em métricas de performance real.
 * 
 * ## 🎯 Objetivo
 * 
 * Ajudar usuários a escolher os melhores modelos baseado em:
 * - Taxa de sucesso
 * - Latência média
 * - Número de retries
 * - Qualidade das respostas
 * - Custo-benefício
 * 
 * ## 📦 Componentes Disponíveis
 * 
 * 1. **ModelRatingStars** - Exibe estrelas de rating (1-5)
 * 2. **ModelBadge** - Badge colorido (Gold/Silver/Bronze)
 * 3. **ModelMetricsTooltip** - Tooltip com métricas detalhadas
 * 4. **ModelListFilters** - Filtros de rating e badge
 * 5. **ModelRatingDashboard** - Dashboard completo de ratings
 * 
 * ## 🪝 Hooks Disponíveis
 * 
 * 1. **useModelRating** - Hook principal para buscar e filtrar ratings
 * 2. **useCertifiedModels** - Hook para buscar apenas modelos certificados
 * 
 * ## 📍 Onde os Ratings São Exibidos
 * 
 * ### 1. Chat - Control Panel - Model Tab
 * - Filtros de rating após seleção de vendor
 * - Rating stars nos cards de modelo (expandido)
 * - Tooltip com métricas ao passar mouse
 * - Badges (Gold/Silver/Bronze) nos modelos certificados
 * 
 * ### 2. Settings - Models Management Tab
 * - Coluna de rating na tabela de modelos
 * - Stars e badges ao lado do status de certificação
 * - Métricas visíveis para modelos certificados
 * 
 * ## 🚀 Como Usar
 * 
 * ### Exemplo 1: Exibir Rating Stars
 * 
 * ```tsx
 * import { ModelRatingStars } from '@/components/ModelRating';
 * 
 * function MyComponent() {
 *   return (
 *     <ModelRatingStars 
 *       rating={4.5} 
 *       size="md" 
 *       showValue 
 *     />
 *   );
 * }
 * ```
 * 
 * ### Exemplo 2: Exibir Badge
 * 
 * ```tsx
 * import { ModelBadge } from '@/components/ModelRating';
 * 
 * function MyComponent() {
 *   return (
 *     <ModelBadge 
 *       badge="gold" 
 *       size="sm" 
 *       showIcon 
 *     />
 *   );
 * }
 * ```
 * 
 * ### Exemplo 3: Tooltip com Métricas
 * 
 * ```tsx
 * import { ModelRatingStars, ModelMetricsTooltip } from '@/components/ModelRating';
 * 
 * function MyComponent({ model }) {
 *   return (
 *     <ModelMetricsTooltip 
 *       metrics={model.metrics} 
 *       scores={model.scores}
 *     >
 *       <ModelRatingStars rating={model.rating} />
 *     </ModelMetricsTooltip>
 *   );
 * }
 * ```
 * 
 * ### Exemplo 4: Hook useModelRating
 * 
 * ```tsx
 * import { useModelRating } from '@/hooks/useModelRating';
 * 
 * function MyComponent() {
 *   const { 
 *     filteredModels, 
 *     filters, 
 *     setFilters, 
 *     loading,
 *     getModelById 
 *   } = useModelRating();
 *   
 *   // Buscar rating de um modelo específico
 *   const model = getModelById('anthropic.claude-sonnet-4-5');
 *   
 *   // Filtrar modelos por rating mínimo
 *   setFilters({ minRating: 4.0 });
 *   
 *   return (
 *     <div>
 *       {filteredModels.map(model => (
 *         <div key={model.id}>
 *           {model.name} - {model.rating}⭐
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * ### Exemplo 5: Filtros de Rating
 * 
 * ```tsx
 * import { ModelListFilters } from '@/components/ModelRating';
 * import { useModelRating } from '@/hooks/useModelRating';
 * 
 * function MyComponent() {
 *   const { filters, setFilters } = useModelRating();
 *   
 *   return (
 *     <ModelListFilters 
 *       onFilterChange={setFilters}
 *       currentFilters={filters}
 *     />
 *   );
 * }
 * ```
 * 
 * ## 🎨 Customização
 * 
 * ### Tamanhos Disponíveis
 * 
 * - `xs` - Extra small (12px)
 * - `sm` - Small (16px)
 * - `md` - Medium (20px) - Default
 * - `lg` - Large (24px)
 * 
 * ### Cores dos Badges
 * 
 * - **Gold** (#FFD700) - Rating >= 4.5
 * - **Silver** (#C0C0C0) - Rating >= 4.0
 * - **Bronze** (#CD7F32) - Rating >= 3.5
 * 
 * ### Estilos CSS
 * 
 * Importe o CSS de integração:
 * 
 * ```tsx
 * import '@/styles/model-rating-integration.css';
 * ```
 * 
 * ## 📊 Métricas Exibidas
 * 
 * ### No Tooltip
 * 
 * 1. **Taxa de Sucesso** - % de requisições bem-sucedidas
 * 2. **Latência Média** - Tempo médio de resposta em ms
 * 3. **Retries Médios** - Número médio de tentativas
 * 4. **Score de Qualidade** - Avaliação da qualidade (1-5)
 * 5. **Score de Performance** - Avaliação da performance (1-5)
 * 6. **Score de Custo-Benefício** - Avaliação do custo (1-5)
 * 7. **Última Atualização** - Quando foi atualizado
 * 
 * ## 🔍 Filtros Disponíveis
 * 
 * ### Por Rating
 * 
 * - Rating mínimo (slider de 0 a 5)
 * - Apenas modelos com rating
 * 
 * ### Por Badge
 * 
 * - Gold (4.5+)
 * - Silver (4.0+)
 * - Bronze (3.5+)
 * - Todos
 * 
 * ### Por Status
 * 
 * - Apenas certificados
 * - Apenas não certificados
 * - Todos
 * 
 * ## 🐛 Troubleshooting
 * 
 * ### Problema: Ratings não aparecem
 * 
 * **Possíveis causas:**
 * 1. Modelo não está certificado no backend
 * 2. API `/api/models/ratings` não está respondendo
 * 3. Hook `useModelRating` não está retornando dados
 * 
 * **Solução:**
 * 1. Verificar console do navegador para erros
 * 2. Verificar se o modelo está certificado em Settings > Models Management
 * 3. Verificar se a API está respondendo (Network tab)
 * 4. Recarregar a página
 * 
 * ### Problema: Tooltip não funciona
 * 
 * **Possíveis causas:**
 * 1. `ModelMetricsTooltip` não está envolvendo as stars
 * 2. `metrics` ou `scores` não estão sendo passados
 * 3. Conflito de z-index
 * 
 * **Solução:**
 * 1. Verificar estrutura do componente
 * 2. Verificar se `metrics` e `scores` existem no modelo
 * 3. Ajustar z-index no CSS
 * 
 * ### Problema: Filtros não funcionam
 * 
 * **Possíveis causas:**
 * 1. `setFilters` não está sendo chamado corretamente
 * 2. `filteredModels` não está sendo atualizado
 * 3. Valores dos filtros são inválidos
 * 
 * **Solução:**
 * 1. Verificar console para erros
 * 2. Verificar se `setFilters` está sendo chamado
 * 3. Verificar valores dos filtros (devem ser números válidos)
 * 
 * ## 📱 Responsividade
 * 
 * O sistema é totalmente responsivo:
 * 
 * - **Desktop (> 768px):** Layout horizontal, tooltips completos
 * - **Mobile (< 768px):** Layout vertical, tooltips adaptados
 * - **Touch:** Touch-friendly, sem hover effects
 * 
 * ## ♿ Acessibilidade
 * 
 * Todos os componentes seguem padrões de acessibilidade:
 * 
 * - Aria-labels em todos os elementos interativos
 * - Navegação por teclado (Tab, Enter, Esc)
 * - Alto contraste para estrelas e badges
 * - Screen reader friendly
 * 
 * ## 🚀 Performance
 * 
 * Otimizações implementadas:
 * 
 * - **Memoização:** Componentes memoizados com `React.memo`
 * - **Cache:** React Query cache de 5 minutos
 * - **Lazy Loading:** Tooltips carregados sob demanda
 * - **Debounce:** Filtros com debounce de 300ms
 * 
 * ## 📚 Documentação Adicional
 * 
 * - [Guia de Integração](./IntegrationGuide.tsx) - Como integrar nas páginas
 * - [Exemplos Visuais](./VisualExamples.tsx) - Mockups e fluxos
 * - [Documentação Técnica](./documentation.ts) - Detalhes técnicos
 * - [Exemplos de Código](./examples.tsx) - 7 exemplos práticos
 * 
 * ## 🔗 Links Úteis
 * 
 * - Backend: Sistema de Rating (`backend/docs/MODEL-RATING-SYSTEM.md`)
 * - Tipos: `frontend/src/types/model-rating.ts`
 * - Helpers: `frontend/src/utils/rating-helpers.ts`
 * - Hook: `frontend/src/hooks/useModelRating.ts`
 * 
 * ## 🎯 Próximos Passos
 * 
 * Para integrar o sistema de rating:
 * 
 * 1. Leia o [Guia de Integração](./IntegrationGuide.tsx)
 * 2. Veja os [Exemplos Visuais](./VisualExamples.tsx)
 * 3. Implemente fase por fase (ModelCard → ModelTab → ModelsManagementTab)
 * 4. Teste em diferentes navegadores e dispositivos
 * 5. Ajuste estilos conforme necessário
 * 
 * ## 💡 Dicas
 * 
 * 1. **Comece simples:** Integre primeiro no ModelCard
 * 2. **Teste incrementalmente:** Teste cada componente isoladamente
 * 3. **Use memoização:** Para listas grandes de modelos
 * 4. **Customize cores:** Ajuste badges conforme sua paleta
 * 5. **Monitore performance:** Use React DevTools Profiler
 * 
 * ## 📝 Changelog
 * 
 * ### v1.0.0 (2026-01-27)
 * - ✅ Componentes de rating criados
 * - ✅ Hook useModelRating implementado
 * - ✅ Documentação completa
 * - ✅ Exemplos visuais e de código
 * - ✅ Guia de integração
 * - ✅ Estilos CSS
 * 
 * ## 🤝 Contribuindo
 * 
 * Para adicionar novos recursos:
 * 
 * 1. Crie componente em `frontend/src/components/ModelRating/`
 * 2. Adicione tipos em `frontend/src/types/model-rating.ts`
 * 3. Documente em `documentation.ts`
 * 4. Adicione exemplo em `examples.tsx`
 * 5. Atualize este README
 * 
 * ## 📄 Licença
 * 
 * Este sistema faz parte do projeto MyIA.
 * 
 * ---
 * 
 * **Última atualização:** 2026-01-27
 * **Versão:** 1.0.0
 * **Autor:** Frontend Team
 */

// Este arquivo é apenas para documentação
export {};
