/**
 * Performance Utilities
 * 
 * Funções utilitárias para otimização de performance através de
 * throttling, debouncing e requestAnimationFrame.
 */

/**
 * Tipo genérico para funções que podem ser throttled/debounced
 */
export type ThrottleableFunction<T extends (...args: any[]) => any> = T;

/**
 * Tipo de retorno para funções throttled/debounced com método cancel
 */
export interface CancellableFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * Throttle - Limita a execução de uma função a uma vez por intervalo
 * 
 * Útil para eventos que disparam frequentemente (scroll, resize, mousemove)
 * mas onde você quer garantir que a função execute pelo menos uma vez por intervalo.
 * 
 * @param func - Função a ser throttled
 * @param limit - Tempo mínimo (ms) entre execuções
 * @returns Função throttled com método cancel
 * 
 * @example
 * const handleScroll = throttle((e: Event) => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 * // Cleanup: handleScroll.cancel();
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): CancellableFunction<T> {
  let inThrottle: boolean = false;

  const throttled = function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };

  throttled.cancel = () => {
    inThrottle = false;
  };

  return throttled as CancellableFunction<T>;
}

/**
 * Debounce - Atrasa a execução até que pare de ser chamada por um período
 * 
 * Útil para inputs de busca, auto-save, validação de formulários.
 * A função só executa após o usuário "parar" de interagir.
 * 
 * @param func - Função a ser debounced
 * @param delay - Tempo (ms) de espera após última chamada
 * @returns Função debounced com método cancel
 * 
 * @example
 * const handleSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * input.addEventListener('input', (e) => handleSearch(e.target.value));
 * // Cleanup: handleSearch.cancel();
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): CancellableFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as CancellableFunction<T>;
}

/**
 * RAF Throttle - Throttle usando requestAnimationFrame
 * 
 * Ideal para animações e scroll handlers que precisam sincronizar
 * com o refresh rate do navegador (~60fps).
 * 
 * Garante que a função execute no máximo uma vez por frame,
 * proporcionando performance suave e eficiente.
 * 
 * @param func - Função a ser throttled
 * @returns Função throttled com método cancel
 * 
 * @example
 * const handleScroll = rafThrottle((e: Event) => {
 *   // Atualiza posição de elementos baseado no scroll
 *   updateParallaxEffect();
 * });
 * 
 * window.addEventListener('scroll', handleScroll, { passive: true });
 * // Cleanup: handleScroll.cancel();
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): CancellableFunction<T> {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>): void {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs !== null) {
          func.apply(this, latestArgs);
          latestArgs = null;
        }
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      latestArgs = null;
    }
  };

  return throttled as CancellableFunction<T>;
}

/**
 * Opções para event listeners otimizados
 */
export interface OptimizedEventOptions extends AddEventListenerOptions {
  passive?: boolean;
  once?: boolean;
  capture?: boolean;
}

/**
 * Helper para criar event listeners com opções otimizadas
 * 
 * Facilita a criação de listeners com { passive: true } para melhor performance
 * em eventos de scroll e touch.
 * 
 * @param passive - Se true, indica que o listener nunca chamará preventDefault()
 * @returns Objeto de opções para addEventListener
 * 
 * @example
 * element.addEventListener('scroll', handler, createPassiveListener(true));
 */
export function createPassiveListener(
  passive: boolean = true
): OptimizedEventOptions {
  return { passive };
}

/**
 * Verifica se o navegador suporta passive event listeners
 */
let passiveSupported: boolean | null = null;

export function supportsPassiveEvents(): boolean {
  if (passiveSupported !== null) {
    return passiveSupported;
  }

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        passiveSupported = true;
        return true;
      },
    });
    window.addEventListener('test' as any, null as any, opts);
    window.removeEventListener('test' as any, null as any, opts);
  } catch (e) {
    passiveSupported = false;
  }

  return passiveSupported ?? false;
}

/**
 * Cria opções de event listener com fallback para navegadores antigos
 */
export function getEventOptions(
  options: OptimizedEventOptions = {}
): OptimizedEventOptions | boolean {
  if (!supportsPassiveEvents()) {
    return options.capture ?? false;
  }
  return options;
}
