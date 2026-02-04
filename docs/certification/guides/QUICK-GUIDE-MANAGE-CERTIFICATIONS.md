# 🎯 Guia Rápido: manage-certifications.sh

> Script interativo para gerenciar certificações de modelos de IA

**Status:** ✅ Testado e Documentado (100% de sucesso em 30 testes)

---

## ⚡ Início Rápido

```bash
# 1. Navegar para o diretório
cd /home/leonardo/Documents/VSCODE/MyIA

# 2. Executar o script
./manage-certifications.sh

# 3. Escolher uma opção do menu
# Menu interativo -> 1 (Ver Status)
```

---

## 📋 Primeiros Passos

### Se Backend NÃO está rodando

```
1. Executar script: ./manage-certifications.sh
2. Menu → Opção 15 (🚀 Iniciar Serviços)
3. Escolher: 3 (Iniciar ambos)
4. Aguardar inicialização (2-3 minutos)
5. Menu → Opção 14 (🔄 Reconectar ao Backend)
```

### Se Backend JÁ está rodando

```
1. Executar script: ./manage-certifications.sh
2. Menu → Opção 1 (📊 Ver Status)
3. Confirmar que tudo está ✓ (verde)
```

---

## 🎮 Menu Principal

```
  1.  📊 Ver Status do Sistema          → Status geral
  2.  🚀 Criar Novo Job                 → Iniciar certificação
  3.  📋 Listar Jobs                    → Ver jobs em andamento
  4.  🔍 Ver Detalhes                   → Detalhes de um job
  5.  ❌ Cancelar Job                   → Parar job
  6.  🧹 Limpar Jobs Antigos            → Deletar antigos
  7.  📈 Ver Estatísticas               → Gráficos e números
  8.  ⚙️  Gerenciar Fila                → Pausar/retomar
  9.  📝 Ver Logs                       → Histórico
  10. 🧪 Executar Testes               → Validações
  11. 📚 Ver Documentação               → Ajuda
  12. 🔄 Reiniciar Serviços            → Restart
  13. 🔒 Travar Tela                   → Fixar console
  14. 🔄 Reconectar ao Backend         → Reautenticar
  15. 🚀 Iniciar Serviços              → Start
  16. 🛑 Parar Serviços                → Stop
  0.  🚪 Sair                          → Exit
```

---

## 🔑 Opções de Linha de Comando

### Modo Verbose (Debug)
```bash
./manage-certifications.sh -v

# Mostra:
# [VERBOSE] Verificando dependências...
# [VERBOSE] Backend detectado via /health endpoint
# [VERBOSE] API Call: GET http://localhost:3001/api/stats
```

### Modo Dry-Run (Simular)
```bash
./manage-certifications.sh --dry-run

# Simula ações sem executar de verdade
# Útil para testar fluxos
```

### Ajuda
```bash
./manage-certifications.sh -h
./manage-certifications.sh --help
```

---

## 🔐 Configuração Persistente

Criar arquivo: `~/.certifications-manager.conf`

```bash
#!/bin/bash
API_URL="http://localhost:3001"
API_TOKEN="seu-token-aqui"    # Opcional
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="myia"
DB_USER="leonardo"
```

---

## 🚀 Casos de Uso Principais

### Caso 1: Certificar todos os modelos AWS

```
1. Menu → 2 (Criar Novo Job)
2. Provider: AWS Bedrock
3. Região: us-east-1
4. Confirmar
5. Monitorar com Menu → 3 (Listar Jobs)
6. Ver estatísticas com Menu → 7
```

**Tempo esperado:** 30-60 min (124 modelos)

---

### Caso 2: Checar status de um job

```
1. Menu → 3 (Listar Jobs)
2. Copiar Job ID
3. Menu → 4 (Ver Detalhes)
4. Colar Job ID
5. Ver progresso e erros
```

---

### Caso 3: Limpar jobs antigos

```
1. Menu → 6 (Limpar Jobs)
2. Escolher: COMPLETED (completados)
3. Idade: 30 (dias)
4. Confirmar exclusão
5. Sistema deleta automaticamente
```

---

## 🐛 Troubleshooting

### "Backend não está rodando"

```bash
# Verificar
./start.sh status backend

# Iniciar
./start.sh start backend

# Ou via script
./manage-certifications.sh
# Menu → 15 → 1 (Iniciar backend)
```

