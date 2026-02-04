# Plano de Implementação: Feedback Ativo de Certificação

## Contexto

Atualmente, o sistema de certificação tem uma incoerência crítica:
- **Histórico (banco)**: Mostra jobs em QUEUED
- **Estatísticas (Redis/Bull)**: Mostra jobs concluídos
- **Problema**: Worker processa jobs mas não atualiza status no banco de dados

## Objetivo

Implementar feedback visual em tempo real para o processo de certificação, com sincronização correta entre banco de dados e fila de processamento.

---

## 🔴 FASE 1: CRÍTICO - Corrigir Sincronização Banco ↔ Fila

### 1.1 Analisar Worker Atual

**Arquivos a investigar**:
- `backend/src/workers/certificationWorker.ts` - Worker principal
- `backend/src/services/queue/CertificationQueueService.ts` - Serviço de fila
- `backend/src/services/ai/certification/certification.service.ts` - Serviço de certificação

**O que procurar**:
- Como o worker processa jobs do Bull
- Onde os jobs são criados no banco (`CertificationJob`)
- Se há callbacks ou hooks para atualizar status
- Como os jobs individuais são processados

### 1.2 Identificar Pontos de Atualização

**Momentos críticos para atualizar banco**:

1. **Quando job inicia processamento**:
   - Status: `QUEUED` → `PROCESSING`
   - Campo: `startedAt` = timestamp atual

2. **Durante processamento (a cada modelo)**:
   - Campo: `processedModels` += 1
   - Campo: `successCount` ou `failureCount` += 1

3. **Quando job completa**:
   - Status: `PROCESSING` → `COMPLETED` ou `FAILED`
   - Campo: `completedAt` = timestamp atual
   - Campo: `duration` = completedAt - startedAt

### 1.3 Implementar Atualização no Worker

**Estratégia**:

```
Worker Bull Job Lifecycle:
1. onActive() → Atualizar banco: status = PROCESSING, startedAt = now
2. process() → Para cada modelo:
   - Processar certificação
   - Atualizar banco: processedModels++, successCount++ ou failureCount++
3. onCompleted() → Atualizar banco: status = COMPLETED, completedAt = now
4. onFailed() → Atualizar banco: status = FAILED, completedAt = now
```

**Código necessário**:
- Adicionar `prisma.certificationJob.update()` nos hooks do Bull
- Usar transações para garantir consistência
- Adicionar logs para rastreamento
- Tratamento de erros (se update falhar, não deve quebrar o worker)

### 1.4 Testar Sincronização

**Cenários de teste**:
1. Criar job de certificação simples (1 modelo, 1 região)
2. Verificar que status muda: QUEUED → PROCESSING → COMPLETED
3. Verificar que `processedModels` incrementa corretamente
4. Verificar que `completedAt` é preenchido
5. Testar job que falha (verificar status = FAILED)
6. Testar múltiplos jobs simultâneos

**Validação**:
- Consultar banco: `SELECT * FROM certification_jobs WHERE id = ?`
- Consultar Bull Board: `http://localhost:3001/admin/queues`
- Verificar logs do worker
- Verificar frontend atualiza corretamente

---

## 🟡 FASE 2: ALTA - Barra de Progresso Básica

### 2.1 Adicionar Coluna de Progresso na Tabela

**Arquivo**: `frontend-admin/src/components/Certifications/JobHistoryTable.tsx`

**Mudanças**:
1. Adicionar nova coluna "Progresso Visual" após coluna "Progresso"
2. Usar componente `LinearProgress` do Material-UI
3. Calcular porcentagem: `(processedModels / totalModels) * 100`
4. Cores por status:
   - QUEUED: `color="inherit"` (cinza)
   - PROCESSING: `color="primary"` (azul) com animação
   - COMPLETED: `color="success"` (verde)
   - FAILED: `color="error"` (vermelho)

**Componente sugerido**:
```
<Box sx={{ width: '100%', mr: 1 }}>
  <LinearProgress 
    variant={status === 'PROCESSING' ? 'indeterminate' : 'determinate'}
    value={percentage}
    color={getColorByStatus(status)}
  />
  <Typography variant="caption">{percentage}%</Typography>
</Box>
```

### 2.2 Adicionar Tooltip com Detalhes

**Informações no tooltip**:
- Modelos processados: X/Y
- Sucessos: N
- Falhas: M
- Tempo decorrido: HH:MM:SS
- Tempo estimado restante (se em PROCESSING)

