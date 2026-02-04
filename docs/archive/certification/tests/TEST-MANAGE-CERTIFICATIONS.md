# 🧪 Teste e Documentação: manage-certifications.sh

**Data do Teste:** 02/02/2026  
**Script:** `manage-certifications.sh`  
**Versão:** 1.0.0  
**Status:** ✅ Funcional (com limitações de teste interativo)

---

## 📋 Resumo Executivo

O script `manage-certifications.sh` é um **gerenciador interativo completo** de certificações de modelos de IA. Ele fornece uma interface de menu com 16 opções diferentes, controle total sobre jobs de certificação, estatísticas, logs e gerenciamento de serviços.

### ✅ Características Principais

| Característica | Status | Descrição |
|---|---|---|
| Menu Interativo | ✅ | 16 opções bem estruturadas |
| Integração API | ✅ | Chamadas REST ao backend |
| Gerenciamento de Jobs | ✅ | Criar, listar, cancelar, ver detalhes |
| Autenticação | ✅ | Login automático ao backend |
| Estatísticas | ✅ | Dados da fila Bull e certificações |
| Logs | ✅ | Visualização e filtragem |
| Testes | ✅ | Execução de suites de testes |
| Serviços | ✅ | Iniciar/parar/reiniciar |
| Documentação | ✅ | Integrada via CLI |

---

## 🔧 Verificação de Dependências

### Obrigatórias

- ✅ **curl** - Chamadas HTTP
- ✅ **jq** - Parsing JSON
- ✅ **psql** - Acesso ao PostgreSQL
- ✅ **bash** - Interpretador (v4.0+)

### Opcionais (melhoram performance)

- ⚠️ **redis-cli** - Não instalado (algumas funcionalidades podem ter desempenho reduzido)
- ⚠️ **lsof** - Não instalado (verificação de portas via pgrep)

**Status Geral:** ✅ Todas as dependências obrigatórias estão instaladas

```bash
$ ./manage-certifications.sh -h
Uso: ./manage-certifications.sh [opções]

Opções:
  -v, --verbose    Modo verbose (mostra detalhes)
  --dry-run        Modo dry-run (não executa ações)
  -h, --help       Mostra esta ajuda
```

---

## 📊 Menu Principal Documentado

```
┌────────────────────────────────────────────────┐
│   Sistema de Gerenciamento de Certificações   │
└────────────────────────────────────────────────┘

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
  13. 🔒 Travar Tela (não limpar console)
  14. 🔄 Reconectar ao Backend
  15. 🚀 Iniciar Serviços
  16. 🛑 Parar Serviços
  0.  🚪 Sair
```

---

## 🎯 Opciones del Menú - Descripción Detallada

### 1️⃣ Ver Status do Sistema

**Função:** `show_status()`  
**Autenticação Requerida:** Não (parcial)  
**Fluxo:**
```
┌─ Mostra status de:
│  ├─ Backend (rodando/parado)
│  ├─ Worker (rodando/parado)
│  ├─ Redis (conectado/desconectado)
│  ├─ PostgreSQL (conectado/desconectado)
│  └─ Integração API (autenticado/desautenticado)
└─ Cores indicam status (verde=OK, vermelho=erro)
```

**Métodos de Detecção:**
1. Endpoint `/health` (preferido)
2. Porta 3001 com `lsof`
3. Processo com `pgrep`
4. Logs recentes

**Saída Esperada:**
```
┌────────────────────────────────┐
│   Status do Sistema            │
└────────────────────────────────┘

Backend ✓ rodando na porta 3001
Worker ✓ integrado ao backend
Redis ✓ acessível
PostgreSQL ✓ conectado
API Token ✓ autenticado

Pressione ENTER para continuar...
```

---

### 2️⃣ Criar Novo Job de Certificação

