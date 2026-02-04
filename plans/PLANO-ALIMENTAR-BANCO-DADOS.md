# Plano: Alimentar Banco de Dados Após Reset

## 📋 Contexto

Após reset da aplicação, o banco de dados precisa ser populado com dados essenciais para funcionamento completo do sistema MyIA.

## 🎯 Objetivo

Criar um plano passo-a-passo para:
1. Diagnosticar estado atual do banco
2. Popular dados essenciais (usuários, providers, modelos)
3. Adicionar modelos AWS Bedrock
4. Certificar modelos disponíveis
5. Validar funcionamento completo

## 📊 Análise do Schema Atual

### Tabelas Principais

#### 1. **Autenticação e Usuários**
- `users` - Usuários do sistema
- `user_settings` - Configurações e chaves API
- `provider_credential_validations` - Validação de credenciais

#### 2. **Sistema de IA**
- `ai_providers` - Providers (OpenAI, Groq, AWS Bedrock, etc.)
- `ai_models` - Modelos disponíveis
- `user_provider_credentials` - Credenciais BYOK

#### 3. **Chat e Histórico**
- `chats` - Conversas
- `messages` - Mensagens com telemetria
- `api_call_logs` - Logs de chamadas API

#### 4. **Certificação de Modelos**
- `model_certifications` - Certificações regionais (Fase 3)
- `certification_jobs` - Jobs de certificação assíncrona
- `model_certifications_legacy` - Sistema legado (compatibilidade)

#### 5. **Logging**
- `logs` - Logs estruturados do sistema

## 🔍 Passo 1: Diagnóstico do Estado Atual

### 1.1. Criar Script de Diagnóstico

**Arquivo**: `backend/scripts/diagnose-database-state.ts`

**Funcionalidades**:
- ✅ Verificar conexão com PostgreSQL
- ✅ Verificar existência do schema (tabelas)
- ✅ Contar registros em cada tabela
- ✅ Identificar tabelas vazias
- ✅ Gerar recomendações personalizadas

**Comando**:
```bash
cd backend && npx ts-node scripts/diagnose-database-state.ts
```

**Saída Esperada**:
```
🔍 DIAGNÓSTICO DO BANCO DE DADOS
============================================================

✅ Conexão com banco de dados OK

🔍 Verificando schema do banco de dados...
📊 Tabelas existentes: 10/10
✅ Tabelas encontradas:
   - users
   - user_settings
   - ai_providers
   - ai_models
   - chats
   - messages
   - api_call_logs
   - model_certifications
   - certification_jobs
   - logs

📊 Verificando dados nas tabelas...

📋 Estado das tabelas:

⚠️  Tabelas vazias:
   users                          0 registros
   ai_providers                   0 registros
   ai_models                      0 registros
   chats                          0 registros
   messages                       0 registros
   api_call_logs                  0 registros
   model_certifications           0 registros
   certification_jobs             0 registros
   logs                           0 registros

============================================================
💡 RECOMENDAÇÕES
============================================================

📝 Passos necessários para popular o banco:

1️⃣  SEED BÁSICO (Obrigatório)
   Popula: users, ai_providers, ai_models, chats, messages
   Comando: cd backend && npx prisma db seed
   Usuário criado: leo@leo.com / leoleo

2️⃣  ADICIONAR MODELOS AWS BEDROCK (Recomendado)
   Adiciona 100+ modelos do AWS Bedrock ao registry
   Comando: cd backend && npx ts-node scripts/add-models-to-registry.ts
   Pré-requisito: Configurar credenciais AWS no frontend

3️⃣  CERTIFICAR MODELOS (Opcional)
   Testa e certifica modelos disponíveis
   Comando: ./manage-certifications.sh
   Ou: cd backend && npx ts-node scripts/recertify-all-models.ts

📌 RESUMO:
   ⚠️  Banco está vazio - Execute o seed primeiro

✅ Diagnóstico concluído!
```

## 🌱 Passo 2: Seed Básico (Obrigatório)

### 2.1. O que o Seed Faz

**Arquivo**: `backend/prisma/seed.ts`

**Dados Criados**:

