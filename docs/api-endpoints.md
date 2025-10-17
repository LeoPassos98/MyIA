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

### Chat
- [POST /api/chat/message](#post-apichatmessage) - Enviar mensagem
- [DELETE /api/chat/context](#delete-apichatcontext) - Limpar histórico

### AI Providers
- [GET /api/ai/providers](#get-apiaiproviders) - Listar providers disponíveis
- [POST /api/ai/test/:provider](#post-apiaitestprovider) - Testar conexão com provider

### Utilitários
- [GET /health](#get-health) - Status do servidor

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

Envia uma mensagem para a IA e recebe a resposta.

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
  "provider": "claude"
}
```

**Validações:**
- `message`: obrigatório, não vazio, máximo 2000 caracteres
- `provider`: opcional, valores válidos: openai, groq, together, perplexity, mistral, claude

#### Response

**Sucesso (200 OK):**
```json
{
  "response": "Estou bem, obrigado por perguntar! Como posso ajudar você hoje?",
  "contextSize": 2,
  "provider": "groq"
}
```

**Campos:**
- `response`: Resposta da IA
- `contextSize`: Número de mensagens no contexto atual
- `provider`: Provider de IA utilizado

**Erro - Mensagem vazia (400 Bad Request):**
```json
{
  "error": "Message cannot be empty",
  "status": 400
}
```

**Erro - Não autenticado (401 Unauthorized):**
```json
{
  "error": "No token provided",
  "status": 401
}
```

**Erro - API OpenAI (500 Internal Server Error):**
```json
{
  "error": "Failed to get AI response",
  "status": 500
}
```

#### Comportamento

- Mantém contexto das últimas **15 mensagens**
- Se não houver chave OpenAI válida, retorna resposta mock
- Adiciona automaticamente mensagem do usuário e da IA ao contexto

#### Exemplo cURL

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "message": "Conte-me uma piada"
  }'
```

---

### DELETE /api/chat/context

Limpa o histórico de conversa do usuário.

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
  "message": "Context cleared successfully"
}
```

**Erro - Não autenticado (401 Unauthorized):**
```json
{
  "error": "No token provided",
  "status": 401
}
```

#### Comportamento

- Remove todas as mensagens do contexto do usuário
- Não afeta o histórico de outros usuários
- Próxima mensagem inicia um novo contexto

#### Exemplo cURL

```bash
curl -X DELETE http://localhost:3001/api/chat/context \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🤖 AI Providers

### GET /api/ai/providers

Lista todos os providers de IA disponíveis e seu status de configuração.

#### Request

**Headers:** Nenhum  
**Body:** Nenhum

#### Response

**Sucesso (200 OK):**
```json
{
  "providers": [
    {
      "name": "openai",
      "configured": true,
      "model": "gpt-3.5-turbo"
    },
    {
      "name": "groq",
      "configured": false,
      "model": "llama-3.1-8b-instant"
    },
    {
      "name": "together",
      "configured": false,
      "model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
    },
    {
      "name": "perplexity",
      "configured": false,
      "model": "llama-3.1-sonar-small-128k-online"
    },
    {
      "name": "mistral",
      "configured": false,
      "model": "mistral-small-latest"
    },
    {
      "name": "claude",
      "configured": false,
      "model": "claude-3-5-sonnet-20241022"
    }
  ],
  "total": 6,
  "configured": 1
}
```

#### Exemplo cURL

```bash
curl http://localhost:3001/api/ai/providers
```

---

### POST /api/ai/test/:provider

Testa a conexão com um provider específico.

#### Request

**Headers:** Nenhum  
**URL Params:** `provider` - Nome do provider (openai, groq, together, perplexity, mistral, claude)  
**Body:** Nenhum

#### Response

**Sucesso - Configurado (200 OK):**
```json
{
  "provider": "groq",
  "success": true,
  "message": "Connection successful",
  "responseTime": 245
}
```

**Sucesso - Não Configurado (200 OK):**
```json
{
  "provider": "groq",
  "success": false,
  "message": "API key not configured. Set GROQ_API_KEY in .env file"
}
```

**Erro - Provider Inválido (400 Bad Request):**
```json
{
  "error": "Invalid provider. Valid options: openai, groq, together, perplexity, mistral, claude"
}
```

#### Exemplo cURL

```bash
curl -X POST http://localhost:3001/api/ai/test/groq
```

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
| **400** | Bad Request | Dados inválidos ou validação falhou |
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