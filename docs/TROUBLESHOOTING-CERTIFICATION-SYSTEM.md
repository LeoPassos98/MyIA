# Troubleshooting - Sistema de Certificação Regional

## 📋 Índice

1. [Problemas Comuns](#problemas-comuns)
2. [Diagnóstico Rápido](#diagnóstico-rápido)
3. [Erros Específicos](#erros-específicos)
4. [Logs Importantes](#logs-importantes)
5. [Ferramentas de Diagnóstico](#ferramentas-de-diagnóstico)
6. [Checklist de Verificação](#checklist-de-verificação)

---

## 🔥 Problemas Comuns

### 1. Connection Refused

#### Sintoma
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

#### Causa
Backend API não está rodando

#### Solução

**Passo 1: Verificar se backend está rodando**
```bash
ps aux | grep node | grep backend
```

**Passo 2: Iniciar backend**
```bash
cd backend
npm run dev
```

**Passo 3: Verificar se iniciou corretamente**
```bash
curl http://localhost:3001/health
```

**Resposta esperada**:
```json
{"status":"healthy"}
```

---

### 2. Worker Não Processa Jobs

#### Sintoma
- Jobs ficam em "Waiting" indefinidamente
- Bull Board mostra 0 jobs "Active"
- Certificações não são atualizadas

#### Causa
Worker não está rodando ou travado

#### Diagnóstico

**Passo 1: Verificar se worker está rodando**
```bash
ps aux | grep worker
```

**Passo 2: Verificar health check**
```bash
curl http://localhost:3003/health
```

**Passo 3: Verificar logs do worker**
```bash
tail -f backend/logs/worker.log
```

#### Solução

**Opção A: Iniciar worker**
```bash
cd backend
npm run worker:dev
```

**Opção B: Reiniciar worker**
```bash
# Parar worker
pkill -f "worker"

# Iniciar novamente
cd backend
npm run worker:dev
```

**Opção C: Verificar Redis**
```bash
# Redis deve estar rodando
redis-cli ping
# Deve retornar: PONG

# Se não responder, iniciar Redis
docker run -d --name myia-redis -p 6379:6379 redis:7-alpine
```

---

### 3. Badges Não Aparecem no Frontend

#### Sintoma
- Componente não renderiza
- Tela em branco onde deveriam estar os badges
- Console mostra erros

#### Diagnóstico

**Passo 1: Abrir console do navegador (F12)**
```javascript
// Procurar por erros como:
// - "Failed to fetch"
// - "Network error"
// - "Cannot read property of undefined"
```

**Passo 2: Verificar se API está retornando dados**
```bash
curl "http://localhost:3001/api/certification-queue/certifications?modelId=anthropic:claude-3-5-sonnet&providerId=aws-bedrock"
```

**Passo 3: Verificar se há certificações no banco**
```bash
psql -U leonardo -h localhost -d myia -c "SELECT COUNT(*) FROM \"RegionalCertification\""
```

#### Solução

**Se API não responde**:
```bash
# Reiniciar backend
./start.sh restart backend
```

**Se não há dados no banco**:
```bash
# Criar certificações de teste
cd backend
npx ts-node scripts/certify-model.ts
```

**Se erro no frontend**:
```bash
# Limpar cache e recarregar
# No navegador: Ctrl+Shift+R

# Ou reiniciar frontend
./start.sh restart frontend
```

---

### 4. Certificação Sempre Falha

#### Sintoma
- Todos os modelos retornam status "failed"
- Erro: "Invalid AWS credentials"
- Erro: "AccessDeniedException"

#### Diagnóstico

**Passo 1: Verificar credenciais AWS**
```bash
aws sts get-caller-identity
```

**Resposta esperada**:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/myuser"
}
```

**Passo 2: Verificar permissões IAM**
```bash
aws iam get-user
```

**Passo 3: Testar acesso ao Bedrock**
```bash
aws bedrock list-foundation-models --region us-east-1
```

#### Solução

**Se credenciais inválidas**:
```bash
# Configurar credenciais
aws configure

# Inserir:
# AWS Access Key ID: [sua key]
# AWS Secret Access Key: [seu secret]
# Default region name: us-east-1
# Default output format: json
```

**Se falta permissão**:
1. Acessar AWS Console
2. IAM → Users → [seu usuário]
3. Add permissions → Attach policies
4. Adicionar: `AmazonBedrockFullAccess`

**Política IAM mínima**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### 5. Redis Connection Error

#### Sintoma
```
Error: Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED
```

#### Causa
Redis não está rodando

#### Solução

**Passo 1: Verificar se Redis está rodando**
```bash
docker ps | grep redis
```

**Passo 2: Iniciar Redis**
```bash
docker run -d --name myia-redis -p 6379:6379 redis:7-alpine
```

**Passo 3: Verificar conexão**
```bash
redis-cli ping
# Deve retornar: PONG
```

**Passo 4: Reiniciar worker**
```bash
cd backend
npm run worker:restart
```

---

### 6. PostgreSQL Connection Error

#### Sintoma
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Causa
PostgreSQL não está rodando

#### Solução

**Passo 1: Verificar se PostgreSQL está rodando**
```bash
sudo systemctl status postgresql
```

**Passo 2: Iniciar PostgreSQL**
```bash
sudo systemctl start postgresql
```

**Passo 3: Verificar conexão**
```bash
psql -U leonardo -h localhost -d myia -c "SELECT 1"
```

**Passo 4: Reiniciar backend**
```bash
./start.sh restart backend
```

---

## 🔍 Diagnóstico Rápido

### Checklist de 5 Minutos

Execute estes comandos em sequência:

```bash
# 1. Backend API
curl http://localhost:3001/health
# ✅ Esperado: {"status":"healthy"}

# 2. Worker
curl http://localhost:3003/health
# ✅ Esperado: {"status":"healthy","worker":"running"}

# 3. Redis
redis-cli ping
# ✅ Esperado: PONG

# 4. PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1"
# ✅ Esperado: 1

# 5. Bull Board
curl http://localhost:3001/admin/queues
# ✅ Esperado: HTML da página
```

**Se todos passarem**: Sistema está OK, problema pode ser no frontend ou configuração

**Se algum falhar**: Seguir troubleshooting específico acima

---

## ❌ Erros Específicos

### Error: Model not available in this region

**Causa**: Modelo não está disponível na região AWS selecionada

**Solução**:
1. Verificar documentação AWS Bedrock
2. Usar outra região
3. Solicitar acesso ao modelo (se necessário)

**Regiões com mais modelos**:
- `us-east-1` (N. Virginia) - Maior disponibilidade
- `us-west-2` (Oregon) - Segunda maior
- `eu-west-1` (Ireland) - Europa
- `ap-southeast-1` (Singapore) - Ásia

---

### Error: ThrottlingException

**Causa**: Quota AWS excedida (muitas requisições)

**Solução**:
1. Aguardar alguns minutos
2. Reduzir concorrência do worker
3. Solicitar aumento de quota na AWS

**Reduzir concorrência**:
```typescript
// backend/src/services/queue/CertificationQueueService.ts
concurrency: 3 // Era 5
```

---

### Error: Request timeout after 30s

**Causa**: Modelo demorou muito para responder

**Possíveis razões**:
- Latência de rede alta
- Modelo sobrecarregado
- Região AWS distante

**Solução**:
1. Aumentar timeout
2. Usar região mais próxima
3. Verificar conectividade

**Aumentar timeout**:
```typescript
// backend/src/services/queue/CertificationQueueService.ts
timeout: 60000 // 60 segundos (era 30)
```

---

### Error: Cannot read property 'status' of undefined

**Causa**: Dados de certificação não estão no formato esperado

**Solução**:
1. Verificar resposta da API
2. Verificar schema do banco
3. Limpar cache do React Query

**Limpar cache**:
```javascript
// No console do navegador (F12)
localStorage.clear();
location.reload();
```

---

### Error: Job failed with error: ENOTFOUND

**Causa**: Problema de DNS ou conectividade

**Solução**:
1. Verificar conexão com internet
2. Verificar DNS
3. Verificar firewall

**Testar conectividade**:
```bash
# Testar DNS
nslookup bedrock-runtime.us-east-1.amazonaws.com

# Testar conectividade
ping bedrock-runtime.us-east-1.amazonaws.com

# Testar HTTPS
curl https://bedrock-runtime.us-east-1.amazonaws.com
```

---

## 📝 Logs Importantes

### Localização dos Logs

```
backend/logs/
├── combined.log    # Todos os logs
├── error.log       # Apenas erros
└── worker.log      # Logs do worker
```

### Como Ler os Logs

**Ver logs em tempo real**:
```bash
tail -f backend/logs/combined.log
```

**Buscar por erros**:
```bash
grep "ERROR" backend/logs/combined.log | tail -n 50
```

**Buscar por modelo específico**:
```bash
grep "claude-3-5-sonnet" backend/logs/combined.log
```

**Ver logs de hoje**:
```bash
grep "$(date +%Y-%m-%d)" backend/logs/combined.log
```

### Padrões de Log

**Log de sucesso**:
```
2024-01-15T10:00:00.000Z [INFO] Certification completed successfully
  modelId: anthropic:claude-3-5-sonnet
  region: us-east-1
  status: certified
  duration: 5234ms
```

**Log de erro**:
```
2024-01-15T10:00:00.000Z [ERROR] Certification failed
  modelId: anthropic:claude-3-5-sonnet
  region: eu-west-1
  error: Model not available in this region
  errorCategory: UNAVAILABLE
```

---

## 🛠️ Ferramentas de Diagnóstico

### 1. Bull Board

**URL**: `http://localhost:3001/admin/queues`

**O que verificar**:
- Jobs em "Waiting" (deve ser < 10)
- Jobs em "Failed" (investigar erros)
- Jobs em "Active" (deve ser 1-5)
- Tempo médio de processamento

**Ações disponíveis**:
- Retry job falhado
- Ver detalhes do erro
- Remover job da fila

---

### 2. Prisma Studio

**Iniciar**:
```bash
cd backend
npx prisma studio
```

**URL**: `http://localhost:5555`

**O que verificar**:
- Tabela `RegionalCertification`
- Status das certificações
- Timestamps (lastTestedAt)
- Mensagens de erro

---

### 3. Redis CLI

**Conectar**:
```bash
redis-cli
```

**Comandos úteis**:
```bash
# Ver todas as keys
KEYS *

# Ver jobs em espera
LRANGE bull:certification-queue:wait 0 -1

# Ver jobs ativos
SMEMBERS bull:certification-queue:active

# Ver jobs falhados
LRANGE bull:certification-queue:failed 0 -1

# Limpar fila (CUIDADO!)
FLUSHDB
```

---

### 4. PostgreSQL CLI

**Conectar**:
```bash
psql -U leonardo -h localhost -d myia
```

**Queries úteis**:
```sql
-- Ver certificações recentes
SELECT * FROM "RegionalCertification" 
ORDER BY "lastTestedAt" DESC 
LIMIT 10;

-- Ver estatísticas por status
SELECT 
  status,
  COUNT(*) as count
FROM "RegionalCertification"
GROUP BY status;

-- Ver certificações falhadas
SELECT 
  "modelId",
  region,
  error,
  "errorCategory"
FROM "RegionalCertification"
WHERE status = 'failed'
ORDER BY "lastTestedAt" DESC;

-- Ver taxa de sucesso por modelo
SELECT 
  "modelId",
  COUNT(*) FILTER (WHERE status = 'certified') as certified,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE status = 'certified')::float / COUNT(*)) * 100 as success_rate
FROM "RegionalCertification"
GROUP BY "modelId";
```

---

## ✅ Checklist de Verificação

### Antes de Reportar um Bug

- [ ] Verificar logs de erro
- [ ] Verificar health checks
- [ ] Verificar Bull Board
- [ ] Verificar credenciais AWS
- [ ] Verificar conectividade
- [ ] Tentar reiniciar serviços
- [ ] Verificar versões das dependências
- [ ] Reproduzir o problema

### Informações para Incluir no Report

```markdown
## Descrição do Problema
[Descreva o que aconteceu]

## Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Logs Relevantes
```
[Cole os logs aqui]
```

## Ambiente
- OS: [Linux/Mac/Windows]
- Node version: [18.x]
- Backend version: [1.0.0]
- Frontend version: [1.0.0]

## Verificações Realizadas
- [ ] Health checks
- [ ] Logs verificados
- [ ] Serviços reiniciados
- [ ] Credenciais verificadas
```

---

## 🆘 Quando Escalar

### Nível 1: Você Pode Resolver

- Worker offline
- Redis offline
- API lenta
- Erros de configuração

### Nível 2: Precisa de Ajuda

- Taxa de falha > 20%
- Performance degradada
- Erros intermitentes
- Problemas de rede

### Nível 3: Crítico

- Perda de dados
- Falha de segurança
- Sistema completamente inoperante
- Corrupção de banco de dados

---

## 📞 Contatos de Suporte

- **Documentação**: `docs/`
- **Issues**: [GitHub Issues]
- **Email**: [suporte@myia.com]
- **Slack**: [#myia-support]

---

## 🔗 Links Úteis

- [Guia de Uso](./USER-GUIDE-CERTIFICATION-SYSTEM.md)
- [Guia de Manutenção](./MAINTENANCE-GUIDE-CERTIFICATION-SYSTEM.md)
- [Documentação AWS Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Documentação Bull](https://docs.bullmq.io/)

---

**Última atualização**: 2024-01-15
**Versão do documento**: 1.0.0
