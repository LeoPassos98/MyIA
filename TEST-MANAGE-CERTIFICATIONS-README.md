# 🧪 Teste de manage-certifications.sh

## 📋 Descrição

Este teste valida que o script [`manage-certifications.sh`](manage-certifications.sh) funciona corretamente comparando suas funções com comandos mais diretos e puros possíveis, **SEM usar outros scripts** como [`./start.sh`](start.sh).

## 🎯 Objetivo

Comparar cada função do [`manage-certifications.sh`](manage-certifications.sh) com comandos nativos equivalentes:
- `npm start` para iniciar serviços
- `curl` para testar API
- `pkill` para parar serviços
- `redis-cli` para verificar Redis
- `lsof` e `pgrep` para verificar processos

## 📁 Arquivos

- **[`test-manage-certifications-direct.sh`](test-manage-certifications-direct.sh)** - Script de teste principal
- **`test-report-YYYYMMDD-HHMMSS.md`** - Relatório gerado automaticamente

## 🚀 Como Executar

### Pré-requisitos

```bash
# Verificar dependências
command -v curl && echo "✓ curl"
command -v jq && echo "✓ jq"
command -v redis-cli && echo "✓ redis-cli"
command -v lsof && echo "✓ lsof"
command -v npm && echo "✓ npm"
```

### Executar Teste

```bash
# Dar permissão de execução (se necessário)
chmod +x test-manage-certifications-direct.sh

# Executar teste
./test-manage-certifications-direct.sh
```

## 🧪 Testes Executados

### 1. Preparação do Ambiente
- Para todos os serviços
- Limpa processos órfãos
- Verifica portas disponíveis (3001, 3003)

### 2. Verificar Status do Backend (Offline)
**Script**: Função [`check_backend()`](manage-certifications.sh:248-279)  
**Comando Direto**: `curl -s -f http://localhost:3001/health`

### 3. Verificar Status do Redis
**Script**: Função [`check_redis()`](manage-certifications.sh:319-343)  
**Comando Direto**: `redis-cli ping`

### 4. Iniciar Backend
**Script**: Opção 15 → 1 (Iniciar backend)  
**Comando Direto**: `cd backend && npm start &`

### 5. Login na API
**Script**: Função [`login_to_api()`](manage-certifications.sh:182-208)  
**Comando Direto**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}'
```

### 6. Verificar Status do Backend (Online)
**Script**: Opção 1 (Ver Status do Sistema)  
**Comandos Diretos**:
```bash
curl -s http://localhost:3001/health
lsof -ti:3001
pgrep -f "node.*backend"
```

### 7. Obter Estatísticas da Fila
**Script**: Opção 7 (Ver Estatísticas)  
**Comando Direto**:
```bash
curl -s http://localhost:3001/api/certification-queue/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Parar Backend
**Script**: Opção 16 → 1 (Parar backend)  
**Comando Direto**: `pkill -f "node.*backend"`

### 9. Iniciar Frontend
**Script**: Opção 15 → 2 (Iniciar frontend)  
**Comando Direto**: `cd frontend-admin && npm run dev &`

### 10. Parar Frontend
**Script**: Opção 16 → 2 (Parar frontend)  
**Comando Direto**: `pkill -f "node.*frontend-admin"`

## 📊 Relatório

O teste gera automaticamente um relatório em Markdown com:

- **Resumo Executivo**: Total de testes, passados, falhados
- **Detalhes de Cada Teste**: Comandos usados, resultados, comparações
- **Análise de Resultados**: Pontos fortes e pontos de atenção
- **Conclusão**: Taxa de sucesso e avaliação geral
- **Comandos Validados**: Lista de todos os comandos diretos testados

### Exemplo de Relatório

