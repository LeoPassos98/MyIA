# 📋 Script de Gerenciamento de Certificações

Script interativo em Bash para gerenciar o sistema de certificação de modelos AI do MyIA.

## 📦 Versão

**v1.0.0** - 2026-02-02

## 🎯 Objetivo

Fornecer uma interface de linha de comando amigável e interativa para:
- Gerenciar jobs de certificação
- Monitorar status do sistema
- Visualizar estatísticas
- Executar testes
- Gerenciar logs
- Reiniciar serviços

## 🚀 Início Rápido

```bash
# Tornar executável (já feito)
chmod +x manage-certifications.sh

# Executar
./manage-certifications.sh
```

## 📋 Pré-requisitos

### Dependências Obrigatórias

O script verifica automaticamente e informa se alguma dependência está faltando:

- **curl** - Para chamadas à API REST
- **jq** - Para processar JSON
- **psql** - Para verificar PostgreSQL (opcional)

### Instalação das Dependências

```bash
# Ubuntu/Debian
sudo apt-get install curl jq postgresql-client

# Fedora/RHEL
sudo dnf install curl jq postgresql

# macOS
brew install curl jq postgresql
```

### Serviços Necessários

- **Backend** rodando em `http://localhost:3001`
- **Worker** de certificação ativo
- **Redis** acessível
- **PostgreSQL** acessível

## ⚙️ Configuração

### Variáveis de Ambiente

O script usa as seguintes variáveis (com valores padrão):

```bash
API_URL=http://localhost:3001      # URL da API
API_TOKEN=                          # Token de autenticação (opcional)
DB_HOST=localhost                   # Host do PostgreSQL
DB_PORT=5432                        # Porta do PostgreSQL
DB_NAME=myia                        # Nome do banco
DB_USER=leonardo                    # Usuário do banco
```

### Arquivo de Configuração (Opcional)

Crie `~/.certifications-manager.conf` para sobrescrever valores padrão:

```bash
# ~/.certifications-manager.conf
API_URL=http://localhost:3001
API_TOKEN=seu_token_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myia
DB_USER=leonardo
VERBOSE=true
```

### Variáveis de Ambiente Temporárias

```bash
# Usar API em outro host
API_URL=http://192.168.1.100:3001 ./manage-certifications.sh

# Modo verbose
VERBOSE=true ./manage-certifications.sh
```

## 📖 Funcionalidades

### 1. 📊 Ver Status do Sistema

Verifica e exibe:
- ✅ Status do Backend (API)
- ✅ Status do Worker
- ✅ Conectividade Redis
- ✅ Conectividade PostgreSQL
- 📊 Estatísticas da fila (aguardando, processando, completos, falhados)

**Uso:**
```
Menu Principal > 1
```

### 2. 🚀 Criar Novo Job de Certificação

Cria jobs de certificação com três modos:

#### 2.1. Certificar Modelo Único (SINGLE_MODEL)
- Certifica um modelo específico em uma região
- Requer: Model ID (UUID) e Região

#### 2.2. Certificar Múltiplos Modelos (MULTIPLE_MODELS)
- Certifica vários modelos em várias regiões
- Requer: Lista de Model IDs e Lista de Regiões

#### 2.3. Certificar Todos os Modelos (ALL_MODELS)
- Certifica todos os modelos ativos
- Requer: Lista de Regiões
- ⚠️ Pede confirmação (operação pesada)

**Regiões Disponíveis:**
- `us-east-1` - US East (N. Virginia)
- `us-west-2` - US West (Oregon)
- `eu-west-1` - Europe (Ireland)
- `eu-central-1` - Europe (Frankfurt)
- `ap-southeast-1` - Asia Pacific (Singapore)
- `ap-northeast-1` - Asia Pacific (Tokyo)

**Exemplo:**
```
Menu Principal > 2 > 1
Model ID: 550e8400-e29b-41d4-a716-446655440000
Região: 1 (us-east-1)
```

### 3. 📋 Listar Jobs

Lista jobs de certificação com filtros:
- Todos os jobs
- Na Fila (QUEUED)
- Processando (PROCESSING)
- Completos (COMPLETED)
- Falhados (FAILED)

**Exibe:**
- ID do Job
- Tipo (SINGLE_MODEL, MULTIPLE_MODELS, ALL_MODELS)
- Status (colorido)
- Progresso (X/Y)
- Data de criação

**Exemplo:**
```
Menu Principal > 3 > 4 (Completos)
Limite: 20
```

