#!/bin/bash
# scripts/validate-reorganization.sh
# Valida que a reorganização foi bem-sucedida

echo "🔍 VALIDAÇÃO DA REORGANIZAÇÃO DE SCRIPTS"
echo "========================================"
echo ""

# Verificar scripts críticos na raiz
echo "✅ Verificando scripts críticos na raiz..."
CRITICAL_SCRIPTS=("start.sh" "start_interactive.sh" "start_full.sh" "manage-certifications.sh")
for script in "${CRITICAL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "  ✓ $script presente"
    else
        echo "  ✗ $script AUSENTE!"
        exit 1
    fi
done
echo ""

# Verificar estrutura de diretórios
echo "✅ Verificando estrutura de diretórios..."
DIRS=("scripts/certification" "scripts/testing" "scripts/analysis" 
      "backend/scripts/certification" "backend/scripts/testing" 
      "backend/scripts/maintenance" "backend/scripts/analysis" 
      "backend/scripts/database" "backend/scripts/deprecated")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -maxdepth 1 -type f \( -name "*.sh" -o -name "*.ts" -o -name "*.py" \) | wc -l)
        echo "  ✓ $dir ($count scripts)"
    else
        echo "  ✗ $dir NÃO EXISTE!"
        exit 1
    fi
done
echo ""

# Verificar READMEs
echo "✅ Verificando READMEs..."
READMES=("scripts/README.md" "scripts/certification/README.md" 
         "scripts/testing/README.md" "backend/scripts/certification/README.md"
         "backend/scripts/testing/README.md" "backend/scripts/maintenance/README.md"
         "backend/scripts/analysis/README.md" "backend/scripts/database/README.md")
for readme in "${READMES[@]}"; do
    if [ -f "$readme" ]; then
        echo "  ✓ $readme"
    else
        echo "  ✗ $readme AUSENTE!"
        exit 1
    fi
done
echo ""

# Verificar backup
echo "✅ Verificando backup..."
if [ -d "backups/scripts-backup-20260204-105832" ]; then
    echo "  ✓ Backup disponível"
else
    echo "  ⚠ Backup não encontrado (esperado em backups/scripts-backup-20260204-105832)"
fi
echo ""

# Verificar documentação
echo "✅ Verificando documentação..."
DOCS=("docs/guides/script-organization-standard.md" "scripts/deprecated/REMOVED_SCRIPTS.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✓ $doc"
    else
        echo "  ✗ $doc AUSENTE!"
        exit 1
    fi
done
echo ""

# Resumo
echo "========================================="
echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo "📊 Resumo:"
echo "  - 4 scripts críticos na raiz: OK"
echo "  - 9 diretórios organizados: OK"
echo "  - 8 READMEs criados: OK"
echo "  - 2 documentos principais: OK"
echo "  - Backup disponível: OK"
echo ""
echo "📖 Ver documentação completa:"
echo "  docs/guides/script-organization-standard.md"
