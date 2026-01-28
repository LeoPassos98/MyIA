# Sistema de Classificação de Modelos (Rating)

## Visão Geral

Sistema de classificação de modelos de IA baseado em múltiplas métricas de qualidade e desempenho. O rating é calculado automaticamente durante o processo de certificação e armazenado no banco de dados.

## Escala de Rating (0-5 estrelas)

| Rating | Badge | Descrição | Uso Recomendado |
|--------|-------|-----------|-----------------|
| 5.0 | 🏆 PREMIUM | Perfeito em todos os aspectos | Produção crítica |
| 4.0-4.9 | ✅ RECOMENDADO | Pequenas imperfeições | Produção geral |
| 3.0-3.9 | ⚠️ FUNCIONAL | Funcional com limitações | Desenvolvimento/Testes |
| 2.0-2.9 | 🔶 LIMITADO | Problemas significativos | Apenas testes |
| 1.0-1.9 | ⚠️ NÃO RECOMENDADO | Muitos problemas | Não recomendado |
| 0.0-0.9 | ❌ INDISPONÍVEL | Não funciona | Indisponível |

## Métricas de Avaliação

O rating é calculado com base em 4 métricas principais, cada uma com peso específico:

### 1. Taxa de Sucesso (40% do rating)
- **Peso:** 40% (score máximo: 4.0)
- **Cálculo:** `(testsPassed / totalTests) * 4.0`
- **Descrição:** Percentual de testes que passaram com sucesso
- **Importância:** É a métrica mais importante, pois indica a confiabilidade básica do modelo

**Exemplo:**
```typescript
// 7 testes passaram de 7 totais
successScore = (7 / 7) * 4.0 = 4.0
```

### 2. Resiliência (20% do rating)
- **Peso:** 20% (score máximo: 1.0)
- **Cálculo:** `Math.max(0, 1.0 - (averageRetries * 0.2))`
- **Descrição:** Penaliza modelos que precisam de muitas tentativas (retries)
- **Importância:** Modelos que precisam de muitos retries são menos confiáveis

**Exemplo:**
```typescript
// 0 retries em média
resilienceScore = Math.max(0, 1.0 - (0 * 0.2)) = 1.0

// 2.5 retries em média
resilienceScore = Math.max(0, 1.0 - (2.5 * 0.2)) = 0.5
```

### 3. Performance (20% do rating)
- **Peso:** 20% (score máximo: 1.0)
- **Cálculo:** Baseado em thresholds de latência
- **Descrição:** Avalia a velocidade de resposta do modelo

**Thresholds:**
- **Excelente (1.0):** < 2000ms
- **Bom (0.8):** 2000-5000ms
- **Aceitável (0.5):** 5000-10000ms
- **Lento (0.2):** > 10000ms

**Exemplo:**
```typescript
// Latência média de 1285ms
performanceScore = 1.0 // Excelente

// Latência média de 5735ms
performanceScore = 0.5 // Aceitável
```

### 4. Estabilidade (20% do rating)
- **Peso:** 20% (score máximo: 1.0)
- **Cálculo:** `Math.max(0, 1.0 - (errorCount * 0.15))`
- **Descrição:** Penaliza modelos com muitos erros e timeouts
- **Importância:** Modelos estáveis são mais previsíveis

**Exemplo:**
```typescript
// 0 erros
stabilityScore = Math.max(0, 1.0 - (0 * 0.15)) = 1.0

// 3 erros
stabilityScore = Math.max(0, 1.0 - (3 * 0.15)) = 0.55
```

## Fórmula de Cálculo

```typescript
rating = (
  successScore * 0.40 +      // 40% - Taxa de sucesso
  resilienceScore * 0.20 +   // 20% - Resiliência (retries)
  performanceScore * 0.20 +  // 20% - Performance (latência)
  stabilityScore * 0.20      // 20% - Estabilidade (erros)
) * 5.0 / 4.0                // Normalizar para escala 0-5

// Arredondar para 1 casa decimal
rating = Math.round(rating * 10) / 10
```

## Exemplos Práticos

