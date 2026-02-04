# Referência Prática: Cada Função Detalhada

**Script:** `manage-certifications.sh`  
**Objetivo:** Guia prático de cada função com exemplos reais  
**Atualizado:** 02/02/2026

---

## 🟢 FUNÇÕES DE FORMATAÇÃO (5 funções)

### 1. `print_success()`

**O que faz:** Imprime uma mensagem em verde com símbolo ✓

**Sintaxe:**
```bash
print_success "Mensagem de sucesso"
```

**Exemplo:**
```bash
print_success "Job criada com sucesso!"
# Output: ✓ Job criada com sucesso!  (em verde)
```

**Usado em:** Feedback positivo para o usuário

**Implementação (simplificada):**
```bash
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}
```

---

### 2. `print_error()`

**O que faz:** Imprime uma mensagem em vermelho com símbolo ✗

**Sintaxe:**
```bash
print_error "Mensagem de erro"
```

**Exemplo:**
```bash
print_error "Falha ao conectar com API"
# Output: ✗ Falha ao conectar com API  (em vermelho)
```

**Usado em:** Mensagens de erro e falhas

---

### 3. `print_info()`

**O que faz:** Imprime uma mensagem em azul com símbolo ℹ

**Sintaxe:**
```bash
print_info "Informação"
```

**Exemplo:**
```bash
print_info "Carregando dados do servidor..."
# Output: ℹ Carregando dados do servidor...  (em azul)
```

**Usado em:** Informações gerais e status

---

### 4. `print_warning()`

**O que faz:** Imprime uma mensagem em amarelo com símbolo ⚠

**Sintaxe:**
```bash
print_warning "Aviso importante"
```

**Exemplo:**
```bash
print_warning "Limite de rate limit atingindo 80%"
# Output: ⚠ Limite de rate limit atingindo 80%  (em amarelo)
```

**Usado em:** Alertas e avisos de situações anormais

---

### 5. `print_header()`

**O que faz:** Imprime um cabeçalho formatado com linhas decorativas

**Sintaxe:**
```bash
print_header "Título da Seção"
```

**Exemplo:**
```bash
print_header "Menu Principal"
# Output:
# ═══════════════════════════════════════════════════════
#   Menu Principal
# ═══════════════════════════════════════════════════════
```

**Usado em:** Separação visual de seções

---

## 🔧 FUNÇÕES DE VERIFICAÇÃO (5 funções)

### 6. `check_dependencies()`

**O que faz:** Verifica se todas as dependências obrigatórias estão instaladas

**Sintaxe:**
```bash
check_dependencies
```

**Verifica:**
- ✅ `curl` - Para chamadas HTTP
- ✅ `jq` - Para parsing de JSON
- ✅ `psql` - Para conectar ao PostgreSQL

**Exemplo:**
```bash
if check_dependencies; then
  print_success "Todas as dependências estão OK"
else
  print_error "Faltam dependências!"
  exit 1
fi
```

**Retorno:**
- `0` = Sucesso (todas presentes)
- `1` = Falha (faltam dependências)

---

### 7. `check_backend()`

**O que faz:** Verifica se o backend está rodando

**Sintaxe:**
```bash
check_backend
```

**Testa:**
```bash
curl -s http://localhost:3001/health
# Esperado: HTTP 200 OK
```

**Exemplo:**
```bash
if ! check_backend; then
  print_error "Backend não está respondendo"
  reconnect_backend
fi
```

**Retorno:**
- `0` = Backend UP ✅
- `1` = Backend DOWN ❌

---

### 8. `check_postgres()`

**O que faz:** Verifica se PostgreSQL está acessível

**Sintaxe:**
```bash
check_postgres
```

**Testa:**
```bash
psql -h localhost -U admin -d myia -c "SELECT 1;"
```

**Exemplo:**
```bash
if check_postgres; then
  print_success "Banco de dados conectado"
else
  print_warning "Não conseguiu conectar ao banco"
fi
```

