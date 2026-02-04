# 🚀 Guia Rápido - Script de Gerenciamento de Certificações

## Início Rápido (5 minutos)

### 1. Verificar Dependências

```bash
# Verificar se as dependências estão instaladas
which curl jq psql

# Se alguma estiver faltando, instale:
sudo apt-get install curl jq postgresql-client
```

### 2. Executar o Script

```bash
# Tornar executável (já feito)
chmod +x manage-certifications.sh

# Executar
./manage-certifications.sh
```

### 3. Primeiro Uso

Ao abrir o menu, você verá:

```
╔════════════════════════════════════════════════╗
║   Sistema de Gerenciamento de Certificações   ║
╚════════════════════════════════════════════════╝

Menu Principal:

  1.  📊 Ver Status do Sistema
  2.  🚀 Criar Novo Job de Certificação
  3.  📋 Listar Jobs
  ...
```

## 🎯 Casos de Uso Comuns

### Caso 1: Verificar se o Sistema Está Funcionando

```
1. Digite: 1 (Ver Status do Sistema)
2. Verifique se todos os serviços estão OK (✓)
3. Pressione Enter para voltar
```

**Resultado esperado:**
```
Serviços:
  Backend (API):        ✓ Rodando em http://localhost:3001
  Worker:               ✓ Rodando
  Redis:                ✓ Acessível
  PostgreSQL:           ✓ Acessível

Estatísticas da Fila:
  Na Fila:              5
  Processando:          2
  Completos:            150
  Falhados:             3
```

### Caso 2: Certificar um Modelo Específico

```
1. Digite: 2 (Criar Novo Job)
2. Digite: 1 (Modelo único)
3. Cole o Model ID (UUID do modelo)
4. Digite: 1 (us-east-1)
5. Aguarde confirmação
```

**Exemplo:**
```
Model ID: 550e8400-e29b-41d4-a716-446655440000
Região: 1

✓ Job criado com sucesso!
ℹ Job ID: 660e8400-e29b-41d4-a716-446655440001
```

### Caso 3: Monitorar um Job

```
1. Digite: 4 (Ver Detalhes)
2. Cole o Job ID
3. Veja progresso e certificações
```

**Resultado:**
```
Informações do Job:
  ID:                   660e8400-e29b-41d4-a716-446655440001
  Tipo:                 SINGLE_MODEL
  Status:               PROCESSING
  Regiões:              us-east-1
  Total de Modelos:     1
  Processados:          0
  Sucesso:              0
  Falhas:               0

  Progresso:            [----------------------------------------]   0%
```

### Caso 4: Ver Estatísticas Gerais

```
1. Digite: 7 (Ver Estatísticas)
2. Veja distribuição e métricas
```

### Caso 5: Limpar Jobs Antigos

```
1. Digite: 6 (Limpar Jobs Antigos)
2. Digite: 2 (COMPLETED)
3. Digite: 30 (dias)
4. Digite: s (confirmar)
```

## 🔧 Configuração Avançada

### Criar Arquivo de Configuração

```bash
# Copiar exemplo
cp .certifications-manager.conf.example ~/.certifications-manager.conf

# Editar
nano ~/.certifications-manager.conf
```

### Configurar Token de Autenticação

Se a API requer autenticação:

```bash
# Opção 1: Via arquivo de configuração
echo 'API_TOKEN=seu_token_aqui' >> ~/.certifications-manager.conf

# Opção 2: Via variável de ambiente
API_TOKEN=seu_token_aqui ./manage-certifications.sh
```

### Modo Verbose (Debug)

```bash
# Ver todas as chamadas API
./manage-certifications.sh -v
```

### Modo Dry-Run (Teste)

```bash
# Simular ações sem executá-las
./manage-certifications.sh --dry-run
```

## 📊 Fluxo de Trabalho Recomendado

### Workflow Diário

```
1. Ver Status (Menu 1)
   ↓
2. Ver Estatísticas (Menu 7)
   ↓
3. Listar Jobs Ativos (Menu 3 > 3)
   ↓
4. Criar Novos Jobs se necessário (Menu 2)
   ↓
5. Monitorar Jobs (Menu 4)
```

### Workflow Semanal

