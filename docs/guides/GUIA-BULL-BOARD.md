# 📊 Guia do Bull Board - Interface de Monitoramento de Filas

## 🔗 Acesso

**URL:** http://localhost:3001/admin/queues

## 📋 O Que Você Deveria Ver

### 1. Dashboard Principal

Ao acessar o Bull Board, você verá uma interface web com:

#### Fila: `model-certification`

**Visão Geral:**
```
┌─────────────────────────────────────────────┐
│  model-certification                         │
├─────────────────────────────────────────────┤
│  Waiting:    0                              │
│  Active:     0                              │
│  Completed:  6                              │
│  Failed:     0                              │
│  Delayed:    0                              │
│  Paused:     0                              │
└─────────────────────────────────────────────┘
```

### 2. Abas Disponíveis

#### 📊 **Waiting** (Aguardando)
- Jobs que estão na fila esperando para serem processados
- **Esperado:** 0 (todos já foram processados)

#### ⚙️ **Active** (Ativos)
- Jobs que estão sendo processados no momento
- **Esperado:** 0 (processamento já concluído)

#### ✅ **Completed** (Completos)
- Jobs que foram processados com sucesso
- **Esperado:** 6 jobs (os 6 modelos certificados)

**Exemplo de job completo:**
```json
{
  "id": "09f8bafd-b82e-4647-aed8-c18bc71196c3",
  "name": "certify-model",
  "data": {
    "modelId": "a8bd96c2-cb4d-4870-9da9-1e0df4a93aef",
    "region": "us-east-1",
    "jobId": "09f8bafd-b82e-4647-aed8-c18bc71196c3"
  },
  "opts": {
    "attempts": 3,
    "backoff": {
      "type": "exponential",
      "delay": 5000
    },
    "removeOnComplete": false,
    "removeOnFail": false
  },
  "progress": 100,
  "returnvalue": {
    "status": "COMPLETED",
    "modelId": "a8bd96c2-cb4d-4870-9da9-1e0df4a93aef",
    "region": "us-east-1"
  },
  "finishedOn": 1738533021819,
  "processedOn": 1738533021817
}
```

#### ❌ **Failed** (Falhados)
- Jobs que falharam durante o processamento
- **Esperado:** 0 (nenhuma falha)

#### ⏰ **Delayed** (Atrasados)
- Jobs agendados para execução futura
- **Esperado:** 0

#### ⏸️ **Paused** (Pausados)
- Jobs pausados manualmente
- **Esperado:** 0

### 3. Detalhes de um Job

Ao clicar em um job completo, você verá:

```
┌─────────────────────────────────────────────┐
│  Job Details                                 │
├─────────────────────────────────────────────┤
│  ID: 09f8bafd-b82e-4647-aed8-c18bc71196c3   │
│  Name: certify-model                        │
│  State: completed                           │
│  Progress: 100%                             │
│                                             │
│  Data:                                      │
│  {                                          │
│    "modelId": "a8bd96c2-...",              │
│    "region": "us-east-1",                  │
│    "jobId": "09f8bafd-..."                 │
│  }                                          │
│                                             │
│  Return Value:                              │
│  {                                          │
│    "status": "COMPLETED",                   │
│    "modelId": "a8bd96c2-...",              │
│    "region": "us-east-1"                   │
│  }                                          │
│                                             │
│  Timestamps:                                │
│  - Created: 2026-02-02 21:50:21            │
│  - Processed: 2026-02-02 21:50:21          │
│  - Finished: 2026-02-02 21:50:21           │
│  - Duration: ~1s                           │
└─────────────────────────────────────────────┘
```

### 4. Ações Disponíveis

Para cada job, você pode:

- 🔍 **Ver Detalhes** - Clique no job para ver informações completas
- 🔄 **Retry** - Reprocessar um job falhado
- 🗑️ **Remove** - Remover um job da fila
- ⏸️ **Pause Queue** - Pausar toda a fila
- ▶️ **Resume Queue** - Retomar processamento
- 🧹 **Clean** - Limpar jobs antigos

