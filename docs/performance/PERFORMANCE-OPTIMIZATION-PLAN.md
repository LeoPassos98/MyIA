# Plano de Otimização de Performance - MyIA Frontend

## Resumo Executivo

### Problemas Identificados no Trace

Baseado na análise do trace de performance (`Trace-20260120T112059.json`) e na estrutura do código frontend, foram identificados os seguintes problemas críticos:

1. **Event Handlers Não Otimizados**: Ausência de throttling/debouncing em eventos de alta frequência
2. **Layout Thrashing**: Múltiplas leituras/escritas DOM não agrupadas (batch)
3. **Memory Leaks Potenciais**: Event listeners e timers não limpos adequadamente
4. **Rendering Excessivo**: Re-renderizações desnecessárias de componentes
5. **Bundle Size**: Falta de code splitting e lazy loading estratégico

### Impacto Esperado das Otimizações

- **Redução de 60-80%** no tempo de resposta de eventos de alta frequência
- **Melhoria de 40-50%** no First Input Delay (FID)
- **Redução de 30-40%** no uso de memória durante sessões longas
- **Melhoria de 25-35%** no Largest Contentful Paint (LCP)
- **Redução de 50-60%** no tamanho inicial do bundle

---

## Fase 1: Event Handlers (Prioridade CRÍTICA)

### Problemas Identificados

O trace mostra múltiplas chamadas `RunTask` em sequência rápida, indicando event handlers disparando sem controle de taxa. Os componentes críticos são:

#### 1.1 ChatInput Component
**Arquivo**: [`frontend/src/features/chat/components/input/ChatInput.tsx`](frontend/src/features/chat/components/input/ChatInput.tsx:40)

**Problema**: 
- ResizeObserver callback (linha 54-56) dispara sem throttling
- Pode causar centenas de chamadas por segundo durante redimensionamento

**Solução**:
```typescript
// Adicionar throttle ao ResizeObserver callback
const throttledUpdateHeight = throttle(() => {
  const height = container.offsetHeight;
  onHeightChange(height);
}, 100); // Limita a 10 chamadas/segundo
```

#### 1.2 InputTextField Component
**Arquivo**: [`frontend/src/features/chat/components/input/InputTextField.tsx`](frontend/src/features/chat/components/input/InputTextField.tsx)

**Problema**:
- Evento `onChange` dispara a cada tecla pressionada
- Causa re-renderizações excessivas do componente pai

**Solução**:
```typescript
// Adicionar debounce ao onChange para operações pesadas
const debouncedOnChange = debounce((value: string) => {
  // Operações pesadas (validação, API calls, etc)
}, 300);
```

#### 1.3 MessageList Component
**Arquivo**: [`frontend/src/features/chat/components/message/MessageList.tsx`](frontend/src/features/chat/components/message/MessageList.tsx:33)

**Problema**:
- `scrollIntoView` (linha 35) dispara sem controle quando mensagens são adicionadas
- Pode causar layout thrashing em conversas longas

**Solução**:
```typescript
// Usar requestAnimationFrame para agrupar operações de scroll
const smoothScrollToBottom = () => {
  requestAnimationFrame(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });
};
```

#### 1.4 HistorySidebar Component
**Arquivo**: [`frontend/src/features/chat/components/drawer/HistorySidebar.tsx`](frontend/src/features/chat/components/drawer/HistorySidebar.tsx:42)

**Problema**:
- `fetchChats` (linha 43-59) não tem controle de taxa
- Pode ser chamado múltiplas vezes em navegações rápidas

**Solução**:
```typescript
// Adicionar debounce ao fetchChats
const debouncedFetchChats = debounce(async () => {
  // ... código existente
}, 500);
```

### Eventos Específicos a Otimizar

| Evento | Componente | Técnica | Intervalo Recomendado |
|--------|-----------|---------|----------------------|
| `resize` | ChatInput | throttle | 100ms |
| `input` | InputTextField | debounce | 300ms (para validações) |
| `scroll` | MessageList | throttle | 150ms |
| `mousemove` | MessageActions | throttle | 100ms |
| `keydown` | useChatInput | debounce | 50ms (para histórico) |

