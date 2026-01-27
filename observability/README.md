# MyIA Observability Stack

Stack completo de observabilidade com Grafana, Loki e Promtail para agregação e visualização de logs do sistema MyIA.

## 📦 Componentes

- **Loki** (porta 3100): Sistema de agregação de logs
- **Grafana** (porta 3002): Interface de visualização e dashboards
- **Promtail**: Coletor de logs do backend

## ⚙️ Pré-requisitos

### Instalar Docker

O stack de observabilidade requer Docker e Docker Compose instalados.

#### Ubuntu/Debian

```bash
# Atualizar pacotes
sudo apt update

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker (para não precisar de sudo)
sudo usermod -aG docker $USER

# Aplicar mudanças (ou faça logout/login)
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

#### Fedora/RHEL/CentOS

```bash
# Instalar Docker
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

#### Arch Linux

```bash
# Instalar Docker
sudo pacman -S docker docker-compose

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Verificar Instalação

```bash
# Verificar Docker
docker --version
# Saída esperada: Docker version 24.x.x

# Verificar Docker Compose
docker compose version
# Saída esperada: Docker Compose version v2.x.x

# Testar Docker
docker run hello-world
```

## 🚀 Início Rápido

### 1. Iniciar o Stack

```bash
cd observability
./start.sh
```

O script irá:
- ✅ Verificar se Docker está rodando
- ✅ Criar diretórios de dados
- ✅ Ajustar permissões
- ✅ Iniciar containers (Loki, Grafana, Promtail)
- ✅ Verificar saúde dos serviços

### 2. Acessar Grafana

1. Abra o navegador em: **http://localhost:3002**
2. Login: `admin` / Senha: `admin`
3. (Opcional) Altere a senha quando solicitado
4. Vá para **Explore** no menu lateral (ícone de bússola)
5. Selecione **Loki** como datasource
6. Execute queries LogQL para visualizar logs

### 3. Parar o Stack

```bash
./stop.sh
```

### 4. Ver Logs dos Containers

```bash
# Ver todos os logs
./logs.sh

# Ver logs de um serviço específico
./logs.sh loki
./logs.sh grafana
./logs.sh promtail

# Seguir logs em tempo real
./logs.sh loki -f

# Ver últimas N linhas
./logs.sh grafana -n 50
```

## 📊 Estrutura de Diretórios

```
observability/
├── docker-compose.yml          # Configuração do Docker Compose
├── start.sh                    # Script para iniciar stack
├── stop.sh                     # Script para parar stack
├── logs.sh                     # Script para ver logs
├── README.md                   # Esta documentação
├── loki/
│   └── loki-config.yml        # Configuração do Loki
├── promtail/
│   └── promtail-config.yml    # Configuração do Promtail
├── grafana/
│   └── datasources.yml        # Configuração do datasource Loki
└── data/                      # Dados persistentes (gitignored)
    ├── loki/                  # Dados do Loki
    └── grafana/               # Dados do Grafana
```

## 🔍 Queries LogQL Úteis

### Ver todos os logs do backend

```logql
{app="myia", component="backend"}
```

### Filtrar por nível de log

```logql
{app="myia"} |= "level" | json | level="error"
```

### Filtrar por serviço

```logql
{app="myia"} | json | service="AuthService"
```

### Buscar por requestId

```logql
{app="myia"} | json | requestId="abc-123"
```

### Logs HTTP com status 500

```logql
{app="myia", log_type="http"} | json | statusCode="500"
```

### Logs de erro com stack trace

```logql
{app="myia"} | json | level="error" | stack != ""
```

### Contar erros por minuto

```logql
sum(rate({app="myia"} | json | level="error" [1m]))
```

### Top 10 URLs mais acessadas

```logql
topk(10, sum by (url) (rate({app="myia", log_type="http"} | json [5m])))
```

### Latência média por endpoint

```logql
avg by (url) (rate({app="myia", log_type="http"} | json | duration > 0 [5m]))
```

## 🏥 Verificação de Saúde

### Verificar Loki

```bash
# Health check
curl http://localhost:3100/ready

# Métricas
curl http://localhost:3100/metrics

# Verificar se está recebendo logs
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={app="myia"}' | jq
```

### Verificar Grafana

```bash
# Health check
curl http://localhost:3002/api/health

