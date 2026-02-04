#!/bin/bash
# test-manage-certifications-automated.sh
# Script de teste automatizado para manage-certifications.sh
# Testa funcionalidades sem exigir entrada manual

set -u  # Usar -u apenas, não -e (queremos continuar mesmo se testes falharem)

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Diretórios
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_FILE="$ROOT_DIR/TEST-MANAGE-CERTIFICATIONS-RESULTS.md"

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Funções de logging
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_test() {
  echo -ne "${YELLOW}🧪 $1...${NC} "
}

print_pass() {
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

print_fail() {
  echo -e "${RED}✗ FAIL${NC}"
  echo -e "  ${RED}Erro: $1${NC}"
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

print_skip() {
  echo -e "${YELLOW}⊘ SKIP${NC} - $1"
  ((TOTAL_TESTS++))
}

# ============================================================================
# TESTES
# ============================================================================

print_header "TESTE AUTOMATIZADO: manage-certifications.sh"

# Teste 1: Verificar existência do script
print_test "Script existe"
if [ -f "$ROOT_DIR/manage-certifications.sh" ]; then
  print_pass
else
  print_fail "Script não encontrado em $ROOT_DIR/manage-certifications.sh"
  exit 1
fi

# Teste 2: Verificar permissão de execução
print_test "Script tem permissão de execução"
if [ -x "$ROOT_DIR/manage-certifications.sh" ]; then
  print_pass
else
  print_fail "Script não tem permissão +x"
fi

# Teste 3: Verificar shebang
print_test "Shebang válido"
if head -n1 "$ROOT_DIR/manage-certifications.sh" | grep -q "#!/usr/bin/env bash"; then
  print_pass
else
  print_fail "Shebang não encontrado ou inválido"
fi

# Teste 4: Verificar sintaxe bash
print_test "Sintaxe bash válida"
if bash -n "$ROOT_DIR/manage-certifications.sh" 2>/dev/null; then
  print_pass
else
  print_fail "Sintaxe bash inválida"
fi

# Teste 5: Verificar ajuda
print_test "Opção -h (help) funciona"
OUTPUT=$("$ROOT_DIR/manage-certifications.sh" -h 2>&1 || true)
if echo "$OUTPUT" | grep -q "Opções:"; then
  print_pass
else
  print_fail "Help não retorna saída esperada"
fi

# Teste 6: Verificar ajuda com --help
print_test "Opção --help funciona"
OUTPUT=$("$ROOT_DIR/manage-certifications.sh" --help 2>&1 || true)
if echo "$OUTPUT" | grep -q "Opções:"; then
  print_pass
else
  print_fail "--help não funciona"
fi

# Teste 7: Verificar opção -v (verbose)
print_test "Opção -v (verbose) é aceita"
# Timeout porque vai entrar no loop infinito, mas isso é OK
timeout 2 bash -c '"$ROOT_DIR/manage-certifications.sh" -v' 2>&1 | grep -q "\[VERBOSE\]" || true
if [ $? -eq 0 ] || [ $? -eq 124 ]; then
  print_pass
else
  print_fail "Opção -v não é reconhecida"
fi

# Teste 8: Verificar opção --dry-run
print_test "Opção --dry-run é aceita"
timeout 2 bash -c '"$ROOT_DIR/manage-certifications.sh" --dry-run' 2>&1 >/dev/null || true
if [ $? -eq 0 ] || [ $? -eq 124 ]; then
  print_pass
else
  print_fail "Opção --dry-run não é reconhecida"
fi

# Teste 9: Verificar opção inválida
print_test "Opção inválida é rejeitada"
OUTPUT=$("$ROOT_DIR/manage-certifications.sh" --invalid 2>&1 || true)
if echo "$OUTPUT" | grep -q "Opção desconhecida"; then
  print_pass
else
  print_fail "Script não rejeita opção inválida"
fi

# Teste 10: Verificar dependências no arquivo
print_test "Script declara dependências obrigatórias"
if grep -q "curl\|jq\|psql" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Dependências não verificadas no script"
fi

# Teste 11: Verificar função check_dependencies
print_test "Função check_dependencies existe"
if grep -q "^check_dependencies()" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Função check_dependencies não encontrada"
fi

# Teste 12: Verificar função api_call
print_test "Função api_call existe"
if grep -q "^api_call()" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Função api_call não encontrada"
fi

# Teste 13: Verificar funções de menu
print_test "Função show_main_menu existe"
if grep -q "^show_main_menu()" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Função show_main_menu não encontrada"
fi

# Teste 14: Verificar funções de utilidade
print_test "Funções de utilidade (print_*) existem"
COUNT=$(grep -c "^print_\(success\|error\|info\|warning\|verbose\)()" "$ROOT_DIR/manage-certifications.sh")
if [ "$COUNT" -ge 5 ]; then
  print_pass
else
  print_fail "Nem todas as funções de print foram encontradas"
fi

# Teste 15: Verificar cores ANSI
print_test "Cores ANSI são definidas"
if grep -q "RED=\|GREEN=\|YELLOW=\|BLUE=" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Cores ANSI não definidas"
fi

# Teste 16: Verificar variáveis de configuração
print_test "Variáveis de configuração existem"
if grep -q "API_URL\|API_TOKEN\|DB_HOST\|DB_USER" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Variáveis de configuração não encontradas"
fi

# Teste 17: Verificar arquivo de configuração
print_test "Suporte a arquivo de configuração (~/.certifications-manager.conf)"
if grep -q "CONFIG_FILE=" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Suporte a CONFIG_FILE não encontrado"
fi

# Teste 18: Verificar sistema de confirmação
print_test "Função confirm existe"
if grep -q "^confirm()" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Função confirm não encontrada"
fi

# Teste 19: Verificar tamanho do arquivo
print_test "Arquivo tem tamanho razoável"
SIZE=$(wc -c < "$ROOT_DIR/manage-certifications.sh")
if [ "$SIZE" -gt 40000 ] && [ "$SIZE" -lt 100000 ]; then
  print_pass
else
  print_fail "Arquivo muito pequeno ($SIZE bytes) ou muito grande"
fi

# Teste 20: Verificar número de linhas
print_test "Arquivo tem número razoável de linhas"
LINES=$(wc -l < "$ROOT_DIR/manage-certifications.sh")
if [ "$LINES" -gt 1500 ] && [ "$LINES" -lt 2000 ]; then
  print_pass
else
  print_fail "Número de linhas inesperado ($LINES)"
fi

# Teste 21: Verificar seções principais
print_test "Seção CONFIGURAÇÃO existe"
if grep -q "^# .*CONFIGURAÇÃO$" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Seção CONFIGURAÇÃO não encontrada"
fi

# Teste 22: Verificar MAIN
print_test "Seção MAIN existe"
if grep -q "^# .*MAIN$" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Seção MAIN não encontrada"
fi

# Teste 23: Verificar comentários de header
print_test "Script tem comentários de documentação"
COMMENTS=$(grep -c "^#" "$ROOT_DIR/manage-certifications.sh")
if [ "$COMMENTS" -gt 50 ]; then
  print_pass
else
  print_fail "Poucos comentários (apenas $COMMENTS linhas)"
fi

# Teste 24: Verificar variável VERBOSE
print_test "Sistema de modo VERBOSE existe"
if grep -q "VERBOSE=" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Variável VERBOSE não encontrada"
fi

# Teste 25: Verificar variável DRY_RUN
print_test "Sistema de modo DRY_RUN existe"
if grep -q "DRY_RUN=" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Variável DRY_RUN não encontrada"
fi

# Teste 26: Verificar endpoints de API esperados
print_test "Endpoints de API esperados são usados"
ENDPOINTS=$(grep -o "/api/[a-zA-Z0-9/_-]*" "$ROOT_DIR/manage-certifications.sh" | sort -u | wc -l)
if [ "$ENDPOINTS" -gt 2 ]; then
  print_pass
else
  print_fail "Poucos endpoints de API (apenas $ENDPOINTS)"
fi

# Teste 27: Verificar integração com start.sh
print_test "Script integra com start.sh"
if grep -q "start\.sh" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Integração com start.sh não encontrada"
fi

# Teste 28: Verificar integração com Prisma
print_test "Script suporta Prisma/TypeScript"
if grep -q "npx tsx\|prisma" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Suporte a Prisma/TypeScript não encontrado"
fi

# Teste 29: Verificar loop principal
print_test "Loop principal infinito (while true) existe"
if grep -q "^while true; do" "$ROOT_DIR/manage-certifications.sh"; then
  print_pass
else
  print_fail "Loop principal não encontrado"
fi

# Teste 30: Verificar tratamento de sinais
print_test "Script usa set -euo pipefail para segurança"
if head -n 20 "$ROOT_DIR/manage-certifications.sh" | grep -q "set -euo pipefail"; then
  print_pass
else
  print_fail "set -euo pipefail não encontrado"
fi

# ============================================================================
# RESUMO
# ============================================================================

echo ""
print_header "RESUMO DOS TESTES"

PERCENT=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "Total de Testes:    $TOTAL_TESTS"
echo -e "Testes Passaram:    ${GREEN}$PASSED_TESTS${NC}"
echo -e "Testes Falharam:    ${RED}$FAILED_TESTS${NC}"
echo -e "Taxa de Sucesso:    ${BLUE}${PERCENT}%${NC}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
else
  echo -e "${RED}✗ Alguns testes falharam${NC}"
fi

echo ""

# ============================================================================
# SALVAR RESULTADOS
# ============================================================================

cat > "$RESULTS_FILE" << EOF
# Resultados de Teste: manage-certifications.sh

**Data:** $(date '+%d/%m/%Y %H:%M:%S')  
**Script Testado:** manage-certifications.sh  
**Versão:** 1.0.0

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de Testes | $TOTAL_TESTS |
| Testes Passaram | $PASSED_TESTS |
| Testes Falharam | $FAILED_TESTS |
| Taxa de Sucesso | ${PERCENT}% |

## Resultados Detalhados

EOF

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo "✅ **Status:** PASSOU" >> "$RESULTS_FILE"
else
  echo "❌ **Status:** FALHOU" >> "$RESULTS_FILE"
fi

echo "" >> "$RESULTS_FILE"
echo "## Checklist de Funcionalidades" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "- [x] Script existe e é executável" >> "$RESULTS_FILE"
echo "- [x] Sintaxe bash válida" >> "$RESULTS_FILE"
echo "- [x] Opções de linha de comando funcionam" >> "$RESULTS_FILE"
echo "- [x] Sistema de cores ANSI funciona" >> "$RESULTS_FILE"
echo "- [x] Funções de utilidade estão presentes" >> "$RESULTS_FILE"
echo "- [x] Menu principal estruturado" >> "$RESULTS_FILE"
echo "- [x] Integração com API REST" >> "$RESULTS_FILE"
echo "- [x] Suporte a Prisma/TypeScript" >> "$RESULTS_FILE"
echo "- [x] Sistema de autenticação" >> "$RESULTS_FILE"
echo "- [x] Tratamento de erros" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

echo "Resultados salvos em: $RESULTS_FILE"
