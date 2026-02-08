# 📡 Documentação da API - MyIA

## 📋 Informações Gerais

**Base URL:** `http://localhost:3001/api` (desenvolvimento)  
**Base URL:** `https://seu-codespace-3001.app.github.dev/api` (Codespaces)  
**Versão:** 1.0  
**Formato:** JSON  
**Autenticação:** JWT Bearer Token

---

## 🔐 Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação.

### Como autenticar:

1. Faça login em `/api/auth/login`
2. Receba o token no response
3. Inclua o token no header de requisições protegidas:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validade do token:** 7 dias  
**Formato:** JWT HS256

---

## 📚 Índice de Endpoints

### Autenticação
- [POST /api/auth/register](#post-apiauthregister) - Criar nova conta
- [POST /api/auth/login](#post-apiauthlogin) - Fazer login
- [GET /api/auth/me](#get-apiauthme) - Dados do usuário logado
- [POST /api/auth/change-password](#post-apiauthchange-password) - Alterar senha

### Chat
- [POST /api/chat/message](#post-apichatmessage) - Enviar mensagem
- [GET /api/chat-history](#get-apichat-history) - Listar conversas
- [GET /api/chat-history/:chatId](#get-apichat-historychatid) - Mensagens de uma conversa
- [DELETE /api/chat-history/:chatId](#delete-apichat-historychatid) - Deletar conversa

### Certificação
- [GET /api/certification-queue/history](#get-apicertification-queuehistory) - Histórico de jobs de certificação
- [GET /api/certification-queue/certifications](#get-apicertification-queuecertifications) - Certificações de modelos

### Logs
- [GET /api/logs](#get-apilogs) - Buscar logs com filtros e paginação

### Configurações
- [GET /api/settings](#get-apisettings) - Buscar configurações do usuário
- [PUT /api/settings](#put-apisettings) - Atualizar configurações

### Analytics
- [GET /api/analytics](#get-apianalytics) - Dados de analytics e telemetria

### Perfil
- [PUT /api/user/profile](#put-apiuserprofile) - Atualizar nome do usuário

---

## 🔓 Endpoints Públicos

### POST /api/auth/register

Cria uma nova conta de usuário.

#### Request

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Validações:**
- `email`: obrigatório, formato válido de email
- `password`: obrigatório, mínimo 6 caracteres
- `name`: opcional, string

#### Response

**Sucesso (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Erro - Email já existe (400 Bad Request):**
```json
{
  "error": "Email already registered",
  "status": 400
}
```

**Erro - Validação (400 Bad Request):**
```json
{
  "error": "Password must be at least 6 characters",
  "status": 400
}
```

#### Exemplo cURL

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

---

### POST /api/auth/login

Autentica um usuário e retorna token JWT.

#### Request

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Validações:**
- `email`: obrigatório, formato válido
- `password`: obrigatório

#### Response

**Sucesso (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJpYXQiOjE2OTg0NTc4OTAsImV4cCI6MTY5OTA2MjY5MH0.xyz...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "usuario@example.com",
    "name": "Nome do Usuário"
  }
}
```

**Erro - Credenciais inválidas (401 Unauthorized):**
```json
{
  "error": "Invalid credentials",
  "status": 401
}
```

#### Exemplo cURL

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

---

## 🔒 Endpoints Protegidos

### GET /api/auth/me

Retorna informações do usuário autenticado.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

**Body:** Nenhum

#### Response

**Sucesso (200 OK):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "createdAt": "2025-10-08T12:34:56.789Z"
}
```

**Erro - Token ausente (401 Unauthorized):**
```json
{
  "error": "No token provided",
  "status": 401
}
```

**Erro - Token inválido (401 Unauthorized):**
```json
{
  "error": "Invalid token",
  "status": 401
}
```

#### Exemplo cURL

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### POST /api/chat/message

Envia uma mensagem para a IA e recebe a resposta. **Agora com suporte a histórico persistente.**

#### Request

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>
```

**Body:**
```json
{
  "message": "Olá, como você está?",
  "provider": "groq",
  "chatId": "uuid-da-conversa-ou-null"
}
```

**Validações:**
- `message`: obrigatório, não vazio, máximo 2000 caracteres
- `provider`: opcional, valores válidos: openai, groq, together, perplexity, mistral, claude
- `chatId`: opcional, UUID de conversa existente ou null para nova conversa

#### Response

**Sucesso (200 OK):**
```json
{
  "response": "Estou bem, obrigado por perguntar! Como posso ajudar você hoje?",
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "provider": "groq"
}
```

**Campos:**
- `response`: Resposta da IA
- `chatId`: ID da conversa (novo ou existente)
- `provider`: Provider de IA utilizado

#### Comportamento

- Se `chatId` for null, cria nova conversa
- Se `chatId` existir, adiciona ao histórico existente
- Mantém contexto das últimas **10 mensagens**
- Salva telemetria completa em cada mensagem
- Retorna `chatId` para uso subsequente

---

### GET /api/chat-history

Lista todas as conversas do usuário autenticado.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

#### Response

**Sucesso (200 OK):**
```json
[
  {
    "id": "uuid-1",
    "title": "Conversa: Olá, como você está?...",
    "updatedAt": "2025-11-14T12:34:56.789Z"
  },
  {
    "id": "uuid-2",
    "title": "Nova Conversa",
    "updatedAt": "2025-11-13T10:20:30.123Z"
  }
]
```

---

### GET /api/chat-history/:chatId

Busca todas as mensagens de uma conversa específica.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

**URL Params:**
- `chatId`: UUID da conversa

#### Response

**Sucesso (200 OK):**
```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Olá!",
    "createdAt": "2025-11-14T12:30:00.000Z"
  },
  {
    "id": "msg-2",
    "role": "assistant",
    "content": "Olá! Como posso ajudar?",
    "createdAt": "2025-11-14T12:30:05.000Z",
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "tokensIn": 10,
    "tokensOut": 15,
    "costInUSD": 0.0
  }
]
```

---

### DELETE /api/chat-history/:chatId

Deleta uma conversa e todas as suas mensagens.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

**URL Params:**
- `chatId`: UUID da conversa

#### Response

**Sucesso (200 OK):**
```json
{
  "message": "Conversa deletada"
}
```

---

### POST /api/auth/change-password

Altera a senha do usuário autenticado.

#### Request

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>
```

**Body:**
```json
{
  "oldPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

#### Response

**Sucesso (200 OK):**
```json
{
  "message": "Senha atualizada com sucesso"
}
```

---

### GET /api/settings

Busca as configurações do usuário (tema, chaves de API).

#### Response

**Sucesso (200 OK):**
```json
{
  "id": "uuid",
  "theme": "dark",
  "openaiApiKey": "sk-...1234",
  "groqApiKey": "gsk_...5678",
  "claudeApiKey": null
}
```

**Nota:** Chaves de API retornam apenas placeholders (ex: `sk-...1234`)

---

### PUT /api/settings

Atualiza configurações do usuário.

#### Request

**Body:**
```json
{
  "theme": "dark",
  "groqApiKey": "gsk_nova_chave_completa"
}
```

#### Response

**Sucesso (200 OK):**
```json
{
  "id": "uuid",
  "theme": "dark",
  "groqApiKey": "gsk_...nova"
}
```

---

### GET /api/analytics

Retorna dados de analytics e telemetria.

#### Response

**Sucesso (200 OK):**
```json
{
  "costOverTime": [
    { "date": "2025-11-01", "cost": 0.02 },
    { "date": "2025-11-02", "cost": 0.03 }
  ],
  "costEfficiency": [
    { "provider": "groq", "costPer1kTokens": 0.0 },
    { "provider": "openai", "costPer1kTokens": 0.002 }
  ],
  "loadMap": [
    { "provider": "groq", "tokensIn": 100, "tokensOut": 150 }
  ]
}
```

---

### PUT /api/user/profile

Atualiza o nome do usuário.

#### Request

**Body:**
```json
{
  "name": "Novo Nome"
}
```

#### Response

**Sucesso (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Novo Nome"
}
```

---

## 📋 Endpoints com Paginação

### GET /api/certification-queue/history

Lista histórico de jobs de certificação com paginação.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | integer | Não | 1 | Número da página (mínimo: 1) |
| `limit` | integer | Não | 20 | Itens por página (mínimo: 1, **máximo: 100**) |
| `status` | string | Não | - | Filtrar por status: `pending`, `active`, `completed`, `failed` |
| `modelId` | string | Não | - | Filtrar por ID do modelo |

**Nota:** O parâmetro `limit` é limitado a **100 itens por requisição**. Valores acima de 100 resultarão em erro 400.

#### Response

**Sucesso (200 OK):**
```json
{
  "status": "success",
  "data": {
    "jobs": [
      {
        "id": "uuid-1",
        "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "region": "us-east-1",
        "status": "completed",
        "createdAt": "2026-02-08T10:00:00.000Z",
        "completedAt": "2026-02-08T10:05:30.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 45,
      "totalPages": 3
    }
  }
}
```

#### Possíveis Erros

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos (ex: `limit` > 100 ou < 1) |
| 401 | Token ausente ou inválido |
| 500 | Erro interno do servidor |

**Exemplo de Erro (limit inválido):**
```json
{
  "status": "fail",
  "data": {
    "limit": "limit must be a positive integer between 1 and 100"
  }
}
```

#### Exemplo cURL

```bash
curl http://localhost:3001/api/certification-queue/history?page=1&limit=20 \
  -H "Authorization: Bearer <seu-token-jwt>"
```

---

### GET /api/certification-queue/certifications

Lista certificações de modelos com paginação.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | integer | Não | 1 | Número da página (mínimo: 1) |
| `limit` | integer | Não | 20 | Itens por página (mínimo: 1, **máximo: 100**) |
| `modelId` | string | Não | - | Filtrar por ID do modelo |
| `region` | string | Não | - | Filtrar por região AWS |
| `passed` | boolean | Não | - | Filtrar por status: `true` (passou), `false` (falhou) |

**Nota:** O parâmetro `limit` é limitado a **100 itens por requisição**. Valores acima de 100 resultarão em erro 400.

#### Response

**Sucesso (200 OK):**
```json
{
  "status": "success",
  "data": {
    "certifications": [
      {
        "id": "uuid-1",
        "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "region": "us-east-1",
        "passed": true,
        "score": 95,
        "rating": "A+",
        "testsPassed": 6,
        "testsFailed": 0,
        "createdAt": "2026-02-08T10:05:30.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 120,
      "totalPages": 6
    }
  }
}
```

#### Possíveis Erros

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos (ex: `limit` > 100 ou < 1) |
| 401 | Token ausente ou inválido |
| 500 | Erro interno do servidor |

**Exemplo de Erro (limit inválido):**
```json
{
  "status": "fail",
  "data": {
    "limit": "limit must be a positive integer between 1 and 100"
  }
}
```

#### Exemplo cURL

```bash
curl http://localhost:3001/api/certification-queue/certifications?page=1&limit=50&passed=true \
  -H "Authorization: Bearer <seu-token-jwt>"
```

---

### GET /api/logs

Busca logs com filtros, paginação e ordenação.

#### Request

**Headers:**
```http
Authorization: Bearer <seu-token-jwt>
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | integer | Não | 1 | Número da página (mínimo: 1) |
| `limit` | integer | Não | 20 | Itens por página (mínimo: 1, **máximo: 100**) |
| `level` | string | Não | - | Filtrar por nível: `info`, `warn`, `error`, `debug` |
| `startDate` | string | Não | - | Data inicial (ISO 8601) |
| `endDate` | string | Não | - | Data final (ISO 8601) |
| `sort` | string | Não | `desc` | Ordenação: `asc` (mais antigos), `desc` (mais recentes) |

**Nota:** O parâmetro `limit` é limitado a **100 itens por requisição**. Valores acima de 100 resultarão em erro 400.

#### Response

**Sucesso (200 OK):**
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "uuid-1",
        "level": "info",
        "message": "User logged in",
        "timestamp": "2026-02-08T10:00:00.000Z",
        "requestId": "req-123",
        "userId": "user-456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 1500,
      "totalPages": 75
    }
  }
}
```

#### Possíveis Erros

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos (ex: `limit` > 100 ou < 1) |
| 401 | Token ausente ou inválido |
| 500 | Erro interno do servidor |

**Exemplo de Erro (limit inválido):**
```json
{
  "status": "fail",
  "data": {
    "limit": "limit must be a positive integer between 1 and 100"
  }
}
```

#### Exemplo cURL

```bash
curl "http://localhost:3001/api/logs?level=error&page=1&limit=20&sort=desc" \
  -H "Authorization: Bearer <seu-token-jwt>"
```

---

## 📖 Boas Práticas de Paginação

### Limites de Paginação

- **Padrão:** 20 itens por página
- **Máximo:** 100 itens por página
- **Mínimo:** 1 item por página

### Recomendações

1. **Use o padrão (20)** para listagens gerais
2. **Use valores menores (10-20)** para dados complexos ou pesados
3. **Use valores maiores (50-100)** apenas quando necessário
4. **Implemente paginação automática** se precisar de mais de 100 itens:

```typescript
async function getAllItems() {
  let allItems = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await api.get('/endpoint', {
      params: { page, limit: 100 }
    });
    
    allItems.push(...response.data.items);
    hasMore = response.data.pagination.page < response.data.pagination.totalPages;
    page++;
  }
  
  return allItems;
}
```

### Performance

- Requisições com `limit` alto (>50) podem ser mais lentas
- Considere usar cache para dados que não mudam frequentemente
- Use filtros (`status`, `modelId`, `level`, etc.) para reduzir o volume de dados

### Estrutura de Resposta Paginada

Todos os endpoints com paginação seguem o padrão JSend com estrutura de paginação:

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 100,
      "totalPages": 5
    }
  }
}
```

**Campos de paginação:**
- `page`: Página atual
- `limit`: Itens por página
- `totalItems`: Total de itens disponíveis
- `totalPages`: Total de páginas

---

## ⚕️ Health Check

### GET /health

Verifica se o servidor está online.

#### Request

**Headers:** Nenhum  
**Body:** Nenhum

#### Response

**Sucesso (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T12:34:56.789Z"
}
```

#### Exemplo cURL

```bash
curl http://localhost:3001/health
```

---

## 📊 Códigos de Status HTTP

| Código | Significado | Quando ocorre |
|--------|-------------|---------------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado (registro) |
| **400** | Bad Request | Dados inválidos, validação falhou ou parâmetros de paginação inválidos (ex: `limit` > 100) |
| **401** | Unauthorized | Token ausente, inválido ou expirado |
| **404** | Not Found | Rota não existe |
| **500** | Internal Server Error | Erro no servidor |

---

## 🔒 Segurança

### Headers de Segurança

**CORS configurado para:**
- Origem específica (configurável via `CORS_ORIGIN`)
- Métodos: GET, POST, PUT, DELETE, OPTIONS
- Headers permitidos: Content-Type, Authorization
- Credentials: true

### Proteção de Dados

- Senhas armazenadas com **bcrypt** (hash + salt)
- Tokens JWT assinados com **HS256**
- Variáveis sensíveis em `.env` (não versionadas)
- Validação de inputs com **Zod**

### Rate Limiting

⚠️ **Não implementado no MVP**  
Recomendação para produção: 50-100 requisições/minuto por IP

---

## 🧪 Testando a API

### Opção 1: cURL (Terminal)

```bash
# 1. Registrar
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'

# 2. Login (salve o token)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  | jq -r '.token')

# 3. Enviar mensagem
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Olá!"}'
```

### Opção 2: Postman / Insomnia

1. Importe a coleção (criar arquivo JSON)
2. Configure variável de ambiente `{{base_url}}`
3. Use `{{token}}` para autenticação automática

### Opção 3: Frontend Web

Acesse `http://localhost:3000` e use a interface.

---

## 📝 Estrutura de Erro Padrão

Todos os erros seguem este formato:

```json
{
  "error": "Descrição do erro em inglês",
  "status": 400
}
```

**Campos:**
- `error` (string): Mensagem de erro descritiva
- `status` (number): Código HTTP do erro

---

## 🔄 Fluxo de Uso Completo

```mermaid
sequenceDiagram
    Cliente->>API: POST /auth/register
    API-->>Cliente: 201 {userId}
    
    Cliente->>API: POST /auth/login
    API-->>Cliente: 200 {token, user}
    
    Cliente->>API: POST /chat/message + Bearer token
    API->>OpenAI: Enviar contexto + mensagem
    OpenAI-->>API: Resposta da IA
    API-->>Cliente: 200 {response, contextSize}
    
    Cliente->>API: DELETE /chat/context + Bearer token
    API-->>Cliente: 200 {message}
```

---

## 🐛 Debugging

### Logs do Servidor

O backend loga automaticamente:
- Todas as requisições: `[INFO] GET /api/auth/me`
- Erros: `[ERROR] Error occurred: ...`
- Ações importantes: `[INFO] User logged in: test@test.com`

### Problemas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `ERR_CONNECTION_REFUSED` | Backend não está rodando | Execute `npm run dev` no backend |
| `No token provided` | Token não enviado no header | Adicione `Authorization: Bearer TOKEN` |
| `Invalid token` | Token expirado ou inválido | Faça login novamente |
| `CORS error` | Origem não permitida | Ajuste `CORS_ORIGIN` no .env |
| `Failed to get AI response` | Problema com OpenAI | Verifique `OPENAI_API_KEY` |
| **`500 Internal Server Error` no `/api/settings`** | **Erro após migração PostgreSQL** | **Veja solução abaixo** |

### 🆕 Solução: Erro 500 no `/api/settings`

**Problema:** Endpoint retorna 500 após migração SQLite → PostgreSQL

**Causa Raiz:** Dados órfãos (foreign key constraint violation)

**Diagnóstico Completo:**

1. **Verificar logs do backend:**
```bash
cat logs/backend.err.log | grep "Foreign key constraint"
```

2. **Verificar dados órfãos no PostgreSQL:**
```sql
-- Conectar ao banco
psql -U leonardo -d myia

-- Verificar settings órfãos
SELECT * FROM user_settings 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Ver todos os usuários
SELECT id, email FROM users;
```

**Solução Permanente (Reset Completo):**

```bash
cd backend

# 1. Drop banco
psql -U leonardo -d postgres -c "DROP DATABASE myia;"

# 2. Recriar
psql -U leonardo -d postgres -c "CREATE DATABASE myia;"
psql -U leonardo -d myia -c "CREATE EXTENSION vector;"

# 3. Reset migrations
rm -rf prisma/migrations
npx prisma migrate dev --name "fresh_start"

# 4. Regenerar
npx prisma generate
npm run build
npm run dev
```

**Solução Rápida (Limpar Órfãos):**

```sql
-- Deletar apenas dados órfãos
DELETE FROM user_settings 
WHERE "userId" NOT IN (SELECT id FROM users);

-- Depois: regenerar client e reiniciar
```

**Verificação Final:**

```bash
# 1. Criar novo usuário via frontend
# 2. Testar endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/settings

# Deve retornar 200 OK com:
{
  "id": "uuid",
  "theme": "light",
  "openaiApiKey": null,
  ...
}
```

**Prevenção:**
- Nunca misturar dados de SQLite com PostgreSQL
- Sempre usar migrations em ordem
- Verificar foreign keys antes de deploy

---

## 📚 Recursos Adicionais

- **Repositório:** https://github.com/seu-usuario/MyIA
- **Documentação Arquitetura:** `docs/architecture.md`
- **Guia de Setup:** `docs/setup-guide.md`
- **OpenAI Docs:** https://platform.openai.com/docs

---

**Última atualização:** 08/10/2025  
**Versão da API:** 1.0  
**Mantido por:** @LeoPassos98