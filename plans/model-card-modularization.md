# Plano de Modularização: ModelCard.tsx

**Arquivo:** [`frontend/src/features/chat/components/ControlPanel/ModelCard.tsx`](../frontend/src/features/chat/components/ControlPanel/ModelCard.tsx)  
**Linhas Atuais:** 569 linhas (448 linhas de código efetivo)  
**Meta:** ≤200 linhas (separação View/Logic)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) e [Seção 3.0](../docs/STANDARDS.md:73)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Responsabilidades Identificadas

O componente atual possui **múltiplas responsabilidades** misturadas:

| Responsabilidade | Linhas | Tipo | Complexidade |
|------------------|--------|------|--------------|
| **Lógica de Estado** | ~50 | Logic | Média |
| **Formatação de Dados** | ~30 | Logic | Baixa |
| **Renderização JSX** | ~300 | View | Alta |
| **Handlers de Eventos** | ~40 | Logic | Média |
| **Cálculos Derivados** | ~20 | Logic | Baixa |
| **Memoização** | ~10 | Logic | Baixa |

### 1.2 Componentes Identificados

O arquivo contém **2 componentes principais**:

1. **ModelCard** (linhas 115-476)
   - 361 linhas
   - Responsabilidades: Estado, lógica, renderização
   - Complexidade: Alta

2. **ModelCardList** (linhas 517-569)
   - 52 linhas
   - Responsabilidades: Renderização de lista
   - Complexidade: Baixa

### 1.3 Problemas Identificados

#### ❌ Violações de STANDARDS.md

1. **Tamanho Excessivo (448 linhas)**
   - Limite: 200 linhas para componentes
   - Excesso: 124% acima do recomendado

2. **Separação View/Logic Ausente (Seção 3.0)**
   - Estado e lógica misturados no `.tsx`
   - Sem custom hook dedicado
   - Handlers inline no componente

3. **JSX Complexo e Aninhado**
   - Linhas 223-260: Estado colapsado (38 linhas)
   - Linhas 263-420: Estado expandido (157 linhas)
   - Linhas 423-464: Seletor de provider (42 linhas)

4. **Duplicação de Lógica**
   - Formatação de nomes repetida
   - Validação de providers duplicada
   - Cálculos de estado repetidos

### 1.4 Métricas de Complexidade

```
Complexidade Ciclomática: ~18 (Média-Alta)
Profundidade de Aninhamento: 6 níveis (Alto)
Acoplamento: 12 imports
Coesão: Baixa (View + Logic misturados)
Testabilidade: Difícil (lógica no componente)
```

---

## 🎯 2. Proposta de Divisão em Módulos

### 2.1 Estrutura de Diretórios Proposta

```
frontend/src/features/chat/components/ControlPanel/
├── ModelCard/
│   ├── index.ts                           # Exports públicos
│   ├── ModelCard.tsx                      # 120 linhas (View pura)
│   ├── ModelCardList.tsx                  # 60 linhas (View pura)
│   ├── useModelCard.ts                    # 100 linhas (Lógica)
│   ├── useModelCardList.ts                # 50 linhas (Lógica)
│   └── components/
│       ├── ModelCardCollapsed.tsx         # 80 linhas (Sub-view)
│       ├── ModelCardExpanded.tsx          # 150 linhas (Sub-view)
│       ├── ModelCardHeader.tsx            # 70 linhas (Sub-view)
│       ├── ModelCardMetrics.tsx           # 90 linhas (Sub-view)
│       ├── ModelCardCapabilities.tsx      # 60 linhas (Sub-view)
│       └── ProviderSelector.tsx           # 80 linhas (Sub-view)
└── utils/
    ├── modelNameFormatter.ts              # 40 linhas (Utilitário)
    └── modelValidators.ts                 # 50 linhas (Utilitário)
```

### 2.2 Responsabilidades por Módulo