# Verificar datasources
curl -u admin:admin http://localhost:3002/api/datasources
```

### Verificar containers

```bash
cd observability

# Status dos containers
docker compose ps

# Logs em tempo real
docker compose logs -f

# Uso de recursos
docker stats
```

## 🔧 Configurações

### Loki

- **Retenção**: 30 dias (720h)
- **Storage**: Filesystem local em `data/loki/`
- **Limites de ingestão**: 10MB/s (burst: 20MB/s)
- **Max streams**: 10.000 por usuário
- **Max query length**: 30 dias

### Promtail

Coleta logs de:
- `../backend/logs/*.log` - Logs gerais do backend
- `../backend/logs/error-*.log` - Logs de erro
- `../backend/logs/combined-*.log` - Logs combinados
- `../backend/logs/http-*.log` - Logs HTTP

Labels automáticos:
- `app=myia`
- `component=backend`
- `environment=development`
- `level` (extraído do log)
- `service` (extraído do log)
- `requestId` (extraído do log)

### Grafana

- **Datasource**: Loki (pré-configurado)
- **Porta**: 3002 (para não conflitar com frontend na 3000)
- **Credenciais padrão**: admin/admin
- **Dados persistentes**: `data/grafana/`

## 🐛 Troubleshooting

### Docker não está instalado

```bash
# Siga as instruções de instalação acima
# Ou visite: https://docs.docker.com/engine/install/
```

### Stack não inicia

```bash
# Verificar se Docker está rodando
docker info

# Ver logs de erro
./logs.sh

# Limpar e reiniciar
./stop.sh
docker compose down -v
./start.sh
```

### Loki não recebe logs

```bash
# Verificar se Promtail está rodando
docker compose ps promtail

# Ver logs do Promtail
./logs.sh promtail -f

# Verificar se diretório de logs existe
ls -la ../backend/logs/

# Criar logs de teste
echo '{"timestamp":"2024-01-01T00:00:00Z","level":"info","message":"test"}' >> ../backend/logs/test.log
```

### Grafana não conecta ao Loki

```bash
# Verificar se Loki está acessível
curl http://localhost:3100/ready

# Verificar logs do Grafana
./logs.sh grafana

# Recriar datasource
# Vá em Configuration > Data Sources > Loki > Test
```

### Permissões de arquivo

```bash
# Ajustar permissões dos diretórios de dados
chmod -R 777 data/

# Verificar propriedade
ls -la data/
```

### Porta já em uso

```bash
# Verificar o que está usando a porta
sudo lsof -i :3002  # Grafana
sudo lsof -i :3100  # Loki

# Parar processo ou alterar porta no docker-compose.yml
```

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose logs

# Verificar recursos do sistema
docker system df
docker system prune  # Limpar recursos não utilizados

# Verificar memória disponível
free -h
```

## 📊 Dashboards Grafana

O sistema inclui 3 dashboards pré-configurados que são carregados automaticamente:

### 1. MyIA - Overview

Dashboard geral com visão consolidada do sistema:

- **Logs por Nível**: Distribuição de logs (info, warn, error) em gráfico de pizza
- **Logs por Minuto**: Série temporal mostrando volume de logs
- **Estatísticas**: Total de erros, warnings e logs info
- **Top 5 Serviços**: Serviços que mais geram logs
- **Logs Recentes**: Tabela com os logs mais recentes

**Acesso**: Grafana → Dashboards → MyIA → Overview

### 2. MyIA - Errors

Dashboard focado em análise de erros:

- **Métricas de Erro**: Total, taxa por minuto, últimos 5min e última hora
- **Erros por Serviço**: Série temporal de erros por serviço
- **Top 10 Mensagens**: Mensagens de erro mais frequentes
- **Top 10 Serviços**: Serviços com mais erros
- **Stack Traces**: Logs de erro completos com stack traces

**Acesso**: Grafana → Dashboards → MyIA → Errors

### 3. MyIA - Performance

Dashboard de análise de performance HTTP:

- **Métricas HTTP**: Requisições/min, tempo médio, P95 e P99 de latência
- **Requisições por Método**: GET, POST, PUT, DELETE, etc.
- **Latência por Endpoint**: Tempo de resposta de cada endpoint
- **Status Codes**: Distribuição de códigos HTTP (2xx, 4xx, 5xx)
- **Endpoints Mais Lentos**: Top 10 endpoints com maior latência
- **Endpoints Mais Acessados**: Top 10 endpoints mais chamados
- **Status Codes por Minuto**: Série temporal de códigos HTTP

**Acesso**: Grafana → Dashboards → MyIA → Performance

### Acessando os Dashboards

1. Acesse Grafana: **http://localhost:3002**
2. Login: `admin` / Senha: `admin`
3. No menu lateral, clique em **Dashboards**
4. Abra a pasta **MyIA**
5. Selecione o dashboard desejado

### Personalizando Dashboards

Os dashboards podem ser personalizados diretamente no Grafana:

- **Editar Painéis**: Clique no título do painel → Edit
- **Adicionar Painéis**: Clique em "Add panel" no topo
- **Modificar Queries**: Edite as queries LogQL nos painéis
- **Salvar Alterações**: Clique em "Save dashboard" no topo

**Nota**: As alterações são salvas no Grafana e persistem entre reinicializações.

## 🔍 Queries LogQL Avançadas

### Análise de Performance

```logql
# Latência P95 por endpoint
quantile_over_time(0.95, {app="myia", log_type="http"} | json | unwrap duration [5m]) by (url)

# Requisições mais lentas (> 1s)
{app="myia", log_type="http"} | json | duration > 1000

# Taxa de erro HTTP (5xx)
sum(rate({app="myia", log_type="http"} | json | statusCode >= 500 [1m]))
```

### Análise de Erros

```logql
# Erros por categoria
sum by (service) (rate({app="myia"} | json | level="error" [5m]))

# Erros com contexto específico
{app="myia"} | json | level="error" | context_userId != ""

# Padrões de erro
{app="myia"} | json | level="error" | message =~ ".*timeout.*"
```

### Análise de Usuários

```logql
# Requisições por usuário
sum by (userId) (count_over_time({app="myia", log_type="http"} | json | userId != "" [1h]))

# Erros por usuário
{app="myia"} | json | level="error" | context_userId != ""
```

### Análise de Serviços

```logql
# Logs de um serviço específico
{app="myia"} | json | service="AuthService"

# Comparar volume de logs entre serviços
sum by (service) (rate({app="myia"} | json [5m]))
```

## ✅ Validação do Sistema

Use o script de validação para verificar se tudo está funcionando:

```bash
cd observability
./validate.sh
```

O script verifica:

- ✅ Docker está instalado e rodando
- ✅ Containers estão ativos e saudáveis
- ✅ Loki está acessível e recebendo logs
- ✅ Grafana está acessível com datasource configurado
- ✅ Dashboards foram carregados
- ✅ Promtail está enviando logs
- ✅ Arquivos de log existem
- ✅ Uso de recursos do sistema

**Saída esperada**: Todos os checks em verde ✓

## 📈 Próximos Passos (Fase 3.3+)

1. **✅ Fase 3.1**: Stack Docker (Concluída)
2. **✅ Fase 3.2**: Dashboards Grafana (Concluída)
   - ✅ Dashboard de Overview
   - ✅ Dashboard de Erros
   - ✅ Dashboard de Performance
3. **🔄 Fase 3.3**: Alertas
   - Alertas de erro crítico
   - Alertas de performance
   - Notificações (email, Slack)
4. **🔄 Fase 3.4**: Métricas
   - Adicionar Prometheus
   - Métricas de aplicação
   - Métricas de sistema

## 🔗 Links Úteis

- [Documentação Loki](https://grafana.com/docs/loki/latest/)
- [LogQL Syntax](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [Docker Install](https://docs.docker.com/engine/install/)

## 📝 Notas Importantes

- ⚠️ **Docker é obrigatório** para rodar este stack
- 💾 Os dados são persistidos em `data/loki` e `data/grafana`
- 🗓️ Logs são retidos por 30 dias automaticamente
- 🔌 Grafana roda na porta **3002** (não 3000) para evitar conflito com o frontend
- 🔄 Promtail monitora automaticamente novos arquivos de log
- 🔐 Altere a senha padrão do Grafana em produção
- 📊 O datasource Loki é configurado automaticamente no primeiro start

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `./logs.sh`
2. Verifique a saúde dos serviços: `docker compose ps`
3. Consulte a seção de Troubleshooting acima
4. Verifique a documentação oficial dos componentes
