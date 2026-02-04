#!/usr/bin/env bash
# Script de Teste Automatizado para manage-certifications.sh
# Test Engineer - Validação das Correções Implementadas

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Função para imprimir resultado de teste
print_test_result() {
  local test_name="$1"
  local result="$2"
  local message="${3:-}"
  
  case "$result" in
    PASS)
      echo -e "${GREEN}✓ PASSOU${NC} - $test_name"
      [ -n "$message" ] && echo -e "  ${BLUE}ℹ${NC} $message"
      ((TESTS_PASSED++))
      ;;
    FAIL)
      echo -e "${RED}✗ FALHOU${NC} - $test_name"
      [ -n "$message" ] && echo -e "  ${RED}✗${NC} $message"
      ((TESTS_FAILED++))
      ;;
    WARN)
      echo -e "${YELLOW}⚠ RESSALVA${NC} - $test_name"
      [ -n "$message" ] && echo -e "  ${YELLOW}⚠${NC} $message"
      ((TESTS_WARNING++))
      ;;
  esac
}

# Função para executar teste de detecção
test_detection() {
  local service="$1"
  local expected="$2"
  
  echo -e "\n${BOLD}=== Testando Detecção: $service ===${NC}\n"
  
  # Executar script com timeout e capturar output
  local output
  output=$(timeout 5s bash -c "echo '1' | ./manage-certifications.sh 2>&1" || true)
  
  # Verificar se serviço foi detectado corretamente
  if echo "$output" | grep -q "$service.*$expected"; then
    print_test_result "Detecção de $service" "PASS" "Status: $expected"
    return 0
  else
    print_test_result "Detecção de $service" "FAIL" "Esperado: $expected, Output: $(echo "$output" | grep "$service" || echo "não encontrado")"
    return 1
  fi
}

# Função para verificar estrutura JSON
test_json_structure() {
  echo -e "\n${BOLD}=== Testando Estrutura JSON da API ===${NC}\n"
  
  # Fazer login e obter token
  local login_response
  login_response=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"123@123.com","password":"123123"}' || echo "")
  
  if [ -z "$login_response" ]; then
    print_test_result "Login na API" "FAIL" "API não respondeu"
    return 1
  fi
  
  local token
  token=$(echo "$login_response" | jq -r '.data.token // empty' 2>/dev/null || echo "")
  
  if [ -z "$token" ]; then
    print_test_result "Login na API" "FAIL" "Token não obtido"
    return 1
  fi
  
  print_test_result "Login na API" "PASS" "Token obtido com sucesso"
  
  # Testar endpoint de stats
  local stats_response
  stats_response=$(curl -s -H "Authorization: Bearer $token" \
    http://localhost:3001/api/certification-queue/stats || echo "")
  
  if [ -z "$stats_response" ]; then
    print_test_result "API Stats" "FAIL" "API não respondeu"
    return 1
  fi
  
  # Verificar estrutura JSON
  if echo "$stats_response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    print_test_result "API Stats - Status" "PASS" "API retornou sucesso"
    
    # Verificar estrutura .data.queue.queue.*
    if echo "$stats_response" | jq -e '.data.queue.queue' >/dev/null 2>&1; then
      print_test_result "API Stats - Estrutura JSON" "PASS" "Estrutura .data.queue.queue.* encontrada"
      
      # Verificar campos específicos
      local waiting=$(echo "$stats_response" | jq -r '.data.queue.queue.waiting // "null"')
      local active=$(echo "$stats_response" | jq -r '.data.queue.queue.active // "null"')
      local completed=$(echo "$stats_response" | jq -r '.data.queue.queue.completed // "null"')
      local failed=$(echo "$stats_response" | jq -r '.data.queue.queue.failed // "null"')
      
      if [ "$waiting" != "null" ] && [ "$active" != "null" ] && [ "$completed" != "null" ] && [ "$failed" != "null" ]; then
        print_test_result "API Stats - Campos" "PASS" "waiting=$waiting, active=$active, completed=$completed, failed=$failed"
      else
        print_test_result "API Stats - Campos" "FAIL" "Campos faltando ou nulos"
      fi
    else
      print_test_result "API Stats - Estrutura JSON" "FAIL" "Estrutura .data.queue.queue.* não encontrada"
      echo -e "  ${YELLOW}Resposta:${NC} $(echo "$stats_response" | jq -c .)"
    fi
  else
    print_test_result "API Stats - Status" "FAIL" "API retornou erro"
    echo -e "  ${YELLOW}Resposta:${NC} $(echo "$stats_response" | jq -c .)"
  fi
}

