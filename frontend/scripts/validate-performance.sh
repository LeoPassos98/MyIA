#!/bin/bash
# frontend/scripts/validate-performance.sh
# Script de validação automatizada de performance

set -e

echo "🚀 Iniciando validação de performance..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Função para reportar sucesso
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Função para reportar falha
fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Função para reportar warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📋 Fase 1: Validação de TypeScript"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run type-check > /dev/null 2>&1; then
    pass "Type-check passou sem erros"
else
    fail "Type-check falhou"
fi
echo ""

echo "🔨 Fase 2: Build de Produção"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run build > /tmp/build-output.txt 2>&1; then
    pass "Build concluído com sucesso"
    
    # Extrair tamanho do bundle principal
    MAIN_BUNDLE=$(grep -oP 'index-[A-Za-z0-9]+\.js\s+\K[\d.]+\s+kB\s+│\s+gzip:\s+[\d.]+\s+kB' /tmp/build-output.txt | tail -1)
    if [ -n "$MAIN_BUNDLE" ]; then
        echo "   Bundle principal: $MAIN_BUNDLE"
    fi
else
    fail "Build falhou"
    cat /tmp/build-output.txt
fi
echo ""

echo "🔍 Fase 3: Linting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run lint > /dev/null 2>&1; then
    pass "Lint passou sem warnings"
else
    fail "Lint encontrou problemas"
fi
echo ""

echo "📦 Fase 4: Análise de Bundle Size"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se dist existe
if [ -d "dist" ]; then
    # Encontrar o arquivo JS principal
    MAIN_JS=$(find dist/assets/js -name "index-*.js" -type f | head -1)
    
    if [ -f "$MAIN_JS" ]; then
        # Tamanho original
        SIZE_BYTES=$(stat -f%z "$MAIN_JS" 2>/dev/null || stat -c%s "$MAIN_JS" 2>/dev/null)
        SIZE_KB=$((SIZE_BYTES / 1024))
        
        # Tamanho gzipped
        GZIP_BYTES=$(gzip -c "$MAIN_JS" | wc -c)
        GZIP_KB=$((GZIP_BYTES / 1024))
        
        echo "   Bundle principal:"
        echo "   - Original: ${SIZE_KB} KB"
        echo "   - Gzipped: ${GZIP_KB} KB"
        
        # Validar limite de 500 KB gzipped
        if [ $GZIP_KB -lt 500 ]; then
            pass "Bundle size dentro do limite (< 500 KB gzipped)"
        else
            fail "Bundle size excede limite de 500 KB gzipped"
        fi
        
        # Contar chunks
        CHUNK_COUNT=$(find dist/assets/js -name "*.js" -type f | wc -l)
        echo "   - Total de chunks: $CHUNK_COUNT"
        
        if [ $CHUNK_COUNT -gt 5 ]; then
            pass "Code splitting implementado ($CHUNK_COUNT chunks)"
        else
            warn "Poucos chunks detectados, considere mais code splitting"
        fi
    else
        fail "Bundle principal não encontrado"
    fi
else
    fail "Diretório dist não encontrado. Execute npm run build primeiro."
fi
echo ""

echo "🎯 Fase 5: Verificação de Otimizações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se hooks de otimização existem
HOOKS=(
    "src/hooks/useMemoryOptimization.ts"
    "src/hooks/useLayoutOptimization.ts"
    "src/hooks/useVirtualization.ts"
    "src/hooks/usePerformanceTracking.ts"
)

for hook in "${HOOKS[@]}"; do
    if [ -f "$hook" ]; then
        pass "Hook de otimização existe: $(basename $hook)"
    else
        fail "Hook de otimização não encontrado: $(basename $hook)"
    fi
done
echo ""

# Verificar se componentes críticos usam React.memo
echo "🔬 Verificando uso de React.memo..."
MEMO_COMPONENTS=$(grep -r "React.memo" src/features/chat/components --include="*.tsx" | wc -l)
if [ $MEMO_COMPONENTS -gt 0 ]; then
    pass "React.memo usado em $MEMO_COMPONENTS componentes"
else
    warn "Nenhum componente usando React.memo detectado"
fi
echo ""

# Verificar lazy loading
echo "⚡ Verificando lazy loading..."
LAZY_IMPORTS=$(grep -r "React.lazy" src --include="*.tsx" --include="*.ts" | wc -l)
if [ $LAZY_IMPORTS -gt 0 ]; then
    pass "Lazy loading implementado ($LAZY_IMPORTS imports)"
else
    warn "Nenhum lazy import detectado"
fi
echo ""

echo "📊 Resumo da Validação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passou:${NC} $PASSED testes"
echo -e "${RED}Falhou:${NC} $FAILED testes"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ VALIDAÇÃO APROVADA${NC}"
    echo ""
    echo "Todas as verificações passaram com sucesso!"
    echo "O código está pronto para produção."
    exit 0
else
    echo -e "${RED}❌ VALIDAÇÃO REPROVADA${NC}"
    echo ""
    echo "Alguns testes falharam. Revise os problemas acima."
    exit 1
fi
