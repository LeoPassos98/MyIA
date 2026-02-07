// frontend/src/hooks/useMemoryOptimization.ts
// ⚠️ DEPRECATED: Este arquivo foi modularizado
// 
// 📦 Nova estrutura: frontend/src/hooks/memory/
// 
// Migração:
// ❌ import { useStableCallback } from './hooks/useMemoryOptimization'
// ✅ import { useStableCallback } from './hooks/memory'
// 
// Hooks disponíveis:
// - useObjectPool
// - useStableCallback
// - useStableRef
// - useLatestValue
// - useCleanup
// - useMemoryLeakDetection
// - useDeepMemo
// - useBoundedArray
// - useMemoryMonitor
//
// Este arquivo será removido em versões futuras.
// Por favor, atualize seus imports para usar 'hooks/memory'.

// Re-exports para backward compatibility
export * from './memory';

// Warning em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] useMemoryOptimization.ts foi modularizado.\n' +
    'Use imports de "hooks/memory" ao invés de "hooks/useMemoryOptimization".\n' +
    'Exemplo: import { useStableCallback } from "hooks/memory"'
  );
}
