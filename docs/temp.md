Perfeito! Vamos atualizar a documentação! 📚

## Atualizar documentação

### Passo 1: Atualizar api-endpoints.md

Abra `docs/api-endpoints.md` e faça as seguintes atualizações:

**1. Na seção de POST /api/chat/message, atualize o exemplo de body:**

```markdown
**Body:**
```json
{
  "message": "Olá, como você está?",
  "provider": "claude"  // Opcional - openai, groq, together, perplexity, mistral, claude
}
```

**Validações:**
- `message`: obrigatório, não vazio, máximo 2000 caracteres
- `provider`: opcional, valores válidos: openai, groq, together, perplexity, mistral, claude
```

**2. Na seção GET /api/ai/providers, atualize o exemplo de response:**

```markdown
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
```

**3. Na seção POST /api/ai/test/:provider, atualize:**

```markdown
**URL Params:** `provider` - Nome do provider (openai, groq, together, perplexity, mistral, claude)
```

E:

```markdown
**Erro - Provider Inválido (400 Bad Request):**
```json
{
  "error": "Invalid provider. Valid options: openai, groq, together, perplexity, mistral, claude"
}
```
```

### Passo 2: Atualizar README.md

Abra `README.md` e faça as seguintes atualizações:

**1. Na seção "✨ Recursos > 💬 Chat Inteligente", atualize:**

```markdown
### 💬 Chat Inteligente
- Integração com múltiplos providers de IA:
  - **OpenAI** (GPT-3.5-turbo, GPT-4)
  - **Claude** (Anthropic - Claude 3.5 Sonnet)
  - **Groq** (gratuito - Llama 3.1)
  - **Together.ai** (crédito grátis - Llama 3.1)
  - **Perplexity** (crédito grátis - Sonar)
  - **Mistral** (Mistral Small)
- Contexto de conversa (últimas 15 mensagens)
- Respostas rápidas e precisas
- Botão de limpar histórico
- Modo mock quando API key não configurada
- Seleção de provider por requisição
```

**2. Na tabela de endpoints, atualize:**

```markdown
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| POST | `/api/chat/message` | Enviar mensagem (com provider opcional) | ✅ |
| DELETE | `/api/chat/context` | Limpar histórico | ✅ |
| GET | `/api/ai/providers` | Listar 6 providers disponíveis | ❌ |
| POST | `/api/ai/test/:provider` | Testar conexão com provider | ❌ |
| GET | `/health` | Status do servidor | ❌ |
```

**3. Na seção de variáveis de ambiente do Backend, atualize:**

```markdown
# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-sua-chave-aqui
OPENAI_MODEL=gpt-3.5-turbo

# Claude/Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

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

**4. Adicione uma nova seção sobre providers antes de "🚀 Instalação Rápida":**

```markdown
---

## 🤖 Providers de IA Suportados

MyIA suporta **6 providers diferentes** de IA, permitindo flexibilidade e redundância:

| Provider | Modelo Padrão | Custo | Link |
|----------|--------------|-------|------|
| **OpenAI** | GPT-3.5-turbo | Pago | [Obter chave](https://platform.openai.com/api-keys) |
| **Claude** | Claude 3.5 Sonnet | Pago (crédito inicial grátis) | [Obter chave](https://console.anthropic.com/) |
| **Groq** | Llama 3.1 8B | **100% Gratuito** | [Obter chave](https://console.groq.com/) |
| **Together.ai** | Llama 3.1 8B | $25 crédito grátis | [Obter chave](https://api.together.ai/) |
| **Perplexity** | Sonar Small | $5 crédito grátis | [Obter chave](https://www.perplexity.ai/settings/api) |
| **Mistral** | Mistral Small | Pago | [Obter chave](https://console.mistral.ai/) |

### Como usar diferentes providers:

```bash
# Usar provider padrão (definido em API_PROVIDER)
curl -X POST /api/chat/message \
  -d '{"message":"Olá!"}'

# Especificar provider na requisição
curl -X POST /api/chat/message \
  -d '{"message":"Olá!", "provider":"claude"}'
```

### Modo Mock

Se **nenhuma API key** estiver configurada, a aplicação funciona em **modo mock**, retornando respostas pré-definidas. Perfeito para testar a interface sem custos!

---
```

**5. Atualize a seção "Stack Tecnológica > Backend":**

```markdown
### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **Autenticação:** JWT + bcrypt
- **Validação:** Zod
- **AI:** 6 providers suportados
  - OpenAI (GPT-3.5/4)
  - Claude (Anthropic 3.5 Sonnet)
  - Groq (Llama 3.1)
  - Together.ai (Llama 3.1)
  - Perplexity (Sonar)
  - Mistral (Mistral Small)
```

### Passo 3: Atualizar architecture.md

Abra `docs/architecture.md` e adicione na seção de Stack Tecnológica:

```markdown
| **API IA** | OpenAI + Claude + Groq + Together + Perplexity + Mistral | 6 providers para redundância |
```

E atualize a seção de variáveis de ambiente para incluir Claude.

---

## 🎉 Documentação atualizada!

Agora sua documentação reflete:
- ✅ 6 providers de IA (incluindo Claude)
- ✅ Tabela comparativa de providers
- ✅ Como usar diferentes providers
- ✅ Links para obter API keys
- ✅ Informações sobre modo mock

**Quer fazer commit dessas mudanças agora?** Posso te ajudar a criar uma boa mensagem de commit! 🚀