### 4. 🔍 Ver Detalhes de um Job

Exibe informações detalhadas de um job específico:
- Informações gerais (ID, tipo, status, regiões)
- Progresso (total, processados, sucesso, falhas)
- Barra de progresso visual
- Lista de certificações (modelo, status, score, rating, tempo)

**Exemplo:**
```
Menu Principal > 4
Job ID: 550e8400-e29b-41d4-a716-446655440000
```

### 5. ❌ Cancelar Job

Cancela um job em execução ou na fila.

⚠️ **Atenção:** Pede confirmação antes de cancelar.

**Exemplo:**
```
Menu Principal > 5
Job ID: 550e8400-e29b-41d4-a716-446655440000
Confirmar: s
```

### 6. 🧹 Limpar Jobs Antigos

Remove jobs antigos do banco de dados com opções:
1. Limpar jobs QUEUED antigos
2. Limpar jobs COMPLETED antigos
3. Limpar jobs FAILED antigos
4. Limpar TODOS os jobs antigos

**Parâmetros:**
- Idade mínima em dias (padrão: 7)

⚠️ **Atenção:** Operação irreversível! Pede confirmação.

**Exemplo:**
```
Menu Principal > 6 > 2 (COMPLETED)
Idade: 30 dias
Confirmar: s
```

### 7. 📈 Ver Estatísticas

Exibe estatísticas completas:
- **Fila (Bull):** Aguardando, Ativos, Completos, Falhados
- **Gráfico ASCII:** Distribuição visual
- **Por Região:** Contagem de certificações por região
- **Por Status:** Contagem de certificações por status

**Exemplo:**
```
Menu Principal > 7
```

**Saída:**
```
Fila (Bull):
  Aguardando:           5
  Ativos:               2
  Completos:            150
  Falhados:             3

  Distribuição:
    Aguardando:   [███                 ]   3%
    Ativos:       [█                   ]   1%
    Completos:    [██████████████████  ]  94%
    Falhados:     [                    ]   2%

Certificações por Região:
  us-east-1            45
  us-west-2            32
  eu-west-1            28

Certificações por Status:
  CERTIFIED            98
  FAILED               7
```

### 8. ⚙️ Gerenciar Fila

Opções de gerenciamento da fila:
1. Pausar fila (via Bull Board)
2. Retomar fila (via Bull Board)
3. Limpar fila (via Bull Board)
4. Ver jobs na fila

**Nota:** Algumas operações redirecionam para o Bull Board em `http://localhost:3001/admin/queues`

### 9. 📝 Ver Logs

Visualiza logs do sistema:
1. **Logs do backend** - Últimas 50 linhas
2. **Logs do worker** - Filtrados por "worker"
3. **Logs de um job específico** - Por Job ID
4. **Logs de erro** - Últimos 50 erros

**Fontes:**
- API de logs (`/api/logs`)
- Arquivos em `logs/backend.out.log` e `logs/backend.err.log`

**Exemplo:**
```
Menu Principal > 9 > 3
Job ID: 550e8400-e29b-41d4-a716-446655440000
```

### 10. 🧪 Executar Testes

Executa scripts de teste:
1. **Testar API** - `test-certification-api.sh`
2. **Testar worker** - `test-worker.ts`
3. **Testar sincronização** - `test-sync-banco-fila.ts`
4. **Testar job completo** - `test-certification-queue.ts`

**Exemplo:**
```
Menu Principal > 10 > 1 (API)
```

### 11. 📚 Ver Documentação

Acessa documentação do sistema:
1. Guia do Worker de Certificação
2. API de Certificação
3. Sistema de Rating de Modelos
4. Gerenciamento de Cache
5. Guia de Migração de Adapters
6. Abrir todos no navegador

**Usa:** `less` para visualização ou `xdg-open` para abrir no navegador

### 12. 🔄 Reiniciar Serviços

Reinicia serviços usando [`start.sh`](./start.sh):
1. Reiniciar backend
2. Reiniciar worker (backend)
3. Reiniciar ambos (backend + frontend)

⚠️ **Atenção:** Pede confirmação antes de reiniciar.

**Exemplo:**
```
Menu Principal > 12 > 1 (Backend)
Confirmar: s
```

## 🎨 Interface

### Cores e Símbolos

O script usa cores ANSI para melhor legibilidade:

