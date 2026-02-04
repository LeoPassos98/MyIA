# ⚠️ DOCUMENTO ARQUIVADO

**Este documento foi consolidado e movido para archive/.**

## 📍 Novo Local

A informação deste documento agora está em:
👉 **[logging/README.md](../../logging/README.md)** - Guia rápido de logging  
👉 **[logging/LOGGING-SYSTEM.md](../../logging/LOGGING-SYSTEM.md)** - Sistema completo

## 📚 Histórico

- **Arquivado em:** 04/02/2026  
- **Motivo:** Consolidação de documentação (Refatoração Fase 2)

**Para mais informações sobre a refatoração, consulte:**
- [Plano de Refatoração](../../REFACTORING-PLAN.md)
- [Log de Arquivos Movidos](../MOVED-FILES-LOG.md)

---

# 🚀 Guia Rápido - Sistema de Logging MyIA

> **Versão:** 1.0  
> **Data:** 2026-01-26  
> **Tempo de Leitura:** 5 minutos

---

## 🎯 O Que Você Pode Fazer

O sistema de logging do MyIA oferece **4 formas** de visualizar e analisar logs:

| Método | Uso | Tempo de Setup | Melhor Para |
|--------|-----|----------------|-------------|
| **Console** | Desenvolvimento local | 0 min | Debug rápido |
| **Arquivos** | Análise offline | 0 min | Auditoria |
| **API REST** | Integração programática | 2 min | Automação |
| **Grafana** | Observabilidade visual | 3 min | Produção |

---

## 🚀 Início Rápido (3 minutos)

### 1️⃣ Ver Logs no Console (Desenvolvimento)

**Objetivo:** Ver logs em tempo real durante desenvolvimento

**Tempo:** Imediato

**Como fazer:**

```bash
# 1. Iniciar o backend
cd backend
npm run dev

# 2. Fazer uma requisição
curl http://localhost:3001/api/health

# 3. Ver logs no terminal
```

**Resultado esperado:**

```
[2026-01-26T20:30:45.123Z] INFO: [server] Servidor iniciado na porta 3001
[2026-01-26T20:30:50.456Z] INFO: [healthCheck] Health check realizado
```

**Níveis de log:**
- 🔵 **INFO** - Operações normais
- 🟡 **WARN** - Avisos (não críticos)
- 🔴 **ERROR** - Erros que precisam atenção
- 🟣 **DEBUG** - Informações detalhadas (apenas em dev)

---

### 2️⃣ Ver Logs em Arquivos

**Objetivo:** Analisar logs salvos em disco

**Tempo:** Imediato

**Como fazer:**

```bash
# 1. Navegar até a pasta de logs
cd backend/logs

# 2. Ver logs do dia atual
cat combined-2026-01-26.log

# 3. Ver apenas erros
cat error-2026-01-26.log

# 4. Buscar logs específicos
grep "userId" combined-2026-01-26.log

# 5. Ver logs em tempo real (tail)
tail -f combined-2026-01-26.log
```

**Estrutura dos arquivos:**

```
backend/logs/
├── combined-2026-01-26.log    # Todos os logs (info, warn, error)
├── error-2026-01-26.log       # Apenas erros
├── combined-2026-01-25.log    # Logs do dia anterior
└── error-2026-01-25.log       # Erros do dia anterior
```

**Formato JSON:**

```json
{
  "timestamp": "2026-01-26T20:30:45.123Z",
  "level": "info",
  "message": "Usuário fez login",
  "requestId": "req-abc-123",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "ip": "192.168.1.1",
    "action": "login"
  }
}
```

**Retenção:**
- Logs são mantidos por **30 dias**
- Arquivos antigos são deletados automaticamente

---

### 3️⃣ Buscar Logs via API REST

**Objetivo:** Buscar logs programaticamente com filtros avançados

**Tempo:** 2 minutos

**Pré-requisitos:**
- Backend rodando
- Token JWT válido

**Como fazer:**

```bash
# 1. Fazer login e obter token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}' \
  | jq -r '.data.token')

# 2. Buscar todos os logs (paginado)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?page=1&limit=10"

# 3. Buscar apenas erros
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?level=error"

# 4. Buscar logs de um usuário
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?userId=550e8400-e29b-41d4-a716-446655440000"

# 5. Buscar logs de uma requisição (correlação)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/request/req-abc-123"

# 6. Buscar logs com texto
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?search=login"

# 7. Ver estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/stats"
```

