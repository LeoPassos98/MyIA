# Memory Optimization Best Practices

## Guia de Boas Práticas para Otimização de Memória - MyIA Frontend

Este documento descreve as melhores práticas para evitar memory leaks e otimizar o uso de memória no frontend do MyIA.

---

## 📋 Índice

1. [Prevenção de Memory Leaks](#prevenção-de-memory-leaks)
2. [Object Pooling](#object-pooling)
3. [React.memo e Memoização](#reactmemo-e-memoização)
4. [Hooks de Memory Management](#hooks-de-memory-management)
5. [Checklist de Memory Optimization](#checklist-de-memory-optimization)
6. [Ferramentas de Debugging](#ferramentas-de-debugging)

---

## 1. Prevenção de Memory Leaks

### 1.1 Sempre Limpar Event Listeners

❌ **EVITAR:**
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Sem cleanup!
}, []);
```

✅ **CORRETO:**
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [handleResize]);
```

### 1.2 Limpar Timers e Intervals

❌ **EVITAR:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);
  // Timer não é limpo!
}, []);
```

✅ **CORRETO:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);
  
  return () => {
    clearTimeout(timer);
  };
}, []);
```

### 1.3 Desconectar Observers

❌ **EVITAR:**
```typescript
useEffect(() => {
  const observer = new ResizeObserver(callback);
  observer.observe(element);
  // Observer não é desconectado!
}, []);
```

✅ **CORRETO:**
```typescript
useEffect(() => {
  const observer = new ResizeObserver(callback);
  observer.observe(element);
  
  return () => {
    observer.disconnect();
  };
}, []);
```

### 1.4 Abortar Requisições Pendentes

❌ **EVITAR:**
```typescript
useEffect(() => {
  fetchData().then(setData);
  // Requisição continua mesmo após unmount!
}, []);
```

✅ **CORRETO:**
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal)
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });
  
  return () => {
    controller.abort();
  };
}, []);
```

### 1.5 Usar Hook de Cleanup

✅ **RECOMENDADO:**
```typescript
import { useMemoryLeakDetection } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const memoryTracker = useMemoryLeakDetection('MyComponent');
  
  useEffect(() => {
    const timer = setTimeout(...);
    memoryTracker.trackTimer(timer);
    
    const observer = new ResizeObserver(...);
    memoryTracker.trackObserver(observer);
    
    // Cleanup automático ao desmontar!
  }, [memoryTracker]);
}
```

---

## 2. Object Pooling

### 2.1 Quando Usar Object Pooling

Use object pooling para objetos que são:
- Criados e destruídos frequentemente (>100x por minuto)
- Relativamente grandes em memória
- Têm estrutura previsível

**Exemplos:**
- Mensagens de chat durante streaming
- Eventos de UI (scroll, resize, mousemove)
- Buffers temporários

### 2.2 Como Usar Object Pool

```typescript
import { messagePool } from '@/utils/objectPool';

// Adquirir objeto do pool
const message = messagePool.createMessage({
  id: 'msg-123',
  role: 'user',
  content: 'Hello',
  createdAt: new Date().toISOString(),
});

// Usar objeto...

// Devolver ao pool quando não precisar mais
messagePool.release(message);
```

### 2.3 Criar Pool Customizado

```typescript
import { ObjectPool } from '@/utils/objectPool';

interface MyObject {
  id: string;
  data: string;
}

const myPool = new ObjectPool<MyObject>(
  // Factory: cria novo objeto
  () => ({ id: '', data: '' }),
  // Reset: limpa objeto para reutilização
  (obj) => {
    obj.id = '';
    obj.data = '';
  },
  50 // Tamanho máximo do pool
);

// Usar pool
const obj = myPool.acquire();
obj.id = '123';
obj.data = 'test';

// Devolver ao pool
myPool.release(obj);
```

### 2.4 Monitorar Uso do Pool

```typescript
import { getPoolStats } from '@/utils/objectPool';

// Em dev mode, verificar estatísticas
if (process.env.NODE_ENV === 'development') {
  const stats = getPoolStats();
  console.log('Pool Stats:', stats);
  // {
  //   messages: { poolSize: 10, activeCount: 5, maxSize: 50, utilizationRate: 0.33 },
  //   events: { ... },
  //   stringBuffers: { ... }
  // }
}
```

---

## 3. React.memo e Memoização

### 3.1 Quando Usar React.memo

Use `React.memo` em componentes que:
- São renderizados frequentemente
- Recebem props que raramente mudam
- Têm renderização custosa (>16ms)

❌ **NÃO USE em:**
- Componentes que sempre mudam (ex: relógio)
- Componentes muito simples (custo de comparação > custo de render)

### 3.2 React.memo Básico

```typescript
import { memo } from 'react';

