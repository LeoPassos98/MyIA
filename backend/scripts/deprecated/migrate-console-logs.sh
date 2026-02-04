#!/bin/bash
# Script para migrar console.log para logger em massa
# Uso: ./migrate-console-logs.sh

echo "🔄 Migrando console.log para logger..."

# Lista de arquivos a migrar (excluindo testes)
FILES=(
  "backend/src/services/ai/adapters/amazon.adapter.ts"
  "backend/src/services/ai/certification/certification.service.ts"
  "backend/src/services/ai/client/azureEmbeddingClient.ts"
  "backend/src/services/ai/index.ts"
  "backend/src/services/ai/providers/bedrock.ts"
  "backend/src/services/ai/providers/factory.ts"
  "backend/src/services/ai/providers/openai.ts"
  "backend/src/services/awsCredentialsService.ts"
  "backend/src/services/encryptionService.ts"
  "backend/src/services/ragService.ts"
  "backend/src/middleware/authMiddleware.ts"
  "backend/src/middleware/errorHandler.ts"
  "backend/src/routes/authRoutes.ts"
  "backend/src/routes/providers.ts"
  "backend/src/routes/userSettingsRoutes.ts"
  "backend/src/server.ts"
  "backend/src/config/passport.ts"
  "backend/src/features/auth/auth.controller.ts"
  "backend/src/schemas/bedrockSchema.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processando: $file"
    
    # Adicionar import do logger se não existir
    if ! grep -q "import.*logger.*from.*utils/logger" "$file" && ! grep -q "import.*{.*logger.*}.*from.*utils/logger" "$file"; then
      # Encontrar a última linha de import
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i "${last_import}a import logger from '../utils/logger';" "$file" 2>/dev/null || \
        sed -i "${last_import}a import logger from '../../utils/logger';" "$file" 2>/dev/null || \
        sed -i "${last_import}a import logger from '../../../utils/logger';" "$file" 2>/dev/null
      fi
    fi
    
    # Substituir console.log por logger.info
    sed -i 's/console\.log(/logger.info(/g' "$file"
    
    # Substituir console.error por logger.error
    sed -i 's/console\.error(/logger.error(/g' "$file"
    
    # Substituir console.warn por logger.warn
    sed -i 's/console\.warn(/logger.warn(/g' "$file"
    
    echo "✅ Migrado: $file"
  else
    echo "⚠️  Arquivo não encontrado: $file"
  fi
done

echo ""
echo "✅ Migração concluída!"
echo "📊 Verificando ocorrências restantes..."
echo ""

# Verificar ocorrências restantes
remaining=$(grep -r "console\." backend/src --include="*.ts" | grep -v "\.test\.ts" | wc -l)
echo "📈 Console.log restantes: $remaining"

if [ "$remaining" -eq 0 ]; then
  echo "🎉 Todos os console.log foram migrados!"
else
  echo "⚠️  Ainda há $remaining ocorrências de console.log"
  echo "📋 Arquivos com console.log:"
  grep -r "console\." backend/src --include="*.ts" | grep -v "\.test\.ts" | cut -d: -f1 | sort | uniq
fi
