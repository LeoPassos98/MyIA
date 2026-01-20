// frontend/src/hooks/useLayoutOptimization.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useRef, useEffect, useCallback, useState } from 'react';
import { domBatchScheduler, measureElement, ElementMeasurements } from '../utils/domBatch';

/**
 * Hook para agrupar operações DOM em batches
 * Elimina layout thrashing ao separar reads e writes
 * 
 * @returns Objeto com métodos scheduleRead e scheduleWrite
 * 
 * @example
 * const { scheduleRead, scheduleWrite } = useBatchedLayout();
 * 
 * // Agendar leitura
 * const height = await scheduleRead(() => element.offsetHeight);
 * 
 * // Agendar escrita
 * await scheduleWrite(() => element.style.height = `${height}px`);
 */
export function useBatchedLayout() {
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Não limpar o scheduler global, apenas garantir que não há leaks
    };
  }, []);

  const scheduleRead = useCallback(<T,>(readFn: () => T): Promise<T> => {
    return domBatchScheduler.scheduleRead(readFn);
  }, []);

  const scheduleWrite = useCallback((writeFn: () => void): Promise<void> => {
    return domBatchScheduler.scheduleWrite(writeFn);
  }, []);

  return { scheduleRead, scheduleWrite };
}

/**
 * Hook para animações otimizadas com requestAnimationFrame
 * Garante que animações rodem a 60fps sincronizadas com o navegador
 * 
 * @param callback Função a ser executada no próximo frame
 * @param deps Dependências do callback
 * 
 * @example
 * const animate = useRAF((timestamp) => {
 *   // Código de animação
 * }, []);
 * 
 * // Iniciar animação
 * animate();
 */
export function useRAF(
  callback: (timestamp: number) => void,
  deps: React.DependencyList = []
) {
  const rafIdRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  // Atualizar callback ref quando deps mudarem
  useEffect(() => {
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);

  const animate = useCallback((timestamp: number) => {
    callbackRef.current(timestamp);
  }, []);

  const start = useCallback(() => {
    if (rafIdRef.current !== null) return; // Já está rodando

    const frame = (timestamp: number) => {
      animate(timestamp);
      rafIdRef.current = requestAnimationFrame(frame);
    };

    rafIdRef.current = requestAnimationFrame(frame);
  }, [animate]);

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const once = useCallback(() => {
    rafIdRef.current = requestAnimationFrame((timestamp) => {
      animate(timestamp);
      rafIdRef.current = null;
    });
  }, [animate]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, once };
}

/**
 * Hook para medir elementos sem causar layout thrashing
 * Agrupa todas as leituras e retorna medições otimizadas
 * 
 * @param elementRef Ref do elemento a ser medido
 * @param deps Dependências que disparam nova medição
 * @returns Medições do elemento
 * 
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const measurements = useMeasure(ref, [someState]);
 * 
 * console.log(measurements.height); // Altura atual
 */
export function useMeasure<T extends HTMLElement>(
  elementRef: React.RefObject<T>,
  deps: React.DependencyList = []
): ElementMeasurements | null {
  const [measurements, setMeasurements] = useState<ElementMeasurements | null>(null);
  const { scheduleRead } = useBatchedLayout();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Agendar medição no próximo frame
    const measure = async () => {
      try {
        const result = await scheduleRead(() => measureElement(element));
        const resolved = await result;
        setMeasurements(resolved);
      } catch (error) {
        console.error(error);
      }
    };
    
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, scheduleRead, ...deps]);

  return measurements;
}

/**
 * Hook para observar mudanças de tamanho de forma otimizada
 * Usa ResizeObserver com batch DOM operations
 * 
 * @param callback Função chamada quando o tamanho muda
 * @param deps Dependências do callback
 * @returns Ref para anexar ao elemento
 * 
 * @example
 * const ref = useResizeObserver((entry) => {
 *   console.log('Novo tamanho:', entry.contentRect);
 * }, []);
 * 
 * return <div ref={ref}>Content</div>;
 */
