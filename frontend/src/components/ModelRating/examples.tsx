// frontend/src/components/ModelRating/examples.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Exemplos de uso dos componentes de Rating de Modelos
 * 
 * Este arquivo contém exemplos práticos de como usar os componentes
 * de rating em diferentes cenários.
 */

import { useModelRating, useCertifiedModels } from '../../hooks/useModelRating';
import {
  ModelRatingStars,
  ModelBadge,
  ModelMetricsTooltip,
  ModelListFilters,
  ModelRatingDashboard
} from './index';

// ============================================
// EXEMPLO 1: Lista Simples com Filtros
// ============================================

export function Example1_SimpleList() {
  const { filteredModels, filters, setFilters, loading } = useModelRating();

  if (loading) return <div>Carregando modelos...</div>;

  return (
    <div>
      <h2>Modelos Disponíveis</h2>
      
      <ModelListFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
        totalModels={filteredModels.length}
        filteredCount={filteredModels.length}
      />

      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredModels.map(model => (
          <div key={model.id} style={{ 
            padding: '16px', 
            border: '1px solid #E5E7EB', 
            borderRadius: '8px' 
          }}>
            <h3>{model.name}</h3>
            <p>Provider: {model.provider}</p>
            {model.rating && (
              <ModelRatingStars rating={model.rating} size="md" showValue />
            )}
            {model.badge && (
              <ModelBadge badge={model.badge} size="sm" showIcon />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 2: Dashboard Completo
// ============================================

export function Example2_Dashboard() {
  const { models, loading, error } = useCertifiedModels();

  if (loading) return <div>Carregando estatísticas...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <h1>Dashboard de Ratings</h1>
      <ModelRatingDashboard models={models} />
    </div>
  );
}

// ============================================
// EXEMPLO 3: Card com Tooltip Detalhado
// ============================================

export function Example3_CardWithTooltip({ modelId }: { modelId: string }) {
  const { models } = useModelRating();
  const model = models.find(m => m.id === modelId);

  if (!model) return <div>Modelo não encontrado</div>;

  return (
    <div style={{ 
      padding: '24px', 
      border: '1px solid #E5E7EB', 
      borderRadius: '12px',
      maxWidth: '400px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0 }}>{model.name}</h3>
        {model.badge && (
          <ModelBadge badge={model.badge} size="sm" showIcon />
        )}
      </div>

      {/* Provider */}
      <p style={{ color: '#6B7280', marginBottom: '16px' }}>
        {model.provider}
      </p>

      {/* Rating com Tooltip */}
      {model.rating && model.metrics && model.scores ? (
        <ModelMetricsTooltip metrics={model.metrics} scores={model.scores}>
          <div>
            <ModelRatingStars rating={model.rating} size="lg" showValue />
          </div>
        </ModelMetricsTooltip>
      ) : (
        <div>Sem rating disponível</div>
      )}

      {/* Última atualização */}
      {model.ratingUpdatedAt && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#9CA3AF', 
          marginTop: '12px' 
        }}>
          Última certificação: {new Date(model.ratingUpdatedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 4: Lista com Filtros Avançados
// ============================================

export function Example4_AdvancedFilters() {
  const { filteredModels, filters, setFilters, models } = useModelRating();

  return (
    <div>
      <h2>Busca Avançada de Modelos</h2>

      {/* Filtros */}
      <ModelListFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
        totalModels={models.length}
        filteredCount={filteredModels.length}
      />

      {/* Resultados */}
      <div style={{ marginTop: '24px' }}>
        <h3>Resultados ({filteredModels.length})</h3>
        
        {filteredModels.length === 0 ? (
          <p>Nenhum modelo encontrado com os filtros selecionados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredModels.map(model => (
              <div key={model.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                padding: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0' }}>{model.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
                    {model.provider}
                  </p>
                </div>
                
                {model.badge && (
                  <ModelBadge badge={model.badge} size="sm" showIcon={false} />
                )}
                
                {model.rating && (
                  <ModelRatingStars rating={model.rating} size="sm" showValue />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 5: Comparação de Modelos
// ============================================

export function Example5_ModelComparison({ modelIds }: { modelIds: string[] }) {
  const { models } = useModelRating();
  const selectedModels = models.filter(m => modelIds.includes(m.id));

  return (
    <div>
      <h2>Comparação de Modelos</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        {selectedModels.map(model => (
          <div key={model.id} style={{ 
            padding: '16px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px'
          }}>
            <h3>{model.name}</h3>
            
            {model.badge && (
              <ModelBadge badge={model.badge} size="md" showIcon />
            )}
            
            {model.rating && (
              <div style={{ marginTop: '12px' }}>
                <ModelRatingStars rating={model.rating} size="lg" showValue />
              </div>
            )}
            
            {model.metrics && (
              <div style={{ marginTop: '16px', fontSize: '0.875rem' }}>
                <div>Taxa de Sucesso: {model.metrics.successRate.toFixed(1)}%</div>
                <div>Latência: {model.metrics.averageLatency}ms</div>
                <div>Retries: {model.metrics.averageRetries.toFixed(2)}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 6: Top Modelos (Ranking)
// ============================================

export function Example6_TopModels({ limit = 5 }: { limit?: number }) {
  const { models } = useCertifiedModels();
  const topModels = models
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);

  return (
    <div>
      <h2>🏆 Top {limit} Modelos</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {topModels.map((model, index) => (
          <div key={model.id} style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: index === 0 ? '#FFF7ED' : '#F9FAFB',
            border: `2px solid ${index === 0 ? '#FFD700' : '#E5E7EB'}`,
            borderRadius: '12px'
          }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              color: index === 0 ? '#FFD700' : '#6B7280',
              minWidth: '40px',
              textAlign: 'center'
            }}>
              {index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0' }}>{model.name}</h3>
              <p style={{ margin: 0, color: '#6B7280' }}>{model.provider}</p>
            </div>
            
            {model.badge && (
              <ModelBadge badge={model.badge} size="sm" showIcon />
            )}
            
            {model.rating && (
              <ModelRatingStars rating={model.rating} size="md" showValue />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 7: Integração com Formulário
// ============================================

export function Example7_ModelSelector({ 
  onSelect 
}: { 
  onSelect: (modelId: string) => void 
}) {
  const { filteredModels, filters, setFilters } = useModelRating();

  return (
    <div>
      <h2>Selecione um Modelo</h2>
      
      <ModelListFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
      />
      
      <div style={{ marginTop: '16px' }}>
        {filteredModels.map(model => (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              marginBottom: '8px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{model.name}</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {model.provider}
              </div>
            </div>
            
            {model.rating && (
              <ModelRatingStars rating={model.rating} size="sm" showValue />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
