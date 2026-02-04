# Quick Start: Nova Arquitetura de Adapters

**Tempo estimado:** 5 minutos  
**Pré-requisitos:** Backend configurado e rodando

---

## 🚀 Início Rápido (5 minutos)

### Passo 1: Habilitar Feature Flag

```bash
cd backend
echo "USE_NEW_ADAPTERS=true" >> .env
```

**Verificar:**
```bash
grep USE_NEW_ADAPTERS .env
# Deve mostrar: USE_NEW_ADAPTERS=true
```

---

### Passo 2: Reiniciar Servidor

```bash
cd ..
./start.sh restart backend
```

**Aguardar:**
```
✓ Backend stopped
✓ Backend started (PID: 12345)
✓ Health check passed
```

---

### Passo 3: Validar Migração

```bash
cd backend
npx ts-node scripts/validate-adapter-migration.ts
```

**Saída esperada:**
```
✅ anthropic.claude-sonnet-4-5-20250929-v1:0 → Anthropic INFERENCE_PROFILE Adapter
✅ anthropic.claude-3-haiku-20240307-v1:0 → Anthropic ON_DEMAND Adapter
✅ amazon.nova-pro-v1:0 → Amazon INFERENCE_PROFILE Adapter
✅ amazon.titan-text-express-v1 → Amazon ON_DEMAND Adapter
...
✅ All models mapped successfully!
```

---

### Passo 4: Testar Modelo

#### Opção A: Claude 4.5 Sonnet (Inference Profile)

```bash
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "anthropic.claude-sonnet-4-5-20250929-v1:0"
```

**Saída esperada:**
```
[info] Using adapter: anthropic/INFERENCE_PROFILE
[info] Adapter type: AnthropicProfileAdapter
[info] Model requires Inference Profile, using only: us.anthropic.claude-sonnet-4-5-20250929-v1:0
[info] Testing 1 variations for: anthropic.claude-sonnet-4-5-20250929-v1:0
...
✅ PASSED (7/7 tests)
Rating: 4.7 (RECOMENDADO)
```

#### Opção B: Claude 3 Haiku (ON_DEMAND)

```bash
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "anthropic.claude-3-haiku-20240307-v1:0"
```

**Saída esperada:**
```
[info] Using adapter: anthropic/ON_DEMAND
[info] Adapter type: AnthropicOnDemandAdapter
[info] Testing 3 variations for: anthropic.claude-3-haiku-20240307-v1:0
...
✅ PASSED (7/7 tests)
Rating: 4.5 (RECOMENDADO)
```

#### Opção C: Amazon Nova Pro (Inference Profile)

```bash
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-pro-v1:0"
```

---

## ✅ Verificar Logs

### Logs em Tempo Real

```bash
cd observability
./logs.sh
```

**Buscar por:**
```
[info] Using adapter: anthropic/INFERENCE_PROFILE
[info] Adapter type: AnthropicProfileAdapter
```

### Logs do Backend

```bash
tail -f logs/backend.log | grep "Using adapter"
```

**Você deve ver:**
```
[2026-01-30 14:30:15] [info] Using adapter: anthropic/INFERENCE_PROFILE
[2026-01-30 14:30:15] [info] Adapter type: AnthropicProfileAdapter
[2026-01-30 14:30:15] [info] Model requires Inference Profile, using only: us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

---

## 🔄 Rollback (se necessário)

### Desabilitar Feature Flag

```bash
cd backend
sed -i 's/USE_NEW_ADAPTERS=true/USE_NEW_ADAPTERS=false/' .env
```

### Reiniciar Servidor

```bash
cd ..
./start.sh restart backend
```

### Validar Rollback

```bash
cd backend
grep USE_NEW_ADAPTERS .env
# Deve mostrar: USE_NEW_ADAPTERS=false
```

---

## 📊 Dashboard Grafana

### Acessar Dashboard

```bash
# Abrir no navegador
xdg-open http://localhost:3002/d/myia-errors/myia-errors
# ou
open http://localhost:3002/d/myia-errors/myia-errors
```

### Verificar Métricas

**Buscar por:**
- ✅ Logs de "Using adapter" aparecem
- ✅ Sem novos erros de adapter
- ✅ Redução de erros PROVISIONING_REQUIRED

**Filtros úteis:**
```
{job="backend"} |= "Using adapter"
{job="backend"} |= "Adapter type"
{job="backend"} |= "PROVISIONING_REQUIRED"
```

---

## 🧪 Testes Automatizados

### Executar Todos os Testes

```bash
cd backend
npm test
```

**Saída esperada:**
```
PASS  src/services/ai/adapters/__tests__/adapter-factory.test.ts
PASS  src/services/ai/adapters/inference-profile/__tests__/anthropic-profile.adapter.test.ts
PASS  src/services/ai/adapters/inference-profile/__tests__/amazon-nova.adapter.test.ts
...
Test Suites: 25 passed, 25 total
Tests:       62 passed, 62 total
```

### Executar Testes de Adapters

```bash
npm test -- adapter-factory.test.ts
npm test -- anthropic-profile.adapter.test.ts
npm test -- amazon-nova.adapter.test.ts
```

### Testar Feature Flag

```bash
npx ts-node scripts/test-adapter-factory-feature-flag.ts
```

**Saída esperada:**
```
Testing with USE_NEW_ADAPTERS=true
✅ New adapters working correctly