### Estratégia de Implementação

1. **Criar Utility Functions** (Novo arquivo: `frontend/src/utils/performance.ts`)
```typescript
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

2. **Aplicar nos Componentes** (ordem de prioridade):
   - ChatInput (ResizeObserver)
   - MessageList (scroll)
   - InputTextField (onChange para validações)
   - HistorySidebar (fetchChats)
   - MessageActions (hover effects)

3. **Testes de Validação**:
   - Medir FPS durante digitação rápida
   - Verificar tempo de resposta em scroll
   - Monitorar uso de CPU durante redimensionamento

---

## Fase 2: Layout Optimization (Prioridade ALTA)

### Componentes com Potencial Layout Thrashing

#### 2.1 ChatInput - Height Calculation
**Arquivo**: [`frontend/src/features/chat/components/input/ChatInput.tsx`](frontend/src/features/chat/components/input/ChatInput.tsx:45)

**Problema**:
- Leitura de `offsetHeight` (linha 46) seguida de callback que pode causar escrita
- Padrão read-write-read-write causa reflow múltiplo

**Solução**:
```typescript
// Agrupar leituras DOM
const batchDOMReads = () => {
  const reads = {
    containerHeight: container.offsetHeight,
    scrollHeight: container.scrollHeight,
    // ... outras leituras
  };
  
  // Depois fazer todas as escritas
  requestAnimationFrame(() => {
    onHeightChange(reads.containerHeight);
    // ... outras escritas
  });
};
```

#### 2.2 MessageList - Dynamic Padding
**Arquivo**: [`frontend/src/features/chat/components/message/MessageList.tsx`](frontend/src/features/chat/components/message/MessageList.tsx:81)

**Problema**:
- `pb: ${inputHeight}px` (linha 81) causa recalculo de layout a cada mudança
- Pode ser optimizado com CSS variables

**Solução**:
```typescript
// Usar CSS custom properties para evitar re-render
useEffect(() => {
  document.documentElement.style.setProperty(
    '--input-height',
    `${inputHeight}px`
  );
}, [inputHeight]);

// No CSS:
// padding-bottom: var(--input-height);
```

### Técnicas de Batch DOM Reads/Writes

**Criar Hook Customizado**: `frontend/src/hooks/useBatchedDOMOperations.ts`

```typescript
export function useBatchedDOMOperations() {
  const readQueue = useRef<Array<() => any>>([]);
  const writeQueue = useRef<Array<() => void>>([]);
  const rafId = useRef<number | null>(null);

  const scheduleRead = useCallback((readFn: () => any) => {
    readQueue.current.push(readFn);
    scheduleFlush();
  }, []);

  const scheduleWrite = useCallback((writeFn: () => void) => {
    writeQueue.current.push(writeFn);
    scheduleFlush();
  }, []);

  const scheduleFlush = () => {
    if (rafId.current) return;
    
    rafId.current = requestAnimationFrame(() => {
      // Fase 1: Todas as leituras
      const results = readQueue.current.map(fn => fn());
      readQueue.current = [];
      
      // Fase 2: Todas as escritas
      writeQueue.current.forEach(fn => fn());
      writeQueue.current = [];
      
      rafId.current = null;
    });
  };

  return { scheduleRead, scheduleWrite };
}
```

### Uso de requestAnimationFrame

**Aplicar em**:
1. **Scroll animations** (MessageList)
2. **Height updates** (ChatInput)
3. **Hover effects** (MessageActions)
4. **Theme transitions** (ThemeContext)

**Padrão**:
```typescript
const animateChange = (callback: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback); // Double RAF para garantir após paint
  });
};
```

---

## Fase 3: Memory Optimization (Prioridade ALTA)

### Identificar Possíveis Memory Leaks

#### 3.1 useChatLogic Hook
**Arquivo**: [`frontend/src/features/chat/hooks/useChatLogic.ts`](frontend/src/features/chat/hooks/useChatLogic.ts:24)

**Problemas**:
- `flushTimeoutRef` (linha 24) pode não ser limpo em unmount
- `abortControllerRef` (linha 26) pode manter referências após abort
- `chunkBufferRef` (linha 23) acumula strings sem limite

**Solução**:
```typescript
useEffect(() => {
  return () => {
    // Cleanup ao desmontar
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    chunkBufferRef.current = ''; // Limpar buffer
  };
}, []);
```

#### 3.2 ResizeObserver Cleanup
**Arquivo**: [`frontend/src/features/chat/components/input/ChatInput.tsx`](frontend/src/features/chat/components/input/ChatInput.tsx:58)

**Problema**:
- ResizeObserver.disconnect() (linha 58) está correto, mas pode ser melhorado
- Múltiplos observers podem ser criados em re-renders

**Solução**:
```typescript
const observerRef = useRef<ResizeObserver | null>(null);

