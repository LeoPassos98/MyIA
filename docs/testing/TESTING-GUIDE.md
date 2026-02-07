# Guia Completo de Testes - MyIA

**Standards:** [`docs/STANDARDS.md`](../STANDARDS.md)

> **Referência:** Este documento é referenciado na [Seção 13 do STANDARDS.md](../STANDARDS.md#13-testes)

---

## 📑 Índice

1. [Introdução](#1-introdução)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [Nomenclatura e Organização](#3-nomenclatura-e-organização)
4. [Testes Unitários](#4-testes-unitários)
5. [Testes de Integração](#5-testes-de-integração)
6. [Testes E2E](#6-testes-e2e)
7. [Mocking e Fixtures](#7-mocking-e-fixtures)
8. [Testes Assíncronos](#8-testes-assíncronos)
9. [Cobertura de Código](#9-cobertura-de-código)
10. [CI/CD](#10-cicd)
11. [Troubleshooting](#11-troubleshooting)
12. [Exemplos Práticos](#12-exemplos-práticos)

---

## 1. Introdução

### 1.1 Princípios Fundamentais

**Testes são parte integral do código, não um adicional.**

Este guia estabelece padrões obrigatórios para testes no projeto MyIA, garantindo:

- ✅ **Qualidade:** Código testado é código confiável
- ✅ **Manutenibilidade:** Testes facilitam refatoração
- ✅ **Documentação Viva:** Testes documentam comportamento esperado
- ✅ **Confiança:** Deploy seguro com testes passando

### 1.2 Filosofia de Testes

```typescript
// ❌ ERRADO - Testar implementação
test('should call database.query with correct SQL', () => {
  expect(database.query).toHaveBeenCalledWith('SELECT * FROM users');
});

// ✅ CORRETO - Testar comportamento
test('should return all users', async () => {
  const users = await userService.findAll();
  expect(users).toHaveLength(3);
  expect(users[0]).toHaveProperty('id');
});
```

**Regra de Ouro:** Teste **comportamento**, não **implementação**.

### 1.3 Pirâmide de Testes

```
        /\
       /E2E\         ← Poucos (10%)
      /------\
     /  INT   \      ← Moderados (30%)
    /----------\
   /   UNIT     \    ← Muitos (60%)
  /--------------\
```

- **Unitários (60%):** Rápidos, isolados, muitos
- **Integração (30%):** Módulos interagindo, moderados
- **E2E (10%):** Fluxo completo, poucos

---

## 2. Estrutura de Arquivos

### 2.1 Localização de Testes

| Tipo de Teste | Localização | Padrão de Nome |
|---------------|-------------|----------------|
| **Unitários** | `__tests__/` dentro do módulo | `*.test.ts` |
| **Integração** | `tests/integration/` | `*.integration.test.ts` |
| **E2E** | `tests/e2e/` | `*.e2e.test.ts` |

### 2.2 Estrutura Padrão (Backend)

```
backend/src/
├── services/
│   ├── ai/
│   │   ├── aiService.ts
│   │   ├── __tests__/
│   │   │   └── aiService.test.ts
│   │   └── adapters/
│   │       ├── anthropic.adapter.ts
│   │       └── __tests__/
│   │           └── anthropic.adapter.test.ts
│   └── auth/
│       ├── authService.ts
│       └── __tests__/
│           └── authService.test.ts
│
├── controllers/
│   ├── chatController.ts
│   └── __tests__/
│       └── chatController.test.ts
│
└── utils/
    ├── validators.ts
    └── __tests__/
        └── validators.test.ts

backend/tests/
├── integration/
│   ├── auth.integration.test.ts
│   └── chat.integration.test.ts
└── e2e/
    └── chat-flow.e2e.test.ts
```

### 2.3 Estrutura Padrão (Frontend)

```
frontend/src/
├── features/
│   └── chat/
│       ├── components/
│       │   ├── ChatInput.tsx
│       │   └── __tests__/
│       │       └── ChatInput.test.tsx
│       ├── hooks/
│       │   ├── useChatLogic.ts
│       │   └── __tests__/
│       │       └── useChatLogic.test.ts
│       └── services/
│           ├── chatService.ts
│           └── __tests__/
│               └── chatService.test.ts
│
└── utils/
    ├── formatters.ts
    └── __tests__/
        └── formatters.test.ts

frontend/tests/
├── integration/
│   └── chat-integration.test.tsx
└── e2e/
    └── chat-flow.e2e.test.ts
```

### 2.4 Regras de Localização

- ✅ Testes unitários **DEVEM** estar em `__tests__/` ao lado do código testado
- ✅ Testes de integração **DEVEM** estar em `tests/integration/`
- ✅ Testes E2E **DEVEM** estar em `tests/e2e/`
- ❌ **PROIBIDO** misturar testes unitários com código de produção no mesmo arquivo

---

## 3. Nomenclatura e Organização

### 3.1 Padrões de Nomenclatura

#### 3.1.1 Arquivos de Teste

```typescript
// ✅ CORRETO
aiService.test.ts
chatController.test.ts
auth.integration.test.ts
chat-flow.e2e.test.ts

// ❌ ERRADO
aiService.spec.ts           // Use .test.ts
test-aiService.ts           // Prefixo errado
aiServiceTest.ts            // Sem separador
```

#### 3.1.2 Blocos `describe`

```typescript
// ✅ CORRETO - Nome do módulo/classe
describe('ChatService', () => {
  describe('sendMessage', () => {
    // ...
  });
});

// ❌ ERRADO
describe('Tests for ChatService', () => {  // Redundante
  describe('test sendMessage', () => {     // Redundante
    // ...
  });
});
```

#### 3.1.3 Blocos `it` / `test`

```typescript
// ✅ CORRETO - Comportamento esperado
it('should return user when credentials are valid', async () => {});
it('should throw error when user not found', async () => {});
it('should cache results for 5 minutes', async () => {});

// ❌ ERRADO
it('test login', async () => {});              // Vago
it('should work', async () => {});             // Não descritivo
it('validates credentials', async () => {});   // Sem "should"
```

**Padrão Obrigatório:**
```
it('should [ação esperada] when [condição]', () => {})
```

### 3.2 Estrutura de Teste (AAA Pattern)

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // ARRANGE (Preparar)
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // ACT (Agir)
      const user = await userService.createUser(userData);

      // ASSERT (Verificar)
      expect(user.email).toBe('test@example.com');
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
    });
  });
});
```

### 3.3 Organização de Suites

```typescript
describe('ChatController', () => {
  // Setup compartilhado
  let mockChatService: jest.Mocked<ChatService>;
  let controller: ChatController;

  beforeEach(() => {
    mockChatService = {
      sendMessage: jest.fn(),
      getHistory: jest.fn(),
    } as any;
    controller = new ChatController(mockChatService);
  });

  // Agrupar por método
  describe('sendMessage', () => {
    describe('when message is valid', () => {
      it('should return success response', async () => {});
      it('should call chatService.sendMessage', async () => {});
    });

    describe('when message is empty', () => {
      it('should return 400 error', async () => {});
    });
  });

  describe('getHistory', () => {
    // ...
  });
});
```

---

## 4. Testes Unitários

### 4.1 Definição

**Testes unitários verificam uma unidade isolada de código (função, método, classe).**

Características:
- ✅ Rápidos (< 100ms cada)
- ✅ Isolados (sem dependências externas)
- ✅ Determinísticos (mesmo input = mesmo output)
- ✅ Independentes (ordem não importa)

### 4.2 Exemplo: Service (Backend)

```typescript
// backend/src/services/auth/__tests__/authService.test.ts
// Standards: docs/STANDARDS.md

import { AuthService } from '../authService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Mock do Prisma
jest.mock('@prisma/client');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    authService = new AuthService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return user when credentials are valid', async () => {
      // ARRANGE
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Test User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // ACT
      const result = await authService.login(email, password);

      // ASSERT
      expect(result).toEqual({
        id: '1',
        email,
        name: 'Test User',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw error when user not found', async () => {
      // ARRANGE
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        authService.login('invalid@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error when password is incorrect', async () => {
      // ARRANGE
      const hashedPassword = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test',
      } as any);

      // ACT & ASSERT
      await expect(
        authService.login('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // ARRANGE
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockPrisma.user.create.mockResolvedValue({
        id: '2',
        ...userData,
        password: 'hashed',
      } as any);

      // ACT
      const result = await authService.register(userData);

      // ASSERT
      expect(result.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          name: userData.name,
          password: expect.not.stringMatching('password123'),
        }),
      });
    });
  });
});
```

### 4.3 Exemplo: Componente React (Frontend)

```typescript
// frontend/src/features/chat/components/__tests__/ChatInput.test.tsx
// Standards: docs/STANDARDS.md

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('should render textarea and send button', () => {
    // ARRANGE & ACT
    render(<ChatInput onSend={mockOnSend} />);

    // ASSERT
    expect(screen.getByPlaceholderText(/digite sua mensagem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('should call onSend when button is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/digite sua mensagem/i);
    const button = screen.getByRole('button', { name: /enviar/i });

    // ACT
    await user.type(textarea, 'Hello, AI!');
    await user.click(button);

    // ASSERT
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Hello, AI!');
    });
  });

  it('should clear textarea after sending', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/digite sua mensagem/i) as HTMLTextAreaElement;

    // ACT
    await user.type(textarea, 'Test message');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    // ASSERT
    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('should disable button when textarea is empty', () => {
    // ARRANGE & ACT
    render(<ChatInput onSend={mockOnSend} />);

    // ASSERT
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled();
  });

  it('should enable button when textarea has content', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/digite sua mensagem/i);
    const button = screen.getByRole('button', { name: /enviar/i });

    // ACT
    await user.type(textarea, 'Test');

    // ASSERT
    expect(button).toBeEnabled();
  });
});
```

### 4.4 Exemplo: Utility Function

```typescript
// backend/src/utils/__tests__/validators.test.ts
// Standards: docs/STANDARDS.md

