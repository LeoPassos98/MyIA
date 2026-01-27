# Retenção Automática de Logs

> **Versão:** 1.0  
> **Data:** 2026-01-26  
> **Status:** Implementado  
> **Referências:** [LOGGING-IMPLEMENTATION-PLAN](./LOGGING-IMPLEMENTATION-PLAN.md) | [STANDARDS §13](./STANDARDS.md#13-sistema-de-logging-estruturado)

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura](#-arquitetura)
3. [Configuração](#-configuração)
4. [Uso](#-uso)
5. [Monitoramento](#-monitoramento)
6. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

Sistema de retenção automática de logs que deleta registros com mais de **30 dias** para evitar crescimento infinito da tabela `logs` no PostgreSQL.

### Objetivos

- ✅ Manter apenas logs dos últimos 30 dias
- ✅ Executar limpeza diariamente (2h da manhã)
- ✅ Logs de auditoria da operação
- ✅ Zero impacto na performance da aplicação
- ✅ Tratamento robusto de erros

### Componentes

1. **Função PostgreSQL:** [`cleanup_old_logs()`](../backend/prisma/migrations/20260126205957_add_log_retention/migration.sql:8)
2. **Script Node.js:** [`cleanup-logs.ts`](../backend/scripts/cleanup-logs.ts:1)
3. **Cron Job:** Agendamento no sistema operacional

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB (Sistema)                        │
│              Executa diariamente às 2h da manhã              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Script Node.js (cleanup-logs.ts)                │
│  - Conecta ao PostgreSQL via Prisma                          │
│  - Executa função cleanup_old_logs()                         │
│  - Registra logs de auditoria                                │
│  - Retorna exit code (0 = sucesso, 1 = erro)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Função PostgreSQL (cleanup_old_logs())               │
│  - DELETE FROM logs WHERE timestamp < NOW() - 30 days        │
│  - Retorna número de logs deletados                          │
│  - Transação atômica (rollback em caso de erro)             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuração

### 1. Função PostgreSQL (Já Criada)

A função foi criada automaticamente pela migration [`20260126205957_add_log_retention`](../backend/prisma/migrations/20260126205957_add_log_retention/migration.sql:1):

```sql
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;
```

**Validar função:**

```bash
psql -U leonardo -h localhost -d myia -c "SELECT cleanup_old_logs();"
```

---

### 2. Script Node.js (Já Criado)

O script está em [`backend/scripts/cleanup-logs.ts`](../backend/scripts/cleanup-logs.ts:1).

**Testar manualmente:**

```bash
cd backend
npx ts-node scripts/cleanup-logs.ts
```

**Saída esperada:**

```
✅ Log Cleanup Summary:
   - Deleted logs: 0
   - Retention period: 30 days
   - Duration: 45ms
   - Timestamp: 2026-01-26T21:00:00.000Z
```

---

### 3. Configurar Cron Job

#### Opção A: Crontab do Usuário (Recomendado)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executar diariamente às 2h da manhã)
0 2 * * * cd /home/leonardo/Documents/VSCODE/MyIA/backend && npx ts-node scripts/cleanup-logs.ts >> logs/cleanup.log 2>&1
```

**Importante:** Ajustar o caminho absoluto para o seu ambiente.

#### Opção B: Systemd Timer (Produção)

Criar arquivo `/etc/systemd/system/myia-log-cleanup.service`:

```ini
[Unit]
Description=MyIA Log Cleanup Service
After=postgresql.service

[Service]
Type=oneshot
User=leonardo
WorkingDirectory=/home/leonardo/Documents/VSCODE/MyIA/backend
ExecStart=/usr/bin/npx ts-node scripts/cleanup-logs.ts
StandardOutput=append:/home/leonardo/Documents/VSCODE/MyIA/backend/logs/cleanup.log
StandardError=append:/home/leonardo/Documents/VSCODE/MyIA/backend/logs/cleanup.log

[Install]
WantedBy=multi-user.target
```

Criar arquivo `/etc/systemd/system/myia-log-cleanup.timer`:

```ini
[Unit]
Description=MyIA Log Cleanup Timer
Requires=myia-log-cleanup.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Ativar timer:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable myia-log-cleanup.timer
sudo systemctl start myia-log-cleanup.timer
```

**Verificar status:**

```bash
sudo systemctl status myia-log-cleanup.timer
sudo systemctl list-timers | grep myia
```

#### Opção C: Docker Compose (Containerizado)

Adicionar serviço ao `docker-compose.yml`:

```yaml
services:
  log-cleanup:
    build: ./backend
    command: npx ts-node scripts/cleanup-logs.ts
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: "no"
    # Executar via cron externo ou Kubernetes CronJob
```

---

## 🚀 Uso

### Execução Manual

```bash
cd backend
npx ts-node scripts/cleanup-logs.ts
```

### Verificar Logs de Auditoria

Os logs de auditoria são salvos na tabela `logs` e também em `logs/cleanup.log` (se configurado no cron):

```bash
# Ver logs de cleanup no PostgreSQL
psql -U leonardo -h localhost -d myia -c "
  SELECT timestamp, level, message, metadata 
  FROM logs 
  WHERE message LIKE '%cleanup%' 
  ORDER BY timestamp DESC 
  LIMIT 10;
"

# Ver logs de cleanup no arquivo
tail -f backend/logs/cleanup.log
```

### Verificar Logs Restantes

```bash
# Contar logs por data
psql -U leonardo -h localhost -d myia -c "
  SELECT 
    DATE(timestamp) as date,
    COUNT(*) as count
  FROM logs
  GROUP BY DATE(timestamp)
  ORDER BY date DESC;
"

# Ver logs mais antigos
psql -U leonardo -h localhost -d myia -c "
  SELECT MIN(timestamp), MAX(timestamp), COUNT(*) 
  FROM logs;
"
```

---

## 📊 Monitoramento

### Métricas Importantes

1. **Número de logs deletados por execução**
   - Esperado: Varia conforme volume de logs
   - Alerta: > 100.000 logs/dia (pode indicar problema)

2. **Duração da limpeza**
   - Esperado: < 1 segundo
   - Alerta: > 10 segundos (otimizar índices)

3. **Taxa de falha**
   - Esperado: 0%
   - Alerta: > 1% (investigar erros)

### Dashboard de Monitoramento

Criar query para dashboard (Grafana/Metabase):

```sql
-- Logs deletados nos últimos 30 dias
SELECT 
  DATE(timestamp) as date,
  (metadata->>'deletedCount')::int as deleted_count,
  (metadata->>'durationMs')::int as duration_ms
FROM logs
WHERE message = 'Log cleanup completed successfully'
  AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

---

## 🔧 Troubleshooting

### Problema: Cron job não está executando

**Diagnóstico:**

```bash
# Verificar se cron está rodando
sudo systemctl status cron

# Ver logs do cron
sudo tail -f /var/log/syslog | grep CRON

# Verificar crontab do usuário
crontab -l
```

**Solução:**

1. Verificar permissões do script
2. Usar caminho absoluto para `npx` e `ts-node`
3. Adicionar variáveis de ambiente no crontab

---

### Problema: Script falha com erro de conexão

**Diagnóstico:**

```bash
# Testar conexão PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1;"

# Verificar variáveis de ambiente
cd backend
cat .env | grep DATABASE_URL
```

**Solução:**

1. Verificar `DATABASE_URL` no `.env`
2. Verificar se PostgreSQL está rodando
3. Verificar permissões do usuário no banco

---

### Problema: Função cleanup_old_logs() não existe

**Diagnóstico:**

```bash
# Verificar se função existe
psql -U leonardo -h localhost -d myia -c "
  SELECT proname, prosrc 
  FROM pg_proc 
  WHERE proname = 'cleanup_old_logs';
"
```

**Solução:**

```bash
# Recriar função manualmente
cd backend
psql -U leonardo -h localhost -d myia < prisma/migrations/20260126205957_add_log_retention/migration.sql
```

---

### Problema: Logs não estão sendo deletados

**Diagnóstico:**

```bash
# Verificar logs antigos
psql -U leonardo -h localhost -d myia -c "
  SELECT COUNT(*) 
  FROM logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
"
```

**Solução:**

1. Executar função manualmente: `SELECT cleanup_old_logs();`
2. Verificar se há locks na tabela: `SELECT * FROM pg_locks WHERE relation = 'logs'::regclass;`
3. Verificar permissões do usuário: `GRANT DELETE ON logs TO leonardo;`

---

## 📝 Logs de Auditoria

Todos os eventos de limpeza são registrados na tabela `logs` com os seguintes campos:

```typescript
{
  level: 'info',
  message: 'Log cleanup completed successfully',
  metadata: {
    deletedCount: 1234,
    retentionDays: 30,
    durationMs: 45,
    timestamp: '2026-01-26T21:00:00.000Z'
  }
}
```

Em caso de erro:

```typescript
{
  level: 'error',
  message: 'Log cleanup failed',
  metadata: {
    error: 'Connection timeout',
    stack: '...',
    durationMs: 5000,
    timestamp: '2026-01-26T21:00:00.000Z'
  }
}
```

---

## 🔒 Segurança

### Permissões Necessárias

O usuário do banco de dados precisa ter:

```sql
-- Permissão para deletar logs
GRANT DELETE ON logs TO leonardo;

-- Permissão para executar função
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO leonardo;
```

### Backup Antes da Limpeza (Opcional)

Para ambientes críticos, criar backup antes de deletar:

```bash
# Backup de logs antigos antes de deletar
pg_dump -U leonardo -h localhost -d myia \
  --table=logs \
  --data-only \
  --file=logs_backup_$(date +%Y%m%d).sql
```

---

## 📚 Referências

- [LOGGING-IMPLEMENTATION-PLAN.md](./LOGGING-IMPLEMENTATION-PLAN.md) - Plano completo de implementação
- [STANDARDS.md §13](./STANDARDS.md#13-sistema-de-logging-estruturado) - Padrões de logging
- [PostgreSQL Documentation - PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html)
- [Cron Documentation](https://man7.org/linux/man-pages/man5/crontab.5.html)

---

## 🎯 Próximos Passos

- [ ] Implementar alertas para falhas de limpeza (Fase 3)
- [ ] Dashboard de monitoramento no Grafana (Fase 3)
- [ ] Exportar logs antigos para S3 antes de deletar (Futuro)
- [ ] Compressão de logs antigos (Futuro)
