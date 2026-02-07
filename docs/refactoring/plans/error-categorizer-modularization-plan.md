# Plano de Modularização: error-categorizer.ts

## 📋 Objetivo da Modularização

Decompor [`error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:1) (354 linhas) em categorias extensíveis usando **Strategy Pattern**, eliminando a função monolítica `categorizeError` (140+ linhas) e reduzindo complexidade ciclomática de 28 para <5 por módulo.

**Ganhos Esperados:**
- ✅ Extensibilidade: Adicionar nova categoria sem modificar código existente (Open/Closed Principle)
- ✅ Testabilidade: Cada categoria testável isoladamente
- ✅ Manutenibilidade: Lógica de matching separada de sugestões
- ✅ Legibilidade: Redução de 70% no tamanho do arquivo principal

---

## 🔍 Análise de Responsabilidades Atuais

### **Problema Central: categorizeError (linhas 10-172)**
Função monolítica com 140+ linhas contendo:

**10 Categorias de Erro Identificadas:**
1. **UNAVAILABLE** (linhas 18-30) - 9 padrões regex
2. **PERMISSION_ERROR** (linhas 32-43) - 8 padrões regex
3. **AUTHENTICATION_ERROR** (linhas 45-56) - 8 padrões regex
4. **RATE_LIMIT** (linhas 58-70) - 9 padrões regex
5. **TIMEOUT** (linhas 72-81) - 6 padrões regex
6. **CONFIGURATION_ERROR** (linhas 83-96) - 10 padrões regex
7. **PROVISIONING_REQUIRED** (linhas 98-108) - 7 padrões regex
8. **QUALITY_ISSUE** (linhas 110-122) - 9 padrões regex
9. **NETWORK_ERROR** (linhas 124-136) - 9 padrões regex
10. **UNKNOWN_ERROR** (linhas 138-140) - fallback

**Total: 75+ padrões regex espalhados em if/else aninhados**

### **Outros Problemas Identificados:**

**1. Código Duplicado:**
- Padrões de matching repetidos (`.test(errorMessage)`, `.test(errorLower)`)
- Estrutura if/else idêntica para todas as categorias
- Lógica de severidade hardcoded em map (linhas 178-192)

**2. Baixa Coesão:**
- Matching de erros misturado com cálculo de severidade
- Sugestões inline em função separada (linhas 197-264)
- Mensagens amigáveis em outra função (linhas 280-302)

**3. Difícil Extensibilidade:**
- Adicionar nova categoria requer modificar 5 funções diferentes
- Ordem de matching importa (primeiro match vence)
- Sem mecanismo de prioridade explícito

**4. Funções Auxiliares Monolíticas:**
- `getSuggestedActions` (linhas 197-264): 67 linhas com map gigante
- `createUserFriendlyMessage` (linhas 280-302): 22 linhas com map
- `shouldRetry` (linhas 315-331): 16 linhas com map
- `getRetryDelay` (linhas 336-354): 18 linhas com map

---

## 🏗️ Estrutura de Módulos Proposta

```
backend/src/services/ai/certification/errors/
├── ErrorCategorizer.ts (100 linhas)              # Orquestrador com Strategy Pattern
├── types.ts (40 linhas)                          # Interfaces e tipos
├── categories/
│   ├── BaseErrorCategory.ts (60 linhas)          # Classe abstrata base
│   ├── UnavailableCategory.ts (50 linhas)        # Modelo não existe
│   ├── PermissionErrorCategory.ts (50 linhas)    # Sem permissão
│   ├── AuthenticationErrorCategory.ts (50 linhas)# Credenciais inválidas
│   ├── RateLimitCategory.ts (50 linhas)          # Limite de taxa
│   ├── TimeoutCategory.ts (45 linhas)            # Timeout
│   ├── ConfigurationErrorCategory.ts (55 linhas) # Erro de configuração
│   ├── ProvisioningRequiredCategory.ts (50 linhas)# Provisionamento
│   ├── QualityIssueCategory.ts (50 linhas)       # Problema de qualidade
│   ├── NetworkErrorCategory.ts (50 linhas)       # Erro de rede
│   └── UnknownErrorCategory.ts (40 linhas)       # Fallback
├── matchers/
│   ├── RegexMatcher.ts (60 linhas)               # Matching por regex
│   └── ErrorCodeMatcher.ts (50 linhas)           # Matching por código
└── registry/
    └── CategoryRegistry.ts (80 linhas)           # Registro de categorias
```

**Total: ~890 linhas distribuídas em 16 arquivos (vs 354 linhas em 1 arquivo)**

---

## 📐 Interfaces e Contratos (Strategy Pattern)

### **1. types.ts - Interfaces Base**

```typescript
// Interface principal do Strategy Pattern
interface IErrorCategory {
  readonly name: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly priority: number; // Ordem de matching (menor = maior prioridade)
  
  matches(error: string): boolean;
  getSuggestedActions(): string[];
  getUserFriendlyMessage(originalError: string): string;
  isTemporary(): boolean;
  getRetryConfig(): RetryConfig;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
}

interface MatchResult {
  matched: boolean;
  category?: IErrorCategory;
  confidence?: number; // 0-1 para futuras melhorias
}
```

**Responsabilidades:**
- Definir contrato que todas as categorias devem implementar
- Garantir extensibilidade via interface comum
- Suportar priorização de matching

---

### **2. BaseErrorCategory.ts - Classe Abstrata**

```typescript
abstract class BaseErrorCategory implements IErrorCategory {
  abstract readonly name: ErrorCategory;
  abstract readonly severity: ErrorSeverity;
  abstract readonly priority: number;
  
  protected matchers: IMatcher[] = [];
  
  constructor(matchers: IMatcher[]) {
    this.matchers = matchers;
  }
  
  matches(error: string): boolean {
    return this.matchers.some(matcher => matcher.matches(error));
  }
  
  abstract getSuggestedActions(): string[];
  abstract getUserFriendlyMessage(originalError: string): string;
  
  isTemporary(): boolean {
    return false; // Override em categorias temporárias
  }
  
  getRetryConfig(): RetryConfig {
    return { maxRetries: 0, baseDelayMs: 0 }; // Override se retry
  }
}
```

**Responsabilidades:**
- Implementar lógica comum de matching
- Fornecer defaults para métodos opcionais
- Reduzir duplicação entre categorias

---

### **3. IMatcher - Interface de Matching**

```typescript
interface IMatcher {
  matches(error: string): boolean;
}

class RegexMatcher implements IMatcher {
  constructor(
    private patterns: RegExp[],
    private caseSensitive: boolean = false
  ) {}
  
  matches(error: string): boolean {
    const text = this.caseSensitive ? error : error.toLowerCase();
    return this.patterns.some(pattern => pattern.test(text));
  }
}

class ErrorCodeMatcher implements IMatcher {
  constructor(private codes: string[]) {}
  
  matches(error: string): boolean {
    return this.codes.some(code => error.includes(code));
  }
}
```

**Responsabilidades:**
- Encapsular lógica de matching
- Suportar diferentes estratégias (regex, código, etc)
- Reutilizável entre categorias

---

### **4. Exemplo de Categoria Concreta**

```typescript
// categories/RateLimitCategory.ts
export class RateLimitCategory extends BaseErrorCategory {
  readonly name = ErrorCategory.RATE_LIMIT;
  readonly severity = ErrorSeverity.MEDIUM;
  readonly priority = 40; // Matching médio
  
  constructor() {
    super([
      new RegexMatcher([
        /ThrottlingException/i,
        /rate limit/i,
        /too many requests/i,
        /quota exceeded/i,
        /throttling/i,
        /too many tokens/i,
        /request limit/i,
        /TooManyRequestsException/i
      ]),
      new ErrorCodeMatcher(['429'])
    ]);
  }
  
  getSuggestedActions(): string[] {
    return [
      'Aguardar alguns minutos e tentar novamente',
      'Sistema fará retry automático (3 tentativas)',
      'Considerar solicitar aumento de quota na AWS',
      'Espaçar certificações em lote'
    ];
  }
  
  getUserFriendlyMessage(): string {
    return 'Limite de taxa excedido - tente novamente em alguns minutos';
  }
  
  isTemporary(): boolean {
    return true;
  }
  
  getRetryConfig(): RetryConfig {
    return { maxRetries: 3, baseDelayMs: 2000 }; // 2s, 4s, 8s
  }
}
```

---

### **5. CategoryRegistry.ts - Registro de Categorias**

```typescript
export class CategoryRegistry {
  private categories: IErrorCategory[] = [];
  
  register(category: IErrorCategory): void {
    this.categories.push(category);
    // Ordenar por prioridade (menor = maior prioridade)
    this.categories.sort((a, b) => a.priority - b.priority);
  }
  
  findMatch(error: string): MatchResult {
    for (const category of this.categories) {
      if (category.matches(error)) {
        return { matched: true, category };
      }
    }
    return { matched: false };
  }
  
  getAllCategories(): IErrorCategory[] {
    return [...this.categories];
  }
}
```

**Responsabilidades:**
- Gerenciar lista de categorias disponíveis
- Ordenar por prioridade automaticamente
- Fornecer API para matching

---

### **6. ErrorCategorizer.ts - Orquestrador**

```typescript
export class ErrorCategorizer {
  private registry: CategoryRegistry;
  private unknownCategory: IErrorCategory;
  
  constructor() {
    this.registry = new CategoryRegistry();
    this.initializeCategories();
  }
  
  private initializeCategories(): void {
    // Registrar categorias em ordem de prioridade
    this.registry.register(new UnavailableCategory());
    this.registry.register(new PermissionErrorCategory());
    this.registry.register(new AuthenticationErrorCategory());
    this.registry.register(new ConfigurationErrorCategory());
    this.registry.register(new ProvisioningRequiredCategory());
    this.registry.register(new RateLimitCategory());
    this.registry.register(new TimeoutCategory());
    this.registry.register(new QualityIssueCategory());
    this.registry.register(new NetworkErrorCategory());
    
    this.unknownCategory = new UnknownErrorCategory();
  }
  
  categorize(error: Error | string): CategorizedError {
    const startTime = Date.now();
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    const matchResult = this.registry.findMatch(errorMessage);
    const category = matchResult.category || this.unknownCategory;
    
    const result: CategorizedError = {
      category: category.name,
      severity: category.severity,
      message: category.getUserFriendlyMessage(errorMessage),
      originalError: errorMessage,
      suggestedActions: category.getSuggestedActions(),
      isTemporary: category.isTemporary()
    };
    
    const elapsedMs = Date.now() - startTime;
    if (elapsedMs > 1) {
      logger.warn(`Error categorization took ${elapsedMs}ms`, { category: category.name });
    }
    
    return result;
  }
}

// API pública (mantém compatibilidade)
const categorizer = new ErrorCategorizer();
export const categorizeError = (error: Error | string) => categorizer.categorize(error);
```

**Responsabilidades:**
- Orquestrar processo de categorização
- Manter compatibilidade com API existente
- Logging e performance monitoring

---

## 🔄 Priorização de Matching

**Ordem de Prioridade (menor = maior prioridade):**

| Prioridade | Categoria | Razão |
|------------|-----------|-------|
| 10 | UNAVAILABLE | Modelo não existe - mais específico |
| 20 | PERMISSION_ERROR | Sem permissão - crítico |
| 25 | AUTHENTICATION_ERROR | Credenciais - crítico |
| 30 | CONFIGURATION_ERROR | Configuração - pode sobrepor outros |
| 35 | PROVISIONING_REQUIRED | Provisionamento - específico |
| 40 | RATE_LIMIT | Rate limit - temporário |
| 45 | TIMEOUT | Timeout - temporário |
| 50 | QUALITY_ISSUE | Qualidade - modelo funciona |
| 60 | NETWORK_ERROR | Rede - genérico |
| 999 | UNKNOWN_ERROR | Fallback - última opção |

---

## 🚀 Estratégia de Migração

### **Fase 1: Criar Infraestrutura Base**
**Arquivos:** `types.ts`, `BaseErrorCategory.ts`, `matchers/`

1. Criar interfaces `IErrorCategory`, `IMatcher`, `RetryConfig`
2. Implementar `BaseErrorCategory` com lógica comum
3. Implementar `RegexMatcher` e `ErrorCodeMatcher`
4. Testes unitários dos matchers

**Validação:**
- [ ] Matchers funcionam com padrões existentes
- [ ] BaseErrorCategory compila sem erros

---

### **Fase 2: Migrar Categorias Críticas (UNAVAILABLE, PERMISSION, AUTH)**
**Arquivos:** `categories/UnavailableCategory.ts`, `PermissionErrorCategory.ts`, `AuthenticationErrorCategory.ts`

1. Criar classes concretas para 3 categorias críticas
2. Migrar padrões regex existentes
3. Migrar sugestões e mensagens
4. Testes unitários de cada categoria

**Validação:**
- [ ] Matching funciona igual ao código original
- [ ] Sugestões idênticas às originais
- [ ] Testes cobrem todos os padrões regex

---

### **Fase 3: Migrar Categorias Temporárias (RATE_LIMIT, TIMEOUT, NETWORK)**
**Arquivos:** `categories/RateLimitCategory.ts`, `TimeoutCategory.ts`, `NetworkErrorCategory.ts`

1. Criar classes com `isTemporary() = true`
2. Implementar `getRetryConfig()` com delays corretos
3. Migrar padrões e sugestões
4. Testes de retry logic

**Validação:**
- [ ] Retry config correto (maxRetries, baseDelayMs)
- [ ] `isTemporary()` retorna true
- [ ] Backoff exponencial funciona

---

### **Fase 4: Migrar Categorias Restantes**
**Arquivos:** `categories/ConfigurationErrorCategory.ts`, `ProvisioningRequiredCategory.ts`, `QualityIssueCategory.ts`, `UnknownErrorCategory.ts`

1. Criar classes restantes
2. Migrar padrões e sugestões
3. Testes unitários

**Validação:**
- [ ] Todas as 10 categorias implementadas
- [ ] Cobertura de testes >90%

---

### **Fase 5: Criar Registry e Orquestrador**
**Arquivos:** `registry/CategoryRegistry.ts`, `ErrorCategorizer.ts`

1. Implementar `CategoryRegistry` com ordenação por prioridade
2. Implementar `ErrorCategorizer` com API pública
3. Manter função `categorizeError` para compatibilidade
4. Testes de integração

**Validação:**
- [ ] Priorização funciona corretamente
- [ ] API pública mantém compatibilidade
- [ ] Performance <1ms mantida

---

### **Fase 6: Migrar Funções Auxiliares**
**Funções:** `isModelAvailable`, `shouldRetry`, `getRetryDelay`

1. Mover lógica para métodos das categorias
2. Criar funções auxiliares que delegam para categorias
3. Testes de compatibilidade

**Validação:**
- [ ] `isModelAvailable` funciona igual
- [ ] `shouldRetry` funciona igual
- [ ] `getRetryDelay` funciona igual

---

### **Fase 7: Substituir Arquivo Original**
**Arquivo:** `error-categorizer.ts`

1. Atualizar imports em arquivos que usam `categorizeError`
2. Deprecar arquivo original (comentar com @deprecated)
3. Testes E2E do sistema de certificação
4. Remover arquivo original após validação

**Validação:**
- [ ] Todos os imports atualizados
- [ ] Sistema de certificação funciona
- [ ] Nenhum teste quebrado

---

## ✅ Checklist de Validação

### **Funcionalidade:**
- [ ] Todas as 10 categorias funcionam
- [ ] Matching idêntico ao código original
- [ ] Sugestões idênticas às originais
- [ ] Mensagens amigáveis idênticas
- [ ] Retry logic funciona (maxRetries, delays)
- [ ] `isTemporary()` correto para cada categoria
- [ ] `isModelAvailable()` funciona
- [ ] Performance <1ms mantida

### **Extensibilidade:**
- [ ] Adicionar nova categoria não requer modificar código existente
- [ ] Apenas criar nova classe e registrar
- [ ] Priorização automática funciona
- [ ] Matchers reutilizáveis

### **Qualidade:**
- [ ] Complexidade ciclomática <5 por módulo
- [ ] Cobertura de testes >90%
- [ ] Sem código duplicado
- [ ] Cada categoria testável isoladamente
- [ ] Documentação atualizada

### **Compatibilidade:**
- [ ] API pública mantida (`categorizeError`)
- [ ] Nenhum breaking change
- [ ] Todos os testes existentes passam
- [ ] Sistema de certificação funciona

---

## 🎯 Resultado Final Esperado

**Antes:**
- 1 arquivo de 354 linhas
- Função de 140+ linhas
- Complexidade ciclomática: 28
- 75+ padrões regex espalhados
- Extensibilidade: Baixa (modificar 5 funções)

**Depois:**
- 16 arquivos especializados
- Maior classe: ~60 linhas
- Complexidade ciclomática: <5 por módulo
- Padrões regex encapsulados por categoria
- Extensibilidade: Alta (criar nova classe + registrar)
- Testabilidade: Alta (cada categoria isolada)

---

## 📊 Benefícios do Strategy Pattern

### **1. Open/Closed Principle**
- ✅ Aberto para extensão (nova categoria = nova classe)
- ✅ Fechado para modificação (não toca código existente)

### **2. Single Responsibility**
- ✅ Cada categoria responsável por seu matching
- ✅ Cada categoria responsável por suas sugestões
- ✅ Registry responsável por orquestração

### **3. Testabilidade**
- ✅ Testar categoria isoladamente
- ✅ Mock de matchers em testes
- ✅ Testar priorização separadamente

### **4. Manutenibilidade**
- ✅ Modificar categoria sem afetar outras
- ✅ Adicionar padrão regex em um único lugar
- ✅ Código auto-documentado (classe = categoria)

---

## 📚 Referências

- Arquivo original: [`error-categorizer.ts`](backend/src/services/ai/certification/error-categorizer.ts:1)
- Tipos: [`types.ts`](backend/src/services/ai/certification/types.ts:1)
- Standards: [`docs/STANDARDS.md`](docs/STANDARDS.md:1)
- Strategy Pattern: [Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