**Componente**: `Tooltip` do Material-UI

---

## 🟡 FASE 3: ALTA - Polling Automático

### 3.1 Implementar Hook de Polling

**Arquivo novo**: `frontend-admin/src/hooks/useJobPolling.ts`

**Funcionalidade**:
- Aceita lista de job IDs para monitorar
- Faz polling a cada 2-3 segundos
- Retorna dados atualizados dos jobs
- Para automaticamente quando todos jobs estão concluídos
- Usa `useEffect` com `setInterval`

**Otimizações**:
- Só fazer polling se há jobs ativos (QUEUED ou PROCESSING)
- Usar `AbortController` para cancelar requisições pendentes
- Implementar backoff exponencial se houver erros
- Cache com React Query ou SWR para evitar requisições duplicadas

### 3.2 Integrar Polling na Tabela

**Arquivo**: `frontend-admin/src/components/Certifications/JobHistoryTable.tsx`

**Mudanças**:
1. Identificar jobs ativos na lista atual
2. Passar IDs para `useJobPolling`
3. Atualizar estado da tabela com dados do polling
4. Mostrar indicador visual de "atualizando" (pequeno spinner)

### 3.3 Adicionar Controles de Polling

**Funcionalidades**:
- Botão para pausar/retomar polling manual
- Indicador de "última atualização" (ex: "Atualizado há 2s")
- Botão de refresh manual
- Configuração de intervalo de polling (2s, 5s, 10s)

---

## 🟢 FASE 4: MÉDIA - Indicadores Visuais Melhorados

### 4.1 Ícones de Status Animados

**Componentes**:
- QUEUED: `<PendingIcon />` estático
- PROCESSING: `<CircularProgress size={20} />` animado
- COMPLETED: `<CheckCircleIcon color="success" />`
- FAILED: `<ErrorIcon color="error" />`

**Posicionamento**: Ao lado do chip de status

### 4.2 Porcentagem Numérica Destacada

**Formato**: "67%" em negrito ao lado da barra
**Cores**: Verde (>80%), Amarelo (50-80%), Vermelho (<50%)

### 4.3 Tempo Estimado

**Cálculo**:
```
velocidade = processedModels / tempoDecorrido
tempoRestante = (totalModels - processedModels) / velocidade
```

**Formato**: "~2min restantes" ou "~30s restantes"
**Posicionamento**: Abaixo da barra de progresso

### 4.4 Animações de Transição

**Biblioteca**: Framer Motion ou React Spring

**Animações**:
- Fade in ao adicionar novo job
- Slide up ao remover job concluído
- Pulse na barra de progresso quando atualiza
- Confetti ao completar job (opcional, pode ser desativado)

---

## 🟢 FASE 5: MÉDIA - Notificações de Conclusão

### 5.1 Toast/Snackbar de Conclusão

**Biblioteca**: `notistack` (já integrado com Material-UI)

**Triggers**:
- Job completa com sucesso → Toast verde
- Job falha → Toast vermelho
- Todos jobs completam → Toast especial com resumo

**Conteúdo**:
```
✅ Certificação Concluída
Job abc123... processou 3 modelos em 2min
2 sucessos, 1 falha
[Ver Detalhes]
```

### 5.2 Som de Notificação (Opcional)

**Implementação**:
- Usar Web Audio API
- Som sutil (não intrusivo)
- Configuração para ativar/desativar
- Salvar preferência no localStorage

### 5.3 Badge no Menu

**Funcionalidade**:
- Mostrar contador de jobs ativos no menu lateral
- Badge vermelho com número
- Piscar quando novo job é criado
- Desaparecer quando todos completam

**Componente**: `Badge` do Material-UI

---

## Estrutura de Arquivos

```
backend/
├── src/
│   ├── workers/
│   │   └── certificationWorker.ts (MODIFICAR)
│   └── services/
│       └── queue/
│           └── CertificationQueueService.ts (MODIFICAR)

frontend-admin/
├── src/
│   ├── hooks/
│   │   ├── useJobPolling.ts (CRIAR)
│   │   └── useJobNotifications.ts (CRIAR)
│   ├── components/
│   │   └── Certifications/
│   │       ├── JobHistoryTable.tsx (MODIFICAR)
│   │       ├── JobProgressBar.tsx (CRIAR)
│   │       └── JobStatusIndicator.tsx (CRIAR)
│   └── utils/
│       └── jobProgress.ts (CRIAR - helpers de cálculo)
```

