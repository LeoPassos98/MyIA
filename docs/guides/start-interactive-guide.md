# 🚀 Guia Completo: start_interactive.sh

> **Gerenciador Interativo de Serviços MyIA**  
> Versão: 2.0 | Data: 02/02/2026

---

## 📖 Índice

1. [Introdução](#-introdução)
2. [Melhorias Implementadas](#-melhorias-implementadas)
3. [Guia de Uso Rápido](#-guia-de-uso-rápido)
4. [Funcionalidades Detalhadas](#-funcionalidades-detalhadas)
5. [Exemplos de Uso](#-exemplos-de-uso)
6. [Troubleshooting](#-troubleshooting)
7. [Arquitetura Técnica](#-arquitetura-técnica)
8. [Manutenção](#-manutenção)

---

## 🎯 Introdução

O [`start_interactive.sh`](start_interactive.sh:1) é um script Bash interativo que gerencia todos os serviços do projeto MyIA de forma intuitiva e robusta. Ele oferece uma interface visual com menus, barras de progresso e validações automáticas.

### Propósito

- **Simplificar** o gerenciamento de múltiplos serviços
- **Validar** pré-requisitos e dependências automaticamente
- **Monitorar** saúde e status dos serviços em tempo real
- **Facilitar** troubleshooting com logs e diagnósticos claros

### Benefícios

✅ **Interface Intuitiva** - Menus visuais com checkboxes e cores  
✅ **Validações Automáticas** - Detecta problemas antes de iniciar  
✅ **Health Checks Robustos** - Verifica se serviços estão realmente funcionando  
✅ **Tratamento de Erros** - Diagnóstico claro com sugestões de solução  
✅ **Funcionalidades Avançadas** - Perfis, logs em tempo real, reinicialização individual  
✅ **Manutenibilidade** - Rotação de logs, modo debug, validação de dependências

---

## ✨ Melhorias Implementadas

O script passou por 5 fases de melhorias, totalizando **23 funcionalidades** implementadas.

### Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Validação de pré-requisitos** | ❌ Nenhuma | ✅ Completa (Docker, Node.js, npm, lsof) |
| **Validação de dependências** | ❌ Manual | ✅ Automática (habilita serviços necessários) |
| **Health checks** | ⚠️ Inconsistentes | ✅ Padronizados e robustos |
| **Detecção de falhas** | ❌ Falhas silenciosas | ✅ Diagnóstico claro com logs |
| **Tratamento de erros** | ❌ Mensagens genéricas | ✅ Sugestões específicas por serviço |
| **Shutdown de processos** | ⚠️ Kill forçado | ✅ Graceful shutdown (SIGTERM → SIGKILL) |
| **Reinicialização** | ❌ Parar tudo e reiniciar | ✅ Reiniciar serviço específico |
| **Visualização de logs** | ❌ Manual (cat/tail) | ✅ Menu interativo com tail -f |
| **Perfis de inicialização** | ❌ Nenhum | ✅ Salvar/carregar configurações |
| **Status dos serviços** | ⚠️ Básico | ✅ Detalhado (uptime, URLs, PIDs) |
| **Rotação de logs** | ❌ Manual | ✅ Automática (>50MB, mantém 5 versões) |
| **Modo debug** | ❌ Nenhum | ✅ Ativável via `--debug` |
| **Limpeza de logs** | ❌ Manual | ✅ Opção no menu com confirmação |

### Estatísticas Finais

- **Total de linhas:** 1766 (antes: ~600)
- **Funções criadas:** 35+
- **Melhorias implementadas:** 23
- **Fases concluídas:** 5
- **Tempo de implementação:** ~5 dias

---

## 🚀 Guia de Uso Rápido

### Inicialização Básica

```bash
# Iniciar o script
./start_interactive.sh

# Iniciar com modo debug
./start_interactive.sh --debug
# ou
./start_interactive.sh -d
```

### Menu Principal

```
╔════════════════════════════════════════════════════════════╗
║              🚀 MyIA - Gerenciador de Serviços             ║
╚════════════════════════════════════════════════════════════╝

Selecione os serviços que deseja iniciar:

 [ ] 1. Banco de Dados (Redis + PostgreSQL)
 [ ] 2. API do Sistema (Backend)
 [ ] 3. Interface do Usuário (Frontend)
 [ ] 4. Painel de Administração (Frontend Admin)
 [ ] 5. Processador de Tarefas (Worker)
 [ ] 6. Monitoramento (Grafana)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 [x] 7. INICIAR TUDO (Recomendado)
 [ ] 8. Status dos Serviços
 [ ] 9. Parar Todos os Serviços
 [ ] r. Reiniciar Serviço Específico
 [ ] l. Ver Logs em Tempo Real
 [ ] c. Limpar Logs Antigos
 [ ] s. Salvar Perfil Atual
 [ ] p. Carregar Perfil
 [ ] 0. Sair

Opção:
```

### Opções do Menu

| Opção | Ação | Descrição |
|-------|------|-----------|
| **1-6** | Toggle serviço | Marca/desmarca serviço para iniciar |
| **7** | Iniciar tudo | Inicia todos os serviços (recomendado) |
| **8** | Status | Mostra status detalhado de todos os serviços |
| **9** | Parar tudo | Para todos os serviços gracefully |
| **r** | Reiniciar | Menu para reiniciar serviço específico |
| **l** | Logs | Menu para visualizar logs em tempo real |
| **c** | Limpar logs | Deleta logs antigos com confirmação |
| **s** | Salvar perfil | Salva seleção atual como perfil |
| **p** | Carregar perfil | Carrega perfil salvo anteriormente |
| **0** | Sair | Encerra o script |
| **ENTER** | Iniciar selecionados | Inicia apenas serviços marcados |

### Atalhos de Teclado

- **r** - Reiniciar serviço específico
- **l** - Ver logs em tempo real
- **s** - Salvar perfil atual
- **p** - Carregar perfil
- **c** - Limpar logs antigos

### Modo Debug

Ative o modo debug para ver informações detalhadas durante a execução:

```bash
./start_interactive.sh --debug
```

**Output de exemplo:**
```
🐛 Modo Debug ativado

[DEBUG] Verificando logs para rotação (limite: 50MB)
[DEBUG] Iniciando backend em /home/user/MyIA/backend
[DEBUG] PID file: /home/user/MyIA/logs/backend.pid
[DEBUG] Comando: cd /home/user/MyIA/backend && npm run dev
[DEBUG] Backend iniciado com PID 12345
[DEBUG] Aguardando porta 3001 para Backend (timeout: 30s)
[DEBUG] Porta 3001 aberta após 5s
[DEBUG] Backend iniciado com sucesso na porta 3001
```

---

## 🔧 Funcionalidades Detalhadas

### Fase 1: Validações Automáticas

**Documentação completa:** [`FASE1_VALIDACOES_IMPLEMENTADAS.md`](FASE1_VALIDACOES_IMPLEMENTADAS.md:1)

#### 1.1 Verificação de Pré-requisitos

**Função:** [`check_prerequisites()`](start_interactive.sh:92)

Valida ferramentas necessárias antes de iniciar:

- ✅ **Docker** - Para Redis
- ✅ **npm** - Para instalar dependências
- ✅ **Node.js** - Versão 18+ obrigatória
- ✅ **lsof** - Para verificar portas

**Exemplo de erro:**
```
❌ Ferramentas ausentes: Docker npm
Instale as dependências e tente novamente.
```

#### 1.2 Validação de Diretórios

**Função:** [`validate_directories()`](start_interactive.sh:128)

Verifica estrutura do projeto:

- ✅ Diretórios existem (backend, frontend, frontend-admin, observability)
- ✅ `package.json` presente
- ✅ `node_modules` instalado (oferece instalação automática)

**Exemplo de interação:**
```
⚠️  Backend node_modules não encontrado.
Deseja instalar agora? (s/N): s
Instalando dependências do backend...
```

#### 1.3 Verificação de Portas

**Função:** [`check_port_available()`](start_interactive.sh:189)

Detecta conflitos de porta:

- ✅ Verifica se porta está em uso
- ✅ Mostra PID do processo ocupando a porta
- ✅ Oferece parar processo existente

**Exemplo:**
```
⚠️  Porta 3001 já está em uso (PID 12345)
Serviço: Backend
Deseja parar o processo existente? (s/N):
```

#### 1.4 Validação de Arquivos .env

**Função:** [`validate_env_files()`](start_interactive.sh:210)

Garante configurações corretas:

- ✅ Verifica se `backend/.env` existe
- ✅ Copia de `.env.example` se necessário
- ✅ Valida variáveis críticas (DATABASE_URL, JWT_SECRET)

#### 1.5 Limpeza de PIDs Órfãos

**Função:** [`cleanup_orphan_pids()`](start_interactive.sh:238)

Remove arquivos PID de processos mortos:

- ✅ Verifica se processo ainda existe
- ✅ Remove PID file se processo morreu
- ✅ Previne status inconsistente

**Exemplo:**
```
⚠️  Removendo PID órfão: worker.pid (PID 33480)
```

---

### Fase 2: Health Checks Robustos

**Documentação completa:** [`FASE2_HEALTH_CHECKS_IMPLEMENTADOS.md`](FASE2_HEALTH_CHECKS_IMPLEMENTADOS.md:1)

#### 2.1 Função Genérica de Espera por Porta

**Função:** [`wait_for_port()`](start_interactive.sh:359)

Aguarda porta estar realmente respondendo:

- ✅ Verifica com `lsof -ti:$port`
- ✅ Detecta se processo morreu durante inicialização
- ✅ Timeout configurável (padrão 30s)
- ✅ Mensagens de erro claras

**Parâmetros:**
```bash
wait_for_port <port> <service_name> [max_wait] [pid_file]
```

**Exemplo de uso:**
```bash
wait_for_port 3001 "Backend" 30 "$PID_FILE_BACKEND"
```

#### 2.2 Health Check do Worker

**Função:** [`start_worker_service()`](start_interactive.sh:891)

- ✅ Verifica porta 3004 (health endpoint)
- ✅ Detecta morte durante inicialização
- ✅ Progresso visual (10% → 30% → 60% → 100%)

#### 2.3 Health Check do Database (Redis)

**Função:** [`start_database()`](start_interactive.sh:726)

- ✅ Usa `docker exec myia-redis redis-cli ping`
- ✅ Loop de até 10 segundos
- ✅ Mensagem clara se Redis não responder

#### 2.4 Health Checks Padronizados

Todos os serviços Node.js usam [`wait_for_port()`](start_interactive.sh:359):

- ✅ Backend (porta 3001)
- ✅ Frontend (porta 3000)
- ✅ Frontend Admin (porta 3003)
- ✅ Worker (porta 3004)

---

### Fase 3: Tratamento de Erros

**Documentação completa:** [`FASE3_TRATAMENTO_ERROS_IMPLEMENTADO.md`](FASE3_TRATAMENTO_ERROS_IMPLEMENTADO.md:1)

#### 3.1 Exibição de Logs de Erro

**Função:** [`show_error_logs()`](start_interactive.sh:397)

Mostra diagnóstico claro quando serviço falha:

- ✅ Box formatado com título em vermelho
- ✅ Últimas 10 linhas do log de erro
- ✅ Sugestões específicas por serviço

**Exemplo:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Backend falhou ao iniciar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Últimas 10 linhas do log de erro:

  Error: Cannot find module 'express'
  at Function.Module._resolveFilename
  ...

💡 Sugestões:
  • Verifique se as dependências estão instaladas: cd backend && npm install
  • Verifique o arquivo .env: cat backend/.env
  • Veja o log completo: cat logs/backend.err.log
```

#### 3.2 Graceful Shutdown

**Função:** [`graceful_kill()`](start_interactive.sh:443)

Para processos de forma elegante:

- ✅ Envia SIGTERM primeiro (graceful)
- ✅ Aguarda até timeout (padrão 10s)
- ✅ Força com SIGKILL se necessário
- ✅ Mensagens coloridas e informativas

**Fluxo:**
```
1. Verificar se processo existe
2. Enviar SIGTERM
3. Loop de espera (1s por iteração)
4. Se parou → "✓ parado gracefully"
5. Se timeout → Enviar SIGKILL
6. Verificar novamente → Sucesso ou erro
```

**Exemplo de output:**
```
Parando Backend (PID 12345)...
✓ Backend parado gracefully
```

#### 3.3 Pausas Após Erros

**Função:** [`start_selected_services()`](start_interactive.sh:982)

- ✅ Pausa após cada erro
- ✅ Usuário pode ler logs antes de prosseguir
- ✅ Pressionar ENTER para continuar

---

### Fase 4: Melhorias de UX

**Documentação completa:** [`FASE4_UX_MELHORIAS_IMPLEMENTADO.md`](FASE4_UX_MELHORIAS_IMPLEMENTADO.md:1)

#### 4.1 Reiniciar Serviço Específico (Opção `r`)

**Função:** [`restart_service_menu()`](start_interactive.sh:1073)

Menu interativo para reiniciar serviços individualmente:

- ✅ 5 opções: Backend, Frontend, Frontend Admin, Worker, Grafana
- ✅ Parada graceful + aguarda 2s + reinício
- ✅ Barra de progresso durante reinicialização

**Funções de reinicialização:**
- [`restart_backend()`](start_interactive.sh:1119)
- [`restart_frontend()`](start_interactive.sh:1140)
- [`restart_frontend_admin()`](start_interactive.sh:1161)
- [`restart_worker()`](start_interactive.sh:1182)
- [`restart_grafana()`](start_interactive.sh:1203)

#### 4.2 Ver Logs em Tempo Real (Opção `l`)

**Função:** [`view_logs_menu()`](start_interactive.sh:1229)

Menu para visualizar logs:

- ✅ 8 opções de logs (stdout/stderr de cada serviço)
- ✅ Usa `tail -f` para tempo real
- ✅ Ctrl+C para sair sem encerrar script
- ✅ Cria arquivo se não existir

**Logs disponíveis:**
1. Backend (stdout)
2. Backend (stderr)
3. Frontend (stdout)
4. Frontend (stderr)
5. Worker (stdout)
6. Worker (stderr)
7. Frontend Admin (stdout)
8. Frontend Admin (stderr)

#### 4.3 Sistema de Perfis (Opções `s` e `p`)

##### Salvar Perfil (Opção `s`)

**Função:** [`save_profile()`](start_interactive.sh:1365)

- ✅ Salva seleções atuais
- ✅ Armazena em `.profiles/`
- ✅ Formato: `nome.profile`

**Formato do arquivo:**
```bash
# MyIA Service Profile: desenvolvimento
# Created: Sat Feb  2 10:30:00 -03 2026
1=1  # Banco de Dados
2=1  # Backend
3=1  # Frontend
4=0  # Frontend Admin
5=1  # Worker
6=0  # Grafana
```

##### Carregar Perfil (Opção `p`)

**Função:** [`load_profile()`](start_interactive.sh:1409)

- ✅ Lista perfis disponíveis
- ✅ Seleção interativa
- ✅ Aplica seleções automaticamente

#### 4.4 Status Melhorado com Uptime e URLs

**Funções:** [`get_uptime()`](start_interactive.sh:1496), [`show_status()`](start_interactive.sh:1541)

Status detalhado de cada serviço:

- ✅ Uptime formatado (horas, minutos, segundos)
- ✅ URLs de acesso para serviços web
- ✅ PIDs dos processos

**Exemplo:**
```
Backend (porta 3001): ✓ Rodando (PID 12345, uptime: 2h 15m)
   → http://localhost:3001

Frontend (porta 3000): ✓ Rodando (PID 12346, uptime: 45m 30s)
   → http://localhost:3000

Frontend Admin (porta 3003): ✓ Rodando (PID 12347, uptime: 30s)
   → http://localhost:3003

Worker: ✓ Rodando (PID 12348, uptime: 1h 5m)

Grafana (porta 3002): ✓ Rodando
   → http://localhost:3002 (admin/admin)
```

---

### Fase 5: Manutenibilidade

**Documentação completa:** [`FASE5_MANUTENIBILIDADE_IMPLEMENTADO.md`](FASE5_MANUTENIBILIDADE_IMPLEMENTADO.md:1)

#### 5.1 Modo Debug

**Variável:** `DEBUG_MODE` (linha 50)  
**Função:** [`debug_log()`](start_interactive.sh:52)

Ativação:
```bash
./start_interactive.sh --debug
# ou
./start_interactive.sh -d
```

Características:
- ✅ Mensagens em cinza com prefixo `[DEBUG]`
- ✅ Redirecionadas para stderr
- ✅ Instrumentação em funções críticas

**Funções instrumentadas:**
- [`wait_for_port()`](start_interactive.sh:359)
- [`graceful_kill()`](start_interactive.sh:443)
- [`start_backend_service()`](start_interactive.sh:771)
- [`start_worker_service()`](start_interactive.sh:891)

#### 5.2 Rotação Automática de Logs

**Função:** [`rotate_logs()`](start_interactive.sh:257)

Gerenciamento automático de logs:

- ✅ Limite: 50MB por arquivo
- ✅ Mantém até 5 versões rotacionadas (`.log.1` até `.log.5`)
- ✅ Execução automática ao iniciar script
- ✅ Rotaciona todos os `.log` no diretório `logs/`

**Funcionamento:**
1. Verifica tamanho de cada `.log`
2. Se > 50MB:
   - Deleta `.log.5` se existir
   - Rotaciona arquivos (`.log.4` → `.log.5`, etc.)
   - Move log atual para `.log.1`
   - Cria novo arquivo vazio

**Exemplo:**
```
⚠️  Rotacionando log: backend.out.log (52MB)
⚠️  Rotacionando log: worker.err.log (68MB)
```

#### 5.3 Validação de Dependências

**Função:** [`validate_service_dependencies()`](start_interactive.sh:299)

Habilita automaticamente serviços necessários:

**Dependências:**
- **Backend** → requer Database
- **Worker** → requer Backend → requer Database
- **Frontend** → requer Backend → requer Database
- **Frontend Admin** → requer Backend → requer Database

**Exemplo:**
```
⚠️  Frontend requer Backend. Habilitando Backend automaticamente...
⚠️  Backend requer Database. Habilitando Database automaticamente...
```

#### 5.4 Limpar Logs Antigos (Opção `c`)

**Função:** [`clean_old_logs()`](start_interactive.sh:1316)

Limpeza manual de logs:

- ✅ Mostra tamanho total do diretório
- ✅ Lista todos os arquivos `.log` e `.log.*`
- ✅ Pede confirmação antes de deletar
- ✅ Deleta todos os logs (incluindo rotacionados)

**Exemplo:**
```
🗑️  Limpar Logs Antigos

Tamanho total dos logs: 245M

Arquivos de log encontrados:
  • backend.out.log (52M)
  • backend.err.log (12M)
  • backend.out.log.1 (50M)
  • worker.out.log (68M)
  • worker.err.log (23M)
  • frontend.out.log (40M)

Deseja deletar todos os logs? (s/N):
```

---

## 💡 Exemplos de Uso

### Cenário 1: Desenvolvedor Frontend

**Objetivo:** Trabalhar apenas no frontend, sem Grafana ou Worker.

**Passos:**
1. Iniciar o script:
   ```bash
   ./start_interactive.sh
   ```

2. Selecionar serviços necessários:
   - Pressionar `3` (Frontend)
   - Pressionar ENTER

3. O script habilita automaticamente:
   ```
   ⚠️  Frontend requer Backend. Habilitando Backend automaticamente...
   ⚠️  Backend requer Database. Habilitando Database automaticamente...
   ```

4. Salvar como perfil:
   - Pressionar `s`
   - Digitar: `frontend-dev`

5. Próximas vezes:
   - Pressionar `p`
   - Selecionar `frontend-dev`
   - Pressionar ENTER

---

### Cenário 2: Debug de Erros

**Objetivo:** Investigar por que o backend está falhando.

**Passos:**
1. Iniciar com modo debug:
   ```bash
   ./start_interactive.sh --debug
   ```

2. Selecionar Backend (opção `2`) e pressionar ENTER

3. Observar mensagens de debug:
   ```
   [DEBUG] Iniciando backend em /home/user/MyIA/backend
   [DEBUG] PID file: /home/user/MyIA/logs/backend.pid
   [DEBUG] Comando: cd /home/user/MyIA/backend && npm run dev
   [DEBUG] Backend iniciado com PID 12345
   [DEBUG] Aguardando porta 3001 para Backend (timeout: 30s)
   ```

4. Se falhar, ver box de erro com logs e sugestões

5. Ver logs em tempo real:
   - Pressionar `l`
   - Selecionar opção `2` (Backend stderr)
   - Observar erros em tempo real
   - Ctrl+C para sair

---

### Cenário 3: Reiniciar Serviço Específico

**Objetivo:** Reiniciar apenas o worker após mudanças no código.

**Passos:**
1. No menu principal, pressionar `r`

2. Selecionar opção `4` (Worker)

3. Observar:
   ```
   🔄 Reiniciando Worker...
   
   Parando Worker (PID 12348)...
   ✓ Worker parado gracefully
   
   [Barra de progresso durante reinicialização]
   
   ✓ Worker iniciado com sucesso
   ```

4. Pressionar ENTER para voltar ao menu

---

### Cenário 4: Gerenciar Logs

**Objetivo:** Limpar logs antigos para liberar espaço.

**Passos:**
1. Verificar tamanho dos logs:
   - Pressionar `c`
   - Ver tamanho total e lista de arquivos

2. Decidir se limpa:
   ```
   Tamanho total dos logs: 245M
   
   Arquivos de log encontrados:
     • backend.out.log (52M)
     • backend.err.log (12M)
     • backend.out.log.1 (50M)
     ...
   
   Deseja deletar todos os logs? (s/N):
   ```

3. Confirmar com `s` ou cancelar com `n`

---

## 🔍 Troubleshooting

### Problema: "Ferramentas ausentes: Docker"

**Causa:** Docker não está instalado ou não está no PATH.

**Solução:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# Verificar instalação
docker --version
```

---

### Problema: "Node.js versão 18+ necessária"

**Causa:** Versão do Node.js é menor que 18.

**Solução:**
```bash
# Verificar versão atual
node -v

# Instalar Node.js 18+ via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

### Problema: "Backend node_modules não encontrado"

**Causa:** Dependências não foram instaladas.

**Solução:**
O script oferece instalação automática:
```
⚠️  Backend node_modules não encontrado.
Deseja instalar agora? (s/N): s
```

Ou manualmente:
```bash
cd backend
npm install
```

---

### Problema: "Porta 3001 já está em uso"

**Causa:** Outro processo está usando a porta.

**Solução:**
O script oferece parar o processo:
```
⚠️  Porta 3001 já está em uso (PID 12345)
Serviço: Backend
Deseja parar o processo existente? (s/N): s
```

Ou manualmente:
```bash
# Identificar processo
lsof -ti:3001

# Parar processo
kill $(lsof -ti:3001)
```

---

### Problema: "Backend morreu durante inicialização"

**Causa:** Erro no código ou configuração.

**Solução:**
1. Ver logs de erro exibidos automaticamente
2. Seguir sugestões do box de erro
3. Ver log completo:
   ```bash
   cat logs/backend.err.log
   ```
4. Verificar `.env`:
   ```bash
   cat backend/.env
   ```
5. Usar modo debug:
   ```bash
   ./start_interactive.sh --debug
   ```

---

### Problema: "Redis não respondeu após 10 segundos"

**Causa:** Docker não conseguiu iniciar Redis.

**Solução:**
1. Verificar se Docker está rodando:
   ```bash
   docker ps
   ```

2. Ver logs do container:
   ```bash
   docker logs myia-redis
   ```

3. Reiniciar Docker:
   ```bash
   sudo systemctl restart docker
   ```

4. Remover container e tentar novamente:
   ```bash
   docker rm -f myia-redis
   ./start_interactive.sh
   ```

---

### Problema: Logs estão muito grandes

**Causa:** Serviços rodando por muito tempo sem rotação.

**Solução:**
1. Usar opção `c` no menu para limpar logs
2. Ou manualmente:
   ```bash
   rm -f logs/*.log logs/*.log.*
   ```

**Prevenção:**
- Rotação automática ativa (>50MB)
- Mantém 5 versões antigas
- Limpar periodicamente com opção `c`

---

### Problema: Serviço não para com opção 9

**Causa:** Processo travado ou não respondendo a SIGTERM.

**Solução:**
O script tenta graceful shutdown e depois força:
```
Parando Backend (PID 12345)...
⚠️  Backend não respondeu, forçando parada...
✓ Backend parado (forçado)
```

Se ainda assim não parar:
```bash
# Forçar parada manual
kill -9 $(cat logs/backend.pid)
rm logs/backend.pid
```

---

### Problema: Perfil não carrega corretamente

**Causa:** Arquivo de perfil corrompido.

**Solução:**
1.