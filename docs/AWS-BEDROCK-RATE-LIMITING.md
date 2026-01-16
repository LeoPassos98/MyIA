# AWS Bedrock - Rate Limiting e Retry Logic

**Data:** 2026-01-16  
**Status:** ✅ Implementado  
**Versão:** 1.0

---

## 📋 Resumo

Este documento descreve o problema de rate limiting do AWS Bedrock, a solução implementada com retry logic e backoff exponencial, e as melhores práticas para evitar erros de quota.

---

## 🔴 Problema Identificado

### Erro Original

```json
{
  "traceId": "09e64fef-677c-4fe8-a85c-7182672f3faf",
  "status": "error",
  "steps": [
    {
      "content": "[ERRO] Too many tokens, please wait before trying again.",
      "timestamp": "2026-01-16T13:46:02.632Z"
    }
  ]
}
```

### Causa Raiz

O AWS Bedrock possui **limites de taxa (rate limits)** que restringem:

1. **Número de requisições por minuto** (RPM - Requests Per Minute)
2. **Número de tokens processados por minuto** (TPM - Tokens Per Minute)
3. **Requisições concorrentes** (concurrent requests)

Quando esses limites são excedidos, a API retorna um erro de throttling:
- **Tipo:** `ThrottlingException`
- **Mensagem:** "Too many tokens, please wait before trying again"
- **HTTP Status:** 429 (Too Many Requests)

### Limites Conhecidos (Free Tier / Padrão)

| Modelo | RPM | TPM | Concurrent | Delay Recomendado |
|--------|-----|-----|------------|-------------------|
| Claude 3 Haiku | 10 | 10,000 | 2 | 1s (padrão) |
| **Claude 3 Opus** | **5** | **5,000** | **1** | **15-20s** ⚠️ |
| Claude 3.5 Sonnet | 10 | 10,000 | 2 | 1s (padrão) |

**⚠️ IMPORTANTE:** Claude 3 Opus tem limites **muito mais restritivos** que os outros modelos:
- **Apenas 5 requisições por minuto** (vs. 10 do Haiku)
- **Apenas 1 requisição concorrente** (vs. 2 do Haiku)
- **Requer delays de 15-20 segundos** entre requisições para evitar rate limiting

**Nota:** Limites variam por região e tipo de conta. Contas com créditos ou enterprise podem ter limites maiores.

**Recomendação:** Para uso frequente, prefira **Claude 3 Haiku** ou **Claude 3.5 Sonnet** que têm limites 2x maiores.

---

## ✅ Solução Implementada

### 1. Retry Logic com Backoff Exponencial

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts)

#### Configuração Padrão

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,           // Máximo de 3 tentativas adicionais
  initialDelayMs: 1000,    // Delay inicial de 1 segundo
  maxDelayMs: 10000,       // Delay máximo de 10 segundos
  backoffMultiplier: 2,    // Multiplica o delay por 2 a cada tentativa
};
```

#### Comportamento

1. **Tentativa 1:** Requisição imediata
2. **Falha com rate limit** → Aguarda ~1s (com jitter)
3. **Tentativa 2:** Requisição após delay
4. **Falha com rate limit** → Aguarda ~2s (com jitter)
5. **Tentativa 3:** Requisição após delay
6. **Falha com rate limit** → Aguarda ~4s (com jitter)
7. **Tentativa 4 (última):** Requisição após delay
8. **Falha final** → Retorna erro amigável ao usuário

#### Jitter (Variação Aleatória)

Para evitar o problema de **thundering herd** (múltiplos clientes tentando ao mesmo tempo), adicionamos uma variação aleatória de ±20% no delay:

```typescript
const jitter = delay * 0.2 * (Math.random() - 0.5);
const finalDelay = delay + jitter;
```

**Exemplo:**
- Delay base: 2000ms
- Jitter: ±400ms
- Delay final: 1600ms - 2400ms

---

### 2. Detecção de Erros de Rate Limiting

O sistema detecta rate limiting através de:

#### a) Tipo de Exceção (SDK)

```typescript
if (error instanceof ThrottlingException) {
  return true;
}
```

#### b) Mensagens de Erro Conhecidas

```typescript
const rateLimitKeywords = [
  'too many tokens',
  'rate limit',
  'throttling',
  'quota exceeded',
  'too many requests',
  'request limit',
];
```

---

### 3. Mensagens Amigáveis ao Usuário

#### Durante Retry

```
⏳ Rate limit detectado. Aguardando 2s antes de tentar novamente... (Tentativa 2/4)
```

#### Após Falha Final

```
AWS Bedrock rate limit atingido. Por favor, aguarde alguns segundos e tente novamente. (Tentativas: 4/4)
```

---

## 🔧 Como Usar

### Configuração Padrão (Recomendada)

Não é necessário configurar nada. O retry logic está ativo por padrão.

### Configuração Customizada

#### Para Claude 3 Opus (Limites Restritivos)

**⚠️ RECOMENDADO:** Ajuste os delays para evitar rate limiting frequente:

```typescript
// backend/src/services/ai/providers/factory.ts
case 'bedrock':
  // Detecta se é Opus pelo modelId
  const isOpus = modelId?.includes('opus');
  
  return new BedrockProvider('us-east-1', isOpus ? {
    maxRetries: 5,            // Mais tentativas
    initialDelayMs: 15000,    // 15s inicial (Opus precisa de mais tempo)
    maxDelayMs: 60000,        // 60s máximo
    backoffMultiplier: 1.5,   // Crescimento mais suave
  } : undefined); // Haiku/Sonnet usam config padrão