#### Usuário Padrão
- Email: `leo@leo.com`
- Senha: `leoleo`
- Nome: Leo
- Settings: tema light, chaves API null

#### Providers
- OpenAI (slug: `openai`)
- Groq (slug: `groq`)
- Together AI (slug: `together`)
- AWS Bedrock (slug: `bedrock`)

#### Modelos Básicos
- **OpenAI**: GPT-4 Turbo, GPT-3.5 Turbo
- **Groq**: Llama 3.3 70B, Llama 3.1 8B
- **Together**: Llama 3 70B, Qwen 1.5 72B

#### Chats de Exemplo
- 3 conversas com mensagens
- Telemetria fake mas consistente
- sentContext com traces completos

### 2.2. Executar Seed

**Comando**:
```bash
cd backend && npx prisma db seed
```

**Saída Esperada**:
```
🌱 Iniciando seed completo do MyIA...
🌱 Populando Provedores de IA...
✅ Seed finalizado com sucesso!
🌱 Seeding providers e modelos...
✅ OpenAI OK (ID: xxx, models: 2)
✅ Groq OK (ID: xxx, models: 2)
✅ Together OK (ID: xxx, models: 2)
👤 Seeding usuário leo@leo.com ...
✅ User OK (ID: xxx)
💬 Seeding chats + mensagens + sentContext...
✅ Chats + mensagens + traces OK
🏁 Seed finalizado com sucesso!
```

### 2.3. Validar Seed

**Comando**:
```bash
cd backend && npx ts-node scripts/diagnose-database-state.ts
```

**Resultado Esperado**:
```
✅ Tabelas com dados:
   users                          1 registros
   user_settings                  1 registros
   ai_providers                   4 registros
   ai_models                      6 registros
   chats                          3 registros
   messages                      12 registros
   api_call_logs                  6 registros
```

## 🚀 Passo 3: Adicionar Modelos AWS Bedrock (Recomendado)

### 3.1. Pré-requisitos

1. **Configurar Credenciais AWS**:
   - Acessar frontend: `http://localhost:3000`
   - Login: `leo@leo.com` / `leoleo`
   - Ir em Settings → AWS Credentials
   - Adicionar:
     - Access Key ID
     - Secret Access Key
     - Region (ex: `us-east-1`)

2. **Verificar Credenciais**:
```bash
cd backend && npx ts-node scripts/check-aws-models.ts
```

### 3.2. Executar Script de Adição

**Modo Preview (Dry-Run)**:
```bash
cd backend && npx ts-node scripts/add-models-to-registry.ts --dry-run
```

**Adicionar Todos os Modelos**:
```bash
cd backend && npx ts-node scripts/add-models-to-registry.ts
```

**Adicionar Apenas um Vendor**:
```bash
cd backend && npx ts-node scripts/add-models-to-registry.ts --vendor=mistral
```

### 3.3. O que o Script Faz

1. **Busca** todos os modelos disponíveis no AWS Bedrock (150+)
2. **Filtra** modelos relevantes (TEXT output, ON_DEMAND)
3. **Exclui** blacklist (Nova Sonic, Nova 2 Sonic)
4. **Compara** com registry atual
5. **Identifica** modelos não configurados (100+)
6. **Agrupa** por vendor (Anthropic, Amazon, Cohere, Meta, Mistral, NVIDIA, etc.)
7. **Gera** código TypeScript automaticamente
8. **Adiciona** aos arquivos `*.models.ts`
9. **Atualiza** `index.ts` com novos exports
10. **Cria** backups dos arquivos modificados

### 3.4. Vendors Adicionados

- **ai21** - AI21 Labs models
- **cohere** - Cohere Command models
- **google** - Google Gemini models
- **meta** - Meta Llama models
- **minimax** - MiniMax models
- **mistral** - Mistral AI models (11+ modelos)
- **moonshot** - Moonshot models
- **nvidia** - NVIDIA NIM models
- **openai** - OpenAI models via Bedrock
- **qwen** - Alibaba Qwen models
- **twelvelabs** - TwelveLabs models

### 3.5. Saída Esperada