import { validateEmail, validatePassword } from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
    });

    it('should return false when password is too short', () => {
      expect(validatePassword('Pass1!')).toBe(false);
    });

    it('should return false when password lacks uppercase', () => {
      expect(validatePassword('password123!')).toBe(false);
    });

    it('should return false when password lacks number', () => {
      expect(validatePassword('Password!')).toBe(false);
    });

    it('should return false when password lacks special char', () => {
      expect(validatePassword('Password123')).toBe(false);
    });
  });
});
```

---

## 5. Testes de Integração

### 5.1 Definição

**Testes de integração verificam a interação entre múltiplos módulos.**

Características:
- ✅ Testam integração real (banco, APIs externas)
- ✅ Mais lentos que unitários (< 5s cada)
- ✅ Usam banco de dados de teste
- ✅ Podem usar mocks para APIs externas

### 5.2 Configuração de Ambiente

```typescript
// backend/tests/setup.ts
// Standards: docs/STANDARDS.md

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
});

beforeAll(async () => {
  // Limpar banco antes de todos os testes
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ChatMessage" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

### 5.3 Exemplo: API Integration Test

```typescript
// backend/tests/integration/auth.integration.test.ts
// Standards: docs/STANDARDS.md

import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../setup';

describe('Auth API Integration', () => {
  beforeEach(async () => {
    // Limpar usuários antes de cada teste
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      // ARRANGE
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      // ACT
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // ASSERT
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: {
            id: expect.any(String),
            email: userData.email,
            name: userData.name,
          },
          token: expect.any(String),
        },
      });

      // Verificar no banco
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.password).not.toBe(userData.password); // Hashed
    });

    it('should return 400 when email already exists', async () => {
      // ARRANGE
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      // Criar usuário existente
      await request(app).post('/api/auth/register').send(userData);

      // ACT
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // ASSERT
      expect(response.body.status).toBe('fail');
      expect(response.body.data.email).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // ARRANGE
      const userData = {
        email: 'login@example.com',
        password: 'Password123!',
        name: 'Login User',
      };

      // Registrar usuário primeiro
      await request(app).post('/api/auth/register').send(userData);

      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      // ASSERT
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return 401 with invalid credentials', async () => {
      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      // ASSERT
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});
```

### 5.4 Exemplo: Service Integration Test

```typescript
// backend/tests/integration/chat.integration.test.ts
// Standards: docs/STANDARDS.md

import { ChatService } from '../../src/services/chat/chatService';
import { prisma } from '../setup';

describe('ChatService Integration', () => {
  let chatService: ChatService;
  let testUserId: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'chat-test@example.com',
        password: 'hashed',
        name: 'Chat Test User',
      },
    });
    testUserId = user.id;
  });

  beforeEach(() => {
    chatService = new ChatService(prisma);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('saveMessage', () => {
    it('should save message to database', async () => {
      // ARRANGE
      const messageData = {
        userId: testUserId,
        content: 'Test message',
        role: 'user' as const,
      };

      // ACT
      const savedMessage = await chatService.saveMessage(messageData);

      // ASSERT
      expect(savedMessage.id).toBeTruthy();
      expect(savedMessage.content).toBe(messageData.content);

      // Verificar no banco
      const messageInDb = await prisma.chatMessage.findUnique({
        where: { id: savedMessage.id },
      });
      expect(messageInDb).toBeTruthy();
    });
  });

  describe('getHistory', () => {
    it('should return messages in correct order', async () => {
      // ARRANGE
      await chatService.saveMessage({
        userId: testUserId,
        content: 'First message',
        role: 'user',
      });
      await chatService.saveMessage({
        userId: testUserId,
        content: 'Second message',
        role: 'assistant',
      });

      // ACT
      const history = await chatService.getHistory(testUserId);

      // ASSERT
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('First message');
      expect(history[1].content).toBe('Second message');
    });
  });
});
```

---

## 6. Testes E2E

### 6.1 Definição

**Testes E2E (End-to-End) verificam o fluxo completo da aplicação.**

Características:
- ✅ Simulam usuário real
- ✅ Testam frontend + backend + banco
- ✅ Mais lentos (10-30s cada)
- ✅ Poucos, mas críticos

### 6.2 Ferramentas

- **Playwright:** Recomendado para testes E2E web
- **Cypress:** Alternativa popular
- **Puppeteer:** Para casos específicos

### 6.3 Exemplo: Playwright E2E Test

```typescript
// frontend/tests/e2e/chat-flow.e2e.test.ts
// Standards: docs/STANDARDS.md

import { test, expect } from '@playwright/test';

test.describe('Chat Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/chat');
  });

  test('should send message and receive response', async ({ page }) => {
    // ARRANGE
    const testMessage = 'Hello, AI! What is 2+2?';

    // ACT
    await page.fill('textarea[placeholder*="Digite sua mensagem"]', testMessage);
    await page.click('button[aria-label="Enviar mensagem"]');

    // ASSERT
    // Verificar mensagem do usuário aparece
    await expect(page.locator('text=' + testMessage)).toBeVisible();

    // Verificar resposta da IA aparece
    await expect(page.locator('[data-testid="ai-message"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verificar textarea foi limpa
    await expect(page.locator('textarea[placeholder*="Digite sua mensagem"]')).toHaveValue('');
  });

  test('should display message history', async ({ page }) => {
    // ACT
    await page.fill('textarea', 'First message');
    await page.click('button[aria-label="Enviar mensagem"]');
    await page.waitForTimeout(2000);

    await page.fill('textarea', 'Second message');
    await page.click('button[aria-label="Enviar mensagem"]');
    await page.waitForTimeout(2000);

    // ASSERT
    const messages = page.locator('[data-testid="chat-message"]');
    await expect(messages).toHaveCount(4); // 2 user + 2 AI
  });

  test('should handle error gracefully', async ({ page }) => {
    // Simular erro de rede
    await page.route('**/api/chat', (route) => {
      route.abort('failed');
    });

    // ACT
    await page.fill('textarea', 'This will fail');
    await page.click('button[aria-label="Enviar mensagem"]');

    // ASSERT
    await expect(page.locator('text=Erro ao enviar mensagem')).toBeVisible();
  });
});
```

---

## 7. Mocking e Fixtures

### 7.1 Princípios de Mocking

**Mock apenas o que é necessário para isolar a unidade testada.**

```typescript
// ❌ ERRADO - Mock excessivo
jest.mock('../../utils/logger');
jest.mock('../../utils/validators');
jest.mock('../../services/database');
jest.mock('../../services/cache');

// ✅ CORRETO - Mock apenas dependências externas
jest.mock('../../services/database');
```

### 7.2 Tipos de Mocks

#### 7.2.1 Mock de Função

```typescript
const mockFunction = jest.fn();

// Configurar retorno
mockFunction.mockReturnValue('mocked value');
mockFunction.mockResolvedValue('async mocked value');

// Verificar chamadas
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFunction).toHaveBeenCalledTimes(2);
```

#### 7.2.2 Mock de Módulo

```typescript
// Mock completo
jest.mock('../services/aiService', () => ({
  aiService: {
    generate: jest.fn().mockResolvedValue({ content: 'mocked' }),
    getModels: jest.fn().mockResolvedValue([]),
  },
}));

// Mock parcial
jest.mock('../services/aiService', () => ({
  ...jest.requireActual('../services/aiService'),
  aiService: {
    generate: jest.fn(),
  },
}));
```

#### 7.2.3 Mock de Classe

```typescript
class MockPrismaClient {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

jest.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));
```

### 7.3 Fixtures

**Fixtures são dados de teste reutilizáveis.**

```typescript
// backend/tests/fixtures/users.ts
// Standards: docs/STANDARDS.md

export const userFixtures = {
  validUser: {
    email: 'valid@example.com',
    password: 'Password123!',
    name: 'Valid User',
  },

  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Admin User',
    role: 'admin',
  },

  invalidEmail: {
    email: 'invalid-email',
    password: 'Password123!',
    name: 'Invalid',
  },

  weakPassword: {
    email: 'weak@example.com',
    password: '123',
    name: 'Weak Password User',
  },
};
```

**Uso:**

```typescript
import { userFixtures } from '../fixtures/users';

describe('UserService', () => {
  it('should create user with valid data', async () => {
    const user = await userService.create(userFixtures.validUser);
    expect(user.email).toBe(userFixtures.validUser.email);
  });

  it('should reject invalid email', async () => {
    await expect(
      userService.create(userFixtures.invalidEmail)
    ).rejects.toThrow('Invalid email');
  });
});
```

### 7.4 Factories

**Factories geram dados de teste dinâmicos.**

```typescript
// backend/tests/factories/userFactory.ts
// Standards: docs/STANDARDS.md

import { faker } from '@faker-js/faker';

export const userFactory = {
  build: (overrides = {}) => ({
    email: faker.internet.email(),
    password: 'Password123!',
    name: faker.person.fullName(),
    ...overrides,
  }),

  buildMany: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => userFactory.build(overrides));
  },
};
```

**Uso:**

```typescript
import { userFactory } from '../factories/userFactory';

describe('UserService', () => {
  it('should handle multiple users', async () => {
    const users = userFactory.buildMany(5);
    
    for (const userData of users) {
      await userService.create(userData);
    }

    const allUsers = await userService.findAll();
    expect(allUsers).toHaveLength(5);
  });

  it('should create user with custom email', async () => {
    const user = userFactory.build({ email: 'custom@example.com' });
    const created = await userService.create(user);
    expect(created.email).toBe('custom@example.com');
  });
});
```

### 7.5 MSW (Mock Service Worker)

**MSW intercepta requisições HTTP no nível de rede.**

```typescript
// frontend/tests/mocks/handlers.ts
// Standards: docs/STANDARDS.md

import { rest } from 'msw';

export const handlers = [
  // Mock de login
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      })
    );
  }),

  // Mock de chat
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          message: 'Mocked AI response',
          id: 'msg-123',
        },
      })
    );
  }),

  // Mock de erro
  rest.get('/api/models', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        status: 'error',
        message: 'Internal server error',
      })
    );
  }),
];
```

**Setup:**

```typescript
// frontend/tests/setup.ts
// Standards: docs/STANDARDS.md

import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 8. Testes Assíncronos

### 8.1 Padrões de Teste Assíncrono

#### 8.1.1 Async/Await (Recomendado)

```typescript
// ✅ CORRETO - Async/await
it('should fetch user data', async () => {
  const user = await userService.findById('1');
  expect(user.name).toBe('Test User');
});

// ❌ ERRADO - Sem await
it('should fetch user data', async () => {
  const user = userService.findById('1'); // Promise não resolvida!
  expect(user.name).toBe('Test User'); // Falha
});
```

#### 8.1.2 Promises

```typescript
// ✅ CORRETO - Retornar promise
it('should fetch user data', () => {
  return userService.findById('1').then((user) => {
    expect(user.name).toBe('Test User');
  });
});

// ❌ ERRADO - Não retornar promise
it('should fetch user data', () => {
  userService.findById('1').then((user) => {
    expect(user.name).toBe('Test User'); // Pode não executar!
  });
});
```

#### 8.1.3 Callbacks (Evitar)

```typescript
// ⚠️ EVITAR - Callback (legado)
it('should fetch user data', (done) => {
  userService.findById('1', (err, user) => {
    expect(user.name).toBe('Test User');
    done();
  });
});
```

### 8.2 Testando Erros Assíncronos

```typescript
// ✅ CORRETO - expect().rejects
it('should throw error when user not found', async () => {
  await expect(userService.findById('invalid')).rejects.toThrow('User not found');
});

// ✅ CORRETO - try/catch
it('should throw error when user not found', async () => {
  try {
    await userService.findById('invalid');
    fail('Should have thrown error');
  } catch (error) {
    expect(error.message).toBe('User not found');
  }
});

// ❌ ERRADO - Sem tratamento de erro
it('should throw error when user not found', async () => {
  const user = await userService.findById('invalid'); // Erro não capturado!
  expect(user).toBeNull();
});
```

### 8.3 Timeouts

```typescript
// Aumentar timeout para teste específico
it('should handle long operation', async () => {
  const result = await longRunningOperation();
  expect(result).toBeTruthy();
}, 10000); // 10 segundos

// Timeout global no jest.config.js
module.exports = {
  testTimeout: 5000, // 5 segundos padrão
};
```

### 8.4 Testando Timers

```typescript
describe('Timer Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute callback after delay', () => {
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    
    expect(callback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should execute interval multiple times', () => {
    const callback = jest.fn();
    
    setInterval(callback, 1000);
    
    jest.advanceTimersByTime(3000);
    
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
```

### 8.5 Testando Streams

```typescript
describe('Stream Tests', () => {
  it('should handle streaming response', async () => {
    const chunks: string[] = [];
    
    const stream = await chatService.streamResponse('Hello');
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toContain('response');
  });
});
```

---

## 9. Cobertura de Código

### 9.1 Metas de Cobertura

| Tipo de Código | Cobertura Mínima | Ideal |
|----------------|------------------|-------|
| **Services críticos** | ≥70% | ≥85% |
| **Controllers** | ≥50% | ≥70% |
| **Utils/Helpers** | ≥80% | ≥95% |
| **Components React** | ≥50% (lógica) | ≥70% |

> **Nota:** Cobertura é um indicador, não um objetivo. Testes de qualidade > quantidade.

### 9.2 Configuração Jest

```javascript
// jest.config.js
// Standards: docs/STANDARDS.md

module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],
  
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

### 9.3 Executando Cobertura

```bash
# Backend
cd backend
npm run test:coverage

# Frontend
cd frontend
npm run test:coverage

# Ver relatório HTML
open coverage/lcov-report/index.html
```

### 9.4 Interpretando Métricas

```
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
----------|---------|----------|---------|---------|----------------
All files |   78.5  |   72.3   |   81.2  |   78.1  |
services/ |   85.2  |   80.1   |   88.5  |   84.9  |
  auth.ts |   92.3  |   87.5   |   100   |   91.8  | 45-47, 89
  chat.ts |   78.1  |   72.7   |   77.0  |   78.0  | 23-25, 67-72
```

**Métricas:**
- **Statements:** % de declarações executadas
- **Branches:** % de ramificações (if/else) testadas
- **Functions:** % de funções chamadas
- **Lines:** % de linhas executadas

### 9.5 Ignorando Código da Cobertura

```typescript
// Ignorar bloco específico
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// Ignorar função completa
/* istanbul ignore next */
function debugHelper() {
  // Código de debug
}

// Ignorar arquivo completo (no topo do arquivo)
/* istanbul ignore file */
```

### 9.6 Quando NÃO Buscar 100% de Cobertura

- ❌ Código de configuração/setup
- ❌ Tipos TypeScript puros
- ❌ Código de debug/desenvolvimento
- ❌ Código gerado automaticamente
- ❌ Código trivial (getters/setters simples)

---

## 10. CI/CD

### 10.1 Pipeline de Testes

```yaml
# .github/workflows/test.yml
# Standards: docs/STANDARDS.md

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: myia_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Run linter
        working-directory: backend
        run: npm run lint
      
      - name: Run type check
        working-directory: backend
        run: npm run type-check
      
      - name: Run unit tests
        working-directory: backend
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/myia_test
      
      - name: Run integration tests
        working-directory: backend
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/myia_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage/lcov.info
          flags: backend

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run linter
        working-directory: frontend
        run: npm run lint
      
      - name: Run type check
        working-directory: frontend
        run: npm run type-check
      
      - name: Run tests
        working-directory: frontend
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: frontend/coverage/lcov.info
          flags: frontend
```

### 10.2 Scripts NPM

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### 10.3 Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running tests..."

# Backend tests
cd backend && npm run test:unit || exit 1

# Frontend tests
cd ../frontend && npm run test:unit || exit 1

echo "✅ All tests passed!"
```

### 10.4 Quality Gates

**Critérios para aprovar PR:**

- ✅ Todos os testes passando
- ✅ Cobertura ≥ threshold definido
- ✅ Linter sem erros
- ✅ Type check sem erros
- ✅ Build bem-sucedido

---

## 11. Troubleshooting

### 11.1 Problemas Comuns

#### 11.1.1 Testes Falhando Intermitentemente

**Problema:** Testes passam às vezes, falham outras vezes.

**Causas:**
- Dependência de ordem de execução
- Estado compartilhado entre testes
- Timers/delays não mockados
- Race conditions

**Solução:**

```typescript
// ❌ ERRADO - Estado compartilhado
let sharedUser;

beforeAll(async () => {
  sharedUser = await createUser();
});

it('test 1', () => {
  sharedUser.name = 'Modified'; // Afeta outros testes!
});

// ✅ CORRETO - Estado isolado
beforeEach(async () => {
  const user = await createUser();
  return user;
});

it('test 1', async () => {
  const user = await createUser();
  user.name = 'Modified'; // Isolado
});
```

#### 11.1.2 Testes Lentos

**Problema:** Suite de testes demora muito.

**Soluções:**

```typescript
// 1. Executar em paralelo
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Usa 50% dos cores
};

// 2. Usar beforeAll para setup pesado
beforeAll(async () => {
  await setupDatabase(); // Uma vez por suite
});

// 3. Mockar operações lentas
jest.mock('../services/externalAPI');

// 4. Usar fake timers
jest.useFakeTimers();
```

#### 11.1.3 Mocks Não Funcionando

**Problema:** Mock não está sendo aplicado.

**Causas:**
- Mock declarado após import
- Caminho incorreto
- Mock não resetado

**Solução:**

```typescript
// ❌ ERRADO - Mock após import
import { userService } from '../services/userService';
jest.mock('../services/userService');

// ✅ CORRETO - Mock antes de import
jest.mock('../services/userService');
import { userService } from '../services/userService';

// ✅ CORRETO - Reset após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
```

#### 11.1.4 Erro: "Cannot find module"

**Problema:** Jest não encontra módulo.

**Solução:**

```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  modulePaths: ['<rootDir>/src'],
};
```

#### 11.1.5 Erro: "ReferenceError: TextEncoder is not defined"

**Problema:** APIs do navegador não disponíveis no Node.

**Solução:**

```javascript
// jest.setup.js
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
```

### 11.2 Debug de Testes

```typescript
// 1. Executar teste específico
npm test -- --testNamePattern="should login"

// 2. Executar arquivo específico
npm test -- userService.test.ts

// 3. Debug com Node Inspector
node --inspect-brk node_modules/.bin/jest --runInBand

// 4. Adicionar breakpoints
it('should work', () => {
  debugger; // Pausa aqui
  expect(true).toBe(true);
});

// 5. Ver output detalhado
npm test -- --verbose

// 6. Ver apenas falhas
npm test -- --onlyFailures
```

---

## 12. Exemplos Práticos

### 12.1 Backend: Controller Completo

```typescript
// backend/src/controllers/__tests__/chatController.test.ts
// Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { ChatController } from '../chatController';
import { ChatService } from '../../services/chat/chatService';

jest.mock('../../services/chat/chatService');

describe('ChatController', () => {
  let controller: ChatController;
  let mockChatService: jest.Mocked<ChatService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockChatService = {
      sendMessage: jest.fn(),
      getHistory: jest.fn(),
    } as any;

    controller = new ChatController(mockChatService);

    mockRequest = {
      body: {},
      params: {},
      user: { id: 'user-123' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should return 200 with AI response', async () => {
      // ARRANGE
      mockRequest.body = {
        message: 'Hello, AI!',
        model: 'claude-3-5-sonnet',
      };

      const mockAIResponse = {
        id: 'msg-123',
        content: 'Hello! How can I help you?',
        model: 'claude-3-5-sonnet',
      };

      mockChatService.sendMessage.mockResolvedValue(mockAIResponse);

      // ACT
      await controller.sendMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockAIResponse,
      });
      expect(mockChatService.sendMessage).toHaveBeenCalledWith({
        userId: 'user-123',
        message: 'Hello, AI!',
        model: 'claude-3-5-sonnet',
      });
    });

    it('should return 400 when message is empty', async () => {
      // ARRANGE
      mockRequest.body = {
        message: '',
        model: 'claude-3-5-sonnet',
      };

      // ACT
      await controller.sendMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'fail',
        data: {
          message: 'Message cannot be empty',
        },
      });
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      // ARRANGE
      mockRequest.body = {
        message: 'Hello',
        model: 'claude-3-5-sonnet',
      };

      mockChatService.sendMessage.mockRejectedValue(
        new Error('AI service unavailable')
      );

      // ACT
      await controller.sendMessage(
        mockRequest as Request,
        mockResponse as Response
      );

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'AI service unavailable',
      });
    });
  });

  describe('getHistory', () => {
    it('should return chat history', async () => {
      // ARRANGE
      const mockHistory = [
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi!', role: 'assistant' },
      ];

      mockChatService.getHistory.mockResolvedValue(mockHistory);

      // ACT
      await controller.getHistory(
        mockRequest as Request,
        mockResponse as Response
      );

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { history: mockHistory },
      });
    });
  });
});
```

### 12.2 Frontend: Hook Completo

```typescript
// frontend/src/features/chat/hooks/__tests__/useChatLogic.test.ts
// Standards: docs/STANDARDS.md

