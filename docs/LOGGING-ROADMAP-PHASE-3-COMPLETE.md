# Roadmap - Fase 3 Completa: Observabilidade Avançada

> **Complemento de:** [LOGGING-ROADMAP-PHASES-2-3.md](./LOGGING-ROADMAP-PHASES-2-3.md)  
> **Versão:** 1.0  
> **Data:** 2026-01-26

---

## Continuação da Tarefa 3.3: Dashboards Grafana

### Dashboard 2: Latência (continuação)

```json
// docker/grafana/dashboards/latency-dashboard.json
{
  "dashboard": {
    "title": "MyIA - Latência",
    "panels": [
      {
        "title": "Latência P50/P95/P99",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "title": "Latência por Endpoint",
        "targets": [
          {
            "expr": "avg by (endpoint) (rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))"
          }
        ]
      },
      {
        "title": "Latência por Provider/Model",
        "targets": [
          {
            "expr": "avg by (provider, model) (rate(inference_duration_seconds_sum[5m]) / rate(inference_duration_seconds_count[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Dashboard 3: Uso

```json
// docker/grafana/dashboards/usage-dashboard.json
{
  "dashboard": {
    "title": "MyIA - Uso",
    "panels": [
      {
        "title": "Requisições por Minuto",
        "targets": [
          {
            "expr": "sum(rate({app=\"myia-backend\"}[1m])) * 60"
          }
        ]
      },
      {
        "title": "Usuários Ativos",
        "targets": [
          {
            "expr": "count(count by (userId) (count_over_time({app=\"myia-backend\",userId!=\"\"}[5m])))"
          }
        ]
      },
      {
        "title": "Uso por Provider",
        "targets": [
          {
            "expr": "sum by (provider) (count_over_time({app=\"myia-backend\",provider!=\"\"}[1h]))"
          }
        ]
      },
      {
        "title": "Custos Estimados",
        "targets": [
          {
            "expr": "sum(inference_cost_total)"
          }
        ]
      }
    ]
  }
}
```

#### Checkpoint 3.3: Dashboards Criados

**Critérios de Sucesso:**

- [ ] 3 dashboards criados
- [ ] Queries LogQL funcionando
- [ ] Gráficos atualizando em tempo real
- [ ] Visualizações claras e úteis

**Teste de Validação:**

```bash
# 1. Acessar Grafana
# http://localhost:3002

# 2. Verificar dashboards:
# - MyIA - Erros
# - MyIA - Latência
# - MyIA - Uso

# 3. Verificar dados aparecem
# 4. Verificar atualização automática
```

**Se Falhar:**
- **Causa Provável:** Queries LogQL incorretas
- **Ação:** Revisar queries
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 3.4

---

### Tarefa 3.4: Configurar Alertas

**Modo Primário:** Code  
**Modo Secundário:** Architect

#### Descrição

Configurar alertas para erros críticos e alta latência.

#### Arquivos a Criar

```
docker/
├── prometheus/
│   └── prometheus.yml          # Config Prometheus (CRIAR)
├── alertmanager/
│   ├── alertmanager.yml        # Config Alertmanager (CRIAR)
│   └── alerts.yml              # Regras de alerta (CRIAR)
└── docker-compose.observability.yml  # Adicionar serviços (MODIFICAR)
```

#### Implementação Detalhada

**1. Adicionar Prometheus e Alertmanager ao Docker Compose:**

```yaml
# docker/docker-compose.observability.yml (adicionar)
  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alertmanager/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - observability
    depends_on:
      - loki

  alertmanager:
    image: prom/alertmanager:v0.26.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    networks:
      - observability

volumes:
  prometheus-data:
  alertmanager-data:
```

**2. Configuração Prometheus:**

```yaml
# docker/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'myia-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']
```

**3. Regras de Alerta:**

```yaml
# docker/alertmanager/alerts.yml
groups:
  - name: myia_alerts
    interval: 30s
    rules:
      # Alerta 1: High Error Rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate({app="myia-backend",level="error"}[5m]))
            /
            sum(rate({app="myia-backend"}[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          component: backend
        annotations:
          summary: "Taxa de erro alta detectada"
          description: "Taxa de erro acima de 5% nos últimos 5 minutos (atual: {{ $value | humanizePercentage }})"

      # Alerta 2: High Latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: warning
          component: backend
        annotations:
          summary: "Latência alta detectada"
          description: "P95 de latência acima de 2s nos últimos 5 minutos (atual: {{ $value }}s)"

      # Alerta 3: Service Down
      - alert: ServiceDown
        expr: up{job="myia-backend"} == 0
        for: 1m
        labels:
          severity: critical
          component: backend
        annotations:
          summary: "Serviço MyIA Backend está down"
          description: "O serviço não está respondendo há mais de 1 minuto"

      # Alerta 4: High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          (
            process_resident_memory_bytes{job="myia-backend"}
            /
            1024 / 1024 / 1024
          ) > 2
        for: 10m
        labels:
          severity: warning
          component: backend
        annotations:
          summary: "Uso de memória alto"
          description: "Uso de memória acima de 2GB (atual: {{ $value | humanize }}GB)"
```

**4. Configuração Alertmanager:**

```yaml
# docker/alertmanager/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true

  - name: 'critical'
    email_configs:
      - to: 'admin@myia.com'
        from: 'alerts@myia.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@myia.com'
        auth_password: '${SMTP_PASSWORD}'
        headers:
          Subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true

  - name: 'warning'
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

**5. Endpoint de Webhook no Backend:**

```typescript
// backend/src/routes/alertsRoutes.ts (CRIAR)
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

router.post('/webhook', (req, res) => {
  const alerts = req.body.alerts || [];

  alerts.forEach((alert: any) => {
    const level = alert.labels.severity === 'critical' ? 'error' : 'warn';
    
    logger[level]('[AlertManager] Alerta recebido', {
      alertname: alert.labels.alertname,
      severity: alert.labels.severity,
      status: alert.status,
      summary: alert.annotations.summary,
      description: alert.annotations.description,
      startsAt: alert.startsAt,
      endsAt: alert.endsAt
    });
  });

  res.status(200).json({ status: 'ok' });
});

export default router;
```

```typescript
// backend/src/server.ts (adicionar)
import alertsRoutes from './routes/alertsRoutes';

app.use('/api/alerts', alertsRoutes);
```

#### Checkpoint 3.4: Alertas Configurados

**Critérios de Sucesso:**

- [ ] Prometheus coletando métricas
- [ ] Alertmanager configurado
- [ ] 4 alertas definidos
- [ ] Webhook funcionando
- [ ] Notificações sendo recebidas

**Teste de Validação:**

```bash
# 1. Iniciar serviços
docker-compose -f docker-compose.observability.yml up -d

# 2. Verificar Prometheus
# http://localhost:9090/alerts
# Esperado: 4 alertas listados

# 3. Verificar Alertmanager
# http://localhost:9093
# Esperado: Interface funcionando

# 4. Simular alerta (gerar erros)
for i in {1..100}; do
  curl http://localhost:3001/api/non-existent
done

# 5. Aguardar 5 minutos
# 6. Verificar alerta disparado
# 7. Verificar webhook recebido no backend
```

**Se Falhar:**
- **Causa Provável:** Configuração incorreta
- **Ação:** Revisar configs
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 3.5

---

### Tarefa 3.5: Implementar SSE para Logs em Tempo Real

**Modo Primário:** Code  
**Modo Secundário:** Frontend Specialist

#### Descrição

Implementar Server-Sent Events para streaming de logs em tempo real.

#### Arquivos a Criar/Modificar

```
backend/src/
├── routes/logsRoutes.ts        # Adicionar endpoint SSE (MODIFICAR)
└── services/logsStreamService.ts  # Serviço de streaming (CRIAR)

frontend/src/
├── hooks/useLogsStream.ts      # Hook para SSE (CRIAR)
└── components/logs/
    └── LogsStreamView.tsx      # Visualização em tempo real (CRIAR)
```

#### Implementação Detalhada

**1. Serviço de Streaming (Backend):**

```typescript
// backend/src/services/logsStreamService.ts
import { Response } from 'express';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

class LogsStreamService extends EventEmitter {
  private clients: Set<Response> = new Set();

  /**
   * Adiciona cliente SSE
   */
  addClient(res: Response) {
    this.clients.add(res);
    
    logger.info('[LogsStreamService] Cliente conectado', {
      totalClients: this.clients.size
    });

    // Remover cliente quando desconectar
    res.on('close', () => {
      this.clients.delete(res);
      logger.info('[LogsStreamService] Cliente desconectado', {
        totalClients: this.clients.size
      });
    });
  }

  /**
   * Envia log para todos os clientes conectados
   */
  broadcastLog(log: any) {
    const data = JSON.stringify(log);
    
    this.clients.forEach((client) => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        logger.error('[LogsStreamService] Erro ao enviar log', {
          error: error instanceof Error ? error.message : String(error)
        });
        this.clients.delete(client);
      }
    });
  }

  /**
   * Retorna número de clientes conectados
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const logsStreamService = new LogsStreamService();
```

**2. Endpoint SSE (Backend):**

```typescript
// backend/src/routes/logsRoutes.ts (adicionar)
import { logsStreamService } from '../services/logsStreamService';

/**
 * GET /api/logs/stream
 * Server-Sent Events para logs em tempo real
 */
router.get(
  '/stream',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    logger.info('[logsRoutes.stream] Cliente conectando ao stream', {
      requestId: req.id,
      userId: req.userId
    });

    // Configurar headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Enviar comentário inicial (mantém conexão)
    res.write(': connected\n\n');

    // Adicionar cliente ao serviço de streaming
    logsStreamService.addClient(res);

    // Enviar heartbeat a cada 30s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    // Limpar ao desconectar
    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }
);
```

**3. Integrar com Winston Transport:**

```typescript
// backend/src/utils/transports/postgresTransport.ts (modificar)
import { logsStreamService } from '../../services/logsStreamService';

// Após salvar no banco, broadcast para clientes SSE
await prisma.log.create({ data: logEntry });

// Broadcast para clientes SSE
logsStreamService.broadcastLog(logEntry);
```

**4. Hook React para SSE (Frontend):**

```typescript
// frontend/src/hooks/useLogsStream.ts
import { useState, useEffect, useRef } from 'react';
import { Log } from '../types/logs';

interface UseLogsStreamOptions {
  enabled?: boolean;
  maxLogs?: number;
}

export const useLogsStream = (options: UseLogsStreamOptions = {}) => {
  const { enabled = true, maxLogs = 100 } = options;
  const [logs, setLogs] = useState<Log[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token não encontrado');
      return;
    }

    // Criar EventSource
    const eventSource = new EventSource(
      `http://localhost:3001/api/logs/stream?token=${token}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
      console.log('[useLogsStream] Conectado ao stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const log: Log = JSON.parse(event.data);
        setLogs((prevLogs) => {
          const newLogs = [log, ...prevLogs];
          return newLogs.slice(0, maxLogs);
        });
      } catch (err) {
        console.error('[useLogsStream] Erro ao parsear log:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[useLogsStream] Erro no stream:', err);
      setConnected(false);
      setError('Erro na conexão com o stream');
      eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [enabled, maxLogs]);

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    connected,
    error,
    clearLogs
  };
};
```

**5. Componente de Visualização em Tempo Real (Frontend):**

```typescript
// frontend/src/components/logs/LogsStreamView.tsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Clear as ClearIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useLogsStream } from '../../hooks/useLogsStream';
import { LogLevelBadge } from './LogLevelBadge';
import { format } from 'date-fns';

