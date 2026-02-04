# 🎛️ Guia do Frontend Admin (Painel de Certificações)

## 📍 Acesso

- **URL:** http://localhost:3003
- **Credenciais:**
  - Email: `leo@leo.com`
  - Senha: `leoleo`

---

## 📊 Visão Geral da Página

Ao fazer login, você verá a página de **Certificações** com 3 seções principais:

### 1. 📈 **Estatísticas Gerais** (Topo)
- **Total de Jobs:** Quantos jobs de certificação foram criados
- **Jobs Ativos:** Jobs em execução (QUEUED, PROCESSING)
- **Jobs Concluídos:** Jobs finalizados com sucesso
- **Taxa de Sucesso:** Percentual de jobs bem-sucedidos

### 2. 🚀 **Certificar Modelos** (Card Verde)
Formulário para iniciar nova certificação:

**Campos:**
- **Tipo de Certificação:**
  - `Modelo Único`: Certifica apenas um modelo específico
  - `Múltiplos Modelos`: Certifica vários modelos selecionados
  - `Todos os Modelos`: Certifica todos os modelos disponíveis

- **Região(ões) AWS:** Escolha em quais regiões rodar os testes
  - `us-east-1`, `us-west-2`, `eu-west-1`, etc.
  - Pode selecionar múltiplas regiões

- **Modelo(s):** (Se não for "Todos")
  - Lista de modelos disponíveis no sistema
  - Ex: `claude-3-sonnet-20240229-v1:0`

**Botão "Iniciar Certificação":**
- Cria um **Job** (tarefa) de certificação
- Envia para fila de processamento
- Retorna um **Job ID** (ex: `e54c98b6...`)

---

### 3. 📋 **Histórico de Jobs** (Tabela Principal)

#### Colunas da Tabela

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| **🔽 (Seta)** | Clique para expandir e ver modelos certificados | - |
| **ID** | Identificador único do job (8 primeiros caracteres) | `e54c98b6...` |
| **Tipo** | Tipo de certificação executada | `Único`, `Múltiplos`, `Todos` |
| **Regiões** | Regiões AWS onde rodou | `us-west-2`, `us-east-1` |
| **Status** | Estado atual do job | Ver tabela abaixo |
| **Progresso Visual** | Barra de progresso + contagem | `100% - 1/1 modelos` |
| **Criado em** | Data/hora de criação | `02/02/2026, 19:40:51` |

#### Status Possíveis

| Status | Badge | Significado |
|--------|-------|-------------|
| `PENDING` | 🟡 Amarelo | Job criado, aguardando processamento |
| `QUEUED` | 🔵 Azul | Na fila, aguardando worker disponível |
| `PROCESSING` | 🟣 Roxo | Em execução (certificando modelos) |
| `COMPLETED` | 🟢 Verde | Finalizado com sucesso |
| `FAILED` | 🔴 Vermelho | Erro durante execução |
| `CANCELLED` | ⚫ Cinza | Cancelado pelo usuário |
| `PAUSED` | 🟠 Laranja | Pausado temporariamente |

---

## 🔍 Detalhes de um Job (Expandir Linha)

Quando você clica na **seta** (🔽) de um job, uma nova linha se expande mostrando:

### 📋 Modelos Certificados neste Job

**⚠️ LIMITAÇÃO ATUAL:**
O sistema **não persiste** as certificações individuais no banco de dados. O schema atual (`CertificationJob`) armazena apenas:
- Contadores agregados (`totalModels`, `processedModels`, `successCount`, `failureCount`)
- **NÃO** armazena detalhes de cada modelo certificado

**Por que mostra "Nenhum modelo encontrado"?**

O banco de dados atual não tem uma tabela de certificações individuais. O `CertificationJob` só guarda estatísticas.

**Onde ver os resultados então?**

Existem duas alternativas:

1. **Logs do Worker** (tempo real):
   ```bash
   tail -f /home/leonardo/Documents/VSCODE/MyIA/logs/backend.out.log | grep -A5 "Certification"
   ```

2. **Tabela `model_certifications`** (se existir):
   A tabela `model_certifications` armazena os resultados finais de certificação por modelo+região, mas **não está vinculada** ao job.

**Como seria a solução ideal?**

Seria necessário:
1. Criar uma migration para adicionar tabela `JobCertification`:
   ```prisma
   model JobCertification {
     id            String   @id @default(uuid())
     jobId         String
     job           CertificationJob @relation(fields: [jobId], references: [id])
     modelId       String
     model         AiModel  @relation(fields: [modelId], references: [id])
     region        String
     status        String   // PASSED, FAILED, WARNING
     startedAt     DateTime
     completedAt   DateTime?
     duration      Int?
     error         String?
     createdAt     DateTime @default(now())
   }
   ```

2. Modificar o worker para salvar cada certificação individual nesta tabela

**Contorno atual:**
Por ora, use os **contadores no job** para saber se passou:
- `successCount > 0` → Alguns modelos passaram
- `failureCount > 0` → Alguns modelos falharam
- `processedModels === totalModels` → Job completou

