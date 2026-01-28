/**
 * Guia de Integração: Sistema de Rating de Modelos
 * 
 * Este arquivo documenta como integrar os componentes de rating
 * nas páginas existentes do frontend.
 * 
 * @module components/ModelRating/IntegrationGuide
 */

/**
 * ============================================
 * 📍 PÁGINAS IDENTIFICADAS
 * ============================================
 * 
 * 1. ModelCard (Chat - Control Panel)
 *    - Localização: frontend/src/features/chat/components/ControlPanel/ModelCard.tsx
 *    - Uso: Exibe cards de modelos com radio button, badges de providers
 *    - Estado: Já possui badges de certificação via ProviderBadge
 *    - Integração: Adicionar rating stars e tooltip com métricas
 * 
 * 2. ModelTab (Chat - Control Panel)
 *    - Localização: frontend/src/features/chat/components/ControlPanel/ModelTab.tsx
 *    - Uso: Aba de seleção de modelo (Vendor-First)
 *    - Estado: Usa ModelCardList para exibir modelos
 *    - Integração: Adicionar filtros de rating e exibir ratings nos cards
 * 
 * 3. ModelsManagementTab (Settings)
 *    - Localização: frontend/src/features/settings/components/ModelsManagementTab.tsx
 *    - Uso: Gerenciamento e certificação de modelos AWS Bedrock
 *    - Estado: Tabela com status de certificação
 *    - Integração: Adicionar coluna de rating e métricas
 */

/**
 * ============================================
 * 🎯 EXEMPLO 1: ModelCard - Adicionar Rating Stars
 * ============================================
 * 
 * Arquivo: frontend/src/features/chat/components/ControlPanel/ModelCard.tsx
 * 
 * ANTES:
 * ```tsx
 * export const ModelCard = React.memo(function ModelCard({
 *   model,
 *   isSelected,
 *   onSelect,
 *   ...
 * }: ModelCardProps) {
 *   return (
 *     <Card>
 *       <Box>
 *         <Typography>{model.name}</Typography>
 *         <ProviderBadgeGroup providers={model.availableOn} />
 *       </Box>
 *     </Card>
 *   );
 * });
 * ```
 * 
 * DEPOIS:
 * ```tsx
 * import { ModelRatingStars, ModelMetricsTooltip } from '@/components/ModelRating';
 * import { useModelRating } from '@/hooks/useModelRating';
 * 
 * export const ModelCard = React.memo(function ModelCard({
 *   model,
 *   isSelected,
 *   onSelect,
 *   ...
 * }: ModelCardProps) {
 *   // ✅ NOVO: Hook para buscar rating do modelo
 *   const { getModelById } = useModelRating();
 *   const modelWithRating = getModelById(model.apiModelId);
 *   
 *   return (
 *     <Card>
 *       <Box>
 *         <Typography>{model.name}</Typography>
 *         
 *         // ✅ NOVO: Rating com Tooltip
 *         {modelWithRating?.rating && (
 *           <Box sx={{ mb: 1 }}>
 *             <ModelMetricsTooltip 
 *               metrics={modelWithRating.metrics} 
 *               scores={modelWithRating.scores}
 *             >
 *               <ModelRatingStars 
 *                 rating={modelWithRating.rating} 
 *                 size="sm" 
 *                 showValue 
 *               />
 *             </ModelMetricsTooltip>
 *           </Box>
 *         )}
 *         
 *         <ProviderBadgeGroup providers={model.availableOn} />
 *       </Box>
 *     </Card>
 *   );
 * });
 * ```
 * 
 * RESULTADO:
 * - ⭐ Rating stars aparecem abaixo do nome do modelo
 * - 💡 Tooltip mostra métricas detalhadas ao passar o mouse
 * - 🎨 Design integrado com o card existente
 */