#### **ModelCard.tsx** (120 linhas - View Pura)
**Responsabilidade:** Renderização principal e composição
```tsx
// Apenas JSX e composição de sub-componentes
// SEM lógica de estado ou handlers

export const ModelCard = memo(({ model, isSelected, onSelect, ... }: ModelCardProps) => {
  // ✅ Hook customizado para toda a lógica
  const logic = useModelCard({
    model,
    isSelected,
    selectedProvider,
    isExpanded: controlledIsExpanded,
    onToggleExpand
  });
  
  // ❌ SEM useState, useEffect, handlers aqui
  
  return (
    <Card sx={logic.cardStyles} onClick={logic.handleToggleExpand}>
      {!logic.isExpanded ? (
        <ModelCardCollapsed {...logic.collapsedProps} />
      ) : (
        <ModelCardExpanded {...logic.expandedProps} />
      )}
      
      <Collapse in={logic.showProviderSelector}>
        <ProviderSelector {...logic.providerSelectorProps} />
      </Collapse>
    </Card>
  );
});
```

#### **useModelCard.ts** (100 linhas - Lógica)
**Responsabilidade:** Estado, handlers e lógica de negócio
```typescript
// TODO lógica de estado e handlers

export function useModelCard({
  model,
  isSelected,
  selectedProvider,
  isExpanded: controlledIsExpanded,
  onToggleExpand
}: UseModelCardParams) {
  // ✅ Estado interno
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = controlledIsExpanded ?? internalIsExpanded;
  
  // ✅ Hook de rating
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);
  
  // ✅ Cálculos derivados
  const hasMultipleProviders = model.availableOn.length > 1;
  const showProviderSelector = isSelected && hasMultipleProviders;
  const hasConfiguredProvider = model.availableOn.some(p => p.isConfigured);
  
  // ✅ Handlers
  const handleToggleExpand = useCallback(() => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  }, [onToggleExpand, internalIsExpanded]);
  
  const handleRadioClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);
  
  // ✅ Efeitos
  useEffect(() => {
    if (isSelected && controlledIsExpanded === undefined) {
      setInternalIsExpanded(true);
    }
  }, [isSelected, controlledIsExpanded]);
  
  // ✅ Estilos computados
  const cardStyles = useMemo(() => ({
    mb: 0.5,
    py: 1.75,
    px: 1,
    cursor: 'pointer',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: isSelected ? 'primary.main' : 'divider',
    bgcolor: isSelected ? 'backgrounds.secondarySubtle' : 'background.paper',
    // ... resto dos estilos
  }), [isSelected, isExpanded]);
  
  // ✅ Props para sub-componentes
  return {
    isExpanded,
    showProviderSelector,
    hasConfiguredProvider,
    modelWithRating,
    cardStyles,
    handleToggleExpand,
    handleRadioClick,
    collapsedProps: {
      model,
      isSelected,
      handleRadioClick
    },
    expandedProps: {
      model,
      isSelected,
      modelWithRating,
      handleRadioClick
    },
    providerSelectorProps: {
      model,
      selectedProvider,
      onProviderChange
    }
  };
}
```

#### **ModelCardCollapsed.tsx** (80 linhas - Sub-view)
**Responsabilidade:** Renderização do estado colapsado
```tsx
// Apenas JSX para estado colapsado

interface ModelCardCollapsedProps {
  model: ModelWithProviders;
  isSelected: boolean;
  handleRadioClick: (e: React.MouseEvent) => void;
}

export const ModelCardCollapsed = memo(({
  model,
  isSelected,
  handleRadioClick
}: ModelCardCollapsedProps) => {
  const shortName = formatModelShortName(model.name);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: 32 }}>
      <Radio
        checked={isSelected}
        sx={{ p: 0.5, flexShrink: 0 }}
        onClick={handleRadioClick}
      />
      
      <Typography
        variant="caption"
        fontWeight={isSelected ? 800 : 600}
        color={isSelected ? 'primary.main' : 'text.primary'}
        sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {shortName}
      </Typography>
      
      <MetricBadge
        label="Context"
        value={formatTokens(model.contextWindow)}
        size="small"
        color={isSelected ? 'primary' : 'default'}
      />
    </Box>
  );
});
```

