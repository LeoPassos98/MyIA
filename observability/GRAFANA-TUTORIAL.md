# 📊 Guia Completo do Grafana - MyIA

[![Grafana](https://img.shields.io/badge/Grafana-10.2.3-orange?logo=grafana)](http://localhost:3002)
[![Loki](https://img.shields.io/badge/Loki-2.9.3-blue?logo=loki)](http://localhost:3100)
[![Status](https://img.shields.io/badge/Status-Active-success)]()

> **Tutorial visual e prático para dominar o Grafana e explorar seus logs**

---

## 📑 Índice

1. [🚀 Primeiro Acesso](#-primeiro-acesso)
2. [📈 Usando os Dashboards](#-usando-os-dashboards)
3. [🔍 Explore - Queries Customizadas](#-explore---queries-customizadas)
4. [⚡ Dicas Avançadas](#-dicas-avançadas)

---

## 🚀 Primeiro Acesso

### 1.1 Como Fazer Login

1. **Acesse o Grafana:**
   ```
   http://localhost:3002
   ```

2. **Credenciais de Login:**
   ```
   Usuário: admin
   Senha: admin
   ```

3. **Tela de Login:**
   ```
   ┌─────────────────────────────────────┐
   │         🔷 Grafana                  │
   │                                     │
   │  Email or username                  │
   │  ┌───────────────────────────────┐ │
   │  │ admin                         │ │
   │  └───────────────────────────────┘ │
   │                                     │
   │  Password                           │
   │  ┌───────────────────────────────┐ │
   │  │ ••••••                        │ │
   │  └───────────────────────────────┘ │
   │                                     │
   │  [ Log in ]                         │
   └─────────────────────────────────────┘
   ```

4. **Primeira vez?** O Grafana pode pedir para trocar a senha - você pode pular clicando em "Skip"

---

### 1.2 Navegação Básica da Interface

Após o login, você verá a interface principal:

```
┌────────────────────────────────────────────────────────────────┐
│ ☰ Menu  |  🏠 Home  |  🔍 Explore  |  📊 Dashboards  |  ⚙️      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 Welcome to Grafana                                         │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 📈 Overview  │  │ ❌ Errors    │  │ ⚡ Performance│       │
│  │              │  │              │  │              │       │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Elementos Principais:**

- **☰ Menu Lateral:** Acesso rápido a todas as funcionalidades
- **🔍 Explore:** Ferramenta para criar queries customizadas
- **📊 Dashboards:** Lista de dashboards disponíveis
- **⚙️ Configurações:** Ajustes e preferências

---

### 1.3 Onde Encontrar os Dashboards

**Método 1: Menu Lateral**
```
☰ Menu
  ├─ 🏠 Home
  ├─ 📊 Dashboards
  │   ├─ Browse
  │   ├─ Playlists
  │   └─ Snapshots
  ├─ 🔍 Explore
  └─ ⚙️ Configuration
```

**Método 2: Busca Rápida**
- Pressione `Ctrl + K` (ou `Cmd + K` no Mac)
- Digite o nome do dashboard
- Selecione da lista

**Método 3: Home Page**
- Clique em "Home" no topo
- Veja os dashboards recentes e favoritos

---

## 📈 Usando os Dashboards

### 2.1 Os 3 Dashboards do MyIA

O sistema possui 3 dashboards pré-configurados:

#### 📊 **Overview Dashboard**
**Propósito:** Visão geral do sistema

**Painéis Principais:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 MyIA - Overview Dashboard                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📈 Total Logs (Last 24h)        🔢 Logs por Nível     │
│  ┌──────────────────────┐        ┌──────────────────┐  │
│  │                      │        │ INFO:  1,234     │  │
│  │      15,432          │        │ WARN:    156     │  │
│  │                      │        │ ERROR:    23     │  │
│  └──────────────────────┘        └──────────────────┘  │
│                                                         │
│  📉 Logs ao Longo do Tempo                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │     ╱╲    ╱╲                                    │   │
│  │    ╱  ╲  ╱  ╲    ╱╲                            │   │
│  │   ╱    ╲╱    ╲  ╱  ╲                           │   │
│  │  ╱            ╲╱    ╲                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔝 Top 5 Serviços                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. auth-service      ████████████ 45%          │   │
│  │ 2. chat-service      ████████ 30%              │   │
│  │ 3. ai-service        █████ 15%                 │   │
│  │ 4. audit-service     ███ 7%                    │   │
│  │ 5. logs-service      █ 3%                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Como Interpretar:**
- **Total Logs:** Quantidade total de logs no período
- **Logs por Nível:** Distribuição por severidade (INFO, WARN, ERROR)
- **Logs ao Longo do Tempo:** Tendência temporal
- **Top 5 Serviços:** Serviços mais ativos

---

#### ❌ **Errors Dashboard**
**Propósito:** Monitoramento de erros

**Painéis Principais:**
```
┌─────────────────────────────────────────────────────────┐
│ ❌ MyIA - Errors Dashboard                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🚨 Total de Erros       📊 Taxa de Erro              │
│  ┌──────────────────┐   ┌──────────────────┐          │
│  │                  │   │                  │          │
│  │       23         │   │      1.5%        │          │
│  │                  │   │                  │          │
│  └──────────────────┘   └──────────────────┘          │
│                                                         │
│  📉 Erros ao Longo do Tempo                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ╱╲                                             │   │
│  │ ╱  ╲    ╱╲                                      │   │
│  │╱    ╲  ╱  ╲                                     │   │
│  │      ╲╱    ╲                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📋 Últimos Erros                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 10:23:45 | auth-service | Invalid token        │   │
│  │ 10:22:31 | chat-service | Connection timeout   │   │
│  │ 10:20:15 | ai-service   | Model not found     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏷️ Erros por Categoria                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Authentication    ████████ 35%                  │   │
│  │ Network           ██████ 26%                    │   │
│  │ Validation        █████ 22%                     │   │
│  │ Database          ███ 13%                       │   │
│  │ Other             █ 4%                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Como Interpretar:**
- **Total de Erros:** Contagem absoluta de erros
- **Taxa de Erro:** Percentual de logs com erro
- **Erros ao Longo do Tempo:** Identificar picos de erro
- **Últimos Erros:** Lista dos erros mais recentes
- **Erros por Categoria:** Tipos de erro mais comuns

---

#### ⚡ **Performance Dashboard**
**Propósito:** Análise de performance

**Painéis Principais:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚡ MyIA - Performance Dashboard                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⏱️ Latência Média       📊 P95 Latency                │
│  ┌──────────────────┐   ┌──────────────────┐          │
│  │                  │   │                  │          │
│  │     125ms        │   │     450ms        │          │
│  │                  │   │                  │          │
│  └──────────────────┘   └──────────────────┘          │
│                                                         │
│  📈 Latência ao Longo do Tempo                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                    ╱╲                           │   │
│  │      ╱╲          ╱  ╲                          │   │
│  │     ╱  ╲    ╱╲  ╱    ╲                         │   │
│  │────╱────╲──╱──╲╱──────╲────────────────────   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🐌 Requisições Mais Lentas                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ POST /api/chat/stream        1,234ms           │   │
│  │ POST /api/ai/certification   987ms             │   │
│  │ GET  /api/audit/records      654ms             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 Throughput (req/s)                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │        ████  ████  ████  ████                   │   │
│  │      ██████████████████████████                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Como Interpretar:**
- **Latência Média:** Tempo médio de resposta
- **P95 Latency:** 95% das requisições são mais rápidas que este valor
- **Latência ao Longo do Tempo:** Identificar degradação de performance
- **Requisições Mais Lentas:** Endpoints que precisam otimização
- **Throughput:** Requisições processadas por segundo

---

### 2.2 Como Filtrar por Tempo

**Seletor de Tempo (Canto Superior Direito):**

```
┌─────────────────────────────────────────┐
│ 🕐 Last 6 hours  ▼                      │
├─────────────────────────────────────────┤
│ Quick ranges:                           │
│   • Last 5 minutes                      │
│   • Last 15 minutes                     │
│   • Last 30 minutes                     │
│   • Last 1 hour                         │
│   • Last 3 hours                        │
│   • Last 6 hours                        │
│   • Last 12 hours                       │
│   • Last 24 hours                       │
│   • Last 2 days                         │
│   • Last 7 days                         │
│   • Last 30 days                        │
│                                         │
│ Absolute time range:                    │
│   From: [2026-01-26 18:00:00]          │
│   To:   [2026-01-27 00:00:00]          │
│                                         │
│   [ Apply time range ]                  │
└─────────────────────────────────────────┘
```

**Atalhos de Teclado:**
- `t` + `z` = Zoom out (aumentar intervalo)
- `Ctrl + Z` = Zoom in (diminuir intervalo)
- `t` + `←` = Mover para trás no tempo
- `t` + `→` = Mover para frente no tempo

---

### 2.3 Como Fazer Zoom em Gráficos

**Método 1: Clique e Arraste**
```
1. Clique no gráfico
2. Arraste horizontalmente para selecionar período
3. Solte para aplicar zoom

   ┌─────────────────────────────────┐
   │     │◄──────────►│              │
   │    ╱│            │╲             │
   │   ╱ │  ZOOM      │ ╲            │
   │  ╱  │  AREA      │  ╲           │
   └─────────────────────────────────┘
```

**Método 2: Duplo Clique**
- Duplo clique no gráfico = Reset zoom

**Método 3: Botões do Painel**
- 🔍 Zoom in
- 🔍 Zoom out
- ↻ Reset

---

### 2.4 Recursos Adicionais dos Dashboards

#### 🔄 Auto-Refresh
```
Canto superior direito: 🔄 Off ▼
  • Off
  • 5s
  • 10s
  • 30s
  • 1m
  • 5m
  • 15m
  • 30m
  • 1h
```

#### 📤 Compartilhar Dashboard
```
Botão "Share" no topo:
  • Link
  • Snapshot
  • Export
  • Embed
```

#### ⭐ Favoritar Dashboard
```
Clique na ⭐ ao lado do nome do dashboard
```

---

## 🔍 Explore - Queries Customizadas

### 3.1 Como Acessar o Explore

**Método 1: Menu Lateral**
```
☰ Menu → 🔍 Explore
```

**Método 2: Atalho**
```
Pressione: Ctrl + E (ou Cmd + E no Mac)
```

**Método 3: Do Dashboard**
```
Clique em qualquer painel → "Explore"
```

---

### 3.2 Interface do Explore

```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 Explore                                    🕐 Last 1 hour ▼│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Data source: Loki ▼                                          │
│                                                              │
│ Query editor:                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ {service="auth-service"} |= "error"                      ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [ Run query ]  [ Add query ]  [ Inspector ]                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Results:                                                     │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 2026-01-27 00:05:23 | auth-service | ERROR | Invalid... ││
│ │ 2026-01-27 00:04:15 | auth-service | ERROR | Token...   ││
│ │ 2026-01-27 00:03:42 | auth-service | ERROR | Auth...    ││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

### 3.3 Sintaxe Básica do LogQL

LogQL é a linguagem de query do Loki. Estrutura básica:

```logql
{label_selector} |= "text_filter" | parser | aggregation
```

**Componentes:**

1. **Label Selector** `{...}` - Filtra por labels
2. **Line Filter** `|=` ou `!=` - Filtra por texto
3. **Parser** `| json` ou `| logfmt` - Extrai campos
4. **Aggregation** `| count` ou `| rate` - Agrega dados

---

### 3.4 10+ Exemplos Práticos de Queries

#### 📝 **Exemplo 1: Buscar Logs por Nível**

**Query INFO:**
```logql
{job="myia"} |= "INFO"
```

**Query WARN:**
```logql
{job="myia"} |= "WARN"
```

**Query ERROR:**
```logql
{job="myia"} |= "ERROR"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | INFO  | User logged in successfully
2026-01-27 00:04:15 | INFO  | Request processed
2026-01-27 00:03:42 | INFO  | Database connection established
```

---

#### 🔧 **Exemplo 2: Buscar Logs por Serviço**

**Query Auth Service:**
```logql
{job="myia"} | json | service="auth-service"
```

**Query Chat Service:**
```logql
{job="myia"} | json | service="chat-service"
```

**Query AI Service:**
```logql
{job="myia"} | json | service="ai-service"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | auth-service | User authentication started
2026-01-27 00:04:15 | auth-service | Token validated successfully
2026-01-27 00:03:42 | auth-service | Session created
```

---

#### 👤 **Exemplo 3: Buscar Logs por Usuário**

**Query por User ID:**
```logql
{job="myia"} | json | userId="123"
```

**Query por Email:**
```logql
{job="myia"} |= "user@example.com"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | userId: 123 | User logged in
2026-01-27 00:04:15 | userId: 123 | Chat message sent
2026-01-27 00:03:42 | userId: 123 | Settings updated
```

---

#### 🔗 **Exemplo 4: Buscar Logs por Request ID**

**Query por Request ID específico:**
```logql
{job="myia"} | json | requestId="req-abc-123"
```

**Rastrear toda a jornada de uma requisição:**
```logql
{job="myia"} |= "req-abc-123"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | requestId: req-abc-123 | Request received
2026-01-27 00:05:24 | requestId: req-abc-123 | Auth validated
2026-01-27 00:05:25 | requestId: req-abc-123 | Processing...
2026-01-27 00:05:26 | requestId: req-abc-123 | Response sent
```

---

#### 🔎 **Exemplo 5: Buscar Logs com Texto Específico**

**Query por palavra-chave:**
```logql
{job="myia"} |= "authentication"
```

**Query por frase exata:**
```logql
{job="myia"} |= "Invalid credentials"
```

**Query excluindo texto:**
```logql
{job="myia"} != "health check"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | Authentication process started
2026-01-27 00:04:15 | Authentication successful
2026-01-27 00:03:42 | Authentication failed - Invalid credentials
```

---

#### ⏰ **Exemplo 6: Filtrar por Intervalo de Tempo**

**Últimos 5 minutos:**
```logql
{job="myia"} [5m]
```

**Última hora:**
```logql
{job="myia"} [1h]
```

**Último dia:**
```logql
{job="myia"} [24h]
```

**Dica:** Combine com o seletor de tempo no topo!

---

#### 📊 **Exemplo 7: Contar Logs por Categoria**

**Contar erros:**
```logql
sum(count_over_time({job="myia"} |= "ERROR" [5m]))
```

**Contar por serviço:**
```logql
sum by (service) (count_over_time({job="myia"} | json [5m]))
```

**Contar por nível:**
```logql
sum by (level) (count_over_time({job="myia"} | json [5m]))
```

**Resultado Esperado:**
```
ERROR: 23
WARN: 156
INFO: 1,234
```

---

#### ⚡ **Exemplo 8: Calcular Latência Média**

**Latência média geral:**
```logql
avg(avg_over_time({job="myia"} | json | unwrap duration [5m]))
```

**Latência média por endpoint:**
```logql
avg by (path) (avg_over_time({job="myia"} | json | unwrap duration [5m]))
```

**Latência P95:**
```logql
quantile_over_time(0.95, {job="myia"} | json | unwrap duration [5m])
```

**Resultado Esperado:**
```
Average: 125ms
P95: 450ms
P99: 890ms
```

---

#### 🚨 **Exemplo 9: Encontrar Erros Específicos**

**Erros de autenticação:**
```logql
{job="myia"} |= "ERROR" |= "authentication"
```

**Erros de banco de dados:**
```logql
{job="myia"} |= "ERROR" |= "database"
```

**Erros de timeout:**
```logql
{job="myia"} |= "ERROR" |= "timeout"
```

**Erros 500:**
```logql
{job="myia"} | json | statusCode="500"
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | ERROR | Authentication failed: Invalid token
2026-01-27 00:04:15 | ERROR | Authentication timeout
2026-01-27 00:03:42 | ERROR | Authentication service unavailable
```

---

#### 🎯 **Exemplo 10: Combinar Múltiplos Filtros**

**Erros do auth-service nas últimas 24h:**
```logql
{job="myia"} | json | service="auth-service" | level="error" [24h]
```

**Logs de um usuário específico com erros:**
```logql
{job="myia"} | json | userId="123" | level="error"
```

**Requisições lentas (> 1s) com erro:**
```logql
{job="myia"} | json | duration > 1000 | statusCode >= 400
```

**Resultado Esperado:**
```
2026-01-27 00:05:23 | auth-service | ERROR | userId: 123 | duration: 1234ms
2026-01-27 00:04:15 | auth-service | ERROR | userId: 123 | statusCode: 500
```

---

#### 📈 **Exemplo 11: Taxa de Erros**

**Taxa de erro por minuto:**
```logql
rate({job="myia"} |= "ERROR" [1m])
```

**Taxa de erro por serviço:**
```logql
sum by (service) (rate({job="myia"} | json | level="error" [5m]))
```

**Resultado Esperado:**
```
auth-service: 0.5 errors/s
chat-service: 0.2 errors/s
ai-service: 0.1 errors/s
```

---

#### 🔥 **Exemplo 12: Top N Queries**

**Top 5 endpoints mais chamados:**
```logql
topk(5, sum by (path) (count_over_time({job="myia"} | json [1h])))
```

**Top 5 usuários mais ativos:**
```logql
topk(5, sum by (userId) (count_over_time({job="myia"} | json [1h])))
```

**Top 5 erros mais comuns:**
```logql
topk(5, sum by (message) (count_over_time({job="myia"} |= "ERROR" [1h])))
```

**Resultado Esperado:**
```
1. POST /api/chat/stream - 1,234 requests
2. GET /api/auth/me - 987 requests
3. POST /api/ai/certification - 654 requests
4. GET /api/audit/records - 432 requests
5. POST /api/chat/message - 321 requests
```

---

### 3.5 Dicas de Query

#### ✅ **Boas Práticas:**

1. **Sempre use label selectors primeiro:**
   ```logql
   ✅ {job="myia"} |= "ERROR"
   ❌ |= "ERROR"
   ```

2. **Seja específico nos filtros:**
   ```logql
   ✅ {job="myia"} | json | service="auth-service" | level="error"
   ❌ {job="myia"} |= "auth"
   ```

3. **Use intervalos de tempo apropriados:**
   ```logql
   ✅ [5m] para métricas em tempo real
   ✅ [1h] para análises recentes
   ✅ [24h] para tendências diárias
   ```

4. **Combine filtros para precisão:**
   ```logql
   {job="myia"} | json 
   | service="auth-service" 
   | level="error" 
   | statusCode >= 500
   ```

---

#### 🚀 **Otimização de Performance:**

1. **Limite o intervalo de tempo**
2. **Use labels em vez de text search quando possível**
3. **Evite regex complexos**
4. **Use agregações para grandes volumes**

---

## ⚡ Dicas Avançadas

### 4.1 Como Salvar Queries Favoritas

**Método 1: Adicionar ao Dashboard**
```
1. No Explore, crie sua query
2. Clique em "Add to dashboard"
3. Escolha o dashboard ou crie um novo
4. Configure o painel
5. Salve
```

**Método 2: Criar Dashboard Personalizado**
```
1. Menu → Dashboards → New Dashboard
2. Add visualization
3. Configure sua query
4. Salve o dashboard
```

**Método 3: Usar Biblioteca de Queries**
```
1. No Explore, clique em "Query history"
2. Encontre queries anteriores
3. Clique para reutilizar
```

---

### 4.2 Como Criar Alertas

**Passo a Passo:**

```
1. Menu → Alerting → Alert rules
2. Clique em "New alert rule"
3. Configure:
   ┌─────────────────────────────────────┐
   │ Rule name: High Error Rate          │
   │                                     │
   │ Query:                              │
   │ rate({job="myia"} |= "ERROR" [5m])  │
   │                                     │
   │ Condition:                          │
   │ WHEN avg() IS ABOVE 10              │
   │                                     │
   │ For: 5m                             │
   │                                     │
   │ Notification:                       │
   │ [x] Email                           │
   │ [x] Slack                           │
   └─────────────────────────────────────┘
4. Salve o alerta
```

**Exemplos de Alertas Úteis:**

1. **Taxa de Erro Alta:**
   ```logql
   rate({job="myia"} |= "ERROR" [5m]) > 10
   ```

2. **Latência Alta:**
   ```logql
   avg_over_time({job="myia"} | json | unwrap duration [5m]) > 1000
   ```

3. **Serviço Inativo:**
   ```logql
   count_over_time({job="myia"} | json | service="auth-service" [5m]) == 0
   ```

---

### 4.3 Como Exportar Dados

**Método 1: CSV Export**
```
1. Execute sua query no Explore
2. Clique em "Inspector" (ícone 🔍)
3. Vá para a aba "Data"
4. Clique em "Download CSV"
```

**Método 2: JSON Export**
```
1. No dashboard, clique no título do painel
2. Clique em "Inspect" → "Data"
3. Clique em "Download for Excel" ou "Download as JSON"
```

**Método 3: API Export**
```bash
# Exportar logs via API do Loki
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="myia"}' \
  --data-urlencode 'start=1706313600000000000' \
  --data-urlencode 'end=1706400000000000000' \
  | jq '.data.result'
```

---

### 4.4 Atalhos de Teclado

**Navegação:**
```
Ctrl + K (Cmd + K)    - Busca rápida
Ctrl + E (Cmd + E)    - Abrir Explore
Esc                   - Fechar modais
?                     - Mostrar todos os atalhos
```

**Explore:**
```
Ctrl + Enter          - Executar query
Ctrl + Space          - Autocompletar
Ctrl + /              - Comentar linha
Tab                   - Indentar
Shift + Tab           - Desindentar
```

**Dashboards:**
```
d + k                 - Abrir atalhos de teclado
t + z                 - Zoom out
t + ←                 - Voltar no tempo
t + →                 - Avançar no tempo
f                     - Abrir busca de dashboard
h                     - Mostrar/ocultar ajuda
```

**Time Range:**
```
t + r                 - Refresh
t + a                 - Absolute time range
t + s                 - Relative time range
```

---

### 4.5 Plugins Úteis

**Plugins Recomendados:**

1. **JSON API Plugin**
   - Consultar APIs externas
   - Combinar dados de múltiplas fontes

2. **Pie Chart Plugin**
   - Visualizações de distribuição
   - Análise de proporções

3. **Worldmap Panel**
   - Visualização geográfica
   - Logs por região

**Como Instalar:**
```bash
# Via CLI (no container do Grafana)
grafana-cli plugins install <plugin-name>

# Via Environment Variable (docker-compose.yml)
GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
```

---

### 4.6 Troubleshooting

#### ❌ **Problema: "No data" nos dashboards**

**Soluções:**
```
1. Verifique se o Loki está rodando:
   curl http://localhost:3100/ready

2. Verifique se há logs:
   curl http://localhost:3100/loki/api/v1/label/__name__/values

3. Verifique o datasource:
   Menu → Configuration → Data sources → Loki → Test

4. Verifique o intervalo de tempo (pode não haver logs no período)
```

---

#### ⚠️ **Problema: Queries muito lentas**

**Soluções:**
```
1. Reduza o intervalo de tempo
2. Use label selectors mais específicos
3. Evite regex complexos
4. Use agregações em vez de logs brutos
5. Aumente o cache do Loki
```

---

#### 🔒 **Problema: Não consigo fazer login**

**Soluções:**
```
1. Credenciais padrão:
   Usuário: admin
   Senha: admin

2. Reset de senha (via container):
   docker exec -it myia-grafana grafana-cli admin reset-admin-password newpassword

3. Verifique logs do Grafana:
   docker logs myia-grafana
```

---

#### 📊 **Problema: Dashboard não carrega**

**Soluções:**
```
1. Verifique se o datasource está configurado
2. Limpe o cache do navegador
3. Verifique permissões do dashboard
4. Reimporte o dashboard:
   Menu → Dashboards → Import → Upload JSON
```

---

### 4.7 Recursos Adicionais

#### 📚 **Documentação Oficial:**

- **Grafana:** https://grafana.com/docs/grafana/latest/
- **Loki:** https://grafana.com/docs/loki/latest/
- **LogQL:** https://grafana.com/docs/loki/latest/logql/

#### 🎓 **Tutoriais e Guias:**

- **LogQL Tutorial:** https://grafana.com/docs/loki/latest/logql/
- **Dashboard Best Practices:** https://grafana.com/docs/grafana/latest/best-practices/
- **Alerting Guide:** https://grafana.com/docs/grafana/latest/alerting/

#### 💬 **Comunidade:**

- **Grafana Community:** https://community.grafana.com/
- **GitHub Issues:** https://github.com/grafana/grafana/issues
- **Slack:** https://grafana.slack.com/

---

## 📝 Resumo das Queries Mais Úteis

### 🏆 **Top 5 Queries Essenciais:**

#### 1️⃣ **Monitorar Erros em Tempo Real**
```logql
{job="myia"} | json | level="error"
```
**Uso:** Identificar problemas imediatamente

---

#### 2️⃣ **Rastrear Requisição Completa**
```logql
{job="myia"} |= "req-abc-123"
```
**Uso:** Debug de problemas específicos

---

#### 3️⃣ **Analisar Performance por Endpoint**
```logql
avg by (path) (avg_over_time({job="myia"} | json | unwrap duration [5m]))
```
**Uso:** Identificar endpoints lentos

---

#### 4️⃣ **Contar Erros por Serviço**
```logql
sum by (service) (count_over_time({job="myia"} | json | level="error" [1h]))
```
**Uso:** Identificar serviços problemáticos

---

#### 5️⃣ **Top Endpoints Mais Chamados**
```logql
topk(10, sum by (path) (count_over_time({job="myia"} | json [1h])))
```
**Uso:** Entender padrões de uso

---

## 🎯 Próximos Passos

Agora que você domina o Grafana, experimente:

1. ✅ **Criar seu próprio dashboard personalizado**
2. ✅ **Configurar alertas para erros críticos**
3. ✅ **Explorar queries avançadas com agregações**
4. ✅ **Integrar com outras ferramentas de monitoramento**
5. ✅ **Compartilhar dashboards com a equipe**

---

## 🆘 Precisa de Ajuda?

**Acesso Rápido:**
- 🌐 Grafana: http://localhost:3002
- 📊 Loki API: http://localhost:3100
- 📁 Dashboards: [`observability/grafana/dashboards/`](observability/grafana/dashboards/)
- ⚙️ Configuração: [`observability/docker-compose.yml`](observability/docker-compose.yml)

**Comandos Úteis:**
```bash
# Verificar status dos serviços
./start.sh status

# Reiniciar Grafana
./start.sh restart

# Ver logs do Grafana
docker logs -f myia-grafana

# Ver logs do Loki
docker logs -f myia-loki
```

---

<div align="center">

**🎉 Parabéns! Você agora é um expert em Grafana! 🎉**

*Criado com ❤️ para o projeto MyIA*

</div>