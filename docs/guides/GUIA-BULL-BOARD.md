# Guia de Uso do Bull Board

**Data:** 2026-02-08  
**Status:** ✅ Integrado ao Server  
**URL:** http://localhost:3001/admin/queues

---

## 📊 O Que é o Bull Board?

Bull Board é um dashboard visual para monitorar e gerenciar filas Bull (Redis). Ele fornece uma interface web para visualizar jobs, estatísticas e realizar operações administrativas.

---

## 🚀 Acesso

### URL
```
http://localhost:3001/admin/queues
```

### Autenticação
Configurada via variáveis de ambiente no `.env`:

```env
BULL_BOARD_PATH=/admin/queues
BULL_BOARD_USERNAME=admin
BULL_BOARD_PASSWORD=admin123
```

**⚠️ IMPORTANTE:** Altere as credenciais padrão em produção!

---

## 🎯 Funcionalidades

### 1. Visualização de Filas

**Filas Disponíveis:**
- `certification-queue` - Fila de certificação de modelos

**Informações Exibidas:**
- Nome da fila
- Total de jobs (waiting, active, completed, failed, delayed)
- Taxa de processamento
- Tempo médio de processamento

---

### 2. Monitoramento de Jobs

#### Estados dos Jobs
- **Waiting** 🟡 - Aguardando processamento
- **Active** 🔵 - Em processamento
- **Completed** 🟢 - Concluídos com sucesso
- **Failed** 🔴 - Falharam
- **Delayed** 🟠 - Agendados para o futuro

#### Detalhes do Job
Ao clicar em um job, você verá:
- **ID do Job**
- **Payload (data):** Dados enviados ao job
- **Progress:** Progresso atual (0-100%)
- **Attempts:** Tentativas realizadas
- **Timestamp:** Quando foi criado
- **Processed On:** Quando começou a processar
- **Finished On:** Quando terminou
- **Return Value:** Resultado do processamento
- **Failed Reason:** Motivo da falha (se aplicável)
- **Stack Trace:** Stack trace do erro (se aplicável)

---

### 3. Ações Disponíveis

#### Ações por Job
- **Retry** 🔄 - Reprocessar job falhado
- **Remove** 🗑️ - Remover job da fila
- **Promote** ⬆️ - Promover job delayed para waiting

#### Ações por Fila
- **Pause** ⏸️ - Pausar processamento da fila
- **Resume** ▶️ - Retomar processamento
- **Clean** 🧹 - Limpar jobs completados/falhados
- **Empty** 🗑️ - Esvaziar fila completamente

---

## 📈 Casos de Uso

### 1. Monitorar Certificações em Tempo Real

**Cenário:** Você iniciou certificação de múltiplos modelos

**Como Usar:**
1. Acesse http://localhost:3001/admin/queues
2. Veja quantos jobs estão em cada estado
3. Acompanhe o progresso em tempo real
4. Identifique se há jobs travados (stalled)

---

### 2. Debugar Jobs que Falharam

**Cenário:** Alguns modelos falharam na certificação

**Como Usar:**
1. Clique na aba "Failed"
2. Selecione um job falhado
3. Veja o **Failed Reason** e **Stack Trace**
4. Identifique o problema (ex: credenciais AWS, timeout, modelo não disponível)
5. Corrija o problema
6. Clique em "Retry" para reprocessar

**Exemplo de Erro Comum:**
```json
{
  "failedReason": "AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel",
  "stack": "..."
}
```
**Solução:** Verificar permissões IAM da AWS

---

### 3. Limpar Jobs Antigos

**Cenário:** Muitos jobs completados acumulados

**Como Usar:**
1. Clique em "Clean"
2. Selecione o tipo (Completed/Failed)
3. Defina o período (ex: jobs mais antigos que 1 hora)
4. Confirme a limpeza

---

### 4. Pausar Fila Temporariamente

**Cenário:** Manutenção no sistema ou AWS

**Como Usar:**
1. Clique em "Pause"
2. A fila para de processar novos jobs
3. Jobs ativos continuam até completar
4. Clique em "Resume" quando estiver pronto

---

## 🔍 Exemplos de Payload

### Job de Certificação Individual
```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "region": "us-east-1",
  "createdBy": "user-uuid-123"
}
```

### Job de Certificação em Lote
```json
{
  "modelIds": [
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-haiku-20240307-v1:0"
  ],
  "regions": ["us-east-1", "us-west-2"],
  "createdBy": "user-uuid-123"
}
```

---

## 📊 Métricas e Estatísticas

### Métricas Exibidas
- **Total Jobs:** Total de jobs na fila
- **Waiting:** Jobs aguardando processamento
- **Active:** Jobs sendo processados agora
- **Completed:** Jobs concluídos com sucesso
- **Failed:** Jobs que falharam
- **Delayed:** Jobs agendados

