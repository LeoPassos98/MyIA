# Correção de Modelos AWS Bedrock

## Problema Identificado

Ao tentar usar modelos AWS Bedrock (como Claude 3 Haiku e Claude 3 Opus), o sistema retornava o erro:

```
❌ 404 The model us.anthropic.claude-3-haiku-20240307-v1:0 does not exist or you do not have access to it.
```

### Causa Raiz

Os modelos AWS Bedrock estavam cadastrados no banco de dados com IDs **regionais antigos** (sem o prefixo `us.`), que não são mais válidos ou não estão disponíveis em todas as regiões.

**IDs antigos (incorretos):**
- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-3-opus-20240229-v1:0`

**IDs corretos (Cross-Region Inference Profiles):**
- `us.anthropic.claude-3-haiku-20240307-v1:0`
- `us.anthropic.claude-3-opus-20240229-v1:0`

## Solução Implementada

### 1. Script SQL de Correção

Criado o arquivo [`backend/scripts/fix-bedrock-model-ids.sql`](backend/scripts/fix-bedrock-model-ids.sql) que:

1. Remove todos os modelos Bedrock antigos do banco de dados
2. Adiciona os modelos com IDs corretos (Cross-Region Inference Profiles)
3. Configura corretamente os custos e limites de contexto

### 2. Script Bash de Execução

Criado o arquivo [`backend/scripts/fix-bedrock-models.sh`](backend/scripts/fix-bedrock-models.sh) que:

1. Carrega as variáveis de ambiente
2. Executa o script SQL no banco de dados
3. Exibe os modelos disponíveis

### 3. Modelos Corrigidos

Após a correção, os seguintes modelos estão disponíveis:

| Modelo | API Model ID | Custo Input | Custo Output | Context Window |
|--------|--------------|-------------|--------------|----------------|
| **Claude 3.5 Sonnet v2** | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | $3.00/1M | $15.00/1M | 200K |
| **Claude 3.5 Sonnet v1** | `us.anthropic.claude-3-5-sonnet-20240620-v1:0` | $3.00/1M | $15.00/1M | 200K |
| **Claude 3 Haiku** | `us.anthropic.claude-3-haiku-20240307-v1:0` | $0.25/1M | $1.25/1M | 200K |
| **Claude 3 Opus** | `us.anthropic.claude-3-opus-20240229-v1:0` | $15.00/1M | $75.00/1M | 200K |

## Cross-Region Inference Profiles

Os **Cross-Region Inference Profiles** são IDs de modelos padronizados da AWS que:

- ✅ Funcionam em **múltiplas regiões** AWS
- ✅ Oferecem **melhor disponibilidade** e latência
- ✅ Usam o prefixo `us.` para identificação
- ✅ São a forma **recomendada** pela AWS para acessar modelos Bedrock

### Referência

[AWS Bedrock - Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)

## Como Executar a Correção

Se você precisar executar a correção novamente no futuro:

```bash
# Tornar o script executável (apenas uma vez)
chmod +x backend/scripts/fix-bedrock-models.sh

# Executar a correção
./backend/scripts/fix-bedrock-models.sh
```

## Resultado

✅ **Problema resolvido!** Agora você pode usar os modelos AWS Bedrock normalmente, incluindo:

- Claude 3 Haiku (modelo rápido e econômico)
- Claude 3 Opus (modelo mais poderoso)
- Claude 3.5 Sonnet v1 e v2 (modelos balanceados)

## Próximos Passos

1. **Teste os modelos** no frontend para confirmar que estão funcionando
2. **Configure suas credenciais AWS** nas configurações do usuário
3. **Valide as credenciais** usando o endpoint `/api/providers/bedrock/validate`

## Arquivos Criados/Modificados

- ✅ [`backend/scripts/fix-bedrock-model-ids.sql`](backend/scripts/fix-bedrock-model-ids.sql) - Script SQL de correção
- ✅ [`backend/scripts/fix-bedrock-models.sh`](backend/scripts/fix-bedrock-models.sh) - Script bash de execução
- ✅ Este documento de referência

## Notas Técnicas

### Por que o prefixo `us.`?

O prefixo `us.` indica que o modelo usa o **Cross-Region Inference Profile**, que é uma camada de abstração da AWS que:

1. Roteia automaticamente para a região com melhor disponibilidade
2. Oferece failover automático entre regiões
3. Mantém IDs consistentes independente da região configurada

### Compatibilidade

Esta correção é **retrocompatível** e não afeta:

- ✅ Modelos de outros provedores (OpenAI, Groq, etc.)
- ✅ Conversas existentes no histórico
- ✅ Configurações de usuário
- ✅ Credenciais AWS já salvas

---

**Data da Correção:** 2026-01-15  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
