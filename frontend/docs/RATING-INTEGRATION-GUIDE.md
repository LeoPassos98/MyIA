# Guia de Integração: Sistema de Rating de Modelos

## 📍 Páginas Identificadas

Após análise da estrutura do frontend, foram identificadas as seguintes páginas que exibem modelos:

### 1. **ModelCard** (Chat - Control Panel)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelCard.tsx`](../src/features/chat/components/ControlPanel/ModelCard.tsx)
- **Uso:** Exibe cards de modelos com radio button, badges de providers e informações completas
- **Estado:** Já possui badges de certificação via `ProviderBadge`
- **Integração:** Adicionar rating stars e tooltip com métricas

### 2. **ModelTab** (Chat - Control Panel)
- **Localização:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx`](../src/features/chat/components/ControlPanel/ModelTab.tsx)
- **Uso:** Aba de seleção de modelo (Vendor-First)
- **Estado:** Usa `ModelCardList` para exibir modelos
- **Integração:** Adicionar filtros de rating e exibir ratings nos cards

### 3. **ModelsManagementTab** (Settings)
- **Localização:** [`frontend/src/features/settings/components/ModelsManagementTab.tsx`](../src/features/settings/components/ModelsManagementTab.tsx)
- **Uso:** Gerenciamento e certificação de modelos AWS Bedrock
- **Estado:** Tabela com status de certificação
- **Integração:** Adicionar coluna de rating e métricas

---

## 🎯 Pontos de Integração

### 1. ModelCard - Adicionar Rating Stars

**Arquivo:** [`frontend/src/features/chat/components/ControlPanel/ModelCard.tsx`](../src/features/chat/components/ControlPanel/ModelCard.tsx)

**Modificação:**

```tsx
import { ModelRatingStars, ModelMetricsTooltip } from '@/components/ModelRating';
import { useModelRating } from '@/hooks/useModelRating';

