# Recomendações para Produção: Nova Arquitetura de Adapters

**Data:** 2026-01-30  
**Versão:** 2.0.0  
**Status:** Checklist Pré-Produção

---

## ✅ Checklist Pré-Produção

### Testes

- [ ] **Todos os testes unitários passando** (62/62)
  ```bash
  cd backend && npm test
  # Esperado: Test Suites: 25 passed, Tests: 62 passed
  ```

- [ ] **Validação de migração executada**
  ```bash
  cd backend && npx ts-node scripts/validate-adapter-migration.ts
  # Esperado: ✅ All models mapped successfully!
  ```

- [ ] **Feature flag testada** (true/false)
  ```bash
  cd backend && npx ts-node scripts/test-adapter-factory-feature-flag.ts
  # Esperado: ✅ Feature flag working as expected!
  ```

- [ ] **Pelo menos 2 modelos certificados com rating > 4.0**
  ```bash
  cd backend && npx ts-node scripts/check-certifications.ts
  # Esperado: 2+ modelos com rating >= 4.0
  ```

### Infraestrutura

- [ ] **Feature flag `USE_NEW_ADAPTERS=true` configurada**
  ```bash
  grep USE_NEW_ADAPTERS backend/.env
  # Esperado: USE_NEW_ADAPTERS=true
  ```

- [ ] **Logs configurados e funcionando**
  ```bash
  cd observability && ./logs.sh | head -n 10
  # Esperado: Logs em tempo real aparecem
  ```

- [ ] **Dashboard Grafana acessível**
  ```bash
  curl -s http://localhost:3002/api/health
  # Esperado: {"status":"ok"}
  ```