- 🟢 **Verde** (`✓`) - Sucesso, status OK
- 🔴 **Vermelho** (`✗`) - Erro, falha
- 🟡 **Amarelo** (`⚠`) - Aviso, atenção
- 🔵 **Azul** (`ℹ`) - Informação
- ⚪ **Cinza** - Verbose, detalhes

### Menu Principal

```
╔════════════════════════════════════════════════╗
║   Sistema de Gerenciamento de Certificações   ║
╚════════════════════════════════════════════════╝

Menu Principal:

  1.  📊 Ver Status do Sistema
  2.  🚀 Criar Novo Job de Certificação
  3.  📋 Listar Jobs
  4.  🔍 Ver Detalhes de um Job
  5.  ❌ Cancelar Job
  6.  🧹 Limpar Jobs Antigos
  7.  📈 Ver Estatísticas
  8.  ⚙️  Gerenciar Fila
  9.  📝 Ver Logs
  10. 🧪 Executar Testes
  11. 📚 Ver Documentação
  12. 🔄 Reiniciar Serviços
  0.  🚪 Sair

Escolha uma opção:
```

## 🔧 Opções de Linha de Comando

```bash
# Modo verbose (mostra detalhes de API calls)
./manage-certifications.sh --verbose
./manage-certifications.sh -v

# Modo dry-run (não executa ações, apenas simula)
./manage-certifications.sh --dry-run

# Ajuda
./manage-certifications.sh --help
./manage-certifications.sh -h
```

## 📊 Exemplos de Uso

### Exemplo 1: Certificar um Modelo Específico

```bash
./manage-certifications.sh
# Menu: 2 > 1
# Model ID: 550e8400-e29b-41d4-a716-446655440000
# Região: 1 (us-east-1)
```

### Exemplo 2: Monitorar Job em Execução

```bash
./manage-certifications.sh
# Menu: 4
# Job ID: [cole o ID do job criado]
# Veja progresso, certificações, etc.
```

### Exemplo 3: Ver Estatísticas e Limpar Jobs Antigos

```bash
./manage-certifications.sh
# Menu: 7 (Ver estatísticas)
# Menu: 6 > 2 (Limpar COMPLETED antigos)
# Idade: 30 dias
```

### Exemplo 4: Modo Verbose para Debug

```bash
./manage-certifications.sh -v
# Mostra detalhes de todas as chamadas API
```

## 🔒 Segurança

### Autenticação

Se a API requer autenticação:

```bash
# Via variável de ambiente
API_TOKEN=seu_token_aqui ./manage-certifications.sh

# Via arquivo de configuração
echo 'API_TOKEN=seu_token_aqui' >> ~/.certifications-manager.conf
```

### Confirmações

Operações destrutivas pedem confirmação:
- ❌ Cancelar job
- 🧹 Limpar jobs antigos
- 🔄 Reiniciar serviços
- 🚀 Certificar todos os modelos

## 🐛 Troubleshooting

### Erro: "Dependências faltando"

```bash
# Instale as dependências
sudo apt-get install curl jq postgresql-client
```

### Erro: "Backend não está rodando"

```bash
# Inicie o backend
./start.sh start backend

# Ou verifique se está rodando
./start.sh status
```

### Erro: "Não foi possível obter estatísticas"

Verifique:
1. Backend está rodando?
2. Redis está acessível?
3. API_URL está correta?

```bash
# Teste manualmente
curl http://localhost:3001/health
```

### Erro: "Script de teste não encontrado"

Verifique se você está no diretório raiz do projeto:

```bash
cd /home/leonardo/Documents/VSCODE/MyIA
./manage-certifications.sh
```

### Modo Verbose para Debug

```bash
./manage-certifications.sh -v
# Mostra todas as chamadas API e detalhes
```

## 📁 Estrutura de Arquivos

```
MyIA/
├── manage-certifications.sh          # Script principal
├── README-MANAGE-CERTIFICATIONS.md   # Esta documentação
├── start.sh                          # Script de start/stop
├── logs/                             # Logs do sistema
│   ├── backend.out.log
│   └── backend.err.log
└── backend/
    ├── scripts/                      # Scripts de teste
    │   ├── test-certification-api.sh
    │   ├── test-worker.ts
    │   ├── test-sync-banco-fila.ts
    │   └── test-certification-queue.ts
    └── docs/                         # Documentação
        ├── CERTIFICATION-WORKER-GUIDE.md
        ├── CERTIFICATION-QUEUE-API-SUMMARY.md
        └── ...
```