```
🚀 Iniciando adição de modelos ao registry...

🔍 Buscando modelos disponíveis no AWS Bedrock...
✅ 150 modelos encontrados no AWS Bedrock

🔧 Filtrando modelos relevantes...
⛔ Modelo na blacklist: amazon.nova-sonic-v1:0
⛔ Modelo na blacklist: amazon.nova-2-sonic-v1:0
✅ 148 modelos relevantes após filtragem

🔍 Comparando com registry atual...
📊 Registry atual: 34 modelos
📊 AWS Bedrock: 148 modelos
✅ 114 modelos não configurados identificados

📦 Agrupando modelos por vendor...
📊 Distribuição por vendor:
   ai21: 2 modelos
   cohere: 1 modelos
   mistral: 11 modelos
   nvidia: 3 modelos
   ...

📝 Escrevendo modelos em arquivos...

📄 mistral.models.ts (11 modelos)
   ✨ Criando novo arquivo
   💾 Backup criado: mistral.models.ts.backup
   ✅ Arquivo escrito com sucesso
   + mistral.mistral-large-2407-v1:0
   + mistral.mistral-large-2411-v1:0
   ...

📝 Atualizando index.ts com 8 novos vendors...
✅ index.ts atualizado

============================================================
📊 RELATÓRIO FINAL
============================================================

✅ Total de modelos adicionados: 114
📦 Vendors afetados: 11

📊 Por Vendor:
   mistral (11 modelos):
      ⚙️  mistral.mistral-large-2407-v1:0
      ⚙️  mistral.mistral-large-2411-v1:0
      ...

📝 Legenda:
   🔐 = Requer Inference Profile
   👁️ = Suporta Vision
   ⚙️ = Suporta Function Calling

✅ Modelos adicionados com sucesso!
💡 Execute os testes para validar os novos modelos:
   npx ts-node backend/scripts/test-all-models.ts

🎉 Script finalizado!
```

### 3.6. Validar Modelos Adicionados

**Listar Modelos no Registry**:
```bash
cd backend && npx ts-node scripts/list-registry-models.ts
```

**Verificar no Banco**:
```bash
cd backend && npx ts-node scripts/diagnose-database-state.ts
```

**Resultado Esperado**:
```
✅ Tabelas com dados:
   ai_models                    120 registros  ← 6 + 114 novos
```

## 🎖️ Passo 4: Certificar Modelos (Opcional)

### 4.1. Por que Certificar?

- ✅ Valida que modelos funcionam corretamente
- ✅ Testa conectividade com AWS Bedrock
- ✅ Identifica modelos com problemas
- ✅ Gera badges de qualidade (PREMIUM, RECOMENDADO, etc.)
- ✅ Calcula ratings (0-5 estrelas)
- ✅ Popula tabela `model_certifications`

### 4.2. Métodos de Certificação

#### Método 1: Script CLI Interativo (Recomendado)

**Comando**:
```bash
./manage-certifications.sh
```

**Menu**:
```
╔════════════════════════════════════════════════════════════╗
║        🎖️  GERENCIADOR DE CERTIFICAÇÕES DE MODELOS        ║
╚════════════════════════════════════════════════════════════╝

📊 Status dos Serviços:
   Backend:  ✅ Rodando (PID: 12345)
   Redis:    ✅ Conectado
   Worker:   ✅ Integrado ao backend

🔐 Autenticação:
   Status: ✅ Autenticado
   Token:  eyJhbGc...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MENU PRINCIPAL

 1) 🎯 Certificar modelo específico
 2) 📦 Certificar vendor completo
 3) 🌍 Certificar por região
 4) 🔄 Re-certificar modelos expirados
 5) 🚀 Certificar TODOS os modelos
 6) 📊 Ver estatísticas
 7) 📜 Ver histórico de jobs
 8) 🔍 Ver detalhes de job
 9) ⏸️  Pausar/Retomar jobs
10) ❌ Cancelar job
11) 🧹 Limpar jobs antigos
12) 🔄 Sincronizar banco com fila
13) 🔧 Gerenciar serviços
14) 🔌 Reconectar ao backend
15) 🚪 Sair

Escolha uma opção [1-15]:
```