useEffect(() => {
  // Reusar observer existente
  if (!observerRef.current) {
    observerRef.current = new ResizeObserver(throttledUpdateHeight);
  }
  
  if (container) {
    observerRef.current.observe(container);
  }
  
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };
}, [container]);
```

#### 3.3 Event Listeners em HistorySidebar
**Arquivo**: [`frontend/src/features/chat/components/drawer/HistorySidebar.tsx`](frontend/src/features/chat/components/drawer/HistorySidebar.tsx:42)

**Problema**:
- `fetchChats` cria nova função a cada render
- Pode causar memory leak em navegações rápidas

**Solução**:
```typescript
const fetchChatsRef = useRef<() => Promise<void>>();

useEffect(() => {
  fetchChatsRef.current = async () => {
    // ... código existente
  };
}, []);

useEffect(() => {
  fetchChatsRef.current?.();
}, []);
```

### Object Pooling para Objetos Frequentes

**Criar Pool para Messages**: `frontend/src/utils/objectPool.ts`

```typescript
class MessagePool {
  private pool: Message[] = [];
  private maxSize = 100;

  acquire(): Message {
    return this.pool.pop() || this.createNew();
  }

  release(message: Message) {
    if (this.pool.length < this.maxSize) {
      // Limpar propriedades
      message.content = '';
      message.role = 'user';
      message.isPinned = false;
      this.pool.push(message);
    }
  }

  private createNew(): Message {
    return {
      id: '',
      role: 'user',
      content: '',
      createdAt: new Date().toISOString(),
    };
  }
}

export const messagePool = new MessagePool();
```

### Otimização de Closures e Event Listeners

**Padrão a Aplicar**:
```typescript
// ❌ EVITAR: Cria nova função a cada render
<Button onClick={() => handleClick(id)} />

// ✅ PREFERIR: Usar useCallback com deps
const handleClickMemo = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);

<Button onClick={handleClickMemo} />

// ✅ OU: Event delegation
<div onClick={(e) => {
  const target = e.target as HTMLElement;
  const id = target.dataset.id;
  if (id) handleClick(id);
}}>
  {items.map(item => <Button data-id={item.id} />)}
</div>
```

**Aplicar em**:
1. MessageActions (botões de ação)
2. HistorySidebar (lista de chats)
3. ControlPanel (tabs e switches)

---

## Fase 4: Rendering Optimization (Prioridade MÉDIA)

### CSS Transforms vs Layout Properties

**Otimizações a Aplicar**:

#### 4.1 Animações de Transição
**Arquivos**: Todos os componentes com `transition` no sx

**Mudança**:
```typescript
// ❌ EVITAR: Causa reflow
sx={{
  transition: 'all 0.3s ease',
  left: isOpen ? 0 : -240,
}}

// ✅ PREFERIR: Usa compositor
sx={{
  transition: 'transform 0.3s ease',
  transform: isOpen ? 'translateX(0)' : 'translateX(-240px)',
}}
```

**Aplicar em**:
- ChatInput (linha 90)
- HistorySidebar (transições de hover)
- MessageActions (animações de botão)

#### 4.2 Backdrop Blur Optimization
**Arquivo**: [`frontend/src/features/chat/components/input/ChatInput.tsx`](frontend/src/features/chat/components/input/ChatInput.tsx:87)

**Problema**:
- `backdropFilter: 'blur(2px)'` (linha 87) é custoso
- Pode ser substituído por imagem pré-processada em dispositivos lentos

**Solução**:
```typescript
// Detectar performance do dispositivo
const useReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowEnd = navigator.hardwareConcurrency <= 4;

