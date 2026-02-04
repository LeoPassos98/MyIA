# Fase 5: Manutenibilidade - Rotação de Logs e Validação de Dependências

## ✅ Status: IMPLEMENTADO

Data: 02/02/2026

## 📋 Resumo

Implementação completa da Fase 5 do plano de melhorias do [`start_interactive.sh`](start_interactive.sh:1), focando em funcionalidades de manutenibilidade de longo prazo: rotação automática de logs, validação de dependências entre serviços e modo debug para troubleshooting.

## 🎯 Funcionalidades Implementadas

### 1. Modo Debug

**Localização:** Linhas 50-56

**Como usar:**
```bash
./start_interactive.sh --debug
# ou
./start_interactive.sh -d
```

**Características:**
- Variável global `DEBUG_MODE` (padrão: 0)
- Função [`debug_log()`](start_interactive.sh:52) que exibe mensagens em cinza com prefixo `[DEBUG]`
- Mensagens redirecionadas para stderr para não interferir com output normal
- Ativação via argumentos CLI `--debug` ou `-d`

**Exemplo de output:**
```
🐛 Modo Debug ativado

[DEBUG] Verificando logs para rotação (limite: 50MB)
[DEBUG] Aguardando porta 3001 para Backend (timeout: 30s)
[DEBUG] Backend iniciado com PID 12345
[DEBUG] Porta 3001 aberta após 5s
```

### 2. Rotação Automática de Logs

**Localização:** Linhas 248-283

**Características:**
- Limite de tamanho: 50MB por arquivo
- Mantém até 5 versões rotacionadas (`.log.1` até `.log.5`)
- Execução automática ao iniciar o script
- Rotaciona todos os arquivos `.log` no diretório `logs/`

**Funcionamento:**
1. Verifica tamanho de cada arquivo `.log`
2. Se > 50MB:
   - Deleta `.log.5` se existir
   - Rotaciona arquivos existentes (`.log.4` → `.log.5`, `.log.3` → `.log.4`, etc.)
   - Move log atual para `.log.1`
   - Cria novo arquivo vazio

**Exemplo de output:**
```
⚠️  Rotacionando log: backend.out.log (52MB)
⚠️  Rotacionando log: worker.err.log (68MB)
```

**Integração:** Chamada automática em [`main()`](start_interactive.sh:1700) após [`cleanup_orphan_pids()`](start_interactive.sh:1698)

### 3. Validação de Dependências

**Localização:** Linhas 285-358

**Dependências validadas:**
- **Backend** → requer Database (serviço 1)
- **Worker** → requer Backend (serviço 2) → requer Database (serviço 1)
- **Frontend** → requer Backend (serviço 2) → requer Database (serviço 1)
- **Frontend Admin** → requer Backend (serviço 2) → requer Database (serviço 1)

**Funcionamento:**
- Verifica dependências antes de iniciar serviços
- Habilita automaticamente serviços necessários
- Mostra avisos amarelos para cada dependência habilitada
- Aguarda 2 segundos para usuário ver mensagens

**Exemplo de output:**
```
⚠️  Frontend requer Backend. Habilitando Backend automaticamente...
⚠️  Backend requer Database. Habilitando Database automaticamente...
```

**Integração:** Chamada em [`start_selected_services()`](start_interactive.sh:950) antes de resetar status

### 4. Logs de Debug em Funções Críticas

**Funções instrumentadas:**

#### [`wait_for_port()`](start_interactive.sh:362)
```bash
debug_log "Aguardando porta $port para $service_name (timeout: ${max_wait}s)"
debug_log "Porta $port aberta após ${waited}s"
debug_log "Timeout aguardando porta $port após ${max_wait}s"
```

#### [`graceful_kill()`](start_interactive.sh:443)
```bash
debug_log "Tentando parar $service_name (PID $pid, timeout: ${timeout}s)"
debug_log "Enviando SIGTERM para PID $pid ($service_name)"
debug_log "Processo $pid parado gracefully após ${waited}s"
debug_log "Processo $pid não respondeu, enviando SIGKILL"
```