#### **ModelCardExpanded.tsx** (150 linhas - Sub-view)
**Responsabilidade:** Renderização do estado expandido
```tsx
// Apenas JSX para estado expandido
// Compõe: Header, Metrics, Capabilities

export const ModelCardExpanded = memo(({
  model,
  isSelected,
  modelWithRating,
  handleRadioClick
}: ModelCardExpandedProps) => {
  return (
    <Box>
      <ModelCardHeader
        model={model}
        isSelected={isSelected}
        modelWithRating={modelWithRating}
        handleRadioClick={handleRadioClick}
      />
      
      <ModelCardMetrics model={model} />
      
      <ModelCardCapabilities model={model} />
    </Box>
  );
});
```

#### **ModelCardHeader.tsx** (70 linhas - Sub-view)
**Responsabilidade:** Header com radio, nome, versão, badges
```tsx
// Header do card expandido

export const ModelCardHeader = memo(({
  model,
  isSelected,
  modelWithRating,
  handleRadioClick
}: ModelCardHeaderProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
      <Radio
        checked={isSelected}
        sx={{ mt: -0.5, p: 0.5 }}
        onClick={handleRadioClick}
      />
      
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Typography variant="caption" fontWeight={800}>
            {model.name}
          </Typography>
          
          {model.version && (
            <Typography variant="caption" sx={{ px: 0.75, bgcolor: 'backgrounds.disabledSubtle' }}>
              v{model.version}
            </Typography>
          )}
          
          <ModelBadgeGroup model={{ apiModelId: model.apiModelId }} size="sm" />
        </Box>
        
        {modelWithRating?.rating && (
          <ModelMetricsTooltip metrics={modelWithRating.metrics!}>
            <ModelRatingStars rating={modelWithRating.rating} size="sm" showValue />
          </ModelMetricsTooltip>
        )}
        
        <ProviderBadgeGroup
          providers={model.availableOn}
          modelId={model.apiModelId}
          showCertification
          size="small"
        />
      </Box>
    </Box>
  );
});
```

#### **ModelCardMetrics.tsx** (90 linhas - Sub-view)
**Responsabilidade:** Exibição de métricas (context, output, pricing)
```tsx
// Grid de métricas

export const ModelCardMetrics = memo(({ model }: { model: ModelWithProviders }) => {
  return (
    <Grid container spacing={1.5} sx={{ mb: 1 }}>
      <Grid item xs={6}>
        <Typography variant="caption" color="text.secondary">
          <DescriptionIcon sx={{ fontSize: 12 }} />
          Context: {formatTokens(model.contextWindow)}
        </Typography>
        
        {model.maxOutputTokens && (
          <Typography variant="caption" color="text.secondary">
            <OutputIcon sx={{ fontSize: 12 }} />
            Output: {formatTokens(model.maxOutputTokens)}
          </Typography>
        )}
      </Grid>
      
      <Grid item xs={6}>
        {model.pricing && (
          <>
            <Typography variant="caption" color="text.secondary">
              <AttachMoneyIcon sx={{ fontSize: 12 }} />
              In: ${model.pricing.inputPer1M.toFixed(2)}/1M
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              <PaidIcon sx={{ fontSize: 12 }} />
              Out: ${model.pricing.outputPer1M.toFixed(2)}/1M
            </Typography>
          </>
        )}
      </Grid>
    </Grid>
  );
});
```

#### **ModelCardCapabilities.tsx** (60 linhas - Sub-view)
**Responsabilidade:** Badges de capabilities
```tsx
// Badges de capabilities

export const ModelCardCapabilities = memo(({ model }: { model: ModelWithProviders }) => {
  if (!model.capabilities) return null;
  
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
      {model.capabilities.supportsVision && (
        <CapabilityBadge label="Vision" enabled icon="vision" size="small" />
      )}
      
      {model.capabilities.supportsPromptCache && (
        <CapabilityBadge label="Cache" enabled icon="check" size="small" />
      )}
      
      {model.capabilities.supportsFunctionCalling && (
        <CapabilityBadge label="Functions" enabled icon="function" size="small" />
      )}
    </Box>
  );
});
```

