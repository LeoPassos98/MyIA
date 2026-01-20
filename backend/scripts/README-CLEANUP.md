# Scripts de Limpeza do Banco de Dados

## 📋 Visão Geral

Scripts para limpar modelos, providers e certificações obsoletos do banco de dados, mantendo as configurações de usuário e credenciais AWS.

## ⚠️ IMPORTANTE

**ESTES SCRIPTS REMOVEM DADOS PERMANENTEMENTE**

- ✅ **Mantém**: Usuários, configurações, credenciais AWS
- ❌ **Remove**: Modelos, providers, certificações

## 🔧 Scripts Disponíveis

### 1. Script TypeScript (Recomendado)

**Arquivo**: [`cleanupDatabase.ts`](cleanupDatabase.ts)

**Vantagens**:
- Usa Prisma (type-safe)
- Mostra contadores antes/depois
- Logs informativos
- Desconexão automática

**Como usar**:
```bash
cd backend
npm run cleanup:db
```

### 2. Script Shell + SQL

**Arquivos**: 
- [`cleanup-database.sh`](cleanup-database.sh)
- [`cleanup-database.sql`](cleanup-database.sql)

**Vantagens**:
- Backup automático
- Confirmação interativa
- Execução direta no SQLite

**Como usar**:
```bash
cd backend
npm run cleanup:db:sql
```

Ou diretamente:
```bash
bash backend/scripts/cleanup-database.sh
```

### 3. SQL Manual

**Arquivo**: [`cleanup-database.sql`](cleanup-database.sql)

**Como usar**:
```bash
# 1. Criar backup manual
cp backend/prisma/dev.db backend/prisma/dev.db.backup

# 2. Executar SQL
sqlite3 backend/prisma/dev.db < backend/scripts/cleanup-database.sql
```

## 📊 O Que Cada Script Faz

### Tabelas Limpas
1. **`model_certifications`**: Todas as certificações de modelos
2. **`ai_models`**: Todos os modelos cadastrados
3. **`ai_providers`**: Todos os providers cadastrados

### Tabelas Mantidas
1. **`users`**: Todos os usuários
2. **`user_settings`**: Todas as configurações (incluindo credenciais AWS)

## 🔄 Fluxo Completo de Uso

### Passo 1: Executar Limpeza

```bash
cd backend
npm run cleanup:db
```

**Saída esperada**:
```
🧹 Iniciando limpeza do banco de dados...

📊 Estado atual do banco:
   Modelos: 15
   Providers: 3
   Certificações: 8
   Usuários: 1
   Configurações: 1

⚠️  Esta operação irá remover:
   - Todos os modelos
   - Todos os providers
   - Todas as certificações

✅ Será mantido:
   - Usuários
   - Configurações (credenciais AWS)

🧹 Executando limpeza...
   ✅ Certificações removidas
   ✅ Modelos removidos
   ✅ Providers removidos

📊 Estado após limpeza:
   Modelos: 0
   Providers: 0
   Certificações: 0
   Usuários: 1 (mantidos)
   Configurações: 1 (mantidas)

✅ Limpeza concluída com sucesso!
```

### Passo 2: Buscar Novos Modelos

1. Acesse a aplicação web
2. Vá para **Settings → API Keys → AWS Bedrock**
3. Suas credenciais AWS ainda estarão salvas
4. Clique em **"Testar e Salvar"**
5. O sistema buscará os modelos disponíveis no AWS Bedrock
6. Selecione os modelos desejados
7. Certifique os modelos selecionados

## 🛡️ Segurança

### Backup Automático (Script Shell)

O script shell cria backup automático:
```bash
backend/prisma/dev.db.backup.20260120_001530
```

### Backup Manual

Sempre recomendado antes de qualquer operação:
```bash
cp backend/prisma/dev.db backend/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Restaurar Backup

Se algo der errado:
```bash
# Listar backups
ls -lh backend/prisma/dev.db.backup.*

# Restaurar backup específico
cp backend/prisma/dev.db.backup.20260120_001530 backend/prisma/dev.db
```

## 🔍 Verificação

### Verificar Estado do Banco

```bash
# Via Prisma Studio
cd backend
npx prisma studio

# Via SQLite CLI
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) as models FROM ai_models;"
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) as providers FROM ai_providers;"
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) as certs FROM model_certifications;"
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) as users FROM users;"
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) as settings FROM user_settings;"
```

## 🐛 Troubleshooting

### Erro: "database is locked"

**Causa**: Prisma Studio ou outro processo está usando o banco

**Solução**:
```bash
# Fechar Prisma Studio
pkill -f "prisma studio"

# Tentar novamente
npm run cleanup:db
```

### Erro: "Permission denied"

**Causa**: Script shell não tem permissão de execução

**Solução**:
```bash
chmod +x backend/scripts/cleanup-database.sh
npm run cleanup:db:sql
```

### Erro: "sqlite3: command not found"

**Causa**: SQLite3 não instalado

**Solução**:
```bash
# Ubuntu/Debian
sudo apt-get install sqlite3

# macOS
brew install sqlite3

# Ou use o script TypeScript
npm run cleanup:db
```

## 📝 Logs

### Script TypeScript

Logs vão para o console (stdout)

### Script Shell

Logs vão para o console e podem ser redirecionados:
```bash
bash backend/scripts/cleanup-database.sh 2>&1 | tee cleanup.log
```

## 🔗 Arquivos Relacionados

- [`backend/prisma/schema.prisma`](../prisma/schema.prisma) - Schema do banco
- [`backend/src/lib/prisma.ts`](../src/lib/prisma.ts) - Cliente Prisma
- [`backend/package.json`](../package.json) - Scripts npm

## 📚 Referências

- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [STANDARDS.md](../../docs/STANDARDS.md) - Padrões do projeto

## ⚡ Quick Reference

```bash
# Limpeza rápida (TypeScript)
cd backend && npm run cleanup:db

# Limpeza com backup (Shell)
cd backend && npm run cleanup:db:sql

# Backup manual
cp backend/prisma/dev.db backend/prisma/dev.db.backup

# Verificar estado
sqlite3 backend/prisma/dev.db "SELECT COUNT(*) FROM ai_models;"

# Restaurar backup
cp backend/prisma/dev.db.backup backend/prisma/dev.db
```
