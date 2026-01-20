# Especificações Oficiais dos Modelos Anthropic

**Fonte:** https://docs.anthropic.com/en/docs/about-claude/models  
**Última Atualização:** 2026-01-17

---

## 📊 Modelos Claude (Dados Oficiais)

### Claude 3.5 Sonnet v2 (Outubro 2024)

**Model ID:** `claude-3-5-sonnet-20241022`  
**AWS Bedrock ID:** `anthropic.claude-3-5-sonnet-20241022-v2:0`

| Especificação | Valor |
|---------------|-------|
| Context Window | 200k tokens |
| Max Output | 8k tokens |
| Vision | ✅ Yes |
| Function Calling | ✅ Yes |
| Streaming | ✅ Yes |
| Cost (Input) | $3.00 / MTok |
| Cost (Output) | $15.00 / MTok |

**Uso:** Tarefas complexas, raciocínio avançado, análise de código

---

### Claude 3.5 Haiku (Outubro 2024)

**Model ID:** `claude-3-5-haiku-20241022`  
**AWS Bedrock ID:** `anthropic.claude-3-5-haiku-20241022-v1:0`

| Especificação | Valor |
|---------------|-------|
| Context Window | 200k tokens |
| Max Output | 8k tokens |
| Vision | ✅ Yes |
| Function Calling | ✅ Yes |
| Streaming | ✅ Yes |
| Cost (Input) | $0.80 / MTok |
| Cost (Output) | $4.00 / MTok |

**Uso:** Tarefas rápidas, alta velocidade, baixo custo

---

### Claude 3 Haiku (Março 2024)

**Model ID:** `claude-3-haiku-20240307`  
**AWS Bedrock ID:** `anthropic.claude-3-haiku-20240307-v1:0`

| Especificação | Valor |
|---------------|-------|
| Context Window | 200k tokens |
| Max Output | 4k tokens |
| Vision | ❌ No |
| Function Calling | ❌ No |
| Streaming | ✅ Yes |
| Cost (Input) | $0.25 / MTok |
| Cost (Output) | $1.25 / MTok |

**Uso:** Modelo legado, tarefas simples

---

## 🔍 Comparação de Context Window

| Modelo | Context Window | Max Output | Total |
|--------|----------------|------------|-------|
| Claude 3.5 Sonnet v2 | 200k | 8k | 208k |
| Claude 3.5 Haiku | 200k | 8k | 208k |
| Claude 3 Haiku | 200k | 4k | 204k |

**Nota:** Todos os modelos Claude 3.5 têm 200k tokens de context window.

---

## 📝 Notas Importantes

### 1. Context Window vs Max Output

- **Context Window:** Quantidade de tokens que o modelo pode "ler" (input + histórico)
- **Max Output:** Quantidade máxima de tokens que o modelo pode gerar (resposta)
- **Total:** Context Window + Max Output

### 2. Inference Profiles (AWS Bedrock)

Modelos novos (2024+) requerem **Inference Profile** no AWS Bedrock:

```
Formato: {region}.{modelId}
Exemplo: us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Modelos que requerem:**
- ✅ Claude 3.5 Sonnet v2
- ✅ Claude 3.5 Haiku
- ❌ Claude 3 Haiku (usa invocação direta)

### 3. Vision Support

| Modelo | Vision | Formatos Suportados |
|--------|--------|---------------------|
| Claude 3.5 Sonnet v2 | ✅ | JPEG, PNG, GIF, WebP |
| Claude 3.5 Haiku | ✅ | JPEG, PNG, GIF, WebP |
| Claude 3 Haiku | ❌ | N/A |

### 4. Function Calling

| Modelo | Function Calling | Max Functions |
|--------|------------------|---------------|
| Claude 3.5 Sonnet v2 | ✅ | Unlimited |
| Claude 3.5 Haiku | ✅ | Unlimited |
| Claude 3 Haiku | ❌ | N/A |

---

## 🎯 Recomendações de Uso

### Claude 3.5 Sonnet v2
**Melhor para:**
- Análise de código complexo
- Raciocínio avançado
- Tarefas que exigem precisão máxima
- Análise de documentos longos

**Evitar para:**
- Tarefas simples (use Haiku)
- Casos sensíveis a custo

### Claude 3.5 Haiku
**Melhor para:**
- Respostas rápidas
- Chatbots de atendimento
- Classificação de texto
- Extração de informações simples

**Evitar para:**
- Raciocínio muito complexo
- Análise profunda de código

### Claude 3 Haiku (Legacy)
**Melhor para:**
- Migração gradual
- Casos onde vision não é necessário
- Orçamento muito limitado

**Evitar para:**
- Novos projetos (use 3.5 Haiku)

---

## 📊 Comparação de Performance

| Métrica | 3.5 Sonnet v2 | 3.5 Haiku | 3 Haiku |
|---------|---------------|-----------|---------|
| Velocidade | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Inteligência | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Custo | 💰💰💰 | 💰💰 | 💰 |
| Vision | ✅ | ✅ | ❌ |
| Function Calling | ✅ | ✅ | ❌ |

---

## 🔄 Status dos Valores no Registry

### ✅ Valores Corretos (Confirmados)

Todos os valores em [`backend/src/services/ai/registry/models/anthropic.models.ts`](../backend/src/services/ai/registry/models/anthropic.models.ts) estão **corretos** e alinhados com a documentação oficial:

| Modelo | Context Window | Max Output | Status |
|--------|----------------|------------|--------|
| Claude 3.5 Sonnet v2 | 200000 | 8192 | ✅ Correto |
| Claude 3.5 Haiku | 200000 | 8192 | ✅ Correto |
| Claude 3 Haiku | 200000 | 4096 | ✅ Correto |

**Nenhuma atualização necessária.**

---

## 📚 Referências

- [Anthropic Models Overview](https://docs.anthropic.com/en/docs/about-claude/models)
- [AWS Bedrock Claude Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
- [Claude API Reference](https://docs.anthropic.com/en/api/messages)

---

**Autor:** Kilo Code  
**Data:** 2026-01-17  
**Versão:** 1.0