### "Erro ao conectar ao banco"

```bash
# Testar PostgreSQL
psql -h localhost -U leonardo -d myia -c "SELECT 1"

# Se falhar, verificar:
docker ps | grep postgres
# ou
sudo systemctl status postgresql
```

### "Redis não acessível"

```bash
# Testar Redis
redis-cli ping

# Se não responde:
redis-cli shutdown
redis-server  # reiniciar

# Ou via script
./manage-certifications.sh -v  # modo verbose mostra status
```

---

## 📊 Exemplo de Saída

```
╔════════════════════════════════════════════════════╗
║        Status do Sistema                           ║
╚════════════════════════════════════════════════════╝

✓ Backend ✓ rodando na porta 3001
✓ Worker integrado ao backend
✓ Redis acessível
✓ PostgreSQL conectado
✓ API Token autenticado (user: 123@123.com)

Pressione ENTER para continuar...
```

---

## 🧪 Testes Automatizados

```bash
# Executar suite de testes
./test-manage-certifications-automated.sh

# Resultado esperado:
# Total de Testes:    30
# Testes Passaram:    30
# Taxa de Sucesso:    100%
```

---

## 📈 Exemplos de Estadísticas

### Fila Bull

```
Aguardando:           5
Ativos:               2
Completos:          127
Falhados:             8

Distribuição:
  Aguardando:   [██░░░░░] 3%
  Ativos:       [█░░░░░░] 1%
  Completos:    [██████░] 88%
  Falhados:     [███░░░░] 5%
```

### Certificações por Região

```
us-east-1            45
eu-west-1            32
ap-northeast-1       28
```

---

## 📝 Logs

### Ver últimas 50 linhas do backend

```
Menu → 9 (Ver Logs) → 1 (Logs do backend)
```

### Ver erros

```
Menu → 9 (Ver Logs) → 4 (Logs de erro)
```

### Buscar por Job ID

```
Menu → 9 (Ver Logs) → 3 (Logs de um job)
# Inserir Job ID
```

---

## 🎓 Dicas e Truques

### 1. Travar tela para preservar logs

```
Menu → 13 (🔒 Travar Tela)
# Agora console não limpa automaticamente
# Bom para debugging
```

### 2. Usar modo verbose para entender fluxos

```bash
./manage-certifications.sh -v

# Mostra todos os detalhes internos
# Útil para troubleshooting
```

### 3. Combinar com comandos do sistema

```bash
# Monitorar em paralelo
watch -n 5 'curl -s http://localhost:3001/api/health'

# Enquanto isso:
./manage-certifications.sh
```

### 4. Salvar configuração para não digitar sempre

```bash
# Criar arquivo ~/.certifications-manager.conf
# Com suas preferências
cat > ~/.certifications-manager.conf << 'EOF'
API_URL="http://localhost:3001"
DB_HOST="localhost"
EOF

# Próximas execuções usam automaticamente
```

---

## 🔗 Links Úteis

| Recurso | Localização |
|---------|-------------|
| Script Principal | `./manage-certifications.sh` |
| Documentação Completa | `TEST-MANAGE-CERTIFICATIONS.md` |
| Resultados de Testes | `TEST-MANAGE-CERTIFICATIONS-RESULTS.md` |
| Testes Automatizados | `test-manage-certifications-automated.sh` |
| API REST | http://localhost:3001/api |
| Bull Board (Fila) | http://localhost:3001/admin/queues |
| Banco de Dados | `psql -h localhost -d myia -U leonardo` |

---

## 📞 Suporte

1. **Documentação Integrada:** Menu → Opção 11
2. **Modo Verbose:** `./manage-certifications.sh -v`
3. **Logs:** Menu → Opção 9
4. **Testes:** Menu → Opção 10

---

## ✅ Verificação Rápida

```bash
# Tudo funciona?
./manage-certifications.sh -h  # Deve mostrar ajuda

# Backend rodando?
curl -s http://localhost:3001/health | jq

# Banco acessível?
psql -h localhost -U leonardo -d myia -c "SELECT 1"

# Testes passam?
./test-manage-certifications-automated.sh
```

**Todos passando? Você está pronto!** 🚀

---

**Versão:** 1.0.0  
**Última Atualização:** 02/02/2026  
**Status:** ✅ Produção Pronta
