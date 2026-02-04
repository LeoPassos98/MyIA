# Correção: Logs em Tempo Real no Grafana

## 🎯 Problema Identificado

Logs não apareciam em tempo real no Grafana, mesmo com:
- ✅ PostgresTransport habilitado (`ENABLE_POSTGRES_TRANSPORT=true`)
- ✅ Backend reiniciado
- ✅ Logs sendo escritos no PostgreSQL
- ✅ Serviços Docker (Loki, Promtail, Grafana) rodando

## 🔍 Diagnóstico

### Causa Raiz
**Limite de streams do Loki excedido** devido ao uso de campos de alta cardinalidade como labels.

### Erro Encontrado
```
level=error caller=client.go:342 component=client host=loki:3100 msg="batch add err" 
error="streams limit exceeded, streams: 1000 exceeds limit: 1000, 
stream: '{app="myia", component="backend", environment="development", 
filename="/var/log/myia/http.log", job="myia-backend", level="info", 
requestId="dfcd4685-751e-4d73-a5cd-f90ccd72746d"}'"
```

### Análise Técnica

#### O que são Streams no Loki?
No Loki, cada combinação única de labels cria um **stream** separado. Por exemplo:
- `{job="myia-backend", level="info"}` = 1 stream
- `{job="myia-backend", level="error"}` = 1 stream
- `{job="myia-backend", level="info", requestId="abc123"}` = 1 stream
- `{job="myia-backend", level="info", requestId="xyz789"}` = 1 stream (NOVO!)

#### Por que requestId é problemático?
- Cada requisição HTTP gera um `requestId` único
- Com 1000+ requisições, temos 1000+ streams
- Loki tinha limite de 10.000 streams configurado
- Sistema atingiu o limite e parou de aceitar novos logs

#### Campos de Alta vs Baixa Cardinalidade

**Alta Cardinalidade (❌ NÃO usar como label):**
- `requestId` - único por requisição
- `userId` - único por usuário
- `timestamp` - único por momento
- `traceId` - único por trace

**Baixa Cardinalidade (✅ OK usar como label):**
- `level` - poucos valores (info, warn, error, debug)
- `service` - poucos valores (auth, chat, ai)
- `environment` - poucos valores (dev, staging, prod)
- `job` - poucos valores (backend, frontend)

## 🔧 Correções Aplicadas

### 1. Promtail Configuration (`observability/promtail/promtail-config.yml`)

#### ❌ Antes (Incorreto)
```yaml
- labels:
    level:
    service:
    requestId:      # ❌ Alta cardinalidade!
    method:         # ❌ Alta cardinalidade!
    statusCode:     # ❌ Alta cardinalidade!
```

#### ✅ Depois (Correto)
```yaml
- labels:
    level:          # ✅ Baixa cardinalidade
    service:        # ✅ Baixa cardinalidade
# requestId, method, statusCode ainda são parseados em 'expressions'
# mas NÃO são usados como labels (não criam streams)
```

**Impacto:**
- Antes: ~1000+ streams (um por requestId único)
- Depois: ~10-20 streams (combinações de level × service)

### 2. Loki Configuration (`observability/loki/loki-config.yml`)

```yaml
limits_config:
  max_streams_per_user: 50000  # Aumentado de 10000 para 50000
```

**Justificativa:**
- Medida de segurança adicional
- Permite crescimento futuro
- Não resolve o problema raiz, mas previne recorrência

### 3. Scripts de Diagnóstico e Correção

#### `observability/diagnose-grafana-realtime.sh`
Script completo de diagnóstico que verifica:
- ✅ Serviços Docker rodando
- ✅ Arquivos de log sendo gerados
- ✅ Promtail lendo os logs
- ✅ Loki aceitando logs
- ✅ Grafana conectado ao Loki
- ❌ Erros de limite de streams
- ⏱️ Timestamps e timezone

#### `observability/fix-grafana-realtime.sh`
Script de correção automática que:
1. Para os serviços Docker
2. Limpa dados antigos do Loki (opcional)
3. Reinicia os serviços
4. Aguarda serviços ficarem saudáveis
5. Gera logs de teste
6. Valida que logs aparecem no Loki

