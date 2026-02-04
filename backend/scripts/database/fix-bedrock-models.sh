#!/bin/bash
# backend/scripts/fix-bedrock-models.sh
# Script para corrigir IDs dos modelos AWS Bedrock no banco de dados

set -e

echo "🔧 Corrigindo IDs dos modelos AWS Bedrock..."
echo ""

# Carregar variáveis de ambiente
if [ -f backend/.env ]; then
  export $(cat backend/.env | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está definida"
  echo "   Configure a variável de ambiente DATABASE_URL no arquivo .env"
  exit 1
fi

# Remover parâmetro schema da URL (psql não suporta)
DB_URL_CLEAN=$(echo "$DATABASE_URL" | sed 's/?schema=public//')

echo "📊 Banco de dados: $DB_URL_CLEAN"
echo ""

# Executar o script SQL
echo "🔄 Executando correção dos modelos..."
psql "$DB_URL_CLEAN" -f backend/scripts/fix-bedrock-model-ids.sql

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📋 Modelos AWS Bedrock disponíveis:"
echo "   • Claude 3.5 Sonnet v2 (us.anthropic.claude-3-5-sonnet-20241022-v2:0)"
echo "   • Claude 3.5 Sonnet v1 (us.anthropic.claude-3-5-sonnet-20240620-v1:0)"
echo "   • Claude 3 Haiku (us.anthropic.claude-3-haiku-20240307-v1:0)"
echo "   • Claude 3 Opus (us.anthropic.claude-3-opus-20240229-v1:0)"
echo ""
echo "💡 Agora você pode usar os modelos AWS Bedrock normalmente!"
