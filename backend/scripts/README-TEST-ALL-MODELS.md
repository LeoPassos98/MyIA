# Script de Teste de Modelos AWS Bedrock

## Visão Geral

O script [`test-all-models.ts`](test-all-models.ts) foi modificado para buscar e testar **TODOS os modelos disponíveis** no AWS Bedrock, gerando relatórios detalhados e explicativos.

## Principais Modificações

### 1. ✅ Listagem Dinâmica de Modelos

**Antes:** Buscava modelos apenas do banco de dados (modelos já certificados)

**Agora:** Busca modelos diretamente do AWS Bedrock via API

```typescript
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

const client = new BedrockClient({ region, credentials });
const command = new ListFoundationModelsCommand({});
const response = await client.send(command);
```

### 2. 🔍 Filtragem Inteligente

Filtra apenas modelos relevantes:
- ✅ Suportam `TEXT` output
- ✅ Suportam inferência `ON_DEMAND`
- ✅ Opcionalmente filtra por vendor (anthropic, amazon, cohere, etc.)

### 3. 📊 Relatórios Explicativos

Gera dois arquivos:

#### **JSON** (`model-tests-{timestamp}.json`)
Dados estruturados completos incluindo:
- Sumário executivo
- Estatísticas por vendor
- Resultados detalhados de cada modelo
- **Análises explicativas** para cada resultado

#### **Markdown** (`model-tests-{timestamp}.md`)
Relatório legível e explicativo com:
- 📊 Sumário executivo com percentuais
- 💡 Recomendações gerais
- 🔍 Problemas comuns identificados
- ✅ Modelos certificados com análise detalhada
- ⚠️ Modelos com avisos de qualidade
- ❌ Modelos que falharam com explicações e recomendações
- 📋 Resumo por categoria de erro

### 4. 💡 Análises Inteligentes

Para cada modelo, o relatório explica:

**✅ Modelos Certificados:**
- Por que funcionam
- Taxa de sucesso
- Recomendações de uso

**⚠️ Modelos com Avisos:**
- Quais limitações existem
- Quais testes falharam
- Como usar com segurança

**❌ Modelos que Falharam:**
- Por que falharam
- Categoria do erro (PROVISIONING_REQUIRED, PERMISSION_ERROR, etc.)
- Ações corretivas específicas
- Passos para resolver o problema

## Uso

### Testar Todos os Vendors

```bash
npx ts-node backend/scripts/test-all-models.ts
```

### Testar Vendor Específico

```bash
# Apenas Anthropic
npx ts-node backend/scripts/test-all-models.ts anthropic

# Apenas Amazon
npx ts-node backend/scripts/test-all-models.ts amazon

# Apenas Cohere
npx ts-node backend/scripts/test-all-models.ts cohere
```

## Exemplo de Relatório

Veja o relatório de demonstração gerado:
- [`model-tests-demo-{timestamp}.json`](../logs/model-tests-demo-2026-01-27T12-53-47-940Z.json)
- [`model-tests-demo-{timestamp}.md`](../logs/model-tests-demo-2026-01-27T12-53-47-940Z.md)

### Exemplo de Análise Explicativa

#### ✅ Modelo Certificado

```markdown
#### anthropic.claude-3-5-sonnet-20241022-v2:0

✅ **Modelo certificado com sucesso!** O modelo passou em 6 de 6 testes (100.0% de sucesso). 
Desempenho perfeito em todos os testes. Recomendado para uso em produção.

**Recomendações:**
- ✅ Modelo pronto para uso em produção
- ✅ Suporta todas as funcionalidades testadas
```

#### ❌ Modelo que Falhou

```markdown
### cohere.command-r-plus-v1:0

- **Vendor:** cohere
- **Success Rate:** 20.0%
- **Tests:** 1 passed, 4 failed
- **Error Category:** PROVISIONING_REQUIRED
- **Error Severity:** CRITICAL

❌ **Modelo falhou na certificação.** O modelo passou em apenas 1 de 5 testes (20.0% de sucesso). 
**Motivo:** O modelo requer habilitação prévia na conta AWS. 
Acesse AWS Console → Bedrock → Model Access para solicitar acesso ao modelo.

**Recomendações:**
- 🔧 Habilitar modelo no AWS Console → Bedrock → Model Access
- ⏳ Aguardar aprovação do acesso (pode levar alguns minutos)
- 🔄 Executar certificação novamente após aprovação
```

