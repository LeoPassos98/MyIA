## 5. Riscos e Mitigações (continuação)

#### Risco 1: Breaking Changes na API Pública
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Descrição:** Modificações podem quebrar código que depende de `ModelCertificationService`

**Mitigação:**
- ✅ Manter assinatura de todos os métodos públicos
- ✅ Não modificar tipos exportados em `types.ts`
- ✅ Validar com testes de integração existentes
- ✅ Implementar em fases com validação contínua
- ✅ Usar pattern Facade para manter interface consistente

**Validação:**
```bash
# Verificar que API pública não mudou
git diff backend/src/services/ai/certification/index.ts
# Executar testes de integração
npm test -- certification-queue
```

---

#### Risco 2: Perda de Contexto em Logs
**Probabilidade:** Média  
**Impacto:** Médio  
**Descrição:** Logs podem perder contexto ao distribuir lógica entre módulos

**Mitigação:**
- ✅ Propagar `requestId` para todos os sub-services
- ✅ Manter logging estruturado ([Seção 13](../docs/STANDARDS.md:660))
- ✅ Adicionar prefixos de módulo nos logs (ex: `[CacheManager]`)
- ✅ Preservar logs existentes durante refatoração

**Exemplo:**
```typescript
// cache-manager.ts
logger.info('[CacheManager] Verificando cache', {
  requestId,
  modelId,
  region
});
```

---

#### Risco 3: Degradação de Performance
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Descrição:** Overhead de chamadas entre módulos pode impactar performance

**Mitigação:**
- ✅ Evitar chamadas desnecessárias ao banco
- ✅ Manter cache em memória quando apropriado
- ✅ Não adicionar camadas de abstração excessivas
- ✅ Validar performance com benchmarks

**Validação:**
```bash
# Executar benchmark antes e depois
npx tsx scripts/analysis/benchmark-logger.ts
```

---

#### Risco 4: Complexidade de Testes
**Probabilidade:** Média  
**Impacto:** Baixo  
**Descrição:** Mais módulos = mais testes para manter

**Mitigação:**
- ✅ Criar testes unitários para cada módulo
- ✅ Manter testes de integração existentes
- ✅ Usar mocks para isolar dependências
- ✅ Documentar casos de teste críticos

**Cobertura Mínima:**
- Cache Manager: 90%
- Status Determiner: 95% (lógica crítica)
- Metrics Calculator: 90%
- Repository: 80%
- Queries: 80%

---

#### Risco 5: Inconsistência com CertificationQueueService
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Descrição:** Fila pode quebrar se interface mudar

**Mitigação:**
- ✅ Não modificar métodos chamados pela fila:
  - `certifyModel()`
  - `getCachedCertification()`
- ✅ Validar integração com worker
- ✅ Executar testes de fila após cada fase

**Validação:**
```bash
# Testar worker de certificação
npx tsx scripts/certification/test-worker.ts
# Testar fila básica
npx tsx scripts/certification/test-queue-basic.ts
```

---

### 5.2 Plano de Rollback

Caso algo dê errado durante a refatoração:

#### Rollback Fase 1 (Preparação)
- **Ação:** Deletar novos arquivos criados
- **Impacto:** Zero (arquivo original intacto)
- **Tempo:** < 5 minutos

#### Rollback Fase 2 (Refatoração)
- **Ação:** `git revert` do commit de refatoração
- **Impacto:** Retorna ao estado anterior
- **Tempo:** < 10 minutos
- **Validação:** Executar suite de testes

#### Rollback Fase 3 (Validação)
- **Ação:** Não aplicável (apenas validação)
- **Impacto:** N/A

---

## 6. Checklist de Implementação

### Fase 1: Preparação ✅

- [ ] Criar estrutura de diretórios
- [ ] Implementar `cache/cache-manager.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `orchestration/vendor-test-selector.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `orchestration/test-orchestrator.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `status/metrics-calculator.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `status/status-determiner.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `persistence/certification-repository.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila
- [ ] Implementar `queries/certification-queries.ts`
  - [ ] Código implementado
  - [ ] Testes unitários criados
  - [ ] ESLint passa
  - [ ] TypeScript compila

### Fase 2: Refatoração ✅

- [ ] Refatorar `certifyModel()` - Cache
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Refatorar `certifyModel()` - Testes
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Refatorar `certifyModel()` - Métricas
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Refatorar `certifyModel()` - Status
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Refatorar `certifyModel()` - Persistência
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Refatorar métodos de consulta
  - [ ] Código refatorado
  - [ ] Testes existentes passam
  - [ ] Logs preservados
- [ ] Remover método privado `getTestsForVendor()`
  - [ ] Código removido
  - [ ] Testes existentes passam

### Fase 3: Validação Final ✅

- [ ] Suite completa de testes passa
- [ ] Integração com fila funciona
- [ ] Testes de integração passam
- [ ] Tamanho dos arquivos validado
  - [ ] `certification.service.ts` ≤ 250 linhas
  - [ ] Todos os módulos ≤ 150 linhas
- [ ] ESLint passa (0 errors)
- [ ] TypeScript compila (0 errors)
- [ ] Performance validada (sem degradação)
- [ ] Logs estruturados preservados
- [ ] Documentação atualizada

---

## 7. Métricas de Sucesso

### 7.1 Métricas Quantitativas

| Métrica | Antes | Meta | Validação |
|---------|-------|------|-----------|
| **Linhas em certification.service.ts** | 791 | ≤250 | ✅ Análise de arquivo |
| **Número de responsabilidades** | 7 | 1 (orquestração) | ✅ Code review |
| **Complexidade ciclomática** | ~45 | ≤15 | ✅ ESLint complexity |
| **Cobertura de testes** | 75% | ≥85% | ✅ Jest coverage |
| **Tempo de execução de testes** | ~5s | ≤7s | ✅ Benchmark |

