#!/bin/bash
# certify-all-models-auto.sh
# Script automático para certificar todos os modelos

set -e

echo "🎖️  Iniciando certificação automática de todos os modelos..."
echo ""

# Verificar se backend está rodando
if ! curl -s -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
  echo "❌ Backend não está rodando"
  echo "💡 Execute: ./start.sh start backend"
  exit 1
fi

echo "✅ Backend está rodando"
echo ""

# Fazer login
echo "🔐 Autenticando..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"leo@leo.com","password":"leoleo"}' \
  | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Falha na autenticação"
  exit 1
fi

echo "✅ Autenticado com sucesso"
echo ""

# Iniciar certificação de todos os modelos
echo "🚀 Iniciando certificação de TODOS os modelos..."
echo "⏱️  Tempo estimado: ~30 minutos"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3001/api/certification-queue/certify-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"regions":["us-east-1"]}')

JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')

if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
  echo "❌ Falha ao iniciar certificação"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Job de certificação criado: $JOB_ID"
echo ""

# Monitorar progresso
echo "📊 Monitorando progresso..."
echo ""

while true; do
  # Buscar estatísticas
  STATS=$(curl -s http://localhost:3001/api/certification-queue/stats \
    -H "Authorization: Bearer $TOKEN")
  
  # Buscar detalhes do job
  JOB=$(curl -s "http://localhost:3001/api/certification-queue/jobs/$JOB_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo "$JOB" | jq -r '.status')
  PROCESSED=$(echo "$JOB" | jq -r '.processedModels')
  TOTAL=$(echo "$JOB" | jq -r '.totalModels')
  SUCCESS=$(echo "$JOB" | jq -r '.successCount')
  FAILURE=$(echo "$JOB" | jq -r '.failureCount')
  
  # Calcular porcentagem
  if [ "$TOTAL" -gt 0 ]; then
    PERCENT=$((PROCESSED * 100 / TOTAL))
  else
    PERCENT=0
  fi
  
  # Mostrar progresso
  echo -ne "\r🔄 Status: $STATUS | Progresso: $PROCESSED/$TOTAL ($PERCENT%) | ✅ $SUCCESS | ❌ $FAILURE"
  
  # Verificar se terminou
  if [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; then
    echo ""
    echo ""
    break
  fi
  
  sleep 5
done

# Mostrar resultado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$STATUS" = "COMPLETED" ]; then
  echo "✅ Certificação concluída com sucesso!"
else
  echo "⚠️  Certificação finalizada com status: $STATUS"
fi

echo ""
echo "📈 Estatísticas:"
echo "   Total de modelos: $TOTAL"
echo "   Processados:      $PROCESSED"
echo "   Sucesso:          $SUCCESS"
echo "   Falha:            $FAILURE"

if [ "$TOTAL" -gt 0 ]; then
  SUCCESS_RATE=$((SUCCESS * 100 / TOTAL))
  echo "   Taxa de sucesso:  $SUCCESS_RATE%"
fi

echo ""
echo "💡 Ver detalhes completos:"
echo "   curl -s http://localhost:3001/api/certification-queue/jobs/$JOB_ID \\"
echo "     -H \"Authorization: Bearer $TOKEN\" | jq '.'"
echo ""
echo "✅ Certificação automática finalizada!"
