// frontend/src/utils/domBatch.ts
// Utilitário para agrupar operações de leitura/escrita do DOM
// Elimina layout thrashing ao separar reads e writes em fases distintas

/**
 * Scheduler para agrupar operações DOM em batches
 * Usa requestAnimationFrame para sincronizar com o refresh rate do navegador
 * 
 * Padrão de uso:
 * 1. Agendar todas as leituras com scheduleRead()
 * 2. Agendar todas as escritas com scheduleWrite()
 * 3. O scheduler executa todas as leituras primeiro, depois todas as escritas
 * 
 * Isso evita forced reflows causados por intercalar reads e writes
 */
export class DOMBatchScheduler {
  private readQueue: Array<() => any> = [];
  private writeQueue: Array<() => void> = [];
  private rafId: number | null = null;
  private isProcessing = false;

  /**
   * Agenda uma operação de leitura do DOM
   * @param readFn Função que lê propriedades do DOM (offsetHeight, scrollTop, etc)
   * @returns Promise que resolve com o resultado da leitura
   */
  scheduleRead<T>(readFn: () => T): Promise<T> {
    return new Promise((resolve) => {
      this.readQueue.push(() => {
        const result = readFn();
        resolve(result);
        return result;
      });
      this.scheduleFlush();
    });
  }

  /**
   * Agenda uma operação de escrita no DOM
   * @param writeFn Função que modifica o DOM (style, classList, etc)
   * @returns Promise que resolve quando a escrita for executada
   */
  scheduleWrite(writeFn: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.writeQueue.push(() => {
        writeFn();
        resolve();
      });
      this.scheduleFlush();
    });
  }

  /**
   * Agenda o flush das operações pendentes
   * Usa requestAnimationFrame para sincronizar com o navegador
   */
  private scheduleFlush(): void {
    if (this.rafId !== null || this.isProcessing) return;

    this.rafId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Executa todas as operações pendentes
   * Fase 1: Todas as leituras
   * Fase 2: Todas as escritas
   */
  private flush(): void {
    this.isProcessing = true;
    this.rafId = null;

    // Fase 1: Executar todas as leituras
    const reads = [...this.readQueue];
    this.readQueue = [];
    reads.forEach(fn => fn());

    // Fase 2: Executar todas as escritas
    const writes = [...this.writeQueue];
    this.writeQueue = [];
    writes.forEach(fn => fn());

    this.isProcessing = false;

    // Se novas operações foram agendadas durante o flush, agendar outro
    if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
      this.scheduleFlush();
    }
  }

  /**
   * Cancela todas as operações pendentes
   * Útil para cleanup em unmount
   */
  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.readQueue = [];
    this.writeQueue = [];
    this.isProcessing = false;
  }

  /**
   * Retorna o número de operações pendentes
   * Útil para debugging
   */
  getPendingCount(): { reads: number; writes: number } {
    return {
      reads: this.readQueue.length,
      writes: this.writeQueue.length,
    };
  }
}

/**
 * Instância singleton do scheduler
 * Compartilhada por toda a aplicação para máxima eficiência
 */
export const domBatchScheduler = new DOMBatchScheduler();

/**
 * Tipo para medições de elementos
 */
export interface ElementMeasurements {
  width: number;
  height: number;
  top: number;
  left: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Helper para medir elemento de forma otimizada
 * Agrupa todas as leituras em uma única operação
 * 
 * @param element Elemento a ser medido
 * @returns Promise com as medições
 */
export async function measureElement(
  element: HTMLElement
): Promise<ElementMeasurements> {
  return domBatchScheduler.scheduleRead(() => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
    top: element.offsetTop,
    left: element.offsetLeft,
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
}

/**
 * Helper para aplicar estilos de forma otimizada
 * Agrupa todas as escritas em uma única operação
 * 
 * @param element Elemento a ser modificado
 * @param styles Objeto com estilos a aplicar
 */
export async function applyStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): Promise<void> {
  return domBatchScheduler.scheduleWrite(() => {
    Object.assign(element.style, styles);
  });
}

/**
 * Helper para scroll otimizado
 * Usa RAF para sincronizar com o navegador
 * 
 * @param element Elemento a fazer scroll
 * @param options Opções de scroll
 */
export async function smoothScroll(
  element: HTMLElement,
  options: ScrollToOptions
): Promise<void> {
  return domBatchScheduler.scheduleWrite(() => {
    element.scrollTo(options);
  });
}
