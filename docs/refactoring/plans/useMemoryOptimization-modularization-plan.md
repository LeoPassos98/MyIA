# Plano de Modularização: useMemoryOptimization.ts

**Arquivo Original:** [`frontend/src/hooks/useMemoryOptimization.ts`](../../../frontend/src/hooks/useMemoryOptimization.ts:1)  
**Tamanho Atual:** 402 linhas  
**Data:** 2026-02-07  
**Responsável:** Equipe de Refatoração

---

## 1. Objetivo da Modularização

Decompor o arquivo monolítico `useMemoryOptimization.ts` em módulos independentes e coesos, organizados por domínio funcional, para melhorar:

- **Manutenibilidade:** Cada hook em seu próprio arquivo com documentação focada
- **Testabilidade:** Testes unitários isolados por hook
- **Reutilização:** Imports seletivos reduzem bundle size (tree-shaking)
- **Navegação:** Estrutura clara facilita localização de hooks específicos
- **Coesão:** Hooks agrupados por responsabilidade (pooling, cleanup, monitoring, etc.)

**Princípio Fundamental:** Manter 100% de compatibilidade retroativa através de re-exports no `index.ts`.

---

## 2. Análise de Responsabilidades Atuais

O arquivo contém **9 hooks** com responsabilidades distintas:

### 2.1 Domínio: Object Pooling
- **`useObjectPool`** (linhas 25-58): Gerencia lifecycle de ObjectPool em componentes React
  - Dependência: `ObjectPool` de `utils/objectPool.ts`
  - Responsabilidade: Integração React + Object Pooling

### 2.2 Domínio: Callback Stability
- **`useStableCallback`** (linhas 73-88): Cria callbacks estáveis sem causar re-renders
  - Padrão: Ref + useCallback para evitar deps desnecessárias
  - Uso: Event handlers que precisam de valores atuais sem re-renders

- **`useStableRef`** (linhas 101-109): Referência estável de valor
  - Padrão: useRef + useEffect para sincronização
  - Uso: Evitar re-renders por mudanças de referência

- **`useLatestValue`** (linhas 318-326): Getter para valores atuais sem closures
  - Padrão: Ref + getter function
  - Uso: Prevenir closures que retêm memória

### 2.3 Domínio: Resource Cleanup
- **`useCleanup`** (linhas 129-162): Sistema de registro e limpeza de recursos
  - Responsabilidade: Gerenciar timers, listeners, observers
  - Padrão: Map de cleanup functions + auto-cleanup

- **`useMemoryLeakDetection`** (linhas 180-273): Detecção e prevenção de memory leaks
  - Responsabilidade: Rastrear timers, listeners, observers não limpos
  - Padrão: Sets de tracking + cleanup automático
  - Complexidade: 94 linhas (maior hook do arquivo)

### 2.4 Domínio: Memoization
- **`useDeepMemo`** (linhas 286-301): Memoização profunda via JSON.stringify
  - Responsabilidade: Evitar re-renders por mudanças de referência
  - Padrão: Comparação de serialização

### 2.5 Domínio: Array Management
- **`useBoundedArray`** (linhas 341-356): Limita tamanho de arrays em estado
  - Responsabilidade: Prevenir crescimento ilimitado de listas
  - Padrão: Slice automático ao exceder limite

### 2.6 Domínio: Monitoring
- **`useMemoryMonitor`** (linhas 365-402): Monitora uso de memória (dev only)
  - Responsabilidade: Logging de renders e lifetime
  - Padrão: Refs + logging condicional

---

## 3. Estrutura de Módulos Proposta

```
frontend/src/hooks/memory/
├── index.ts                      # Re-exports (backward compatibility)
├── useObjectPool.ts              # Object pooling integration
├── useStableCallback.ts          # Stable callback pattern
├── useStableRef.ts               # Stable reference pattern
├── useLatestValue.ts             # Latest value getter
├── useCleanup.ts                 # Resource cleanup system
├── useMemoryLeakDetection.ts     # Memory leak detection
├── useDeepMemo.ts                # Deep memoization
├── useBoundedArray.ts            # Bounded array management
└── useMemoryMonitor.ts           # Memory monitoring (dev)
```