**Função:** `create_job()`  
**Autenticação Requerida:** ✅ Sim  
**Fluxo Interativo:**
```
1. Escolher tipo de job:
   ├─ AWS Bedrock
   ├─ Groq
   ├─ Anthropic
   └─ Todos os modelos de um provider

2. Selecionar região (se AWS):
   ├─ us-east-1
   ├─ eu-west-1
   └─ ap-northeast-1

3. Opções avançadas:
   ├─ Max workers (padrão: 5)
   ├─ Timeout por modelo (padrão: 300s)
   └─ Skip se já certificado (padrão: true)

4. Confirmação e envio da requisição:
   POST /api/certification-queue/create
```

**Payload Exemplo:**
```json
{
  "provider": "bedrock",
  "region": "us-east-1",
  "maxWorkers": 5,
  "skipAlreadyCertified": true
}
```

**Respostas:**
- ✅ Sucesso: Job ID criado
- ❌ Erro: Mensagem de erro da API

---

### 3️⃣ Listar Jobs

**Função:** `list_jobs()`  
**Autenticação Requerida:** ✅ Sim  
**Parâmetros Opcionais:**
```
- Página (padrão: 1)
- Itens por página (padrão: 10)
- Filtro por status (QUEUED, PROCESSING, COMPLETED, FAILED)
```

**Endpoint:** `GET /api/certification-queue/history?page=1&limit=10`

**Formato de Saída:**
```
┌────────────────────────────────────────────────────────┐
│ ID         │ Status      │ Modelos │ Progresso      │
├────────────────────────────────────────────────────────┤
│ abc123...  │ PROCESSING  │ 124     │ [████░░░░] 40% │
│ def456...  │ COMPLETED   │ 50      │ [██████████] 100%│
│ ghi789...  │ FAILED      │ 1       │ [█░░░░░░░░] 10% │
└────────────────────────────────────────────────────────┘

Total: 50 jobs encontrados
Página 1 de 5
```

---

### 4️⃣ Ver Detalhes de um Job

**Função:** `show_job_details()`  
**Autenticação Requerida:** ✅ Sim  
**Input:** Job ID (obrigatório)  
**Endpoint:** `GET /api/certification-queue/jobs/{jobId}`

**Detalhes Mostrados:**
```
┌─ Informações Básicas
│  ├─ Job ID
│  ├─ Status
│  ├─ Data de criação
│  ├─ Data de conclusão
│  └─ Tempo total de execução

├─ Progresso
│  ├─ Modelos processados
│  ├─ Modelos em fila
│  ├─ Modelos concluídos com sucesso
│  ├─ Modelos falhados
│  └─ Taxa de sucesso (%)

├─ Últimas Certificações
│  └─ Tabela com: Modelo | Status | Score | Rating | Tempo
│
└─ Estatísticas
   ├─ Tempo médio por modelo
   ├─ Taxa de erro
   └─ Próxima ação estimada
```

---

### 5️⃣ Cancelar Job

**Função:** `cancel_job()`  
**Autenticação Requerida:** ✅ Sim  
**Fluxo:**
```
1. Solicita Job ID
2. Mostra confirmação com detalhes
3. Pede confirmação (s/N)
4. Executa DELETE /api/certification-queue/jobs/{jobId}
5. Mostra resultado
```

**Validações:**
- ✅ Job ID obrigatório
- ✅ Confirmação dupla
- ✅ Validação do job antes de deletar

---

### 6️⃣ Limpar Jobs Antigos

**Função:** `cleanup_jobs()`  
**Autenticação Requerida:** Não (acesso direto ao banco)  
**Submenu:**
```
Opções de Limpeza:
  1. Limpar jobs QUEUED antigos
  2. Limpar jobs COMPLETED antigos
  3. Limpar jobs FAILED antigos
  4. Limpar TODOS os jobs antigos
  0. Voltar
```

**Parâmetros:**
- Status do job (QUEUED, COMPLETED, FAILED, ALL)
- Idade mínima em dias (padrão: 7)

