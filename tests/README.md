# 🧪 Estrutura Centralizada de Testes - MyIA

Este diretório contém **todos os testes** da aplicação MyIA, organizados de forma centralizada e padronizada.

## 📁 Estrutura de Diretórios

```
tests/
├── backend/           # Testes do backend (Node.js/TypeScript)
│   ├── unit/         # Testes unitários
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/  # Testes de integração
│   ├── e2e/          # Testes end-to-end (futuro)
│   ├── manual/       # Testes manuais e scripts de verificação
│   └── helpers/      # Fixtures, mocks e helpers de teste
├── frontend/         # Testes do frontend (React/TypeScript)
│   ├── unit/         # Testes unitários de componentes
│   ├── integration/  # Testes de integração
│   ├── e2e/          # Testes end-to-end (futuro)
│   └── helpers/      # Setup e helpers de teste
├── scripts/          # Scripts de teste shell
└── shared/           # Código compartilhado entre testes (futuro)
```

## 🎯 Tipos de Testes

### Backend

#### Testes Unitários (`backend/unit/`)
Testes isolados de funções, classes e módulos individuais.

**Arquivos:**
- `middleware/authMiddleware.test.ts` - Testa middleware de autenticação
- `middleware/validateRequest.test.ts` - Testa validação de requisições
- `services/authService.test.ts` - Testa serviço de autenticação
- `services/contextService.test.ts` - Testa serviço de contexto
- `utils/jwt.test.ts` - Testa utilitários JWT
- `utils/logger.test.ts` - Testa sistema de logging

**Como rodar:**
```bash
cd backend
npm run test:unit
```

#### Testes de Integração (`backend/integration/`)
Testes que verificam a integração entre múltiplos componentes.

**Arquivos:**
- `modelsRoutes.test.ts` - Testa rotas de modelos de IA

**Como rodar:**
```bash
cd backend
npm run test:integration
```

#### Testes Manuais (`backend/manual/`)
Scripts de teste e verificação manual.

**Arquivos:**
- `test-credentials-protection.ts` - Verifica proteção de credenciais

**Como rodar:**
```bash
cd backend
tsx ../tests/backend/manual/test-credentials-protection.ts
```

#### Helpers (`backend/helpers/`)
Utilitários compartilhados entre testes.

**Arquivos:**
- `fixtures.ts` - Dados de teste (usuários, mensagens)
- `testDb.ts` - Helpers para banco de dados de teste

### Frontend

#### Helpers (`frontend/helpers/`)
Configuração e utilitários de teste.

**Arquivos:**
- `setup.ts` - Configuração inicial do Vitest

**Como rodar testes do frontend:**
```bash
cd frontend
npm test
```

## 🔧 Scripts de Teste Shell

Localizados em `tests/scripts/`, estes scripts automatizam testes e verificações:

### Scripts Disponíveis

#### 1. `test-capabilities-fix.sh`
Testa capacidades de modelos de IA.

```bash
./tests/scripts/test-capabilities-fix.sh
```

#### 2. `test-aws-credentials.sh`
Verifica credenciais AWS.

```bash
./tests/scripts/test-aws-credentials.sh
```

#### 3. `test-bedrock.sh`
Testa integração com AWS Bedrock.

```bash
./tests/scripts/test-bedrock.sh
```

#### 4. `test-jsend-routes.sh`
Testa todas as rotas migradas para padrão JSend.

```bash
./tests/scripts/test-jsend-routes.sh <TOKEN>
```

**Obter token:**
```bash
./tests/scripts/get-test-token.sh
```

#### 5. `security-tests.sh`
Suite completa de testes de segurança (7 categorias).

```bash
cd backend
../tests/scripts/security-tests.sh
```

**Testes incluídos:**
- ✅ Headers de segurança (Helmet)
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ Proteção de rotas
- ✅ Token inválido
- ✅ CORS
- ✅ SQL injection

**Resultado esperado:** 100% PASS (7/7 testes)

#### 6. `get-test-token.sh`
Faz login e retorna token JWT para testes.

```bash
./tests/scripts/get-test-token.sh
```

## 📊 Comandos de Teste

### Backend (Jest)

