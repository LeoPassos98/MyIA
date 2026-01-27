# Plano de Implementação - Sistema de Logging (Parte 2)

> **Continuação de:** [LOGGING-IMPLEMENTATION-PLAN.md](./LOGGING-IMPLEMENTATION-PLAN.md)

---

## Fase 2 (Continuação)

### Tarefa 2.4-2.5: Busca Avançada e Dashboard SSE

**Resumo:** Implementar endpoint `/api/logs` com filtros e SSE para streaming em tempo real.

**Checkpoints Críticos:**
- Performance de queries < 100ms
- SSE com latência < 1s
- Dashboard renderizando 1000+ logs sem lag

**Estratégia de Ajuste:**
- Se performance ruim → Adicionar índices compostos
- Se SSE falhar → Usar polling como fallback
- Se dashboard lento → Implementar virtualização (react-window)

---

## 📊 Fase 3: Observabilidade (Grafana + Loki) - Resumo Executivo

### Objetivos Mensuráveis

- [ ] Docker Compose funcionando (Loki + Grafana + Promtail)
- [ ] Loki consumindo logs em tempo real (latência < 5s)
- [ ] 3 Dashboards criados e funcionando
- [ ] Alertas configurados e disparando
- [ ] Documentação completa

### Duração Estimada
**4-6 semanas** (20-30 dias úteis)

---

### Tarefas Principais

#### 3.1: Docker Compose (Loki + Grafana + Promtail)

**Checkpoints:**
1. YAML válido e serviços iniciando
2. Loki acessível em http://localhost:3100
3. Grafana acessível em http://localhost:3001

**Estratégia de Ajuste:**
- Se Docker não disponível → Instalar nativamente
- Se portas ocupadas → Mudar para 3200/3002

---

#### 3.2: Configurar Loki

**Checkpoints:**
1. Loki recebendo logs do backend
2. Retenção de 30 dias configurada
3. Latência < 5s (do log até Loki)

**Estratégia de Ajuste:**
- Se Promtail falhar → Usar Loki transport direto no Winston
- Se latência alta → Otimizar batch size

---

#### 3.3: Dashboards Grafana

**3 Dashboards Obrigatórios:**

1. **Dashboard de Erros**
   - Taxa de erro (%)
   - Top 10 erros
   - Erros por endpoint
   - Timeline de erros

2. **Dashboard de Latência**
   - P50, P95, P99
   - Latência por endpoint
   - Latência por provider/model
   - Alertas de latência

3. **Dashboard de Uso**
   - Requisições/minuto
   - Usuários ativos
   - Uso por provider
   - Custos estimados

**Checkpoints:**
- Datasource Loki configurado
- 3 dashboards funcionando
- Queries LogQL otimizadas
- Gráficos atualizando em tempo real

---

#### 3.4: Alertas

**Alertas Obrigatórios:**

1. **High Error Rate**
   - Condição: Taxa de erro > 5% em 5 minutos
   - Severidade: Critical
   - Notificação: Email + Slack

2. **High Latency**
   - Condição: P95 > 2s em 5 minutos
   - Severidade: Warning
   - Notificação: Slack

**Checkpoints:**
- Prometheus coletando métricas
- Alertmanager configurado
- Alertas disparando corretamente
- Notificações funcionando

---

### 🎯 Checkpoint Final de Fase 3

**Teste de Validação Completo:**

```bash
# 1. Verificar serviços
docker-compose ps
# Esperado: loki, grafana, promtail (Up)

# 2. Verificar Loki
curl http://localhost:3100/ready
# Esperado: ready

# 3. Verificar logs no Loki
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="myia-backend"}'
# Esperado: JSON com logs

# 4. Acessar Grafana
# http://localhost:3001
# Login: admin / admin
# Verificar: 3 dashboards funcionando

# 5. Simular alerta
# Fazer 100 requisições com erro
# Aguardar 1 minuto
# Verificar alerta disparado
```

**Se TODOS passarem:**
- ✅ **Sistema de Logging COMPLETO**
- ✅ **Todas as 3 fases concluídas**

---

## 🔄 Estratégias de Ajuste Globais

### Matriz de Decisão

