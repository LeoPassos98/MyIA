#!/bin/bash
# scripts/validate-script-references.sh
# Valida referências a scripts antes de mover/remover

SCRIPT_NAME="$1"

if [ -z "$SCRIPT_NAME" ]; then
    echo "❌ Uso: $0 <nome-do-script>"
    exit 1
fi

echo "🔍 Buscando referências a '$SCRIPT_NAME'..."
echo ""

# Buscar em scripts shell
echo "📁 Em scripts shell (.sh):"
grep -r "$SCRIPT_NAME" --include="*.sh" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" || echo "  Nenhuma referência encontrada"
echo ""

# Buscar em scripts TypeScript
echo "📁 Em scripts TypeScript (.ts):"
grep -r "$SCRIPT_NAME" --include="*.ts" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" || echo "  Nenhuma referência encontrada"
echo ""

# Buscar em documentação
echo "📁 Em documentação (.md):"
grep -r "$SCRIPT_NAME" --include="*.md" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" || echo "  Nenhuma referência encontrada"
echo ""

# Buscar em package.json
echo "📁 Em package.json:"
grep -r "$SCRIPT_NAME" --include="package.json" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" || echo "  Nenhuma referência encontrada"
echo ""

echo "✅ Validação concluída"