#### **ProviderSelector.tsx** (80 linhas - Sub-view)
**Responsabilidade:** Dropdown de seleção de provider
```tsx
// Seletor de provider (quando múltiplos)

export const ProviderSelector = memo(({
  model,
  selectedProvider,
  onProviderChange
}: ProviderSelectorProps) => {
  return (
    <>
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ p: 2, bgcolor: 'backgrounds.disabledSubtle', borderRadius: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Provider Ativo</InputLabel>
          <Select
            value={selectedProvider || model.availableOn[0]?.providerSlug || ''}
            label="Provider Ativo"
            onChange={(e) => {
              e.stopPropagation();
              onProviderChange?.(e.target.value);
            }}
          >
            {model.availableOn.map((provider) => (
              <MenuItem
                key={provider.providerSlug}
                value={provider.providerSlug}
                disabled={!provider.isConfigured}
              >
                {provider.providerName}
                {!provider.isConfigured && ' (não configurado)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          <LightbulbIcon sx={{ fontSize: 12 }} />
          Este modelo está disponível em múltiplos providers.
        </Typography>
      </Box>
    </>
  );
});
```

#### **modelNameFormatter.ts** (40 linhas - Utilitário)
**Responsabilidade:** Formatação de nomes de modelos
```typescript
// Utilitário puro para formatação

/**
 * Extrai nome resumido do modelo
 * @example "anthropic.claude-sonnet-4-5-20250929-v1:0" → "CLAUDE SONNET 4.5"
 */
export function formatModelShortName(fullName: string): string {
  const withoutVendor = fullName.includes('.')
    ? fullName.split('.')[1]
    : fullName;
  
  const withoutDetailedVersion = withoutVendor
    .replace(/-\d{8}-v\d+:\d+$/, '')
    .replace(/-v\d+:\d+$/, '')
    .replace(/-v\d+$/, '');
  
  const formatted = withoutDetailedVersion
    .replace(/-/g, ' ')
    .toUpperCase();
  
  const words = formatted.split(' ');
  return words.slice(0, 4).join(' ');
}

/**
 * Formata número de tokens
 * @example 200000 → "200k"
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  return tokens.toString();
}
```

#### **modelValidators.ts** (50 linhas - Utilitário)
**Responsabilidade:** Validações de modelo
```typescript
// Validações reutilizáveis

export function hasConfiguredProvider(model: ModelWithProviders): boolean {
  return model.availableOn.some(p => p.isConfigured);
}

export function hasMultipleProviders(model: ModelWithProviders): boolean {
  return model.availableOn.length > 1;
}

export function shouldShowProviderSelector(
  model: ModelWithProviders,
  isSelected: boolean,
  onProviderChange?: (slug: string) => void
): boolean {
  return isSelected && hasMultipleProviders(model) && !!onProviderChange;
}

export function getDefaultProvider(model: ModelWithProviders): string | undefined {
  return model.availableOn.find(p => p.isConfigured)?.providerSlug;
}
```

---

## 🔄 3. Ordem de Implementação

### Fase 1: Extração de Utilitários (Sem Breaking Changes)

1. ✅ Criar `modelNameFormatter.ts`
   - Extrair `getShortName` e `formatTokens`
   - Adicionar testes unitários
   - Manter compatibilidade

2. ✅ Criar `modelValidators.ts`
   - Extrair validações de provider
   - Adicionar testes unitários
   - Manter compatibilidade

### Fase 2: Criação de Sub-componentes

3. ✅ Criar `ModelCardCollapsed.tsx`
   - Extrair JSX do estado colapsado (linhas 223-260)
   - Testar isoladamente
   - Integrar no ModelCard

4. ✅ Criar `ModelCardHeader.tsx`
   - Extrair header do estado expandido
   - Testar isoladamente
   - Integrar no ModelCardExpanded

5. ✅ Criar `ModelCardMetrics.tsx`
   - Extrair grid de métricas
   - Testar isoladamente
   - Integrar no ModelCardExpanded

6. ✅ Criar `ModelCardCapabilities.tsx`
   - Extrair badges de capabilities
   - Testar isoladamente
   - Integrar no ModelCardExpanded

7. ✅ Criar `ProviderSelector.tsx`
   - Extrair seletor de provider (linhas 423-464)
   - Testar isoladamente
   - Integrar no ModelCard

8. ✅ Criar `ModelCardExpanded.tsx`
   - Compor sub-componentes criados
   - Testar composição
   - Integrar no ModelCard