### 3.1 Agrupamento por Domínio

| Domínio | Hooks | Justificativa |
|---------|-------|---------------|
| **Pooling** | `useObjectPool` | Integração única com ObjectPool |
| **Stability** | `useStableCallback`, `useStableRef`, `useLatestValue` | Padrões relacionados de estabilização |
| **Cleanup** | `useCleanup`, `useMemoryLeakDetection` | Gerenciamento de recursos e leaks |
| **Optimization** | `useDeepMemo`, `useBoundedArray` | Otimizações de memória específicas |
| **Monitoring** | `useMemoryMonitor` | Observabilidade (dev only) |

**Decisão:** Separar todos em arquivos individuais (não agrupar) porque:
- Cada hook tem propósito distinto
- Tree-shaking mais eficiente
- Testes mais focados
- Documentação mais clara

---

## 4. Interfaces e Contratos entre Módulos

### 4.1 Dependências Externas

```typescript
// Apenas useObjectPool tem dependência externa
useObjectPool.ts → utils/objectPool.ts (ObjectPool class)
```

### 4.2 Dependências Internas

**Nenhuma.** Todos os hooks são independentes entre si.

### 4.3 Contratos de Export

Cada módulo exporta:
- **Named export:** Função do hook
- **JSDoc completo:** Descrição, parâmetros, retorno, exemplos
- **TypeScript types:** Tipos genéricos quando aplicável

Exemplo de contrato:
```typescript
// useStableCallback.ts
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T;
```

### 4.4 Re-exports (index.ts)

```typescript
// index.ts - Mantém compatibilidade total
export { useObjectPool } from './useObjectPool';
export { useStableCallback } from './useStableCallback';
export { useStableRef } from './useStableRef';
export { useLatestValue } from './useLatestValue';
export { useCleanup } from './useCleanup';
export { useMemoryLeakDetection } from './useMemoryLeakDetection';
export { useDeepMemo } from './useDeepMemo';
export { useBoundedArray } from './useBoundedArray';
export { useMemoryMonitor } from './useMemoryMonitor';
```

**Garantia:** Imports existentes continuam funcionando:
```typescript
// Antes e depois (ambos válidos)
import { useStableCallback } from '@/hooks/useMemoryOptimization';
import { useStableCallback } from '@/hooks/memory'; // novo caminho
```

---

## 5. Estratégia de Migração

### 5.1 Fase 1: Preparação (Sem Breaking Changes)

**Objetivo:** Criar estrutura paralela sem afetar código existente.

**Passos:**
1. Criar diretório `frontend/src/hooks/memory/`
2. Copiar cada hook para arquivo individual
3. Manter imports originais (React, ObjectPool)
4. Preservar JSDoc completo de cada hook
5. Criar `index.ts` com re-exports

**Validação:**
- Compilação TypeScript sem erros
- Nenhum import quebrado

### 5.2 Fase 2: Atualização de Imports

**Objetivo:** Migrar imports existentes para nova estrutura.

**Arquivos Afetados (4 encontrados):**
- `frontend/src/features/chat/components/drawer/HistorySidebar.tsx` (linha 26)
- `frontend/src/features/chat/hooks/useChatLogic.ts` (linha 11)
- `frontend/src/features/chat/components/input/ChatInput.tsx` (linha 14)
- `frontend/src/features/chat/components/message/MessageList.tsx` (linha 15)

**Estratégia de Atualização:**

```typescript
// ANTES
import { useStableCallback } from '../../../../hooks/useMemoryOptimization';

// DEPOIS (opção 1 - via index)
import { useStableCallback } from '../../../../hooks/memory';

// DEPOIS (opção 2 - direto)
import { useStableCallback } from '../../../../hooks/memory/useStableCallback';
```