## 🔗 Integração com API

O script integra com os seguintes endpoints:

### Endpoints Utilizados

| Endpoint | Método | Função |
|----------|--------|--------|
| `/health` | GET | Verificar backend |
| `/api/certification-queue/stats` | GET | Estatísticas |
| `/api/certification-queue/certify-model` | POST | Certificar modelo |
| `/api/certification-queue/certify-multiple` | POST | Certificar múltiplos |
| `/api/certification-queue/certify-all` | POST | Certificar todos |
| `/api/certification-queue/history` | GET | Listar jobs |
| `/api/certification-queue/jobs/:id/status` | GET | Detalhes do job |
| `/api/certification-queue/jobs/:id` | DELETE | Cancelar job |
| `/api/certification-queue/regions` | GET | Listar regiões |
| `/api/logs` | GET | Buscar logs |

### Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "..." // apenas em caso de erro
}
```

## 🎯 Boas Práticas

### 1. Verificar Status Antes de Criar Jobs

```bash
# Sempre verifique se os serviços estão rodando
Menu > 1 (Status)
# Depois crie jobs
Menu > 2 (Criar Job)
```

### 2. Monitorar Jobs Ativos

```bash
# Liste jobs em processamento
Menu > 3 > 3 (PROCESSING)
```

### 3. Limpar Jobs Antigos Regularmente

```bash
# Limpe jobs completos com mais de 30 dias
Menu > 6 > 2 (COMPLETED) > 30 dias
```

### 4. Usar Modo Verbose para Debug

```bash
./manage-certifications.sh -v
```

### 5. Testar Antes de Produção

```bash
# Execute testes
Menu > 10 > 4 (Job completo)
```

## 📈 Métricas e Monitoramento

### Visualizar Estatísticas

```bash
Menu > 7 (Estatísticas)
```

### Monitorar Logs em Tempo Real

```bash
# Via script
Menu > 9 > 1 (Backend logs)

# Ou diretamente
tail -f logs/backend.out.log
```

### Bull Board (Interface Web)

Acesse: `http://localhost:3001/admin/queues`

- Visualizar fila em tempo real
- Pausar/retomar processamento
- Ver detalhes de jobs
- Retry de jobs falhados

## 🚀 Próximos Passos

### Melhorias Futuras

- [ ] Adicionar suporte a webhooks
- [ ] Implementar retry automático
- [ ] Adicionar export de relatórios (CSV, JSON)
- [ ] Implementar agendamento de jobs
- [ ] Adicionar notificações (email, Slack)
- [ ] Criar dashboard web integrado
- [ ] Adicionar métricas de performance
- [ ] Implementar backup/restore de configurações

### Contribuindo

Para adicionar novas funcionalidades:

1. Adicione a função no script
2. Adicione entrada no menu principal
3. Atualize esta documentação
4. Teste todas as funcionalidades
5. Commit e push

## 📞 Suporte

### Documentação Relacionada

- [Guia do Worker](backend/docs/CERTIFICATION-WORKER-GUIDE.md)
- [API de Certificação](backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md)
- [Sistema de Rating](backend/docs/MODEL-RATING-SYSTEM.md)
- [Start.sh Guide](START_INTERACTIVE_GUIDE.md)

### Logs

- Backend: `logs/backend.out.log`
- Erros: `logs/backend.err.log`

### Contato

- Equipe: MyIA Team
- Versão: 1.0.0
- Data: 2026-02-02

## 📝 Changelog

### v1.0.0 (2026-02-02)

**Funcionalidades Iniciais:**
- ✅ Ver status do sistema
- ✅ Criar jobs (single, multiple, all)
- ✅ Listar jobs com filtros
- ✅ Ver detalhes de jobs
- ✅ Cancelar jobs
- ✅ Limpar jobs antigos
- ✅ Ver estatísticas
- ✅ Gerenciar fila
- ✅ Ver logs
- ✅ Executar testes
- ✅ Ver documentação
- ✅ Reiniciar serviços

**Features:**
- ✅ Menu interativo colorido
- ✅ Validações de entrada
- ✅ Confirmações para ações destrutivas
- ✅ Modo verbose
- ✅ Modo dry-run
- ✅ Tratamento de erros robusto
- ✅ Integração completa com API
- ✅ Suporte a arquivo de configuração

## 📄 Licença

Este script faz parte do projeto MyIA.

---

**Desenvolvido com ❤️ pela equipe MyIA**
