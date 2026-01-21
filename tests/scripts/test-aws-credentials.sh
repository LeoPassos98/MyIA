#!/bin/bash
# backend/test-aws-credentials.sh

echo "🔑 Teste de Credenciais AWS Bedrock"
echo "===================================="
echo ""

# Ler credenciais do .env
source .env 2>/dev/null

if [ -z "$AWS_BEDROCK_CREDENTIALS" ]; then
  echo "❌ AWS_BEDROCK_CREDENTIALS não encontrado no .env"
  exit 1
fi

# Separar ACCESS_KEY e SECRET_KEY
IFS=':' read -r ACCESS_KEY SECRET_KEY <<< "$AWS_BEDROCK_CREDENTIALS"

echo "📋 Credenciais encontradas:"
echo "   Access Key: ${ACCESS_KEY:0:10}..."
echo "   Secret Key: ${SECRET_KEY:0:10}..."
echo "   Região: ${AWS_BEDROCK_REGION:-us-east-1}"
echo ""

# Testar com AWS CLI (se disponível)
if command -v aws &> /dev/null; then
  echo "🧪 Testando com AWS CLI..."
  
  export AWS_ACCESS_KEY_ID="$ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
  export AWS_DEFAULT_REGION="${AWS_BEDROCK_REGION:-us-east-1}"
  
  # Testar listagem de modelos
  aws bedrock list-foundation-models --region "$AWS_DEFAULT_REGION" --output json 2>&1 | head -n 5
  
  if [ $? -eq 0 ]; then
    echo "✅ Credenciais válidas!"
  else
    echo "❌ Credenciais inválidas ou sem permissão"
    echo ""
    echo "📝 Verifique:"
    echo "   1. IAM Policy anexada (AmazonBedrockFullAccess)"
    echo "   2. Access Key está ativa"
    echo "   3. SECRET_KEY foi copiada corretamente"
  fi
else
  echo "⚠️  AWS CLI não instalado. Instale com:"
  echo "   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
  echo "   unzip awscliv2.zip"
  echo "   sudo ./aws/install"
fi

echo ""
echo "===================================="
