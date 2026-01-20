#!/bin/bash
# backend/scripts/cleanup-database.sh
# Script de limpeza do banco de dados

set -e

echo "🧹 Script de Limpeza do Banco de Dados"
echo "======================================"
echo ""
echo "⚠️  ATENÇÃO: Este script irá remover:"
echo "   - Todos os modelos (ai_models)"
echo "   - Todos os providers (ai_providers)"
echo "   - Todas as certificações (model_certifications)"
echo ""
echo "✅ Será mantido:"
echo "   - Usuários (users)"
echo "   - Configurações (user_settings)"
echo "   - Credenciais AWS"
echo ""

# Confirmar execução
read -p "Deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "❌ Operação cancelada"
    exit 1
fi

# Criar backup
echo "📦 Criando backup do banco..."
cp backend/prisma/dev.db backend/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

# Executar limpeza
echo "🧹 Executando limpeza..."
sqlite3 backend/prisma/dev.db < backend/scripts/cleanup-database.sql

echo ""
echo "✅ Limpeza concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Acesse Settings → API Keys → AWS Bedrock"
echo "   2. Suas credenciais AWS ainda estão salvas"
echo "   3. Clique em 'Testar e Salvar' para buscar novos modelos"
echo "   4. Selecione os modelos desejados"
echo "   5. Certifique os modelos selecionados"
echo ""