export const ModelCard = React.memo(function ModelCard({
  model,
  isSelected,
  onSelect,
  selectedProvider,
  onProviderChange,
  disabled = false,
  isExpanded: controlledIsExpanded,
  onToggleExpand
}: ModelCardProps) {
  
  // ✅ NOVO: Hook para buscar rating do modelo
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);
  
  // ... código existente ...
  
  return (
    <Card>
      {/* Estado Expandido */}
      {isExpanded && (
        <Box>
          {/* Header: Radio + Nome */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
            <Radio />
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Nome Completo e Versão */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" fontWeight={800}>
                  {model.name}
                </Typography>
                {model.version && (
                  <Typography variant="caption">v{model.version}</Typography>
                )}
              </Box>
              
              {/* ✅ NOVO: Rating com Tooltip */}
              {modelWithRating?.rating && (
                <Box sx={{ mb: 1 }}>
                  <ModelMetricsTooltip 
                    metrics={modelWithRating.metrics} 
                    scores={modelWithRating.scores}
                  >
                    <ModelRatingStars 
                      rating={modelWithRating.rating} 
                      size="sm" 
                      showValue 
                    />
                  </ModelMetricsTooltip>
                </Box>
              )}
              
              {/* Badges de Providers */}
              <Box sx={{ mb: 1.5 }}>
                <ProviderBadgeGroup
                  providers={model.availableOn}
                  showCertification
                  size="small"
                />
              </Box>
              
              {/* ... resto do código ... */}
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
});
```

**Resultado:**
- ⭐ Rating stars aparecem abaixo do nome do modelo
- 💡 Tooltip mostra métricas detalhadas ao passar o mouse
- 🎨 Design integrado com o card existente

---

### 2. ModelTab - Adicionar Filtros de Rating

**Arquivo:** [`frontend/src/features/chat/components/ControlPanel/ModelTab.tsx`](../src/features/chat/components/ControlPanel/ModelTab.tsx)

**Modificação:**

```tsx
import { ModelListFilters } from '@/components/ModelRating';
import { useModelRating } from '@/hooks/useModelRating';

export function ModelTab() {
  const { chatConfig, updateChatConfig } = useLayout();
  
  // ✅ NOVO: Hook de rating com filtros
  const {
    filteredModels: ratedModels,
    filters,
    setFilters,
    loading: ratingLoading
  } = useModelRating();
  
  // Hook de lógica (vendor-first)
  const {
    vendors,
    selectedVendor,
    filteredModels,
    selectedModel,
    selectedProvider,
    isLoading,
    error,
    handleSelectVendor,
    handleSelectModel,
    handleChangeProvider
  } = useModelTabLogic();
  
  // ✅ NOVO: Combinar modelos filtrados com ratings
  const modelsWithRatings = useMemo(() => {
    return filteredModels.map(model => {
      const ratedModel = ratedModels.find(r => r.apiModelId === model.apiModelId);
      return {
        ...model,
        rating: ratedModel?.rating,
        badge: ratedModel?.badge,
        metrics: ratedModel?.metrics,
        scores: ratedModel?.scores
      };
    });
  }, [filteredModels, ratedModels]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1.5 }}>
      
      {/* === SEÇÃO 1: Header === */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          <SmartToyIcon fontSize="small" color="secondary" /> 
          Inteligência Artificial
        </Typography>
      </Box>

      {/* === SEÇÃO 2: Vendor Selector === */}
      <VendorSelector
        vendors={vendors}
        selectedVendor={selectedVendor?.slug || null}
        onSelect={handleSelectVendor}
        isLoading={isLoading}
      />
      
      {/* ✅ NOVO: Filtros de Rating */}
      {selectedVendor && (
        <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
          <ModelListFilters 
            onFilterChange={setFilters}
            currentFilters={filters}
          />
        </Box>
      )}

      {/* === SEÇÃO 3: Model List === */}
      {selectedVendor && (
        <Box sx={{ animation: 'fadeIn 0.3s ease-in' }}>
          <ModelCardList
            models={modelsWithRatings}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            selectedProvider={selectedProvider || undefined}
            onProviderChange={handleChangeProvider}
            expandedModelId={expandedModelId}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      )}

      {/* ... resto do código ... */}
    </Box>
  );
}
```

**Resultado:**
- 🔍 Filtros de rating aparecem após selecionar vendor
- ⭐ Modelos exibem rating stars nos cards
- 🏆 Badges (Gold, Silver, Bronze) aparecem nos modelos certificados

---

### 3. ModelsManagementTab - Adicionar Coluna de Rating

**Arquivo:** [`frontend/src/features/settings/components/ModelsManagementTab.tsx`](../src/features/settings/components/ModelsManagementTab.tsx)

**Modificação:**

```tsx
import { ModelRatingStars, ModelBadge } from '@/components/ModelRating';
import { useModelRating } from '@/hooks/useModelRating';

export default function ModelsManagementTab() {
  // ... código existente ...
  
  // ✅ NOVO: Hook para buscar ratings
  const { getModelById } = useModelRating();
  
  return (
    <SettingsSection
      title="Gerenciamento de Modelos"
      description="Certifique e gerencie modelos AWS Bedrock"
    >
      {/* ... alerts e filtros ... */}

      {/* Tabela de Modelos */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell><strong>Modelo</strong></TableCell>
              <TableCell><strong>Vendor</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              {/* ✅ NOVO: Coluna de Rating */}
              <TableCell align="center"><strong>Rating</strong></TableCell>
              <TableCell align="center"><strong>Context Window</strong></TableCell>
              <TableCell align="right"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredModels.map((model) => {
              const isCertified = certifiedModels.includes(model.apiModelId);
              const isCurrentlyCertifying = isCertifying === model.apiModelId;
              const isSelected = selectedModels.includes(model.apiModelId);
              
              // ✅ NOVO: Buscar rating do modelo
              const modelWithRating = getModelById(model.apiModelId);
              
              return (
                <TableRow key={model.id} hover selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {model.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {model.apiModelId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={model.providerName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    {isCertified ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Certificado"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<HelpOutlineIcon />}
                        label="Não Testado"
                        color="default"
                        size="small"
                      />
                    )}
                  </TableCell>
                  {/* ✅ NOVO: Exibir Rating */}
                  <TableCell align="center">
                    {modelWithRating?.rating ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                        <ModelRatingStars 
                          rating={modelWithRating.rating} 
                          size="sm" 
                          showValue={false}
                        />
                        {modelWithRating.badge && (
                          <ModelBadge badge={modelWithRating.badge} size="xs" showIcon={false} />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {Math.round(model.contextWindow / 1024)}k tokens
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={isCertified ? 'Recertificar modelo' : 'Certificar modelo'} arrow>
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleCertifyModel(model.apiModelId)}
                          disabled={isCurrentlyCertifying}
                        >
                          {isCurrentlyCertifying ? (
                            <CircularProgress size={20} />
                          ) : (
                            <VerifiedUserIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </SettingsSection>
  );
}
```

**Resultado:**
- ⭐ Coluna de rating na tabela de modelos
- 🏆 Badges (Gold, Silver, Bronze) ao lado do rating
- 📊 Métricas visíveis para modelos certificados

---

## 🎨 Estilos CSS

**Arquivo:** [`frontend/src/styles/model-rating-integration.css`](../src/styles/model-rating-integration.css)

```css
/* ============================================
   Model Rating Integration Styles
   ============================================ */

/* ModelCard com Rating */
.model-card-with-rating {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.model-card-with-rating:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Rating Badge no canto superior direito */
.model-card-rating-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

/* Rating Stars Container */
.model-rating-stars-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

/* Tooltip de Métricas */
.model-metrics-tooltip {
  max-width: 320px;
  padding: 12px;
}

.model-metrics-tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.model-metrics-tooltip-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.model-metric-label {
  color: rgba(255, 255, 255, 0.7);
}

.model-metric-value {
  font-weight: 600;
  color: #fff;
}

/* Filtros de Rating */
.model-rating-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
}

.model-rating-filters-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Tabela com Rating */
.model-table-rating-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Animações */
@keyframes fadeInRating {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rating-fade-in {
  animation: fadeInRating 0.3s ease-in;
}

/* Responsividade */
@media (max-width: 768px) {
  .model-rating-filters-row {
    flex-direction: column;
  }
  
  .model-card-rating-badge {
    position: static;
    margin-bottom: 8px;
  }
  
  .model-metrics-tooltip {
    max-width: 280px;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .model-rating-filters {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .model-metric-label {
    color: rgba(255, 255, 255, 0.6);
  }
}
```

---

## 🔗 Rotas

As rotas já existem no projeto. Não é necessário adicionar novas rotas.

**Arquivo:** [`frontend/src/App.tsx`](../src/App.tsx)

```tsx
// Rotas existentes onde os ratings serão exibidos:
<Route path="/chat" element={<Chat />} />           // ModelCard + ModelTab
<Route path="/settings" element={<Settings />} />   // ModelsManagementTab
```

---

## 📱 Navegação

A navegação já existe no projeto. Os ratings serão exibidos nas páginas existentes.

**Locais onde os ratings aparecem:**

1. **Chat → Control Panel → Model Tab**
   - Filtros de rating
   - Rating stars nos cards de modelo
   - Badges de certificação

2. **Settings → Models Management Tab**
   - Coluna de rating na tabela
   - Badges ao lado do rating
   - Métricas de performance

---

## ✅ Checklist de Integração

### Fase 1: Preparação
- [x] Identificar páginas existentes que exibem modelos
- [x] Analisar estrutura de componentes
- [x] Verificar hooks disponíveis
- [x] Revisar documentação dos componentes de rating

### Fase 2: Integração - ModelCard
- [ ] Importar componentes de rating
- [ ] Adicionar hook `useModelRating`
- [ ] Integrar `ModelRatingStars` no card expandido
- [ ] Adicionar `ModelMetricsTooltip` ao redor das stars
- [ ] Testar exibição de ratings
- [ ] Testar tooltip com métricas
- [ ] Verificar responsividade

### Fase 3: Integração - ModelTab
- [ ] Importar `ModelListFilters`
- [ ] Adicionar hook `useModelRating` com filtros
- [ ] Combinar modelos filtrados com ratings
- [ ] Exibir filtros após seleção de vendor
- [ ] Testar filtros de rating
- [ ] Testar filtros de badge
- [ ] Verificar performance

### Fase 4: Integração - ModelsManagementTab
- [ ] Importar componentes de rating
- [ ] Adicionar hook `useModelRating`
- [ ] Adicionar coluna de rating na tabela
- [ ] Exibir stars e badges
- [ ] Testar exibição de ratings
- [ ] Verificar alinhamento da tabela

### Fase 5: Estilos e Polimento
- [ ] Criar arquivo CSS de integração
- [ ] Importar CSS nos componentes
- [ ] Ajustar espaçamentos
- [ ] Testar dark mode
- [ ] Testar responsividade mobile
- [ ] Verificar acessibilidade

### Fase 6: Testes
- [ ] Testar com modelos certificados
- [ ] Testar com modelos não certificados
- [ ] Testar filtros de rating
- [ ] Testar tooltips
- [ ] Testar performance (sem lentidão)
- [ ] Testar em diferentes navegadores

### Fase 7: Documentação
- [ ] Atualizar README com instruções
- [ ] Criar screenshots dos ratings
- [ ] Documentar exemplos de uso
- [ ] Adicionar troubleshooting

---

## 🎯 Próximos Passos

1. **Implementar Fase 2:** Integrar ratings no `ModelCard`
2. **Implementar Fase 3:** Adicionar filtros no `ModelTab`
3. **Implementar Fase 4:** Adicionar coluna de rating no `ModelsManagementTab`
4. **Implementar Fase 5:** Criar e aplicar estilos CSS
5. **Implementar Fase 6:** Executar testes completos
6. **Implementar Fase 7:** Atualizar documentação

---

## 📚 Referências

- [Documentação dos Componentes de Rating](../src/components/ModelRating/documentation.ts)
- [Exemplos de Uso](../src/components/ModelRating/examples.tsx)
- [Hook useModelRating](../src/hooks/useModelRating.ts)
- [Tipos de Rating](../src/types/model-rating.ts)
- [Helpers de Rating](../src/utils/rating-helpers.ts)

---

## 🐛 Troubleshooting

### Problema: Ratings não aparecem

**Solução:**
1. Verificar se o modelo está certificado no backend
2. Verificar se o hook `useModelRating` está retornando dados
3. Verificar console do navegador para erros
4. Verificar se a API `/api/models/ratings` está respondendo

### Problema: Tooltip não funciona

**Solução:**
1. Verificar se `ModelMetricsTooltip` está envolvendo as stars
2. Verificar se `metrics` e `scores` estão sendo passados
3. Verificar z-index do tooltip
4. Verificar se há conflitos de CSS

### Problema: Filtros não funcionam

**Solução:**
1. Verificar se `setFilters` está sendo chamado corretamente
2. Verificar se `filteredModels` está sendo atualizado
3. Verificar console para erros no hook
4. Verificar se os valores dos filtros são válidos

---

## 💡 Dicas de Performance

1. **Memoização:** Use `useMemo` para combinar modelos com ratings
2. **Lazy Loading:** Carregue ratings sob demanda se necessário
3. **Debounce:** Aplique debounce nos filtros se houver muitos modelos
4. **Cache:** O hook `useModelRating` já usa cache do React Query

---

## 🎨 Customização

### Alterar cores dos badges

Edite [`frontend/src/components/ModelRating/ModelBadge.tsx`](../src/components/ModelRating/ModelBadge.tsx):

```tsx
const badgeColors = {
  gold: { bg: '#FFD700', text: '#000' },
  silver: { bg: '#C0C0C0', text: '#000' },
  bronze: { bg: '#CD7F32', text: '#FFF' }
};
```

### Alterar tamanho das stars

Use a prop `size` do `ModelRatingStars`:

```tsx
<ModelRatingStars rating={4.5} size="xs" />  // Extra small
<ModelRatingStars rating={4.5} size="sm" />  // Small
<ModelRatingStars rating={4.5} size="md" />  // Medium (default)
<ModelRatingStars rating={4.5} size="lg" />  // Large
```

### Alterar métricas exibidas no tooltip

Edite [`frontend/src/components/ModelRating/ModelMetricsTooltip.tsx`](../src/components/ModelRating/ModelMetricsTooltip.tsx) para adicionar/remover métricas.

---

**Última atualização:** 2026-01-27