## Categorias de Erro

O script identifica e explica as seguintes categorias:

| Categoria | Severidade | Descrição | Ação |
|-----------|-----------|-----------|------|
| `PROVISIONING_REQUIRED` | CRITICAL | Modelo requer habilitação | Habilitar no AWS Console |
| `PERMISSION_ERROR` | CRITICAL | Sem permissão IAM | Ajustar políticas IAM |
| `UNAVAILABLE` | CRITICAL | Indisponível na região | Mudar região ou modelo |
| `RATE_LIMIT` | MEDIUM | Limite de taxa excedido | Aguardar e tentar novamente |
| `TIMEOUT` | MEDIUM | Timeout nas requisições | Aumentar timeout |
| `CONFIGURATION_ERROR` | HIGH | Parâmetros inválidos | Verificar configuração |
| `QUALITY_ISSUE` | LOW | Problemas de qualidade | Testar antes de usar |

## Estrutura do Relatório JSON

```json
{
  "summary": {
    "totalModels": 4,
    "certified": 2,
    "failed": 1,
    "qualityWarning": 1,
    "byVendor": { ... },
    "timestamp": "2026-01-27T12:53:47.941Z",
    "duration": 45000,
    "recommendations": [ ... ],
    "commonIssues": { ... }
  },
  "results": [
    {
      "modelId": "...",
      "modelName": "...",
      "vendor": "...",
      "status": "certified|quality_warning|failed",
      "successRate": 100,
      "testsPassed": 6,
      "testsFailed": 0,
      "avgLatencyMs": 1250,
      "errorCategory": null,
      "errorSeverity": null,
      "lastError": null,
      "qualityIssues": [],
      "testedAt": "...",
      "testResults": [ ... ],
      "analysis": {
        "explanation": "...",
        "recommendations": [ ... ]
      }
    }
  ]
}
```

## Requisitos

- ✅ Credenciais AWS configuradas no banco de dados
- ✅ Permissões IAM para `bedrock:ListFoundationModels`
- ✅ Permissões IAM para `bedrock:InvokeModel`
- ✅ Região AWS configurada

## Notas Importantes

1. **Credenciais:** O script usa as credenciais do primeiro usuário encontrado no banco com credenciais AWS configuradas
2. **Descriptografia:** Credenciais criptografadas são automaticamente descriptografadas
3. **Cache:** Resultados são salvos no banco para evitar re-certificações desnecessárias
4. **Rate Limiting:** O script respeita os limites de taxa do AWS Bedrock

## Troubleshooting

### Erro: "The security token included in the request is invalid"

**Causa:** Credenciais AWS inválidas ou expiradas

**Solução:**
1. Verificar credenciais no banco de dados
2. Atualizar credenciais se necessário
3. Verificar se `ENCRYPTION_SECRET` está configurado corretamente

### Erro: "You don't have access to the model"

**Causa:** Modelo requer habilitação prévia

**Solução:**
1. Acessar AWS Console → Bedrock → Model Access
2. Solicitar acesso ao modelo
3. Aguardar aprovação (pode levar alguns minutos)
4. Executar script novamente

### Nenhum modelo encontrado

**Causa:** Filtros muito restritivos ou região sem modelos

**Solução:**
1. Verificar região configurada
2. Remover filtro de vendor
3. Verificar se há modelos disponíveis na região

## Script de Demonstração

Para gerar um relatório de exemplo sem precisar de credenciais AWS válidas:

```bash
npx ts-node backend/scripts/test-all-models-demo.ts
```

Este script gera um relatório com dados fictícios para demonstrar o formato e conteúdo.

## Arquivos Gerados

Todos os relatórios são salvos em [`backend/logs/`](../logs/):

- `model-tests-{timestamp}.json` - Dados estruturados
- `model-tests-{timestamp}.md` - Relatório legível
- `model-tests-demo-{timestamp}.json` - Demo JSON
- `model-tests-demo-{timestamp}.md` - Demo Markdown

## Contribuindo

Para adicionar novas análises ou melhorar as explicações, edite a função `analyzeResults()` em [`test-all-models.ts`](test-all-models.ts).