/**
 * ============================================
 * 🎯 EXEMPLO 2: ModelTab - Adicionar Filtros de Rating
 * ============================================
 * 
 * Arquivo: frontend/src/features/chat/components/ControlPanel/ModelTab.tsx
 * 
 * ANTES:
 * ```tsx
 * export function ModelTab() {
 *   const { chatConfig, updateChatConfig } = useLayout();
 *   const { filteredModels, ... } = useModelTabLogic();
 *   
 *   return (
 *     <Box>
 *       <VendorSelector ... />
 *       <ModelCardList models={filteredModels} ... />
 *     </Box>
 *   );
 * }
 * ```
 * 
 * DEPOIS:
 * ```tsx
 * import { ModelListFilters } from '@/components/ModelRating';
 * import { useModelRating } from '@/hooks/useModelRating';
 * 
 * export function ModelTab() {
 *   const { chatConfig, updateChatConfig } = useLayout();
 *   
 *   // ✅ NOVO: Hook de rating com filtros
 *   const {
 *     filteredModels: ratedModels,
 *     filters,
 *     setFilters,
 *     loading: ratingLoading
 *   } = useModelRating();
 *   
 *   const { filteredModels, ... } = useModelTabLogic();
 *   
 *   // ✅ NOVO: Combinar modelos filtrados com ratings
 *   const modelsWithRatings = useMemo(() => {
 *     return filteredModels.map(model => {
 *       const ratedModel = ratedModels.find(r => r.apiModelId === model.apiModelId);
 *       return {
 *         ...model,
 *         rating: ratedModel?.rating,
 *         badge: ratedModel?.badge,
 *         metrics: ratedModel?.metrics,
 *         scores: ratedModel?.scores
 *       };
 *     });
 *   }, [filteredModels, ratedModels]);
 *   
 *   return (
 *     <Box>
 *       <VendorSelector ... />
 *       
 *       // ✅ NOVO: Filtros de Rating
 *       {selectedVendor && (
 *         <ModelListFilters 
 *           onFilterChange={setFilters}
 *           currentFilters={filters}
 *         />
 *       )}
 *       
 *       <ModelCardList models={modelsWithRatings} ... />
 *     </Box>
 *   );
 * }
 * ```
 * 
 * RESULTADO:
 * - 🔍 Filtros de rating aparecem após selecionar vendor
 * - ⭐ Modelos exibem rating stars nos cards
 * - 🏆 Badges (Gold, Silver, Bronze) aparecem nos modelos certificados
 */