### Exemplo 1: Modelo Premium (5.0)
```typescript
const metrics = {
  testsPassed: 7,
  totalTests: 7,
  averageRetries: 0,
  averageLatency: 1285,
  errorCount: 0,
  successRate: 100
};

// Cálculo:
successScore = (7/7) * 4.0 = 4.0
resilienceScore = 1.0 - (0 * 0.2) = 1.0
performanceScore = 1.0 (< 2000ms)
stabilityScore = 1.0 - (0 * 0.15) = 1.0

rating = (4.0*0.4 + 1.0*0.2 + 1.0*0.2 + 1.0*0.2) * 5/4
rating = (1.6 + 0.2 + 0.2 + 0.2) * 1.25
rating = 2.2 * 1.25 = 2.75 * 1.25 = 5.0

// Resultado: ⭐⭐⭐⭐⭐ 5.0 - 🏆 PREMIUM
```

### Exemplo 2: Modelo Recomendado (4.4)
```typescript
const metrics = {
  testsPassed: 7,
  totalTests: 7,
  averageRetries: 0,
  averageLatency: 5963,
  errorCount: 0,
  successRate: 100
};

// Cálculo:
successScore = 4.0
resilienceScore = 1.0
performanceScore = 0.5 (5000-10000ms)
stabilityScore = 1.0

rating = (4.0*0.4 + 1.0*0.2 + 0.5*0.2 + 1.0*0.2) * 5/4
rating = (1.6 + 0.2 + 0.1 + 0.2) * 1.25
rating = 2.1 * 1.25 = 2.625 * 1.25 = 4.4

// Resultado: ⭐⭐⭐⭐ 4.4 - ✅ RECOMENDADO
```

### Exemplo 3: Modelo Limitado (2.5)
```typescript
const metrics = {
  testsPassed: 3,
  totalTests: 7,
  averageRetries: 2.5,
  averageLatency: 5735,
  errorCount: 4,
  successRate: 42.9
};

// Cálculo:
successScore = (3/7) * 4.0 = 1.71
resilienceScore = 1.0 - (2.5 * 0.2) = 0.5
performanceScore = 0.5
stabilityScore = 1.0 - (4 * 0.15) = 0.4

rating = (1.71*0.4 + 0.5*0.2 + 0.5*0.2 + 0.4*0.2) * 5/4
rating = (0.684 + 0.1 + 0.1 + 0.08) * 1.25
rating = 0.964 * 1.25 = 1.205 * 1.25 = 2.5

// Resultado: ⭐⭐ 2.5 - 🔶 LIMITADO
```

## API

### GET /api/providers/models

Retorna lista de modelos com rating:

```json
{
  "status": "success",
  "data": [
    {
      "id": "amazon.nova-micro-v1:0",
      "name": "Amazon Nova Micro",
      "vendor": "amazon",
      "rating": 5.0,
      "badge": "PREMIUM",
      "metrics": {
        "successRate": 100,
        "averageRetries": 0,
        "averageLatency": 1285,
        "errorCount": 0,
        "totalTests": 7
      },
      "scores": {
        "success": 4.0,
        "resilience": 1.0,
        "performance": 1.0,
        "stability": 1.0
      },
      "ratingUpdatedAt": "2026-01-27T14:30:00.000Z"
    }
  ]
}
```

### Campos de Rating

- **rating** (number): Rating de 0-5 estrelas
- **badge** (string): Badge visual (PREMIUM, RECOMENDADO, FUNCIONAL, LIMITADO, NÃO RECOMENDADO, INDISPONÍVEL)
- **metrics** (object): Métricas brutas usadas no cálculo
  - `successRate`: Taxa de sucesso em %
  - `averageRetries`: Média de retries por teste
  - `averageLatency`: Latência média em ms
  - `errorCount`: Número total de erros
  - `totalTests`: Total de testes executados
- **scores** (object): Scores individuais de cada métrica
  - `success`: Score de sucesso (0-4.0)
  - `resilience`: Score de resiliência (0-1.0)
  - `performance`: Score de performance (0-1.0)
  - `stability`: Score de estabilidade (0-1.0)
- **ratingUpdatedAt** (string): Data da última atualização do rating

## Uso Programático

### Calcular Rating Manualmente

