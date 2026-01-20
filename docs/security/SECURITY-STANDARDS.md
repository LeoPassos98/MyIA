# 🔒 Padrões de Segurança – MyIA

> **Este documento complementa o [STANDARDS.md](STANDARDS.md) com regras específicas de segurança.**  
> Status: ✅ **Fase 2 Concluída** (100% dos testes passando)

---

## 1. Secrets e Credenciais (CRÍTICO)

### 1.1 Regra de Validação Obrigatória

**TODA aplicação DEVE validar secrets na inicialização.**

```typescript
// ❌ PROIBIDO - Fallbacks inseguros
const secret = process.env.JWT_SECRET || 'dev-secret';

// ✅ OBRIGATÓRIO - Validação com exit
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error('JWT_SECRET must be at least 32 characters');
  process.exit(1);
}
```

### 1.2 Secrets Obrigatórios

| Secret | Tamanho Mínimo | Geração |
|--------|----------------|---------|
| `JWT_SECRET` | 32 chars | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_SECRET` | 32 chars | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### 1.3 Armazenamento de API Keys

- **NUNCA** armazenar API keys em código ou `.env` em produção
- **SEMPRE** usar criptografia AES-256-GCM (`encryptionService.ts`)
- Armazenar chaves criptografadas no banco (`user_settings.api_keys`)

---

## 2. Rate Limiting (OBRIGATÓRIO)

### 2.1 Três Níveis de Proteção

**Implementação:** [backend/src/middleware/rateLimiter.ts](../backend/src/middleware/rateLimiter.ts)

```typescript
// 1. Auth Routes (Login/Register) - Anti Brute Force
authLimiter: 5 requests / 15 minutes

// 2. Chat Routes - Anti Spam
chatLimiter: 30 requests / minute

// 3. API Global - Anti DDoS
apiLimiter: 100 requests / minute
```

### 2.2 Aplicação Obrigatória

```typescript
// ❌ PROIBIDO - Rota sem rate limiting
app.post('/api/auth/login', authController.login);

// ✅ OBRIGATÓRIO - Rate limit ANTES do controller
app.post('/api/auth/login', authLimiter, authController.login);
```

### 2.3 Headers de Resposta

Rate limiters DEVEM retornar headers informativos:
- `X-RateLimit-Limit`: Limite total
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset
- `Retry-After`: Segundos até reset (quando bloqueado)

---

## 3. Validação de Entrada (ZOD)

### 3.1 Regra Arquitetural

**TODA rota POST/PUT/PATCH DEVE ter validação Zod.**

```typescript
// ❌ PROIBIDO - Aceitar input sem validação
app.post('/api/chat/send', authMiddleware, chatController.sendMessage);

// ✅ OBRIGATÓRIO - Validação Zod antes do controller
app.post('/api/chat/send', 
  authMiddleware, 
  validateRequest(sendMessageSchema),  // ← OBRIGATÓRIO
  chatController.sendMessage
);
```

### 3.2 Estrutura de Validators

```
backend/src/middleware/validators/
├── authValidator.ts      # Login, register, password
├── chatValidator.ts      # Message, temperature, topK
├── settingsValidator.ts  # User settings, credentials
└── userValidator.ts      # Profile updates
```

### 3.3 Padrão de Schema Zod

```typescript
export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(10000),
    temperature: z.number().min(0).max(2).optional(),
    topK: z.number().int().min(1).max(100).optional(),
  }).strict() // ← Rejeita campos extras (segurança)
});
```

**`.strict()` é OBRIGATÓRIO** para evitar poluição de objetos.

---

## 4. Headers de Segurança (Helmet)

### 4.1 Configuração Obrigatória

**Helmet DEVE estar configurado em TODAS as aplicações.**

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // MUI requer unsafe-inline
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permite embeddings externos
}));
```

### 4.2 Headers Obrigatórios

| Header | Valor | Proteção |
|--------|-------|----------|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |
| `X-XSS-Protection` | `0` | XSS (desabilitado, CSP é melhor) |
| `Content-Security-Policy` | (ver acima) | XSS, injection |

---

## 5. HTTPS (Produção OBRIGATÓRIO)

### 5.1 Redirect Automático

```typescript
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### 5.2 HSTS (HTTP Strict Transport Security)

Helmet já configura HSTS em produção:
```typescript
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

---

## 6. CORS (Configuração Segura)

### 6.1 Whitelist de Origens

```typescript
// ❌ PROIBIDO - CORS aberto
app.use(cors({ origin: '*' }));

// ✅ OBRIGATÓRIO - Whitelist explícita
const allowedOrigins = [
  'http://localhost:3000',
  'https://myia.production.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl/postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
```

---

## 7. Autenticação JWT

### 7.1 Configuração Segura

```typescript
// Tokens de curta duração
const token = jwt.sign(
  { userId: user.id, email: user.email },
  config.jwtSecret,
  { expiresIn: '7d' } // Máximo 7 dias
);
```

### 7.2 Middleware de Proteção

```typescript
// ✅ OBRIGATÓRIO - Todas as rotas protegidas DEVEM usar authMiddleware
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/settings', authMiddleware, settingsController.update);
```

### 7.3 Respostas Seguras

```typescript
// ❌ PROIBIDO - Vazar informações de erro
if (!user) throw new Error('User admin@example.com not found');

// ✅ OBRIGATÓRIO - Mensagens genéricas
if (!user) throw new AppError('Invalid credentials', 401);
```

---

## 8. Proteção contra SQL Injection

### 8.1 Prisma ORM (Proteção Nativa)

**NUNCA use raw SQL. SEMPRE use Prisma.**