| Situação | Ação Imediata | Plano B | Plano C | Rollback |
|----------|---------------|---------|---------|----------|
| **Winston não instala** | Verificar versões | Usar Pino | Logger customizado | Manter console.log |
| **SQLite lento** | Otimizar config | Usar apenas File | Adiar para Fase 2 | Não aplicar |
| **PostgreSQL inacessível** | Verificar DATABASE_URL | Usar SQLite | Adiar Fase 2 | Voltar Fase 1 |
| **SSE não funciona** | Revisar implementação | Usar polling | Adiar dashboard | Não aplicar |
| **Docker não disponível** | Instalar Docker | Instalar nativamente | Usar dashboard básico | Manter Fase 2 |
| **Loki não ingere logs** | Verificar Promtail | Transport direto | PostgreSQL datasource | Manter Fase 2 |
| **Performance degradada** | Otimizar queries | Adicionar índices | Reduzir escopo | Rollback imediato |

---

### Gatilhos de Escalação

**Escalar para Architect quando:**
- Checkpoint falha 2x consecutivas
- Decisão arquitetural necessária
- Mudança de estratégia necessária
- Trade-off complexo (performance vs features)

**Escalar para Orchestrator quando:**
- Tarefa envolve > 3 modos
- Coordenação complexa necessária
- Múltiplas subtarefas paralelas
- Dependências cruzadas

**Escalar para Debug quando:**
- Erro não reproduzível
- Performance inesperada
- Comportamento anômalo
- Investigação profunda necessária

---

## 📈 Métricas de Sucesso Consolidadas

### Fase 1: MVP

| Métrica | Target | Status |
|---------|--------|--------|
| Winston instalado | ✅ | ⏳ |
| Transports funcionando | 3/3 | ⏳ |
| console.log migrados | 100% | ⏳ |
| Testes passando | 100% | ⏳ |
| Cobertura | > 80% | ⏳ |
| Performance | < 5ms/log | ⏳ |

### Fase 2: Produção

| Métrica | Target | Status |
|---------|--------|--------|
| Migration aplicada | ✅ | ⏳ |
| Transport PostgreSQL | ✅ | ⏳ |
| Índices criados | 5/5 | ⏳ |
| Performance queries | < 100ms | ⏳ |
| SSE latência | < 1s | ⏳ |
| Dashboard funcionando | ✅ | ⏳ |

### Fase 3: Observabilidade

| Métrica | Target | Status |
|---------|--------|--------|
| Docker Compose | ✅ | ⏳ |
| Loki ingestão | < 5s | ⏳ |
| Dashboards | 3/3 | ⏳ |
| Alertas | 2/2 | ⏳ |
| Notificações | ✅ | ⏳ |
| Documentação | ✅ | ⏳ |

---

## 👥 Delegação de Modos - Resumo

### Matriz Simplificada

| Fase | Tarefas Principais | Modo Primário | Modo Secundário |
|------|-------------------|---------------|-----------------|
| **Fase 1** | Instalar Winston | Code | Debug |
| | Criar LogEntry | Code | Architect |
| | Middleware requestId | Code | Test Engineer |
| | Migrar console.log | Code | Code Simplifier |
| | Testes | Test Engineer | Code |
| | Documentação | Docs Specialist | Architect |
| **Fase 2** | Migration PostgreSQL | Code | Architect |
| | Transport PostgreSQL | Code | Debug |
| | Busca Avançada | Code | Frontend Specialist |
| | Dashboard SSE | Frontend Specialist | Code |
| **Fase 3** | Docker Compose | Code | Architect |
| | Configurar Loki | Code | Debug |
| | Dashboards Grafana | Frontend Specialist | Code |
| | Alertas | Code | Architect |
| | Documentação | Docs Specialist | Architect |

---

## 🎯 Critérios de Sucesso Final

### Checklist Completo

**Fase 1 (MVP):**
- [ ] Winston instalado e configurado
- [ ] LogEntry interface criada
- [ ] Middleware requestId funcionando
- [ ] 100% console.log migrados
- [ ] Testes > 80% cobertura
- [ ] Performance < 5ms/log
- [ ] Documentação completa