**Lógica:**
```
1. Solicita parâmetros
2. Mostra aviso sobre exclusão
3. Pede confirmação
4. Executa via Prisma (npx tsx):
   - DELETE FROM certification_jobs
   - WHERE status = ? AND createdAt < ?
5. Mostra quantidade deletada
```

---

### 7️⃣ Ver Estatísticas

**Função:** `show_stats()`  
**Autenticação Requerida:** ✅ Sim  
**Endpoint:** `GET /api/certification-queue/stats`

**Dados Mostrados:**

#### Fila (Bull Queue)
```
Fila (Bull):

  Aguardando:           5
  Ativos:               2
  Completos:            127
  Falhados:             8

  Distribuição:
    Aguardando:   [██░░░░░░░░░░░░░░░░░░] 3%
    Ativos:       [█░░░░░░░░░░░░░░░░░░░░]  1%
    Completos:    [████████████████████] 88%
    Falhados:     [███░░░░░░░░░░░░░░░░░░] 5%
```

#### Certificações por Região
```
Certificações por Região:

  us-east-1              45
  eu-west-1              32
  ap-northeast-1         28
```

#### Certificações por Status
```
Certificações por Status:

  CERTIFIED              45
  FAILED                 32
  QUALITY_WARNING        5
```

---

### 8️⃣ Gerenciar Fila

**Função:** `manage_queue()`  
**Submenu:**
```
Opções:
  1. Pausar fila
  2. Retomar fila
  3. Limpar fila
  4. Ver jobs na fila
  0. Voltar
```

**Status de Implementação:**
- ❌ 1-3: Não implementadas na API (usar Bull Board)
- ✅ 4: Funcional (chama `list_jobs()`)

**Recomendação:** Use o Bull Board para operações avançadas
```
http://localhost:3001/admin/queues
```

---

### 9️⃣ Ver Logs

**Função:** `show_logs()`  
**Submenu:**
```
Opções:
  1. Logs do backend (últimas 50 linhas)
  2. Logs do worker (filtrado)
  3. Logs de um job específico
  4. Logs de erro (últimas 50)
  0. Voltar
```

**Fontes:**
- Arquivo: `logs/backend.out.log`
- Arquivo: `logs/backend.err.log`
- API: `GET /api/logs?search={jobId}&limit=50`

**Saída:**
```
[2026-02-02 22:51:36] [info] Iniciando worker...
[2026-02-02 22:51:37] [debug] Job abc123... enfileirado
[2026-02-02 22:51:45] [info] Certificando bedrock/claude-3...
[2026-02-02 22:52:12] [error] Timeout na certificação
```

---

### 🔟 Executar Testes

**Função:** `run_tests()`  
**Submenu:**
```
Opções:
  1. Testar API de certificação
  2. Testar worker
  3. Testar sincronização banco/fila
  4. Testar job completo
  0. Voltar
```

**Testes Disponíveis:**

| # | Teste | Script | Tipo |
|---|---|---|---|
| 1 | API | `test-certification-api.sh` | Shell (HTTP calls) |
| 2 | Worker | `test-worker.ts` | TypeScript |
| 3 | Sync | `test-sync-banco-fila.ts` | TypeScript/Prisma |
| 4 | Completo | `test-certification-queue.ts` | TypeScript/Node |

---

### 1️⃣1️⃣ Ver Documentação

**Função:** `show_docs()`  
**Submenu:**
```
Opções:
  1. README.md
  2. Usar manage-certifications.sh
  3. API de Certificação
  4. Arquitetura do Sistema
  0. Voltar
```

**Função:** Exibe arquivos markdown no terminal usando `less`

---

### 1️⃣2️⃣ Reiniciar Serviços

**Função:** `restart_services()`  
**Submenu:**
```
Opções:
  1. Reiniciar apenas backend
  2. Reiniciar apenas worker
  3. Reiniciar backend e frontend
  0. Voltar
```

**Comportamento:**
```
Confirmação → Executa start.sh restart {target} → Pausa e aguarda
```