---

## Dependências Necessárias

### Backend
- ✅ `@prisma/client` (já tem)
- ✅ `bull` (já tem)

### Frontend
- ✅ `@mui/material` (já tem)
- ✅ `axios` (já tem)
- ⚠️ `notistack` (verificar se tem, senão instalar)
- ⚠️ `react-query` ou `swr` (opcional, para polling inteligente)
- ⚠️ `framer-motion` (opcional, para animações)

---

## Cronograma Estimado

| Fase | Descrição | Complexidade | Tempo Estimado |
|------|-----------|--------------|----------------|
| 1 | Corrigir sincronização banco ↔ fila | Alta | 2-3 horas |
| 2 | Barra de progresso básica | Média | 1-2 horas |
| 3 | Polling automático | Média | 2-3 horas |
| 4 | Indicadores visuais | Baixa | 1-2 horas |
| 5 | Notificações | Baixa | 1 hora |

**Total**: 7-11 horas de desenvolvimento

---

## Critérios de Sucesso

### Fase 1 (Crítico)
- ✅ Jobs no banco sempre refletem estado real da fila
- ✅ Status muda corretamente: QUEUED → PROCESSING → COMPLETED/FAILED
- ✅ Campos `processedModels`, `successCount`, `failureCount` são atualizados
- ✅ Timestamps `startedAt` e `completedAt` são preenchidos

### Fase 2 (Alta)
- ✅ Barra de progresso visual em cada linha da tabela
- ✅ Porcentagem calculada corretamente
- ✅ Cores diferentes por status
- ✅ Tooltip com detalhes ao passar mouse

### Fase 3 (Alta)
- ✅ Tabela atualiza automaticamente a cada 2-3 segundos
- ✅ Polling para quando não há jobs ativos
- ✅ Indicador de "última atualização"
- ✅ Botão de refresh manual funciona

### Fase 4 (Média)
- ✅ Ícones animados para jobs em processamento
- ✅ Tempo estimado é exibido e atualiza
- ✅ Transições suaves ao atualizar dados

### Fase 5 (Média)
- ✅ Toast aparece quando job completa
- ✅ Badge no menu mostra jobs ativos
- ✅ Som de notificação funciona (se ativado)

---

## Riscos e Mitigações

### Risco 1: Worker não atualiza banco corretamente
**Mitigação**: 
- Adicionar logs extensivos
- Usar transações do Prisma
- Implementar retry automático
- Adicionar testes unitários

### Risco 2: Polling sobrecarrega backend
**Mitigação**:
- Implementar rate limiting
- Usar cache no backend
- Polling inteligente (só jobs ativos)
- Considerar WebSocket para produção

### Risco 3: Muitas atualizações causam re-renders
**Mitigação**:
- Usar React.memo nos componentes
- Implementar shouldComponentUpdate
- Debounce de atualizações
- Virtualização da tabela (react-window)

### Risco 4: Usuário não vê notificações
**Mitigação**:
- Notificações persistentes (não desaparecem sozinhas)
- Badge sempre visível
- Som opcional
- Histórico de notificações

---

## Próximos Passos

1. **Revisar e aprovar este plano**
2. **Começar pela Fase 1** (crítico)
3. **Testar cada fase antes de avançar**
4. **Coletar feedback do usuário**
5. **Iterar e melhorar**

---

## Notas Técnicas

### Sincronização Banco ↔ Fila

O Bull oferece hooks que podemos usar:

```typescript
queue.on('active', async (job) => {
  // Atualizar banco: status = PROCESSING
});

queue.on('completed', async (job, result) => {
  // Atualizar banco: status = COMPLETED
});

queue.on('failed', async (job, err) => {
  // Atualizar banco: status = FAILED
});
```

### Polling Inteligente

Usar React Query para polling com cache:

```typescript
const { data } = useQuery(
  ['jobs', jobIds],
  () => fetchJobs(jobIds),
  {
    refetchInterval: hasActiveJobs ? 2000 : false,
    staleTime: 1000
  }
);
```

### Performance

- Limitar tabela a 50 jobs por página
- Usar paginação server-side
- Implementar virtualização se necessário
- Cache agressivo de jobs concluídos
