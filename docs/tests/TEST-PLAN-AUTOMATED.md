# 🤖 Roteiro de Testes Automatizados (Backend)

**Executor:** Amazon Q (via CLI)  
**Duração estimada:** 5-10 minutos  
**Pré-requisito:** Backend rodando em `localhost:3001`

---

## 1️⃣ Testes de Autenticação

### ✅ Login com credenciais válidas
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"leo@leo.com","password":"leoleo"}'
```
**Esperado:** `{ status: 'success', data: { token, user } }`

### ✅ Login com credenciais inválidas
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"leo@leo.com","password":"wrong"}'
```
**Esperado:** `{ status: 'fail', data: {...} }` ou `{ status: 'error', message: '...' }`

### ✅ Rate limit de autenticação (6 tentativas)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```
**Esperado:** 6ª requisição retorna `{ status: 'error', code: 429 }`

---

## 2️⃣ Testes de Rotas Protegidas (JSend)

### ✅ GET /api/ai/providers
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/ai/providers
```
**Esperado:** `{ status: 'success', data: { providers: [...] } }`

### ✅ GET /api/analytics
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/analytics
```
**Esperado:** `{ status: 'success', data: { costOverTime, costEfficiency, loadMap } }`

### ✅ GET /api/audit/messages
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/audit/messages?limit=5
```
**Esperado:** `{ status: 'success', data: { audits: [...] } }`

### ✅ GET /api/settings
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/settings
```
**Esperado:** `{ status: 'success', data: { id, theme, ... } }`

### ✅ PUT /api/settings
```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}' \
  http://localhost:3001/api/settings
```
**Esperado:** `{ status: 'success', data: { theme: 'dark', ... } }`

### ✅ GET /api/settings/credentials
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/settings/credentials
```
**Esperado:** `{ status: 'success', data: { credentials: {...} } }`

### ✅ GET /api/chat-history
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/chat-history
```
**Esperado:** `{ status: 'success', data: { chats: [...] } }`

---

## 3️⃣ Testes de Erros (JSend)

### ✅ Rota sem token (401)
```bash
curl http://localhost:3001/api/settings
```
**Esperado:** `{ status: 'fail', data: {...} }` ou `{ status: 'error', message: '...' }`

### ✅ Rota inexistente (404)
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/nao-existe
```
**Esperado:** Erro 404 (pode não ter JSend se não passar por controller)

### ✅ Body inválido (400)
```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}' \
  http://localhost:3001/api/settings
```
**Esperado:** `{ status: 'fail', data: {...} }`

---

## 4️⃣ Testes de Validação (Zod)

### ✅ Login sem email
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test"}'
```
**Esperado:** `{ status: 'fail', data: { email: '...' } }`

### ✅ Login sem password
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```
**Esperado:** `{ status: 'fail', data: { password: '...' } }`

---

## 5️⃣ Testes de Race Conditions (Corrigidos)

### ✅ Múltiplas requisições simultâneas
```bash
for i in {1..5}; do
  curl -H "Authorization: Bearer <TOKEN>" \
    http://localhost:3001/api/auth/me &
done
wait
```
**Esperado:** Todas retornam `{ status: 'success', data: { user: {...} } }` sem 429

---

## 6️⃣ Testes de Health Check

### ✅ GET /health
```bash
curl http://localhost:3001/health
```
**Esperado:** `{ status: 'ok', ... }`

---

## 📊 Resumo de Validações

| Categoria | Testes | Validação |
|-----------|--------|-----------|
| Autenticação | 3 | JSend + Rate limit |
| Rotas Protegidas | 7 | JSend success |
| Erros | 3 | JSend fail/error |
| Validação | 2 | Zod + JSend |
| Race Conditions | 1 | Sem 429 |
| Health | 1 | Status ok |
| **TOTAL** | **17** | **100% JSend** |

---

## 🚀 Execução Automatizada

**Script único:**
```bash
cd backend
TOKEN=$(./get-test-token.sh | tail -n1)
./test-jsend-routes.sh "$TOKEN"
```

**Resultado esperado:** ✅ 10/10 rotas com JSend
