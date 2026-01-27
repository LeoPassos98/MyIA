# 🚀 Guia Rápido - MyIA Observability Stack

## Passo 1: Instalar Docker

Se você ainda não tem Docker instalado:

```bash
cd observability
./install-docker.sh
```

Após a instalação, faça logout/login ou execute:
```bash
newgrp docker
```

## Passo 2: Iniciar o Stack

```bash
cd observability
./start.sh
```

## Passo 3: Validar Instalação

```bash
./validate.sh
```

Este script verifica se todos os serviços estão funcionando corretamente.

## Passo 4: Acessar Grafana

1. Abra: **http://localhost:3002**
2. Login: `admin` / Senha: `admin`
3. Vá para **Dashboards** → **MyIA**
4. Escolha um dashboard:
   - **Overview**: Visão geral do sistema
   - **Errors**: Análise de erros
   - **Performance**: Métricas HTTP

Ou use o **Explore** (ícone de bússola) para queries customizadas.

## Comandos Úteis

```bash
# Validar sistema
./validate.sh

# Ver logs
./logs.sh

# Ver logs de um serviço
./logs.sh loki
./logs.sh grafana
./logs.sh promtail

# Seguir logs em tempo real
./logs.sh loki -f

# Parar stack
./stop.sh

# Reiniciar
./stop.sh && ./start.sh
```

## Verificar Saúde

```bash
# Script completo de validação
./validate.sh

# Ou manualmente:

# Loki
curl http://localhost:3100/ready

# Grafana
curl http://localhost:3002/api/health

# Status dos containers
docker compose ps
```

## Queries LogQL Básicas

```logql
# Todos os logs
{app="myia"}

# Apenas erros
{app="myia"} | json | level="error"

# Por serviço
{app="myia"} | json | service="AuthService"

# Logs HTTP
{app="myia", log_type="http"}

# Status 500
{app="myia", log_type="http"} | json | statusCode="500"
```

## Troubleshooting

### Docker não instalado
```bash
./install-docker.sh
```

### Porta em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :3002  # Grafana
sudo lsof -i :3100  # Loki
```

### Permissões
```bash
chmod -R 777 data/
```

### Limpar tudo
```bash
./stop.sh
docker compose down -v
rm -rf data/
./start.sh
```

## 📚 Documentação Completa

Veja [`README.md`](README.md) para documentação completa.

## 📊 Dashboards Disponíveis

O sistema inclui 3 dashboards pré-configurados:

1. **MyIA - Overview**: Visão geral do sistema
   - Logs por nível (pie chart)
   - Logs por minuto (time series)
   - Top 5 serviços
   - Logs recentes

2. **MyIA - Errors**: Análise de erros
   - Total de erros e taxa
   - Erros por serviço
   - Top mensagens de erro
   - Stack traces

3. **MyIA - Performance**: Métricas HTTP
   - Requisições/min
   - Latência (média, P95, P99)
   - Status codes
   - Endpoints mais lentos

## 🎯 Próximos Passos

- **✅ Fase 3.1**: Stack Docker (Concluída)
- **✅ Fase 3.2**: Dashboards Grafana (Concluída)
- **🔄 Fase 3.3**: Configurar alertas
- **🔄 Fase 3.4**: Adicionar métricas com Prometheus