sx={{
  backdropFilter: (isLowEnd || useReducedMotion) ? 'none' : 'blur(2px)',
  bgcolor: (isLowEnd || useReducedMotion) 
    ? theme.palette.background.default 
    : alpha(theme.palette.background.default, 0.85),
}}
```

### Virtualização de Listas

#### 4.3 MessageList Virtualization
**Arquivo**: [`frontend/src/features/chat/components/message/MessageList.tsx`](frontend/src/features/chat/components/message/MessageList.tsx:89)

**Problema**:
- Renderiza todas as mensagens (linha 89-96)
- Em conversas longas (>100 mensagens), causa lag

**Solução**:
```typescript
import { FixedSizeList } from 'react-window';

// Substituir map por lista virtualizada
<FixedSizeList
  height={containerHeight}
  itemCount={messages.length}
  itemSize={estimatedMessageHeight}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage
        key={messages[index].id}
        message={messages[index]}
        isDevMode={isDevMode}
        onTogglePin={onTogglePin}
      />
    </div>
  )}
</FixedSizeList>
```

**Dependência**: `npm install react-window`

#### 4.4 HistorySidebar Virtualization
**Arquivo**: [`frontend/src/features/chat/components/drawer/HistorySidebar.tsx`](frontend/src/features/chat/components/drawer/HistorySidebar.tsx:164)

**Problema**:
- Renderiza todos os chats agrupados (linha 164-226)
- Pode ter centenas de itens

**Solução**: Aplicar mesma técnica com `react-window`

### Code Splitting e Lazy Loading

**Estratégia**:

#### 4.5 Route-based Code Splitting
**Arquivo**: `frontend/src/App.tsx`

```typescript
// Lazy load de rotas
const ChatPage = lazy(() => import('./features/chat'));
const SettingsPage = lazy(() => import('./features/settings'));
const AuditPage = lazy(() => import('./features/auditPage'));

// Wrapper com Suspense
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/chat/:id?" element={<ChatPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/audit" element={<AuditPage />} />
  </Routes>
</Suspense>
```

#### 4.6 Component-based Code Splitting
**Componentes Pesados a Lazy Load**:

1. **DevConsole** (usado apenas em dev mode)
```typescript
const DevConsole = lazy(() => import('./components/DevConsole'));

{isDevMode && (
  <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
    <DevConsole logs={debugLogs} />
  </Suspense>
)}
```

2. **MarkdownRenderer** (usado apenas em mensagens)
```typescript
const MarkdownRenderer = lazy(() => import('./components/MarkdownRenderer'));
```

3. **AuditViewer** (modal pesado)
```typescript
const AuditViewerModal = lazy(() => import('./features/auditViewer/AuditViewerModal'));
```

#### 4.7 Dynamic Imports para Providers
**Arquivo**: `frontend/src/services/aiProvidersService.ts`

```typescript
// Carregar configurações de provider sob demanda
const loadProviderConfig = async (provider: string) => {
  switch (provider) {
    case 'aws':
      return import('./providers/awsConfig');
    case 'azure':
      return import('./providers/azureConfig');
    // ...
  }
};
```

---

## Fase 5: Monitoring (Prioridade MÉDIA)

### Performance API Integration

**Criar Serviço de Monitoramento**: `frontend/src/services/performanceMonitor.ts`

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  // Medir tempo de operação
  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    
    if (duration > 50) {
      console.warn(`⚠️ Operação lenta: ${name} levou ${duration.toFixed(2)}ms`);
    }
  }

  // Medir operação assíncrona
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    return result;
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // Obter estatísticas
  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // Exportar métricas
  exportMetrics() {
    const report: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      report[name] = this.getStats(name);
    });
    return report;
  }
}

export const perfMonitor = new PerformanceMonitor();
```

**Integrar nos Componentes Críticos**:

```typescript
// Em useChatLogic.ts
const handleSendMessage = async () => {
  await perfMonitor.measureAsync('chat.sendMessage', async () => {
    // ... código existente
  });
};

// Em MessageList.tsx
useEffect(() => {
  perfMonitor.measure('messageList.render', () => {
    // Medir tempo de renderização
  });
}, [messages]);
```

