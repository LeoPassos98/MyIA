# Fase 4: Melhorias de UX - Funcionalidades de Conveniência

## ✅ Status: IMPLEMENTADO

Data: 02/02/2026

## 📋 Resumo

A Fase 4 do plano de melhorias do [`start_interactive.sh`](start_interactive.sh:1) foi concluída com sucesso. Todas as funcionalidades de conveniência foram implementadas para facilitar o uso diário do script.

## 🎯 Funcionalidades Implementadas

### 1. ✅ Reiniciar Serviço Específico (Opção `r`)

**Localização:** Linhas 927-1077

**Funcionalidades:**
- Menu interativo para selecionar qual serviço reiniciar
- 5 funções de reinicialização individual:
  - [`restart_backend()`](start_interactive.sh:973)
  - [`restart_frontend()`](start_interactive.sh:994)
  - [`restart_frontend_admin()`](start_interactive.sh:1015)
  - [`restart_worker()`](start_interactive.sh:1036)
  - [`restart_grafana()`](start_interactive.sh:1057)

**Como usar:**
```bash
# No menu principal, pressione 'r'
# Selecione o serviço desejado (1-5)
# O serviço será parado gracefully e reiniciado
```

**Características:**
- Parada graceful com timeout de 10 segundos
- Aguarda 2 segundos entre parada e reinício
- Mostra barra de progresso durante reinicialização
- Retorna ao menu após conclusão

### 2. ✅ Ver Logs em Tempo Real (Opção `l`)

**Localização:** Linhas 1083-1164

**Funcionalidades:**
- Menu interativo para selecionar qual log visualizar
- 8 opções de logs disponíveis:
  - Backend (stdout/stderr)
  - Frontend (stdout/stderr)
  - Worker (stdout/stderr)
  - Frontend Admin (stdout/stderr)

**Como usar:**
```bash
# No menu principal, pressione 'l'
# Selecione o log desejado (1-8)
# Pressione Ctrl+C para sair da visualização
```

**Características:**
- Usa `tail -f` para visualização em tempo real
- Trap para capturar Ctrl+C sem encerrar o script
- Cria arquivo de log se não existir
- Retorna ao menu após sair

### 3. ✅ Sistema de Perfis (Opções `s` e `p`)

**Localização:** Linhas 1170-1295

**Funcionalidades:**

#### Salvar Perfil (Opção `s`)
- Salva seleções atuais de serviços
- Armazena em `.profiles/` no diretório raiz
- Formato: `nome.profile`

**Como usar:**
```bash
# No menu principal, pressione 's'
# Digite o nome do perfil (ex: "desenvolvimento")
# Perfil será salvo em .profiles/desenvolvimento.profile
```

#### Carregar Perfil (Opção `p`)
- Lista perfis disponíveis
- Permite seleção interativa
- Carrega seleções do perfil escolhido

**Como usar:**
```bash
# No menu principal, pressione 'p'
# Selecione o perfil desejado da lista
# Seleções serão aplicadas automaticamente
```

**Formato do arquivo de perfil:**
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

### 4. ✅ Status Melhorado com Uptime e URLs

**Localização:** Linhas 1301-1340 (get_uptime), 1346-1415 (show_status)

**Funcionalidades:**
- Mostra uptime formatado para cada serviço rodando
- Exibe URLs de acesso para serviços web
- Formato de uptime inteligente:
  - Mais de 1 hora: `2h 15m`
  - Menos de 1 hora: `45m 30s`
  - Menos de 1 minuto: `30s`

**Exemplo de output:**
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

## 🎨 Menu Atualizado

O menu principal agora inclui as novas opções:

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
 [ ] r. Reiniciar Serviço Específico       ← NOVO
 [ ] l. Ver Logs em Tempo Real             ← NOVO
 [ ] s. Salvar Perfil Atual                ← NOVO
 [ ] p. Carregar Perfil                    ← NOVO
 [ ] 0. Sair

Opção:
```

## 🔧 Integração no Loop Principal

**Localização:** Linhas 1489-1541

As novas opções foram integradas no case statement do loop principal:

```bash
case "$option" in
  # ... opções existentes ...
  r|R)
    restart_service_menu
    ;;
  l|L)
    view_logs_menu
    ;;
  s|S)
    save_profile
    ;;
  p|P)
    load_profile
    ;;
  # ... restante ...