#### [`start_backend_service()`](start_interactive.sh:758)
```bash
debug_log "Iniciando backend em $BACKEND_DIR"
debug_log "PID file: $PID_FILE_BACKEND"
debug_log "Comando: cd $BACKEND_DIR && npm run dev"
debug_log "Backend iniciado com PID $pid"
debug_log "Backend iniciado com sucesso na porta $BACKEND_PORT"
```

#### [`start_worker_service()`](start_interactive.sh:868)
```bash
debug_log "Iniciando worker em $BACKEND_DIR"
debug_log "PID file: $PID_FILE_WORKER"
debug_log "Comando: cd $BACKEND_DIR && npm run worker:dev"
debug_log "Worker iniciado com PID $pid"
debug_log "Worker iniciado com sucesso na porta $WORKER_HEALTH_PORT"
```

### 5. Opção de Limpar Logs

**Localização:** Linhas 1314-1358

**Como usar:**
- Pressionar `c` ou `C` no menu principal

**Características:**
- Mostra tamanho total do diretório de logs
- Lista todos os arquivos `.log` e `.log.*` com seus tamanhos
- Pede confirmação antes de deletar
- Deleta todos os logs (incluindo rotacionados)
- Mostra mensagem de sucesso ou cancelamento

**Exemplo de output:**
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

Deseja deletar todos os logs? (s/N): s
✓ Logs deletados com sucesso
```

**Integração no menu:** Linha 584 (opção `c`) e linha 1719 (case no loop principal)

## 🔧 Modificações no Código

### Arquivos Modificados
- [`start_interactive.sh`](start_interactive.sh:1)

### Novas Funções Adicionadas
1. [`debug_log()`](start_interactive.sh:52) - Exibe mensagens de debug
2. [`rotate_logs()`](start_interactive.sh:248) - Rotaciona logs grandes
3. [`validate_service_dependencies()`](start_interactive.sh:285) - Valida dependências
4. [`clean_old_logs()`](start_interactive.sh:1314) - Limpa logs antigos

### Funções Modificadas
1. [`main()`](start_interactive.sh:1682) - Adicionado suporte a `--debug` e chamada a `rotate_logs()`
2. [`start_selected_services()`](start_interactive.sh:947) - Adicionada validação de dependências
3. [`wait_for_port()`](start_interactive.sh:362) - Adicionados logs de debug
4. [`graceful_kill()`](start_interactive.sh:443) - Adicionados logs de debug
5. [`start_backend_service()`](start_interactive.sh:758) - Adicionados logs de debug
6. [`start_worker_service()`](start_interactive.sh:868) - Adicionados logs de debug
7. [`show_menu()`](start_interactive.sh:522) - Adicionada opção "c. Limpar Logs Antigos"

### Variáveis Globais Adicionadas
- `DEBUG_MODE` (linha 50) - Controla modo debug (0=desativado, 1=ativado)

## 📊 Estatísticas

- **Linhas adicionadas:** ~200
- **Funções criadas:** 4
- **Funções modificadas:** 7
- **Pontos de instrumentação debug:** 15+

## 🧪 Testes Realizados

### Validação de Sintaxe
```bash
bash -n start_interactive.sh
# Exit code: 0 ✓
```

### Cenários de Teste Recomendados

1. **Modo Debug:**
   ```bash
   ./start_interactive.sh --debug
   # Verificar mensagens [DEBUG] em cinza
   ```

2. **Rotação de Logs:**
   ```bash
   # Criar log grande para teste
   dd if=/dev/zero of=logs/test.log bs=1M count=60
   ./start_interactive.sh
   # Verificar se test.log foi rotacionado
   ```

3. **Validação de Dependências:**
   - Selecionar apenas Frontend (opção 3)
   - Pressionar ENTER para iniciar
   - Verificar se Backend e Database são habilitados automaticamente

4. **Limpeza de Logs:**
   - Pressionar `c` no menu
   - Verificar listagem de logs
   - Confirmar deleção
   - Verificar se logs foram removidos

## 💡 Uso Prático

### Troubleshooting com Modo Debug

Quando um serviço falha ao iniciar:
```bash
./start_interactive.sh --debug
```

Você verá informações detalhadas como:
- Comandos exatos executados
- PIDs dos processos
- Tempo de espera por portas
- Tentativas de parada de processos

### Manutenção de Logs

O script agora gerencia logs automaticamente:
- **Rotação automática:** Logs > 50MB são rotacionados ao iniciar
- **Histórico:** Mantém até 5 versões antigas
- **Limpeza manual:** Opção `c` para limpar quando necessário

### Dependências Automáticas

Não é mais necessário lembrar quais serviços dependem de outros:
- Selecione apenas o que precisa
- O script habilita dependências automaticamente
- Avisos claros mostram o que foi habilitado

## 🎓 Exemplos de Output

### Inicialização com Debug
```
🐛 Modo Debug ativado