### 7.2 Métricas Qualitativas

- ✅ **Manutenibilidade:** Código mais fácil de entender e modificar
- ✅ **Testabilidade:** Módulos isolados facilitam testes unitários
- ✅ **Reusabilidade:** Componentes podem ser reutilizados
- ✅ **Documentação:** Cada módulo tem responsabilidade clara
- ✅ **Conformidade:** Segue [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

---

## 8. Dependências e Pré-requisitos

### 8.1 Dependências Técnicas

- ✅ Node.js >= 18.x
- ✅ TypeScript >= 5.x
- ✅ Prisma >= 5.x
- ✅ Jest >= 29.x
- ✅ ESLint configurado

### 8.2 Conhecimento Necessário

- ✅ TypeScript avançado (classes, interfaces, generics)
- ✅ Padrões de design (Facade, Repository, Strategy)
- ✅ Prisma ORM
- ✅ Jest (testes unitários e mocks)
- ✅ Logging estruturado ([Seção 13](../docs/STANDARDS.md:660))

### 8.3 Arquivos que NÃO Devem Ser Modificados

- ❌ `test-runner.ts` (já modularizado)
- ❌ `error-categorizer.ts` (já modularizado)
- ❌ `types.ts` (tipos públicos)
- ❌ `test-specs/*.spec.ts` (especificações de teste)
- ❌ `__tests__/*.test.ts` (testes existentes)

---

## 9. Próximos Passos

### Imediato (Após Aprovação do Plano)

1. **Criar branch de feature**
   ```bash
   git checkout -b refactor/certification-service-modularization
   ```

2. **Iniciar Fase 1 (Preparação)**
   - Criar estrutura de diretórios
   - Implementar primeiro módulo (`cache-manager.ts`)
   - Validar com testes

3. **Commit incremental**
   ```bash
   git commit -m "feat: add CertificationCacheManager module"
   ```

### Médio Prazo (Durante Implementação)

1. Implementar todos os módulos da Fase 1
2. Validar cada módulo individualmente
3. Iniciar Fase 2 (Refatoração)
4. Validar continuamente

### Longo Prazo (Após Conclusão)

1. Documentar lições aprendidas
2. Aplicar padrão similar a outros services grandes
3. Atualizar guias de desenvolvimento
4. Compartilhar conhecimento com equipe

---

## 10. Referências

### Documentação do Projeto

- [STANDARDS.md](../docs/STANDARDS.md) - Padrões de desenvolvimento
- [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) - Tamanho de arquivos
- [STANDARDS.md Seção 13](../docs/STANDARDS.md:660) - Logging estruturado
- [MODEL-RATING-SYSTEM.md](../backend/docs/MODEL-RATING-SYSTEM.md) - Sistema de rating

### Arquivos Relacionados

- [`certification.service.ts`](../backend/src/services/ai/certification/certification.service.ts) - Arquivo a ser refatorado
- [`test-runner.ts`](../backend/src/services/ai/certification/test-runner.ts) - Já modularizado
- [`error-categorizer.ts`](../backend/src/services/ai/certification/error-categorizer.ts) - Já modularizado
- [`rating-calculator.ts`](../backend/src/services/ai/rating/rating-calculator.ts) - Sistema de rating

### Padrões de Design

- **Facade Pattern:** `ModelCertificationService` como fachada
- **Repository Pattern:** `CertificationRepository` para persistência
- **Strategy Pattern:** `VendorTestSelector` para seleção de testes
- **Single Responsibility Principle:** Cada módulo tem uma responsabilidade

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| **Certification** | Processo de validação de um modelo de IA |
| **Cache Hit** | Resultado encontrado em cache (não executa testes) |
| **Cache Miss** | Resultado não encontrado em cache (executa testes) |
| **Success Rate** | Percentual de testes que passaram |
| **Quality Warning** | Status para modelos com 60-79% de sucesso |
| **Critical Error** | Erro que impede uso do modelo (UNAVAILABLE, PERMISSION_ERROR, etc) |
| **Rating** | Classificação 0-5 estrelas baseada em métricas |
| **Badge** | Rótulo visual (PREMIUM, RECOMENDADO, etc) |
| **SSE** | Server-Sent Events (feedback em tempo real) |
| **Facade Pattern** | Padrão que fornece interface simplificada para subsistema complexo |

---

## 12. Conclusão

Este plano de modularização foi cuidadosamente elaborado para:

✅ **Reduzir** [`certification.service.ts`](../backend/src/services/ai/certification/certification.service.ts) de 791 para ~150 linhas  
✅ **Manter** compatibilidade 100% com API existente (zero breaking changes)  
✅ **Preservar** integração com CertificationQueueService  
✅ **Seguir** rigorosamente [STANDARDS.md](../docs/STANDARDS.md)  
✅ **Melhorar** manutenibilidade, testabilidade e reusabilidade  
✅ **Documentar** cada etapa com validações claras  

### Benefícios Esperados

1. **Código mais limpo:** Cada módulo tem responsabilidade única
2. **Testes mais fáceis:** Módulos isolados facilitam testes unitários
3. **Manutenção simplificada:** Mudanças localizadas em módulos específicos
4. **Onboarding mais rápido:** Novos desenvolvedores entendem código mais facilmente
5. **Conformidade:** Atende [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

### Próximo Passo

Aguardando aprovação para iniciar implementação em modo **Code**.

---

**Autor:** Kilo Code (Architect Mode)  
**Data:** 2026-02-07  
**Versão:** 1.0  
**Status:** 🟡 Aguardando Aprovação
