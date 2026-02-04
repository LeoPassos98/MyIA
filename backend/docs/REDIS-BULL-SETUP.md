# Redis e Bull Queue - Setup Guide

## Visão Geral

Sistema de filas assíncronas para processamento de certificações de modelos AI.

## Arquitetura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│    Redis    │
│    Admin    │      │     API     │      │   + Bull    │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                     │
                            │                     │
                            ▼                     ▼
                     ┌─────────────┐      ┌─────────────┐
                     │   Worker    │◀─────│    Queue    │
                     │  Processor  │      │             │
                     └─────────────┘      └─────────────┘
```

## Instalação Redis

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS
```bash
brew install redis
brew services start redis
```

### Docker
```bash
docker run -d \
  --name myia-redis \
  -p 6379:6379 \
  redis:7-alpine
```

## Verificar Redis

```bash
redis-cli ping
# Resposta esperada: PONG
```

## Configuração

### 1. Variáveis de Ambiente

Copiar `.env.example` para `.env` e configurar:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

BULL_QUEUE_PREFIX=myia
BULL_BOARD_PATH=/admin/queues
BULL_BOARD_USERNAME=admin
BULL_BOARD_PASSWORD=admin123

CERTIFICATION_QUEUE_NAME=model-certification
CERTIFICATION_CONCURRENCY=3
CERTIFICATION_TIMEOUT=300000
CERTIFICATION_MAX_RETRIES=3
```

### 2. Instalar Dependências

```bash
cd backend
npm install
```

## Uso

### Iniciar Backend

```bash
npm run dev
```

### Acessar Bull Board

```
http://localhost:3001/admin/queues
```

**Credenciais**:
- Username: `admin`
- Password: `admin123`

## Monitoramento

### Bull Board

Interface web para monitorar filas:
- Jobs ativos
- Jobs completados
- Jobs falhados
- Retry de jobs
- Limpeza de filas

### Redis CLI

```bash
# Conectar
redis-cli

# Listar chaves
KEYS myia:*

# Ver tamanho da fila
LLEN myia:model-certification:wait

# Monitorar comandos
MONITOR
```

## Troubleshooting

### Redis não conecta

```bash
# Verificar se Redis está rodando
sudo systemctl status redis-server

# Ver logs
sudo journalctl -u redis-server -f
```

### Fila travada

```bash
# Limpar fila via Bull Board
# Ou via código:
await queue.clean(0, 'completed');
await queue.clean(0, 'failed');
```

### Jobs não processam

1. Verificar worker está rodando
2. Verificar logs do backend
3. Verificar conexão Redis
4. Verificar concurrency settings

## Performance

### Configurações Recomendadas

**Desenvolvimento**:
- Concurrency: 3
- Timeout: 5 minutos
- Max Retries: 3

**Produção**:
- Concurrency: 5-10 (depende do servidor)
- Timeout: 10 minutos
- Max Retries: 5
- Redis com persistência (AOF)

## Segurança

### Produção

1. **Redis Password**:
```env
REDIS_PASSWORD=strong_password_here
```

2. **Bull Board Auth**:
```env
BULL_BOARD_USERNAME=admin_user
BULL_BOARD_PASSWORD=strong_password_here
```

3. **Firewall**:
```bash
# Bloquear porta Redis externamente
sudo ufw deny 6379
```

## Referências

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/documentation)