**Recomendação:** Usar opção 1 (via index) para manter flexibilidade.

### 5.3 Fase 3: Deprecação do Arquivo Original

**Objetivo:** Marcar arquivo original como deprecated.

**Ações:**
1. Renomear `useMemoryOptimization.ts` → `useMemoryOptimization.deprecated.ts`
2. Substituir conteúdo por re-exports + aviso de deprecação:

```typescript
// useMemoryOptimization.deprecated.ts
/**
 * @deprecated Este arquivo foi modularizado.
 * Use imports de 'hooks/memory' ao invés de 'hooks/useMemoryOptimization'
 * 
 * Migração:
 * - import { useStableCallback } from 'hooks/useMemoryOptimization'
 * + import { useStableCallback } from 'hooks/memory'
 */
export * from './memory';
```

3. Adicionar warning em console (dev only):
```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATED] useMemoryOptimization.ts foi modularizado...');
}
```

### 5.4 Fase 4: Remoção Final

**Objetivo:** Remover arquivo deprecated após período de transição.

**Critérios:**
- Todos os imports atualizados
- Nenhuma referência ao arquivo antigo
- Período de transição de 2 sprints

**Ação Final:**
- Deletar `useMemoryOptimization.deprecated.ts`

---

## 6. Detalhamento dos Módulos

### 6.1 useObjectPool.ts (~60 linhas)

**Responsabilidade:** Integração de ObjectPool com React lifecycle.

**Estrutura:**
- Import: `ObjectPool` de `utils/objectPool`
- Hook: `useObjectPool<T>`
- Retorno: `{ acquire, release, getStats }`

**Padrão:**
- useRef para instância do pool
- useEffect para cleanup
- useCallback para métodos estáveis

### 6.2 useStableCallback.ts (~40 linhas)

**Responsabilidade:** Callbacks estáveis sem deps.

**Padrão:**
- useRef para armazenar callback atual
- useEffect para sincronizar ref
- useCallback vazio (deps: [])

**Uso Típico:** Event handlers que precisam de estado atual.

### 6.3 useStableRef.ts (~30 linhas)

**Responsabilidade:** Referência estável de valor.

**Padrão:**
- useRef para valor
- useEffect para sincronização

**Diferença de useStableCallback:** Retorna ref, não função.

### 6.4 useLatestValue.ts (~40 linhas)

**Responsabilidade:** Getter para valores atuais.

**Padrão:**
- useRef para deps
- useCallback para getter
- Retorno: função que retorna valores atuais

**Uso Típico:** Prevenir closures em callbacks com deps vazias.

### 6.5 useCleanup.ts (~70 linhas)

**Responsabilidade:** Sistema de registro de cleanup functions.

**Estrutura:**
- Map de cleanup functions (key → function)
- Métodos: `register`, `cleanup`, `cleanupAll`
- Auto-cleanup no unmount

**Padrão:**
- useRef para Map
- useCallback para métodos
- useEffect para cleanup automático

### 6.6 useMemoryLeakDetection.ts (~120 linhas)

**Responsabilidade:** Detecção e prevenção de memory leaks.

**Complexidade:** Maior hook do arquivo (94 linhas).

**Estrutura:**
- Sets para tracking: timers, listeners, observers
- Métodos de tracking: `trackTimer`, `trackListener`, `trackObserver`
- Métodos de cleanup: `clearTimer`, `removeListener`, `disconnectObserver`
- Auto-cleanup no unmount

**Padrão:**
- useRef para Sets de tracking
- useCallback para métodos
- useEffect para cleanup com try-catch

**Observação:** Inclui logging em dev mode.

### 6.7 useDeepMemo.ts (~50 linhas)

**Responsabilidade:** Memoização profunda via serialização.

**Padrão:**
- JSON.stringify para comparação
- useRef para valor anterior
- useMemo para memoização

**Trade-off:** Performance de serialização vs re-renders.

### 6.8 useBoundedArray.ts (~50 linhas)

**Responsabilidade:** Limitar tamanho de arrays.

