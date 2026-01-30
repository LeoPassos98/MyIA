# 🔄 Re-certificação Completa de Modelos

Script para limpar todas as certificações existentes e re-certificar todos os modelos do registry de forma sequencial, evitando rate limiting da AWS.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Características](#características)
- [Pré-requisitos](#pré-requisitos)
- [Uso Básico](#uso-básico)
- [Opções Avançadas](#opções-avançadas)
- [Exemplos](#exemplos)
- [Tempo Estimado](#tempo-estimado)
- [Troubleshooting](#troubleshooting)
- [Logs](#logs)

---

## 🎯 Visão Geral

Este script foi criado para resolver problemas de certificações antigas ou incorretas, permitindo uma re-certificação completa e controlada de todos os modelos do sistema.

**O que o script faz:**

1. ✅ Lista todos os modelos no registry
2. 🗑️ Limpa todas as certificações existentes
3. 🧪 Re-certifica cada modelo sequencialmente
4. ⏳ Adiciona delay configurável entre certificações
5. 📊 Mostra progresso detalhado
6. 📄 Gera relatório final completo
7. 💾 Salva log em arquivo

---

## ✨ Características

### Execução Sequencial
- **Não paralela**: Evita rate limiting da AWS
- **Delay configurável**: Pausa entre cada modelo
- **Retry automático**: Até N tentativas por modelo

### Segurança
- **Confirmação obrigatória**: Requer `--yes` para executar
- **Modo dry-run**: Simula sem fazer alterações
- **Skip on error**: Continua mesmo se um modelo falhar

### Relatórios
- **Progresso em tempo real**: Mostra X/Y modelos
- **Relatório detalhado**: Sucesso, falhas, ratings, badges
- **Log persistente**: Salvo em arquivo com timestamp

---

## 📦 Pré-requisitos

### 1. Credenciais AWS Configuradas

O script requer que pelo menos um usuário tenha credenciais AWS configuradas no banco de dados:

```sql
-- Verificar se há credenciais configuradas
SELECT u.email, s.awsRegion 
FROM users u 
JOIN user_settings s ON u.id = s.userId 
WHERE s.awsAccessKey IS NOT NULL;
```

### 2. Modelos no Registry

O script certifica todos os modelos registrados em:
- `backend/src/services/ai/registry/models/*.models.ts`

Atualmente: **18 modelos** (Amazon, Anthropic, Cohere)

### 3. Dependências

```bash
npm install
```

---

## 🚀 Uso Básico

### Modo Interativo (com confirmação)

```bash
npx ts-node backend/scripts/recertify-all-models.ts
```

O script irá:
1. Listar todos os modelos
2. Mostrar aviso sobre a operação
3. **Aguardar confirmação** (você precisa executar novamente com `--yes`)

### Modo Automático (sem confirmação)

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes
```

⚠️ **ATENÇÃO**: Isso irá executar imediatamente sem confirmação!

---

## ⚙️ Opções Avançadas

### `--yes`
Pula a confirmação do usuário.

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes
```

### `--dry-run`
Modo simulação - não faz alterações reais.

```bash
npx ts-node backend/scripts/recertify-all-models.ts --dry-run
```

### `--delay=N`
Define o delay em milissegundos entre cada modelo (padrão: 5000ms).

```bash
# Delay de 10 segundos
npx ts-node backend/scripts/recertify-all-models.ts --yes --delay=10000

# Delay de 3 segundos (mais rápido, mas maior risco de rate limit)
npx ts-node backend/scripts/recertify-all-models.ts --yes --delay=3000
```

### `--max-retries=N`
Define o número máximo de tentativas por modelo (padrão: 2).

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --max-retries=3
```

### `--only=model1,model2,...`
Certifica apenas modelos específicos.

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=amazon.nova-micro-v1:0,anthropic.claude-3-5-sonnet-20241022-v2:0
```

### `--skip-cleanup`
Não limpa certificações antigas (apenas re-certifica).

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --skip-cleanup
```

---

## 📚 Exemplos

### Exemplo 1: Re-certificação Completa (Recomendado)

```bash
# 1. Primeiro, veja o que será feito (dry-run)
npx ts-node backend/scripts/recertify-all-models.ts --dry-run

# 2. Se estiver OK, execute de verdade
npx ts-node backend/scripts/recertify-all-models.ts --yes
```

### Exemplo 2: Re-certificação Rápida (Menor Delay)

```bash
# Delay de 3 segundos (use com cuidado!)
npx ts-node backend/scripts/recertify-all-models.ts --yes --delay=3000
```

### Exemplo 3: Re-certificar Apenas Modelos Específicos

```bash
# Apenas modelos da Amazon
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=amazon.nova-micro-v1:0,amazon.nova-lite-v1:0,amazon.nova-pro-v1:0
```

### Exemplo 4: Re-certificar Sem Limpar (Manter Histórico)

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --skip-cleanup
```

### Exemplo 5: Modo Conservador (Mais Tentativas + Maior Delay)

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --delay=10000 \
  --max-retries=3
```

---

## ⏱️ Tempo Estimado

### Cálculo

```
Tempo Total = (Número de Modelos × Tempo Médio por Modelo) + (Número de Modelos × Delay)
```

### Exemplos

| Modelos | Delay | Tempo/Modelo | Tempo Total Estimado |
|---------|-------|--------------|----------------------|
| 18      | 5s    | ~30s         | ~10 minutos          |
| 18      | 10s   | ~30s         | ~12 minutos          |
| 18      | 3s    | ~30s         | ~9 minutos           |
| 5       | 5s    | ~30s         | ~3 minutos           |

**Nota**: O tempo real pode variar dependendo da latência da AWS e da complexidade dos testes.

---

## 🐛 Troubleshooting

### Erro: "Nenhum usuário com credenciais AWS encontrado"

**Causa**: Não há credenciais AWS configuradas no banco.

**Solução**:
1. Configure as credenciais via interface do sistema
2. Ou insira manualmente no banco:

```sql
UPDATE user_settings 
SET 
  awsAccessKey = 'sua-access-key',
  awsSecretKey = 'sua-secret-key',
  awsRegion = 'us-east-1'
WHERE userId = 'seu-user-id';
```

### Erro: "Erro ao descriptografar credenciais AWS"

**Causa**: `ENCRYPTION_SECRET` não está configurado ou está incorreto.

**Solução**:
1. Verifique o arquivo `.env`:
```bash
cat backend/.env | grep ENCRYPTION_SECRET
```

2. Se não existir, adicione:
```bash
ENCRYPTION_SECRET=sua-chave-secreta-aqui
```

### Erro: Rate Limiting da AWS

**Sintomas**: Múltiplos modelos falhando com erros de throttling.

**Solução**:
1. Aumente o delay:
```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --delay=10000
```

2. Ou certifique em lotes menores:
```bash
# Lote 1: Amazon
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=amazon.nova-micro-v1:0,amazon.nova-lite-v1:0

# Aguarde 5 minutos...

# Lote 2: Anthropic
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=anthropic.claude-3-5-sonnet-20241022-v2:0,anthropic.claude-3-5-haiku-20241022-v1:0
```

### Alguns Modelos Falharam

**Comportamento Normal**: O script continua mesmo se alguns modelos falharem.

**Ações**:
1. Verifique o relatório final para ver quais falharam
2. Verifique o log detalhado (arquivo `.log`)
3. Re-certifique apenas os que falharam:

```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes \
  --only=modelo-que-falhou-1,modelo-que-falhou-2 \
  --skip-cleanup
```

### Script Travou ou Foi Interrompido

**Situação**: Ctrl+C ou erro fatal no meio da execução.

**Estado do Sistema**:
- Certificações antigas: **Deletadas** (se passou da fase de cleanup)
- Certificações novas: **Parcialmente criadas**

**Recuperação**:
1. Execute novamente com `--skip-cleanup`:
```bash
npx ts-node backend/scripts/recertify-all-models.ts --yes --skip-cleanup
```

2. Ou limpe tudo e recomece:
```bash
npx ts-node backend/scripts/clear-all-certifications.ts
npx ts-node backend/scripts/recertify-all-models.ts --yes
```

---

## 📄 Logs

### Localização

Os logs são salvos em:
```
backend/scripts/recertification-YYYY-MM-DD-HH-mm-ss.log
```

Exemplo:
```
backend/scripts/recertification-2026-01-30-09-15-30.log
```

### Conteúdo do Log

O log contém:
- ✅ Configurações utilizadas
- ✅ Estatísticas gerais
- ✅ Resultados detalhados de cada modelo
- ✅ Ratings, badges, success rates
- ✅ Erros completos

### Visualizar Log

```bash
# Ver log mais recente
ls -lt backend/scripts/recertification-*.log | head -1 | xargs cat

# Ver apenas sucessos
cat backend/scripts/recertification-*.log | grep "Status: success"

# Ver apenas falhas
cat backend/scripts/recertification-*.log | grep "Status: failed"
```

---

## 📊 Relatório Final

Ao final da execução, o script exibe um relatório completo:

```
================================================================================
📊 RELATÓRIO FINAL DE RE-CERTIFICAÇÃO
================================================================================

📈 ESTATÍSTICAS GERAIS:
────────────────────────────────────────────────────────────────────────────────
  Total de modelos:      18
  ✅ Sucesso:            16 (88.9%)
  ❌ Falha:              2 (11.1%)
  ⏭️  Pulados:            0
  ⏱️  Tempo total:        10m 30s
  ⏱️  Tempo médio/modelo: 35s

✅ MODELOS CERTIFICADOS COM SUCESSO:
────────────────────────────────────────────────────────────────────────────────
1. amazon.nova-micro-v1:0
   Rating: ⭐⭐⭐⭐⭐ 5.0
   Badge: 🏆 PREMIUM
   Success Rate: 100.0%
   Latência: 850ms
   Tentativas: 1

2. anthropic.claude-3-5-sonnet-20241022-v2:0
   Rating: ⭐⭐⭐⭐⭐ 5.0
   Badge: 🏆 PREMIUM
   Success Rate: 100.0%
   Latência: 1200ms
   Tentativas: 1

...

❌ MODELOS COM FALHA:
────────────────────────────────────────────────────────────────────────────────
1. cohere.command-r-plus-v1:0
   Erro: Model not available in region
   Tentativas: 2

================================================================================

💾 Log salvo em: backend/scripts/recertification-2026-01-30-09-15-30.log
```

---

## 🔗 Relacionados

- [`certify-model.ts`](./certify-model.ts) - Certificar modelo individual
- [`clear-all-certifications.ts`](./clear-all-certifications.ts) - Limpar certificações
- [`check-certifications.ts`](./check-certifications.ts) - Verificar status das certificações
- [`test-all-models.ts`](./test-all-models.ts) - Testar todos os modelos

---

## 📝 Notas Importantes

1. **Execução Sequencial**: O script NÃO executa em paralelo para evitar rate limiting
2. **Delay Obrigatório**: Sempre há um delay entre modelos (mínimo recomendado: 5s)
3. **Retry Automático**: Cada modelo tem até N tentativas antes de falhar
4. **Continua em Falhas**: Por padrão, o script continua mesmo se um modelo falhar
5. **Log Persistente**: Sempre salva um log completo em arquivo

---

## 🆘 Suporte

Se encontrar problemas:

1. ✅ Verifique o [Troubleshooting](#troubleshooting)
2. ✅ Analise o arquivo de log gerado
3. ✅ Execute em modo `--dry-run` primeiro
4. ✅ Teste com apenas 1-2 modelos usando `--only`
5. ✅ Verifique as credenciais AWS

---

**Última atualização**: 2026-01-30