**Retorno:**
- `0` = Banco OK ✅
- `1` = Banco indisponível ❌

---

### 9. `check_redis()`

**O que faz:** Verifica se Redis está rodando

**Sintaxe:**
```bash
check_redis
```

**Testa:**
```bash
redis-cli ping
# Esperado: PONG
```

**Exemplo:**
```bash
if check_redis; then
  print_success "Cache Redis disponível"
else
  print_warning "Redis não respondendo"
fi
```

**Retorno:**
- `0` = Redis UP ✅
- `1` = Redis DOWN ❌

---

### 10. `check_services()`

**O que faz:** Verificação geral de todos os serviços

**Sintaxe:**
```bash
check_services
```

**Verifica:**
- check_dependencies()
- check_backend()
- check_postgres()
- check_redis()

**Exemplo:**
```bash
print_header "System Health Check"
check_services
print_success "All systems operational"
```

---

## 🔐 FUNÇÕES DE AUTENTICAÇÃO (2 funções)

### 11. `login_to_api()`

**O que faz:** Autentica o usuário e obtém token JWT

**Sintaxe:**
```bash
login_to_api
```

**Fluxo:**
1. Solicita email do usuário (se não fornecido)
2. Solicita senha (leitura oculta)
3. Faz POST para `/api/auth/login`
4. Extrai token JWT da resposta
5. Salva em variável `API_TOKEN`

**Exemplo:**
```bash
# Primeiro uso - pede credenciais
$ ./manage-certifications.sh
Email: admin@example.com
Password: ••••••••
✓ Autenticado com sucesso!

# Próximo uso - usa token armazenado
$ ./manage-certifications.sh
[Usa token anterior, não pede credenciais novamente]
```

**Request HTTP:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjM4NTQ2MDAwfQ.abc123...",
    "user": {
      "id": "user-123",
      "email": "admin@example.com"
    }
  }
}
```

**Retorno:**
- `0` = Autenticado com sucesso ✅
- `1` = Falha na autenticação ❌

---

### 12. `api_call()`

**O que faz:** Envolve chamadas HTTP para a API com autenticação automática

**Sintaxe:**
```bash
api_call "METHOD" "ENDPOINT" [DATA]
```

**Parâmetros:**
- `METHOD`: GET, POST, PUT, PATCH, DELETE
- `ENDPOINT`: /api/certification-queue/stats (por exemplo)
- `DATA`: (opcional) JSON data para POST/PUT/PATCH

**Exemplos:**

```bash
# GET request
api_call "GET" "/api/certification-queue/stats"

# POST request com dados
api_call "POST" "/api/certification-queue/certify-model" '{
  "model_id": "model-456",
  "provider": "bedrock"
}'

# PUT request
api_call "PUT" "/api/jobs/job-123" '{"status":"cancelled"}'

# DELETE request
api_call "DELETE" "/api/jobs/job-456"
```

**Internamente:**
```bash
curl -X GET \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3001/api/certification-queue/stats"
```

**Retorno:**
- Saída: JSON da resposta
- Exit code: 0 = sucesso, 1 = erro

**Tratamento de Erro:**
```bash
if api_call "GET" "/api/stats"; then
  print_success "Dados obtidos"
else
  print_error "Falha ao obter dados"
fi
```

---

## 📋 FUNÇÕES DE MENU (16 funções)

### 13. `show_main_menu()`

**O que faz:** Exibe o menu principal e lê a escolha do usuário

**Sintaxe:**
```bash
show_main_menu
```

**Loop:**
```bash
while true; do
  show_main_menu
done
```

**Output:**
```
════════════════════════════════════════════════════════
  Menu Principal - Gerenciador de Certificações
════════════════════════════════════════════════════════

 1. Ver Status de Jobs
 2. Criar Nova Certificação
 3. Listar Todas as Jobs
 4. Ver Detalhes do Job
 5. Cancelar Job
 6. Limpar Jobs Antigas
 7. Ver Estatísticas
 8. Gerenciar Fila
 9. Ver Logs
