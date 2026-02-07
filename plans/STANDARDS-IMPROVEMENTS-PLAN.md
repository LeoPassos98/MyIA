# 📋 Plano de Melhorias do STANDARDS.md

> **Data:** 2026-02-07
> **Status:** Em Progresso
> **Prioridade:** Alta
> **Última Atualização:** 2026-02-07

---

## 📊 Status de Implementação

| # | Plano | Status | Versão |
|---|-------|--------|--------|
| 1 | Formato Curto de Header | ✅ Implementado | v2.1.0 |
| 2 | Proibir Arquivos .backup | 📋 Planejado | - |
| 3 | Estrutura de Features Frontend | 📋 Planejado | - |
| 4 | Padrão de Services Frontend | 📋 Planejado | - |
| 5 | Resolver Violações de console.log | 📋 Planejado | - |
| 6 | Seção de Mappers | ✅ Implementado | v2.1.0 |
| 7 | Seção de Testes | ✅ Implementado | v2.1.0 |

---

## 📑 Índice

1. [Plano 1: Formato Curto de Header para Scripts](#plano-1-formato-curto-de-header-para-scripts) ✅
2. [Plano 2: Proibir Arquivos .backup no Git](#plano-2-proibir-arquivos-backup-no-git)
3. [Plano 3: Estrutura de Features Frontend](#plano-3-estrutura-de-features-frontend)
4. [Plano 4: Padrão de Services Frontend](#plano-4-padrão-de-services-frontend)
5. [Plano 5: Resolver Violações de console.log](#plano-5-resolver-violações-de-consolelog)
6. [Plano 6: Seção de Mappers](#plano-6-seção-de-mappers) ✅
7. [Plano 7: Seção de Testes](#plano-7-seção-de-testes) ✅
8. [Plano Futuro: Workers, Streaming, Scripts e Assets](#plano-futuro-workers-streaming-scripts-e-assets)

---

## Plano 1: Formato Curto de Header para Scripts ✅

> **Status:** ✅ Implementado em v2.1.0

### Problema
Scripts em `scripts/` usam formato curto (`// Standards: docs/STANDARDS.md`) mas STANDARDS.md exige formato longo.

### Solução
Adicionar exceção na **Seção 1.2** do STANDARDS.md.

### Implementação
Adicionado na Seção 1.2 do STANDARDS.md:
- Formato Completo para arquivos de produção
- Formato Curto para scripts, seeds, migrations, testes e configs

### Alteração Aplicada

```markdown
### 1.2 Referência aos Padrões

Logo abaixo do caminho, deve haver a referência a este documento:

**Formato Completo (Arquivos de Produção):**
```typescript
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
```

**Formato Curto (Scripts e Utilitários):**
```typescript
// Standards: docs/STANDARDS.md
```

**Quando usar formato curto:**
- Scripts em `scripts/`
- Arquivos de seed/migration
- Arquivos de configuração
- Arquivos de teste
```

### Esforço
- **Linhas a adicionar:** ~15
- **Complexidade:** Baixa
- **Impacto:** Nenhum código precisa mudar

---

## Plano 2: Proibir Arquivos .backup no Git

### Problema
Existem arquivos `.backup` no repositório (ex: `bedrock.ts.backup`, `providersController.ts.backup`).

### Solução
1. Adicionar regra no STANDARDS.md
2. Atualizar `.gitignore`
3. Remover arquivos existentes

### Alteração no STANDARDS.md (Seção 12)

```markdown
### 12.6 Arquivos Proibidos no Repositório

**Arquivos que NÃO devem ser commitados:**

| Padrão | Motivo | Alternativa |
|--------|--------|-------------|
| `*.backup` | Poluição do repositório | Usar branches ou stash |
| `*.bak` | Poluição do repositório | Usar branches ou stash |
| `*.old` | Poluição do repositório | Usar branches ou stash |
| `*.orig` | Arquivo de merge | Resolver conflitos e deletar |

**Regra:** Use `git stash` ou branches para preservar código temporariamente.

```bash
# ❌ PROIBIDO
cp arquivo.ts arquivo.ts.backup
git add arquivo.ts.backup

# ✅ CORRETO
git stash push -m "backup antes de refatorar"
# ou
git checkout -b backup/feature-x
```
```

### Alteração no .gitignore

```gitignore
# Arquivos de backup
*.backup
*.bak
*.old
*.orig
```

### Ações de Limpeza

```bash
# Listar arquivos .backup existentes
find . -name "*.backup" -type f

# Remover do git (manter local)
git rm --cached **/*.backup

# Ou remover completamente
rm backend/src/controllers/providersController.ts.backup
rm backend/src/controllers/certificationQueueController.ts.backup
rm backend/src/services/ai/providers/bedrock.ts.backup
# ... etc
```

### Esforço
- **Linhas a adicionar no STANDARDS.md:** ~20
- **Arquivos a remover:** ~5-10
- **Complexidade:** Baixa

---

## Plano 3: Estrutura de Features Frontend

### Problema
Seção 5 menciona separação View/Logic mas não documenta estrutura de features.

### Solução
Adicionar **Seção 5.4** com estrutura padrão.

### Alteração Proposta

```markdown
### 5.4 Estrutura de Features

Cada feature no frontend DEVE seguir a estrutura:

```
features/
└── featureName/
    ├── index.tsx              # Página principal (re-export)
    ├── FeaturePage.tsx        # Componente de página
    ├── components/            # Componentes específicos da feature
    │   ├── ComponentA.tsx
    │   └── ComponentB.tsx
    ├── hooks/                 # Hooks específicos da feature
    │   ├── useFeatureLogic.ts
    │   └── useFeatureData.ts
    ├── types.ts               # Tipos da feature (se necessário)
    ├── services/              # Services específicos (se necessário)
    │   └── featureService.ts
    └── mappers/               # Transformadores de dados (se necessário)
        └── mapFeatureData.ts
```

**Regras:**
- ✅ `index.tsx` apenas re-exporta (sem lógica)
- ✅ Hooks extraídos para `hooks/` quando >3 useState
- ✅ Componentes >100 linhas divididos em subcomponentes
- ❌ PROIBIDO importar de outras features diretamente (usar services compartilhados)

**Exemplo Real:**
```
features/
└── chat/
    ├── index.tsx
    ├── components/
    │   ├── ControlPanel/
    │   ├── input/
    │   └── message/
    ├── hooks/
    │   ├── useChatLogic.ts
    │   ├── useChatMessages.ts
    │   └── useChatStreaming.ts
    └── types/
        └── index.ts
```
```

### Esforço
- **Linhas a adicionar:** ~50
- **Complexidade:** Média
- **Impacto:** Documentação apenas

---

## Plano 4: Padrão de Services Frontend

### Problema
Não documenta estrutura de `services/` no frontend.

### Solução
Adicionar **Seção 5.5** com padrão de services.

### Alteração Proposta

```markdown
### 5.5 Services Frontend

Services encapsulam chamadas de API e lógica de comunicação.

**Estrutura:**
```
frontend/src/services/
├── api.ts                    # Instância Axios configurada
├── authService.ts            # Autenticação
├── chatService.ts            # Chat/Streaming
├── certificationService.ts   # Certificações
└── api/                      # Services específicos por domínio
    └── modelsApi.ts
```

**Padrões Obrigatórios:**

1. **Singleton Export:**
```typescript
// ✅ CORRETO - Export de instância
export const authService = {
  login: async (data) => { ... },
  logout: async () => { ... }
};

// ❌ ERRADO - Export de classe
export class AuthService { ... }
```

2. **Tipagem de Retorno:**
```typescript
// ✅ CORRETO - Tipo explícito
async function login(data: LoginData): Promise<LoginResponse> { ... }

// ❌ ERRADO - Tipo implícito
async function login(data) { ... }
```

3. **Tratamento de Erros:**
```typescript
// ✅ CORRETO - Propagar erro para componente tratar
async function fetchData(): Promise<Data> {
  const response = await api.get('/data');
  return response.data;
  // Erro propagado automaticamente
}

// ❌ ERRADO - Silenciar erro
async function fetchData(): Promise<Data | null> {
  try {
    return await api.get('/data');
  } catch {
    return null; // Erro silenciado!
  }
}
```

4. **Cache de Promises (Deduplicação):**
```typescript
// ✅ CORRETO - Evitar requests duplicados
let cachedPromise: Promise<Data> | null = null;

async function getData(): Promise<Data> {
  if (cachedPromise) return cachedPromise;
  cachedPromise = api.get('/data').then(r => r.data);
  return cachedPromise;
}
```
```

### Esforço
- **Linhas a adicionar:** ~60
- **Complexidade:** Média
- **Impacto:** Documentação apenas

---

## Plano 5: Resolver Violações de console.log

### Problema
300+ ocorrências de `console.log/error/warn` violando Seção 11.

### Análise

| Categoria | Quantidade | Ação |
|-----------|------------|------|
| Scripts CLI | ~150 | Permitir (exceção) |
| Frontend Dev | ~80 | Permitir em dev |
| Backend Produção | ~50 | Migrar para logger |
| Testes | ~20 | Permitir |

### Solução em 3 Partes

#### Parte 1: Atualizar Seção 11 com Exceções

```markdown
### 11.1 Princípios Fundamentais

**Logging estruturado é OBRIGATÓRIO em código de produção.**

| Proibido | Obrigatório |
|----------|-------------|
| `console.log()` | `logger.info()` |
| `console.error()` | `logger.error()` |
| `console.warn()` | `logger.warn()` |

**Exceções Permitidas:**

| Contexto | console.* Permitido? | Motivo |
|----------|---------------------|--------|
| Scripts CLI (`scripts/`) | ✅ Sim | Output para terminal |
| Seed/Migration | ✅ Sim | Output para terminal |
| Testes (`*.test.ts`) | ✅ Sim | Debug de testes |
| Frontend (dev only) | ✅ Sim | Debug local |
| Frontend (produção) | ❌ Não | Usar logger frontend |
| Backend (produção) | ❌ Não | Usar Winston |

**Regra para Frontend:**
```typescript
// ✅ CORRETO - Condicional para dev
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug]', data);
}

// ✅ CORRETO - Usar logger do frontend
import { logger } from '@/utils/logger';
logger.info('Operação concluída', { data });

// ❌ ERRADO - console.log em produção
console.log('Dados:', data);
```
```

#### Parte 2: Criar ESLint Rule

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'] // Permitir warn/error
      }
    ]
  },
  overrides: [
    {
      // Permitir em scripts
      files: ['scripts/**/*.ts', '**/*.test.ts', '**/seed.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

#### Parte 3: Migração Gradual (Backend)

**Arquivos prioritários para migrar:**
1. `backend/src/services/certificationService.ts`
2. `backend/src/controllers/*.ts`
3. `backend/src/middleware/*.ts`

**Script de busca:**
```bash
# Encontrar console.log em código de produção (excluindo scripts/tests)
grep -r "console\." backend/src --include="*.ts" \
  | grep -v "scripts/" \
  | grep -v ".test.ts" \
  | grep -v "seed.ts"
```

### Esforço
- **Linhas a adicionar no STANDARDS.md:** ~40
- **Arquivos a migrar:** ~20-30
- **Complexidade:** Média-Alta
- **Prazo sugerido:** 2-3 sprints (migração gradual)

---

## Plano 6: Seção de Mappers ✅

> **Status:** ✅ Implementado em v2.1.0

### Problema
Não havia documentação sobre padrão de Mappers para transformação de dados entre camadas.

### Solução
Adicionar **Seção 5.4 Mappers** no STANDARDS.md.

### Implementação
Adicionada Seção 5.4 com:
- Definição de Mappers como funções puras
- Localização padrão (`features/{feature}/mappers/` ou `services/mappers/`)
- Casos de uso (snake_case → camelCase, campos derivados, normalização de datas)
- Exemplo completo com tipagem
- Regras obrigatórias

### Diferença de Mappers vs JSend
- **Mappers:** Transformam estrutura de dados (ex: snake_case → camelCase)
- **JSend:** Formato de resposta de API (success/fail/error)
- São conceitos complementares, não relacionados

---

## Plano 7: Seção de Testes ✅

> **Status:** ✅ Implementado em v2.1.0

### Problema
Não havia documentação sobre padrões de testes no STANDARDS.md.

### Solução
Adicionar **Seção 13: Testes** no STANDARDS.md.

### Implementação
Adicionada Seção 13 com:
- 13.1 Princípios Fundamentais
- 13.2 Estrutura de Arquivos (`__tests__/`, `*.test.ts`)
- 13.3 Ferramentas Padrão (Jest, testing-library, supertest, msw)
- 13.4 Cobertura Mínima (70% services, 50% controllers, 80% utils)
- 13.5 Padrões de Mocking
- 13.6 Checklist de Conformidade
- 13.7 Referência para guia completo (a ser criado)

### Próximos Passos
- Criar `docs/testing/TESTING-GUIDE.md` com guia completo de testes

---

## Plano Futuro: Workers, Streaming, Scripts e Assets

### Prioridade Média: Workers/Filas (Bull/Redis)

**O que documentar:**
- Estrutura de `workers/`
- Padrão de jobs (CertificationQueueService)
- Configuração Redis
- Retry strategies

**Seção sugerida:** Nova Seção 14 ou subseção de Backend

**Esforço estimado:** ~80 linhas

---

### Prioridade Média: Streaming/SSE

**O que documentar:**
- Padrão de Server-Sent Events para chat
- Estrutura de chunks
- Tratamento de erros em stream
- Timeout e reconexão

**Seção sugerida:** Subseção de API (Seção 9)

**Esforço estimado:** ~50 linhas

---

### Prioridade Baixa: Estrutura de Scripts

**O que documentar:**
- Organização de `scripts/` (certification/, testing/, maintenance/)
- Padrão de CLI scripts
- Uso de cores/formatação

**Seção sugerida:** Apêndice D

**Esforço estimado:** ~40 linhas

---

### Prioridade Baixa: Assets e Constantes

**O que documentar:**
- Estrutura de `assets/` (brand/, providers/)
- Padrão de `constants/` (uiConstants.ts, contextDefaults.ts)
- Naming de arquivos de assets

**Seção sugerida:** Subseção de Frontend (Seção 5)

**Esforço estimado:** ~30 linhas

---

## 📊 Resumo de Esforço

| Plano | Linhas | Complexidade | Prioridade | Status |
|-------|--------|--------------|------------|--------|
| 1. Header Curto | ~15 | Baixa | Alta | ✅ Feito |
| 2. Proibir .backup | ~20 | Baixa | Alta | 📋 Pendente |
| 3. Features Frontend | ~50 | Média | Alta | 📋 Pendente |
| 4. Services Frontend | ~60 | Média | Alta | 📋 Pendente |
| 5. console.log | ~40 + migração | Média-Alta | Alta | 📋 Pendente |
| 6. Mappers | ~45 | Baixa | Alta | ✅ Feito |
| 7. Testes | ~70 | Média | Alta | ✅ Feito |
| 8. Workers/Filas | ~80 | Média | Média | 📋 Futuro |
| 9. Streaming/SSE | ~50 | Média | Média | 📋 Futuro |
| 10. Scripts | ~40 | Baixa | Baixa | 📋 Futuro |
| 11. Assets/Constantes | ~30 | Baixa | Baixa | 📋 Futuro |

**Total estimado:** ~500 linhas de documentação
**Implementado:** ~130 linhas (Planos 1, 6, 7)
**Restante:** ~370 linhas

---

## 🎯 Ordem de Execução Sugerida

### ✅ Concluído (v2.1.0)
- Plano 1: Header Curto
- Plano 6: Mappers
- Plano 7: Testes

### 📋 Próximo Sprint
1. Plano 2: Proibir .backup
2. Plano 3: Features Frontend
3. Plano 4: Services Frontend

### 📋 Sprint Seguinte
1. Plano 5: console.log (exceções + migração gradual)

### 📋 Backlog
- Plano 8: Workers/Filas
- Plano 9: Streaming/SSE
- Plano 10: Scripts
- Plano 11: Assets/Constantes

---

## 📝 Notas

- Cada plano pode ser implementado independentemente
- Priorizar documentação sobre migração de código
- Migração de console.log deve ser gradual para não quebrar nada
- Considerar criar `docs/guides/` para documentação detalhada
- Criar `docs/testing/TESTING-GUIDE.md` como próximo passo após Seção 13
