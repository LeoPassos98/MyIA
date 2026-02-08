# Plano: Modularização do manage-certifications.sh

## 🎯 Objetivo
Modularizar `manage-certifications.sh` (1680 linhas) em módulos reutilizáveis, focando em gerenciamento de CERTIFICAÇÕES (não infraestrutura).

## 📋 Checklist de Execução

### FASE 1: Preparação (5 min)
- [ ] Criar backup: `cp manage-certifications.sh manage-certifications.sh.backup`
- [ ] Criar estrutura de diretórios:
  ```bash
  mkdir -p scripts/certification
  ```

### FASE 2: Criar Módulos Base (15 min)
- [ ] `scripts/certification/api.sh` - Chamadas API (login, api_call, check_backend)
- [ ] `scripts/certification/list.sh` - Listar certificações (all, by_model, by_region, by_status)
- [ ] `scripts/certification/delete.sh` - Deletar certificações (by_model, by_region, by_status, all)
- [ ] `scripts/certification/cleanup.sh` - Limpar antigas (expired, failed, old)
- [ ] `scripts/certification/stats.sh` - Estatísticas (by_region, by_vendor, by_status)
- [ ] `scripts/certification/details.sh` - Detalhes (show_details, show_history)

### FASE 3: Migrar Funções (30 min)
**Do manage-certifications.sh para módulos:**

**api.sh:**
- [ ] `login_to_api()` → `certification_api_login()`
- [ ] `api_call()` → `certification_api_call()`
- [ ] `check_backend()` → `check_certification_api()`

**list.sh:**
- [ ] `list_jobs()` → `list_certifications()`
- [ ] Adicionar: `list_certifications_by_model()`
- [ ] Adicionar: `list_certifications_by_region()`
- [ ] Adicionar: `list_certifications_by_status()`

**delete.sh:**
- [ ] Mover: `cancel_job()` → Remover (fora de escopo)
- [ ] Adicionar: `delete_certification_by_model()`
- [ ] Adicionar: `delete_certification_by_region()`
- [ ] Adicionar: `delete_all_certifications()`

**cleanup.sh:**
- [ ] `cleanup_jobs()` → `cleanup_certifications()`
- [ ] Adicionar: `cleanup_expired_certifications()`
- [ ] Adicionar: `cleanup_failed_certifications()`

**stats.sh:**
- [ ] `show_stats()` → `show_certification_stats()`
- [ ] Adicionar: `show_stats_by_region()`
- [ ] Adicionar: `show_stats_by_vendor()`

**details.sh:**
- [ ] `show_job_details()` → `show_certification_details()`
- [ ] Adicionar: `show_certification_history()`

### FASE 4: Refatorar Script Principal (20 min)
- [ ] Remover funções migradas
- [ ] Adicionar imports dos módulos:
  ```bash
  source "$SCRIPT_DIR/scripts/certification/api.sh"
  source "$SCRIPT_DIR/scripts/certification/list.sh"
  source "$SCRIPT_DIR/scripts/certification/delete.sh"
  source "$SCRIPT_DIR/scripts/certification/cleanup.sh"
  source "$SCRIPT_DIR/scripts/certification/stats.sh"
  source "$SCRIPT_DIR/scripts/certification/details.sh"
  ```
- [ ] Simplificar menu principal (remover opções 1, 8, 12-16)
- [ ] Atualizar chamadas de funções para usar módulos

### FASE 5: Remover Funcionalidades Fora de Escopo (10 min)
**Remover do manage-certifications.sh:**
- [ ] Opção 1: Ver Status do Sistema (usar `start_interactive.sh`)
- [ ] Opção 8: Gerenciar Fila (usar Bull Board)
- [ ] Opção 12: Reiniciar Serviços (usar `start_interactive.sh`)
- [ ] Opção 13: Travar/Destravar Tela (não essencial)
- [ ] Opção 14: Reconectar ao Backend (usar `start_interactive.sh`)
- [ ] Opção 15: Iniciar Serviços (usar `start_interactive.sh`)
- [ ] Opção 16: Parar Serviços (usar `start_interactive.sh`)

### FASE 6: Testar (15 min)
- [ ] Testar cada módulo individualmente
- [ ] Testar script principal
- [ ] Validar todas as opções do menu
- [ ] Verificar se não há erros de sintaxe: `bash -n manage-certifications.sh`

### FASE 7: Documentar (5 min)
- [ ] Atualizar README do script
- [ ] Adicionar comentários nos módulos
- [ ] Documentar fluxo de trabalho recomendado

## 📊 Resultado Esperado

**Antes:**
- manage-certifications.sh: 1680 linhas (monolítico)

**Depois:**
- manage-certifications.sh: ~200 linhas (orquestrador)
- scripts/certification/api.sh: ~100 linhas
- scripts/certification/list.sh: ~150 linhas
- scripts/certification/delete.sh: ~120 linhas
- scripts/certification/cleanup.sh: ~100 linhas
- scripts/certification/stats.sh: ~80 linhas
- scripts/certification/details.sh: ~100 linhas

**Total:** ~850 linhas (50% redução + modularização)

## ⏱️ Tempo Estimado
**Total:** 1h 40min