10. Executar Testes
11. Ver Documentação
12. Reiniciar Serviços
13. Bloquear/Desbloquear Tela
14. Reconectar Backend
15. Iniciar Serviços
16. Parar Serviços

 0. Sair

Escolha uma opção: _
```

**Fluxo:**
1. Exibe menu
2. Lê entrada do usuário
3. Valida opção (0-16)
4. Chama função correspondente
5. Volta ao menu

---

### 14. `show_status()` (Opção 1)

**O que faz:** Mostra status resumido de todas as jobs

**Comando:** Escolha opção 1 no menu

**API Call:**
```bash
GET /api/certification-queue/stats
```

**Output Exemplo:**
```
════════════════════════════════════════════════════════
  Status de Certificações
════════════════════════════════════════════════════════

Total de Jobs:          45
Pendentes:              3
Em Processamento:       2
Completadas:           38
Falhadas:               2
Taxa de Sucesso:      95.0%

Última atualização: 02/02/2026 10:30:00 UTC
```

---

### 15. `create_job()` (Opção 2)

**O que faz:** Cria uma nova tarefa de certificação

**Comando:** Escolha opção 2 no menu

**Interação:**
```
Deseja certificar:
1. Um modelo específico
2. Múltiplos modelos
3. Todos os modelos

Escolha: 1

ID do Modelo: bedrock:claude-3-sonnet
Região (opcional): us-east-1
Timeout em minutos (padrão 30): 

Criando job...
✓ Job criada com sucesso!
Job ID: job-123456
Status: pending
```

**API Call:**
```bash
POST /api/certification-queue/certify-model
{
  "model_id": "bedrock:claude-3-sonnet",
  "region": "us-east-1"
}
```

---

### 16. `list_jobs()` (Opção 3)

**O que faz:** Lista todas as tarefas de certificação

**Comando:** Escolha opção 3 no menu

**API Call:**
```bash
GET /api/certification-queue/jobs/
```

**Output Exemplo:**
```
════════════════════════════════════════════════════════
  Todas as Jobs de Certificação
════════════════════════════════════════════════════════

ID          | Status      | Modelo          | Progresso | Criada em
------------|-------------|-----------------|-----------|-------------------
job-001    | completed   | claude-3        | 100%     | 2026-02-01 14:30
job-002    | completed   | gpt-4          | 100%     | 2026-02-01 15:45
job-003    | pending     | gemini-pro     | 0%       | 2026-02-02 09:15
job-004    | running     | llama-13b      | 45%      | 2026-02-02 10:00

Total: 4 jobs
```

---

### 17. `show_job_details()` (Opção 4)

**O que faz:** Mostra detalhes completos de uma tarefa específica

**Comando:** Escolha opção 4 no menu

**Interação:**
```
ID da Job para visualizar: job-001

Carregando detalhes...
```

**Output Exemplo:**
```
════════════════════════════════════════════════════════
  Detalhes da Job
════════════════════════════════════════════════════════

ID:                job-001
Status:            completed
Modelo:            claude-3-sonnet
Provider:          bedrock
Região:            us-east-1

Progresso:         100%
Testes:            50/50 passaram

Data de Início:    2026-02-01 14:30:00
Data de Término:   2026-02-01 15:15:00
Duração:           45 minutos

Resultado:         ✓ APROVADO
Badge:             ✅ Certified
Score:             98.5%
```

---

### 18. `cancel_job()` (Opção 5)

**O que faz:** Cancela uma tarefa em progresso

**Comando:** Escolha opção 5 no menu

**Interação:**
```
ID da Job para cancelar: job-003

AVISO: Você está prestes a cancelar job-003

Tem certeza? (s/n): s