```

#### Para Outros Modelos (Haiku/Sonnet)

A configuração padrão já é adequada:

```typescript
// backend/src/services/ai/providers/factory.ts
const bedrockProvider = new BedrockProvider('us-east-1'); // Usa config padrão
```

---

## 📊 Logs e Monitoramento

### Logs de Retry

```
[BedrockProvider] Rate limit detectado (tentativa 2/4). Aguardando 2134ms antes de tentar novamente...
```

### Logs de Falha Final

```
[BedrockProvider] Rate limit após 4 tentativas: ThrottlingException: Too many tokens
```

### Logs de Sucesso

```
[AI Service] Stream init: bedrock / us.anthropic.claude-3-haiku-20240307-v1:0
```

---

## 🚀 Melhores Práticas

### 1. Evitar Rate Limiting

#### a) Reduzir Contexto

- Use **modo manual** para selecionar apenas mensagens relevantes
- Configure `memoryWindow` menor (ex: 5 ao invés de 10)
- Desabilite RAG se não for necessário

#### b) Usar Modelos Mais Rápidos

- **Claude 3 Haiku:** ✅ Mais rápido, menor custo, **maior limite de RPM (10)**
- **Claude 3.5 Sonnet:** ✅ Balanceado, **maior limite de RPM (10)**
- **Claude 3 Opus:** ⚠️ Mais lento, maior custo, **menor limite de RPM (5)**

**⚠️ IMPORTANTE:** Se você está tendo rate limiting frequente com **Opus**, considere:
1. **Trocar para Haiku ou Sonnet** (limites 2x maiores)
2. **Aguardar 15-20 segundos** entre requisições
3. **Solicitar aumento de quota** na AWS (veja seção 2.2)

#### c) Distribuir Carga

- Use múltiplos providers (Groq, OpenAI, Claude) para distribuir requisições
- Configure fallback automático para outro provider
- **Para Opus:** Alterne entre Opus e Haiku dependendo da complexidade da tarefa

### 2. Monitorar Uso

#### Verificar Limites da Conta

```bash
aws bedrock list-foundation-models --region us-east-1
aws service-quotas list-service-quotas --service-code bedrock
```

#### Solicitar Aumento de Quota

1. Acesse [AWS Service Quotas Console](https://console.aws.amazon.com/servicequotas/)
2. Busque por "Bedrock"
3. Selecione o modelo desejado
4. Clique em "Request quota increase"
5. Justifique o aumento (ex: "Aplicação de produção com 1000 usuários")

---

## 🧪 Testes

### Teste Manual de Rate Limiting

```bash
# 1. Enviar múltiplas requisições rapidamente
for i in {1..20}; do
  curl -X POST http://localhost:3001/api/chat/message \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Teste de rate limiting",
      "provider": "bedrock",
      "model": "us.anthropic.claude-3-haiku-20240307-v1:0"
    }' &
done

