# 🛠️ Guia de Setup - Assistente IA MVP

## 📅 Data de Início: 08/10/2025

**Status:** Backend completo | Frontend pendente  
**Responsável:** @LeoPassos98

---

## 🎯 Objetivo

Documentar **passo a passo** a configuração e implementação do projeto do zero, permitindo rastreabilidade total e facilitando retomada do desenvolvimento.

---

## ✅ Fase 1: Estrutura de Pastas e Arquivos

### Passo 1.1: Criar Estrutura de Pastas
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
mkdir -p frontend/src/components/{Chat,Auth,Layout} frontend/src/{pages,services,contexts,types,utils} frontend/public backend/src/{controllers,services,middleware,routes,types,config,utils,prisma} docs
```

**Resultado:**
- 24 diretórios criados
- Estrutura modular frontend/backend separada

---

### Passo 1.2: Criar Arquivos Base
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
touch backend/{package.json,tsconfig.json,.env.example,.gitignore} backend/src/server.ts backend/src/controllers/{authController,chatController}.ts backend/src/services/{authService,openaiService,contextService}.ts backend/src/middleware/{authMiddleware,errorHandler,validateRequest}.ts backend/src/routes/{authRoutes,chatRoutes}.ts backend/src/config/{database,env}.ts backend/src/utils/{jwt,logger}.ts backend/src/types/index.ts backend/src/prisma/schema.prisma frontend/{package.json,tsconfig.json,.env.example,.gitignore} frontend/src/{App,index}.tsx frontend/src/components/Chat/{ChatWindow,MessageList,MessageInput}.tsx frontend/src/components/Auth/{LoginForm,RegisterForm}.tsx frontend/src/components/Layout/{Navbar,MainLayout}.tsx frontend/src/pages/{Login,Register,Chat}.tsx frontend/src/services/{api,authService,chatService}.ts frontend/src/contexts/AuthContext.tsx frontend/src/types/index.ts frontend/src/utils/storage.ts docs/{api-endpoints,progress,architecture,setup-guide}.md
```

**Resultado:**
- 46 arquivos criados
- Pronto para configuração

---

## 🔧 Fase 2: Configuração Inicial

### Passo 2.1: Backend package.json
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/package.json`

**Dependências instaladas:**
- `express`: Framework web
- `@prisma/client`: ORM
- `bcrypt`: Hash de senhas
- `jsonwebtoken`: JWT
- `openai`: SDK OpenAI
- `zod`: Validação
- `cors`: CORS
- `dotenv`: Variáveis de ambiente

**Scripts configurados:**
- `npm run dev`: Desenvolvimento (tsx watch)
- `npm run build`: Build TypeScript
- `npm start`: Produção
- `npm run prisma:generate`: Gerar cliente Prisma
- `npm run prisma:migrate`: Migrar banco
- `npm run prisma:studio`: UI do banco

---

### Passo 2.2: Backend tsconfig.json
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/tsconfig.json`

**Configurações principais:**
- `target: ES2022`: JavaScript moderno
- `module: CommonJS`: Compatível com Node.js
- `strict: true`: Máxima segurança de tipos
- `outDir: ./dist`: Código compilado vai para pasta dist
- `rootDir: ./src`: Código fonte em src
- `sourceMap: true`: Facilita debug

**Flags rigorosas:**
- `noUnusedLocals`: Avisa sobre variáveis não usadas
- `noUnusedParameters`: Avisa sobre parâmetros não usados
- `noImplicitReturns`: Força retorno explícito
- `strictNullChecks`: Previne erros de null/undefined

---

### Passo 2.3: Backend .env.example
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/.env.example`

**Variáveis configuradas:**
- `PORT=3001`: Porta do servidor
- `DATABASE_URL`: String de conexão PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT
- `JWT_EXPIRES_IN=7d`: Expiração do token
- `OPENAI_API_KEY`: Chave da API OpenAI
- `OPENAI_MODEL=gpt-3.5-turbo`: Modelo padrão
- `MAX_CONTEXT_MESSAGES=15`: Limite de mensagens no contexto
- `CONTEXT_CLEANUP_INTERVAL=3600000`: Limpeza a cada 1h
- `CORS_ORIGIN`: URL do frontend

---

### Passo 2.4: Backend .gitignore
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/.gitignore`

