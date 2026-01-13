# 📋 TODO - MyIA

## 🐛 Bugs Corrigidos (Sessão Atual - 2025-01-13)

### ✅ 1. JWT Payload Incompatível (CRÍTICO)
**Problema:** Token gerado com `userId`, middleware esperava `id`
```typescript
// jwt.ts gerava: { userId: "...", email: "..." }
// authMiddleware.ts lia: decoded.id ❌
```
**Solução:** Interface `TokenPayload` corrigida para usar `userId`

### ✅ 2. Race Condition no localStorage (CRÍTICO)
**Problema:** `chatService` lia token antes do `AuthContext` terminar de salvar
```typescript
localStorage.setItem('token', token); // Síncrono
const t = localStorage.getItem('token'); // null (batch de updates)
```
**Solução:** Delay de 50ms após salvar token

### ✅ 3. Rate Limit por Múltiplas Validações (CRÍTICO)
**Problema:** React StrictMode montava `AuthProvider` 4x = 8 requisições `/auth/me` → 429
```typescript
useEffect(() => fetchUser(), []); // Sem proteção
```
**Solução:** Flag `isValidatingRef` + tratamento especial para erro 429

### ✅ 4. JSend Inconsistente (MÉDIO)
**Problema:** 60% das rotas usavam JSend, 40% não
**Solução:** Migração 100% + helper `jsend.ts` + rate limiter atualizado

---

## 🔥 Crítico (Fazer Agora)

### 1. Adicionar Error Boundaries (1h)
- [ ] Criar `/components/ErrorBoundary.tsx`
- [ ] Envolver `<App>` com ErrorBoundary
- [ ] Envolver `<ChatPage>` com ErrorBoundary
- [ ] Envolver `<AuditPage>` com ErrorBoundary

### 2. Limitar logs do DevConsole (15min)
- [ ] Modificar `DevConsole.tsx` para limitar logs a 50 entradas
```typescript
setDebugLogs(prev => [...prev.slice(-50), chunk.log]);
```

### 3. Adicionar testes básicos (4h)
- [ ] Instalar: `vitest` + `@testing-library/react`
- [ ] Testar: `useChatLogic`
- [ ] Testar: `useAuditLoader`
- [ ] Testar: `AuthContext`

---

## 🚀 Importante (Próximas Sprints)

### 4. Virtualização de mensagens (2h)
- [ ] `npm install react-virtuoso`
- [ ] Implementar em `MessageList.tsx`
- [ ] Testar com 100+ mensagens

### 5. Otimizar bundle (3h)
- [ ] Analisar: `npm run build -- --analyze`
- [ ] Lazy load: `AuditPage`
- [ ] Lazy load: `PromptTrace`
- [ ] Lazy load: `Settings`

### 6. Melhorar acessibilidade (3h)
- [ ] Adicionar `aria-label` em todos os `IconButton`
- [ ] Testar navegação por teclado (Tab, Shift+Tab)
- [ ] Adicionar `role="status"` em loading states
- [ ] Testar com leitor de tela

---

## 🐛 Bugs para Corrigir

### 7. Race Condition no Chat
**Arquivo:** `useChatLogic.ts` (linha ~150)
```typescript
// Problema: Se o usuário enviar 2 mensagens rápido, newChatIdRef pode ser sobrescrito
newChatIdRef.current = chunk.metrics.chatId;
```
- [ ] Implementar fila de mensagens
- [ ] Adicionar lock durante envio

### 8. Memory Leak no DevConsole
**Arquivo:** `DevConsole.tsx`
```typescript
// Problema: logs crescem infinitamente
setDebugLogs(prev => [...prev, chunk.log]);
```
- [ ] Já coberto no item #2

### 9. Infinite Loop Risk
**Arquivo:** `LayoutContext.tsx`
```typescript
// Problema: syncChatHistory pode causar re-renders infinitos
// se a comparação JSON falhar (objetos com ordem diferente)
```
- [ ] Usar `useMemo` com deep comparison
- [ ] Ou usar biblioteca como `fast-deep-equal`

---

## 🔧 Refatorações

### 10. Quebrar `useChatLogic.ts` (2h)
**Problema:** 200+ linhas em um único hook
- [ ] Criar `useChatSender.ts`
- [ ] Criar `useChatLoader.ts`
- [ ] Criar `useChatState.ts`

### 11. Reorganizar componentes (1h)
- [ ] Mover `MarkdownRenderer.tsx` para `/message`
- [ ] Padronizar estrutura de pastas

### 12. Unificar tipos duplicados (1h)
**Problema:** `Message` definido em 3 lugares
- [ ] Criar `/types/shared.ts`
- [ ] Consolidar tipos: `Message`, `Chat`, `User`
- [ ] Remover duplicações