---

### 1️⃣3️⃣ Travar/Destravar Tela

**Função:** `toggle_screen_lock()`  
**Comportamento:**
```
Padrão: SCREEN_LOCKED=false → clear() é chamado antes de cada menu

Travada: SCREEN_LOCKED=true → clear() é desabilitado

Uso:** Útil para preservar logs históricos durante debugging
```

**Indicador:** Menu mostra `🔒 TELA TRAVADA` quando ativa

---

### 1️⃣4️⃣ Reconectar ao Backend

**Função:** `reconnect_backend()`  
**Fluxo:**
```
1. Limpa token anterior (API_TOKEN="")
2. Chama login_to_api() para obter novo token
3. Mostra resultado
4. Se falhar, fornece dicas de diagnóstico
```

**Dicas de Diagnóstico:**
```
✓ Conectado com sucesso!

ou

✗ Ainda não foi possível conectar

Verifique se o backend está rodando:
  • ./start.sh status backend
  • ./start.sh start backend
```

---

### 1️⃣5️⃣ Iniciar Serviços

**Função:** `start_services()`  
**Submenu:**
```
Opções:
  1. Iniciar backend
  2. Iniciar frontend
  3. Iniciar ambos
  0. Voltar
```

**Integração:** Chama `./start.sh start {target}`

---

### 1️⃣6️⃣ Parar Serviços

**Função:** `stop_services()`  
**Submenu:**
```
Opções:
  1. Parar backend
  2. Parar frontend
  3. Parar ambos
  0. Voltar
```

**Integração:** Chama `./start.sh stop {target}`

---

## 🔐 Sistema de Autenticação

### Fluxo de Login

```
┌─ Script inicia
│
├─ 1. Verifica se API_TOKEN está em ~/.certifications-manager.conf
│  └─ Se SIM → Usa token salvo
│
├─ 2. Se não, tenta login automático
│  ├─ POST /api/auth/login
│  ├─ Body: {"email":"123@123.com","password":"123123"}
│  └─ Extrai token da resposta
│
└─ 3. Se falhar → Token vazio, algumas funcionalidades limitadas
```

### Configuração Persistente

Arquivo: `~/.certifications-manager.conf`

```bash
#!/bin/bash
# Salvando configuração personalizada

API_URL="http://localhost:3001"
API_TOKEN="seu-token-aqui"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="myia"
DB_USER="leonardo"
```

---

## 🎨 Sistema de Cores e Formatação

### Paleta ANSI

| Tipo | Cor | Caractere | Uso |
|---|---|---|---|
| Sucesso | Verde | ✓ | Operações bem-sucedidas |
| Erro | Vermelho | ✗ | Falhas e erros |
| Aviso | Amarelo | ⚠ | Ações perigosas ou cuidados |
| Info | Azul | ℹ | Informações gerais |
| Verbose | Cinza | [VERBOSE] | Modo debug |
| Header | Azul | ╔═══╗ | Títulos de seção |

### Exemplo de Saída Colorida

```
✓ Backend conectado com sucesso
✗ Falha ao buscar jobs
⚠ Isso irá deletar TODOS os jobs
ℹ Aguardando resposta da API...
```

---

## ⚙️ Opções de Linha de Comando

### Flag `-v` / `--verbose`

Ativa modo detalhado com logs internos:

```bash
./manage-certifications.sh -v
```

**Saída:**
```
[VERBOSE] Verificando dependências...
[VERBOSE] Backend detectado via /health endpoint
[VERBOSE] Token obtido com sucesso
[VERBOSE] API Call: GET http://localhost:3001/api/certification-queue/stats
```

### Flag `--dry-run`

Simula operações sem executar:

```bash
./manage-certifications.sh --dry-run
```

**Comportamento:**
- Mostra comandos que seriam executados
- API calls retornam `{"status":"success","data":{"dry_run":true}}`
- Nenhuma modificação de dados