interface Props {
  message: Message;
  onTogglePin: (id: string) => void;
}

const ChatMessage = memo(({ message, onTogglePin }: Props) => {
  return (
    <div>
      {message.content}
      <button onClick={() => onTogglePin(message.id)}>Pin</button>
    </div>
  );
});

export default ChatMessage;
```

### 3.3 React.memo com Comparação Customizada

```typescript
const ChatMessage = memo(({ message, onTogglePin }: Props) => {
  // ... componente
}, (prevProps, nextProps) => {
  // Retorna true se props são iguais (não deve re-renderizar)
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isPinned === nextProps.message.isPinned &&
    prevProps.onTogglePin === nextProps.onTogglePin
  );
});
```

### 3.4 useMemo para Computações Pesadas

```typescript
import { useMemo } from 'react';

function MyComponent({ items }: Props) {
  // Só recalcula se items mudar
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.date - b.date);
  }, [items]);
  
  // Só recalcula se sortedItems mudar
  const groupedItems = useMemo(() => {
    return groupByDate(sortedItems);
  }, [sortedItems]);
  
  return <div>{/* render */}</div>;
}
```

### 3.5 useCallback para Funções Estáveis

```typescript
import { useCallback } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);
  
  // ❌ EVITAR: Nova função a cada render
  const handleClick = (id: string) => {
    console.log(id, count);
  };
  
  // ✅ CORRETO: Função estável
  const handleClick = useCallback((id: string) => {
    console.log(id, count);
  }, [count]); // Só recria se count mudar
  
  return <ChildComponent onClick={handleClick} />;
}
```

### 3.6 useStableCallback (Sem Deps)

```typescript
import { useStableCallback } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  // Sempre usa valor mais recente, sem deps!
  const handleClick = useStableCallback((id: string) => {
    console.log(id, count); // Sempre usa count atual
  });
  
  return <ChildComponent onClick={handleClick} />;
}
```

---

## 4. Hooks de Memory Management

### 4.1 useCleanup

Gerencia cleanup de múltiplos recursos:

```typescript
import { useCleanup } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const { register, cleanup, cleanupAll } = useCleanup();
  
  useEffect(() => {
    // Registra timer
    const timer = setTimeout(...);
    register('timer', () => clearTimeout(timer));
    
    // Registra listener
    const handler = () => {...};
    window.addEventListener('resize', handler);
    register('resize', () => window.removeEventListener('resize', handler));
    
    // Cleanup automático ao desmontar
  }, [register]);
  
  // Cleanup manual de recurso específico
  const handleStop = () => {
    cleanup('timer');
  };
}
```

### 4.2 useMemoryLeakDetection

Detecta e previne memory leaks (dev only):

```typescript
import { useMemoryLeakDetection } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const memoryTracker = useMemoryLeakDetection('MyComponent');
  
  useEffect(() => {
    const timer = setTimeout(...);
    memoryTracker.trackTimer(timer);
    
    return () => {
      memoryTracker.clearTimer(timer);
    };
  }, [memoryTracker]);
}
```

### 4.3 useObjectPool

Usa object pool em componentes:

```typescript
import { useObjectPool } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const { acquire, release } = useObjectPool(
    () => ({ data: '' }),
    (obj) => { obj.data = ''; },
    50
  );
  
  const handleCreate = () => {
    const obj = acquire();
    obj.data = 'test';
    // ... usar objeto
    release(obj);
  };
}
```

### 4.4 useBoundedArray

Limita tamanho de arrays em estado:

```typescript
import { useBoundedArray } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useBoundedArray(logs, setLogs, 100);
  
  const handleLog = (message: string) => {
    addLog(message); // Mantém apenas últimos 100
  };
}
```

### 4.5 useMemoryMonitor

Monitora uso de memória (dev only):

```typescript
import { useMemoryMonitor } from '@/hooks/useMemoryOptimization';

