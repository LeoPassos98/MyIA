#!/bin/bash
# .husky/check-file-size.sh
# Script para verificar tamanho de arquivos no pre-commit
# Standards: docs/STANDARDS.md

# Configurações
WARNING_THRESHOLD=300
ERROR_THRESHOLD=400
RECOMMENDED_SIZE=250

# Cores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Função para contar linhas de código (exclui comentários e linhas vazias)
count_code_lines() {
  local file="$1"
  
  # Remove:
  # - Linhas vazias
  # - Linhas com apenas espaços
  # - Comentários de linha única (// e #)
  # - Comentários de bloco (/* */ e <!-- -->)
  grep -v '^\s*$' "$file" | \
    grep -v '^\s*//' | \
    grep -v '^\s*#' | \
    grep -v '^\s*/\*' | \
    grep -v '^\s*\*' | \
    grep -v '^\s*\*/' | \
    grep -v '^\s*<!--' | \
    grep -v '^\s*-->' | \
    wc -l | \
    tr -d ' '
}

# Obter arquivos staged
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Arrays para armazenar resultados
declare -a WARNING_FILES
declare -a ERROR_FILES

# Verificar cada arquivo
while IFS= read -r file; do
  if [ -f "$file" ]; then
    line_count=$(count_code_lines "$file")
    
    if [ "$line_count" -ge "$ERROR_THRESHOLD" ]; then
      ERROR_FILES+=("$file:$line_count")
    elif [ "$line_count" -ge "$WARNING_THRESHOLD" ]; then
      WARNING_FILES+=("$file:$line_count")
    fi
  fi
done <<< "$STAGED_FILES"

# Se houver arquivos com erro (>400 linhas), bloquear commit
if [ ${#ERROR_FILES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}🚨 FILE SIZE ERROR${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "The following files exceed the MAXIMUM allowed size:"
  echo ""
  
  for file_info in "${ERROR_FILES[@]}"; do
    file="${file_info%:*}"
    lines="${file_info#*:}"
    echo -e "  ${RED}✗${NC} $file (${RED}${lines} lines${NC})"
  done
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}📋 REQUIRED ACTION:${NC}"
  echo "  1. Refactor these files to be under 400 lines"
  echo "  2. Consider splitting into smaller modules"
  echo "  3. Extract reusable logic into separate files"
  echo ""
  echo -e "${YELLOW}📖 Guidelines:${NC}"
  echo "  • Recommended: ≤250 lines"
  echo "  • Warning: >300 lines"
  echo "  • Blocked: >400 lines"
  echo ""
  echo -e "${YELLOW}📚 See: docs/STANDARDS.md (Section 15)${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 1
fi

# Se houver arquivos com warning (>300 linhas), mostrar aviso mas permitir commit
if [ ${#WARNING_FILES[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  FILE SIZE WARNING${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "The following files exceed recommended size:"
  echo ""
  
  for file_info in "${WARNING_FILES[@]}"; do
    file="${file_info%:*}"
    lines="${file_info#*:}"
    echo -e "  ${YELLOW}⚠${NC} $file (${YELLOW}${lines} lines${NC}) - Consider refactoring"
  done
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}💡 RECOMMENDATIONS:${NC}"
  echo "  • Extract complex logic into separate functions"
  echo "  • Split large components into smaller ones"
  echo "  • Move reusable code to utility files"
  echo "  • Consider using composition patterns"
  echo ""
  echo -e "${GREEN}📏 Size Guidelines:${NC}"
  echo "  • Recommended: ≤250 lines"
  echo "  • Warning: >300 lines (current)"
  echo "  • Blocked: >400 lines"
  echo ""
  echo -e "${GREEN}📚 See: docs/STANDARDS.md (Section 15)${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✓ Commit allowed (warning only)${NC}"
  echo ""
fi

exit 0