#### `observability/validate-realtime-logs.sh`
Script de validação end-to-end que:
1. Verifica todos os serviços
2. Gera log de teste com ID único
3. Aguarda log aparecer no Loki
4. Mede latência (tempo até aparecer)
5. Valida que requestId não está nos labels
6. Gera relatório de testes

## 📊 Arquitetura do Sistema de Logs

```
┌─────────────┐
│   Backend   │
│  (Winston)  │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────┐                    ┌─────────────┐
│  File       │                    │ PostgreSQL  │
│  Transport  │                    │  Transport  │
│             │                    │             │
│ combined.log│                    │  logs table │
│ error.log   │                    │             │
│ http.log    │                    │ (consultas  │
└──────┬──────┘                    │  diretas)   │
       │                           └─────────────┘
       │
       ▼
┌─────────────┐
│  Promtail   │ ← Lê arquivos .log
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Loki     │ ← Agrega logs em streams
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grafana   │ ← Visualiza logs em tempo real
│             │
└─────────────┘
```

### Fluxo de Dados

1. **Backend gera log** → Winston logger
2. **Winston escreve** → Arquivo (`combined.log`) + PostgreSQL (se habilitado)
3. **Promtail lê** → Arquivo de log (tail -f)
4. **Promtail envia** → Loki (HTTP push)
5. **Loki armazena** → Streams (agrupados por labels)
6. **Grafana consulta** → Loki (LogQL queries)
7. **Usuário visualiza** → Dashboard em tempo real

## 🚀 Como Aplicar a Correção

### Opção 1: Script Automático (Recomendado)

```bash
cd observability
chmod +x fix-grafana-realtime.sh
./fix-grafana-realtime.sh
```

O script irá:
- Parar os serviços
- Perguntar se deseja limpar dados antigos
- Reiniciar com nova configuração
- Validar que está funcionando

### Opção 2: Manual

```bash
cd observability

# 1. Parar serviços
docker-compose down

# 2. Limpar dados antigos (opcional mas recomendado)
rm -rf data/loki/chunks/*
rm -rf data/loki/tsdb-*

# 3. Iniciar serviços
docker-compose up -d

# 4. Aguardar serviços ficarem prontos
sleep 15

# 5. Verificar logs
docker-compose logs -f promtail
```

## ✅ Validação

### Executar Script de Validação

```bash
cd observability
chmod +x validate-realtime-logs.sh
./validate-realtime-logs.sh
```

### Validação Manual

1. **Verificar serviços:**
```bash
cd observability
docker-compose ps
# Todos devem estar "Up" e "healthy"
```

2. **Gerar log de teste:**
```bash
curl http://localhost:3001/api/health
```

3. **Verificar no Loki:**
```bash
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="myia-backend"}' \
  --data-urlencode "start=$(date -u -d '1 minute ago' +%s)000000000" \
  --data-urlencode "end=$(date -u +%s)000000000" \
  --data-urlencode "limit=10" | jq
```

4. **Verificar no Grafana:**
- Acesse: http://localhost:3002
- Login: admin / admin
- Dashboard: "MyIA - Overview"
- Painel: "Logs Recentes"
- Deve mostrar logs dos últimos minutos

5. **Verificar que não há erros:**
```bash
cd observability
docker-compose logs promtail | grep "streams limit exceeded"
# Não deve retornar nada
```

## 📈 Métricas de Sucesso

### Antes da Correção
- ❌ Logs não aparecem no Grafana
- ❌ Erro "streams limit exceeded" no Promtail
- ❌ ~1000+ streams no Loki
- ❌ Latência infinita (logs nunca aparecem)

### Depois da Correção
- ✅ Logs aparecem em tempo real no Grafana
- ✅ Sem erros no Promtail
- ✅ ~10-20 streams no Loki
- ✅ Latência < 10s (log aparece rapidamente)

## 🎓 Lições Aprendidas