**Opções Úteis**:
- **Opção 5**: Certificar todos os modelos (demora ~30min)
- **Opção 2**: Certificar apenas um vendor (ex: Mistral)
- **Opção 6**: Ver estatísticas em tempo real
- **Opção 12**: Sincronizar status banco ↔ fila

#### Método 2: Script Direto

**Certificar Todos**:
```bash
cd backend && npx ts-node scripts/recertify-all-models.ts
```

**Certificar Vendor Específico**:
```bash
cd backend && npx ts-node scripts/certify-model.ts --vendor=mistral
```

**Certificar Modelo Específico**:
```bash
cd backend && npx ts-node scripts/certify-model.ts --model=mistral.mistral-large-2407-v1:0
```

### 4.3. Monitorar Certificação

**Ver Progresso em Tempo Real**:
```bash
# Terminal 1: Executar certificação
./manage-certifications.sh

# Terminal 2: Monitorar logs
cd backend && npm run dev

# Terminal 3: Ver estatísticas
watch -n 2 'curl -s http://localhost:3001/api/certification-queue/stats | jq'
```

**Ver no Frontend**:
- Acessar: `http://localhost:3003` (Admin)
- Login: `123@123.com` / `123123`
- Página: Certifications

### 4.4. Saída Esperada

```
🎖️  Iniciando certificação de todos os modelos...

📊 Resumo:
   Total de modelos: 120
   Regiões: us-east-1
   Estimativa: ~30 minutos

🚀 Criando job de certificação...
✅ Job criado: job_abc123

📦 Processando modelos...
[1/120] ✅ anthropic.claude-3-5-sonnet-20241022-v2:0 (2.3s) - PASSED
[2/120] ✅ anthropic.claude-3-5-haiku-20241022-v1:0 (1.8s) - PASSED
[3/120] ❌ amazon.nova-sonic-v1:0 (0.5s) - FAILED (Blacklist)
[4/120] ✅ cohere.command-r-plus-v1:0 (2.1s) - PASSED
...

============================================================
📊 RELATÓRIO FINAL
============================================================

✅ Certificação concluída!

📈 Estatísticas:
   Total:     120 modelos
   Sucesso:   95 modelos (79%)
   Falha:     25 modelos (21%)
   Duração:   28m 34s

🎖️  Por Rating:
   ⭐⭐⭐⭐⭐ PREMIUM:      15 modelos
   ⭐⭐⭐⭐   RECOMENDADO:  45 modelos
   ⭐⭐⭐     FUNCIONAL:    35 modelos
   ⭐⭐       LIMITADO:     10 modelos
   ⭐         INSTÁVEL:      5 modelos
   ❌         FALHOU:       10 modelos

💡 Próximos passos:
   1. Verificar modelos que falharam
   2. Revisar logs de erros
   3. Testar modelos PREMIUM no frontend
```

### 4.5. Validar Certificações

**Verificar no Banco**:
```bash
cd backend && npx ts-node scripts/diagnose-database-state.ts
```

**Resultado Esperado**:
```
✅ Tabelas com dados:
   model_certifications        120 registros  ← Certificações criadas
   certification_jobs            1 registros  ← Job executado
```

**Verificar Certificações Específicas**:
```bash
cd backend && npx ts-node scripts/check-certifications.ts
```

## ✅ Passo 5: Validação Final

### 5.1. Checklist de Validação

#### Backend
- [ ] PostgreSQL rodando
- [ ] Redis rodando
- [ ] Backend iniciado (`npm run dev`)
- [ ] Health check OK: `curl http://localhost:3001/api/health`

#### Banco de Dados
- [ ] Schema criado (10 tabelas)
- [ ] Usuário criado (`leo@leo.com`)
- [ ] Providers criados (4+)
- [ ] Modelos criados (120+)
- [ ] Certificações criadas (opcional)

#### Frontend
- [ ] Login funciona (`leo@leo.com` / `leoleo`)
- [ ] Modelos aparecem na lista
- [ ] Chat funciona com modelo certificado
- [ ] Settings carregam corretamente

#### Admin
- [ ] Login funciona (`123@123.com` / `123123`)
- [ ] Página de certificações carrega
- [ ] Estatísticas aparecem
- [ ] Histórico de jobs aparece

