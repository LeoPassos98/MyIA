# 🔒 Configuração de Segurança - MyIA Backend

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

Este backend **NÃO VAI INICIAR** sem as seguintes variáveis de ambiente configuradas corretamente.

---

## 1️⃣ Gerar Secrets Seguros

### JWT_SECRET (Autenticação)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
ea186787030bcdc014642f179837c4b609b4fb5462fb475da3df5d3b815d9aa6
```

### ENCRYPTION_SECRET (Criptografia de API Keys)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
0ae44a43a2f10a315138e467885a82cd835a8fb5a0b772ca7764d0bdaa0b748a
```

---

## 2️⃣ Configurar Arquivo `.env`

Crie o arquivo `backend/.env` (se não existir) e adicione:

```env
# JWT Authentication (CRÍTICO)
JWT_SECRET=<cole o JWT_SECRET gerado acima>
JWT_EXPIRES_IN=7d

# Encryption Secret (CRÍTICO)
ENCRYPTION_SECRET=<cole o ENCRYPTION_SECRET gerado acima>

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myia?schema=public"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Outras variáveis... (copie do .env.example)
```

---

## 3️⃣ Validações Implementadas

### ✅ JWT_SECRET
- **Obrigatório:** Aplicação não inicia sem ele
- **Tamanho mínimo:** 32 caracteres
- **Localização:** `backend/src/config/env.ts` (linha ~25)

### ✅ ENCRYPTION_SECRET
- **Obrigatório:** Aplicação não inicia sem ele
- **Tamanho mínimo:** 32 caracteres
- **Localização:** `backend/src/services/encryptionService.ts` (linha ~6)

### ✅ Fallbacks Removidos
- ❌ Não há mais `JWT_SECRET || 'fallback-secret-key'`
- ❌ Servidor trava se secrets forem inválidos

---

## 4️⃣ Verificar Configuração

Tente iniciar o servidor:

```bash
cd backend
npm run dev
```

### ✅ Sucesso (esperado):
```
🔧 Inicializando servidor...
📦 Carregando dependências...
🗄️  Conectando ao banco de dados...
✅ Banco de dados conectado!
✅ Servidor rodando!
🚀 Backend disponível em http://localhost:3001
```

### ❌ Erro (se secrets inválidos):
```
❌ JWT_SECRET is required. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

OU

```
❌ JWT_SECRET must be at least 32 characters long for security
```

---

## 5️⃣ Produção

### Para Deploy (Render, Railway, Vercel, AWS, etc):

1. **NUNCA commite o arquivo `.env`** (já está no `.gitignore`)

2. **Configure as variáveis no painel do serviço:**
   - `JWT_SECRET=<seu-secret-gerado>`
   - `ENCRYPTION_SECRET=<seu-secret-gerado>`
   - `DATABASE_URL=<connection-string-postgres>`
   - `NODE_ENV=production`

3. **Rotação de Secrets (Recomendado a cada 90 dias):**
   - Gere novos secrets
   - Atualize no ambiente de produção
   - **Atenção:** Trocar JWT_SECRET invalida todos tokens ativos

---

## 📋 Checklist de Segurança

- [x] ✅ JWT_SECRET gerado com 32+ caracteres
- [x] ✅ ENCRYPTION_SECRET gerado com 32+ caracteres
- [x] ✅ `.env` criado e configurado localmente
- [x] ✅ `.env` NÃO está no Git
- [ ] ⏳ Secrets configurados no ambiente de produção
- [ ] ⏳ Fase 2 implementada (Rate Limiting + Helmet)

---

## 🆘 Problemas Comuns

### Erro: "JWT_SECRET is required"
- **Solução:** Crie o arquivo `.env` e adicione a variável

### Erro: "JWT_SECRET must be at least 32 characters"
- **Solução:** Gere um secret novo usando o comando acima

### Servidor não inicia
- **Verifique:** `.env` está no diretório `backend/` (não na raiz)
- **Verifique:** Não há espaços extras nas variáveis

---

## 🔐 Segurança Adicional

Este é apenas o **Passo 1** de segurança. Para produção completa:

1. ✅ **Fase 1 - CONCLUÍDA** (Secrets obrigatórios)
2. ⏳ Fase 2 - Rate Limiting + Helmet
3. ⏳ Fase 3 - HTTPS + CSRF
4. ⏳ Fase 4 - Infraestrutura + Monitoring

Veja o roadmap completo na conversa anterior.