### Fase 3: Extração de Lógica

9. ✅ Criar `useModelCard.ts`
   - Extrair todo estado e handlers
   - Adicionar testes unitários
   - Manter interface idêntica

10. ✅ Criar `useModelCardList.ts`
    - Extrair lógica de lista (se necessário)
    - Adicionar testes unitários

### Fase 4: Refatoração Final

11. ✅ Refatorar `ModelCard.tsx`
    - Reduzir para view pura
    - Usar hook customizado
    - Compor sub-componentes

12. ✅ Refatorar `ModelCardList.tsx`
    - Simplificar se necessário
    - Usar hook se aplicável

13. ✅ Validação Final
    - Executar testes
    - Validar conformidade STANDARDS.md
    - Verificar tamanho de arquivos

---

## ⚠️ 4. Riscos e Mitigações

### 4.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Quebra de comportamento de expansão** | Média | Alto | Testes de integração específicos |
| **Perda de performance (re-renders)** | Baixa | Médio | Manter memoização adequada |
| **Quebra de estilos** | Baixa | Baixo | Testes visuais/snapshot |
| **Props drilling excessivo** | Média | Médio | Usar composition ao invés de props |

### 4.2 Estratégias de Mitigação

#### ✅ Testes de Regressão Visual
```typescript
describe('ModelCard - Visual Regression', () => {
  it('deve renderizar estado colapsado corretamente', () => {
    const { container } = render(<ModelCard model={mockModel} isSelected={false} />);
    expect(container).toMatchSnapshot();
  });
  
  it('deve renderizar estado expandido corretamente', () => {
    const { container } = render(<ModelCard model={mockModel} isSelected={true} />);
    expect(container).toMatchSnapshot();
  });
});
```