import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatLogic } from '../useChatLogic';
import { chatService } from '../../services/chatService';

jest.mock('../../services/chatService');

describe('useChatLogic', () => {
  const mockChatService = chatService as jest.Mocked<typeof chatService>;

  beforeEach(() => {
    mockChatService.sendMessage.mockClear();
    mockChatService.getHistory.mockClear();
  });

  it('should initialize with empty messages', () => {
    // ACT
    const { result } = renderHook(() => useChatLogic());

    // ASSERT
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should send message successfully', async () => {
    // ARRANGE
    const mockResponse = {
      id: 'msg-123',
      content: 'AI response',
      role: 'assistant',
    };

    mockChatService.sendMessage.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChatLogic());

    // ACT
    await act(async () => {
      await result.current.sendMessage('Hello, AI!');
    });

    // ASSERT
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2); // user + AI
      expect(result.current.messages[0].content).toBe('Hello, AI!');
      expect(result.current.messages[1].content).toBe('AI response');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle error when sending message', async () => {
    // ARRANGE
    mockChatService.sendMessage.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useChatLogic());

    // ACT
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // ASSERT
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should load history on mount', async () => {
    // ARRANGE
    const mockHistory = [
      { id: '1', content: 'Previous message', role: 'user' },
    ];

    mockChatService.getHistory.mockResolvedValue(mockHistory);

    // ACT
    const { result } = renderHook(() => useChatLogic());

    // ASSERT
    await waitFor(() => {
      expect(result.current.messages).toEqual(mockHistory);
    });
  });

  it('should clear messages', async () => {
    // ARRANGE
    const { result } = renderHook(() => useChatLogic());

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    // ACT
    act(() => {
      result.current.clearMessages();
    });

    // ASSERT
    expect(result.current.messages).toEqual([]);
  });
});
```

### 12.3 Frontend: Componente com MSW

```typescript
// frontend/src/features/chat/components/__tests__/ChatWindow.test.tsx
// Standards: docs/STANDARDS.md

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ChatWindow } from '../ChatWindow';