```markdown
# 📊 Relatório de Testes: manage-certifications.sh

**Data:** 02/02/2026 14:30:00  
**Script Testado:** manage-certifications.sh  
**Método:** Comparação com comandos diretos

---

## 📈 Resumo Executivo

- **Total de Testes:** 10
- **Testes Passados:** 9 (90%)
- **Testes Falhados:** 1 (10%)

---

## 🎓 Conclusão

✅ **EXCELENTE** - O script funciona corretamente e é equivalente aos comandos diretos.

Taxa de sucesso: **90%**
```

## 🎯 Critérios de Sucesso

| Taxa de Sucesso | Avaliação | Descrição |
|----------------|-----------|-----------|
| ≥ 90% | ✅ EXCELENTE | Script funciona perfeitamente |
| 70-89% | ⚠️ BOM | Script funciona mas precisa melhorias |
| < 70% | ❌ NECESSITA CORREÇÃO | Script tem problemas críticos |

## 🔍 Análise de Resultados

### O que é testado

1. **Detecção de Serviços**: Verifica se o script detecta corretamente quando serviços estão online/offline
2. **Inicialização**: Compara inicialização via script com `npm start` direto
3. **Autenticação**: Valida login na API via script vs `curl` direto
4. **Parada de Serviços**: Compara parada via script com `pkill` direto
5. **Integração com API**: Testa chamadas à API de certificação

### O que NÃO é testado

- ❌ Funcionalidades interativas do menu
- ❌ Criação de jobs de certificação
- ❌ Limpeza de jobs antigos
- ❌ Visualização de logs

## 🚫 Restrições

- **NÃO usa [`./start.sh`](start.sh)** ou outros scripts auxiliares
- **APENAS comandos nativos**: `npm`, `curl`, `pkill`, `redis-cli`, `lsof`, `pgrep`
- **NÃO modifica** o [`manage-certifications.sh`](manage-certifications.sh)
- **APENAS testa e compara** com comandos diretos

## 📝 Logs

Os logs dos serviços iniciados durante o teste são salvos em:

- `logs/backend.out.log` - Saída padrão do backend
- `logs/backend.err.log` - Erros do backend
- `logs/frontend.out.log` - Saída padrão do frontend
- `logs/frontend.err.log` - Erros do frontend

## 🐛 Troubleshooting

### Porta já ocupada

```bash
# Verificar o que está usando a porta
lsof -i :3001
lsof -i :3003

# Matar processo específico
kill -9 <PID>
```

### Redis não está rodando

```bash
# Iniciar Redis
redis-server &

# Verificar status
redis-cli ping
```

### Backend não inicia

```bash
# Verificar logs
tail -f logs/backend.err.log

# Verificar dependências
cd backend && npm install
```

### Frontend não inicia

```bash
# Verificar logs
tail -f logs/frontend.err.log

# Verificar dependências
cd frontend-admin && npm install
```

## 📚 Referências

- [`manage-certifications.sh`](manage-certifications.sh) - Script sendo testado
- [`docs/STANDARDS.md`](docs/STANDARDS.md) - Padrões do projeto
- [`backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md`](backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md) - API de certificação

## 🤝 Contribuindo

Para adicionar novos testes:

1. Adicione uma nova função `test_nome_do_teste()` no script
2. Use `start_test()` para iniciar
3. Use `pass_test()` ou `fail_test()` para finalizar
4. Documente no `log_to_report()`

### Exemplo

```bash
test_nova_funcionalidade() {
  start_test "Nova Funcionalidade"
  
  log_to_report "#### Comando via Script"
  log_to_report '```bash'
  log_to_report "./manage-certifications.sh"
  log_to_report '```'
  log_to_report ""
  
  log_to_report "#### Comando Direto Equivalente"
  log_to_report '```bash'
  log_to_report "comando-direto"
  log_to_report '```'
  log_to_report ""
  
  # Executar teste
  if [ condição ]; then
    pass_test
  else
    fail_test "Motivo da falha"
  fi
}
```

## 📄 Licença

Este teste faz parte do projeto MyIA e segue a mesma licença.

---

**Última atualização:** 02/02/2026