```
1. Ver Estatísticas (Menu 7)
   ↓
2. Limpar Jobs Antigos (Menu 6)
   ↓
3. Ver Logs de Erro (Menu 9 > 4)
   ↓
4. Executar Testes (Menu 10)
```

### Workflow Mensal

```
1. Limpar Jobs COMPLETED > 30 dias (Menu 6 > 2)
   ↓
2. Limpar Jobs FAILED > 30 dias (Menu 6 > 3)
   ↓
3. Revisar Documentação (Menu 11)
   ↓
4. Executar Testes Completos (Menu 10 > 4)
```

## 🐛 Troubleshooting Rápido

### Problema: "Backend não está rodando"

```bash
# Solução 1: Iniciar backend
./start.sh start backend

# Solução 2: Verificar status
./start.sh status

# Solução 3: Reiniciar
./start.sh restart backend
```

### Problema: "Dependências faltando"

```bash
# Instalar todas de uma vez
sudo apt-get install curl jq postgresql-client
```

### Problema: "Não foi possível obter estatísticas"

```bash
# Verificar se backend está acessível
curl http://localhost:3001/health

# Verificar se Redis está rodando
redis-cli ping
```

### Problema: "Job não aparece na lista"

```bash
# Aguardar alguns segundos e tentar novamente
# Ou verificar logs
Menu > 9 > 3 (Logs do job)
```

## 💡 Dicas e Truques

### Dica 1: Atalhos de Teclado

- `Ctrl+C` - Sair do script
- `Enter` - Continuar após visualizar resultados
- `0` - Voltar ao menu anterior

### Dica 2: Copiar Job IDs

Use o mouse para selecionar e copiar Job IDs diretamente do terminal.

### Dica 3: Monitoramento em Tempo Real

Para monitorar logs em tempo real, use outro terminal:

```bash
# Terminal 2
tail -f logs/backend.out.log
```

### Dica 4: Bull Board

Para interface web, acesse:
```
http://localhost:3001/admin/queues
```

### Dica 5: Filtrar Logs

```bash
# Ver apenas erros
grep -i error logs/backend.out.log

# Ver logs de um job específico
grep "job-id-aqui" logs/backend.out.log
```

## 📚 Recursos Adicionais

### Documentação

- [README Completo](README-MANAGE-CERTIFICATIONS.md)
- [Guia do Worker](backend/docs/CERTIFICATION-WORKER-GUIDE.md)
- [API de Certificação](backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md)

### Scripts Relacionados

- [`start.sh`](start.sh) - Iniciar/parar serviços
- [`test-certification-api.sh`](backend/scripts/test-certification-api.sh) - Testar API

### Comandos Úteis

```bash
# Ver processos do sistema
ps aux | grep -E "node|tsx"

# Ver portas em uso
lsof -i :3001
lsof -i :3000

# Ver logs em tempo real
tail -f logs/backend.out.log

# Buscar em logs
grep -r "erro" logs/
```

## 🎓 Exemplos Práticos

### Exemplo 1: Certificar Todos os Modelos em US

```
Menu > 2 > 3
Regiões: us-east-1,us-west-2
Confirmar: s
```

### Exemplo 2: Monitorar Job Específico

```
Menu > 4
Job ID: [cole aqui]
[veja progresso]
Menu > 9 > 3
Job ID: [mesmo ID]
[veja logs]
```

### Exemplo 3: Limpar Jobs Antigos

```
Menu > 7 (ver estatísticas)
[note quantos COMPLETED]
Menu > 6 > 2
Dias: 30
Confirmar: s
Menu > 7 (verificar redução)
```

## 🚨 Avisos Importantes

⚠️ **Operações Destrutivas:**
- Cancelar job (Menu 5)
- Limpar jobs antigos (Menu 6)
- Reiniciar serviços (Menu 12)

Todas pedem confirmação antes de executar!

⚠️ **Certificar Todos os Modelos:**
- Pode criar centenas de jobs
- Consome recursos significativos
- Use com cautela

⚠️ **Logs:**
- Arquivos de log podem crescer muito
- Limpe periodicamente
- Use rotação de logs em produção

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `Menu > 9`
2. Execute testes: `Menu > 10`
3. Consulte documentação: `Menu > 11`
4. Use modo verbose: `./manage-certifications.sh -v`

---

**Pronto para começar? Execute:**

```bash
./manage-certifications.sh
```

**Boa sorte! 🚀**
