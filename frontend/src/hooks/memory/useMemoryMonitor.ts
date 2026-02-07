// frontend/src/hooks/memory/useMemoryMonitor.ts
// Hook para monitorar uso de memória do componente (dev only)

import { useRef, useEffect } from 'react';

/**
 * Hook para monitorar uso de memória do componente (dev only)
 * Útil para identificar memory leaks durante desenvolvimento
 * 
 * @param componentName Nome do componente
 * @param enabled Se deve monitorar (padrão: apenas em dev)
 */
export function useMemoryMonitor(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current++;

    if (!enabled) return;

    // Log a cada 10 renders
    if (renderCountRef.current % 10 === 0) {
      const uptime = Date.now() - mountTimeRef.current;
      console.log(`[Memory Monitor] ${componentName}:`, {
        renders: renderCountRef.current,
        uptime: `${(uptime / 1000).toFixed(1)}s`,
        avgRenderRate: `${(renderCountRef.current / (uptime / 1000)).toFixed(2)}/s`,
      });
    }
  });

  useEffect(() => {
    if (!enabled) return;

    const mountTime = mountTimeRef.current;
    const renderCount = renderCountRef.current;

    return () => {
      const uptime = Date.now() - mountTime;
      console.log(`[Memory Monitor] ${componentName} unmounted:`, {
        totalRenders: renderCount,
        lifetime: `${(uptime / 1000).toFixed(1)}s`,
      });
    };
  }, [componentName, enabled]);
}