**Exclusões principais:**
- `node_modules/`, `.env`, `dist/`
- Arquivos de IDE e sistema operacional
- Logs e arquivos temporários

---

### Passo 2.5: Prisma Schema
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/prisma/schema.prisma` (movido de src/prisma)

**Modelo User criado:**
- `id`: UUID (chave primária)
- `email`: String única
- `password`: String (hash bcrypt)
- `name`: String opcional
- `createdAt`, `updatedAt`: Timestamps automáticos

---

### Passo 2.6: Frontend package.json
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/package.json`

**Dependências principais:**
- `react` + `react-dom`: Framework
- `@mui/material`: Material-UI
- `axios`: Cliente HTTP
- `react-router-dom`: Rotas
- `vite`: Build tool

**Scripts:**
- `npm run dev`: Desenvolvimento
- `npm run build`: Build produção

---

### Passo 2.7: Frontend tsconfig.json
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos:** `frontend/tsconfig.json` + `frontend/tsconfig.node.json`

**Configurações:**
- `target: ES2020`: JavaScript moderno
- `jsx: react-jsx`: React 18+
- Path aliases: `@/*` → `src/*`
- Strict mode ativado

---

### Passo 2.8: Frontend .env.example
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/.env.example`

**Variável:**
- `VITE_API_URL=http://localhost:3001/api`

---

### Passo 2.9: Frontend .gitignore
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/.gitignore`

**Exclusões:**
- `node_modules/`, `.env`, `dist/`
- Arquivos de build e cache do Vite

---

## ✅ Fase 3: Arquivos Adicionais do Vite

### Passo 3.1: Frontend vite.config.ts
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/vite.config.ts`

**Configurações:**
- Plugin React com Fast Refresh
- Path alias `@` → `./src`
- Servidor na porta 3000
- Abre browser automaticamente

---

### Passo 3.2: Frontend index.html
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/index.html`

**Estrutura:**
- Entry point HTML da aplicação
- `<div id="root">`: Container React
- `<script src="/src/index.tsx">`: Entry point TypeScript
- Meta tags e idioma pt-BR

---

### Passo 3.3: .gitignore (Raiz)
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `.gitignore` (raiz do projeto)

**Exclusões globais:**
- `node_modules/`, `.env`, `dist/`
- Arquivos de IDE e sistema operacional
- Logs e builds

---

## ✅ Fase 4: Instalação de Dependências

### Passo 4.1: Instalar Backend
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
cd backend && npm install
```

**Resultado:**
- 159 pacotes instalados
- `node_modules/` e `package-lock.json` criados
- Dependências: express, prisma, bcrypt, jwt, openai, zod

---

### Passo 4.2: Instalar Frontend
**Data:** 08/10/2025  
**Status:** ✅ Concluído (com correção)

**Problema encontrado:**
- Conflito de versões ESLint 9.x com plugins

**Solução aplicada:**
- Downgrade ESLint: `9.10.0` → `8.57.0`
- Downgrade @typescript-eslint: `8.6.0` → `7.18.0`

**Comando:**
```bash
cd frontend && npm install
```

**Resultado:**
- Dependências instaladas com sucesso
- React, MUI, Vite, axios configurados

---

### Passo 4.3: Gerar Cliente Prisma
**Data:** 08/10/2025  
**Status:** ✅ Concluído (com correção)

**Problema encontrado:**
- Schema estava em `src/prisma/` (local incorreto)

**Solução aplicada:**
- Movido para `prisma/schema.prisma` (padrão Prisma)

**Comando:**
```bash
mkdir -p prisma
mv src/prisma/schema.prisma prisma/schema.prisma
rmdir src/prisma
npm run prisma:generate
```

**Resultado:**
- Cliente Prisma gerado em `node_modules/@prisma/client`
- Tipos TypeScript para modelo User disponíveis

---

## ✅ Fase 5: Configuração de Ambiente

### Passo 5.1: Mudança para SQLite
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Motivo:**
- PostgreSQL exigiu senha sudo no Codespace
- SQLite é mais simples para desenvolvimento

**Arquivos alterados:**
- `backend/prisma/schema.prisma`: `provider = "sqlite"`
- `backend/.env.example`: `DATABASE_URL="file:./dev.db"`

---

### Passo 5.2: Criar .env Backend
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `backend/.env`

