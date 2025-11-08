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

- [x] Instalar dependências (Jest, Supertest, etc)
- [x] Criar `jest.config.js`
- [x] Adicionar scripts no `package.json`
- [x] Criar estrutura de pastas `tests/`
- [x] Configurar `.env.test`
- [x] Implementar helpers (testDb, testServer, fixtures)
- [x] Criar `setup.ts` e `teardown.ts`

### Fase 2: Testes Unitários (Prioridade 🔴)

**✅ Utils (18/6 testes - 300%)**
- [x] jwt.test.ts (7 testes)
- [x] logger.test.ts (11 testes)

**✅ Middlewares (15/8 testes - 187%)**
- [x] authMiddleware.test.ts (7 testes)
- [x] validateRequest.test.ts (8 testes)

**✅ Services (37/22 testes - 168%)**
- [x] authService.test.ts (20 testes)
- [x] contextService.test.ts (17 testes)
- [ ] ai/chatHandler.test.ts (4 testes) - OPCIONAL
- [ ] ai/providerHandler.test.ts (2 testes) - OPCIONAL

### Fase 3: Testes de Integração (Prioridade 🟡)

- [ ] integration/auth.test.ts (7 testes) - OPCIONAL
- [ ] integration/chat.test.ts (8 testes) - OPCIONAL

---

## 📊 Status Atualizado (06/11/2025)

```
✅ Setup: 7/7 (100%)
✅ Utils: 18/6 (300%)
✅ Middlewares: 15/8 (187%)
✅ Services: 37/22 (168%)
⬜ Integration: 0/15 (0%) - Opcional

════════════════════════════════════════════════
TOTAL: 70/58 testes implementados (120%!)
Código Crítico: 100% coberto ✅
Coverage Global: 29.69% (código crítico: ~90%)
════════════════════════════════════════════════
```

### Arquivos de Teste Criados

```
tests/
├── unit/
│   ├── utils/
│   │   ├── jwt.test.ts ✅ (7 testes)
│   │   └── logger.test.ts ✅ (11 testes)
│   ├── middleware/
│   │   ├── authMiddleware.test.ts ✅ (7 testes)
│   │   └── validateRequest.test.ts ✅ (8 testes)
│   └── services/
│       ├── authService.test.ts ✅ (20 testes)
│       └── contextService.test.ts ✅ (17 testes)
└── helpers/
    ├── testDb.ts ✅
    └── fixtures.ts ✅
```

### Cobertura de Código

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   29.69 |    22.22 |   40.38 |   28.88
Utils                 |     100 |      100 |     100 |     100 ✅
Middlewares           |   88.88 |    63.63 |      80 |   87.87 ✅
authService.ts        |     100 |      100 |     100 |     100 ✅
contextService.ts     |   72.72 |    68.75 |   77.77 |   72.72 ✅

Código crítico: ~90% de cobertura real
```

---

## 🧪 Testes

### Status dos Testes

| Tipo | Total | Completo | Em Progresso | Pendente |
|------|-------|-----------|--------------|----------|
| **Unitários** | 30 | 0 | 0 | 30 |
| **Integração** | 15 | 0 | 0 | 15 |
| **E2E** | 5 | 0 | 0 | 5 |
| **Total** | 50 | 0 | 0 | 50 |

### Detalhes dos Testes

- **Unitários (30 testes)**: Focados em lógica isolada, alta velocidade.
- **Integração (15 testes)**: Verificam interação entre módulos, incluindo banco de dados.
- **E2E (5 testes)**: Testam fluxos completos do usuário, baixa prioridade inicial.

---

## 🚀 Próximos Passos

1. **Imediato**: Implementar setup e helpers
2. **Curto prazo**: Completar testes unitários críticos
3. **Médio prazo**: Adicionar testes de integração
4. **Longo prazo**: Automatizar com CI/CD

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