### Taxa de Sucesso
```
Taxa de Sucesso = (Completed / (Completed + Failed)) * 100%
```

### Tempo Médio de Processamento
Calculado automaticamente pelo Bull Board baseado nos jobs completados.

---

## ⚙️ Configuração Avançada

### Limites de Processamento

Configurado em [`CertificationQueueService.ts`](backend/src/services/queue/CertificationQueueService.ts:60):

```typescript
limiter: {
  max: 5,        // Máximo 5 jobs por segundo
  duration: 1000 // Duração em ms
}
```

### Concorrência

```typescript
concurrency: parseInt(config.certificationConcurrency, 10)
```

Configurado via `.env`:
```env
CERTIFICATION_CONCURRENCY=2  # Processar 2 jobs simultaneamente
```

### Tentativas e Backoff

```typescript
attempts: 3,  // Máximo 3 tentativas
backoff: {
  type: 'exponential',
  delay: 2000  // Delay inicial de 2s (2s, 4s, 8s)
}
```

---

## 🔒 Segurança

### Autenticação Básica

O Bull Board usa autenticação HTTP Basic. Configure credenciais fortes:

```env
BULL_BOARD_USERNAME=admin_producao
BULL_BOARD_PASSWORD=senha_forte_aqui_123!@#
```

### Restrição de Acesso

**Recomendações para Produção:**

1. **Usar HTTPS:** Sempre acessar via HTTPS
2. **Firewall:** Restringir acesso ao IP do admin
3. **VPN:** Acessar apenas via VPN corporativa
4. **Autenticação Adicional:** Integrar com sistema de auth existente

**Exemplo de Middleware de Autenticação:**

```typescript
// Em server.ts
import { authMiddleware } from './middleware/authMiddleware';

app.use('/admin/queues', authMiddleware, bullBoardRouter.getRouter());
```

---

## 🐛 Troubleshooting

### Problema: Bull Board não carrega

**Sintomas:**
- Erro 404 ao acessar /admin/queues
- Página em branco

**Soluções:**
1. Verificar se Redis está rodando:
   ```bash
   redis-cli ping
   # Deve retornar: PONG
   ```

2. Verificar logs do servidor:
   ```bash
   # Procurar por:
   📊 Bull Board configurado em /admin/queues
   ```

3. Verificar se a fila foi inicializada:
   ```bash
   # No Redis CLI:
   redis-cli
   KEYS myia:*
   ```

---

### Problema: Jobs não processam

**Sintomas:**
- Jobs ficam em "Waiting" indefinidamente
- Nenhum job passa para "Active"

**Soluções:**
1. Verificar se o worker está rodando:
   ```bash
   # Deve estar rodando:
   npm run worker
   ```

2. Verificar se a fila está pausada:
   - No Bull Board, verificar se há botão "Resume"
   - Se sim, clicar em "Resume"

3. Verificar logs do worker:
   ```bash
   # Procurar por erros
   tail -f logs/worker.log
   ```

---

### Problema: Jobs falham constantemente

**Sintomas:**
- Todos os jobs vão para "Failed"
- Mesma mensagem de erro

**Soluções:**
1. Verificar credenciais AWS:
   ```bash
   # No .env:
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   ```

2. Verificar permissões IAM:
   - Necessário: `bedrock:InvokeModel`
   - Necessário: `bedrock:ListFoundationModels`

3. Verificar se o modelo existe na região:
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```

---

## 📚 Referências

- **Bull Documentation:** https://github.com/OptimalBits/bull
- **Bull Board Documentation:** https://github.com/felixmosh/bull-board
- **Certification Queue Service:** [`backend/src/services/queue/CertificationQueueService.ts`](backend/src/services/queue/CertificationQueueService.ts:1)
- **Queue Service:** [`backend/src/services/queue/QueueService.ts`](backend/src/services/queue/QueueService.ts:1)
- **Bull Board Config:** [`backend/src/config/bullBoard.ts`](backend/src/config/bullBoard.ts:1)

---

## 🎯 Próximos Passos

1. **Testar Acesso:**
   ```bash
   # Iniciar servidor
   npm run dev
   
   # Acessar
   http://localhost:3001/admin/queues
   ```

2. **Criar Job de Teste:**
   ```bash
   # Via API
   curl -X POST http://localhost:3001/api/certification-queue/certify-model \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
       "region": "us-east-1"
     }'
   ```

3. **Monitorar no Bull Board:**
   - Acessar dashboard
   - Ver job aparecer em "Waiting"
   - Ver job passar para "Active"
   - Ver job completar em "Completed"

---

**Status:** ✅ Integrado e Documentado  
**Última Atualização:** 2026-02-08  
**Responsável:** Time de Desenvolvimento
