# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.4.0] - 2025-01-13

### Added
- Seção 14 (Commits e Versionamento) no STANDARDS.md
- Seção 12.5 (Tratamento de Erros) no STANDARDS.md
- Índice navegável no STANDARDS.md com 4 categorias
- CHANGELOG.md seguindo padrão Keep a Changelog
- docs/README.md como hub central de navegação
- Organização de documentação em archive/ e tests/

### Changed
- Reorganização completa do STANDARDS.md com estrutura lógica
- Subseções numeradas (3.0, 3.1, 12.5, 14.1-14.6)
- Movidos 10 relatórios históricos para docs/archive/
- Movidos 4 documentos de teste para docs/tests/

### Removed
- Arquivos duplicados e temporários (temp.md, architecture.md duplicado)

---

## [1.3.0] - 2025-01-12

### Added
- JSend standardization across all REST endpoints
- Security test suite with 7 categories (100% pass)
- Automated test scripts (get-test-token.sh, test-jsend-routes.sh)
- Seção 9 (Segurança) no STANDARDS.md com Zero-Trust e Fail-Secure
- Helper utility jsend.ts com success(), fail(), error()

### Fixed
- JWT payload mismatch (userId vs id) in authMiddleware
- Race condition in AuthContext with isValidatingRef flag
- Race condition in chatService with token validation
- localStorage token persistence with 50ms delay
- promptTraceService response access after JSend migration

### Changed
- All controllers migrated to JSend format (9 controllers)
- All rate limiters migrated to JSend format (3 limiters)
- Frontend interceptor auto-unwraps JSend responses
- Replaced 2 hardcoded colors with MUI theme tokens

---

## [1.2.0] - 2025-01-10

### Added
- Analytics dashboard with 3 engineering charts
- Telemetry tracking per message (cost, tokens, bytes)
- LineChart: Daily total cost (last 30 days)
- BarChart: Cost efficiency per provider ($/1k tokens)
- ScatterChart: Load map (input vs output tokens)
- Detailed API call logs in database

### Changed
- Enhanced ApiCallLog model with financial telemetry
- Message model includes sentContext for prompt tracing

---

## [1.1.0] - 2025-01-08

### Added
- Multi-provider chat system (6 providers: OpenAI, Groq, Anthropic, Together, Perplexity, Mistral)
- Persistent chat history with database storage
- Multiple conversations management
- Sidebar with conversation list and quick search
- AI provider selector per message
- Dark/Light mode with database persistence
- Theme synchronization across devices

### Changed
- Chat messages now saved permanently in database
- User preferences stored in UserSettings table

---

## [1.0.0] - 2025-01-05

### Added
- JWT authentication system with secure tokens (min 32 chars)
- User registration and login with bcrypt hashing
- Route protection in frontend and backend
- Authentication middleware for protected routes
- Rate limiting (3 levels: auth, chat, global API)
- Helmet.js security headers (CSP, X-Frame-Options)
- Zod validation on all routes
- AES-256 encryption for API keys
- SQL injection protection with Prisma ORM
- Configurable CORS with origin whitelist
- Health check endpoint for monitoring
- Graceful shutdown with clean database disconnect
- Global error handling for uncaught exceptions
- Structured logging with Winston

### Security
- Zero-Trust architecture from first commit
- Fail-Secure principle in all security checks
- Mandatory secret validation on startup
- 100% security test coverage (7/7 tests passing)

---

## [0.1.0] - 2025-01-01

### Added
- Initial project setup
- Backend structure with Express.js and TypeScript
- Frontend structure with React 18 and Vite
- PostgreSQL database with Prisma ORM
- Material-UI (MUI) v6 component library
- Basic project documentation
- STANDARDS.md with immutable rules
- start.sh management script

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de vulnerabilidades