E consulte a tabela `model_certifications` diretamente no banco para ver resultados por modelo.

---

## 🛠️ Como Usar (Passo a Passo)

### 1️⃣ Certificar um Modelo Específico

1. Selecione **"Modelo Único"**
2. Escolha a região (ex: `us-east-1`)
3. Selecione o modelo (ex: `Claude 3 Sonnet`)
4. Clique em **"Iniciar Certificação"**
5. Aguarde notificação de sucesso
6. Vá para **Histórico de Jobs** e veja o job criado

### 2️⃣ Certificar Todos os Modelos

1. Selecione **"Todos os Modelos"**
2. Escolha uma ou mais regiões
3. Clique em **"Iniciar Certificação"**
4. Um job será criado para cada combinação modelo+região
5. Acompanhe o progresso na tabela

### 3️⃣ Ver Resultados de uma Certificação

1. Na tabela de **Histórico de Jobs**, localize o job
2. Aguarde o status mudar para `COMPLETED`
3. Clique na **seta** (🔽) para expandir
4. Veja a lista de modelos certificados com:
   - ✅ **PASSED:** Modelo aprovado
   - ❌ **FAILED:** Modelo reprovado
   - ⚠️ **WARNING:** Aprovado com ressalvas

---

## 🔄 Polling Automático

O sistema atualiza automaticamente:
- **Jobs ATIVOS** (QUEUED, PROCESSING): A cada 5 segundos
- **Jobs INATIVOS** (COMPLETED, FAILED): Não atualiza (economiza recursos)

Você verá a barra de progresso se movendo em tempo real enquanto o job roda.

---

## 🐛 Troubleshooting

### "Nenhum modelo encontrado para este job"

**Causa:** Backend não está retornando as certificações relacionadas.

**Solução:** A correção foi aplicada. Reinicie o backend:
```bash
cd /home/leonardo/Documents/VSCODE/MyIA
./start.sh restart
```

### "Failed to load regions"

**Causa:** Rota `/api/certification-queue/regions` não encontrada.

**Verificação:**
```bash
curl http://localhost:3001/api/certification-queue/regions
```

### Job fica "QUEUED" para sempre

**Causa:** Worker não está rodando.

**Verificação:**
```bash
cd /home/leonardo/Documents/VSCODE/MyIA
./manage-certifications.sh
# Opção 1: Ver Status do Sistema
```

**Solução:**
```bash
./start.sh restart
```

---

## 📊 Exemplos de Uso

### Exemplo 1: Testar Claude 3 Sonnet em Produção

```
Tipo: Modelo Único
Modelo: anthropic.claude-3-sonnet-20240229-v1:0
Região: us-east-1
```

**Resultado esperado:**
- Job ID: `a1b2c3d4...`
- Status: PROCESSING → COMPLETED
- Progresso: 100% - 1/1 modelos
- Detalhes: ✅ PASSED (após expandir)

### Exemplo 2: Certificar Todos os Modelos Claude

```
Tipo: Múltiplos Modelos
Modelos: 
  - Claude 3 Opus
  - Claude 3 Sonnet
  - Claude 3 Haiku
Regiões: us-east-1, eu-west-1
```

**Resultado esperado:**
- 6 certificações (3 modelos × 2 regiões)
- Job ID único
- Progresso: 0% → 16% → 33% → ... → 100%

---

## 🧪 Testando o Sistema

Use o script de teste:

```bash
cd /home/leonardo/Documents/VSCODE/MyIA
./test-manage-certifications.sh
```

Isso:
1. Certifica alguns modelos automaticamente
2. Mostra logs em tempo real
3. Valida se o sistema está funcionando

---

## 📚 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `frontend-admin/src/pages/Certifications.tsx` | Página principal |
| `frontend-admin/src/components/Certifications/JobHistoryTable.tsx` | Tabela de jobs |
| `frontend-admin/src/components/Certifications/JobDetailsRow.tsx` | Detalhes expandidos |
| `frontend-admin/src/services/certificationApi.ts` | Cliente API |
| `backend/src/controllers/certificationQueueController.ts` | API backend |
| `backend/src/services/queue/CertificationQueueService.ts` | Serviço de fila |

---

## 💡 Dicas

1. **Use filtros:** Digite o Job ID na busca para encontrar rapidamente
2. **Status filter:** Filtre por `COMPLETED` para ver apenas finalizados
3. **Polling inteligente:** Deixe a página aberta para ver atualizações em tempo real
4. **Bull Board:** Acesse `http://localhost:3001/admin/queues` para ver a fila interna

---

## 🎯 Próximos Passos

Após reiniciar o backend com a correção:

1. Acesse http://localhost:3003
2. Faça login
3. Crie um job de teste (Modelo Único)
4. Aguarde completar
5. Expanda a linha e veja os modelos certificados ✅

**Agora você deve ver os modelos certificados corretamente!**