- [ ] **Rollback plan documentado**
  - Ver seção [Rollback Plan](#-rollback-plan) abaixo

### Documentação

- [ ] **Guia de migração criado**
  - [backend/docs/ADAPTER_MIGRATION_GUIDE.md](backend/docs/ADAPTER_MIGRATION_GUIDE.md)

- [ ] **Changelog atualizado**
  - [ADAPTER_MIGRATION_CHANGELOG.md](ADAPTER_MIGRATION_CHANGELOG.md)

- [ ] **README atualizado**
  - [README.md](README.md) - Seção "Nova Arquitetura de Adapters"

- [ ] **Quick start disponível**
  - [QUICK_START_NEW_ADAPTERS.md](QUICK_START_NEW_ADAPTERS.md)

---

## 🚀 Plano de Deploy

### Fase 1: Staging (1 semana)

**Objetivo:** Validar em ambiente controlado antes de produção

#### Dia 1-2: Setup e Validação Inicial

```bash
# 1. Configurar staging
cd backend
echo "USE_NEW_ADAPTERS=true" >> .env.staging
echo "NODE_ENV=staging" >> .env.staging

# 2. Deploy para staging
./deploy-staging.sh

# 3. Validar health check
curl https://staging.myia.com/api/health

# 4. Validar logs
cd observability
./logs.sh --env staging | grep "Using adapter"
```

**Checklist:**
- [ ] Deploy bem-sucedido
- [ ] Health check respondendo
- [ ] Logs mostrando adapters corretos
- [ ] Sem erros críticos nos primeiros 30 minutos

#### Dia 3-4: Certificação de Modelos

```bash
# Certificar modelos principais
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "anthropic.claude-sonnet-4-5-20250929-v1:0"
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "anthropic.claude-haiku-4-5-20250929-v1:0"
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-pro-v1:0"
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-lite-v1:0"
```

**Critérios de Sucesso:**
- [ ] Taxa de sucesso > 80% (4/5 modelos passando)
- [ ] Rating médio > 4.0
- [ ] Sem erros de adapter não encontrado
- [ ] Latência p95 < 2s

#### Dia 5-7: Monitoramento e Ajustes

**Métricas para Monitorar:**

| Métrica | Target | Ação se Falhar |
|---------|--------|----------------|
| Taxa de Sucesso | > 80% | Investigar modelos falhando |
| Latência p95 | < 2s | Otimizar adapters |
| Taxa de Erro | < 5% | Rollback se > 10% |
| Uso de CPU | < 70% | Escalar recursos |
| Uso de Memória | < 80% | Investigar memory leaks |

**Comandos de Monitoramento:**
```bash
# Dashboard Grafana
open https://staging-grafana.myia.com/d/myia-errors/myia-errors

# Logs em tempo real
cd observability
./logs.sh --env staging --follow

# Métricas de performance
curl https://staging.myia.com/api/metrics
```

**Decisão ao Final da Semana:**
- ✅ **Prosseguir para Canary** se taxa de sucesso > 80%
- ⚠️ **Estender Staging** se taxa entre 70-80%
- ❌ **Rollback** se taxa < 70%

---

### Fase 2: Produção Canary (1 semana)

**Objetivo:** Deploy gradual para minimizar riscos

#### Dia 1: Canary 10%

```bash
# 1. Configurar canary
cd backend
echo "CANARY_PERCENTAGE=10" >> .env.production

# 2. Deploy canary
./deploy-canary.sh --percentage 10

# 3. Monitorar
watch -n 60 'curl https://api.myia.com/metrics | jq .canary'
```

**Checklist:**
- [ ] 10% do tráfego usando novos adapters
- [ ] 90% do tráfego usando adapters legados
- [ ] Taxa de erro canary < 5%
- [ ] Latência canary similar ao baseline

#### Dia 2-3: Canary 25%

```bash
# Aumentar para 25%
./deploy-canary.sh --percentage 25
```

**Critérios para Avançar:**
- Taxa de erro < 5%
- Latência p95 < 2s
- Sem reclamações de usuários
- Logs sem erros críticos

#### Dia 4-5: Canary 50%

```bash
# Aumentar para 50%
./deploy-canary.sh --percentage 50
```

**Monitoramento Intensivo:**
```bash
# A/B Testing
curl https://api.myia.com/metrics/ab-test

# Comparar canary vs baseline
curl https://api.myia.com/metrics/compare
```

#### Dia 6-7: Canary 75%

```bash
# Aumentar para 75%
./deploy-canary.sh --percentage 75
```

**Decisão ao Final da Semana:**
- ✅ **Prosseguir para 100%** se métricas estáveis
- ⚠️ **Manter 75%** se houver pequenos problemas
- ❌ **Rollback** se taxa de erro > 5%

---

### Fase 3: Produção Completa (1 semana)

**Objetivo:** Deploy completo e monitoramento pós-produção

#### Dia 1: Deploy 100%

```bash
# 1. Deploy completo
./deploy-canary.sh --percentage 100

# 2. Validar
curl https://api.myia.com/health
curl https://api.myia.com/metrics

# 3. Anunciar
./announce-deployment.sh --version 2.0.0
```

**Checklist:**
- [ ] 100% do tráfego usando novos adapters
- [ ] Health check respondendo
- [ ] Métricas estáveis
- [ ] Sem alertas críticos

#### Dia 2-7: Monitoramento Pós-Produção

**Monitoramento Diário:**
```bash
# Relatório diário
./generate-daily-report.sh

# Alertas
./check-alerts.sh

# Feedback de usuários
./check-user-feedback.sh
```

**Métricas de Sucesso:**

| Métrica | Target | Status |
|---------|--------|--------|
| Taxa de Sucesso | > 85% | [ ] |
| Latência p95 | < 2s | [ ] |
| Taxa de Erro | < 3% | [ ] |
| Uptime | > 99.9% | [ ] |
| Satisfação Usuários | > 4.5/5 | [ ] |

#### Documentar Lições Aprendidas

```markdown
# Lições Aprendidas - Deploy v2.0.0

## O Que Funcionou Bem
- [ ] Item 1
- [ ] Item 2

## O Que Pode Melhorar
- [ ] Item 1
- [ ] Item 2

## Ações para Próximos Deploys
- [ ] Ação 1
- [ ] Ação 2
```

---

## 📊 Métricas de Sucesso

### Obrigatórias (Mínimo Aceitável)

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Taxa de Sucesso** | > 80% | `check-certifications.ts` |
| **Latência p95** | < 2s | Grafana Dashboard |
| **Taxa de Erro** | < 5% | Logs + Grafana |
| **Cobertura de Testes** | > 90% | `npm test -- --coverage` |

### Desejáveis (Excelência)

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Taxa de Sucesso** | > 90% | `check-certifications.ts` |
| **Latência p95** | < 1.5s | Grafana Dashboard |
| **Taxa de Erro** | < 2% | Logs + Grafana |
| **Rating Médio** | > 4.0 | `check-certifications.ts` |
| **Uptime** | > 99.9% | Monitoramento externo |

### Como Calcular

#### Taxa de Sucesso
```bash
cd backend
npx ts-node scripts/check-certifications.ts | grep "Success Rate"
# Exemplo: Success Rate: 85% (17/20 models)
```

#### Latência p95
```bash
# Grafana Query
rate(http_request_duration_seconds_bucket{le="2"}[5m])
```

#### Taxa de Erro
```bash
# Grafana Query
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

---

## 🔍 Monitoramento

### Logs Críticos

**Logs de Sucesso:**
```
[info] Using adapter: anthropic/INFERENCE_PROFILE
[info] Adapter type: AnthropicProfileAdapter
[info] Model requires Inference Profile, using only: us.anthropic.claude-sonnet-4-5-20250929-v1:0
[info] Testing 1 variations for: anthropic.claude-sonnet-4-5-20250929-v1:0
```

**Logs de Erro:**
```
[error] Adapter not found for model: anthropic.claude-unknown-v1:0
[error] Model not supported by adapter: AnthropicProfileAdapter
[error] ThrottlingException: Too many requests
[error] ValidationException: Invalid request format
```

### Métricas Grafana

**Dashboard Principal:** http://localhost:3002/d/myia-errors/myia-errors

**Queries Úteis:**

1. **Erros PROVISIONING_REQUIRED (deve reduzir):**
   ```
   {job="backend"} |= "PROVISIONING_REQUIRED"
   ```

2. **Seleção de Adapters:**
   ```
   {job="backend"} |= "Using adapter"
   ```

3. **Taxa de Sucesso:**
   ```
   sum(rate(certification_success_total[5m])) / sum(rate(certification_total[5m]))
   ```

4. **Latência de Requisições:**
   ```
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

### Alertas Recomendados

#### Críticos (PagerDuty)

```yaml
# alerts/critical.yml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Taxa de erro > 10% por 5 minutos"
    
- alert: AdapterNotFound
  expr: rate(adapter_not_found_total[5m]) > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Adapter não encontrado > 10/hora"
```

#### Warnings (Slack)

```yaml
# alerts/warning.yml
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 3
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Latência p95 > 3s por 10 minutos"
    
- alert: LowSuccessRate
  expr: rate(certification_success_total[1h]) / rate(certification_total[1h]) < 0.80
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Taxa de sucesso < 80% na última hora"
```

---

## 🔄 Rollback Plan

### Quando Fazer Rollback

**Rollback Imediato (< 5 minutos):**
- Taxa de erro > 10%
- Latência p95 > 5s
- Modelos críticos falhando (Claude 4.x, Nova)
- Bugs críticos descobertos
- Perda de dados

**Rollback Planejado (< 30 minutos):**
- Taxa de erro entre 5-10%
- Latência p95 entre 3-5s
- Taxa de sucesso < 70%
- Feedback negativo de usuários

### Como Fazer Rollback

#### Rollback Rápido (Feature Flag)

```bash
# 1. Desabilitar feature flag
cd backend
sed -i 's/USE_NEW_ADAPTERS=true/USE_NEW_ADAPTERS=false/' .env

# 2. Reiniciar servidor
cd ..
./start.sh restart backend

# 3. Validar
curl http://localhost:3001/health

# 4. Verificar logs
cd observability
./logs.sh | grep "Using adapter"
# Deve mostrar adapters legados
```

**Tempo estimado:** 2-3 minutos

#### Rollback Completo (Git)

```bash
# 1. Reverter para versão anterior
git revert HEAD
git push origin main

# 2. Deploy
./deploy.sh

# 3. Validar
curl https://api.myia.com/health
```

**Tempo estimado:** 10-15 minutos

#### Rollback de Banco de Dados (se necessário)

```bash
# 1. Backup atual
pg_dump myia > backup_before_rollback.sql

# 2. Restaurar backup anterior
psql myia < backup_before_migration.sql

# 3. Validar
psql myia -c "SELECT COUNT(*) FROM certifications;"
```

**Tempo estimado:** 5-10 minutos

### Validar Rollback

```bash
# 1. Health check
curl http://localhost:3001/health
# Esperado: {"status":"ok"}

# 2. Testar modelo
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic.claude-3-haiku-20240307-v1:0","message":"test"}'

# 3. Verificar logs
cd observability
./logs.sh | tail -n 50
# Não deve ter erros críticos

# 4. Verificar métricas
curl http://localhost:3001/api/metrics
# Taxa de erro deve normalizar
```

### Comunicação de Rollback

**Template de Comunicação:**

```markdown
# Rollback - Nova Arquitetura de Adapters v2.0.0

**Data:** [DATA]
**Horário:** [HORÁRIO]
**Duração:** [DURAÇÃO]

## Motivo
[Descrever motivo do rollback]

## Impacto
- Usuários afetados: [NÚMERO]
- Serviços afetados: [LISTA]
- Tempo de indisponibilidade: [DURAÇÃO]

## Ações Tomadas
1. [Ação 1]
2. [Ação 2]

## Status Atual
- [ ] Rollback completo
- [ ] Serviços normalizados
- [ ] Usuários notificados

## Próximos Passos
1. [Passo 1]
2. [Passo 2]
```

---

## 📚 Próximos Passos (Pós-Produção)

### Sprint 5: Remoção de Código Legado (Futuro)

**IMPORTANTE:** Só executar após 1 mês em produção sem problemas.

#### Tarefas

- [ ] **Remover adapters antigos**
  - `backend/src/services/ai/adapters/anthropic.adapter.ts`
  - `backend/src/services/ai/adapters/amazon.adapter.ts`
  - `backend/src/services/ai/adapters/cohere.adapter.ts`

- [ ] **Remover método `createLegacyAdapter()`**
  - `backend/src/services/ai/adapters/adapter-factory.ts`

- [ ] **Remover feature flag `USE_NEW_ADAPTERS`**
  - `backend/.env.example`
  - `backend/src/services/ai/adapters/adapter-factory.ts`

- [ ] **Atualizar testes**
  - Remover testes de adapters legados
  - Atualizar testes de integração

- [ ] **Atualizar documentação**
  - Remover referências a adapters legados
  - Atualizar diagramas de arquitetura

#### Critérios para Remoção

- ✅ 1 mês em produção sem rollback
- ✅ Taxa de sucesso > 85%
- ✅ Taxa de erro < 3%
- ✅ Feedback positivo dos usuários
- ✅ Sem bugs críticos reportados

### Melhorias Futuras

#### Curto Prazo (1-3 meses)

- [ ] **Implementar adapters PROVISIONED**
  - Suporte a throughput provisionado
  - Otimização de custos

- [ ] **Adicionar suporte a CROSS_REGION**
  - Inference profiles cross-region
  - Fallback automático entre regiões

- [ ] **Implementar cache de adapters**
  - Singleton pattern
  - Reduzir uso de memória

#### Médio Prazo (3-6 meses)

- [ ] **Adicionar métricas de performance por adapter**
  - Latência por adapter
  - Taxa de sucesso por adapter
  - Uso de recursos por adapter

- [ ] **Criar dashboard específico para adapters**
  - Visualização de seleção de adapters
  - Comparação de performance
  - Alertas específicos

- [ ] **Implementar auto-scaling de adapters**
  - Criar mais instâncias sob carga
  - Destruir instâncias ociosas

#### Longo Prazo (6-12 meses)

- [ ] **Suporte a novos vendors**
  - Google Vertex AI
  - Azure OpenAI
  - Hugging Face

- [ ] **Implementar adapter plugins**
  - Carregar adapters dinamicamente
  - Marketplace de adapters

- [ ] **Machine Learning para seleção de adapters**
  - Aprender padrões de uso
  - Otimizar seleção automaticamente

---

## 🎯 Critérios de Sucesso Final

### Técnicos

- ✅ **Sistema em produção por 1 mês sem rollback**
- ✅ **Taxa de sucesso > 85%**
- ✅ **Latência p95 < 2s**
- ✅ **Taxa de erro < 3%**
- ✅ **Cobertura de testes > 90%**
- ✅ **Sem bugs críticos**

### Negócio

- ✅ **Feedback positivo dos usuários** (> 4.5/5)
- ✅ **Redução de custos** (menos requisições desnecessárias)
- ✅ **Tempo de adição de novos modelos** (< 1 hora)
- ✅ **Satisfação dos desenvolvedores** (> 4.5/5)

### Operacionais

- ✅ **Documentação completa e atualizada**
- ✅ **Equipe treinada**
- ✅ **Runbooks criados**
- ✅ **Alertas configurados**
- ✅ **Monitoramento funcionando**

### Pós-Produção

- ✅ **Código legado removido** (Sprint 5)
- ✅ **Feature flag removida**
- ✅ **Lições aprendidas documentadas**
- ✅ **Post-mortem realizado**

---

## 📞 Contatos de Emergência

### Equipe de Desenvolvimento

- **Tech Lead:** [Nome] - [Email] - [Telefone]
- **Backend Lead:** [Nome] - [Email] - [Telefone]
- **DevOps Lead:** [Nome] - [Email] - [Telefone]

### Escalação

1. **Nível 1:** Desenvolvedor on-call
2. **Nível 2:** Tech Lead
3. **Nível 3:** CTO

### Canais de Comunicação

- **Slack:** #myia-incidents
- **PagerDuty:** myia-production
- **Email:** incidents@myia.com

---

## 📝 Templates

### Template de Incident Report

```markdown
# Incident Report - [TÍTULO]

**Data:** [DATA]
**Severidade:** [CRÍTICO/ALTO/MÉDIO/BAIXO]
**Status:** [ABERTO/RESOLVIDO]

## Resumo
[Descrição breve do incidente]

## Timeline
- [HH:MM] Incidente detectado
- [HH:MM] Equipe notificada
- [HH:MM] Investigação iniciada
- [HH:MM] Causa raiz identificada
- [HH:MM] Fix aplicado
- [HH:MM] Incidente resolvido

## Causa Raiz
[Descrição detalhada da causa]

## Impacto
- Usuários afetados: [NÚMERO]
- Duração: [DURAÇÃO]
- Perda de receita: [VALOR]

## Resolução
[Descrição da solução aplicada]

## Ações Preventivas
1. [Ação 1]
2. [Ação 2]

## Lições Aprendidas
- [Lição 1]
- [Lição 2]
```

### Template de Post-Mortem

```markdown
# Post-Mortem - Deploy v2.0.0

**Data do Deploy:** [DATA]
**Data do Post-Mortem:** [DATA]
**Participantes:** [LISTA]

## Resumo Executivo
[Resumo do deploy e resultados]

## O Que Funcionou Bem
1. [Item 1]
2. [Item 2]

## O Que Pode Melhorar
1. [Item 1]
2. [Item 2]

## Métricas Finais
- Taxa de Sucesso: [VALOR]
- Latência p95: [VALOR]
- Taxa de Erro: [VALOR]
- Uptime: [VALOR]

## Ações para Próximos Deploys
1. [Ação 1]
2. [Ação 2]

## Conclusão
[Conclusão final]
```

---

**Última atualização:** 2026-01-30  
**Versão:** 2.0.0  
**Autor:** Equipe MyIA
