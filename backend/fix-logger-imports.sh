#!/bin/bash
# Script para corrigir imports do logger

echo "🔧 Corrigindo imports do logger..."

# Arquivos que precisam de correção
declare -A files_paths=(
  ["backend/src/features/auth/auth.controller.ts"]="../../utils/logger"
  ["backend/src/services/ai/adapters/amazon.adapter.ts"]="../../../utils/logger"
  ["backend/src/services/ai/client/azureEmbeddingClient.ts"]="../../../utils/logger"
  ["backend/src/services/ai/index.ts"]="../../utils/logger"
  ["backend/src/services/ai/providers/bedrock.ts"]="../../../utils/logger"
  ["backend/src/services/ai/providers/factory.ts"]="../../../utils/logger"
  ["backend/src/services/ai/providers/openai.ts"]="../../../utils/logger"
)

for file in "${!files_paths[@]}"; do
  if [ -f "$file" ]; then
    correct_path="${files_paths[$file]}"
    echo "📝 Corrigindo: $file -> $correct_path"
    
    # Remover imports incorretos do logger
    sed -i "/import logger from '\.\.\/utils\/logger';/d" "$file"
    sed -i "/import logger from '\.\.\/\.\.\/utils\/logger';/d" "$file"
    sed -i "/import logger from '\.\.\/\.\.\/\.\.\/utils\/logger';/d" "$file"
    
    # Adicionar import correto se não existir
    if ! grep -q "import logger from" "$file"; then
      # Encontrar a última linha de import
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i "${last_import}a import logger from '$correct_path';" "$file"
      fi
    fi
    
    echo "✅ Corrigido: $file"
  fi
done

echo ""
echo "✅ Correção concluída!"