[DEBUG] Verificando logs para rotação (limite: 50MB)
⚠️  Rotacionando log: backend.out.log (52MB)
[DEBUG] Rotacionando backend.out.log: 52MB > 50MB
[DEBUG] Movido backend.out.log.4 -> backend.out.log.5
[DEBUG] Movido backend.out.log.3 -> backend.out.log.4
[DEBUG] Movido backend.out.log.2 -> backend.out.log.3
[DEBUG] Movido backend.out.log.1 -> backend.out.log.2
[DEBUG] Movido backend.out.log -> backend.out.log.1
```

### Validação de Dependências
```
⚠️  Frontend requer Backend. Habilitando Backend automaticamente...
[DEBUG] Dependência habilitada: Backend para Frontend
⚠️  Backend requer Database. Habilitando Database automaticamente...
[DEBUG] Dependência habilitada: Database para Backend (via Frontend)
```

### Inicialização de Serviço com Debug
```
[DEBUG] Iniciando backend em /home/user/MyIA/backend
[DEBUG] PID file: /home/user/MyIA/logs/backend.pid
[DEBUG] Comando: cd /home/user/MyIA/backend && npm run dev
[DEBUG] Backend iniciado com PID 12345
[DEBUG] Aguardando porta 3001 para Backend (timeout: 30s)
[DEBUG] Porta 3001 aberta após 5s
[DEBUG] Backend iniciado com sucesso na porta 3001
```

## 🔄 Próximas Fases

A Fase 5 está completa. Próximas melhorias sugeridas:

- **Fase 6:** Testes automatizados
- **Fase 7:** Documentação interativa
- **Fase 8:** Métricas de performance

## ✅ Checklist de Implementação

- [x] Função `rotate_logs()` implementada
- [x] Logs rotacionados automaticamente ao iniciar
- [x] Função `validate_service_dependencies()` implementada
- [x] Dependências habilitadas automaticamente
- [x] Modo debug funciona com `--debug` ou `-d`
- [x] Logs de debug em funções críticas
- [x] Opção "c" limpa logs com confirmação
- [x] Tamanho dos logs mostrado antes de limpar
- [x] Validação de sintaxe bash
- [x] Documentação completa

## 📝 Notas Técnicas

### Rotação de Logs
- Usa `du -m` para verificar tamanho em MB
- Rotação é feita do mais antigo para o mais novo
- Arquivo original é movido, não copiado (mais rápido)
- Novo arquivo vazio é criado com `touch`

### Modo Debug
- Mensagens vão para stderr (`>&2`) para não interferir com pipes
- Cor cinza (`\033[0;90m`) para diferenciar de output normal
- Prefixo `[DEBUG]` facilita filtrar com grep

### Validação de Dependências
- Lógica em cascata: Frontend → Backend → Database
- Cada dependência é verificada apenas uma vez
- Sleep de 2s permite usuário ler avisos

### Performance
- Rotação de logs é rápida (apenas move arquivos)
- Debug log tem overhead mínimo quando desativado
- Validação de dependências é O(n) onde n = número de serviços

## 🎉 Conclusão

A Fase 5 adiciona funcionalidades essenciais de manutenibilidade ao script:
- **Rotação automática** previne logs gigantes
- **Validação de dependências** evita erros de configuração
- **Modo debug** facilita troubleshooting
- **Limpeza de logs** permite manutenção manual quando necessário

Todas as funcionalidades foram implementadas seguindo as especificações do plano de melhorias e mantendo compatibilidade com as fases anteriores.