/**
 * ============================================
 * 🎯 EXEMPLO 3: ModelsManagementTab - Adicionar Coluna de Rating
 * ============================================
 * 
 * Arquivo: frontend/src/features/settings/components/ModelsManagementTab.tsx
 * 
 * ANTES:
 * ```tsx
 * <TableHead>
 *   <TableRow>
 *     <TableCell>Modelo</TableCell>
 *     <TableCell>Vendor</TableCell>
 *     <TableCell>Status</TableCell>
 *     <TableCell>Context Window</TableCell>
 *     <TableCell>Ações</TableCell>
 *   </TableRow>
 * </TableHead>
 * <TableBody>
 *   {filteredModels.map((model) => (
 *     <TableRow key={model.id}>
 *       <TableCell>{model.name}</TableCell>
 *       <TableCell>{model.providerName}</TableCell>
 *       <TableCell>{isCertified ? 'Certificado' : 'Não Testado'}</TableCell>
 *       <TableCell>{model.contextWindow}</TableCell>
 *       <TableCell>...</TableCell>
 *     </TableRow>
 *   ))}
 * </TableBody>
 * ```
 * 
 * DEPOIS:
 * ```tsx
 * import { ModelRatingStars, ModelBadge } from '@/components/ModelRating';
 * import { useModelRating } from '@/hooks/useModelRating';
 * 
 * export default function ModelsManagementTab() {
 *   // ✅ NOVO: Hook para buscar ratings
 *   const { getModelById } = useModelRating();
 *   
 *   return (
 *     <>
 *       <TableHead>
 *         <TableRow>
 *           <TableCell>Modelo</TableCell>
 *           <TableCell>Vendor</TableCell>
 *           <TableCell>Status</TableCell>
 *           // ✅ NOVO: Coluna de Rating
 *           <TableCell align="center">Rating</TableCell>
 *           <TableCell>Context Window</TableCell>
 *           <TableCell>Ações</TableCell>
 *         </TableRow>
 *       </TableHead>
 *       <TableBody>
 *         {filteredModels.map((model) => {
 *           // ✅ NOVO: Buscar rating do modelo
 *           const modelWithRating = getModelById(model.apiModelId);
 *           
 *           return (
 *             <TableRow key={model.id}>
 *               <TableCell>{model.name}</TableCell>
 *               <TableCell>{model.providerName}</TableCell>
 *               <TableCell>{isCertified ? 'Certificado' : 'Não Testado'}</TableCell>
 *               // ✅ NOVO: Exibir Rating
 *               <TableCell align="center">
 *                 {modelWithRating?.rating ? (
 *                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
 *                     <ModelRatingStars 
 *                       rating={modelWithRating.rating} 
 *                       size="sm" 
 *                       showValue={false}
 *                     />
 *                     {modelWithRating.badge && (
 *                       <ModelBadge badge={modelWithRating.badge} size="xs" showIcon={false} />
 *                     )}
 *                   </Box>
 *                 ) : (
 *                   <Typography variant="caption" color="text.secondary">N/A</Typography>
 *                 )}
 *               </TableCell>
 *               <TableCell>{model.contextWindow}</TableCell>
 *               <TableCell>...</TableCell>
 *             </TableRow>
 *           );
 *         })}
 *       </TableBody>
 *     </>
 *   );
 * }
 * ```
 * 
 * RESULTADO:
 * - ⭐ Coluna de rating na tabela de modelos
 * - 🏆 Badges (Gold, Silver, Bronze) ao lado do rating
 * - 📊 Métricas visíveis para modelos certificados
 */

/**
 * ============================================
 * ✅ CHECKLIST DE INTEGRAÇÃO
 * ============================================
 * 
 * FASE 1: Preparação
 * - [x] Identificar páginas existentes que exibem modelos
 * - [x] Analisar estrutura de componentes
 * - [x] Verificar hooks disponíveis
 * - [x] Revisar documentação dos componentes de rating
 * 
 * FASE 2: Integração - ModelCard
 * - [ ] Importar componentes de rating
 * - [ ] Adicionar hook useModelRating
 * - [ ] Integrar ModelRatingStars no card expandido
 * - [ ] Adicionar ModelMetricsTooltip ao redor das stars
 * - [ ] Testar exibição de ratings
 * - [ ] Testar tooltip com métricas
 * - [ ] Verificar responsividade
 * 
 * FASE 3: Integração - ModelTab
 * - [ ] Importar ModelListFilters
 * - [ ] Adicionar hook useModelRating com filtros
 * - [ ] Combinar modelos filtrados com ratings
 * - [ ] Exibir filtros após seleção de vendor
 * - [ ] Testar filtros de rating
 * - [ ] Testar filtros de badge
 * - [ ] Verificar performance
 * 
 * FASE 4: Integração - ModelsManagementTab
 * - [ ] Importar componentes de rating
 * - [ ] Adicionar hook useModelRating
 * - [ ] Adicionar coluna de rating na tabela
 * - [ ] Exibir stars e badges
 * - [ ] Testar exibição de ratings
 * - [ ] Verificar alinhamento da tabela
 * 
 * FASE 5: Estilos e Polimento
 * - [ ] Criar arquivo CSS de integração
 * - [ ] Importar CSS nos componentes
 * - [ ] Ajustar espaçamentos
 * - [ ] Testar dark mode
 * - [ ] Testar responsividade mobile
 * - [ ] Verificar acessibilidade
 * 
 * FASE 6: Testes
 * - [ ] Testar com modelos certificados
 * - [ ] Testar com modelos não certificados
 * - [ ] Testar filtros de rating
 * - [ ] Testar tooltips
 * - [ ] Testar performance (sem lentidão)
 * - [ ] Testar em diferentes navegadores
 * 
 * FASE 7: Documentação
 * - [ ] Atualizar README com instruções
 * - [ ] Criar screenshots dos ratings
 * - [ ] Documentar exemplos de uso
 * - [ ] Adicionar troubleshooting
 */

