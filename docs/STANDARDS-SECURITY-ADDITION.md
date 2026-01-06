# Adição Sugerida ao STANDARDS.md

> **Proposta de nova seção para inclusão no STANDARDS.md**

---

## 9. Segurança (Padrões Obrigatórios)

### 9.1 Regra de Segurança Zero-Trust

**TODA aplicação DEVE seguir os padrões de segurança desde o primeiro commit.**

- Secrets validados na inicialização (exit se ausentes/inseguros)
- Rate limiting aplicado em TODAS as rotas expostas
- Validação Zod em TODAS as rotas POST/PUT/PATCH/DELETE
- Helmet configurado com CSP em produção
- HTTPS obrigatório em produção (redirect automático)

### 9.2 Documento de Referência

Para padrões detalhados de segurança, consulte: **[SECURITY-STANDARDS.md](SECURITY-STANDARDS.md)**

### 9.3 Checklist Pré-Commit (Segurança)

Antes de qualquer commit que modifique:
- Rotas de API → Verificar rate limiting + validação Zod
- Autenticação → Verificar authMiddleware aplicado
- Variáveis de ambiente → Verificar validação obrigatória
- Queries ao banco → Verificar uso de Prisma (NUNCA raw SQL)

### 9.4 Testes de Segurança Obrigatórios

```bash
# Executar ANTES de push/deploy
cd backend
./security-tests.sh

# Resultado esperado: 100% PASS (7/7 testes)
```

### 9.5 Princípio de Fail-Secure

```typescript
// ❌ PROIBIDO - Fail-open (inseguro)
const secret = process.env.JWT_SECRET || 'dev-secret';
const user = await findUser(input) || { role: 'guest' };

// ✅ OBRIGATÓRIO - Fail-secure (exit/error se inseguro)
if (!process.env.JWT_SECRET) process.exit(1);
if (!user) throw new AppError('Unauthorized', 401);
```

**Regra:** Em caso de falha de segurança, o sistema DEVE falhar de forma segura (negar acesso, exit), NUNCA permitir por padrão.

---

## 10. Headers de Arquivo (Atualização)

### 10.1 Header Estendido para Arquivos de Segurança

Arquivos relacionados a segurança (auth, validation, encryption, rate limiting) DEVEM incluir aviso adicional:

```typescript
// backend/src/middleware/rateLimiter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// SEGURANÇA CRÍTICA: Mudanças neste arquivo afetam proteção contra DDoS/brute force
```

**Categorias de Segurança Crítica:**
- Autenticação (`authMiddleware.ts`, `authController.ts`, `jwt.ts`)
- Validação (`validators/`, `validateRequest.ts`)
- Criptografia (`encryptionService.ts`)
- Rate Limiting (`rateLimiter.ts`)
- CORS/Headers (`server.ts` - middlewares globais)

---

## Justificativa

Esta adição é necessária porque:

1. **Segurança não é feature, é fundação** - Deve estar presente desde o início
2. **OWASP Top 10** - 80% dos ataques exploram falhas conhecidas (rate limit, injection, auth)
3. **Compliance** - LGPD/GDPR exigem proteção de dados desde o design
4. **Custo de Correção** - Adicionar segurança depois é 10x mais caro que fazer certo desde o início
5. **Rastreabilidade** - Headers de segurança crítica facilitam code review

---

## Integração com STANDARDS.md Existente

Esta seção **complementa** (não substitui) as regras existentes:

| Seção Existente | Nova Seção Segurança | Relação |
|-----------------|---------------------|---------|
| 5. Fonte Única de Verdade | 9.5 Fail-Secure | Reforça: Backend é autoridade, nunca confiar em frontend |
| 4. Arquitetura Backend | 9.1 Zero-Trust | Expande: Database-driven + Segurança obrigatória |
| 1. Header Obrigatório | 10.1 Header Estendido | Adiciona: Aviso de segurança crítica |

---

**Implementação Sugerida:**

1. Copiar conteúdo deste arquivo
2. Adicionar como **Seção 9** no STANDARDS.md (antes da seção de Versionamento)
3. Renumerar seção de Versionamento de Mensagens para **Seção 10**
4. Adicionar link para SECURITY-STANDARDS.md na introdução do STANDARDS.md