**Fase 2 (Produção):**
- [ ] PostgreSQL migration aplicada
- [ ] Transport PostgreSQL funcionando
- [ ] Retenção automática (30 dias)
- [ ] Índices de performance criados
- [ ] Busca avançada funcionando
- [ ] Dashboard SSE funcionando
- [ ] Performance queries < 100ms

**Fase 3 (Observabilidade):**
- [ ] Docker Compose funcionando
- [ ] Loki consumindo logs (< 5s)
- [ ] 3 Dashboards Grafana funcionando
- [ ] 2 Alertas configurados
- [ ] Notificações funcionando
- [ ] Documentação completa

---

## 📚 Documentação a Criar

### Fase 1
- [ ] [`docs/LOGGING-USAGE-GUIDE.md`](./LOGGING-USAGE-GUIDE.md) - Guia de uso do logger
- [ ] Atualizar [`docs/STANDARDS.md`](./STANDARDS.md) Seção 13

### Fase 2
- [ ] [`docs/LOGGING-SEARCH-API.md`](./LOGGING-SEARCH-API.md) - API de busca de logs
- [ ] [`docs/LOGGING-DASHBOARD-GUIDE.md`](./LOGGING-DASHBOARD-GUIDE.md) - Guia do dashboard SSE

### Fase 3
- [ ] [`docs/GRAFANA-GUIDE.md`](./GRAFANA-GUIDE.md) - Guia de acesso ao Grafana
- [ ] [`docs/LOGGING-RUNBOOK.md`](./LOGGING-RUNBOOK.md) - Runbook de troubleshooting
- [ ] [`docs/LOGGING-ALERTS-GUIDE.md`](./LOGGING-ALERTS-GUIDE.md) - Guia de alertas

---

## 🚨 Troubleshooting Rápido

### Problemas Comuns

**Winston não instala:**
```bash
# Solução 1: Limpar cache
npm cache clean --force
npm install winston

# Solução 2: Usar versão específica
npm install winston@3.11.0
```

**SQLite lento:**
```typescript
// Solução: Usar apenas Console + File
transports: [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'logs/combined.log' })
]
```

**PostgreSQL inacessível:**
```bash
# Verificar conexão
psql -U leonardo -h localhost -d myia

# Verificar DATABASE_URL
echo $DATABASE_URL
```

**SSE não funciona:**
```typescript
// Fallback para polling
const useLogs = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/logs?limit=50').then(/* ... */);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
};
```

**Docker não inicia:**
```bash
# Verificar portas
lsof -i :3100
lsof -i :3001

# Mudar portas no docker-compose.yml
ports:
  - "3200:3100"  # Loki
  - "3002:3000"  # Grafana
```

---

## 📊 Timeline Estimado

```
Semana 1-2: Fase 1 (MVP)
├─ Dia 1-2: Winston + LogEntry + Middleware
├─ Dia 3-5: Migração console.log (50%)
├─ Dia 6-8: Migração console.log (100%)
├─ Dia 9-10: Testes + Documentação
└─ Checkpoint Fase 1

Semana 3-6: Fase 2 (Produção)
├─ Semana 3: Migration PostgreSQL + Transport
├─ Semana 4: Retenção + Índices + Busca
├─ Semana 5: Dashboard SSE (backend)
├─ Semana 6: Dashboard SSE (frontend) + Testes
└─ Checkpoint Fase 2

Semana 7-12: Fase 3 (Observabilidade)
├─ Semana 7-8: Docker Compose + Loki
├─ Semana 9-10: Grafana + Dashboards
├─ Semana 11: Alertas + Prometheus
├─ Semana 12: Documentação + Validação Final
└─ Checkpoint Fase 3

TOTAL: 12 semanas (3 meses)
```

---

## ✅ Próximos Passos

1. **Revisar este plano com stakeholders**
2. **Aprovar arquitetura e cronograma**
3. **Criar branch `feature/logging-system`**
4. **Iniciar Fase 1: MVP**
5. **Executar checkpoints sequencialmente**
6. **Ajustar estratégia conforme necessário**

---

**Documento criado em:** 2026-01-26  
**Versão:** 1.0  
**Status:** Aguardando Aprovação