### Long Task Detection

**Implementar Observer**: `frontend/src/utils/longTaskObserver.ts`

```typescript
export function observeLongTasks(threshold = 50) {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > threshold) {
        console.warn('🐌 Long Task detectada:', {
          duration: entry.duration.toFixed(2),
          startTime: entry.startTime.toFixed(2),
          name: entry.name,
        });

        // Enviar para analytics (opcional)
        if (window.gtag) {
          window.gtag('event', 'long_task', {
            duration: Math.round(entry.duration),
            name: entry.name,
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['longtask'] });
  
  return () => observer.disconnect();
}
```

**Ativar no App**:
```typescript
// Em App.tsx
useEffect(() => {
  const cleanup = observeLongTasks(50); // Alerta se > 50ms
  return cleanup;
}, []);
```

### Core Web Vitals Tracking

**Implementar Tracking**: `frontend/src/utils/webVitals.ts`

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS((metric) => {
    console.log('CLS:', metric.value);
    sendToAnalytics('CLS', metric.value);
  });

  onFID((metric) => {
    console.log('FID:', metric.value);
    sendToAnalytics('FID', metric.value);
  });

  onLCP((metric) => {
    console.log('LCP:', metric.value);
    sendToAnalytics('LCP', metric.value);
  });

  onFCP((metric) => {
    console.log('FCP:', metric.value);
    sendToAnalytics('FCP', metric.value);
  });

  onTTFB((metric) => {
    console.log('TTFB:', metric.value);
    sendToAnalytics('TTFB', metric.value);
  });
}