**Estrutura:**
- Recebe: array, setter, maxSize
- Retorna: função para adicionar item
- Lógica: slice automático ao exceder limite

**Padrão:**
- useCallback para função de adição
- Deps: [setArray, maxSize]

### 6.9 useMemoryMonitor.ts (~60 linhas)

**Responsabilidade:** Monitoramento de memória (dev only).

**Estrutura:**
- Refs: renderCount, mountTime
- Logging: a cada 10 renders + unmount
- Condicional: apenas em development

**Padrão:**
- useRef para contadores
- useEffect para logging

---

## 7. Checklist de Validação

### 7.1 Validação Técnica

- [ ] Todos os 9 hooks extraídos para arquivos individuais
- [ ] `index.ts` criado com re-exports completos
- [ ] Compilação TypeScript sem erros
- [ ] Nenhum import quebrado no projeto
- [ ] JSDoc preservado em todos os hooks
- [ ] Tipos genéricos mantidos onde aplicável

### 7.2 Validação de Compatibilidade

- [ ] Imports antigos continuam funcionando via re-exports
- [ ] Testes existentes passam sem modificação
- [ ] Nenhum breaking change introduzido
- [ ] Bundle size não aumentou (verificar tree-shaking)

### 7.3 Validação de Uso

- [ ] 4 arquivos com imports atualizados:
  - [ ] `HistorySidebar.tsx`
  - [ ] `useChatLogic.ts`
  - [ ] `ChatInput.tsx`
  - [ ] `MessageList.tsx`
- [ ] Aplicação funciona normalmente
- [ ] Nenhum erro em console (dev/prod)

### 7.4 Validação de Documentação

- [ ] README criado em `hooks/memory/README.md`
- [ ] Exemplos de uso atualizados
- [ ] Migration guide documentado
- [ ] JSDoc de cada hook revisado

### 7.5 Validação de Testes

- [ ] Testes unitários criados para cada hook
- [ ] Coverage mantido ou aumentado
- [ ] Testes de integração passando

---

## 8. Estimativa de Esforço Detalhada

### 8.1 Fase 1: Preparação (2-3 horas)

| Tarefa | Tempo | Complexidade |
|--------|-------|--------------|
| Criar estrutura de diretórios | 15min | Baixa |
| Extrair `useObjectPool` | 20min | Média (tem dependência) |
| Extrair `useStableCallback` | 15min | Baixa |
| Extrair `useStableRef` | 10min | Baixa |
| Extrair `useLatestValue` | 15min | Baixa |
| Extrair `useCleanup` | 20min | Média |
| Extrair `useMemoryLeakDetection` | 30min | Alta (94 linhas) |
| Extrair `useDeepMemo` | 15min | Baixa |
| Extrair `useBoundedArray` | 15min | Baixa |
| Extrair `useMemoryMonitor` | 20min | Média |
| Criar `index.ts` com re-exports | 15min | Baixa |
| Validação de compilação | 15min | Baixa |

**Total Fase 1:** ~3 horas

### 8.2 Fase 2: Atualização de Imports (1 hora)

| Tarefa | Tempo | Complexidade |
|--------|-------|--------------|
| Atualizar `HistorySidebar.tsx` | 10min | Baixa |
| Atualizar `useChatLogic.ts` | 10min | Baixa |
| Atualizar `ChatInput.tsx` | 10min | Baixa |
| Atualizar `MessageList.tsx` | 10min | Baixa |
| Validação de funcionamento | 20min | Média |

**Total Fase 2:** ~1 hora

### 8.3 Fase 3: Testes (3-4 horas)

| Tarefa | Tempo | Complexidade |
|--------|-------|--------------|
| Testes `useObjectPool` | 30min | Média |
| Testes `useStableCallback` | 20min | Baixa |
| Testes `useStableRef` | 15min | Baixa |
| Testes `useLatestValue` | 20min | Baixa |
| Testes `useCleanup` | 30min | Média |
| Testes `useMemoryLeakDetection` | 45min | Alta |
| Testes `useDeepMemo` | 20min | Baixa |
| Testes `useBoundedArray` | 20min | Baixa |
| Testes `useMemoryMonitor` | 25min | Média |
| Testes de integração | 30min | Média |