#### ✅ Testes de Comportamento
```typescript
describe('ModelCard - Behavior', () => {
  it('deve expandir ao clicar quando colapsado', () => {
    const { getByRole } = render(<ModelCard model={mockModel} />);
    const card = getByRole('button');
    
    fireEvent.click(card);
    
    expect(screen.getByText('Context:')).toBeInTheDocument();
  });
  
  it('deve chamar onSelect ao clicar no radio', () => {
    const onSelect = jest.fn();
    const { getByRole } = render(<ModelCard model={mockModel} onSelect={onSelect} />);
    const radio = getByRole('radio');
    
    fireEvent.click(radio);
    
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

#### ✅ Performance Monitoring
```typescript
// Adicionar testes de performance
describe('ModelCard - Performance', () => {
  it('não deve re-renderizar quando props não mudam', () => {
    const renderSpy = jest.fn();
    const TestComponent = () => {
      renderSpy();
      return <ModelCard model={mockModel} isSelected={false} />;
    };
    
    const { rerender } = render(<TestComponent />);
    rerender(<TestComponent />);
    
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📋 5. Checklist de Conformidade

### STANDARDS.md Seção 3.0 (Separação View/Logic)

- [ ] **Separação Estrita**
  - [ ] `.tsx` contém apenas JSX
  - [ ] Lógica extraída para custom hooks
  - [ ] Sem `useState`/`useEffect` no componente principal

### STANDARDS.md Seção 15 (Tamanho de Arquivos)

- [ ] **Tamanho de Arquivo**
  - [ ] ModelCard.tsx: ≤200 linhas ✅
  - [ ] Hooks: ≤150 linhas ✅
  - [ ] Sub-componentes: ≤100 linhas ✅
  - [ ] Utilities: ≤50 linhas ✅

### Padrões React

- [ ] **Memoização**
  - [ ] Componentes memoizados com `React.memo`
  - [ ] Callbacks com `useCallback`
  - [ ] Valores derivados com `useMemo`

- [ ] **Composição**
  - [ ] Preferir composition over props drilling
  - [ ] Sub-componentes coesos
  - [ ] Props interfaces bem definidas

---

## 📊 6. Métricas de Sucesso

### Antes da Refatoração
```
Arquivo: ModelCard.tsx
Linhas: 569 (448 efetivas)
Componentes: 2 (ModelCard + ModelCardList)
Profundidade JSX: 6 níveis
Complexidade: ~18
Testabilidade: Difícil
```

### Depois da Refatoração (Meta)
```
Arquivo Principal: ModelCard.tsx
Linhas: ≤120

Módulos Criados:
- useModelCard.ts: 100 linhas
- useModelCardList.ts: 50 linhas
- ModelCardCollapsed.tsx: 80 linhas
- ModelCardExpanded.tsx: 150 linhas
- ModelCardHeader.tsx: 70 linhas
- ModelCardMetrics.tsx: 90 linhas
- ModelCardCapabilities.tsx: 60 linhas
- ProviderSelector.tsx: 80 linhas
- modelNameFormatter.ts: 40 linhas
- modelValidators.ts: 50 linhas

Total: 890 linhas (vs 569 original)
Ganho: +56% de código, mas:
  - 100% testável isoladamente
  - 100% reutilizável
  - 100% conforme STANDARDS.md
  - Profundidade JSX: ≤3 níveis
```

---

## 🎯 7. Exemplo de Refatoração (Antes/Depois)

### ❌ Antes (ModelCard - 361 linhas)
```tsx
export const ModelCard = memo(({ model, isSelected, ... }) => {
  // 50 linhas de lógica
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);
  const hasMultipleProviders = model.availableOn.length > 1;
  // ... mais estado e cálculos
  
  // 40 linhas de handlers
  const handleToggleExpand = () => { ... };
  const handleRadioClick = (e) => { ... };
  
  // 10 linhas de efeitos
  useEffect(() => { ... }, [isSelected]);
  
  // 260 linhas de JSX aninhado
  return (
    <Card sx={{ /* 30 linhas de estilos */ }}>
      {!isExpanded && (
        <Box>
          {/* 38 linhas de JSX colapsado */}
        </Box>
      )}
      
      {isExpanded && (
        <Box>
          {/* 157 linhas de JSX expandido */}
        </Box>
      )}
      
      <Collapse in={showProviderSelector}>
        {/* 42 linhas de seletor */}
      </Collapse>
    </Card>
  );
});
```

### ✅ Depois (ModelCard - 120 linhas)
```tsx
export const ModelCard = memo(({ model, isSelected, ... }: ModelCardProps) => {
  // ✅ Toda lógica no hook
  const logic = useModelCard({
    model,
    isSelected,
    selectedProvider,
    isExpanded: controlledIsExpanded,
    onToggleExpand
  });
  
  // ✅ Edge case tratado em sub-componente
  if (!logic.hasConfiguredProvider) {
    return <ModelCardUnconfigured model={model} />;
  }
  
  // ✅ JSX limpo e composicional
  return (
    <Card sx={logic.cardStyles} onClick={logic.handleToggleExpand}>
      {!logic.isExpanded ? (
        <ModelCardCollapsed {...logic.collapsedProps} />
      ) : (
        <ModelCardExpanded {...logic.expandedProps} />
      )}
      
      <Collapse in={logic.showProviderSelector}>
        <ProviderSelector {...logic.providerSelectorProps} />
      </Collapse>
    </Card>
  );
});
```

---

## 📝 8. Notas de Implementação

### 8.1 Memoização Adequada

```typescript
// ✅ Memoizar componentes
export const ModelCard = memo(ModelCardComponent);

// ✅ Memoizar callbacks
const handleToggleExpand = useCallback(() => {
  // ...
}, [dependencies]);

// ✅ Memoizar valores derivados
const cardStyles = useMemo(() => ({
  // ...
}), [isSelected, isExpanded]);

// ✅ Comparação customizada se necessário
export const ModelCard = memo(ModelCardComponent, (prev, next) => {
  return (
    prev.model.id === next.model.id &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded
  );
});
```

### 8.2 Composition over Props Drilling

```typescript
// ❌ Props drilling
<ModelCardExpanded
  model={model}
  isSelected={isSelected}
  modelWithRating={modelWithRating}
  handleRadioClick={handleRadioClick}
  // ... 10 props mais
/>

// ✅ Composition com objeto de props
<ModelCardExpanded {...logic.expandedProps} />

// ✅ Ou context se necessário (evitar se possível)
<ModelCardContext.Provider value={logic}>
  <ModelCar