function sendToAnalytics(metric: string, value: number) {
  // Enviar para Google Analytics, Sentry, etc
  if (window.gtag) {
    window.gtag('event', metric, {
      value: Math.round(value),
      metric_id: metric,
      metric_value: value,
      metric_delta: value,
    });
  }
}
```

**Ativar no index.tsx**:
```typescript
// Em index.tsx
import { reportWebVitals } from './utils/webVitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
```

**Dependência**: `npm install web-vitals`

---

## Fase 6: Checklist de Validação

### Testes Funcionais a Executar

#### 6.1 Testes de Event Handlers
- [ ] Digitar rapidamente no input (>100 caracteres/segundo)
- [ ] Redimensionar janela rapidamente (10x em 5 segundos)
- [ ] Scroll rápido em lista com 100+ mensagens
- [ ] Hover sobre múltiplos botões em sequência rápida
- [ ] Navegar entre chats rapidamente (10 cliques em 5 segundos)

**Critério de Sucesso**: Nenhum lag perceptível, FPS mantém >55

#### 6.2 Testes de Layout
- [ ] Abrir DevTools e verificar "Layout Shift" no Performance tab
- [ ] Medir tempo de reflow durante redimensionamento
- [ ] Verificar "Recalculate Style" no trace

**Critério de Sucesso**: 
- CLS < 0.1
- Reflows < 5 por segundo durante interação

#### 6.3 Testes de Memória
- [ ] Sessão de 30 minutos com 50+ mensagens
- [ ] Navegar entre 20 chats diferentes
- [ ] Abrir/fechar sidebar 50 vezes
- [ ] Tirar heap snapshot antes e depois

**Critério de Sucesso**:
- Crescimento de memória < 50MB em 30min
- Nenhum "Detached DOM tree" no heap snapshot

#### 6.4 Testes de Rendering
- [ ] Medir tempo de renderização de lista com 100 mensagens
- [ ] Verificar re-renders desnecessários com React DevTools Profiler
- [ ] Testar scroll performance em lista virtualizada

**Critério de Sucesso**:
- Tempo de render inicial < 200ms
- Re-renders < 3 por interação
- Scroll a 60 FPS constante

#### 6.5 Testes de Bundle
- [ ] Analisar bundle com `npm run build && npx vite-bundle-visualizer`
- [ ] Verificar code splitting no Network tab
- [ ] Medir tempo de carregamento inicial

**Critério de Sucesso**:
- Bundle inicial < 300KB (gzipped)
- Lazy chunks carregam sob demanda
- TTI (Time to Interactive) < 3s

### Métricas de Performance a Monitorar

#### Métricas Core Web Vitals

| Métrica | Valor Atual | Meta | Crítico |
|---------|-------------|------|---------|
| **LCP** (Largest Contentful Paint) | ? | < 2.5s | < 4s |
| **FID** (First Input Delay) | ? | < 100ms | < 300ms |
| **CLS** (Cumulative Layout Shift) | ? | < 0.1 | < 0.25 |
| **FCP** (First Contentful Paint) | ? | < 1.8s | < 3s |
| **TTFB** (Time to First Byte) | ? | < 800ms | < 1.8s |

#### Métricas Customizadas

| Métrica | Descrição | Meta |
|---------|-----------|------|
| **Message Render Time** | Tempo para renderizar nova mensagem | < 50ms |
| **Input Response Time** | Delay entre tecla e atualização visual | < 16ms (1 frame) |
| **Scroll FPS** | Frames por segundo durante scroll | 60 FPS |
| **Memory Growth Rate** | MB/hora durante uso normal | < 100 MB/h |
| **Bundle Size** | Tamanho do bundle inicial (gzipped) | < 300 KB |
| **Lazy Chunk Size** | Tamanho médio de chunks lazy-loaded | < 50 KB |

### Critérios de Sucesso

#### Fase 1 (Event Handlers)
- ✅ Todos os event handlers de alta frequência com throttle/debounce
- ✅ FID reduzido em pelo menos 40%
- ✅ Nenhum "Long Task" > 50ms durante digitação

#### Fase 2 (Layout)
- ✅ CLS < 0.1 em todas as páginas
- ✅ Reflows agrupados com requestAnimationFrame
- ✅ Nenhum "Forced Reflow" no trace

#### Fase 3 (Memory)
- ✅ Todos os timers e listeners limpos no unmount
- ✅ Crescimento de memória < 50MB em 30min
- ✅ Nenhum "Detached DOM tree" após navegação

#### Fase 4 (Rendering)
- ✅ Listas com >50 itens virtualizadas
- ✅ Code splitting implementado em todas as rotas
- ✅ Bundle inicial < 300KB (gzipped)
- ✅ Lazy loading de componentes pesados

#### Fase 5 (Monitoring)
- ✅ Performance API integrada
- ✅ Long Task Observer ativo
- ✅ Core Web Vitals sendo rastreados
- ✅ Dashboard de métricas disponível

---

## Cronograma de Implementação

### Sprint 1 (Semana 1)
- **Fase 1**: Event Handlers (3 dias)
  - Dia 1: Criar utils (throttle/debounce) e aplicar em ChatInput
  - Dia 2: Aplicar em MessageList e InputTextField
  - Dia 3: Aplicar em HistorySidebar e MessageActions + testes

### Sprint 2 (Semana 2)
- **Fase 2**: Layout Optimization (3 dias)
  - Dia 1: Criar hook useBatchedDOMOperations
  - Dia 2: Refatorar ChatInput e MessageList
  - Dia 3: Aplicar requestAnimationFrame + testes

### Sprint 3 (Semana 3)
- **Fase 3**: Memory Optimization (3 dias)
  - Dia 1: Adicionar cleanup em useChatLogic
  - Dia 2: Otimizar ResizeObserver e event listeners
  - Dia 3: Implementar object pooling + testes de memória

### Sprint 4 (Semana 4)
- **Fase 4**: Rendering Optimization (4 dias)
  - Dia 1: Substituir animações por transforms
  - Dia 2: Implementar virtualização em MessageList
  - Dia 3: Implementar code splitting (rotas)
  - Dia 4: Lazy loading de componentes + testes

### Sprint 5 (Semana 5)
- **Fase 5**: Monitoring (2 dias)
  - Dia 1: Implementar Performance Monitor e Long Task Observer
  - Dia 2: Integrar Web Vitals + dashboard de métricas

### Sprint 6 (Semana 6)
- **Validação Final** (5 dias)
  - Dia 1-2: Executar todos os testes funcionais
  - Dia 3-4: Ajustes e correções
  - Dia 5: Documentação e apresentação de resultados

---

## Ferramentas e Dependências

### Novas Dependências NPM

```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "web-vitals": "^3.5.0"
  },
  "devDependencies": {
    "vite-bundle-visualizer": "^1.0.0",
    "@types/react-window": "^1.8.8"
  }
}
```

### Ferramentas de Análise

1. **Chrome DevTools Performance Tab**
   - Gravar trace antes e depois de cada fase
   - Comparar métricas de FPS, Layout, Paint

2. **React DevTools Profiler**
   - Identificar re-renders desnecessários
   - Medir tempo de renderização de componentes

3. **Lighthouse**
   - Executar audit antes e depois
   - Focar em Performance score

4. **Bundle Analyzer**
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```