function MyComponent() {
  useMemoryMonitor('MyComponent', true);
  
  // Logs automáticos a cada 10 renders:
  // [Memory Monitor] MyComponent: { renders: 10, uptime: "5.2s", avgRenderRate: "1.92/s" }
}
```

---

## 5. Checklist de Memory Optimization

### ✅ Antes de Criar Componente

- [ ] Componente precisa de React.memo?
- [ ] Props são estáveis (useCallback/useMemo)?
- [ ] Há computações pesadas que precisam de useMemo?

### ✅ Ao Adicionar useEffect

- [ ] Há cleanup function?
- [ ] Timers são limpos?
- [ ] Event listeners são removidos?
- [ ] Observers são desconectados?
- [ ] Requisições são abortadas?

### ✅ Ao Trabalhar com Listas

- [ ] Items da lista usam React.memo?
- [ ] Callbacks são estáveis (useCallback)?
- [ ] Lista tem limite de tamanho (useBoundedArray)?
- [ ] Lista longa usa virtualização?

### ✅ Ao Trabalhar com Estado

- [ ] Estado não cresce indefinidamente?
- [ ] Arrays têm limite de tamanho?
- [ ] Objetos grandes são limpos quando não usados?

### ✅ Ao Trabalhar com Refs

- [ ] Refs são limpas ao desmontar?
- [ ] Refs não retêm objetos grandes?
- [ ] Refs de DOM são nullificadas?

---

## 6. Ferramentas de Debugging

### 6.1 Chrome DevTools Memory Profiler

1. Abra DevTools → Memory tab
2. Tire heap snapshot antes da ação
3. Execute ação (ex: navegar 10 vezes)
4. Tire heap snapshot depois
5. Compare snapshots
6. Procure por "Detached DOM trees"

### 6.2 React DevTools Profiler

1. Abra React DevTools → Profiler tab
2. Clique em "Record"
3. Execute ação
4. Clique em "Stop"
5. Analise flamegraph
6. Identifique re-renders desnecessários

### 6.3 Performance Monitor (Built-in)

```typescript
import { getPoolStats } from '@/utils/objectPool';

// Adicionar em componente de debug
function DebugPanel() {
  const [stats, setStats] = useState(getPoolStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getPoolStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h3>Memory Stats</h3>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
```

### 6.4 Memory Leak Detection (Dev Mode)

Ative em componentes suspeitos:

```typescript
import { useMemoryLeakDetection } from '@/hooks/useMemoryOptimization';

function SuspectComponent() {
  const memoryTracker = useMemoryLeakDetection('SuspectComponent');
  
  // Logs automáticos ao desmontar:
  // [SuspectComponent] Memory cleanup completed
}
```

---

## 📊 Métricas de Sucesso

### Objetivos da Fase 3

- ✅ **Redução de 30-40%** em eventos de GC
- ✅ **Crescimento de memória < 50MB** em 30min de uso
- ✅ **Nenhum "Detached DOM tree"** após navegação
- ✅ **Re-renders reduzidos em 40-50%** com React.memo

### Como Medir

1. **Eventos de GC:**
   - Chrome DevTools → Performance → Record
   - Procure por "Minor GC" e "Major GC"
   - Compare antes/depois das otimizações

2. **Crescimento de Memória:**
   - Chrome DevTools → Memory → Allocation Timeline
   - Grave por 30 minutos de uso normal
   - Verifique se memória se estabiliza

3. **Detached DOM:**
   - Chrome DevTools → Memory → Heap Snapshot
   - Filtre por "Detached"
   - Deve ser 0 após navegação

4. **Re-renders:**
   - React DevTools → Profiler
   - Compare número de renders antes/depois
   - Verifique se componentes memoizados não re-renderizam

---

## 🚨 Sinais de Memory Leak

### Sintomas

- ⚠️ Aplicação fica lenta após uso prolongado
- ⚠️ Uso de memória cresce continuamente
- ⚠️ Tab do navegador trava ou fecha
- ⚠️ Muitos eventos de GC no profiler

### Como Investigar

1. Tire heap snapshot inicial
2. Execute ação suspeita 10x
3. Force GC (Chrome DevTools → Memory → 🗑️)
4. Tire heap snapshot final
5. Compare e procure por:
   - Detached DOM trees
   - Event listeners órfãos
   - Timers não limpos
   - Closures retendo memória

---

## 📚 Referências

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Web.dev Memory Management](https://web.dev/articles/memory-management)
- [Object Pooling Pattern](https://en.wikipedia.org/wiki/Object_pool_pattern)

---

**Documento criado em:** 2026-01-20  
**Versão:** 1.0  
**Autor:** Code Mode - Fase 3 Memory Optimization  
**Status:** ✅ Implementado
