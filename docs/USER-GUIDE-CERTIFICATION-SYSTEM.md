# Guia de Uso - Sistema de Certificação Regional

## 📋 Visão Geral

O Sistema de Certificação Regional é uma funcionalidade do MyIA que verifica automaticamente a disponibilidade e qualidade de modelos de IA em diferentes regiões da AWS. Isso garante que os usuários saibam exatamente onde cada modelo funciona antes de utilizá-lo.

### O que é Certificação Regional?

Certificação regional é o processo de testar se um modelo de IA específico está:
- ✅ **Disponível** na região AWS
- ✅ **Funcionando corretamente** (responde a prompts)
- ✅ **Com qualidade adequada** (respostas coerentes)
- ✅ **Acessível** (credenciais e permissões corretas)

### Por que é Importante?

- **Evita erros em produção**: Saber antecipadamente se um modelo funciona em uma região
- **Otimiza custos**: Escolher regiões com melhor disponibilidade
- **Melhora experiência**: Usuários veem apenas modelos certificados
- **Facilita debugging**: Identificar rapidamente problemas de configuração

### Regiões Suportadas

O sistema atualmente suporta 4 regiões AWS principais:

| Região | Nome Amigável | Código |
|--------|---------------|--------|
| 🇺🇸 US East | N. Virginia | `us-east-1` |
| 🇺🇸 US West | Oregon | `us-west-2` |
| 🇪🇺 EU West | Ireland | `eu-west-1` |
| 🇸🇬 AP Southeast | Singapore | `ap-southeast-1` |

---

## 👨‍💼 Para Administradores

### Como Certificar um Modelo

#### 1. Acessar o Painel Admin

```bash
# Abrir navegador em:
http://localhost:3003
```

#### 2. Fazer Login (se necessário)

```
Email: admin@myia.com
Senha: [sua senha configurada]
```

#### 3. Navegar para "Certificar Modelo"

- No menu lateral, clique em **"Certificação"**
- Clique no botão **"+ Novo Teste"**

#### 4. Preencher Formulário de Certificação

**Campos obrigatórios:**

- **Modelo**: Selecione o modelo a ser testado
  - Exemplo: `Claude 3.5 Sonnet`
  
- **Provider**: Selecione o provedor
  - Exemplo: `AWS Bedrock`
  
- **Regiões**: Selecione uma ou mais regiões (múltipla escolha)
  - ✅ US East (N. Virginia)
  - ✅ US West (Oregon)
  - ✅ EU West (Ireland)
  - ✅ AP Southeast (Singapore)

**Exemplo de preenchimento:**
```
Modelo: anthropic:claude-3-5-sonnet-20241022
Provider: aws-bedrock
Regiões: [us-east-1, us-west-2, eu-west-1]
```

#### 5. Iniciar Certificação

- Clique no botão **"Iniciar Certificação"**
- O sistema criará jobs para cada região selecionada
- Você verá uma mensagem de confirmação

#### 6. Acompanhar Progresso

**Opção A: Bull Board (Recomendado)**
```bash
# Abrir navegador em:
http://localhost:3001/admin/queues
```

Aqui você verá:
- ⏳ **Waiting**: Jobs aguardando processamento
- 🔄 **Active**: Jobs sendo processados agora
- ✅ **Completed**: Jobs finalizados com sucesso
- ❌ **Failed**: Jobs que falharam

**Opção B: Histórico no Admin**
- No painel admin, vá para **"Histórico"**
- Veja todos os testes realizados
- Filtre por modelo, região ou status

---

### Como Monitorar o Sistema

#### 1. Bull Board - Monitoramento de Filas

**URL**: `http://localhost:3001/admin/queues`

**O que monitorar:**
- **Queue Length**: Número de jobs aguardando
- **Processing Rate**: Jobs processados por minuto
- **Failed Jobs**: Jobs que falharam (investigar)
- **Retry Count**: Quantas vezes um job foi reprocessado

**Ações disponíveis:**
- 🔄 **Retry**: Reprocessar job falhado
- 🗑️ **Remove**: Remover job da fila
- 🔍 **Details**: Ver detalhes do erro

#### 2. Worker Health Check

**URL**: `http://localhost:3003/health`

**Resposta esperada:**
```json
{
  "status": "healthy",
  "worker": "running",
  "redis": "connected",
  "database": "connected",
  "uptime": "2h 15m"
}
```

**Se unhealthy:**
1. Verificar logs do worker
2. Verificar conexão Redis
3. Verificar conexão PostgreSQL
4. Reiniciar worker se necessário

#### 3. Logs do Sistema

**Localização**: `backend/logs/`

**Arquivos importantes:**
- `combined.log` - Todos os logs
- `error.log` - Apenas erros
- `worker.log` - Logs do worker de certificação

**Como visualizar em tempo real:**
```bash
# Todos os logs
tail -f backend/logs/combined.log

# Apenas erros
tail -f backend/logs/error.log

# Worker
tail -f backend/logs/worker.log
```