```typescript
import { RatingCalculator } from './services/ai/rating/rating-calculator';

const calculator = new RatingCalculator();

const metrics = {
  testsPassed: 7,
  totalTests: 7,
  averageRetries: 0,
  averageLatency: 1285,
  errorCount: 0,
  successRate: 100
};

const result = calculator.calculate(metrics);

console.log(result);
// {
//   rating: 5.0,
//   badge: 'PREMIUM',
//   metrics: { ... },
//   scores: {
//     success: 4.0,
//     resilience: 1.0,
//     performance: 1.0,
//     stability: 1.0
//   }
// }
```

### Certificar Modelo com Rating

```typescript
import { CertificationService } from './services/ai/certification/certification.service';

const service = new CertificationService();

// Rating é calculado automaticamente
const result = await service.certifyModel('amazon.nova-micro-v1:0');

console.log(`Rating: ${result.rating}`);
console.log(`Badge: ${result.badge}`);
console.log(`Metrics:`, result.metrics);
console.log(`Scores:`, result.scores);
```

## Retry com Backoff Exponencial

O sistema automaticamente faz retry em caso de:
- **Rate limits (429):** Limite de taxa excedido
- **Throttling:** Serviço temporariamente indisponível
- **Timeouts temporários:** Timeout em requisições
- **Erros de rede transientes:** Problemas temporários de conexão

**Configuração de Backoff:**
- Tentativa 1: Imediato
- Tentativa 2: 2s de espera
- Tentativa 3: 4s de espera
- Tentativa 4: 8s de espera
- Tentativa 5: 16s de espera
- Tentativa 6: 32s de espera
- **Máximo:** 6 retries

**Impacto no Rating:**
- Cada retry reduz o score de resiliência em 0.2
- Exemplo: 3 retries = score de 0.4 (1.0 - 3*0.2)

## Testes

### Testar RatingCalculator

```bash
cd backend
npm test -- rating-calculator.test.ts
```

**Cobertura de testes:**
- ✅ Cálculo de rating perfeito (5.0)
- ✅ Cálculo com latência alta
- ✅ Cálculo com retries
- ✅ Cálculo com erros
- ✅ Cálculo com falhas parciais
- ✅ Cálculo com múltiplos problemas
- ✅ Atribuição correta de badges
- ✅ Casos extremos (0 testes, valores negativos)

### Testar Retry Logic

```bash
cd backend
npm test -- test-runner-retry.test.ts
```

**Cobertura de testes:**
- ✅ Retry em rate limit (429)
- ✅ Retry em throttling
- ✅ Backoff exponencial
- ✅ Máximo de retries
- ✅ Contagem de retries

### Testar Integração com Certificação

```bash
cd backend
npm test -- certification-rating.test.ts
```

**Cobertura de testes:**
- ✅ Rating calculado durante certificação
- ✅ Rating salvo no banco de dados
- ✅ Métricas e scores salvos corretamente

## Scripts de Certificação

### Certificar Modelo Individual

```bash
cd backend
npx ts-node scripts/certify-model.ts <modelId>
```

**Exemplo:**
```bash
npx ts-node scripts/certify-model.ts amazon.nova-micro-v1:0
```

**Saída:**
```
✅ Certificação Concluída

Modelo: amazon.nova-micro-v1:0
Rating: ⭐⭐⭐⭐⭐ 5.0
Badge: 🏆 PREMIUM

Métricas:
  Taxa de Sucesso: 100%
  Retries Médios: 0
  Latência Média: 1285ms
  Erros: 0

Scores:
  Success: 4.00/4.0
  Resilience: 1.00/1.0
  Performance: 1.00/1.0
  Stability: 1.00/1.0
```

### Certificar Todos os Modelos

```bash
cd backend
npx ts-node scripts/test-all-models.ts [vendor]
```

**Exemplos:**
```bash
# Testar todos os vendors
npx ts-node scripts/test-all-models.ts

# Testar apenas Amazon
npx ts-node scripts/test-all-models.ts amazon

# Testar apenas Anthropic
npx ts-node scripts/test-all-models.ts anthropic
```

**Saída:**
- Relatório JSON: `backend/logs/model-tests-[timestamp].json`
- Relatório Markdown: `backend/logs/model-tests-[timestamp].md`