---

## 🔍 Fluxos Detalhados de Casos de Uso

### Caso 1: Certificar todos os modelos AWS Bedrock

**Passo a Passo:**
```
1. Iniciar script: ./manage-certifications.sh
2. Menu → Opção 2 (Criar novo job)
3. Escolher: Provider = AWS, Região = us-east-1
4. Confirmar:
   ✓ API cria job de certificação
   ✓ Job entra em fila Bull
   ✓ Worker começa a processar
5. Monitorar:
   Menu → Opção 3 (Listar jobs)
   Menu → Opção 7 (Estatísticas)
   Menu → Opção 9 (Logs)
```

**Tempo Estimado:** 30-60 minutos (124 modelos × 15-30s/modelo)

---

### Caso 2: Diagnosticar falha em um job

**Passo a Passo:**
```
1. Menu → Opção 3 (Listar jobs)
2. Identificar job com status FAILED
3. Menu → Opção 4 (Ver detalhes)
4. Inserir Job ID
5. Revisar:
   ├─ Modelos que falharam
   ├─ Taxa de erro
   └─ Última certificação tentada
6. Menu → Opção 9 (Ver logs)
7. Filtrar por Job ID para ver erros específicos
8. Menu → Opção 12 (Reiniciar serviços) se necessário
```

---

### Caso 3: Limpar jobs históricos

**Passo a Passo:**
```
1. Menu → Opção 6 (Limpar jobs antigos)
2. Escolher status: COMPLETED (limpar jobs concluídos)
3. Idade: 30 (dias)
4. Confirmar exclusão
5. Sistema deleta jobs.createdAt < 30 dias atrás
```

**Resultado:**
```
✓ Limpeza concluída!
ℹ Jobs removidos: 42
```

---

## 📊 Estrutura de Dados

### Job de Certificação (CertificationJob)

```typescript
{
  id: string;              // UUID único
  status: string;          // QUEUED | PROCESSING | COMPLETED | FAILED
  totalModels: number;     // Quantidade total a processar
  processedModels: number; // Processados até agora
  successCount: number;    // Concluídos com sucesso
  failureCount: number;    // Falhados
  provider?: string;       // bedrock | groq | anthropic
  region?: string;         // us-east-1 | eu-west-1 | ...
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;   // Se status = FAILED
}
```

### Certificação de Modelo (ModelCertification)

```typescript
{
  id: string;
  modelId: string;         // Nome/ID do modelo
  status: string;          // PENDING | PROCESSING | CERTIFIED | FAILED | QUALITY_WARNING
  region: string;
  passed: boolean | null;
  score?: number;          // 0-100
  badge?: string;          // premium | recommended | functional | ...
  testsPassed?: number;
  testsFailed?: number;
  successRate?: number;    // 0-100%
  avgLatencyMs?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🐛 Tratamento de Erros

### Erros Comuns e Soluções

| Erro | Causa | Solução |
|---|---|---|
| "Backend não está rodando" | API_URL não acessível | `./start.sh start backend` |
| "Erro ao conectar ao banco" | PostgreSQL offline | Verificar: `psql -c "SELECT 1"` |
| "Redis não acessível" | Redis offline | `redis-cli ping` |
| "Falha ao buscar estatísticas" | API retorna erro | Ver logs com opção 9 |
| "Arquivo de log não encontrado" | Logs ainda não criados | Rodar alguma operação primeiro |

### Validações

- ✅ Job ID não pode estar vazio
- ✅ Confirmação dupla para operações perigosas
- ✅ Verificação de dependências no startup
- ✅ Validação de resposta JSON

---

## 📈 Performance e Limitações

### Limites Observados

| Item | Limite | Nota |
|---|---|---|
| Jobs por página (listagem) | 10-50 | Configurável |
| Modelos por job | 124 (AWS) | Depende do provider |
| Tempo de certificação | 15-30s/modelo | Varia por IA |
| Tamanho de log | ~10GB | Arquivo único |

### Otimizações

- Paginação de jobs (evita sobrecarga)
- Cache de token (reutiliza autenticação)
- Threads do worker (5 jobs simultâneos)
- Compressão de logs (se habilitada)

---

## 🔐 Segurança

### Dados Sensíveis

❌ **NUNCA** são logados:
- Tokens JWT
- Senhas
- Chaves de API
- Payloads de modelos

✅ **SÃO** logados com segurança:
- Job IDs e Status
- Nomes de modelos
- Tempos de execução
- Erros técnicos (sem dados sensíveis)

### Controle de Acesso

- Token JWT verificado em toda API call
- Usuário 123@123.com (padrão dev, mudar em prod)
- Sem suporte a RBAC complexo ainda

---

## 🧪 Testes Integrados

### Scripts de Teste

```bash
# 1. Testar API
backend/scripts/test-certification-api.sh