5. **Memory Profiler**
   - Heap snapshots antes/depois de sessões longas
   - Allocation timeline durante uso intenso

---

## Arquivos a Criar

### Novos Arquivos

1. **`frontend/src/utils/performance.ts`**
   - Funções throttle e debounce
   - Helpers de performance

2. **`frontend/src/hooks/useBatchedDOMOperations.ts`**
   - Hook para agrupar operações DOM

3. **`frontend/src/utils/objectPool.ts`**
   - Pool de objetos reutilizáveis

4. **`frontend/src/services/performanceMonitor.ts`**
   - Serviço de monitoramento de performance

5. **`frontend/src/utils/longTaskObserver.ts`**
   - Observer de long tasks

6. **`frontend/src/utils/webVitals.ts`**
   - Tracking de Core Web Vitals

7. **`frontend/src/hooks/useVirtualList.ts`**
   - Hook customizado para listas virtualizadas

### Arquivos a Modificar

#### Prioridade CRÍTICA
1. [`frontend/src/features/chat/components/input/ChatInput.tsx`](frontend/src/features/chat/components/input/ChatInput.tsx)
2. [`frontend/src/features/chat/components/message/MessageList.tsx`](frontend/src/features/chat/components/message/MessageList.tsx)
3. [`frontend/src/features/chat/hooks/useChatLogic.ts`](frontend/src/features/chat/hooks/useChatLogic.ts)

#### Prioridade ALTA
4. [`frontend/src/features/chat/components/drawer/HistorySidebar.tsx`](frontend/src/features/chat/components/drawer/HistorySidebar.tsx)
5. [`frontend/src/features/chat/components/input/InputTextField.tsx`](frontend/src/features/chat/components/input/InputTextField.tsx)
6. [`frontend/src/features/chat/components/message/MessageActions.tsx`](frontend/src/features/chat/components/message/MessageActions.tsx)

#### Prioridade MÉDIA
7. `frontend/src/App.tsx` (code splitting)
8. `frontend/src/index.tsx` (web vitals)
9. [`frontend/src/features/chat/components/DevConsole.tsx`](frontend/src/features/chat/components/DevConsole.tsx) (lazy loading)

---

## Riscos e Mitigações

### Riscos Identificados

#### 1. Quebra de Funcionalidade
**Risco**: Throttle/debounce pode causar perda de eventos
**Mitigação**: 
- Testar extensivamente cada componente modificado
- Manter versão original comentada durante transição
- Implementar feature flags para rollback rápido

#### 2. Complexidade de Virtualização
**Risco**: Listas virtualizadas podem quebrar scroll automático
**Mitigação**:
- Implementar em branch separada
- Testar com diferentes tamanhos de lista
- Manter fallback para listas pequenas (<50 itens)

#### 3. Overhead de Monitoring
**Risco**: Sistema de monitoramento pode adicionar overhead
**Mitigação**:
- Usar sampling (monitorar apenas 10% das operações)
- Desabilitar em produção por padrão
- Ativar apenas com flag de debug

#### 4. Compatibilidade de Navegadores
**Risco**: APIs modernas podem não funcionar em navegadores antigos
**Mitigação**:
- Verificar suporte com caniuse.com
- Adicionar polyfills quando necessário
- Implementar feature detection

### Plano de Rollback

Se alguma fase causar problemas críticos:

1. **Reverter commit** da fase problemática
2. **Desabilitar feature flag** (se implementado)
3. **Analisar logs** de erro e performance
4. **Ajustar implementação** em branch separada
5. **Re-testar** antes de novo deploy

---

## Métricas de Sucesso do Projeto

### Objetivos Quantitativos

| Métrica | Baseline | Meta | Stretch Goal |
|---------|----------|------|--------------|
| **Lighthouse Performance Score** | ? | 85+ | 95+ |
| **LCP** | ? | < 2.5s | < 1.5s |
| **FID** | ? | < 100ms | < 50ms |
| **CLS** | ? | < 0.1 | < 0.05 |
| **Bundle Size (gzipped)** | ? | < 300KB | < 200KB |
| **Memory Usage (30min)** | ? | < 150MB | < 100MB |
| **FPS durante scroll** | ? | 55+ | 60 |

### Objetivos Qualitativos

- ✅ Interface responsiva mesmo em dispositivos low-end
- ✅ Nenhum lag perceptível durante digitação
- ✅ Scroll suave em conversas longas (100+ mensagens)
- ✅ Carregamento inicial rápido (< 3s em 3G)
- ✅ Experiência consistente em diferentes navegadores

---

## Documentação Adicional

### Para Desenvolvedores

Após implementação, criar:

1. **`docs/PERFORMANCE-BEST-PRACTICES.md`**
   - Guia de boas práticas de performance
   - Padrões a seguir em novos componentes
   - Checklist de review de performance

2. **`docs/PERFORMANCE-TESTING.md`**
   - Como executar testes de performance
   - Como interpretar métricas
   - Como usar ferramentas de profiling

3. **`docs/PERFORMANCE-MONITORING.md`**
   - Como usar o Performance Monitor
   - Como interpretar dashboards
   - Como debugar problemas de performance

### Para Product Owners

1. **Relatório de Impacto**
   - Comparação antes/depois de métricas
   - Impacto na experiência do usuário
   - ROI das otimizações

2. **Roadmap de Performance**
   - Próximas otimizações planejadas
   - Priorização baseada em impacto
   - Recursos necessários

---

## Conclusão

Este plano de otimização aborda de forma sistemática os principais gargalos de performance identificados no trace e na análise do código. A implementação em fases permite:

1. **Priorização** de problemas críticos primeiro
2. **Validação incremental** de cada melhoria
3. **Rollback fácil** em caso de problemas
4. **Monitoramento contínuo** de métricas

**Próximos Passos**:
1. ✅ Revisar e aprovar este plano
2. ⏳ Criar issues/tasks no sistema de gerenciamento
3. ⏳ Alocar recursos para Sprint 1
4. ⏳ Iniciar implementação da Fase 1

**Estimativa Total**: 6 semanas (30 dias úteis) com 1 desenvolvedor full-time

---

## Apêndices

### Apêndice A: Análise do Trace

O trace `Trace-20260120T112059.json` mostra:

- **779ms** de execução de script (linha 123)
- **775ms** de EvaluateScript (linha 124)
- Múltiplas operações V8 GC (Garbage Collection)
- RunTask em sequência rápida sem throttling
- Ausência de Long Task warnings (mas presença de tasks >50ms)

### Apêndice B: Componentes Críticos Identificados

Baseado nas tabs abertas no VSCode:

1. **Chat Components** (maior uso):
   - DevConsole.tsx
   - ControlPanel/index.tsx
   - MessageActions.tsx
   - HistorySidebar.tsx

2. **Settings Components** (uso médio):
   - ApiKeysTab.tsx
   - ModelsManagementTab.tsx
   - AWSProviderPanel.tsx
   - AzureProviderPanel.tsx

3. **Layout Components** (sempre ativos):
   - HeaderLeft.tsx
   - HeaderRight.tsx

### Apêndice C: Referências

- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React Window Documentation](https://react-window.vercel.app/)
- [Throttle vs Debounce](https://css-tricks.com/debouncing-throttling-explained-examples/)

---

**Documento criado em**: 2026-01-20  
**Versão**: 1.0  
**Autor**: Architect Mode  
**Status**: Aguardando Aprovação