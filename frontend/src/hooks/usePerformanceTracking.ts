// frontend/src/hooks/usePerformanceTracking.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useEffect, useRef, useCallback } from 'react';
import { perfMonitor } from '@/services/performanceMonitor';

/**
 * Hook para observar métricas de performance de um componente
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceObserver('MyComponent');
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceObserver(componentName: string) {
  const mountTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    // Registrar tempo de mount
    mountTime.current = performance.now();
    perfMonitor.mark(`${componentName}:mount:start`);

    return () => {
      // Registrar tempo de unmount
      const duration = performance.now() - mountTime.current;
      perfMonitor.recordMetric(`${componentName}:lifetime`, duration);
      perfMonitor.mark(`${componentName}:mount:end`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} viveu por ${duration.toFixed(2)}ms com ${renderCount.current} renders`);
      }
    };
  }, [componentName]);

  useEffect(() => {
    // Contar renders
    renderCount.current += 1;
    
    if (renderCount.current > 10 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [Performance] ${componentName} renderizou ${renderCount.current} vezes`);
    }
  });
}

/**
 * Hook para detectar Long Tasks (tarefas > 50ms)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { longTasks, clearLongTasks } = useLongTaskDetection();
 *   
 *   return (
 *     <div>
 *       {longTasks.length > 0 && (
 *         <Alert severity="warning">
 *           {longTasks.length} long tasks detectadas
 *         </Alert>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLongTaskDetection(threshold: number = 50) {
  const longTasksRef = useRef<Array<{ duration: number; name: string; timestamp: number }>>([]);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          longTasksRef.current.push({
            duration: entry.duration,
            name: entry.name,
            timestamp: Date.now(),
          });

          // Limitar array
          if (longTasksRef.current.length > 20) {
            longTasksRef.current.shift();
          }

          if (process.env.NODE_ENV === 'development') {
            console.warn(`🐌 [Long Task] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long Task API não disponível
      console.debug('[useLongTaskDetection] Long Task API não disponível');
    }

    return () => observer.disconnect();
  }, [threshold]);

  const clearLongTasks = useCallback(() => {
    longTasksRef.current = [];
  }, []);

  return {
    longTasks: longTasksRef.current,
    clearLongTasks,
  };
}

/**
 * Hook para tracking de Core Web Vitals
 * 
 * @example
 * ```tsx
 * function App() {
 *   const webVitals = useWebVitals();
 *   
 *   useEffect(() => {
 *     console.log('Web Vitals:', webVitals);
 *   }, [webVitals]);
 * }
 * ```
 */
export function useWebVitals() {
  const vitalsRef = useRef<{
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    // Observer para LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
      vitalsRef.current.LCP = lcpValue;
      if (lcpValue !== undefined) {
        perfMonitor.recordMetric('web-vitals:LCP', lcpValue);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.debug('[useWebVitals] LCP não disponível');
    }

    // Observer para FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        vitalsRef.current.FID = entry.processingStart - entry.startTime;
        perfMonitor.recordMetric('web-vitals:FID', vitalsRef.current.FID);
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.debug('[useWebVitals] FID não disponível');
    }

    // Observer para CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          vitalsRef.current.CLS = clsValue;
          perfMonitor.recordMetric('web-vitals:CLS', clsValue);
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.debug('[useWebVitals] CLS não disponível');
    }

    // Navigation Timing para FCP e TTFB
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        // FCP (First Contentful Paint)
        if (entry.name === 'first-contentful-paint') {
          vitalsRef.current.FCP = entry.startTime;
          perfMonitor.recordMetric('web-vitals:FCP', entry.startTime);
        }
        
        // TTFB (Time to First Byte)
        if (entry.responseStart) {
          vitalsRef.current.TTFB = entry.responseStart - entry.requestStart;
          perfMonitor.recordMetric('web-vitals:TTFB', vitalsRef.current.TTFB);
        }
      });
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation', 'paint'] });
    } catch (e) {
      console.debug('[useWebVitals] Navigation Timing não disponível');
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      navigationObserver.disconnect();
    };
  }, []);

  return vitalsRef.current;
}

/**
 * Hook para medir tempo de render de um componente
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const measureRender = useRenderTime('MyComponent');
 *   
 *   useEffect(() => {
 *     measureRender();
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderTime(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  const measureRender = useCallback(() => {
    const duration = performance.now() - renderStartRef.current;
    perfMonitor.recordMetric(`${componentName}:render`, duration);
    
    if (duration > 16 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [Performance] ${componentName} render lento: ${duration.toFixed(2)}ms (> 16ms)`);
    }
    
    return duration;
  }, [componentName]);

  return measureRender;
}

/**
 * Hook para medir operações assíncronas
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const measureAsync = useAsyncMeasure();
 *   
 *   const fetchData = async () => {
 *     const data = await measureAsync('fetch-data', async () => {
 *       return await api.get('/data');
 *     });
 *   };
 * }
 * ```
 */
export function useAsyncMeasure() {
  const measureAsync = useCallback(async <T,>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return perfMonitor.measureAsync(name, fn);
  }, []);

  return measureAsync;
}

/**
 * Hook para tracking de interações do usuário
 * 
 * @example
 * ```tsx
 * function MyButton() {
 *   const trackInteraction = useInteractionTracking('MyButton');
 *   
 *   const handleClick = () => {
 *     trackInteraction('click');
 *     // ... lógica do botão
 *   };
 *   
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useInteractionTracking(componentName: string) {
  const trackInteraction = useCallback((
    interactionType: string,
    _metadata?: Record<string, any>
  ) => {
    const metricName = `${componentName}:${interactionType}`;
    perfMonitor.mark(`${metricName}:start`);
    
    // Medir tempo até próximo frame
    requestAnimationFrame(() => {
      perfMonitor.mark(`${metricName}:end`);
      const duration = perfMonitor.measureBetween(
        metricName,
        `${metricName}:start`,
        `${metricName}:end`
      );
      
      if (duration > 100 && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [Interaction] ${metricName} demorou ${duration.toFixed(2)}ms`);
      }
    });
  }, [componentName]);

  return trackInteraction;
}

/**
 * Hook para monitorar uso de memória
 * 
 * @example
 * ```tsx
 * function App() {
 *   const memoryInfo = useMemoryMonitoring(5000); // Check a cada 5s
 *   
 *   return (
 *     <div>
 *       Memória usada: {memoryInfo.usedJSHeapSize / 1024 / 1024} MB
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemoryMonitoring(interval: number = 10000) {
  const memoryInfoRef = useRef<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  });

  useEffect(() => {
    // Verificar se Memory API está disponível
    if (!(performance as any).memory) {
      console.debug('[useMemoryMonitoring] Memory API não disponível');
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      memoryInfoRef.current = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };

      // Registrar métrica
      perfMonitor.recordMetric('memory:used', memory.usedJSHeapSize / 1024 / 1024); // MB

      // Alertar se uso de memória estiver alto
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80 && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [Memory] Uso alto de memória: ${usagePercent.toFixed(2)}%`);
      }
    };

    checkMemory();
    const intervalId = setInterval(checkMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfoRef.current;
}