**Resposta típica:**

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "e5582549-828d-4461-856f-7fa004e44627",
        "timestamp": "2026-01-26T22:59:40.343Z",
        "level": "error",
        "message": "Erro ao processar inferência",
        "requestId": null,
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "metadata": {
          "model": "claude-3-sonnet",
          "provider": "anthropic"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

**Filtros disponíveis:**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `level` | Nível do log | `error`, `warn`, `info` |
| `userId` | ID do usuário | `550e8400-e29b-41d4-a716-446655440000` |
| `requestId` | ID da requisição | `req-abc-123` |
| `inferenceId` | ID da inferência | `inf-xyz-789` |
| `startDate` | Data início | `2026-01-26T00:00:00Z` |
| `endDate` | Data fim | `2026-01-26T23:59:59Z` |
| `search` | Busca em message | `login` |
| `page` | Número da página | `1` |
| `limit` | Itens por página | `20` (max: 100) |
| `sort` | Ordenação | `asc`, `desc` |

**Performance:**
- ⚡ Média: **11-26ms**
- 🎯 Todas as queries < 100ms

**Documentação completa:** [`docs/LOGS-API-DOCUMENTATION.md`](./LOGS-API-DOCUMENTATION.md)

---

### 4️⃣ Usar Grafana (Observabilidade Visual)

**Objetivo:** Visualizar logs em dashboards interativos

**Tempo:** 3 minutos

**Como fazer:**

```bash
# 1. Iniciar stack de observabilidade
cd observability
./start.sh start

# 2. Aguardar serviços subirem (30s)
# Loki: http://localhost:3100
# Grafana: http://localhost:3002

# 3. Acessar Grafana
# URL: http://localhost:3002
# Usuário: admin
# Senha: admin
```

**Dashboards disponíveis:**

1. **📊 Overview** - Visão geral do sistema
   - Total de logs por nível
   - Taxa de logs por minuto
   - Logs recentes

2. **🔴 Errors** - Monitoramento de erros
   - Taxa de erro em tempo real
   - Top 10 erros mais frequentes
   - Erros por endpoint
   - Timeline de erros

3. **⚡ Performance** - Análise de performance
   - Latência P50/P95/P99
   - Latência por endpoint
   - Latência por provider/model

**Queries LogQL úteis:**

```logql
# Buscar todos os logs
{app="myia-backend"}

# Buscar apenas erros
{app="myia-backend",level="error"}

# Buscar por usuário
{app="myia-backend",userId="550e8400-e29b-41d4-a716-446655440000"}

# Buscar por requestId
{app="myia-backend",requestId="req-abc-123"}

# Buscar com texto
{app="myia-backend"} |= "login"

# Taxa de erro
sum(rate({app="myia-backend",level="error"}[5m])) 
/ 
sum(rate({app="myia-backend"}[5m]))
```

**Comandos úteis:**

```bash
# Ver status dos serviços
./start.sh status

# Parar serviços
./start.sh stop

# Reiniciar serviços
./start.sh restart

# Ver logs do Loki
docker logs myia-loki -f

# Ver logs do Grafana
docker logs myia-grafana -f
```

---

## 💡 Casos de Uso Comuns

### 🔍 Caso 1: Debug de Erro em Produção

**Cenário:** Usuário reportou erro ao fazer login

**Passo a passo:**

```bash
# 1. Buscar erros recentes do usuário
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?level=error&userId=USER_ID&limit=10"

# 2. Identificar requestId do erro
# Exemplo: "requestId": "req-abc-123"

# 3. Buscar todos os logs da requisição (correlação)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/request/req-abc-123"

# 4. Analisar sequência de eventos
# - O que aconteceu antes do erro?
# - Qual foi o erro exato?
# - Qual foi o stack trace?
```

**Tempo estimado:** 2 minutos

---

### 📊 Caso 2: Monitorar Taxa de Erro

**Cenário:** Verificar se sistema está saudável

**Opção 1: Via API**

```bash
# Buscar estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/stats"

# Resposta:
# {
#   "stats": [
#     {"level": "info", "count": 1000},
#     {"level": "error", "count": 5}
#   ]
# }
# Taxa de erro: 5/1005 = 0.5% ✅
```

**Opção 2: Via Grafana**

1. Acessar dashboard "Errors"
2. Ver painel "Taxa de Erro"
3. Verificar se está abaixo de 5%

**Tempo estimado:** 1 minuto

---

### 🔎 Caso 3: Rastrear Jornada do Usuário

**Cenário:** Entender o que um usuário fez no sistema

**Passo a passo:**

```bash
# 1. Buscar todos os logs do usuário (últimas 24h)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?userId=USER_ID&startDate=2026-01-26T00:00:00Z&limit=100"

# 2. Analisar ações:
# - Login
# - Requisições feitas
# - Erros encontrados
# - Logout

# 3. Identificar padrões:
# - Quais features mais usou?
# - Onde teve problemas?
# - Quanto tempo ficou ativo?
```

**Tempo estimado:** 3 minutos

---

### ⚡ Caso 4: Analisar Performance de Inferência

**Cenário:** Verificar se inferências estão lentas

**Opção 1: Via Logs**

```bash
# Buscar logs de inferência
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?search=inference&limit=50"

# Analisar campo metadata.duration
```

**Opção 2: Via Grafana**

1. Acessar dashboard "Performance"
2. Ver painel "Latência por Provider/Model"
3. Identificar providers/models lentos

**Tempo estimado:** 2 minutos

---

### 🚨 Caso 5: Investigar Pico de Erros

**Cenário:** Alertas mostraram pico de erros às 14h

**Passo a passo:**

```bash
# 1. Buscar erros no período
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?level=error&startDate=2026-01-26T14:00:00Z&endDate=2026-01-26T15:00:00Z"

# 2. Agrupar por tipo de erro (analisar campo error.code)
# - API_ERROR: 50 ocorrências
# - VALIDATION_ERROR: 10 ocorrências
# - DATABASE_ERROR: 5 ocorrências

# 3. Investigar erro mais frequente
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?search=API_ERROR&startDate=2026-01-26T14:00:00Z"

# 4. Identificar causa raiz
# - Todos os erros são do provider "anthropic"
# - Mensagem: "Rate limit exceeded"
# - Conclusão: Atingimos limite de rate do Anthropic
```

**Tempo estimado:** 5 minutos

---

## 🆘 Problemas Comuns

### ❌ Problema 1: Logs não aparecem no console

**Sintomas:**
- Terminal não mostra logs
- Aplicação parece "muda"

**Diagnóstico:**

```bash
# Verificar variável de ambiente
echo $LOG_LEVEL

# Verificar configuração do logger
cat backend/src/utils/logger.ts | grep "level"
```

**Soluções:**

1. **Nível de log muito alto:**
   ```bash
   # Definir nível para debug
   export LOG_LEVEL=debug
   npm run dev
   ```

2. **Logger não inicializado:**
   ```typescript
   // Verificar se logger está sendo importado
   import { logger } from './utils/logger';
   ```

3. **Console transport desabilitado:**
   ```typescript
   // Em logger.ts, verificar:
   transports: [
     new winston.transports.Console({ ... }) // Deve estar presente
   ]
   ```

---

### ❌ Problema 2: Arquivos de log não são criados

**Sintomas:**
- Pasta `backend/logs` vazia
- Apenas logs no console

**Diagnóstico:**

```bash
# Verificar se pasta existe
ls -la backend/logs

# Verificar permissões
ls -ld backend/logs
```

**Soluções:**

1. **Pasta não existe:**
   ```bash
   mkdir -p backend/logs
   ```

2. **Sem permissão de escrita:**
   ```bash
   chmod 755 backend/logs
   ```

3. **File transport desabilitado:**
   ```typescript
   // Em logger.ts, verificar:
   transports: [
     new winston.transports.File({ ... }) // Deve estar presente
   ]
   ```

---

### ❌ Problema 3: API retorna 401 Unauthorized

**Sintomas:**
- Todas as requisições retornam 401
- Mensagem: "Token inválido"

**Diagnóstico:**

```bash
# Verificar se token está correto
echo $TOKEN

# Testar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}'
```

**Soluções:**

1. **Token expirado:**
   ```bash
   # Fazer login novamente
   TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"123@123.com","password":"123123"}' \
     | jq -r '.data.token')
   ```

2. **Token malformado:**
   ```bash
   # Verificar formato: Bearer <token>
   curl -H "Authorization: Bearer $TOKEN" ...
   ```

3. **Usuário não existe:**
   ```bash
   # Criar usuário
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"123@123.com","password":"123123","name":"Test User"}'
   ```

---

### ❌ Problema 4: Grafana não mostra logs

**Sintomas:**
- Dashboards vazios
- Queries não retornam dados

**Diagnóstico:**

```bash
# 1. Verificar se Loki está rodando
curl http://localhost:3100/ready

# 2. Verificar se Promtail está enviando logs
curl http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={app="myia-backend"}' | jq

# 3. Verificar logs do Loki
docker logs myia-loki --tail 50

# 4. Verificar logs do Promtail
docker logs myia-promtail --tail 50
```

**Soluções:**

1. **Loki não está rodando:**
   ```bash
   cd observability
   ./start.sh start
   ```

2. **Promtail não encontra arquivos:**
   ```bash
   # Verificar path em promtail-config.yml
   cat observability/promtail/promtail-config.yml | grep path
   
   # Deve apontar para: /var/log/myia/*.log
   # Que mapeia para: ../backend/logs/*.log
   ```

3. **Logs não estão em formato JSON:**
   ```bash
   # Verificar formato dos logs
   cat backend/logs/combined-2026-01-26.log | head -1
   
   # Deve ser JSON válido:
   # {"timestamp":"...","level":"info",...}
   ```

4. **Datasource não configurado:**
   - Acessar Grafana → Configuration → Data Sources
   - Verificar se "Loki" está presente
   - URL deve ser: `http://loki:3100`

---

### ❌ Problema 5: Performance lenta da API

**Sintomas:**
- Requisições demoram > 1s
- Timeout em queries

**Diagnóstico:**

```bash
# Verificar quantidade de logs no banco
psql -U leonardo -h localhost -d myia -c "SELECT COUNT(*) FROM logs;"

# Verificar índices
psql -U leonardo -h localhost -d myia -c "\d logs"
```

**Soluções:**

1. **Muitos logs no banco (> 1 milhão):**
   ```bash
   # Executar limpeza de logs antigos
   cd backend
   npx tsx scripts/cleanup-logs.ts
   ```

2. **Índices faltando:**
   ```bash
   # Recriar índices
   npx prisma migrate deploy
   ```

3. **Query sem filtros:**
   ```bash
   # Sempre usar filtros (level, userId, datas)
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3001/api/logs?level=error&startDate=2026-01-26T00:00:00Z"
   ```

4. **Limite muito alto:**
   ```bash
   # Usar limite razoável (max: 100)
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3001/api/logs?limit=20"
   ```

---

## 📚 Referências Rápidas

### Comandos Essenciais

```bash
# Backend
npm run dev                    # Iniciar backend
npm run build                  # Build para produção
npm run test                   # Executar testes

# Observabilidade
cd observability
./start.sh start              # Iniciar Loki + Grafana
./start.sh stop               # Parar serviços
./start.sh status             # Ver status
./validate.sh                 # Validar configuração

# Logs
tail -f backend/logs/combined-*.log    # Ver logs em tempo real
grep "error" backend/logs/*.log        # Buscar erros
cat backend/logs/error-*.log           # Ver apenas erros

# Database
psql -U leonardo -h localhost -d myia  # Conectar ao banco
npx tsx scripts/cleanup-logs.ts        # Limpar logs antigos
```

### URLs Importantes

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Backend | http://localhost:3001 | - |
| Grafana | http://localhost:3002 | admin / admin |
| Loki | http://localhost:3100 | - |

### Estrutura de Pastas

```
backend/
├── logs/                      # Arquivos de log
│   ├── combined-*.log        # Todos os logs
│   └── error-*.log           # Apenas erros
├── src/
│   ├── utils/logger.ts       # Configuração do logger
│   ├── services/logsService.ts    # Lógica de busca
│   └── routes/logsRoutes.ts       # Endpoints da API
└── scripts/
    └── cleanup-logs.ts       # Script de limpeza

observability/
├── docker-compose.yml        # Stack de observabilidade
├── loki/
│   └── loki-config.yml      # Config do Loki
├── promtail/
│   └── promtail-config.yml  # Config do Promtail
└── grafana/
    ├── datasources.yml      # Datasources
    ├── dashboards.yml       # Provisioning
    └── dashboards/          # Dashboards JSON
        ├── overview.json
        ├── errors.json
        └── performance.json
```

### Documentação Completa

- 📖 [API de Logs - Documentação Completa](./LOGS-API-DOCUMENTATION.md)
- 🗺️ [Roadmap de Implementação - Fases 2 e 3](./LOGGING-ROADMAP-PHASES-2-3.md)
- ✅ [Fase 3 Completa - Observabilidade](./LOGGING-ROADMAP-PHASE-3-COMPLETE.md)

---

## 🎓 Próximos Passos

Agora que você sabe usar o sistema de logging, explore:

1. **Criar Alertas Personalizados**
   - Configure alertas no Grafana
   - Receba notificações de erros críticos

2. **Integrar com CI/CD**
   - Use a API para monitorar deploys
   - Automatize análise de logs

3. **Criar Dashboards Customizados**
   - Crie visualizações específicas
   - Monitore métricas de negócio

4. **Exportar Logs**
   - Exporte logs para análise offline
   - Integre com ferramentas de BI

---

**Criado por:** Kilo Code  
**Data:** 2026-01-26  
**Versão:** 1.0  
**Status:** ✅ Completo

**Dúvidas?** Consulte a [documentação completa](./LOGS-API-DOCUMENTATION.md) ou abra uma issue.