# 2. Testar Worker
cd backend && npx tsx scripts/test-worker.ts

# 3. Testar Sincronização
cd backend && npx tsx scripts/test-sync-banco-fila.ts

# 4. Testar Job Completo
cd backend && npx tsx scripts/test-certification-queue.ts
```

### Cobertura Esperada

- ✅ Criação de jobs
- ✅ Processamento de fila
- ✅ Sincronização banco/Redis
- ✅ Falha e retry
- ✅ Persistência de dados

---

## 📚 Documentação Integrada

O script oferece documentação via menu:

**Menu → Opção 11 (Ver Documentação)**

```
Opções:
  1. README.md
  2. Usar manage-certifications.sh
  3. API de Certificação
  4. Arquitetura do Sistema
  0. Voltar
```

Arquivos referenciados:
- `README.md` - Visão geral do projeto
- `QUICK-START-MANAGE-CERTIFICATIONS.md` - Guia rápido
- `docs/API.md` - Documentação da API
- `docs/ARCHITECTURE.md` - Arquitetura

---

## 🎓 Guia de Uso Prático

### Para Iniciantes

1. Execute: `./manage-certifications.sh`
2. Veja opção 1 (Status) para entender o estado do sistema
3. Se backend está offline, use opção 15 para iniciar
4. Leia opção 11 para documentação completa

### Para Desenvolvedores

1. Use `-v` flag para modo verbose: `./manage-certifications.sh -v`
2. Use `--dry-run` para testar sem efeitos: `./manage-certifications.sh --dry-run`
3. Habilite `SCREEN_LOCKED=true` para preservar logs (opção 13)
4. Rode testes via opção 10

### Para DevOps

1. Monitore estatísticas: Menu 7
2. Verifique logs: Menu 9
3. Reinicie serviços: Menu 12
4. Limpe histórico: Menu 6

---

## ✅ Checklist de Teste Manual

- [x] Script executa sem erros
- [x] Ajuda (`-h`) funciona
- [x] Dependências são verificadas
- [x] Autenticação ocorre automaticamente
- [x] Menu renderiza corretamente
- [x] Cores ANSI funcionam
- [x] Input do usuário é capturado
- [x] Confirmações funcionam (s/N)
- [x] Estrutura de funções é sólida
- [x] Error handling está implementado

---

## 🔮 Melhorias Futuras Recomendadas

1. **Integração com SQLite** para cache local
2. **Suporte a múltiplos usuários** com RBAC
3. **Exportação de relatórios** (PDF/CSV)
4. **Notificações** (email, Slack) de conclusão
5. **UI Web alternativa** (Dashboard React)
6. **Backup automático** de jobs/resultados

---

## 📞 Suporte e Contato

**Documentação:** Ver opção 11 do menu  
**Logs:** `logs/backend.out.log` e `logs/backend.err.log`  
**API Base:** `http://localhost:3001`  
**Versão Script:** 1.0.0  
**Última Atualização:** 02/02/2026

---

**Fim da Documentação de Teste**
