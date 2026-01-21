# Hook useModelCapabilities - Guia de Uso

## Visão Geral

O hook [`useModelCapabilities`](../src/hooks/useModelCapabilities.ts:1) foi implementado na Fase 3 do redesign do painel de controle. Ele fornece uma interface simples para buscar e cachear capabilities de modelos de IA, com suporte a loading states, error handling e cache automático via React Query.

## Arquivos Criados

### Tipos
- [`frontend/src/types/capabilities.ts`](../src/types/capabilities.ts:1) - Definições TypeScript

### Serviços
- [`frontend/src/services/api/modelsApi.ts`](../src/services/api/modelsApi.ts:1) - Cliente API

### Hooks
- [`frontend/src/hooks/useModelCapabilities.ts`](../src/hooks/useModelCapabilities.ts:1) - Hook principal
- [`frontend/src/hooks/usePrefetchCapabilities.ts`](../src/hooks/usePrefetchCapabilities.ts:1) - Prefetch hook

### Testes
- [`frontend/src/hooks/__tests__/useModelCapabilities.test.ts`](../src/hooks/__tests__/useModelCapabilities.test.ts:1) - Testes unitários (11 testes, 100% passando)

### Configuração
- [`frontend/src/App.tsx`](../src/App.tsx:1) - QueryClient configurado
- [`frontend/vitest.config.ts`](../vitest.config.ts:1) - Configuração de testes

## Exemplo de Uso Básico

```typescript
import { useModelCapabilities } from '@/hooks/useModelCapabilities';

function ModelTab() {
  const { capabilities, isLoading, error } = useModelCapabilities(
    chatConfig.provider,  // ex: 'anthropic'
    chatConfig.model      // ex: 'claude-3-5-sonnet-20241022'
  );

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <Box>
      {/* Desabilitar controle se não suportado */}
      <Slider
        label="Top-K"
        disabled={!capabilities?.topK.enabled}
        min={capabilities?.topK.min}
        max={capabilities?.topK.max}
        value={chatConfig.topK}
        onChange={handleTopKChange}
      />

      {/* Mostrar range correto de temperatura */}
      <Slider
        label="Temperature"
        disabled={!capabilities?.temperature.enabled}
        min={capabilities?.temperature.min}
        max={capabilities?.temperature.max}
        value={chatConfig.temperature}
        onChange={handleTemperatureChange}
      />

      {/* Mostrar badge de features */}
      {capabilities?.vision.enabled && (
        <Chip label="Vision" color="primary" />
      )}
      {capabilities?.functionCalling.enabled && (
        <Chip label="Function Calling" color="secondary" />
      )}
    </Box>
  );
}
```

## Estrutura de Dados Retornada

```typescript
interface UseModelCapabilitiesResult {
  capabilities: ModelCapabilities | null;
  isLoading: boolean;
  error: CapabilitiesError | null;
  refetch: () => void;
  isFetching: boolean;
  isEnabled: boolean;
}

interface ModelCapabilities {
  temperature: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };
  topK: {
    enabled: boolean;
    min?: number;
    max?: number;
    default?: number;
  };
  topP: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };
  maxTokens: {
    enabled: boolean;
    min: number;
    max: number;
    default: number;
  };
  stopSequences: {
    enabled: boolean;
    max?: number;
  };
  streaming: {
    enabled: boolean;
  };
  vision: {
    enabled: boolean;
  };
  functionCalling: {
    enabled: boolean;
  };
  systemPrompt: {
    enabled: boolean;
  };
  maxContextWindow: number;
  maxOutputTokens: number;
  requiresInferenceProfile: boolean;
}
```

## Como o Cache Funciona

### Configuração do Cache

```typescript
// No useModelCapabilities
staleTime: Infinity,              // Capabilities não mudam, cache permanente
gcTime: 1000 * 60 * 60 * 24,     // 24 horas
retry: 2,                         // 2 tentativas em caso de erro
refetchOnWindowFocus: false,      // Não refetch ao focar janela
refetchOnMount: false,            // Não refetch ao montar (usa cache)
```

### Prefetch Automático

O hook [`usePrefetchCapabilities`](../src/hooks/usePrefetchCapabilities.ts:1) é executado automaticamente ao iniciar o app (em [`App.tsx`](../src/App.tsx:147)), carregando capabilities de todos os modelos em background:

```typescript
// No App.tsx
usePrefetchCapabilities({
  enabled: true,
  onSuccess: (count) => {
    console.log(`✅ [Capabilities] Prefetched ${count} models`);
  },
  onError: (error) => {
    console.error('❌ [Capabilities] Prefetch failed:', error);
  },
});
```

