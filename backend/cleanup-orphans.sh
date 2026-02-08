#!/bin/bash
# backend/cleanup-orphans.sh
# Script para remover arquivos órfãos confirmados como código morto

set -e

echo "🧹 Iniciando limpeza de arquivos órfãos..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "backend/src" ]; then
    echo "❌ Erro: Execute este script da raiz do projeto MyIA"
    exit 1
fi

# 1. Remover código morto
echo "🗑️  Fase 1: Removendo código morto (11 arquivos)..."
echo ""

echo "  📁 Removendo módulos de auditoria..."
rm -f backend/src/audit/domain/AuditEnums.ts
rm -f backend/src/audit/domain/AuditTypes.ts
rm -f backend/src/audit/utils/sentContextParser.ts

echo "  📁 Removendo serviços de chat não utilizados..."
rm -f backend/src/services/chat/costService.ts
rm -f backend/src/utils/chat/tokenValidator.ts

echo "  📁 Removendo tipos não utilizados..."
rm -f backend/src/types/logging.ts

echo "  📁 Removendo AI services não utilizados..."
rm -f backend/src/services/ai/adapters/on-demand/index.ts
rm -f backend/src/services/ai/providers/bedrock/index.ts

echo "  📁 Removendo loaders não utilizados..."
rm -f backend/src/services/ai/adapters/loaders/adapter-loader.ts
rm -f backend/src/services/ai/adapters/loaders/adapter-validator.ts
rmdir backend/src/services/ai/adapters/loaders 2>/dev/null || true

echo "  📁 Removendo provider utils não utilizados..."
rm -f backend/src/services/ai/utils/providerUtils.ts

echo "✅ Código morto removido!"
echo ""

# 2. Remover barris não utilizados
echo "🗑️  Fase 2: Removendo barris de exportação não utilizados (6 arquivos)..."
echo ""

echo "  📁 Removendo barris de certification queue..."
rm -f backend/src/controllers/certificationQueue/handlers/index.ts
rm -f backend/src/controllers/certificationQueue/transformers/index.ts
rm -f backend/src/controllers/certificationQueue/validators/index.ts

echo "  📁 Removendo barris de chat orchestrator..."
rm -f backend/src/services/chat/orchestrator/builders/index.ts
rm -f backend/src/services/chat/orchestrator/handlers/index.ts
rm -f backend/src/services/chat/orchestrator/validators/index.ts

echo "✅ Barris removidos!"
echo ""

# 3. Verificar resultado
echo "🔍 Fase 3: Verificando resultado com madge..."
echo ""
cd backend
npx madge --extensions ts,tsx --orphans src/ > ../orphans-after-cleanup.txt 2>&1 || true
cd ..

echo "✅ Resultado salvo em orphans-after-cleanup.txt"
echo ""

# 4. Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Limpeza concluída com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Estatísticas:"
echo "  • Arquivos de código morto removidos: 11"
echo "  • Barris não utilizados removidos: 6"
echo "  • Total de arquivos removidos: 17"
echo ""
echo "📝 Próximos passos:"
echo "  1. Revisar orphans-after-cleanup.txt"
echo "  2. Executar testes: cd backend && npm test"
echo "  3. Integrar Bull Board ao server.ts (ver docs/ORPHAN-FILES-DETAILED-ANALYSIS.md)"
echo ""
echo "📖 Documentação:"
echo "  • backend/docs/ORPHAN-FILES-ANALYSIS.md"
echo "  • backend/docs/ORPHAN-FILES-DETAILED-ANALYSIS.md"
echo ""