### 5.2. Script de Validação Completa

**Criar**: `backend/scripts/validate-full-setup.ts`

**Comando**:
```bash
cd backend && npx ts-node scripts/validate-full-setup.ts
```

**Validações**:
1. ✅ Conexão PostgreSQL
2. ✅ Conexão Redis
3. ✅ Schema completo
4. ✅ Dados essenciais (users, providers, models)
5. ✅ Backend respondendo
6. ✅ Autenticação funcionando
7. ✅ Endpoints principais OK

## 🎯 Resumo Executivo

### Ordem de Execução

```bash
# 1. Diagnosticar estado atual
cd backend && npx ts-node scripts/diagnose-database-state.ts

# 2. Executar seed básico (OBRIGATÓRIO)
cd backend && npx prisma db seed

# 3. Configurar AWS no frontend (se quiser modelos Bedrock)
# Acessar: http://localhost:3000 → Settings → AWS

# 4. Adicionar modelos AWS Bedrock (RECOMENDADO)
cd backend && npx ts-node scripts/add-models-to-registry.ts

# 5. Certificar modelos (OPCIONAL)
./manage-certifications.sh
# Ou: cd backend && npx ts-node scripts/recertify-all-models.ts

# 6. Validar setup completo
cd backend && npx ts-node scripts/validate-full-setup.ts
```

### Dados Criados

| Tabela | Seed Básico | + AWS Bedrock | + Certificação |
|--------|-------------|---------------|----------------|
| users | 1 | 1 | 1 |
| ai_providers | 4 | 4 | 4 |
| ai_models | 6 | 120 | 120 |
| chats | 3 | 3 | 3 |
| messages | 12 | 12 | 12 |
| model_certifications | 0 | 0 | 120 |
| certification_jobs | 0 | 0 | 1+ |

### Tempo Estimado

- **Seed Básico**: ~10 segundos
- **Adicionar Modelos AWS**: ~30 segundos
- **Certificar Todos**: ~30 minutos
- **Total**: ~31 minutos

### Credenciais Padrão

#### Frontend (Usuário)
- URL: `http://localhost:3000`
- Email: `leo@leo.com`
- Senha: `leoleo`

#### Admin
- URL: `http://localhost:3003`
- Email: `123@123.com`
- Senha: `123123`

## 📚 Referências

- [Schema Prisma](../backend/prisma/schema.prisma)
- [Seed Script](../backend/prisma/seed.ts)
- [Add Models Script](../backend/scripts/add-models-to-registry.ts)
- [Add Models README](../backend/scripts/README-ADD-MODELS-TO-REGISTRY.md)
- [Manage Certifications](../manage-certifications.sh)
- [Recertify All](../backend/scripts/recertify-all-models.ts)

## 🐛 Troubleshooting

### Erro: "Connection refused" ao conectar PostgreSQL

**Solução**:
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql

# Verificar variáveis de ambiente
cat backend/.env | grep DATABASE_URL
```

### Erro: "Nenhum usuário com credenciais AWS"

**Solução**:
1. Executar seed primeiro: `npx prisma db seed`
2. Acessar frontend e configurar AWS
3. Executar script novamente

### Erro: "Schema não existe"

**Solução**:
```bash
# Aplicar migrations
cd backend && npx prisma migrate deploy

# Ou resetar completamente
cd backend && npx prisma migrate reset
```

### Modelos não aparecem no frontend

**Solução**:
1. Reiniciar backend: `./start.sh restart backend`
2. Limpar cache do navegador
3. Verificar se modelos foram habilitados em Settings
4. Verificar console do navegador para erros

### Certificação falha para todos os modelos

**Solução**:
1. Verificar credenciais AWS em Settings
2. Verificar se região está correta
3. Verificar logs do backend: `cd backend && npm run dev`
4. Testar conexão: `npx ts-node scripts/check-aws-models.ts`

## ✅ Conclusão

Este plano fornece um guia completo para alimentar o banco de dados após reset, desde o diagnóstico inicial até a validação final. Siga os passos na ordem e valide cada etapa antes de prosseguir.