---

## 💡 Nice to Have (Backlog)

### 13. Offline Support
- [ ] Service Worker para cache de assets
- [ ] IndexedDB para mensagens offline
- [ ] Sincronização ao reconectar

### 14. Internacionalização (i18n)
- [ ] Instalar `react-i18next`
- [ ] Criar arquivos de tradução (EN/PT)
- [ ] Adicionar seletor de idioma

### 15. Storybook
- [ ] Instalar Storybook
- [ ] Documentar componentes reutilizáveis
- [ ] Criar stories para: `MessageBubble`, `ChatInput`, `Sidebar`

### 16. Otimizar dependências
- [ ] Avaliar se `recharts` pode ser substituído por `@mui/x-charts`
- [ ] Verificar se `tiktoken` está sendo usado (não encontrado no código)
- [ ] Remover dependências não utilizadas

### 17. Padronizar JSend (4h) - ✅ CONCLUÍDO
**Problema:** 60% das rotas usavam JSend, 40% não (inconsistência)
- [x] Criar helper `jsend.success()`, `jsend.fail()`, `jsend.error()`
- [x] Migrar `auditController.ts` (5 ocorrências)
- [x] Migrar `analyticsController.ts` (1 ocorrência)
- [x] Migrar `userSettingsController.ts` (4 ocorrências)
- [x] Migrar `aiController.ts` (3 ocorrências)
- [x] Atualizar frontend (5 services)
- [x] Ver relatório completo: `docs/JSEND-REPORT.md`

---

## 📊 Métricas Atuais

| Métrica | Valor | Status |
|---------|-------|--------|
| **Linhas de Código** | ~8.000 | 🟢 Saudável |
| **Componentes** | ~60 | 🟢 Modular |
| **Contexts** | 5 | 🟢 Organizado |
| **Cobertura de Testes** | 0% (frontend) | 🔴 Crítico |
| **Bundle Size** | ~800KB (estimado) | 🟡 Otimizável |
| **Lighthouse Score** | Não medido | ⚪ Desconhecido |

---

## 🎯 Meta: Próxima Sprint

**Objetivo:** Resolver todos os itens **Críticos** (#1-3)

**Tempo estimado:** 5h 15min

**Resultado esperado:**
- ✅ Aplicação não quebra em caso de erro (Error Boundaries)
- ✅ DevConsole não causa memory leak
- ✅ Cobertura de testes > 30%

---

## 🛡️ Padrões de Segurança (Aprendizados)

### 📜 Template para Contexts Seguros
```typescript
// Evita race conditions e rate limiting
export const SafeContext = ({ children }) => {
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    // Proteção contra múltiplas execuções (StrictMode)
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    fetchData()
      .catch(err => {
        // Não falha em rate limit
        if (err.response?.status === 429) {
          console.warn('Rate limit, ignorando...');
          return;
        }
        throw err;
      })
      .finally(() => isFetchingRef.current = false);
  }, []);
};
```

### ✅ Checklist de Prevenção
- [ ] **JWT Payloads:** Interfaces alinhadas entre geração e validação
- [ ] **localStorage:** Nunca ler imediatamente após escrever (usar state)
- [ ] **useEffect:** Sempre proteger com `useRef` flag em contexts
- [ ] **Rate Limit:** Tratar erro 429 sem deslogar usuário
- [ ] **Contexts:** Evitar `JSON.stringify` para comparações (usar `deep-equal`)

### 🔍 Lugares com Risco Similar
| Arquivo | Risco | Severidade | Status |
|---------|-------|------------|--------|
| `AuthContext.tsx` | Múltiplas validações | 🔴 Crítico | ✅ Corrigido |
| `ThemeContext.tsx` | Múltiplas requisições | 🟢 Baixo | ✅ OK (useCallback) |
| `LayoutContext.tsx` | `syncChatHistory` JSON | 🟡 Médio | ⚠️ Monitorar |
| `chatService.ts` | Token null | 🔴 Crítico | ✅ Corrigido |
| `useChatLogic.ts` | `newChatIdRef` race | 🟡 Médio | ⚠️ Revisar |

---

## 🚨 Testes Recomendados (Backlog)

### 17. Suite de Testes de Race Conditions
- [ ] Simular 10 requisições simultâneas de login
- [ ] Testar navegação rápida entre rotas protegidas
- [ ] Verificar comportamento com React StrictMode ativado
- [ ] Testar localStorage em múltiplas abas

### 18. Testes de Rate Limiting
- [ ] Verificar se erro 429 não desloga usuário
- [ ] Testar retry automático após rate limit
- [ ] Validar logs de rate limit no backend

---

**Nota geral atual: 8.5/10** 🌟

**Nota esperada após sprint: 9.0/10** 🚀
