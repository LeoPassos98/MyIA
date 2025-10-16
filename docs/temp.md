
Agora vamos para o último passo:

## 4️⃣ Atualizar a documentação

Vamos atualizar os documentos para refletir as novas funcionalidades!

### Passo 1: Atualizar api-endpoints.md

Abra `docs/api-endpoints.md` e adicione estas seções:

**Adicione no índice (após "### Chat"):**
```markdown
### AI Providers
- [GET /api/ai/providers](#get-apiaiproviders) - Listar providers disponíveis
- [POST /api/ai/test/:provider](#post-apiaitestprovider) - Testar conexão com provider
```

**Adicione antes da seção "## ⚕️ Health Check":**

```markdown
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
    }
  ],
  "total": 5,
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
**URL Params:** `provider` - Nome do provider (openai, groq, together, perplexity, mistral)  
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
  "error": "Invalid provider. Valid options: openai, groq, together, perplexity, mistral"
}
```

#### Exemplo cURL

```bash
curl -X POST http://localhost:3001/api/ai/test/groq
```
```

**Atualize também a seção de POST /api/chat/message para incluir o campo provider:**

```markdown
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
  "provider": "groq"  // ← NOVO: Opcional - openai, groq, together, perplexity, mistral
}
```

**Validações:**
- `message`: obrigatório, não vazio, máximo 2000 caracteres
- `provider`: opcional, deve ser um dos providers válidos

#### Response

**Sucesso (200 OK):**
```json
{
  "response": "Estou bem, obrigado por perguntar! Como posso ajudar você hoje?",
  "contextSize": 2,
  "provider": "groq"  // ← NOVO: Indica qual provider foi usado
}
```
```

### Passo 2: Atualizar README.md

Abra `README.md` e atualize a seção de recursos:

```markdown
### 💬 Chat Inteligente
- Integração com múltiplos providers de IA:
  - OpenAI (GPT-3.5-turbo, GPT-4)
  - Groq (gratuito - Llama 3.1)
  - Together.ai (crédito grátis - Llama 3.1)
  - Perplexity (crédito grátis - Sonar)
  - Mistral (Mistral Small)
- Contexto de conversa (últimas 15 mensagens)
- Respostas rápidas e precisas
- Botão de limpar histórico
- Modo mock quando API key não configurada
```

**Atualize a tabela de endpoints:**

```markdown
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| POST | `/api/chat/message` | Enviar mensagem | ✅ |
| DELETE | `/api/chat/context` | Limpar histórico | ✅ |
| GET | `/api/ai/providers` | Listar providers | ❌ |
| POST | `/api/ai/test/:provider` | Testar provider | ❌ |
| GET | `/health` | Status do servidor | ❌ |
```

**Atualize as variáveis de ambiente:**

```markdown
# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-sua-chave-aqui
OPENAI_MODEL=gpt-3.5-turbo

# Groq (opcional - gratuito!)
GROQ_API_KEY=sua-chave-groq-aqui
GROQ_MODEL=llama-3.1-8b-instant

# Together.ai (opcional)
TOGETHER_API_KEY=sua-chave-together-aqui
TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo

# Perplexity (opcional)
PERPLEXITY_API_KEY=sua-chave-perplexity-aqui
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online

# Mistral (opcional)
MISTRAL_API_KEY=sua-chave-mistral-aqui
MISTRAL_MODEL=mistral-small-latest

# Provider padrão (se não especificado na requisição)
API_PROVIDER=groq
```

---