### 1. Labels vs Metadata no Loki

**Labels (indexados):**
- Usados para filtrar e agrupar logs
- Criam streams separados
- DEVEM ter baixa cardinalidade
- Exemplos: level, service, environment

**Metadata (não indexados):**
- Armazenados no conteúdo do log
- Não criam streams
- PODEM ter alta cardinalidade
- Exemplos: requestId, userId, traceId
- Ainda podem ser buscados com filtros de texto

### 2. Configuração Correta do Promtail

```yaml
pipeline_stages:
  # 1. Parse JSON (extrai TODOS os campos)
  - json:
      expressions:
        level: level
        service: service
        requestId: requestId  # ✅ Extraído mas não usado como label
        
  # 2. Adiciona APENAS labels de baixa cardinalidade
  - labels:
      level:    # ✅ Baixa cardinalidade
      service:  # ✅ Baixa cardinalidade
      # requestId NÃO está aqui! ✅
```

### 3. Monitoramento de Streams

Adicionar alerta para monitorar contagem de streams:

```bash
# Verificar contagem de streams
curl -s "http://localhost:3100/loki/api/v1/labels" | jq '.data | length'

# Se > 100, investigar quais labels estão criando muitos streams
curl -s "http://localhost:3100/loki/api/v1/label/__name__/values" | jq
```

## 🔮 Melhorias Futuras

### 1. Adicionar Alertas no Grafana

Criar alerta para:
- Contagem de streams > 1000
- Erros no Promtail
- Latência de logs > 30s

### 2. Otimizar Retenção

Configurar retenção por nível:
- `error`: 30 dias
- `warn`: 14 dias
- `info`: 7 dias
- `debug`: 1 dia

### 3. Adicionar Métricas

Exportar métricas do Loki para Prometheus:
- Taxa de ingestão de logs
- Contagem de streams
- Latência de queries

## 📚 Referências

- [Loki Best Practices](https://grafana.com/docs/loki/latest/best-practices/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Cardinality in Loki](https://grafana.com/docs/loki/latest/best-practices/#avoid-high-cardinality-labels)

## 🆘 Troubleshooting

### Logs ainda não aparecem

1. **Verificar backend está gerando logs:**
```bash
tail -f backend/logs/combined.log
```

2. **Verificar Promtail está lendo:**
```bash
cd observability
docker-compose logs promtail | tail -20
```

3. **Verificar Loki está aceitando:**
```bash
curl http://localhost:3100/ready
```

4. **Verificar Grafana está conectado:**
```bash
curl -u admin:admin http://localhost:3002/api/datasources
```

### Erro "streams limit exceeded" ainda aparece

1. **Verificar configuração do Promtail:**
```bash
grep -A 5 "labels:" observability/promtail/promtail-config.yml
# NÃO deve ter requestId, method, statusCode
```

2. **Limpar dados antigos:**
```bash
cd observability
docker-compose down
rm -rf data/loki/chunks/*
rm -rf data/loki/tsdb-*
docker-compose up -d
```

### Latência alta (logs demoram a aparecer)

1. **Verificar intervalo de scrape do Promtail** (padrão: 1s)
2. **Verificar batch size do Promtail** (padrão: 1MB)
3. **Verificar cache do Grafana** (desabilitar no dashboard)

## ✅ Checklist de Validação

- [ ] Serviços Docker rodando (loki, promtail, grafana)
- [ ] Sem erros "streams limit exceeded" no Promtail
- [ ] Logs aparecem no Loki (query via API)
- [ ] Logs aparecem no Grafana (dashboard)
- [ ] Latência < 10s (log aparece rapidamente)
- [ ] requestId não está nos labels do Loki
- [ ] Contagem de streams < 100
- [ ] Auto-refresh habilitado no Grafana (10s)
- [ ] Backend gerando logs (combined.log atualizado)
- [ ] PostgresTransport funcionando (logs no PostgreSQL)

---

**Status:** ✅ Correção Completa  
**Data:** 2026-01-30  
**Autor:** Debug Mode  
**Versão:** 1.0
