#!/bin/bash

echo "🧪 Testando correção do fullModelId - Vendor Duplicado"
echo "========================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Modelos para testar
MODELS=(
  "amazon.nova-micro-v1:0"
  "anthropic.claude-3-5-sonnet-20241022-v2:0"
  "cohere.command-r-plus-v1:0"
)

echo "📋 Testando ${#MODELS[@]} modelos..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for MODEL in "${MODELS[@]}"; do
  echo "🔍 Testando: $MODEL"
  echo "   URL: http://localhost:3001/api/models/$MODEL/capabilities"
  
  # Fazer requisição e capturar status code e response
  RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:3001/api/models/$MODEL/capabilities")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Status: $HTTP_CODE OK${NC}"
    
    # Verificar se tem capabilities no response
    if echo "$BODY" | grep -q "temperature"; then
      echo -e "   ${GREEN}✅ Capabilities encontradas${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo -e "   ${RED}❌ Response sem capabilities${NC}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  else
    echo -e "   ${RED}❌ Status: $HTTP_CODE ERRO${NC}"
    echo "   Response: $BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  echo ""
done

echo "========================================================"
echo "📊 Resultado Final:"
echo -e "   ${GREEN}✅ Sucessos: $SUCCESS_COUNT${NC}"
echo -e "   ${RED}❌ Falhas: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Alguns testes falharam${NC}"
  exit 1
fi