export const LogsStreamView: React.FC = () => {
  const [paused, setPaused] = React.useState(false);
  const { logs, connected, error, clearLogs } = useLogsStream({
    enabled: !paused,
    maxLogs: 50
  });

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">Logs em Tempo Real</Typography>
          <Chip
            icon={<CircleIcon />}
            label={connected ? 'Conectado' : 'Desconectado'}
            color={connected ? 'success' : 'default'}
            size="small"
          />
        </Box>
        <Box>
          <Tooltip title={paused ? 'Retomar' : 'Pausar'}>
            <IconButton onClick={() => setPaused(!paused)}>
              {paused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Limpar">
            <IconButton onClick={clearLogs}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Typography color="error" variant="body2" mb={2}>
          {error}
        </Typography>
      )}

      {/* Logs List */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {logs.length === 0 ? (
          <Typography color="textSecondary" align="center">
            Aguardando logs...
          </Typography>
        ) : (
          <List dense>
            {logs.map((log) => (
              <ListItem
                key={log.id}
                sx={{
                  borderLeft: 3,
                  borderColor: log.level === 'error' ? 'error.main' : 'divider',
                  mb: 0.5,
                  bgcolor: 'background.default'
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <LogLevelBadge level={log.level} />
                      <Typography variant="body2">{log.message}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      {log.requestId && ` • ${log.requestId}`}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};
```

**6. Adicionar à Página de Logs:**

```typescript
// frontend/src/pages/LogsPage.tsx (adicionar)
import { LogsStreamView } from '../components/logs/LogsStreamView';

// Adicionar no JSX (no topo):
<Box mb={2}>
  <LogsStreamView />
</Box>
```

#### Checkpoint 3.5: SSE Implementado

**Critérios de Sucesso:**

- [ ] Endpoint SSE funcionando
- [ ] Logs transmitidos em tempo real
- [ ] Latência < 1s
- [ ] Frontend conecta e recebe logs
- [ ] Reconexão automática funciona

**Teste de Validação:**

```bash
# 1. Iniciar backend e frontend
cd backend && npm run dev
cd frontend && npm run dev

# 2. Acessar página de logs
# http://localhost:3000/logs

# 3. Verificar "Conectado" no componente de stream

# 4. Em outro terminal, gerar logs:
curl http://localhost:3001/api/health

# 5. Verificar logs aparecem em tempo real no frontend
```

**Se Falhar:**
- **Causa Provável:** CORS ou autenticação
- **Ação:** Verificar configuração CORS
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 3.6

---

### Tarefa 3.6: Documentação Final

**Modo Primário:** Docs Specialist  
**Modo Secundário:** Architect

#### Descrição

Criar documentação completa do sistema de observabilidade.

#### Arquivos a Criar

```
docs/
├── GRAFANA-GUIDE.md            # Guia do Grafana (CRIAR)
├── LOGGING-RUNBOOK.md          # Runbook de troubleshooting (CRIAR)
├── LOGGING-ALERTS-GUIDE.md     # Guia de alertas (CRIAR)
└── OBSERVABILITY-ARCHITECTURE.md  # Arquitetura (CRIAR)
```

#### Conteúdo dos Documentos

**1. Guia do Grafana:**

```markdown
# Guia do Grafana - MyIA

## Acesso

- URL: http://localhost:3002
- Usuário: admin
- Senha: admin (alterar no primeiro acesso)

## Dashboards Disponíveis

### 1. MyIA - Erros
- Taxa de erro em tempo real
- Top 10 erros mais frequentes
- Erros por endpoint
- Timeline de erros

### 2. MyIA - Latência
- Percentis P50/P95/P99
- Latência por endpoint
- Latência por provider/model

### 3. MyIA - Uso
- Requisições por minuto
- Usuários ativos
- Uso por provider
- Custos estimados

## Queries LogQL Úteis

### Buscar erros:
```
{app="myia-backend",level="error"}
```

### Buscar por usuário:
```
{app="myia-backend",userId="user-123"}
```

### Buscar por requestId:
```
{app="myia-backend",requestId="req-456"}
```

### Taxa de erro:
```
sum(rate({app="myia-backend",level="error"}[5m])) / sum(rate({app="myia-backend"}[5m]))
```
```

**2. Runbook de Troubleshooting:**

```markdown
# Runbook - Sistema de Logging MyIA

## Problemas Comuns

### 1. Logs não aparecem no Grafana

**Sintomas:**
- Dashboards vazios
- Queries não retornam dados

**Diagnóstico:**
```bash
# Verificar Loki
curl http://localhost:3100/ready

# Verificar logs no Loki
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={app="myia-backend"}'
```

**Soluções:**
1. Verificar Promtail está rodando
2. Verificar path dos logs está correto
3. Verificar formato JSON dos logs

### 2. Alertas não disparam

**Sintomas:**
- Prometheus não mostra alertas
- Alertmanager não recebe notificações

**Diagnóstico:**
```bash
# Verificar Prometheus
curl http://localhost:9090/api/v1/alerts

# Verificar Alertmanager
curl http://localhost:9093/api/v2/alerts
```

**Soluções:**
1. Verificar regras de alerta
2. Verificar configuração Alertmanager
3. Verificar webhook endpoint

### 3. SSE não conecta

**Sintomas:**
- Frontend mostra "Desconectado"
- Logs não aparecem em tempo real

**Diagnóstico:**
- Verificar console do navegador
- Verificar logs do backend

**Soluções:**
1. Verificar token JWT válido
2. Verificar CORS configurado
3. Verificar endpoint SSE acessível

## Comandos Úteis

### Reiniciar serviços:
```bash
docker-compose -f docker-compose.observability.yml restart
```

### Ver logs dos serviços:
```bash
docker-compose -f docker-compose.observability.yml logs -f loki
docker-compose -f docker-compose.observability.yml logs -f grafana
```

### Limpar dados:
```bash
docker-compose -f docker-compose.observability.yml down -v
```
```

**3. Guia de Alertas:**

```markdown
# Guia de Alertas - MyIA

## Alertas Configurados

### 1. High Error Rate (CRITICAL)
- **Condição:** Taxa de erro > 5% por 5 minutos
- **Ação:** Investigar logs de erro imediatamente
- **Notificação:** Email + Webhook

### 2. High Latency (WARNING)
- **Condição:** P95 > 2s por 5 minutos
- **Ação:** Verificar performance do sistema
- **Notificação:** Webhook

### 3. Service Down (CRITICAL)
- **Condição:** Serviço não responde por 1 minuto
- **Ação:** Reiniciar serviço
- **Notificação:** Email + Webhook

### 4. High Memory Usage (WARNING)
- **Condição:** Memória > 2GB por 10 minutos
- **Ação:** Investigar memory leaks
- **Notificação:** Webhook

## Silenciar Alertas

### Via Alertmanager UI:
1. Acessar http://localhost:9093
2. Clicar no alerta
3. Clicar em "Silence"
4. Definir duração

### Via API:
```bash
curl -X POST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighErrorRate", "isRegex": false}
    ],
    "startsAt": "2026-01-26T00:00:00Z",
    "endsAt": "2026-01-26T01:00:00Z",
    "comment": "Manutenção programada"
  }'
```
```

#### Checkpoint 3.6: Documentação Completa

**Critérios de Sucesso:**

- [ ] 4 documentos criados
- [ ] Guias claros e práticos
- [ ] Exemplos funcionais
- [ ] Troubleshooting coberto

**Teste de Validação:**

- Revisar documentação manualmente
- Testar comandos e queries
- Validar links e referências

**Se Falhar:**
- **Causa Provável:** Documentação incompleta
- **Ação:** Completar seções faltantes
- **Modo:** Docs Specialist

**Se Passar:**
- **Próximo Passo:** Checkpoint Final Fase 3

---

## 🎯 Checkpoint Final de Fase 3

**Critérios de Sucesso Global:**

- [ ] Docker Compose funcionando
- [ ] Loki ingerindo logs (< 5s latência)