**Total Fase 3:** ~4 horas

### 8.4 Fase 4: Documentação (1-2 horas)

| Tarefa | Tempo | Complexidade |
|--------|-------|--------------|
| README do módulo `memory/` | 30min | Média |
| Migration guide | 20min | Baixa |
| Atualizar documentação principal | 20min | Baixa |
| Exemplos de uso | 30min | Média |

**Total Fase 4:** ~2 horas

### 8.5 Fase 5: Deprecação e Remoção (30min)

| Tarefa | Tempo | Complexidade |
|--------|-------|--------------|
| Marcar arquivo como deprecated | 15min | Baixa |
| Adicionar warnings | 10min | Baixa |
| Validação final | 5min | Baixa |

**Total Fase 5:** ~30min

---

## 9. Riscos e Mitigações

### 9.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking changes em imports | Baixa | Alto | Re-exports no index.ts |
| Perda de JSDoc | Baixa | Médio | Copiar JSDoc completo |
| Testes quebrados | Média | Médio | Validação incremental |
| Bundle size aumentado | Baixa | Baixo | Verificar tree-shaking |

### 9.2 Estratégias de Rollback

Se problemas críticos forem encontrados:
1. Reverter commits de modularização
2. Manter arquivo original intacto durante transição
3. Usar feature flag para habilitar/desabilitar nova estrutura

---

## 10. Benefícios Esperados

### 10.1 Manutenibilidade
- **Antes:** 402 linhas em um arquivo
- **Depois:** 9 arquivos com média de 45 linhas cada
- **Ganho:** Navegação 9x mais rápida

### 10.2 Testabilidade
- **Antes:** Testes misturados para 9 hooks
- **Depois:** Testes isolados por hook
- **Ganho:** Coverage mais preciso

### 10.3 Bundle Size
- **Antes:** Import de 402 linhas mesmo usando 1 hook
- **Depois:** Tree-shaking remove hooks não usados
- **Ganho:** ~10-15% redução em bundles que usam poucos hooks

### 10.4 Developer Experience
- **Antes:** Scroll para encontrar hook específico
- **Depois:** Navegação direta via arquivo
- **Ganho:** Produtividade aumentada

---

## 11. Próximos Passos

1. **Aprovação:** Revisar e aprovar este plano
2. **Implementação:** Seguir fases 1-5 sequencialmente
3. **Code Review:** Revisar cada fase antes de prosseguir
4. **Validação:** Executar checklist completo
5. **Deploy:** Merge após validação completa

---

## 12. Referências

- Arquivo Original: [`frontend/src/hooks/useMemoryOptimization.ts`](../../../frontend/src/hooks/useMemoryOptimization.ts:1)
- Dependência: [`frontend/src/utils/objectPool.ts`](../../../frontend/src/utils/objectPool.ts:1)
- Padrão de Modularização: [`docs/STANDARDS.md`](../../STANDARDS.md:1)
- Arquivos Afetados:
  - [`frontend/src/features/chat/components/drawer/HistorySidebar.tsx`](../../../frontend/src/features/chat/components/drawer/HistorySidebar.tsx:26)
  - [`frontend/src/features/chat/hooks/useChatLogic.ts`](../../../frontend/src/features/chat/hooks/useChatLogic.ts:11)
  - [`frontend/src/features/chat/components/input/ChatInput.tsx`](../../../frontend/src/features/chat/components/input/ChatInput.tsx:14)
  - [`frontend/src/features/chat/components/message/MessageList.tsx`](../../../frontend/src/features/chat/components/message/MessageList.tsx:15)

---

**Documento criado em:** 2026-02-07  
**Última atualização:** 2026-02-07  
**Status:** Aguardando Aprovação
