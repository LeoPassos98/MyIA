# 🔧 AWS Bedrock - Guia Completo de Configuração

**Status:** ✅ Implementado e Testado  
**Data:** 2025-01-13

---

## 📋 O Que Foi Implementado

### 1. Provider AWS Bedrock
- ✅ `BedrockProvider` com Messages API (Claude 3)
- ✅ Streaming SSE via `InvokeModelWithResponseStreamCommand`
- ✅ Conversão automática de mensagens (OpenAI → Claude)
- ✅ Descriptografia de credenciais (AES-256-GCM)
- ✅ Fallback para `.env` (system-wide keys)
- ✅ Integrado no `AIProviderFactory`

### 2. Modelos Disponíveis
- ✅ Claude 3.5 Sonnet ($3.00/$15.00 per 1k tokens)
- ✅ Claude 3 Haiku ($0.25/$1.25 per 1k tokens)
- ✅ Claude 2.1 ($8.00/$24.00 per 1k tokens)

### 3. Database
- ✅ Provider `bedrock` em `ai_providers`
- ✅ 3 modelos em `ai_models`
- ✅ Suporte a credenciais criptografadas em `user_provider_credentials`

---

## 🔑 Configuração Passo a Passo

### 1️⃣ Criar IAM User e Access Key

1. Acesse [AWS Console](https://console.aws.amazon.com/iam/)
2. **IAM** → **Users** → **Create user**
3. Nome: `MyIA` (ou qualquer nome)
4. **Next** → **Attach policies directly**
5. Busque e marque: `AmazonBedrockFullAccess`
6. **Create user**

### 2️⃣ Criar Access Key

1. **IAM** → **Users** → Seu usuário → **Security credentials**
2. **Create access key**
3. Use case: **Application running outside AWS**
4. **Create access key**
5. **COPIE AGORA** (só aparece uma vez!):
   - Access key ID: `AKIAIOSFODNN7EXAMPLE`
   - Secret access key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

⚠️ **IMPORTANTE:** A Secret Key só aparece UMA VEZ. Se perdeu, delete a key e crie uma nova.

### 3️⃣ Habilitar Modelos Claude

**Novo comportamento AWS (2025):** Modelos são habilitados automaticamente na primeira invocação.

**Para modelos Anthropic (Claude):**
1. **AWS Console** → **Amazon Bedrock**
2. **Model catalog** → Procure **Claude 3 Haiku**
3. Clique no modelo → **Open in Playground**
4. Envie uma mensagem de teste
5. ✅ Modelo habilitado!

Repita para Claude 3.5 Sonnet e Claude 2.1 se quiser usá-los.

### 4️⃣ Configurar no Backend

Adicione ao `backend/.env`:

```env
# AWS Bedrock
AWS_BEDROCK_CREDENTIALS=AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BEDROCK_REGION=us-east-1
```

**Formato:** `ACCESS_KEY:SECRET_KEY` (separados por `:`)

### 5️⃣ Adicionar Modelos ao Banco

```bash
cd backend
psql -U leonardo -d myia -f scripts/add-aws-bedrock.sql
```

Isso adiciona os 3 modelos Claude ao banco.

---

## 🧪 Testar Configuração

### Teste 1: Verificação Básica

```bash
cd backend
./test-bedrock.sh
```

Deve mostrar:
- ✅ Provider 'bedrock' encontrado
- ✅ 3+ modelos encontrados
- ✅ AWS_BEDROCK_CREDENTIALS configurado

### Teste 2: Teste Direto com SDK

```bash
cd backend
node test-bedrock-direct.js
```

Deve retornar uma resposta do Claude.

### Teste 3: Teste via API

```bash
TOKEN=$(./get-test-token.sh | tail -n1)

curl -X POST http://localhost:3001/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá!",
    "provider": "bedrock",
    "model": "anthropic.claude-3-haiku-20240307-v1:0"
  }'
```

Deve retornar chunks de resposta em SSE.

---

## 🌍 Regiões Disponíveis

Por padrão, usa `us-east-1`. Regiões suportadas:

| Região | Nome | Claude Disponível |
|--------|------|-------------------|
| `us-east-1` | N. Virginia | ✅ |
| `us-west-2` | Oregon | ✅ |
| `us-east-2` | Ohio | ⚠️ Limitado |
| `eu-central-1` | Frankfurt | ✅ |
| `ap-southeast-1` | Singapore | ✅ |

Para mudar região, edite `AWS_BEDROCK_REGION` no `.env`.

---

## 💰 Custos

| Modelo | Input (1k tokens) | Output (1k tokens) |
|--------|-------------------|-------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 2.1 | $8.00 | $24.00 |

**Nota:** Custos podem variar por região. Verifique [AWS Pricing](https://aws.amazon.com/bedrock/pricing/).

---

## 🔧 Troubleshooting

### ❌ "Unsupported state or unable to authenticate data"

**Causas:**
1. SECRET_KEY incorreta
2. Modelo não habilitado (use no Playground primeiro)
3. Credencial antiga criptografada no banco

**Solução:**
```bash
# Deletar credencial antiga do banco
psql -U leonardo -d myia -c "
DELETE FROM user_provider_credentials 
WHERE \"providerId\" = (SELECT id FROM ai_providers WHERE slug = 'bedrock');
"
```

### ❌ "Access Denied" ou "not authorized"

**Causa:** Falta policy IAM

**Solução:**
1. IAM → Users → Seu usuário → Permissions
2. Add permissions → Attach policies
3. Busque: `AmazonBedrockFullAccess`

### ❌ "Model not found"

**Causa:** Modelo não disponível na região

**Solução:** Mude para `us-east-1` no `.env`

### ❌ Modelo não responde

**Causa:** Modelo não habilitado na conta

**Solução:** Use o modelo no Playground uma vez

---

## 📚 Arquivos Criados/Modificados

```
backend/
├── src/services/ai/providers/
│   ├── bedrock.ts                    # ✅ NOVO - Driver AWS Bedrock
│   └── factory.ts                    # ✅ MODIFICADO - Descriptografia + bedrock case
├── src/services/ai/
│   └── index.ts                      # ✅ MODIFICADO - Factory.getApiKey()
├── scripts/
│   └── add-aws-bedrock.sql           # ✅ NOVO - Seed 3 modelos
├── test-bedrock.sh                   # ✅ NOVO - Verificação básica
├── test-bedrock-direct.js            # ✅ NOVO - Teste direto SDK
├── test-aws-credentials.sh           # ✅ NOVO - Validação de credenciais
└── .env.example                      # ✅ MODIFICADO - AWS_BEDROCK_CREDENTIALS
```

---

## 🚀 Próximos Passos

### Frontend
- [ ] Adicionar campo AWS no formulário de API Keys
- [ ] Validação de formato (ACCESS_KEY:SECRET_KEY)
- [ ] Tooltip explicando formato
- [ ] Mostrar provider "AWS Bedrock" no dropdown

### Backend
- [ ] Adicionar mais modelos (Titan, Jurassic, etc)
- [ ] Retry logic para rate limiting
- [ ] Cache de credenciais
- [ ] Logs estruturados para debugging

---

## 📖 Referências

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Claude Models on Bedrock](https://docs.anthropic.com/claude/docs/models-overview)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

**AWS Bedrock implementado e testado com sucesso!** 🎉