---

### Interpretação de Status

#### ✅ certified (Certificado)

**Significado**: Modelo funciona perfeitamente na região

**Características:**
- Responde a prompts corretamente
- Qualidade de resposta adequada
- Sem erros de configuração
- Taxa de sucesso: 100%

**Ação**: Nenhuma. Modelo pronto para uso.

---

#### ❌ failed (Falhou)

**Significado**: Modelo não funciona na região

**Possíveis causas:**
1. **Modelo não disponível na região**
   - Erro: `Model not available in this region`
   - Solução: Usar outra região

2. **Credenciais AWS inválidas**
   - Erro: `Invalid AWS credentials`
   - Solução: Verificar `~/.aws/credentials`

3. **Quota excedida**
   - Erro: `ThrottlingException`
   - Solução: Aguardar ou solicitar aumento de quota

4. **Timeout**
   - Erro: `Request timeout after 30s`
   - Solução: Verificar conectividade de rede

**Ação**: Ver tooltip do badge para detalhes do erro

---

#### ⚠️ quality_warning (Aviso de Qualidade)

**Significado**: Modelo funciona, mas com problemas de qualidade

**Características:**
- Responde a prompts
- Qualidade de resposta abaixo do esperado
- Taxa de sucesso: 50-99%

**Possíveis causas:**
- Respostas incompletas
- Latência alta
- Erros intermitentes

**Ação**: Investigar logs para entender o problema

---

#### ⏳ pending (Pendente)

**Significado**: Teste aguardando processamento

**Características:**
- Job criado mas não iniciado
- Na fila do Bull
- Será processado em breve

**Ação**: Aguardar. Se demorar muito, verificar worker.

---

#### ⚪ not_tested (Não Testado)

**Significado**: Modelo nunca foi testado nesta região

**Características:**
- Sem dados de certificação
- Status desconhecido

**Ação**: Iniciar certificação para esta região

---

#### 🔧 configuration_required (Configuração Necessária)

**Significado**: Problema de configuração do sistema

**Possíveis causas:**
- Variáveis de ambiente faltando
- Credenciais AWS não configuradas
- Permissões IAM insuficientes

**Ação**: Verificar configuração do sistema

---

#### 🔐 permission_required (Permissão Necessária)

**Significado**: Falta permissão IAM para acessar o modelo

**Erro típico**: `AccessDeniedException`

**Solução**:
1. Verificar política IAM
2. Adicionar permissão `bedrock:InvokeModel`
3. Adicionar permissão para o modelo específico

**Exemplo de política IAM:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

---

## 👤 Para Usuários

### Como Ver Status de Certificação

#### 1. Acessar o Chat

```bash
# Abrir navegador em:
http://localhost:3000
```

#### 2. Selecionar um Modelo

- No painel de controle, selecione um modelo
- Exemplo: **Claude 3.5 Sonnet**

#### 3. Visualizar Badges Regionais

Você verá badges coloridos para cada região:

```
🟢 US East     ✅ Certificado
🟢 US West     ✅ Certificado  
🔴 EU West     ❌ Falhou
🟡 AP Southeast ⚠️ Aviso
```

#### 4. Ver Detalhes

- **Hover no badge**: Ver tooltip com detalhes
- **Tooltip mostra**:
  - Status da certificação
  - Última vez testado
  - Taxa de sucesso
  - Mensagem de erro (se houver)

**Exemplo de tooltip:**
```
Status: Certificado
Última verificação: há 2 horas
Taxa de sucesso: 100%
Tentativas: 5
```

---

### Como Filtrar por Região

#### 1. Usar Dropdown de Região

No painel de controle, você verá um dropdown:

```
┌─────────────────────┐
│ Região: Todas      ▼│
└─────────────────────┘
```

#### 2. Selecionar Região Desejada

Opções disponíveis:
- **Todas as regiões** (padrão)
- **US East (N. Virginia)**
- **US West (Oregon)**
- **EU West (Ireland)**
- **AP Southeast (Singapore)**

#### 3. Ver Apenas Badges da Região

Após selecionar, você verá apenas o badge da região escolhida:

```
Região: US East
🟢 US East ✅ Certificado
```

---

### Entendendo as Cores dos Badges

| Cor | Status | Significado |
|-----|--------|-------------|
| 🟢 Verde | Certificado | Funciona perfeitamente |
| 🔴 Vermelho | Falhou | Não funciona |
| 🟡 Amarelo | Aviso | Funciona com problemas |
| ⚪ Cinza | Não testado | Status desconhecido |
| 🔵 Azul | Pendente | Teste em andamento |

---

## ❓ FAQ (Perguntas Frequentes)

### Por que um modelo falhou em uma região?

**Resposta**: Existem várias razões possíveis:

1. **Modelo não disponível na região**
   - Nem todos os modelos estão em todas as regiões
   - Verifique a documentação da AWS

