# HOTFIX 3: Grafana Error Logs - Resumo da Correção

## 📋 Problema Identificado

Quando Grafana falhava durante inicialização (51%), o script [`start_interactive.sh`](start_interactive.sh:939) não mostrava qual foi o erro. Apenas exibia ❌ e retornava ao prompt sem informações úteis para troubleshooting.

## 🔧 Mudanças Implementadas

### 1. Adicionado `show_error_logs()` em 3 Pontos de Falha

#### **Ponto 1: Script start.sh Não Encontrado** (Linha 965-972)
```bash
if [ ! -f "$OBSERVABILITY_DIR/start.sh" ]; then
  debug_log "ERRO: Script start.sh não encontrado em $OBSERVABILITY_DIR"
  STATUS[6]="error"
  show_progress
  show_error_logs "Grafana" "$LOG_DIR/grafana.err.log"  # ✅ ADICIONADO
  echo -e "${YELLOW}💡 Script start.sh não encontrado em: $OBSERVABILITY_DIR${NC}"
  echo ""
  return 1
fi
```

#### **Ponto 2: Processo Morreu Durante Inicialização** (Linha 996-1003)
```bash
if ! kill -0 $grafana_pid >/dev/null 2>&1; then
  debug_log "ERRO: Processo Grafana (PID $grafana_pid) morreu"
  STATUS[6]="error"
  show_progress
  show_error_logs "Grafana" "$LOG_DIR/grafana.err.log"  # ✅ ADICIONADO
  echo -e "${YELLOW}💡 Processo morreu durante inicialização${NC}"
  echo ""
  return 1
fi
```

#### **Ponto 3: Health Check Falhou Após Timeout** (Linha 1058-1065)
```bash
debug_log "ERRO: Grafana não iniciou - porta não aberta"
STATUS[6]="error"
PROGRESS[6]=100
show_progress
show_error_logs "Grafana" "$LOG_DIR/grafana.err.log"  # ✅ ADICIONADO
echo -e "${YELLOW}💡 Health check falhou após ${max_wait}s - porta não aberta${NC}"
echo ""
return 1
```

### 2. Melhoradas Sugestões de Troubleshooting

Adicionado case específico para Grafana na função [`show_error_logs()`](start_interactive.sh:397) (Linha 435-440):

```bash
Grafana)
  echo -e "${CYAN}  • Verifique se Docker está rodando: docker ps${NC}"
  echo -e "${CYAN}  • Verifique o script de inicialização: ls -la observability/start.sh${NC}"
  echo -e "${CYAN}  • Verifique se a porta 3002 está disponível: lsof -ti:3002${NC}"
  echo -e "${CYAN}  • Veja o log completo: cat $error_log_path${NC}"
  ;;
```

### 3. Pausa para Leitura Já Implementada

A pausa para leitura antes de voltar ao menu já estava implementada (Linha 1126-1129):

```bash
if [[ "${STATUS[6]}" == "error" ]]; then
  echo ""
  read -p "Pressione ENTER para continuar..."
fi
```

## ✅ Resultado Final

Agora quando Grafana falha, o usuário vê:

1. **Barra de progresso com ❌**
2. **Box vermelho com título "Grafana falhou ao iniciar"**
3. **Últimas 10 linhas do log de erro** (`logs/grafana.err.log`)
4. **Sugestões específicas de troubleshooting**:
   - Verificar se Docker está rodando
   - Verificar script de inicialização
   - Verificar se porta 3002 está disponível
   - Ver log completo
5. **Mensagem contextual** sobre o tipo de falha:
   - "Script start.sh não encontrado"
   - "Processo morreu durante inicialização"
   - "Health check falhou após 30s - porta não aberta"
6. **Pausa para leitura** antes de voltar ao menu

## 📊 Comparação Antes/Depois

### ❌ Antes
```
[6/6] Monitoramento      ████████████████████ 100% ❌

Pressione ENTER para voltar ao menu...
```

### ✅ Depois
```
[6/6] Monitoramento      ████████████████████ 100% ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Grafana falhou ao iniciar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Últimas 10 linhas do log de erro:

  Error: Cannot find module 'docker-compose'
  at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1048:15)
  at Function.Module._load (node:internal/modules/cjs/loader:901:27)
  ...

💡 Sugestões:
  • Verifique se Docker está rodando: docker ps
  • Verifique o script de inicialização: ls -la observability/start.sh
  • Verifique se a porta 3002 está disponível: lsof -ti:3002
  • Veja o log completo: cat logs/grafana.err.log

💡 Health check falhou após 30s - porta não aberta

Pressione ENTER para continuar...
```

## 🎯 Benefícios

1. **Visibilidade Total**: Usuário vê exatamente o que aconteceu
2. **Troubleshooting Rápido**: Sugestões específicas para cada tipo de erro
3. **Contexto Claro**: Mensagens explicam qual etapa falhou
4. **Logs Acessíveis**: Últimas 10 linhas mostradas automaticamente
5. **Consistência**: Mesmo padrão usado por Backend, Frontend, Worker

## 📝 Arquivos Modificados

- [`start_interactive.sh`](start_interactive.sh:1) - Função `start_grafana_service()` e `show_error_logs()`

## 🧪 Próximos Passos

- [ ] Testar falha simulada do Grafana
- [ ] Validar que logs são exibidos corretamente
- [ ] Confirmar que pausa funciona antes de voltar ao menu

---

**Status**: ✅ Implementado  
**Data**: 2026-02-02  
**Autor**: Kilo Code