/**
 * ============================================
 * 🐛 TROUBLESHOOTING
 * ============================================
 * 
 * PROBLEMA: Ratings não aparecem
 * SOLUÇÃO:
 * 1. Verificar se o modelo está certificado no backend
 * 2. Verificar se o hook useModelRating está retornando dados
 * 3. Verificar console do navegador para erros
 * 4. Verificar se a API /api/models/ratings está respondendo
 * 
 * PROBLEMA: Tooltip não funciona
 * SOLUÇÃO:
 * 1. Verificar se ModelMetricsTooltip está envolvendo as stars
 * 2. Verificar se metrics e scores estão sendo passados
 * 3. Verificar z-index do tooltip
 * 4. Verificar se há conflitos de CSS
 * 
 * PROBLEMA: Filtros não funcionam
 * SOLUÇÃO:
 * 1. Verificar se setFilters está sendo chamado corretamente
 * 2. Verificar se filteredModels está sendo atualizado
 * 3. Verificar console para erros no hook
 * 4. Verificar se os valores dos filtros são válidos
 */

/**
 * ============================================
 * 💡 DICAS DE PERFORMANCE
 * ============================================
 * 
 * 1. Memoização: Use useMemo para combinar modelos com ratings
 * 2. Lazy Loading: Carregue ratings sob demanda se necessário
 * 3. Debounce: Aplique debounce nos filtros se houver muitos modelos
 * 4. Cache: O hook useModelRating já usa cache do React Query
 */

/**
 * ============================================
 * 🎨 CUSTOMIZAÇÃO
 * ============================================
 * 
 * ALTERAR CORES DOS BADGES:
 * Edite frontend/src/components/ModelRating/ModelBadge.tsx:
 * ```tsx
 * const badgeColors = {
 *   gold: { bg: '#FFD700', text: '#000' },
 *   silver: { bg: '#C0C0C0', text: '#000' },
 *   bronze: { bg: '#CD7F32', text: '#FFF' }
 * };
 * ```
 * 
 * ALTERAR TAMANHO DAS STARS:
 * Use a prop size do ModelRatingStars:
 * ```tsx
 * <ModelRatingStars rating={4.5} size="xs" />  // Extra small
 * <ModelRatingStars rating={4.5} size="sm" />  // Small
 * <ModelRatingStars rating={4.5} size="md" />  // Medium (default)
 * <ModelRatingStars rating={4.5} size="lg" />  // Large
 * ```
 * 
 * ALTERAR MÉTRICAS EXIBIDAS NO TOOLTIP:
 * Edite frontend/src/components/ModelRating/ModelMetricsTooltip.tsx
 * para adicionar/remover métricas.
 */

/**
 * ============================================
 * 📚 REFERÊNCIAS
 * ============================================
 * 
 * - Documentação dos Componentes: frontend/src/components/ModelRating/documentation.ts
 * - Exemplos de Uso: frontend/src/components/ModelRating/examples.tsx
 * - Hook useModelRating: frontend/src/hooks/useModelRating.ts
 * - Tipos de Rating: frontend/src/types/model-rating.ts
 * - Helpers de Rating: frontend/src/utils/rating-helpers.ts
 */

// Este arquivo é apenas para documentação e não deve ser importado
export {};