export function useResizeObserver<T extends HTMLElement>(
  callback: (entry: ResizeObserverEntry) => void,
  deps: React.DependencyList = []
) {
  const elementRef = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef(callback);
  const { scheduleRead } = useBatchedLayout();

  // Atualizar callback ref
  useEffect(() => {
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Criar observer se não existir
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        // Agendar leitura das medições
        scheduleRead(() => {
          entries.forEach(entry => callbackRef.current(entry));
        });
      });
    }

    // Observar elemento
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [scheduleRead]);

  return elementRef;
}

/**
 * Hook para scroll otimizado com RAF
 * Agrupa operações de scroll para evitar jank
 * 
 * @param elementRef Ref do elemento com scroll
 * @param options Opções de scroll
 * 
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const scrollTo = useOptimizedScroll(ref);
 * 
 * // Scroll suave para o topo
 * scrollTo({ top: 0, behavior: 'smooth' });
 */
export function useOptimizedScroll<T extends HTMLElement>(
  elementRef: React.RefObject<T>
) {
  const { scheduleWrite } = useBatchedLayout();

  const scrollTo = useCallback((options: ScrollToOptions) => {
    const element = elementRef.current;
    if (!element) return;

    scheduleWrite(() => {
      element.scrollTo(options);
    });
  }, [elementRef, scheduleWrite]);

  const scrollIntoView = useCallback((options?: ScrollIntoViewOptions) => {
    const element = elementRef.current;
    if (!element) return;

    scheduleWrite(() => {
      element.scrollIntoView(options);
    });
  }, [elementRef, scheduleWrite]);

  return { scrollTo, scrollIntoView };
}

/**
 * Hook para aplicar estilos de forma otimizada
 * Agrupa escritas CSS para evitar forced reflows
 * 
 * @param elementRef Ref do elemento
 * @returns Função para aplicar estilos
 * 
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const applyStyles = useOptimizedStyles(ref);
 * 
 * applyStyles({ height: '100px', opacity: '0.5' });
 */
export function useOptimizedStyles<T extends HTMLElement>(
  elementRef: React.RefObject<T>
) {
  const { scheduleWrite } = useBatchedLayout();

  const applyStyles = useCallback((styles: Partial<CSSStyleDeclaration>) => {
    const element = elementRef.current;
    if (!element) return;

    scheduleWrite(() => {
      Object.assign(element.style, styles);
    });
  }, [elementRef, scheduleWrite]);

  return applyStyles;
}

/**
 * Hook para detectar se elemento está visível no viewport
 * Usa IntersectionObserver de forma otimizada
 * 
 * @param options Opções do IntersectionObserver
 * @returns [ref, isVisible]
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });
 * 
 * return <div ref={ref}>{isVisible ? 'Visível' : 'Oculto'}</div>;
 */
export function useIntersectionObserver<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T>, boolean] {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.threshold, options.root, options.rootMargin]);

  return [elementRef, isVisible];
}

/**
 * Hook para animações CSS com will-change otimizado
 * Adiciona will-change antes da animação e remove depois
 * 
 * @param properties Propriedades CSS que serão animadas
 * @returns [ref, startAnimation, endAnimation]
 * 
 * @example
 * const [ref, start, end] = useWillChange(['transform', 'opacity']);
 * 
 * const animate = () => {
 *   start();
 *   // ... animação
 *   setTimeout(end, 300);
 * };
 */
export function useWillChange<T extends HTMLElement>(
  properties: string[]
): [React.RefObject<T>, () => void, () => void] {
  const elementRef = useRef<T>(null);
  const { scheduleWrite } = useBatchedLayout();

  const startAnimation = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    scheduleWrite(() => {
      element.style.willChange = properties.join(', ');
    });
  }, [properties, scheduleWrite]);

  const endAnimation = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    scheduleWrite(() => {
      element.style.willChange = 'auto';
    });
  }, [scheduleWrite]);

  return [elementRef, startAnimation, endAnimation];
}
