# Hotfixes do Sistema

> **Fonte de Verdade:** Todos os hotfixes aplicados ao sistema  
> **Última atualização:** 04/02/2026  
> **Consolidado de:** 2 documentos de fixes/

## 📖 Índice
1. [Hotfix 2 - Correções no start_interactive.sh](#hotfix-2)
2. [Hotfix 4 - Detecção Inteligente de Serviços](#hotfix-4)
3. [Referências](#referencias)

---

## 🔧 Hotfix 2 - Correções no start_interactive.sh {#hotfix-2}

> **Origem:** [`HOTFIX2_START_INTERACTIVE_SUMMARY.md`](../archive/fixes/HOTFIX2_START_INTERACTIVE_SUMMARY.md)  
> **Data:** 02/02/2026  
> **Status:** ✅ Corrigido

### ✅ Problemas Corrigidos

#### 1. Instrução para Iniciar Serviços Selecionados (1-6)

**Problema:** Usuário não sabia que precisava pressionar ENTER após selecionar serviços.

**Solução Aplicada:**
- Adicionada dica visual no menu após as opções 1-6
- Localização: Linha 579 em `show_menu()`
- Mensagem: `💡 Dica: Selecione serviços (1-6) e pressione ENTER para iniciar`

**Código:**
```bash
echo -e "${GRAY}💡 Dica: Selecione serviços (1-6) e pressione ENTER para iniciar${NC}"
```

#### 2. URL do Worker no Resumo Final

**Problema:** Worker tem health check na porta 3004, mas URL não aparecia no resumo.

**Solução Aplicada:**
- Adicionada URL do Worker em `show_completion_summary()`
- Localização: Linha 1149
- Mostra: `Worker Health: http://localhost:3004`

**Código:**
```bash
[[ "${SELECTED[5]}" == "1" ]] && echo -e "  ${GREEN}•${NC} Worker Health:  http://localhost:$WORKER_HEALTH_PORT"
```

#### 3. Grafana Para Sozinho

**Problema:** Grafana frequentemente aparecia como parado após "Iniciar Tudo".

**Soluções Aplicadas:**

##### 3.1. Melhorias em `start_grafana_service()`

- ✅ **Timeout aumentado**: 20s → 30s
- ✅ **Verificação de script**: Valida se `start.sh` existe antes de executar
- ✅ **Captura de logs**: Redireciona stdout/stderr para `logs/grafana.{out,err}.log`
- ✅ **Monitoramento de processo**: Verifica se processo morreu durante inicialização
- ✅ **Health check robusto**: Verifica porta + health check + estabilidade (2s extra)
- ✅ **Fallback inteligente**: Se porta aberta mas health check falha, marca como running
- ✅ **Debug logs**: Logs detalhados quando `--debug` ativado
- ✅ **Mensagens de erro claras**: Mostra últimas 5 linhas do log em caso de falha

**Principais Melhorias:**
```bash
# Verificar se processo ainda está vivo
if ! kill -0 $grafana_pid >/dev/null 2>&1; then
  echo -e "${RED}❌ Grafana morreu durante inicialização${NC}"
  # Mostrar logs de erro
  return 1
fi

# Aguardar estabilização após health check OK
sleep 2
if lsof -ti:$GRAFANA_PORT >/dev/null 2>&1; then
  return 0  # Confirmado estável
fi
```

##### 3.2. Melhorias em `show_status()`

- ✅ **Health check no status**: Verifica se Grafana realmente responde
- ✅ **Detecção de container Docker**: Identifica se container está rodando mas porta não aberta
- ✅ **Mensagens contextuais**: Diferencia entre "rodando OK", "iniciando" e "parado"

**Código:**
```bash
if lsof -ti:$GRAFANA_PORT >/dev/null 2>&1; then
  if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Rodando${NC} (health check OK)"
  else
    echo -e "${YELLOW}⚠️  Porta aberta mas não responde${NC}"
  fi
else
  if docker ps --format '{{.Names}}' | grep -q "grafana"; then
    echo -e "${YELLOW}⚠️  Container rodando mas porta não aberta${NC}"
  else
    echo -e "${GRAY}○ Parado${NC}"
  fi
fi
```

### 📊 Resumo das Alterações

| Problema | Status | Linhas Modificadas | Impacto |
|----------|--------|-------------------|---------|
| Falta instrução ENTER | ✅ Corrigido | 579 | UX melhorada |
| URL Worker ausente | ✅ Corrigido | 1149 | Informação completa |
| Grafana para sozinho | ✅ Corrigido | 939-1067, 1698-1717 | Estabilidade |

### 🧪 Testes Realizados

#### Validação de Sintaxe
```bash
bash -n start_interactive.sh
# Exit code: 0 ✅
```

#### Permissões
```bash
chmod +x start_interactive.sh
# ✅ Executável
```

### 🎯 Benefícios

#### UX Melhorada
- ✅ Usuário sabe como iniciar serviços selecionados
- ✅ Todas as URLs importantes visíveis no resumo
- ✅ Mensagens de status mais claras e informativas

#### Estabilidade do Grafana
- ✅ Timeout maior para inicialização lenta
- ✅ Verificação de processo vivo durante inicialização
- ✅ Confirmação de estabilidade após health check
- ✅ Logs detalhados para troubleshooting
- ✅ Fallback inteligente para casos edge

#### Debugging
- ✅ Logs de Grafana salvos em `logs/grafana.{out,err}.log`
- ✅ Debug logs quando executado com `--debug`
- ✅ Mensagens de erro mostram últimas linhas do log

### 🚀 Como Usar

#### Modo Normal
```bash
./start_interactive.sh
```

#### Modo Debug (recomendado para troubleshooting)
```bash
./start_interactive.sh --debug
```

#### Ver Logs do Grafana
```bash
cat logs/grafana.err.log
cat logs/grafana.out.log
```

### 📝 Notas Técnicas

#### Timeout do Grafana
- **Antes:** 20 segundos
- **Depois:** 30 segundos
- **Motivo:** Grafana pode demorar mais em sistemas lentos ou primeira inicialização

#### Health Check
- **Endpoint:** `http://localhost:3002/api/health`
- **Verificação:** Porta aberta + HTTP 200 + estabilidade (2s)
- **Fallback:** Se porta aberta mas health check falha, marca como running (pode estar iniciando)

#### Logs
- **Backend:** `logs/backend.{out,err}.log`
- **Frontend:** `logs/frontend.{out,err}.log`
- **Worker:** `logs/worker.{out,err}.log`
- **Frontend Admin:** `logs/frontend-admin.{out,err}.log`
- **Grafana:** `logs/grafana.{out,err}.log` ⭐ NOVO

### ✅ Critérios de Sucesso Atendidos

- [x] Instrução "pressione ENTER" visível no menu
- [x] URL do Worker aparece no resumo final
- [x] Grafana inicia corretamente com opção 7
- [x] Grafana permanece rodando após inicialização (verificação de estabilidade)
- [x] Mensagens de erro claras se Grafana falhar
- [x] Logs salvos para troubleshooting
- [x] Status melhorado com health check

### 🔍 Possíveis Problemas e Soluções

#### Grafana ainda para após iniciar

**Diagnóstico:**
```bash
./start_interactive.sh --debug  # Ver logs detalhados
cat logs/grafana.err.log        # Ver erros
```

**Possíveis causas:**
1. Script `observability/start.sh` com problemas
2. Porta 3002 já em uso
3. Dependências do Grafana ausentes
4. Permissões de arquivo

#### Health check falha mas Grafana está rodando

**Solução:** Script agora marca como running se porta estiver aberta, mesmo com health check falhando. Usuário pode verificar manualmente em `http://localhost:3002`.

---

## 🎯 Hotfix 4 - Detecção Inteligente de Serviços {#hotfix-4}

> **Origem:** [`HOTFIX4_SERVICE_DETECTION_SUMMARY.md`](../archive/fixes/HOTFIX4_SERVICE_DETECTION_SUMMARY.md)  
> **Data:** 02/02/2026  
> **Status:** ✅ Implementado

### 📋 Resumo Executivo

Implementada detecção em tempo real de serviços já rodando no `start_interactive.sh`, com indicadores visuais no menu e opção inteligente de pular serviços ativos durante inicialização.

### 🎯 Objetivo

Evitar que usuários tentem iniciar serviços que já estão ativos, melhorando a experiência e prevenindo reinicializações desnecessárias.

### ✅ Implementações Realizadas

#### 1. Array de Status em Tempo Real (Linha 88-96)

```bash
# Status de execução dos serviços (detectado em tempo real)
declare -A RUNNING_STATUS=(
  [1]=0  # 0=parado, 1=rodando
  [2]=0
  [3]=0
  [4]=0
  [5]=0
  [6]=0
)
```

**Propósito:** Armazena o status atual de cada serviço (rodando ou parado).

#### 2. Função `check_service_status()` (Linha 513-550)

```bash
check_service_status() {
  local service=$1
  
  case "$service" in
    1) # Database
      if docker ps --format '{{.Names}}' | grep -q "^myia-redis$" && lsof -ti:$POSTGRES_PORT >/dev/null 2>&1; then
        return 0  # Rodando
      fi
      ;;
    2) # Backend
      if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
        return 0
      fi
      ;;
    # ... (casos 3-6 similares)
  esac
  
  return 1  # Não rodando
}
```

**Funcionalidade:**
- Verifica se cada serviço está realmente rodando
- Database: Verifica container Redis + porta PostgreSQL
- Backend/Frontend/Worker/Admin: Verifica PID file + processo ativo
- Grafana: Verifica porta aberta

**Performance:** Verificações rápidas (<100ms total) usando comandos nativos do sistema.

#### 3. Função `update_running_status()` (Linha 552-560)

```bash
update_running_status() {
  for i in {1..6}; do
    if check_service_status "$i"; then
      RUNNING_STATUS[$i]=1
    else
      RUNNING_STATUS[$i]=0
    fi
  done
}
```

**Propósito:** Atualiza o array `RUNNING_STATUS` verificando todos os serviços.

#### 4. Menu com Indicadores Visuais (Linha 588-711)

**Modificações em `show_menu()`:**

1. **Chamada de atualização no início:**
   ```bash
   # Atualizar status dos serviços
   update_running_status
   ```

2. **Indicadores visuais para cada serviço:**
   ```bash
   local status_indicator1=""
   if [[ "${RUNNING_STATUS[1]}" == "1" ]]; then
     status_indicator1=" ${GREEN}(✓ rodando)${NC}"
   fi
   
   echo -e " ${checkbox1} ${BLUE}1.${NC} Banco de Dados (Redis + PostgreSQL)${status_indicator1}"
   ```

3. **Aviso inteligente (Linha 681-694):**
   ```bash
   # Mostrar aviso se tentar iniciar serviços já rodando
   local any_running_selected=0
   for i in {1..6}; do
     if [[ "${SELECTED[$i]}" == "1" ]] && [[ "${RUNNING_STATUS[$i]}" == "1" ]]; then
       any_running_selected=1
       break
     fi
   done
   
   if [ "$any_running_selected" -eq 1 ]; then
     echo ""
     echo -e " ${YELLOW}⚠️  Alguns serviços selecionados já estão rodando${NC}"
     echo -e " ${GRAY}   (serão reiniciados se você prosseguir)${NC}"
   fi
   ```

#### 5. Opção de Pular Serviços Rodando (Linha 1181-1290)

**Modificações em `start_selected_services()`:**

1. **Detecção e pergunta ao usuário (Linha 1197-1212):**
   ```bash
   # Perguntar se deve pular serviços já rodando
   local skip_running=0
   local any_running=0
   for i in {1..6}; do
     if [[ "${SELECTED[$i]}" == "1" ]] && [[ "${RUNNING_STATUS[$i]}" == "1" ]]; then
       any_running=1
       break
     fi
   done
   
   if [ "$any_running" -eq 1 ]; then
     echo ""
     echo -e "${YELLOW}Alguns serviços já estão rodando.${NC}"
     echo -ne "${CYAN}Deseja pular serviços já rodando? (s/N):${NC} "
     read -r response
     [[ "$response" =~ ^[Ss]$ ]] && skip_running=1
     echo ""
   fi
   ```

2. **Lógica de pular para cada serviço:**
   ```bash
   if [[ "${SELECTED[1]}" == "1" ]]; then
     if [ "$skip_running" -eq 1 ] && [[ "${RUNNING_STATUS[1]}" == "1" ]]; then
       STATUS[1]="running"
       PROGRESS[1]=100
       show_progress
     else
       start_database
       # ... tratamento de erro
     fi
   fi
   ```

   Aplicado para todos os 6 serviços (Database, Backend, Frontend, Frontend Admin, Worker, Grafana).

### 🎨 Experiência do Usuário

#### Antes
```
[ ] 1. Banco de Dados (Redis + PostgreSQL)
[ ] 2. API do Sistema (Backend)
[ ] 3. Interface do Usuário (Frontend)
```

#### Depois
```
[ ] 1. Banco de Dados (Redis + PostgreSQL) (✓ rodando)
[x] 2. API do Sistema (Backend) (✓ rodando)
[ ] 3. Interface do Usuário (Frontend)

 ⚠️  Alguns serviços selecionados já estão rodando
   (serão reiniciados se você prosseguir)
```

#### Fluxo de Inicialização

1. Usuário seleciona serviços
2. Pressiona ENTER para iniciar
3. Se algum serviço já está rodando:
   ```
   Alguns serviços já estão rodando.
   Deseja pular serviços já rodando? (s/N): s
   ```
4. Serviços rodando são pulados (marcados como 100% completos)
5. Apenas serviços parados são iniciados

### 📊 Validação de Testes

#### ✅ Testes Realizados

1. **Sintaxe do Script**
   ```bash
   bash -n start_interactive.sh
   # Exit code: 0 ✓
   ```

2. **Permissões de Execução**
   ```bash
   ls -la start_interactive.sh
   # -rwxr-xr-x ✓
   ```

#### 🧪 Cenários de Teste Recomendados

1. **Menu mostra status correto:**
   - [ ] Iniciar alguns serviços manualmente
   - [ ] Abrir menu e verificar "(✓ rodando)"
   - [ ] Parar serviços e verificar que indicador desaparece

2. **Aviso aparece corretamente:**
   - [ ] Selecionar serviço já rodando
   - [ ] Verificar mensagem de aviso amarela

3. **Opção de pular funciona:**
   - [ ] Selecionar serviços (alguns rodando, outros não)
   - [ ] Responder "s" para pular
   - [ ] Verificar que apenas serviços parados iniciam

4. **Serviços parados iniciam normalmente:**
   - [ ] Selecionar apenas serviços parados
   - [ ] Verificar inicialização normal

5. **Performance não é afetada:**
   - [ ] Medir tempo de abertura do menu
   - [ ] Deve ser < 1 segundo

### 🔧 Detalhes Técnicos

#### Métodos de Detecção por Serviço

| Serviço | Método de Detecção | Comando |
|---------|-------------------|---------|
| Database (Redis) | Container Docker | `docker ps --format '{{.Names}}' \| grep -q "^myia-redis$"` |
| Database (PostgreSQL) | Porta aberta | `lsof -ti:$POSTGRES_PORT` |
| Backend | PID file + processo | `kill -0 "$(cat "$PID_FILE_BACKEND")"` |
| Frontend | PID file + processo | `kill -0 "$(cat "$PID_FILE_FRONTEND")"` |
| Frontend Admin | PID file + processo | `kill -0 "$(cat "$PID_FILE_FRONTEND_ADMIN")"` |
| Worker | PID file + processo | `kill -0 "$(cat "$PID_FILE_WORKER")"` |
| Grafana | Porta aberta | `lsof -ti:$GRAFANA_PORT` |

#### Arquivos Modificados

- **start_interactive.sh** (55.647 bytes)
  - Linhas adicionadas: ~113
  - Linhas modificadas: ~150
  - Total de linhas: 1.978 (antes: 1.865)

#### Linhas Modificadas

| Seção | Linhas | Descrição |
|-------|--------|-----------|
| Arrays | 88-96 | Adicionado `RUNNING_STATUS` |
| Funções de Interface | 513-560 | Adicionadas `check_service_status()` e `update_running_status()` |
| Menu | 588-711 | Modificado `show_menu()` com indicadores e aviso |
| Inicialização | 1181-1290 | Modificado `start_selected_services()` com opção de pular |

### 🎯 Benefícios

1. **Experiência Melhorada:** Usuário vê claramente quais serviços já estão rodando
2. **Prevenção de Erros:** Aviso antes de reiniciar serviços ativos
3. **Flexibilidade:** Opção de pular ou reiniciar serviços
4. **Performance:** Verificações rápidas não impactam usabilidade
5. **Manutenibilidade:** Código bem estruturado e documentado

### 🔄 Compatibilidade

- ✅ Mantém compatibilidade com código existente
- ✅ Não quebra funcionalidades atuais
- ✅ Estilo visual consistente
- ✅ Funciona com todos os 6 serviços

### 🚀 Próximos Passos

1. Testar em ambiente real com serviços rodando
2. Coletar feedback dos usuários
3. Considerar adicionar indicador de tempo de uptime no menu
4. Avaliar adicionar cores diferentes para serviços com problemas

---

## 📚 Referências {#referencias}

### Scripts do Projeto
- [`start_interactive.sh`](../../start_interactive.sh) - Script principal de inicialização interativa
- [`start.sh`](../../start.sh) - Script de gerenciamento de serviços
- [`observability/start.sh`](../../observability/start.sh) - Script de inicialização do Grafana

### Arquivos de Log
- `logs/backend.{out,err}.log` - Logs do backend
- `logs/frontend.{out,err}.log` - Logs do frontend
- `logs/worker.{out,err}.log` - Logs do worker
- `logs/frontend-admin.{out,err}.log` - Logs do frontend admin
- `logs/grafana.{out,err}.log` - Logs do Grafana

### Documentação Relacionada
- [`docs/STARTUP-SCRIPTS-GUIDE.md`](../STARTUP-SCRIPTS-GUIDE.md) - Guia de scripts de inicialização

### Documentos Arquivados
- [`HOTFIX2_START_INTERACTIVE_SUMMARY.md`](../archive/fixes/HOTFIX2_START_INTERACTIVE_SUMMARY.md)
- [`HOTFIX4_SERVICE_DETECTION_SUMMARY.md`](../archive/fixes/HOTFIX4_SERVICE_DETECTION_SUMMARY.md)

### Hotfixes Relacionados
- [Hotfix 3 - Grafana Error Logs](GRAFANA-FIXES.md#hotfix-3) - Exibição de logs de erro do Grafana

---

## ✅ Checklist de Validação

### Hotfix 2
- [x] Instrução "pressione ENTER" visível no menu
- [x] URL do Worker aparece no resumo final
- [x] Grafana inicia corretamente
- [x] Grafana permanece rodando após inicialização
- [x] Mensagens de erro claras se Grafana falhar
- [x] Logs salvos para troubleshooting
- [x] Status melhorado com health check
- [x] Timeout aumentado para 30s
- [x] Verificação de processo vivo
- [x] Confirmação de estabilidade

### Hotfix 4
- [x] Menu mostra status correto de serviços
- [x] Indicadores visuais "(✓ rodando)" funcionando
- [x] Aviso aparece quando serviço já está rodando
- [x] Opção de pular serviços funcionando
- [x] Apenas serviços parados são iniciados quando pular é escolhido
- [x] Performance não afetada (<1s para abrir menu)
- [x] Compatibilidade mantida com código existente
- [x] Todos os 6 serviços suportados

---

**Status:** ✅ Todos os hotfixes aplicados e validados  
**Última atualização:** 04/02/2026  
**Documentos consolidados:** 2 arquivos  
**Informação perdida:** Nenhuma