Cancelando job...
✓ Job cancelada com sucesso!
```

**API Call:**
```bash
POST /api/certification-queue/jobs/job-003/cancel
```

---

### 19. `cleanup_jobs()` (Opção 6)

**O que faz:** Remove tarefas antigas ou falhadas

**Comando:** Escolha opção 6 no menu

**Interação:**
```
Limpar qual tipo de job?
1. Falhadas
2. Mais antigas que 7 dias
3. Tudo exceto últimas 10

Escolha: 1

Limpando jobs falhadas...
Removidas: 2 jobs
✓ Limpeza concluída!
```

---

### 20. `show_stats()` (Opção 7)

**O que faz:** Exibe estatísticas detalhadas do sistema

**Comando:** Escolha opção 7 no menu

**Output Exemplo:**
```
════════════════════════════════════════════════════════
  Estatísticas do Sistema
════════════════════════════════════════════════════════

GERAL:
  Total de Jobs:           45
  Taxa de Sucesso:        95.0%
  Tempo Médio:            45 min
  Jobs em Processamento:   2

ÚLTIMAS 24 HORAS:
  Novas Jobs:             12
  Completadas:            10
  Falhadas:                1

TOP PROVIDERS:
  bedrock (35%)
  openai (40%)
  anthropic (25%)

MODELOS MAIS TESTADOS:
  claude-3-sonnet (15)
  gpt-4 (12)
  gemini-pro (8)
```

---

### 21. `manage_queue()` (Opção 8)

**O que faz:** Gerencia a fila de processamento

**Comando:** Escolha opção 8 no menu

**Submenu:**
```
Gerenciador de Fila:
1. Ver fila
2. Pausar processamento
3. Retomar processamento
4. Limpar fila
5. Priorizar job

Escolha: 1
```

---

### 22. `show_logs()` (Opção 9)

**O que faz:** Visualiza logs do sistema

**Comando:** Escolha opção 9 no menu

**API Call:**
```bash
GET /api/logs?lines=50
```

**Output Exemplo:**
```
[2026-02-02 10:30:45] INFO - Job job-001 iniciada
[2026-02-02 10:31:12] INFO - Test 1/50 passed
[2026-02-02 10:32:00] INFO - Test 25/50 passed
[2026-02-02 10:35:30] ERROR - Test 40 failed (timeout)
[2026-02-02 10:36:00] INFO - Retry iniciado
[2026-02-02 10:37:45] INFO - Test 40 passed (retry)
[2026-02-02 10:45:00] INFO - Job completada com sucesso
```

---

### 23. `run_tests()` (Opção 10)

**O que faz:** Executa suite de testes

**Comando:** Escolha opção 10 no menu

**Output Exemplo:**
```
════════════════════════════════════════════════════════
  Executando Testes
════════════════════════════════════════════════════════

Teste 1: Sintaxe bash... ✓
Teste 2: Funções críticas... ✓
Teste 3: Endpoints de API... ✓
Teste 4: Autenticação... ✓
Teste 5: Menu interativo... ✓
Teste 6: Dependências... ✓
Teste 7: Help option... ✓

Resultado: 7/7 testes passaram ✅
Taxa de Sucesso: 100%
```

---

### 24. `show_docs()` (Opção 11)

**O que faz:** Exibe documentação disponível

**Comando:** Escolha opção 11 no menu

**Output:**
```
Documentação Disponível:

📄 TEST-MANAGE-CERTIFICATIONS.md
   - Guia técnico completo (2.200+ linhas)

📄 QUICK-GUIDE-MANAGE-CERTIFICATIONS.md
   - Guia rápido para usuários (10 min)

📄 START-HERE.md
   - Ponto de entrada para iniciantes

📄 PRACTICAL-TESTING-RESULTS.md
   - Resultados dos testes práticos

📄 README.md
   - Visão geral do projeto
```

---

### 25. `restart_services()` (Opção 12)

**O que faz:** Reinicia serviços do sistema

**Comando:** Escolha opção 12 no menu

**Interação:**
```
Reiniciando serviços...

Parando serviços:
  ✓ Backend API
  ✓ Worker
  ✓ Redis

