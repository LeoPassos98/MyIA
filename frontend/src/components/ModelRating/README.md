# Componentes de Rating de Modelos

Sistema completo de visualização de ratings de modelos de IA, incluindo estrelas, badges, métricas detalhadas, filtros e dashboard.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
- [Instalação](#instalação)
- [Uso](#uso)
- [API](#api)
- [Exemplos](#exemplos)
- [Acessibilidade](#acessibilidade)
- [Testes](#testes)

## 🎯 Visão Geral

Este sistema fornece componentes React para exibir e gerenciar ratings de modelos de IA baseados em certificação. Os ratings são calculados com base em 4 métricas principais:

- **Success** (40%): Taxa de sucesso nos testes
- **Resilience** (20%): Capacidade de retry e recuperação
- **Performance** (20%): Latência média
- **Stability** (20%): Estabilidade (ausência de erros)

### Badges

Os modelos recebem badges visuais baseados no rating:

- 🏆 **PREMIUM** (5.0): Perfeito
- ✅ **RECOMENDADO** (4.0-4.9): Ótimo
- ⚠️ **FUNCIONAL** (3.0-3.9): Bom
- 🔶 **LIMITADO** (2.0-2.9): Regular
- ⚠️ **NÃO RECOMENDADO** (1.0-1.9): Ruim
- ❌ **INDISPONÍVEL** (0.0-0.9): Crítico

## 🧩 Componentes

### ModelRatingStars

Exibe estrelas visuais para representar o rating.

```tsx
import { ModelRatingStars } from '@/components/ModelRating';

<ModelRatingStars rating={4.3} size="md" showValue />
```

**Props:**
- `rating` (number): Rating de 0 a 5
- `size` ('sm' | 'md' | 'lg'): Tamanho das estrelas
- `showValue` (boolean): Mostrar valor numérico
- `className` (string): Classe CSS adicional

### ModelBadge

Badge colorido que representa a qualidade do modelo.

```tsx
import { ModelBadge } from '@/components/ModelRating';

<ModelBadge badge="PREMIUM" size="md" showIcon />
```

**Props:**
- `badge` (ModelBadge): Tipo do badge
- `size` ('sm' | 'md' | 'lg'): Tamanho do badge
- `showIcon` (boolean): Mostrar emoji
- `className` (string): Classe CSS adicional

### ModelMetricsTooltip

Tooltip detalhado com métricas e scores do modelo.

```tsx
import { ModelMetricsTooltip } from '@/components/ModelRating';

<ModelMetricsTooltip metrics={model.metrics} scores={model.scores}>
  <ModelRatingStars rating={model.rating} />
</ModelMetricsTooltip>
```

**Props:**
- `metrics` (ModelMetrics): Métricas do modelo
- `scores` (ModelScores): Scores individuais
- `children` (ReactNode): Elemento que dispara o tooltip

### ModelListFilters

Filtros e ordenação para lista de modelos.

```tsx
import { ModelListFilters } from '@/components/ModelRating';

<ModelListFilters 
  onFilterChange={setFilters} 
  currentFilters={filters}
  totalModels={42}
  filteredCount={15}
/>
```

**Props:**
- `onFilterChange` (function): Callback quando filtros mudam
- `currentFilters` (ModelFilters): Filtros atuais
- `totalModels` (number): Total de modelos
- `filteredCount` (number): Modelos após filtro

### ModelRatingDashboard

Dashboard com visão geral dos ratings.

```tsx
import { ModelRatingDashboard } from '@/components/ModelRating';

<ModelRatingDashboard models={modelsWithRating} />
```

**Props:**
- `models` (ModelWithRating[]): Lista de modelos com rating
- `className` (string): Classe CSS adicional

## 📦 Instalação

Os componentes já estão incluídos no projeto. Para usar:

```tsx
import { 
  ModelRatingStars, 
  ModelBadge, 
  ModelMetricsTooltip,
  ModelListFilters,
  ModelRatingDashboard
} from '@/components/ModelRating';
```

## 🚀 Uso

### Hook useModelRating

Hook principal para buscar e gerenciar modelos com rating:

```tsx
import { useModelRating } from '@/hooks/useModelRating';

function MyComponent() {
  const { 
    models,           // Todos os modelos
    filteredModels,   // Modelos após filtros
    loading,          // Estado de carregamento
    error,            // Erro (se houver)
    filters,          // Filtros atuais
    setFilters,       // Atualizar filtros
    refetch           // Recarregar dados
  } = useModelRating();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <ModelListFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
        totalModels={models.length}
        filteredCount={filteredModels.length}
      />
      {filteredModels.map(model => (
        <div key={model.id}>
          <h3>{model.name}</h3>
          <ModelRatingStars rating={model.rating} showValue />
          {model.badge && <ModelBadge badge={model.badge} />}
        </div>
      ))}
    </div>
  );
}
```

### Hooks Auxiliares

```tsx
// Buscar apenas modelos certificados
import { useCertifiedModels } from '@/hooks/useModelRating';

const { models, loading, error } = useCertifiedModels();

// Buscar modelo específico por ID
import { useModelById } from '@/hooks/useModelRating';

const { model, loading, error } = useModelById('model-123');
```

## 📡 API

### Endpoint

```
GET /api/providers/models
```

### Resposta

```json
{
  "data": [
    {
      "id": "model-123",
      "name": "Amazon Nova Micro",
      "provider": "Amazon",
      "isAvailable": true,
      "rating": 5.0,
      "badge": "PREMIUM",
      "metrics": {
        "successRate": 100,
        "averageRetries": 0,
        "averageLatency": 1285,
        "errorCount": 0,
        "totalTests": 7,
        "testsPassed": 7
      },
      "scores": {
        "success": 4.0,
        "resilience": 1.0,
        "performance": 1.0,
        "stability": 1.0
      },
      "ratingUpdatedAt": "2026-01-27T17:00:00.000Z"
    }
  ]
}
```

## 💡 Exemplos

### Exemplo 1: Lista Simples com Filtros

```tsx
import { useModelRating } from '@/hooks/useModelRating';
import { ModelListFilters, ModelRatingStars, ModelBadge } from '@/components/ModelRating';

function ModelList() {
  const { filteredModels, filters, setFilters, loading } = useModelRating();

  return (
    <div>
      <ModelListFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
      />
      {filteredModels.map(model => (
        <div key={model.id} className="model-card">
          <h3>{model.name}</h3>
          <ModelRatingStars rating={model.rating} showValue />
          {model.badge && <ModelBadge badge={model.badge} />}
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 2: Dashboard Completo

```tsx
import { useCertifiedModels } from '@/hooks/useModelRating';
import { ModelRatingDashboard } from '@/components/ModelRating';

function Dashboard() {
  const { models, loading } = useCertifiedModels();

  if (loading) return <div>Carregando...</div>;

  return <ModelRatingDashboard models={models} />;
}
```

### Exemplo 3: Card com Tooltip

```tsx
import { ModelRatingStars, ModelMetricsTooltip, ModelBadge } from '@/components/ModelRating';

function ModelCard({ model }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{model.name}</h3>
        {model.badge && <ModelBadge badge={model.badge} size="sm" />}
      </div>
      
      {model.metrics && model.scores ? (
        <ModelMetricsTooltip metrics={model.metrics} scores={model.scores}>
          <ModelRatingStars rating={model.rating} size="md" showValue />
        </ModelMetricsTooltip>
      ) : (
        <ModelRatingStars rating={model.rating} size="md" showValue />
      )}
    </div>
  );
}
```

## ♿ Acessibilidade

Todos os componentes seguem as diretrizes WCAG 2.1 AA:

- ✅ ARIA labels em todos os elementos interativos
- ✅ Navegação por teclado
- ✅ Contraste de cores adequado
- ✅ Textos alternativos para ícones
- ✅ Estados de foco visíveis
- ✅ Suporte a leitores de tela

### Exemplos de ARIA

```tsx
// Estrelas
<div role="img" aria-label="Rating: 4.3 de 5 estrelas">
  {/* Estrelas */}
</div>

// Badge
<span role="status" aria-label="Modelo premium com desempenho perfeito">
  🏆 PREMIUM
</span>

// Filtros
<input 
  type="range" 
  aria-label="Rating mínimo: 3.5 estrelas"
  aria-valuenow={3.5}
  aria-valuemin={0}
  aria-valuemax={5}
/>
```

## 🧪 Testes

### Executar Testes

```bash
npm test
```

### Cobertura

```bash
npm run test:coverage
```

### Exemplos de Testes

```tsx
import { render, screen } from '@testing-library/react';
import { ModelRatingStars } from '@/components/ModelRating';

describe('ModelRatingStars', () => {
  it('deve renderizar 5 estrelas cheias para rating 5.0', () => {
    render(<ModelRatingStars rating={5.0} />);
    expect(screen.getByLabelText('Rating: 5.0 de 5 estrelas')).toBeInTheDocument();
  });

  it('deve mostrar valor numérico quando showValue=true', () => {
    render(<ModelRatingStars rating={4.3} showValue />);
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });
});
```

## 🎨 Customização

### CSS Variables

```css
:root {
  --badge-premium: #FFD700;
  --badge-recomendado: #10B981;
  --badge-funcional: #F59E0B;
  --badge-limitado: #F97316;
  --badge-nao-recomendado: #EF4444;
  --badge-indisponivel: #6B7280;
}
```

### Dark Mode

Os componentes suportam dark mode automaticamente via `prefers-color-scheme`.

## 📝 Tipos TypeScript

```typescript
// Tipos principais
import type {
  ModelBadge,
  ModelMetrics,
  ModelScores,
  ModelRating,
  ModelWithRating,
  ModelFilters,
  RatingStatistics
} from '@/types/model-rating';
```

## 🔧 Utilitários

```typescript
import {
  getBadgeColor,
  getBadgeEmoji,
  getBadgeDescription,
  formatLatency,
  formatSuccessRate,
  getStarFillPercentage,
  filterModels,
  sortModels,
  calculateRatingStatistics
} from '@/utils/rating-helpers';
```

## 📚 Documentação Adicional

- [Sistema de Rating (Backend)](../../../backend/docs/MODEL-RATING-SYSTEM.md)
- [Certificação de Modelos](../../../backend/docs/CERTIFICATION-CACHE-MANAGEMENT.md)
- [Standards do Projeto](../../../docs/STANDARDS.md)

## 🤝 Contribuindo

Ao adicionar novos componentes ou modificar existentes:

1. Siga os padrões do projeto (STANDARDS.md)
2. Adicione testes unitários
3. Documente props e comportamentos
4. Garanta acessibilidade (WCAG 2.1 AA)
5. Teste responsividade (mobile, tablet, desktop)

## 📄 Licença

Este código faz parte do projeto MyIA e segue a mesma licença do projeto principal.
