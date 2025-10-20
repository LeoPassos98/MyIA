# 🧪 Guia de Testes - MyIA

## 📋 Informações Gerais

**Versão:** 1.0  
**Última Atualização:** 19/10/2025  
**Status:** 📝 Documentação Completa | 🔴 Implementação: 0/50 (0%)  
**Responsável:** @LeoPassos98

---

## 🎯 Objetivo

Este documento define a **estratégia de testes** do projeto MyIA, servindo como guia para implementação futura de testes automatizados que garantam qualidade, confiabilidade e facilidade de manutenção do código.

---

## 📊 Visão Geral

### Status Atual

```
📊 Progresso Total: 0/50 testes (0%)

🔴 Crítico (Prioridade 1): 0/23 testes
   └─ Auth Service: 0/8
   └─ Chat Controller: 0/8  
   └─ Auth Controller: 0/7

🟡 Importante (Prioridade 2): 0/13 testes
   └─ AI Service: 0/6
   └─ Context Service: 0/7

🟢 Complementar (Prioridade 3): 0/14 testes
   └─ Middlewares: 0/8
   └─ Utils: 0/6
```

### Metas de Cobertura

| Tipo | Meta | Prioridade |
|------|------|------------|
| **Services** | 100% | 🔴 Crítica |
| **Controllers** | 100% | 🔴 Crítica |
| **Middlewares** | 90% | 🟡 Alta |
| **Utils** | 80% | 🟢 Média |
| **Global** | 85%+ | 🟡 Alta |

---

## 🏗️ Arquitetura de Testes

### Pirâmide de Testes

```
        /\
       /  \      E2E (5 testes)
      /____\     - Fluxos completos
     /      \    
    /________\   Integração (15 testes)
   /          \  - API endpoints
  /____________\ 
 /              \ Unitários (30 testes)
/________________\ - Lógica isolada
```

**Distribuição:**
- **60%** Unitários (30 testes) - Rápidos, isolados
- **30%** Integração (15 testes) - API + DB
- **10%** E2E (5 testes) - Fluxos completos

---

## 📁 Estrutura de Pastas

```
backend/
├── tests/
│   ├── unit/                           # 30 testes unitários
│   │   ├── services/
│   │   │   ├── authService.test.ts     (8 testes)
│   │   │   ├── contextService.test.ts  (7 testes)
│   │   │   └── ai/
│   │   │       ├── chatHandler.test.ts      (4 testes)
│   │   │       └── providerHandler.test.ts  (2 testes)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.test.ts       (4 testes)
│   │   │   ├── errorHandler.test.ts         (2 testes)
│   │   │   └── validateRequest.test.ts      (2 testes)
│   │   └── utils/
│   │       ├── jwt.test.ts             (3 testes)
│   │       └── logger.test.ts          (3 testes)
│   │
│   ├── integration/                    # 15 testes de integração
│   │   ├── auth.test.ts                (7 testes)
│   │   └── chat.test.ts                (8 testes)
│   │
│   ├── e2e/                            # 5 testes end-to-end
│   │   └── flows.test.ts               (5 testes)
│   │
│   ├── helpers/                        # Utilitários
│   │   ├── testDb.ts                   (setup/cleanup BD)
│   │   ├── testServer.ts               (servidor de teste)
│   │   └── fixtures.ts                 (dados mock)
│   │
│   ├── setup.ts                        # Config global
│   └── teardown.ts                     # Limpeza global
│
├── jest.config.js                      # Configuração Jest
└── package.json                        # Scripts de teste
```

---

## 🛠️ Stack de Testes

### Ferramentas Principais

| Ferramenta | Propósito | Versão |
|------------|-----------|--------|
| **Jest** | Test runner e assertions | ^29.0.0 |
| **ts-jest** | Suporte TypeScript | ^29.0.0 |
| **Supertest** | Testes HTTP/API | ^6.3.0 |
| **@types/jest** | Tipagens Jest | ^29.0.0 |
| **@types/supertest** | Tipagens Supertest | ^2.0.0 |

### Comandos de Instalação

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

---

## ⚙️ Configuração Necessária

### 1. jest.config.js

Criar arquivo na raiz do backend com:
- Preset: `ts-jest`
- Environment: `node`
- Coverage threshold: 80%+
- Setup e teardown files
- Timeout: 10s

### 2. Scripts package.json