### 5. Gráficos e Estatísticas

O Bull Board também mostra:

#### Taxa de Processamento
```
Jobs/min: ~360 (6 jobs em ~1 segundo)
```

#### Distribuição de Status
```
Completed: ████████████████████ 100% (6)
Failed:    ░░░░░░░░░░░░░░░░░░░░   0% (0)
```

#### Timeline
```
21:50:21 ━━━━━━━━━━━━━━━━━━━━ 6 jobs processados
```

## 🎯 O Que Procurar

### ✅ Sinais de Sucesso

1. **Completed = 6** - Todos os modelos foram certificados
2. **Failed = 0** - Nenhuma falha
3. **Active = 0** - Processamento concluído
4. **Waiting = 0** - Fila vazia

### ⚠️ Sinais de Problema

1. **Failed > 0** - Algum modelo falhou
   - Clique no job falhado para ver o erro
   - Use "Retry" para tentar novamente

2. **Active > 0 por muito tempo** - Job travado
   - Pode indicar timeout ou erro no worker
   - Verifique logs do backend

3. **Waiting crescendo** - Fila acumulando
   - Worker pode estar parado
   - Verifique se o backend está rodando

## 📸 Screenshots Esperados

### Dashboard Principal
```
╔═══════════════════════════════════════════╗
║  Bull Board                                ║
║  ─────────────────────────────────────────║
║                                           ║
║  📊 Queues                                ║
║                                           ║
║  ┌─ model-certification ─────────────┐   ║
║  │  Waiting:    0                    │   ║
║  │  Active:     0                    │   ║
║  │  Completed:  6  ✅                │   ║
║  │  Failed:     0                    │   ║
║  └───────────────────────────────────┘   ║
║                                           ║
║  [Waiting] [Active] [Completed] [Failed] ║
║                                           ║
║  ┌─ Completed Jobs ──────────────────┐   ║
║  │  09f8bafd... | certify-model | ✅ │   ║
║  │  5fd6f9bc... | certify-model | ✅ │   ║
║  │  c5480475... | certify-model | ✅ │   ║
║  │  7a218c3b... | certify-model | ✅ │   ║
║  │  1c814547... | certify-model | ✅ │   ║
║  │  f2a445b8... | certify-model | ✅ │   ║
║  └───────────────────────────────────┘   ║
╚═══════════════════════════════════════════╝
```

## 🔧 Troubleshooting

### Problema: Página não carrega

**Solução:**
```bash
# Verificar se backend está rodando
./start.sh status backend

# Se não estiver, iniciar
./start.sh start backend
```

### Problema: Fila vazia mas deveria ter jobs

**Possíveis causas:**
1. Jobs já foram processados e removidos
2. Configuração `removeOnComplete: true` está ativa
3. Limpeza automática de jobs antigos

**Solução:**
```bash
# Criar novo job de teste
cd backend && npx tsx scripts/certify-all-models-direct.ts

# Verificar no Bull Board imediatamente
```

### Problema: Jobs falhando

**Investigar:**
1. Clicar no job falhado
2. Ver "Stack Trace" ou "Error Message"
3. Verificar logs do backend:
   ```bash
   tail -f logs/backend.out.log
   ```

## 📚 Recursos Adicionais

- **Documentação Bull:** https://github.com/OptimalBits/bull
- **Bull Board:** https://github.com/felixmosh/bull-board
- **Logs do Backend:** `logs/backend.out.log`
- **API de Estatísticas:** http://localhost:3001/api/certification-queue/stats

## ✨ Resumo

No Bull Board você deveria ver:

✅ **6 jobs completos** na aba "Completed"  
✅ **0 jobs falhados** na aba "Failed"  
✅ **Fila vazia** (Waiting = 0, Active = 0)  
✅ **Interface web limpa e funcional**  

Se você ver isso, significa que a certificação foi 100% bem-sucedida! 🎉

---

**Data:** 2026-02-02 19:06 BRT  
**Autor:** Kilo Code (Code Mode)