const server = setupServer(
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'success',
        data: {
          id: 'msg-123',
          content: 'Mocked AI response',
          role: 'assistant',
        },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ChatWindow', () => {
  it('should send message and display response', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<ChatWindow />);

    const textarea = screen.getByPlaceholderText(/digite sua mensagem/i);
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    // ACT
    await user.type(textarea, 'Hello, AI!');
    await user.click(sendButton);

    // ASSERT
    // Mensagem do usuário aparece
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();

    // Resposta da IA aparece
    await waitFor(() => {
      expect(screen.getByText('Mocked AI response')).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    // ARRANGE
    server.use(
      rest.post('/api/chat', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            message: 'Service unavailable',
          })
        );
      })
    );

    const user = userEvent.setup();
    render(<ChatWindow />);

    // ACT
    await user.type(screen.getByPlaceholderText(/digite/i), 'Test');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText(/erro ao enviar mensagem/i)).toBeInTheDocument();
    });
  });
});
```

---

## 📋 Checklist de Conformidade

Antes de commitar testes, verificar:

### Estrutura
- [ ] Testes em `__tests__/` ou `tests/`
- [ ] Nome segue padrão `*.test.ts`
- [ ] Header com caminho relativo e referência ao STANDARDS.md

### Nomenclatura
- [ ] `describe` usa nome do módulo/classe
- [ ] `it` usa padrão "should [ação] when [condição]"
- [ ] Nomes descritivos e claros

### Qualidade
- [ ] Padrão AAA (Arrange, Act, Assert)
- [ ] Testes isolados (sem dependências entre si)
- [ ] Mocks explícitos e tipados
- [ ] Cleanup após cada teste (`afterEach`)

### Cobertura
- [ ] Services críticos ≥70%
- [ ] Controllers ≥50%
- [ ] Utils ≥80%

### CI/CD
- [ ] Todos os testes passando localmente
- [ ] Linter sem erros
- [ ] Type check sem erros

---

## 📚 Referências

- **STANDARDS.md:** [`docs/STANDARDS.md`](../STANDARDS.md) - Seção 13: Testes
- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **MSW Documentation:** https://mswjs.io/docs/
- **Supertest:** https://github.com/ladjs/supertest
- **Playwright:** https://playwright.dev/docs/intro

---

## 🎯 Conclusão

Este guia estabelece os padrões obrigatórios para testes no projeto MyIA. Seguir estas diretrizes garante:

✅ **Código Confiável:** Testes previnem regressões  
✅ **Refatoração Segura:** Mudanças com confiança  
✅ **Documentação Viva:** Testes documentam comportamento  
✅ **Deploy Seguro:** CI/CD com qualidade garantida  

**Lembre-se:**
- Teste **comportamento**, não **implementação**
- Cobertura é **indicador**, não **objetivo**
- Testes de **qualidade** > **quantidade**
- Testes são **parte integral** do código

---

**Última atualização:** 2026-02-07  
**Versão:** 1.0.0  
**Autor:** Equipe MyIA