esac
```

## 📁 Estrutura de Arquivos

### Diretório de Perfis
```
MyIA/
├── .profiles/              ← Criado automaticamente
│   ├── desenvolvimento.profile
│   ├── producao.profile
│   └── teste.profile
├── logs/
│   ├── backend.out.log
│   ├── backend.err.log
│   ├── frontend.out.log
│   ├── frontend.err.log
│   ├── worker.out.log
│   ├── worker.err.log
│   ├── frontend-admin.out.log
│   └── frontend-admin.err.log
└── start_interactive.sh
```

## ✅ Testes Realizados

### 1. Validação de Sintaxe
```bash
bash -n start_interactive.sh
# ✓ Sem erros de sintaxe
```

### 2. Funcionalidades Testadas
- ✅ Menu exibe novas opções corretamente
- ✅ Opção 'r' abre menu de reinicialização
- ✅ Opção 'l' abre menu de logs
- ✅ Opção 's' salva perfil
- ✅ Opção 'p' carrega perfil
- ✅ Status mostra uptime e URLs
- ✅ Todas as funções de reinicialização funcionam
- ✅ Visualização de logs não trava o script

## 🎯 Casos de Uso

### Caso 1: Desenvolvedor Frontend
```bash
# Salvar perfil "frontend-dev"
1. Selecionar: Backend (2), Frontend (3)
2. Pressionar 's'
3. Digitar: "frontend-dev"

# Usar perfil
1. Pressionar 'p'
2. Selecionar "frontend-dev"
3. Pressionar ENTER para iniciar
```

### Caso 2: Debug de Erros
```bash
# Ver logs de erro do backend
1. Pressionar 'l'
2. Selecionar opção 2 (Backend stderr)
3. Observar erros em tempo real
4. Ctrl+C para sair
```

### Caso 3: Reiniciar Serviço Travado
```bash
# Reiniciar backend sem afetar outros serviços
1. Pressionar 'r'
2. Selecionar opção 1 (Backend)
3. Aguardar reinicialização
```

### Caso 4: Monitorar Uptime
```bash
# Ver há quanto tempo serviços estão rodando
1. Pressionar '8' (Status)
2. Verificar uptime de cada serviço
3. Ver URLs de acesso
```

## 📊 Estatísticas da Implementação

- **Linhas adicionadas:** ~450
- **Novas funções:** 13
  - 1 menu de reinicialização
  - 5 funções de reinicialização individual
  - 1 menu de logs
  - 2 funções de perfis (save/load)
  - 1 função de uptime
  - 3 funções auxiliares
- **Novas opções no menu:** 4 (r, l, s, p)
- **Arquivos de perfil:** Ilimitados (armazenados em `.profiles/`)

## 🔄 Compatibilidade

### Mantido das Fases Anteriores
- ✅ Todas as validações (Fase 1)
- ✅ Todos os health checks (Fase 2)
- ✅ Todo tratamento de erros (Fase 3)
- ✅ Estrutura visual do menu
- ✅ Numeração existente (1-9, 0)
- ✅ Cores e formatação

### Novas Dependências
- `date` (para timestamps e cálculo de uptime)
- `ps` (para obter tempo de início do processo)
- `tail` (para visualização de logs)

## 🚀 Próximos Passos

A Fase 4 está completa. Possíveis melhorias futuras:

1. **Fase 5 (Opcional):** Notificações
   - Notificar quando serviço cair
   - Alertas de erro via desktop notification
   - Integração com Slack/Discord

2. **Fase 6 (Opcional):** Métricas
   - Uso de CPU/memória por serviço
   - Gráficos de uptime
   - Histórico de reinicializações

3. **Fase 7 (Opcional):** Automação
   - Auto-restart em caso de falha
   - Agendamento de reinicializações
   - Backup automático de logs

## 📝 Notas Técnicas

### Função get_uptime()
- Usa `ps -o lstart=` para obter tempo de início
- Converte para epoch com `date -d`
- Calcula diferença em segundos
- Formata em horas, minutos e segundos

### Visualização de Logs
- Usa subshell com trap para capturar Ctrl+C
- Não encerra script principal ao sair do tail
- Cria arquivo de log se não existir

### Sistema de Perfis
- Formato simples: `chave=valor`
- Ignora comentários (linhas com #)
- Valida chaves (1-6)
- Armazena em diretório oculto (`.profiles/`)

## ✨ Conclusão

A Fase 4 adiciona funcionalidades essenciais para o uso diário do script, tornando-o mais conveniente e produtivo. Todas as funcionalidades foram implementadas conforme especificado no plano de melhorias, mantendo compatibilidade com as fases anteriores.

O script [`start_interactive.sh`](start_interactive.sh:1) agora oferece:
- ✅ Reinicialização rápida de serviços individuais
- ✅ Visualização de logs em tempo real
- ✅ Sistema de perfis para diferentes cenários
- ✅ Status detalhado com uptime e URLs

**Total de linhas:** 1548 (antes: ~1111)
**Funcionalidades totais:** 4 fases completas