Testing with USE_NEW_ADAPTERS=false
✅ Legacy adapters working correctly

✅ Feature flag working as expected!
```

---

## 🔍 Troubleshooting

### Problema: Feature flag não funciona

**Sintoma:**
```
[info] Using adapter: anthropic
[info] Testing 3 variations for: anthropic.claude-sonnet-4-5-20250929-v1:0
```

**Solução:**
```bash
# Verificar .env
cat backend/.env | grep USE_NEW_ADAPTERS

# Se não existir, adicionar
echo "USE_NEW_ADAPTERS=true" >> backend/.env

# Reiniciar
./start.sh restart backend
```

---

### Problema: Adapter não encontrado

**Sintoma:**
```
Error: No adapter found for vendor: anthropic, inference type: INFERENCE_PROFILE
```

**Solução:**
```bash
# Validar mapeamento
cd backend
npx ts-node scripts/validate-adapter-migration.ts

# Verificar Model Registry
npx ts-node scripts/list-registry-models.ts | grep "claude-sonnet-4-5"
```

---

### Problema: Rate limiting

**Sintoma:**
```
ThrottlingException: Too many requests, please wait before trying again.
```

**Solução:**
```bash
# Aguardar 10 minutos
sleep 600

# Recertificar
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "seu-modelo-id"

# Ou alternar para outro vendor
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-pro-v1:0"
```

---

### Problema: Testes falhando

**Sintoma:**
```
FAIL  src/services/ai/adapters/__tests__/adapter-factory.test.ts
```

**Solução:**
```bash
# Limpar cache
npm run clean
npm install

# Executar testes novamente
npm test

# Se ainda falhar, verificar logs
npm test -- --verbose
```

---

## 📚 Próximos Passos

### 1. Explorar Documentação

- [Guia de Migração Completo](backend/docs/ADAPTER_MIGRATION_GUIDE.md)
- [Arquitetura Detalhada](plans/ADAPTER_INFERENCE_TYPE_ARCHITECTURE.md)
- [Changelog](ADAPTER_MIGRATION_CHANGELOG.md)

### 2. Certificar Mais Modelos

```bash
# Amazon Nova Lite
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-lite-v1:0"

# Amazon Nova Micro
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "amazon.nova-micro-v1:0"

# Claude 3 Sonnet
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "anthropic.claude-3-sonnet-20240229-v1:0"
```

### 3. Adicionar Novo Adapter

Consultar: [Guia de Migração - Adicionar Novo Adapter](backend/docs/ADAPTER_MIGRATION_GUIDE.md#-adicionar-novo-adapter)

### 4. Preparar para Produção

Consultar: [Recomendações para Produção](PRODUCTION_RECOMMENDATIONS.md)

---

## 🎯 Checklist de Validação

- [ ] Feature flag habilitada (`USE_NEW_ADAPTERS=true`)
- [ ] Servidor reiniciado com sucesso
- [ ] Script de validação executado sem erros
- [ ] Pelo menos 1 modelo certificado com sucesso
- [ ] Logs mostram adapter correto sendo usado
- [ ] Dashboard Grafana acessível e funcionando
- [ ] Testes automatizados passando (62/62)
- [ ] Documentação lida e compreendida

---

## 💡 Dicas

### Performance

- **Cache de Adapters:** Adapters são criados uma vez e reutilizados
- **Lazy Loading:** Adapters criados apenas quando necessários
- **Detecção Inteligente:** Consulta registry ao invés de regex

### Debugging

```bash
# Logs detalhados
DEBUG=* npm run dev

# Logs de adapter
tail -f logs/backend.log | grep -E "(Using adapter|Adapter type|variations)"

# Logs de certificação
tail -f logs/backend.log | grep -E "(PASSED|FAILED|Rating)"
```

### Monitoramento

```bash
# Verificar erros
cd observability
./logs.sh | grep -i error

# Verificar warnings
./logs.sh | grep -i warning

# Verificar rate limiting
./logs.sh | grep -i throttling
```

---

## 📞 Suporte

### Problemas Comuns

- [Troubleshooting no Guia de Migração](backend/docs/ADAPTER_MIGRATION_GUIDE.md#-troubleshooting)
- [Issues no GitHub](https://github.com/seu-repo/issues)

### Documentação Adicional

- [README Principal](README.md)
- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Padrões de Código](docs/STANDARDS.md)

---

**Última atualização:** 2026-01-30  
**Tempo de execução:** ~5 minutos  
**Autor:** Equipe MyIA