Adicionar ao `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

### 3. Banco de Dados de Teste

- Criar `.env.test` com `DATABASE_URL="file:./test.db"`
- Usar SQLite separado para testes
- Limpar dados entre cada teste

### 4. Arquivos Helper

**testDb.ts**: Setup, cleanup e close do banco  
**testServer.ts**: Instância Express para testes  
**fixtures.ts**: Dados mock reutilizáveis  

---

## 📋 Checklist de Implementação

### Fase 1: Setup (Prioridade 🔴)

- [ ] Instalar dependências (Jest, Supertest, etc)
- [ ] Criar `jest.config.js`
- [ ] Adicionar scripts no `package.json`
- [ ] Criar estrutura de pastas `tests/`
- [ ] Configurar `.env.test`
- [ ] Implementar helpers (testDb, testServer, fixtures)
- [ ] Criar `setup.ts` e `teardown.ts`

### Fase 2: Testes Unitários Críticos (Prioridade 🔴)

**AuthService (8 testes)**
- [ ] Register: criar usuário com senha hash
- [ ] Register: erro se email já existe
- [ ] Register: validar hash bcrypt
- [ ] Login: retornar token e user para credenciais válidas
- [ ] Login: erro para email inválido
- [ ] Login: erro para senha inválida
- [ ] Login: não expor password no response
- [ ] getUserById: retornar user sem password

**ContextService (7 testes)**
- [ ] addMessage: adicionar mensagens ao contexto
- [ ] addMessage: limitar a MAX_CONTEXT_MESSAGES
- [ ] addMessage: manter ordem das mensagens
- [ ] getContext: retornar array vazio para novo usuário
- [ ] getContext: retornar contexto correto por usuário
- [ ] clearContext: remover todas as mensagens
- [ ] getContextSize: retornar número correto

### Fase 3: Testes de Integração (Prioridade 🟡)

**Auth Endpoints (7 testes)**
- [ ] POST /register: registrar novo usuário (201)
- [ ] POST /register: erro para email duplicado (400)
- [ ] POST /register: erro para email inválido (400)
- [ ] POST /register: erro para senha curta (400)
- [ ] POST /login: login com credenciais válidas (200)
- [ ] POST /login: erro para credenciais inválidas (401)
- [ ] GET /me: retornar dados do usuário com token (200)

**Chat Endpoints (8 testes)**
- [ ] POST /message: enviar e receber resposta (200)
- [ ] POST /message: erro sem token (401)
- [ ] POST /message: erro para mensagem vazia (400)
- [ ] POST /message: manter contexto entre mensagens
- [ ] POST /message: limitar contexto a 15 mensagens
- [ ] POST /message: usar provider específico quando fornecido
- [ ] DELETE /context: limpar histórico (200)
- [ ] DELETE /context: erro sem token (401)

### Fase 4: Testes AI e Middlewares (Prioridade 🟢)

**AI Services (6 testes)**
- [ ] chatHandler: enviar mensagem com contexto
- [ ] chatHandler: adicionar ao contexto após resposta
- [ ] chatHandler: usar provider especificado
- [ ] chatHandler: usar provider padrão se não especificado
- [ ] providerHandler: listar todos os providers
- [ ] providerHandler: testar conexão com provider

**Middlewares (8 testes)**
- [ ] authMiddleware: passar com token válido
- [ ] authMiddleware: rejeitar sem token
- [ ] authMiddleware: rejeitar com token inválido
- [ ] authMiddleware: extrair userId do token
- [ ] validateRequest: passar com dados válidos
- [ ] validateRequest: rejeitar com dados inválidos
- [ ] errorHandler: formatar erros corretamente
- [ ] errorHandler: retornar status code correto

**Utils (6 testes)**
- [ ] jwt.generateToken: gerar token válido
- [ ] jwt.verifyToken: verificar token válido
- [ ] jwt.verifyToken: erro para token inválido
- [ ] logger.info: logar mensagens info
- [ ] logger.error: logar mensagens erro
- [ ] logger.warn: logar mensagens warning

### Fase 5: Testes E2E (Prioridade 🟢)

- [ ] Fluxo completo: Registro → Login → Chat → Logout
- [ ] Fluxo: Múltiplas mensagens com contexto
- [ ] Fluxo: Limpar contexto e começar nova conversa
- [ ] Fluxo: Trocar de provider durante conversa
- [ ] Fluxo: Erro e recuperação (token expirado)

---

## 📐 Convenções e Padrões

### Nomenclatura

- **Arquivos**: `nomeDoArquivo.test.ts`
- **Describes**: Nome da classe/função sendo testada
- **Its**: Descrição do comportamento esperado
- **Variáveis**: Prefixo `test` ou `mock`

### Estrutura de Teste

```typescript
describe('NomeDaUnidade', () => {
  // Setup antes de cada teste
  beforeEach(() => {
    // Limpar estado
  });

  describe('nomeDoMetodo', () => {
    it('should comportamento esperado', () => {
      // Arrange (preparar)
      // Act (executar)
      // Assert (verificar)
    });
  });
});
```

### AAA Pattern

Sempre seguir **Arrange, Act, Assert**:

1. **Arrange**: Preparar dados e mocks
2. **Act**: Executar função/endpoint
3. **Assert**: Verificar resultado

### Isolamento

- Cada teste deve ser **independente**
- Usar `beforeEach` para resetar estado
- Não depender da ordem de execução
- Limpar banco de dados entre testes

### Mocks

- Mockar dependências externas (OpenAI, Anthropic, etc)
- Mockar apenas o necessário
- Verificar chamadas de mocks quando relevante

---

## 🎯 Critérios de Sucesso

### Qualidade do Código de Teste

- [ ] Todos os testes são independentes
- [ ] Nomes descritivos e claros
- [ ] Seguem padrão AAA
- [ ] Sem lógica complexa nos testes
- [ ] Assertions específicas (não genéricas)

### Cobertura

- [ ] 100% dos services cobertos
- [ ] 100% dos controllers cobertos
- [ ] 90%+ dos middlewares cobertos
- [ ] 80%+ dos utils cobertos
- [ ] 85%+ de cobertura global

### Performance

- [ ] Suíte completa roda em < 30s
- [ ] Testes unitários em < 5s
- [ ] Testes de integração em < 15s
- [ ] Testes E2E em < 10s

### CI/CD Ready

- [ ] Todos os testes passam consistentemente
- [ ] Sem testes flaky (instáveis)
- [ ] Compatível com GitHub Actions
- [ ] Coverage report gerado

---

## 🚀 Como Começar

### Passo 1: Setup Inicial

1. Instalar dependências
2. Criar configuração Jest
3. Criar estrutura de pastas
4. Implementar helpers básicos

### Passo 2: Primeiro Teste

Começar com teste unitário simples:
- `tests/unit/utils/jwt.test.ts`
- Testar geração de token
- Verificar que estrutura funciona

### Passo 3: Expandir Gradualmente

1. Completar testes unitários (30 testes)
2. Implementar testes de integração (15 testes)
3. Adicionar testes E2E (5 testes)
4. Atingir meta de cobertura

### Passo 4: Automatizar

- Configurar pre-commit hook
- Integrar com CI/CD
- Gerar relatórios de cobertura

---

## 📚 Recursos e Referências

### Documentação Oficial

- **Jest**: https://jestjs.io/docs/getting-started
- **Supertest**: https://github.com/visionmedia/supertest
- **Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices

### Guias Internos

- `docs/architecture.md` - Arquitetura do projeto
- `docs/api-endpoints.md` - Endpoints para testar
- `docs/setup-guide.md` - Configuração do ambiente

### Exemplos de Referência

Para ver exemplos de código de teste completos, consultar:
- Documentação do Jest (unit tests)
- Documentação do Supertest (integration tests)
- Repositórios open-source similares

---

## 📊 Métricas e Acompanhamento

### Dashboard de Progresso

Atualizar semanalmente:

```
Semana 1: Setup + 10 testes unitários
Semana 2: 20 testes unitários restantes
Semana 3: 15 testes de integração
Semana 4: 5 testes E2E + ajustes
```

### Relatório de Cobertura

Gerar após cada implementação:

```bash
npm run test:coverage
```

Verificar em `backend/coverage/index.html`

---

## 🐛 Troubleshooting

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| Testes lentos | Revisar mocks e isolamento |
| Testes flaky | Aumentar timeout, melhorar cleanup |
| Baixa cobertura | Identificar código não testado |
| Erro de importação | Verificar paths no jest.config |
| Banco não limpa | Revisar beforeEach/afterEach |

---

## 🎯 Próximos Passos

1. **Imediato**: Implementar setup e helpers
2. **Curto prazo**: Completar testes unitários críticos
3. **Médio prazo**: Adicionar testes de integração
4. **Longo prazo**: Automatizar com CI/CD

---

## 📝 Notas Finais

- Este documento é um **guia vivo** - deve ser atualizado conforme implementação
- Priorizar **qualidade sobre quantidade**
- Testes devem ser **mantíveis e legíveis**
- Investimento em testes = **menos bugs em produção**

---

**Última atualização:** 19/10/2025  
**Versão:** 1.0  
**Status:** Aguardando Implementação  
**Mantido por:** @LeoPassos98

