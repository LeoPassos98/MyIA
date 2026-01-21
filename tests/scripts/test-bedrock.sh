#!/bin/bash
# backend/test-bedrock.sh

echo "🧪 Teste AWS Bedrock"
echo "===================="
echo ""

# 1. Verificar provider no banco
echo "1️⃣ Verificando provider no banco..."
PROVIDER=$(psql -U leonardo -d myia -t -c "SELECT slug FROM ai_providers WHERE slug = 'bedrock';" 2>/dev/null | xargs)

if [ "$PROVIDER" = "bedrock" ]; then
  echo "✅ Provider 'bedrock' encontrado"
else
  echo "❌ Provider 'bedrock' não encontrado"
  exit 1
fi

# 2. Verificar modelos
echo ""
echo "2️⃣ Verificando modelos..."
MODEL_COUNT=$(psql -U leonardo -d myia -t -c "SELECT COUNT(*) FROM ai_models WHERE \"providerId\" = (SELECT id FROM ai_providers WHERE slug = 'bedrock');" 2>/dev/null | xargs)

if [ "$MODEL_COUNT" -ge 1 ]; then
  echo "✅ $MODEL_COUNT modelos encontrados"
else
  echo "❌ Nenhum modelo encontrado"
  exit 1
fi

# 3. Verificar .env
echo ""
echo "3️⃣ Verificando .env..."
if [ -f .env ]; then
  if grep -q "AWS_BEDROCK_CREDENTIALS" .env; then
    echo "✅ AWS_BEDROCK_CREDENTIALS configurado"
  else
    echo "⚠️  AWS_BEDROCK_CREDENTIALS não encontrado no .env"
    echo ""
    echo "📝 Adicione ao .env:"
    echo "AWS_BEDROCK_CREDENTIALS=ACCESS_KEY:SECRET_KEY"
    echo "AWS_BEDROCK_REGION=us-east-1"
  fi
else
  echo "❌ Arquivo .env não existe"
  echo ""
  echo "📝 Crie o arquivo .env com:"
  echo "cp .env.example .env"
fi

echo ""
echo "===================="
echo "✅ Verificação concluída!"
echo ""
echo "📋 Keys necessárias:"
echo "  1. JWT_SECRET (obrigatório)"
echo "  2. ENCRYPTION_SECRET (obrigatório)"
echo "  3. AWS_BEDROCK_CREDENTIALS (formato: ACCESS_KEY:SECRET_KEY)"
echo "  4. DATABASE_URL (PostgreSQL)"