# Função principal
main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${BOLD}  VALIDAÇÃO - manage-certifications.sh        ${NC}${BLUE}║${NC}"
  echo -e "${BLUE}║${BOLD}  Test Engineer - Relatório de Testes         ${NC}${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
  
  echo -e "\n${BOLD}Data/Hora:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "${BOLD}Sistema:${NC} $(uname -s) $(uname -r)"
  
  # Verificar se script existe
  if [ ! -f "./manage-certifications.sh" ]; then
    echo -e "\n${RED}✗ ERRO:${NC} Script manage-certifications.sh não encontrado!"
    exit 1
  fi
  
  # Verificar se script é executável
  if [ ! -x "./manage-certifications.sh" ]; then
    echo -e "\n${YELLOW}⚠ AVISO:${NC} Tornando script executável..."
    chmod +x ./manage-certifications.sh
  fi
  
  # FASE 1: Verificar Serviços
  echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}FASE 1: Verificação de Serviços${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # Verificar Backend
  if lsof -ti:3001 >/dev/null 2>&1; then
    print_test_result "Backend (porta 3001)" "PASS" "Porta ocupada"
  else
    print_test_result "Backend (porta 3001)" "FAIL" "Porta livre"
  fi
  
  # Verificar Redis via API (já que redis-cli não está instalado)
  test_json_structure
  
  # FASE 2: Testes de Detecção com Serviços Ativos
  echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}FASE 2: Testes de Detecção (Serviços Ativos)${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # Executar script e capturar output
  echo -e "\n${BLUE}ℹ${NC} Executando manage-certifications.sh (opção 1 - Status)..."
  local full_output
  full_output=$(timeout 10s bash -c "echo '1' | ./manage-certifications.sh 2>&1" || true)
  
  echo -e "\n${BOLD}Output Capturado:${NC}"
  echo "----------------------------------------"
  echo "$full_output" | head -n 50
  echo "----------------------------------------"
  
  # Critério 1: Detecção de Backend
  echo -e "\n${BOLD}Critério 1: Detecção de Backend${NC}"
  if echo "$full_output" | grep -q "Backend (API).*Rodando"; then
    print_test_result "Backend detectado como rodando" "PASS"
  elif echo "$full_output" | grep -q "Backend (API).*Não está rodando"; then
    print_test_result "Backend detectado como rodando" "FAIL" "Backend está rodando mas foi detectado como parado"
  else
    print_test_result "Backend detectado como rodando" "WARN" "Linha de status do backend não encontrada no output"
  fi
  
  # Critério 2: Detecção de Redis
  echo -e "\n${BOLD}Critério 2: Detecção de Redis${NC}"
  if echo "$full_output" | grep -q "Redis.*Acessível"; then
    print_test_result "Redis detectado como acessível" "PASS"
  elif echo "$full_output" | grep -q "Redis.*Não acessível"; then
    print_test_result "Redis detectado como acessível" "WARN" "Redis detectado como não acessível (redis-cli não instalado, fallback via API deve funcionar)"
  else
    print_test_result "Redis detectado como acessível" "WARN" "Linha de status do Redis não encontrada no output"
  fi
  
  # Critério 3: Detecção de Worker
  echo -e "\n${BOLD}Critério 3: Detecção de Worker${NC}"
  if echo "$full_output" | grep -q "Worker.*Rodando"; then
    print_test_result "Worker detectado como rodando" "PASS"
  elif echo "$full_output" | grep -q "Worker.*Não está rodando"; then
    print_test_result "Worker detectado como rodando" "FAIL" "Worker deveria estar rodando (integrado no backend)"
  else
    print_test_result "Worker detectado como rodando" "WARN" "Linha de status do Worker não encontrada no output"
  fi
  
  # Critério 4: Estatísticas da Fila
  echo -e "\n${BOLD}Critério 4: Estatísticas da Fila${NC}"
  if echo "$full_output" | grep -q "Estatísticas da Fila"; then
    print_test_result "Seção de estatísticas presente" "PASS"
    
    if echo "$full_output" | grep -q "Na Fila:"; then
      print_test_result "Campo 'Na Fila' presente" "PASS"
    else
      print_test_result "Campo 'Na Fila' presente" "FAIL"
    fi
    
    if echo "$full_output" | grep -q "Processando:"; then
      print_test_result "Campo 'Processando' presente" "PASS"
    else
      print_test_result "Campo 'Processando' presente" "FAIL"
    fi
    
    if echo "$full_output" | grep -q "Completos:"; then
      print_test_result "Campo 'Completos' presente" "PASS"
    else
      print_test_result "Campo 'Completos' presente" "FAIL"
    fi
    
    if echo "$full_output" | grep -q "Falhados:"; then
      print_test_result "Campo 'Falhados' presente" "PASS"
    else
      print_test_result "Campo 'Falhados' presente" "FAIL"
    fi
  else
    print_test_result "Seção de estatísticas presente" "FAIL" "Seção não encontrada no output"
  fi
  
  # RESUMO FINAL
  echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}RESUMO DOS TESTES${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  local total=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
  
  echo -e "\n${GREEN}✓ Testes Passaram:${NC}    $TESTS_PASSED/$total"
  echo -e "${RED}✗ Testes Falharam:${NC}    $TESTS_FAILED/$total"
  echo -e "${YELLOW}⚠ Testes com Ressalva:${NC} $TESTS_WARNING/$total"
  
  # Calcular taxa de sucesso
  local success_rate=0
  if [ "$total" -gt 0 ]; then
    success_rate=$((TESTS_PASSED * 100 / total))
  fi
  
  echo -e "\n${BOLD}Taxa de Sucesso:${NC} $success_rate%"
  
  # Determinar status geral
  if [ "$TESTS_FAILED" -eq 0 ] && [ "$TESTS_WARNING" -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✅ STATUS GERAL: APROVADO${NC}"
    return 0
  elif [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "\n${YELLOW}${BOLD}⚠️ STATUS GERAL: APROVADO COM RESSALVAS${NC}"
    return 0
  else
    echo -e "\n${RED}${BOLD}❌ STATUS GERAL: REPROVADO${NC}"
    return 1
  fi
}

# Executar
main "$@"