**Resultado:** Ao trocar de modelo, o usuário não precisa esperar - as capabilities já estão em cache.

### Query Keys

```typescript
// Cache por modelo
['modelCapabilities', 'anthropic:claude-3-5-sonnet-20241022']
['modelCapabilities', 'amazon:nova-pro-v1:0']

// Cache de todos os modelos
['allCapabilities']
```

## Exemplos Avançados

### 1. Verificar Suporte a Feature Específica

```typescript
import { useModelSupportsCapability } from '@/hooks/useModelCapabilities';

function AdvancedSettings() {
  const supportsTopK = useModelSupportsCapability(
    provider,
    modelId,
    'topK'
  );

  return (
    <Box>
      {supportsTopK && (
        <TopKSlider />
      )}
    </Box>
  );
}
```

### 2. Refetch Manual

```typescript
function ModelSelector() {
  const { capabilities, refetch } = useModelCapabilities(provider, modelId);

  const handleRefresh = () => {
    refetch(); // Forçar atualização
  };

  return (
    <Box>
      <Button onClick={handleRefresh}>
        Refresh Capabilities
      </Button>
    </Box>
  );
}
```

### 3. Invalidar Cache Globalmente

```typescript
import { useInvalidateCapabilities } from '@/hooks/usePrefetchCapabilities';

function AdminPanel() {
  const invalidateCapabilities = useInvalidateCapabilities();

  const handleModelUpdate = async () => {
    await updateModelInBackend();
    await invalidateCapabilities(); // Forçar refetch de todos
  };

  return <Button onClick={handleModelUpdate}>Update Model</Button>;
}
```

### 4. Mostrar Informações de Contexto

```typescript
function ModelInfo() {
  const { capabilities } = useModelCapabilities(provider, modelId);

  return (
    <Box>
      <Typography>
        Max Context: {capabilities?.maxContextWindow.toLocaleString()} tokens
      </Typography>
      <Typography>
        Max Output: {capabilities?.maxOutputTokens.toLocaleString()} tokens
      </Typography>
    </Box>
  );
}
```

## Tratamento de Erros

O hook trata gracefully os seguintes erros:

### 404 - Modelo Não Encontrado
```typescript
{
  message: 'Model not found: anthropic:invalid-model',
  status: 404,
  code: 'MODEL_NOT_FOUND'
}
```

### 500 - Erro do Servidor
```typescript
{
  message: 'Internal server error',
  status: 500,
  code: 'SERVER_ERROR'
}
```

### Network Error
```typescript
{
  message: 'Network error',
  code: 'NETWORK_ERROR'
}
```

### Timeout
```typescript
{
  message: 'Request timeout',
  code: 'TIMEOUT'
}
```

## Testes

Execute os testes com:

```bash
cd frontend
npm test
```

### Cobertura de Testes

✅ 11 testes implementados e passando:
- Retorna null quando provider é null
- Retorna null quando modelId é null
- Retorna null quando ambos são null
- Faz fetch quando parâmetros válidos
- Retorna capabilities do cache
- Trata erro 404 gracefully
- Trata erro 500 gracefully
- Trata erro de network gracefully
- Loading state funciona corretamente
- Refetch funciona
- Constrói fullModelId corretamente

## Próximos Passos (Fase 4)

1. **Integrar no ModelTab.tsx**
   - Substituir lógica hardcoded por `useModelCapabilities`
   - Desabilitar controles não suportados
   - Ajustar ranges dinamicamente

2. **Atualizar ContextConfigTab.tsx**
   - Usar `maxContextWindow` para validação
   - Mostrar limites corretos

3. **Criar Componente de Badge**
   - Mostrar features suportadas (Vision, Function Calling, etc.)

4. **Adicionar Tooltips**
   - Explicar por que controles estão desabilitados
   - Mostrar limites do modelo

5. **Validação de Formulário**
   - Validar valores contra capabilities
   - Prevenir envio de parâmetros não suportados

## Referências

- **Backend Endpoint:** [`/api/models/:modelId/capabilities`](../../backend/src/routes/modelsRoutes.ts:1)
- **Tipos Backend:** [`backend/src/types/capabilities.ts`](../../backend/src/types/capabilities.ts:1)
- **Plano Completo:** [`plans/CHAT-PANEL-AUDIT-PART2.md`](../../plans/CHAT-PANEL-AUDIT-PART2.md:1)
- **Relatório Fase 1:** [`docs/PHASE1-AUDIT-REPORT.md`](../../docs/PHASE1-AUDIT-REPORT.md:1)
