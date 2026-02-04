# Test Queue Basic - Script de Teste

## Descrição

Script para testar a infraestrutura básica de Redis e Bull Queue.

## Pré-requisitos

1. **Redis instalado e rodando**:
```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG
```

2. **Dependências instaladas**:
```bash
cd backend
npm install
```

3. **Variáveis de ambiente configuradas**:
```bash
# Copiar .env.example para .env
cp .env.example .env

# Configurar variáveis Redis no .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Como Executar

```bash
cd backend
npx tsx scripts/test-queue-basic.ts
```

## O que o script testa

1. ✅ **Conexão Redis**: Verifica se consegue conectar ao Redis
2. ✅ **Criação de Fila**: Cria uma fila de teste
3. ✅ **Adicionar Job**: Adiciona um job à fila
4. ✅ **Processar Job**: Configura e executa processador
5. ✅ **Status do Job**: Verifica estado do job após processamento
6. ✅ **Contadores**: Obtém estatísticas da fila
7. ✅ **Limpeza**: Remove jobs antigos

## Saída Esperada

```
🧪 Iniciando teste básico de fila...

1️⃣  Testando conexão Redis...
✅ Redis respondeu: PONG

2️⃣  Criando fila de teste...
✅ Fila criada com sucesso

3️⃣  Adicionando job de teste...
✅ Job adicionado com ID: 1

4️⃣  Configurando processador...
⏳ Aguardando processamento...

▶️  Processando job 1...
   Dados: {"message":"Hello from test job!","timestamp":"..."}

5️⃣  Verificando status do job...
✅ Status: completed
   Resultado: {"success":true,"processedAt":"..."}

6️⃣  Obtendo contadores da fila...
✅ Contadores:
   Waiting: 0
   Active: 0
   Completed: 1
   Failed: 0
   Delayed: 0

7️⃣  Limpando fila...
✅ Fila limpa

✅ Todos os testes passaram com sucesso!

🔌 Fechando conexões...
✅ Conexões fechadas

✅ Script finalizado com sucesso
```

## Troubleshooting

### Erro: "Redis connection refused"

**Causa**: Redis não está rodando

**Solução**:
```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# macOS
brew services start redis

# Docker
docker run -d --name myia-redis -p 6379:6379 redis:7-alpine
```

### Erro: "Cannot find module"

**Causa**: Dependências não instaladas

**Solução**:
```bash
cd backend
npm install
```

### Erro: "Connection timeout"

**Causa**: Firewall bloqueando porta 6379

**Solução**:
```bash
# Verificar se porta está aberta
sudo netstat -tlnp | grep 6379

# Permitir porta no firewall (se necessário)
sudo ufw allow 6379
```

## Próximos Passos

Após este teste passar com sucesso:

1. Testar Bull Board UI em `http://localhost:3001/admin/queues`
2. Implementar fila de certificação de modelos
3. Criar workers para processar certificações
4. Integrar com frontend admin

## Referências

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Redis Documentation](https://redis.io/documentation)
- [Documentação Completa](../docs/REDIS-BULL-SETUP.md)
