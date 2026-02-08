# Plano de Orquestração: Modularização do manage-certifications.sh

## 🎯 Objetivo
Executar [`plans/MODULARIZE-MANAGE-CERTIFICATIONS.md`](plans/MODULARIZE-MANAGE-CERTIFICATIONS.md:1) usando modo Orchestrator para coordenar múltiplos modos especializados em sequência.

## 🔄 Estratégia de Orquestração

### Fila de Execução (Sequencial)
```
1. Code Mode → Criar estrutura de módulos
2. Code Mode → Migrar funções para módulos
3. Code Mode → Refatorar script principal
4. Test Engineer → Validar módulos e integração
5. Code Simplifier → Otimizar código final
```

## 📋 Tarefas por Modo

### TAREFA 1: Code Mode - Criar Estrutura (15 min)
**Input:** Estrutura de diretórios e módulos base  
**Output:** 6 arquivos `.sh` criados em `scripts/certification/`

**Ações:**
- Criar `scripts/certification/{api,list,delete,cleanup,stats,details}.sh`
- Adicionar headers e estrutura base em cada módulo
- Configurar permissões de execução

---

### TAREFA 2: Code Mode - Migrar Funções (30 min)
**Input:** `manage-certifications.sh` atual (1680 linhas)  
**Output:** Funções migradas para módulos apropriados

**Ações:**
- Extrair funções de API → `api.sh`
- Extrair funções de listagem → `list.sh`
- Extrair funções de deleção → `delete.sh`
- Extrair funções de limpeza → `cleanup.sh`
- Extrair funções de estatísticas → `stats.sh`
- Extrair funções de detalhes → `details.sh`

---

### TAREFA 3: Code Mode - Refatorar Script Principal (20 min)
**Input:** Módulos criados + script original  
**Output:** `manage-certifications.sh` refatorado (~200 linhas)

**Ações:**
- Adicionar imports dos módulos
- Remover funções migradas
- Simplificar menu (remover opções 1, 8, 12-16)
- Atualizar chamadas de funções

---

### TAREFA 4: Test Engineer - Validar (15 min)
**Input:** Código refatorado  
**Output:** Relatório de testes

**Ações:**
- Testar sintaxe: `bash -n manage-certifications.sh`
- Testar cada módulo individualmente
- Validar integração
- Verificar todas as opções do menu

---

### TAREFA 5: Code Simplifier - Otimizar (10 min)
**Input:** Código testado  
**Output:** Código otimizado e limpo

**Ações:**
- Remover código duplicado
- Simplificar lógica complexa
- Melhorar legibilidade
- Adicionar comentários essenciais

---

## ⏱️ Tempo Total Estimado
**90 minutos** (redução de 1h 40min → 1h 30min via orquestração)

## 🎯 Entregáveis Finais
1. ✅ `scripts/certification/` com 6 módulos
2. ✅ `manage-certifications.sh` refatorado (~200 linhas)
3. ✅ Testes validados
4. ✅ Código otimizado e documentado

## 🚀 Comando de Execução
```
Modo: Orchestrator
Tarefa: "Execute o plano MODULARIZE-MANAGE-CERTIFICATIONS.md usando a fila de modos: Code → Code → Code → Test Engineer → Code Simplifier"
```