Iniciando serviços:
  ✓ Redis iniciado
  ✓ Backend API iniciado
  ✓ Worker iniciado

✓ Serviços reiniciados com sucesso!
```

---

### 26. `toggle_screen_lock()` (Opção 13)

**O que faz:** Bloqueia/desbloqueia tela

**Comando:** Escolha opção 13 no menu

**Função:**
- Se tela está desbloqueada → bloqueia
- Se tela está bloqueada → desbloqueia

---

### 27. `reconnect_backend()` (Opção 14)

**O que faz:** Tenta reconectar ao backend

**Comando:** Escolha opção 14 no menu

**Fluxo:**
```
Tentando reconectar ao backend...

Tentativa 1/3... ✗ Sem resposta
Tentativa 2/3... ✗ Sem resposta
Tentativa 3/3... ✓ Conectado!

✓ Backend reconectado com sucesso!
```

---

### 28. `start_services()` (Opção 15)

**O que faz:** Inicia serviços do sistema

**Comando:** Escolha opção 15 no menu

**Output:**
```
Iniciando serviços...

✓ Redis iniciado (PID: 1234)
✓ PostgreSQL iniciado (PID: 1235)
✓ Backend API iniciado (PID: 1236)
✓ Worker iniciado (PID: 1237)

Todos os serviços iniciados com sucesso!
```

---

### 29. `stop_services()` (Opção 16)

**O que faz:** Para todos os serviços

**Comando:** Escolha opção 16 no menu

**Interação:**
```
AVISO: Você está prestes a parar todos os serviços

Tem certeza? (s/n): s

Parando serviços...
✓ Backend API parado
✓ Worker parado
✓ PostgreSQL parado
✓ Redis parado

Todos os serviços foram parados.
```

---

## 📊 Resumo Rápido de Funções

| Função | Tipo | Descrição |
|--------|------|-----------|
| `print_success()` | Formatação | Mensagem verde com ✓ |
| `print_error()` | Formatação | Mensagem vermelha com ✗ |
| `print_info()` | Formatação | Mensagem azul com ℹ |
| `print_warning()` | Formatação | Mensagem amarela com ⚠ |
| `print_header()` | Formatação | Cabeçalho decorado |
| `check_dependencies()` | Verificação | Verifica curl, jq, psql |
| `check_backend()` | Verificação | Ping na API |
| `check_postgres()` | Verificação | Testa conexão DB |
| `check_redis()` | Verificação | Testa cache Redis |
| `check_services()` | Verificação | Verifica tudo |
| `login_to_api()` | Autenticação | Obtém token JWT |
| `api_call()` | API | Envolve chamadas HTTP |
| `show_main_menu()` | Menu | Exibe menu principal |
| `show_status()` | Menu (Op 1) | Status resumido |
| `create_job()` | Menu (Op 2) | Cria nova certificação |
| `list_jobs()` | Menu (Op 3) | Lista todas as jobs |
| `show_job_details()` | Menu (Op 4) | Detalhes de um job |
| `cancel_job()` | Menu (Op 5) | Cancela um job |
| `cleanup_jobs()` | Menu (Op 6) | Remove jobs antigas |
| `show_stats()` | Menu (Op 7) | Estatísticas |
| `manage_queue()` | Menu (Op 8) | Gerencia fila |
| `show_logs()` | Menu (Op 9) | Visualiza logs |
| `run_tests()` | Menu (Op 10) | Suite de testes |
| `show_docs()` | Menu (Op 11) | Documentação |
| `restart_services()` | Menu (Op 12) | Reinicia serviços |
| `toggle_screen_lock()` | Menu (Op 13) | Bloqueia tela |
| `reconnect_backend()` | Menu (Op 14) | Reconecta API |
| `start_services()` | Menu (Op 15) | Inicia serviços |
| `stop_services()` | Menu (Op 16) | Para serviços |

---

**Gerado:** 02/02/2026  
**Tipo:** Referência Prática Função por Função  
**Status:** ✅ Completo