```bash
cd backend

# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E (quando implementados)
npm run test:e2e

# Modo watch (desenvolvimento)
npm run test:watch

# Cobertura de código
npm run test:coverage
```

### Frontend (Vitest)

```bash
cd frontend

# Todos os testes
npm test

# Modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

## 🎨 Convenções de Nomenclatura

### Arquivos de Teste

- **Backend:** `*.test.ts` ou `*.spec.ts`
- **Frontend:** `*.test.tsx` ou `*.spec.tsx` (componentes)
- **Frontend:** `*.test.ts` ou `*.spec.ts` (hooks/utils)

### Estrutura de Teste

```typescript
describe('Nome do Módulo', () => {
  describe('Funcionalidade Específica', () => {
    it('deve fazer algo específico', () => {
      // Arrange (preparar)
      // Act (executar)
      // Assert (verificar)
    });
  });
});
```

## 📝 Adicionando Novos Testes

### Backend

1. **Teste Unitário:**
   ```bash
   # Criar arquivo em tests/backend/unit/
   touch tests/backend/unit/services/meuServico.test.ts
   ```

2. **Teste de Integração:**
   ```bash
   # Criar arquivo em tests/backend/integration/
   touch tests/backend/integration/minhaRota.test.ts
   ```

3. **Helper:**
   ```bash
   # Criar arquivo em tests/backend/helpers/
   touch tests/backend/helpers/meuHelper.ts
   ```

### Frontend

1. **Teste de Componente:**
   ```bash
   # Criar arquivo em tests/frontend/unit/
   touch tests/frontend/unit/MeuComponente.test.tsx
   ```

2. **Teste de Hook:**
   ```bash
   # Criar arquivo em tests/frontend/unit/
   touch tests/frontend/unit/useMeuHook.test.ts
   ```

### Scripts Shell

```bash
# Criar script em tests/scripts/
touch tests/scripts/meu-teste.sh
chmod +x tests/scripts/meu-teste.sh
```

## 🔍 Configurações

### Backend (Jest)

Configuração: [`backend/jest.config.js`](../backend/jest.config.js)

```javascript
{
  roots: ['<rootDir>/../tests/backend', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  // ...
}
```

### Frontend (Vitest)

Configuração: [`frontend/vitest.config.ts`](../frontend/vitest.config.ts)

```typescript
{
  setupFiles: '../tests/frontend/helpers/setup.ts',
  // ...
}
```

## 📈 Cobertura de Código

### Metas de Cobertura (Backend)

- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

### Verificar Cobertura

```bash
cd backend
npm run test:coverage

# Abrir relatório HTML
open coverage/index.html
```

## 🚀 CI/CD

Os testes são executados automaticamente em:

- **Pre-commit:** Testes unitários rápidos
- **Pre-push:** Suite completa de testes
- **Pull Request:** Todos os testes + cobertura
- **Deploy:** Testes + segurança

## 🐛 Troubleshooting

### Problema: Testes não encontram módulos

**Solução:** Verifique os paths relativos nos imports. Os testes agora estão em `tests/` na raiz, então os imports devem apontar para `../../backend/src/` ou `../../frontend/src/`.

### Problema: Jest não encontra testes

**Solução:** Verifique se o `jest.config.js` aponta para `../tests/backend`:

```javascript
roots: ['<rootDir>/../tests/backend', '<rootDir>/src']
```

### Problema: Scripts shell não executam

**Solução:** Adicione permissão de execução:

```bash
chmod +x tests/scripts/*.sh
```

### Problema: Testes de segurança falham

**Solução:** Certifique-se de que o backend está rodando:

```bash
cd backend
npm run dev
```

Então execute os testes em outro terminal:

```bash
./tests/scripts/security-tests.sh
```

## 📚 Referências

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest](https://github.com/visionmedia/supertest)

## 🤝 Contribuindo

Ao adicionar novos testes:

1. Siga as convenções de nomenclatura
2. Mantenha a estrutura de diretórios
3. Atualize este README se necessário
4. Garanta que os testes passam localmente
5. Verifique a cobertura de código

---

**Última atualização:** 2026-01-21  
**Mantido por:** Equipe MyIA