**Variáveis configuradas:**
- PORT=3001
- DATABASE_URL="file:./dev.db"
- JWT_SECRET (gerado)
- OPENAI_API_KEY (placeholder)
- MAX_CONTEXT_MESSAGES=15
- CORS_ORIGIN=http://localhost:3000

---

### Passo 5.3: Criar .env Frontend
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivo:** `frontend/.env`

**Variável:**
- VITE_API_URL=http://localhost:3001/api

---

### Passo 5.4: Gerar Cliente Prisma (SQLite)
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
npm run prisma:generate
```

**Resultado:**
- Cliente regenerado para SQLite

---

### Passo 5.5: Executar Migração
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
npm run prisma:migrate
```

**Nome da migração:** `init`

**Resultado:**
- Arquivo `backend/dev.db` criado
- Tabela `users` criada
- Pasta `prisma/migrations/` criada

---

## ✅ Fase 6: Implementação Backend Core

### Passo 6.1: Utilitários
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/utils/jwt.ts`: Funções para gerar e verificar JWT
- `backend/src/utils/logger.ts`: Sistema de logs com timestamp

**Funcionalidades:**
- `generateToken()`: Cria token JWT
- `verifyToken()`: Valida token JWT
- Logger com níveis: info, warn, error, debug

---

### Passo 6.2: Middlewares
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/middleware/errorHandler.ts`: Tratamento global de erros
- `backend/src/middleware/authMiddleware.ts`: Validação de JWT
- `backend/src/middleware/validateRequest.ts`: Validação com Zod

**Funcionalidades:**
- Classe `AppError` para erros customizados
- Proteção de rotas com JWT
- Validação automática de requisições

---

### Passo 6.3: Services
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/services/authService.ts`: Lógica de autenticação
- `backend/src/services/contextService.ts`: Gerenciamento de contexto
- `backend/src/services/openaiService.ts`: Integração OpenAI

**Funcionalidades:**
- Registro e login de usuários
- Hash de senhas com bcrypt
- Contexto em memória (Map) com limite de 15 mensagens
- Limpeza automática de contextos inativos
- Integração OpenAI com fallback para mock

---

### Passo 6.4: Controllers
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/controllers/authController.ts`: Endpoints de auth
- `backend/src/controllers/chatController.ts`: Endpoints de chat

**Funcionalidades:**
- `register()`: Criar usuário
- `login()`: Autenticar usuário
- `getMe()`: Dados do usuário autenticado
- `sendMessage()`: Enviar mensagem para IA
- `clearContext()`: Limpar histórico

---

### Passo 6.5: Rotas e Types
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/types/index.ts`: Schemas Zod
- `backend/src/routes/authRoutes.ts`: Rotas de autenticação
- `backend/src/routes/chatRoutes.ts`: Rotas de chat

**Endpoints criados:**
- `POST /api/auth/register`: Registro
- `POST /api/auth/login`: Login
- `GET /api/auth/me`: Dados do usuário (protegido)
- `POST /api/chat/message`: Enviar mensagem (protegido)
- `DELETE /api/chat/context`: Limpar contexto (protegido)

---

### Passo 6.6: Servidor Principal
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Arquivos implementados:**
- `backend/src/config/env.ts`: Configuração de variáveis
- `backend/src/config/database.ts`: Cliente Prisma
- `backend/src/server.ts`: Servidor Express

**Funcionalidades:**
- Servidor Express na porta 3001
- CORS configurado
- Logging de requisições
- Health check em `/health`
- Error handler global

**Teste:**
```bash
npm run dev
```

**Resultado:** ✅ Servidor rodando

---

## ✅ Fase 7: Testes do Backend

### Passo 7.1: Iniciar Servidor
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Comando:**
```bash
cd backend && npm run dev
```

**Resultado:**
```
🚀 Server running on port 3001
📝 Environment: development
🌐 CORS enabled for: http://localhost:3000
```

---

### Passo 7.2: Testes de Endpoints
**Data:** 08/10/2025  
**Status:** ✅ Concluído

**Testes executados:**

#### Health Check
```bash
curl http://localhost:3001/health
```
**Resultado:** ✅ `{"status":"ok","timestamp":"..."}`

#### Registro de Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123","name":"Usuario Teste"}'
```
**Resultado:** ✅ `{"message":"User registered successfully","userId":"..."}`

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123"}'
```
**Resultado:** ✅ `{"token":"...","user":{...}}`

#### Buscar Dados do Usuário
```bash
curl http://localhost:3001/api/auth/me \
  -H 'Authorization: Bearer TOKEN'