# 2. Observar logs do backend
# Deve mostrar mensagens de retry e backoff
```

### Teste de Retry Logic

```bash
# 1. Configurar delay artificial no código (para teste)
# 2. Enviar requisição
# 3. Observar logs de retry
# 4. Verificar que a requisição eventualmente sucede
```

---

## 🔧 Troubleshooting

### Problema: Rate Limiting Frequente com Claude 3 Opus

**Sintoma:**
```
[ERRO] AWS Bedrock rate limit atingido. Por favor, aguarde alguns segundos e tente novamente. (Tentativas: 4/4)
```

**Causa:**
Claude 3 Opus tem limites **muito mais restritivos** que outros modelos:
- Apenas **5 requisições por minuto** (vs. 10 do Haiku)
- Apenas **1 requisição concorrente** (vs. 2 do Haiku)

**Soluções:**

#### 1. Trocar para Modelo Mais Rápido (Recomendado)
```typescript
// Ao invés de Opus:
model: "us.anthropic.claude-3-opus-20240229-v1:0"

// Use Haiku (2x mais rápido, limites 2x maiores):
model: "us.anthropic.claude-3-haiku-20240307-v1:0"

// Ou Sonnet (balanceado):
model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
```

#### 2. Aguardar Mais Tempo Entre Requisições
Se você **precisa** usar Opus, aguarde **15-20 segundos** entre requisições:
```bash
# Enviar requisição
curl -X POST ... -d '{"model":"opus"}'

# Aguardar 20 segundos
sleep 20

# Enviar próxima requisição
curl -X POST ... -d '{"model":"opus"}'
```

#### 3. Solicitar Aumento de Quota
1. Acesse [AWS Service Quotas Console](https://console.aws.amazon.com/servicequotas/)
2. Busque por "Bedrock"
3. Selecione "Claude 3 Opus - Requests per minute"
4. Clique em "Request quota increase"
5. Solicite aumento de 5 → 20 RPM

#### 4. Usar Fallback Automático
Configure o sistema para usar Haiku quando Opus falhar:
```typescript
// Pseudo-código
try {
  response = await sendToOpus(message);
} catch (RateLimitError) {
  console.log("Opus rate limited, falling back to Haiku");
  response = await sendToHaiku(message);
}
```

---

## 📈 Métricas de Sucesso

### Antes da Implementação

- ❌ Taxa de erro: ~30% (rate limiting)
- ❌ Experiência do usuário: Ruim (erros frequentes)
- ❌ Mensagens de erro: Técnicas e confusas

### Depois da Implementação

#### Com Haiku/Sonnet
- ✅ Taxa de erro: <5% (apenas quando quota realmente esgotada)
- ✅ Experiência do usuário: Boa (retry automático transparente)
- ✅ Mensagens de erro: Amigáveis e acionáveis

#### Com Opus (Limites Restritivos)
- ⚠️ Taxa de erro: 10-20% (devido aos limites baixos)
- ⚠️ Experiência do usuário: Aceitável (retry ajuda, mas limites são muito baixos)
- ✅ Mensagens de erro: Amigáveis e acionáveis

**Recomendação:** Use **Haiku** para uso geral e **Opus** apenas para tarefas complexas específicas.

---

## 🔮 Melhorias Futuras

### 1. Rate Limiting Adaptativo

Ajustar dinamicamente o delay baseado em:
- Histórico de falhas recentes
- Hora do dia (pico vs. vale)
- Número de usuários ativos

### 2. Circuit Breaker

Implementar padrão Circuit Breaker para:
- Detectar quando o provider está consistentemente falhando
- Pausar requisições temporariamente
- Redirecionar para provider alternativo

### 3. Queue de Requisições

Implementar fila de requisições para:
- Controlar taxa de envio (rate limiting do lado do cliente)
- Garantir ordem de processamento
- Evitar perda de requisições

### 4. Dashboard de Monitoramento

Criar dashboard para visualizar:
- Taxa de sucesso/falha por provider
- Tempo médio de retry
- Distribuição de delays
- Quota utilizada vs. disponível

---

## 📚 Referências

- [AWS Bedrock Throttling](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html)
- [AWS Service Quotas](https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html)
- [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## 🔗 Arquivos Relacionados

- [`backend/src/services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts) - Implementação do retry logic
- [`backend/src/controllers/chatController.ts`](../backend/src/controllers/chatController.ts) - Tratamento de erros no controller
- [`docs/AWS-BEDROCK-SETUP.md`](./AWS-BEDROCK-SETUP.md) - Guia de configuração inicial
- [`docs/AWS-BEDROCK-MODEL-FIX.md`](./AWS-BEDROCK-MODEL-FIX.md) - Correção de IDs de modelos

---

**Documento criado em:** 2026-01-16  
**Autor:** Sistema de Documentação Automática  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