```typescript
// ❌ PROIBIDO - Raw SQL vulnerável
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ OBRIGATÓRIO - Prisma protege automaticamente
const user = await prisma.user.findUnique({ where: { email } });
```

### 8.2 Validação Adicional

Mesmo com Prisma, SEMPRE valide inputs com Zod:
```typescript
const emailSchema = z.string().email().max(255);
const validEmail = emailSchema.parse(input.email);
```

---

## 9. Testes de Segurança

### 9.1 Suite Automatizada

**Localização:** [backend/security-tests.sh](../backend/security-tests.sh)

```bash
# Executar testes de segurança
cd backend
./security-tests.sh
```

### 9.2 Testes Obrigatórios (7 Categorias)

| # | Categoria | Validação |
|---|-----------|-----------|
| 1 | Health Check | HTTP 200 |
| 2 | Helmet Headers | X-Content-Type-Options, X-Frame-Options, CSP, X-XSS |
| 3 | Rate Limiting | 6ª tentativa = HTTP 429 |
| 4 | Validação Zod | Input inválido = HTTP 400/401 |
| 5 | Proteção JWT | Sem token/token inválido = HTTP 401 |
| 6 | CORS | Origem não autorizada = bloqueada |
| 7 | SQL Injection | Tentativa de injection = bloqueada |

### 9.3 CI/CD Integration

Testes de segurança DEVEM rodar em:
- **Pre-commit hook** (validação rápida)
- **CI/CD pipeline** (validação completa)
- **Deploy** (gate de produção)

---

## 10. Logging e Auditoria

### 10.1 Eventos Obrigatórios de Log

```typescript
// Login attempts
logger.info('Login attempt', { email, ip: req.ip, success: true });

// Rate limit blocks
logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });

// Authorization failures
logger.warn('Unauthorized access', { userId, resource: req.path });

// Security events
logger.error('SQL injection attempt', { payload, ip: req.ip });
```

### 10.2 Sanitização de Logs

```typescript
// ❌ PROIBIDO - Logar senhas/tokens
logger.info('User data', { password, token });

// ✅ OBRIGATÓRIO - Sanitizar dados sensíveis
logger.info('User data', { 
  email, 
  password: '[REDACTED]',
  token: token.substring(0, 10) + '...'
});
```

---

## 11. Checklist de Deploy

### 11.1 Pré-Produção (Obrigatório)

- [ ] `JWT_SECRET` gerado e validado (≥32 chars)
- [ ] `ENCRYPTION_SECRET` gerado e validado (≥32 chars)
- [ ] `NODE_ENV=production` configurado
- [ ] HTTPS configurado e redirect ativo
- [ ] Rate limiters aplicados em todas as rotas
- [ ] Helmet configurado com CSP
- [ ] CORS whitelist configurada
- [ ] Validação Zod em todas as rotas POST/PUT/PATCH
- [ ] Testes de segurança passando (100%)
- [ ] CVEs resolvidos (`npm audit` = 0 vulnerabilities)
- [ ] Logs sanitizados (sem senhas/tokens)

### 11.2 Pós-Produção (Monitoramento)

- [ ] Logs de rate limiting monitorados
- [ ] Alertas de tentativas de SQL injection
- [ ] Alertas de CORS violations
- [ ] Alertas de autenticação falhas repetidas
- [ ] Scan de vulnerabilidades semanal

---

## 12. Roadmap de Segurança

### ✅ Fase 1 - Secrets (CONCLUÍDO)
- [x] Validação obrigatória de JWT_SECRET
- [x] Validação obrigatória de ENCRYPTION_SECRET
- [x] Remoção de fallbacks inseguros
- [x] Documentação de geração de secrets

### ✅ Fase 2 - Hardening (CONCLUÍDO)
- [x] Rate limiting (auth, chat, API)
- [x] Helmet (CSP + headers)
- [x] Validação Zod (4 validators)
- [x] Correção de 6 CVEs
- [x] Suite de testes automatizada (100% passing)

### ⏳ Fase 3 - Logging & Monitoring (PRÓXIMO)
- [ ] Sanitização de logs sensíveis
- [ ] CSRF tokens (formulários)
- [ ] Alertas de segurança
- [ ] Dashboard de métricas de segurança

### 🔮 Fase 4 - Infraestrutura (FUTURO)
- [ ] Database SSL/TLS
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection (Cloudflare/AWS Shield)
- [ ] Penetration testing profissional

### 🔮 Fase 5 - Compliance (FUTURO)
- [ ] GDPR compliance
- [ ] LGPD compliance
- [ ] SOC2 audit preparação
- [ ] Security headers A+ rating

---

## 13. Recursos e Referências

### Ferramentas Utilizadas

| Ferramenta | Versão | Propósito |
|------------|--------|-----------|
| `helmet` | ^7.0.0 | Security headers |
| `express-rate-limit` | ^7.0.0 | Rate limiting |
| `zod` | ^3.22.0 | Input validation |
| `jsonwebtoken` | ^9.0.0 | JWT authentication |
| `bcrypt` | ^5.1.0 | Password hashing |
| Prisma ORM | ^5.0.0 | SQL injection protection |

### Documentação Oficial

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## Anexos

- [SECURITY-PHASE1-DONE.md](SECURITY-PHASE1-DONE.md) - Relatório Fase 1
- [SECURITY-PHASE2-DONE.md](SECURITY-PHASE2-DONE.md) - Relatório Fase 2
- [security-tests.sh](../backend/security-tests.sh) - Suite de testes
- [SECURITY-SETUP.md](SECURITY-SETUP.md) - Guia de setup inicial