```
**Resultado:** ✅ `{"id":"...","email":"...","name":"...","createdAt":"..."}`

#### Enviar Mensagem para IA
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"message":"Olá, como você está?"}'
```
**Resultado:** ✅ `{"response":"Esta é uma resposta mock...","contextSize":2}`

#### Limpar Contexto
```bash
curl -X DELETE http://localhost:3001/api/chat/context \
  -H 'Authorization: Bearer TOKEN'
```
**Resultado:** ✅ `{"message":"Context cleared successfully"}`

**Resumo dos Testes:**
- ✅ 6/6 endpoints testados com sucesso
- ✅ Autenticação JWT funcionando
- ✅ Contexto de conversa funcionando
- ✅ Mock da OpenAI ativo

---

## 📊 Progresso Geral

| Fase | Status | Progresso |
|------|--------|-----------|
| 1. Estrutura | ✅ Concluído | 100% |
| 2. Configuração | ✅ Concluído | 100% (9/9) |
| 3. Arquivos Vite | ✅ Concluído | 100% (3/3) |
| 4. Instalação | ✅ Concluído | 100% (3/3) |
| 5. Ambiente | ✅ Concluído | 100% (5/5) |
| 6. Backend Core | ✅ Concluído | 100% (6/6) |
| 7. Testes Backend | ✅ Concluído | 100% (6/6) |
| 8. Frontend Core | ⏳ Pendente | 0% (0/8) |
| 9. Integração | ⏳ Pendente | 0% |

---

## 🔍 Observações

### Decisões Técnicas
- **ORM escolhido:** Prisma (type-safe + migrações fáceis)
- **Banco de Dados:** SQLite (desenvolvimento) / PostgreSQL (produção futura)
- **Contexto:** Map em memória (sem Redis no MVP)
- **Limite contexto:** 15 mensagens
- **Auth:** JWT simples (sem OAuth)
- **UI:** Material-UI (não Tailwind)
- **Build tool:** Vite (não CRA)

### Problemas Encontrados e Soluções

#### Problema 1: Conflito ESLint
**Erro:** `ERESOLVE unable to resolve dependency tree`
**Causa:** ESLint 9.x incompatível com plugins antigos
**Solução:** Downgrade para ESLint 8.57.0
**Status:** ✅ Resolvido

#### Problema 2: Prisma Schema não encontrado
**Erro:** `Could not find Prisma Schema`
**Causa:** Schema em local não-padrão (`src/prisma/`)
**Solução:** Mover para `prisma/schema.prisma`
**Status:** ✅ Resolvido

#### Problema 3: PostgreSQL requer senha sudo
**Erro:** Sudo pedindo senha no Codespace
**Causa:** Restrições de permissão no ambiente
**Solução:** Migração para SQLite (mais simples para dev)
**Status:** ✅ Resolvido

---

## 📝 Próximos Passos

### Fase 8: Implementação Frontend Core
1. ⏳ Configurar index.tsx e App.tsx base
2. ⏳ Implementar services (api, auth, chat)
3. ⏳ Implementar AuthContext
4. ⏳ Implementar componentes Auth (Login, Register)
5. ⏳ Implementar componentes Chat
6. ⏳ Implementar páginas
7. ⏳ Implementar layout (Navbar, MainLayout)
8. ⏳ Configurar rotas com React Router

### Fase 9: Integração e Testes Finais
1. ⏳ Testar fluxo completo (registro → login → chat)
2. ⏳ Ajustes de UI/UX
3. ⏳ Adicionar chave OpenAI real (opcional)
4. ⏳ Documentação de uso final

---

**Última atualização:** 08/10/2025 - 18:45

---

## 📈 Estatísticas do Projeto

**Total de arquivos criados:** 52  
**Arquivos com código implementado:** 18 (backend completo)  
**Pacotes npm instalados:** ~350+ (backend + frontend)  
**Linhas de código:** ~800 (backend)  
**Endpoints funcionais:** 6  
**Testes passando:** 6/6  
**Problemas resolvidos:** 3  
**Fases completas:** 7/9  
**Progresso geral:** 78%