O relatório inclui:
- Rating de cada modelo
- Badge visual
- Métricas detalhadas
- Scores individuais
- Ordenação por rating
- Agrupamento por badge

### Limpar Certificações

```bash
cd backend
CONFIRM=true npx ts-node scripts/clear-all-certifications.ts
```

## Visualizar Ratings no Banco

### Via Prisma Studio

```bash
cd backend
npx prisma studio
```

Navegue para a tabela `model_certifications` e visualize os campos:
- `rating`
- `badge`
- `metrics`
- `scores`
- `ratingUpdatedAt`

### Via SQL

```bash
psql -U leonardo -h localhost -d myia -c "
SELECT 
  \"modelId\",
  rating,
  badge,
  metrics,
  scores,
  \"ratingUpdatedAt\"
FROM model_certifications
WHERE rating IS NOT NULL
ORDER BY rating DESC;
"
```

## Ajustando Pesos

Se necessário ajustar os pesos das métricas, edite [`rating-calculator.ts`](../src/services/ai/rating/rating-calculator.ts):

```typescript
private readonly WEIGHTS = {
  SUCCESS: 0.40,      // 40% - Taxa de sucesso
  RESILIENCE: 0.20,   // 20% - Resiliência
  PERFORMANCE: 0.20,  // 20% - Performance
  STABILITY: 0.20     // 20% - Estabilidade
};
```

**Considerações:**
- A soma dos pesos deve ser 1.0
- SUCCESS deve ter o maior peso (é a métrica mais importante)
- Após ajustar, execute os testes para validar
- Re-certifique os modelos para atualizar ratings

## Troubleshooting

### Rating não está sendo calculado

**Verificar:**
1. Certificação foi executada com sucesso?
2. Campos `rating`, `badge`, `metrics`, `scores` estão no banco?
3. Migração `20260127170018_add_model_rating_fields` foi aplicada?

**Solução:**
```bash
cd backend
npx prisma migrate status
npx prisma migrate deploy
```

### Rating parece incorreto

**Verificar:**
1. Métricas estão corretas no banco?
2. Pesos estão configurados corretamente?
3. Thresholds de latência fazem sentido?

**Solução:**
```bash
# Executar testes unitários
cd backend
npm test -- rating-calculator.test.ts

# Re-certificar modelo
npx ts-node scripts/certify-model.ts <modelId>
```

### API não retorna rating

**Verificar:**
1. Controller está incluindo campos de rating?
2. Modelo foi certificado recentemente?
3. Cache do frontend está atualizado?

**Solução:**
```bash
# Verificar endpoint
curl http://localhost:3001/api/providers/models | jq '.data[] | {name, rating, badge}'

# Re-certificar se necessário
cd backend
npx ts-node scripts/certify-model.ts <modelId>
```

## Próximos Passos

### Frontend

1. **Exibir rating na lista de modelos**
   - Mostrar estrelas visuais
   - Exibir badge colorido
   - Tooltip com métricas detalhadas

2. **Filtrar por rating**
   - Filtro "Apenas Premium"
   - Filtro "Recomendados ou melhor"
   - Ordenar por rating

3. **Dashboard de ratings**
   - Gráfico de distribuição de ratings
   - Comparação entre vendors
   - Histórico de ratings ao longo do tempo

### Backend

1. **Cache de ratings**
   - Evitar recalcular a cada request
   - Invalidar cache ao re-certificar

2. **Histórico de ratings**
   - Tabela `rating_history`
   - Tracking de mudanças ao longo do tempo
   - Alertas quando rating cai

3. **Ratings personalizados**
   - Permitir usuários ajustarem pesos
   - Ratings por caso de uso (velocidade vs qualidade)
   - Ratings por região

## Referências

- [`model-rating.ts`](../src/types/model-rating.ts) - Tipos e interfaces
- [`rating-calculator.ts`](../src/services/ai/rating/rating-calculator.ts) - Lógica de cálculo
- [`certification.service.ts`](../src/services/ai/certification/certification.service.ts) - Integração com certificação
- [`test-runner.ts`](../src/services/ai/certification/test-runner.ts) - Retry logic
- [`providersController.ts`](../src/controllers/providersController.ts) - API endpoint

---

*Documentação gerada em 2026-01-27*