2. **Credenciais AWS inválidas**
   - Verifique `~/.aws/credentials`
   - Execute: `aws sts get-caller-identity`

3. **Quota excedida**
   - AWS limita requisições por minuto
   - Aguarde alguns minutos e tente novamente

4. **Timeout de rede**
   - Verifique sua conexão com a internet
   - Verifique se há firewall bloqueando

**Como investigar**:
1. Hover no badge vermelho
2. Ler mensagem de erro no tooltip
3. Verificar logs: `tail -f backend/logs/error.log`
4. Verificar Bull Board: `http://localhost:3001/admin/queues`

---

### Com que frequência as certificações são atualizadas?

**Resposta**: 

- **Auto-refresh no frontend**: A cada 30 segundos
- **Recertificação automática**: Não implementado ainda
- **Recertificação manual**: A qualquer momento pelo admin

**Para forçar atualização**:
1. Recarregue a página (F5)
2. Ou aguarde 30 segundos (auto-refresh)

---

### Posso forçar uma atualização?

**Resposta**: Sim, de duas formas:

**Opção 1: Recarregar página (Usuário)**
```
Pressione F5 ou Ctrl+R
```

**Opção 2: Recertificar modelo (Admin)**
1. Acesse `http://localhost:3003`
2. Vá para "Certificação"
3. Clique em "Recertificar"
4. Selecione modelo e regiões
5. Clique em "Iniciar"

---

### O que significa "Taxa de Sucesso"?

**Resposta**: 

Taxa de sucesso é a porcentagem de testes que passaram:

- **100%**: Todas as tentativas foram bem-sucedidas
- **75%**: 3 de 4 tentativas foram bem-sucedidas
- **50%**: Metade das tentativas falharam
- **0%**: Todas as tentativas falharam

**Exemplo**:
```
Tentativas: 5
Sucessos: 4
Falhas: 1
Taxa de sucesso: 80%
```

---

### Posso certificar modelos de outros providers?

**Resposta**: 

Atualmente, o sistema suporta apenas **AWS Bedrock**.

**Providers planejados para o futuro**:
- OpenAI
- Azure OpenAI
- Google Vertex AI
- Anthropic Direct

---

### Como sei se o worker está funcionando?

**Resposta**: Verifique de 3 formas:

**1. Health Check**
```bash
curl http://localhost:3003/health
```

**2. Bull Board**
```bash
# Abrir navegador em:
http://localhost:3001/admin/queues
```

**3. Logs**
```bash
tail -f backend/logs/worker.log
```

**Se não estiver funcionando**:
```bash
# Reiniciar worker
cd backend
npm run worker:restart
```

---

### Quanto tempo leva para certificar um modelo?

**Resposta**: 

- **Por região**: 5-10 segundos
- **4 regiões**: 20-40 segundos
- **Com retry**: até 2 minutos

**Fatores que afetam o tempo**:
- Latência da rede
- Carga do modelo AWS
- Tamanho da fila
- Número de workers ativos

---

### Posso ver o histórico de certificações?

**Resposta**: Sim, no painel admin:

1. Acesse `http://localhost:3003`
2. Vá para "Histórico"
3. Veja todas as certificações realizadas

**Filtros disponíveis**:
- Por modelo
- Por região
- Por status
- Por data

---

### O que fazer se todos os modelos falharem?

**Resposta**: Siga este checklist:

**1. Verificar credenciais AWS**
```bash
aws sts get-caller-identity
```

**2. Verificar permissões IAM**
```bash
aws iam get-user
```

**3. Verificar worker**
```bash
curl http://localhost:3003/health
```

**4. Verificar logs**
```bash
tail -f backend/logs/error.log
```

**5. Verificar Redis**
```bash
redis-cli ping
# Deve retornar: PONG
```

**6. Verificar PostgreSQL**
```bash
psql -U leonardo -h localhost -d myia -c "SELECT 1"
```

Se tudo estiver OK e ainda assim falhar, entre em contato com o suporte.

---

## 🔗 Links Úteis

- **Frontend Usuário**: http://localhost:3000
- **Frontend Admin**: http://localhost:3003
- **Bull Board**: http://localhost:3001/admin/queues
- **API Backend**: http://localhost:3001/api
- **Health Check**: http://localhost:3003/health

---

## 📞 Suporte

Para problemas ou dúvidas:

1. **Documentação**: Leia os guias em `docs/`
2. **Logs**: Verifique `backend/logs/`
3. **Issues**: Abra um issue no repositório
4. **Contato**: [seu email de suporte]

---

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✅ Certificação regional implementada
- ✅ Suporte para 4 regiões AWS
- ✅ Auto-refresh a cada 30 segundos
- ✅ Bull Board para monitoramento
- ✅ Badges coloridos no frontend

---

**Última atualização**: 2024-01-15
**Versão do documento**: 1.0.0
