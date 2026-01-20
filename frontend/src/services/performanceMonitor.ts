// frontend/src/services/performanceMonitor.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Interface para métricas de performance
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Interface para estatísticas agregadas
 */
export interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  recent: number[]; // Últimos 10 valores
}

/**
 * Interface para Long Task
 */
export interface LongTask {
  duration: number;
  startTime: number;
  name: string;
  attribution?: string;
}

/**
 * Classe principal de monitoramento de performance
 * 
 * @example
 * ```typescript
 * // Medir operação síncrona
 * perfMonitor.measure('render-message', () => {
 *   renderMessage(message);
 * });
 * 
 * // Medir operação assíncrona
 * const result = await perfMonitor.measureAsync('fetch-data', async () => {
 *   return await fetchData();
 * });
 * 
 * // Obter estatísticas
 * const stats = perfMonitor.getStats('render-message');
 * console.log(`Tempo médio: ${stats.avg}ms`);
 * ```
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private longTasks: LongTask[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;
  private maxMetricsPerKey: number = 100; // Limitar memória
  private longTaskThreshold: number = 50; // ms

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  /**
   * Inicializar observers de performance
   */
  private initializeObservers(): void {
    try {
      // Observer para Long Tasks
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > this.longTaskThreshold) {
              this.recordLongTask({
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
                attribution: (entry as any).attribution?.[0]?.name,
              });
            }
          }
        });

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        } catch (e) {
          // longtask não suportado em todos os browsers
          console.debug('[PerformanceMonitor] Long Task API não disponível');
        }

        // Observer para Navigation Timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', entry.duration);
          }
        });

        try {
          navigationObserver.observe({ entryTypes: ['navigation'] });
          this.observers.push(navigationObserver);
        } catch (e) {
          console.debug('[PerformanceMonitor] Navigation Timing não disponível');
        }

        // Observer para Resource Timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            this.recordMetric(`resource:${resource.initiatorType}`, resource.duration);
          }
        });

        try {
          resourceObserver.observe({ entryTypes: ['resource'] });
          this.observers.push(resourceObserver);
        } catch (e) {
          console.debug('[PerformanceMonitor] Resource Timing não disponível');
        }
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Erro ao inicializar observers:', error);
    }
  }

  /**
   * Habilitar/desabilitar monitoramento
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Configurar threshold para Long Tasks
   */
  setLongTaskThreshold(threshold: number): void {
    this.longTaskThreshold = threshold;
  }

  /**
   * Medir tempo de execução de uma função síncrona
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);

      if (duration > this.longTaskThreshold) {
        console.warn(`⚠️ [PerformanceMonitor] Operação lenta: ${name} levou ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}:error`, duration);
      throw error;
    }
  }

  /**
   * Medir tempo de execução de uma função assíncrona
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);

      if (duration > this.longTaskThreshold) {
        console.warn(`⚠️ [PerformanceMonitor] Operação assíncrona lenta: ${name} levou ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}:error`, duration);
      throw error;
    }
  }

  /**
   * Marcar início de uma medição manual
   */
  mark(name: string): void {
    if (!this.isEnabled) return;
    performance.mark(name);
  }

  /**
   * Medir tempo entre duas marcações
   */
  measureBetween(measureName: string, startMark: string, endMark: string): number {
    if (!this.isEnabled) return 0;

    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName, 'measure')[0];
      const duration = measure.duration;
      this.recordMetric(measureName, duration);
      return duration;
    } catch (error) {
      console.error('[PerformanceMonitor] Erro ao medir:', error);
      return 0;
    }
  }

  /**
   * Registrar métrica manualmente
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Limitar tamanho do array para evitar memory leak
    if (values.length > this.maxMetricsPerKey) {
      values.shift(); // Remove o mais antigo
    }

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[PerformanceMonitor] ${name}: ${value.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Registrar Long Task
   */
  private recordLongTask(task: LongTask): void {
    this.longTasks.push(task);

    // Limitar tamanho do array
    if (this.longTasks.length > 50) {
      this.longTasks.shift();
    }

    console.warn(`🐌 [PerformanceMonitor] Long Task detectada:`, {
      duration: task.duration.toFixed(2) + 'ms',
      startTime: task.startTime.toFixed(2) + 'ms',
      name: task.name,
      attribution: task.attribution,
    });

    // Enviar para analytics (se disponível)
    this.sendToAnalytics('long_task', task.duration, {
      name: task.name,
      attribution: task.attribution,
    });
  }

  /**
   * Obter estatísticas de uma métrica
   */
  getStats(name: string): PerformanceStats | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      recent: values.slice(-10), // Últimos 10 valores
    };
  }

  /**
   * Obter todas as métricas
   */
  getAllMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  /**
   * Obter Long Tasks
   */
  getLongTasks(): LongTask[] {
    return [...this.longTasks];
  }

  /**
   * Exportar relatório completo
   */
  exportReport(): {
    metrics: Record<string, PerformanceStats | null>;
    longTasks: LongTask[];
    summary: {
      totalMetrics: number;
      totalLongTasks: number;
      avgLongTaskDuration: number;
    };
  } {
    const metricsReport: Record<string, PerformanceStats | null> = {};
    
    this.metrics.forEach((_, name) => {
      metricsReport[name] = this.getStats(name);
    });

    const avgLongTaskDuration = this.longTasks.length > 0
      ? this.longTasks.reduce((sum, task) => sum + task.duration, 0) / this.longTasks.length
      : 0;

    return {
      metrics: metricsReport,
      longTasks: this.longTasks,
      summary: {
        totalMetrics: this.metrics.size,
        totalLongTasks: this.longTasks.length,
        avgLongTaskDuration,
      },
    };
  }

  /**
   * Limpar todas as métricas
   */
  clear(): void {
    this.metrics.clear();
    this.longTasks = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Enviar métricas para analytics (Google Analytics, Sentry, etc)
   */
  private sendToAnalytics(eventName: string, value: number, metadata?: Record<string, any>): void {
    // Integração com Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        value: Math.round(value),
        ...metadata,
      });
    }

    // Integração com Sentry (se disponível)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(`Performance: ${eventName}`, {
        level: 'info',
        extra: {
          value,
          ...metadata,
        },
      });
    }
  }

  /**
   * Destruir monitor e limpar observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clear();
  }
}

// ✅ Instância singleton global
export const perfMonitor = new PerformanceMonitor();

// ✅ Expor no window para debug (apenas em dev)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).perfMonitor = perfMonitor;
  console.log('💡 [PerformanceMonitor] Disponível em window.perfMonitor');
}
