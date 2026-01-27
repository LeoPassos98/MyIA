#!/bin/bash

# MyIA Observability Stack - Validation Script
# Verifica se todos os serviços estão funcionando corretamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de output
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Variáveis
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   MyIA Observability Stack - Validation                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 1. Verificar se Docker está rodando
print_header "1. Verificando Docker"

if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado"
    ERRORS=$((ERRORS + 1))
else
    print_success "Docker está instalado"
    
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando"
        print_info "Execute: sudo systemctl start docker"
        ERRORS=$((ERRORS + 1))
    else
        print_success "Docker está rodando"
    fi
fi

# 2. Verificar containers
print_header "2. Verificando Containers"

cd "$SCRIPT_DIR"

CONTAINERS=("myia-loki" "myia-grafana" "myia-promtail")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container")
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
        
        if [ "$STATUS" = "running" ]; then
            if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; then
                print_success "$container está rodando"
            else
                print_warning "$container está rodando mas não está saudável (health: $HEALTH)"
                ERRORS=$((ERRORS + 1))
            fi
        else
            print_error "$container não está rodando (status: $STATUS)"
            ERRORS=$((ERRORS + 1))
        fi
    else
        print_error "$container não foi encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

# 3. Verificar Loki
print_header "3. Verificando Loki"

if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
    print_success "Loki está acessível (http://localhost:3100)"
    
    # Verificar se Loki está recebendo logs
    LOGS_COUNT=$(curl -s -G "http://localhost:3100/loki/api/v1/query" \
        --data-urlencode 'query={app="myia"}' \
        --data-urlencode 'limit=1' | jq -r '.data.result | length' 2>/dev/null || echo "0")
    
    if [ "$LOGS_COUNT" -gt 0 ]; then
        print_success "Loki está recebendo logs (encontrados: $LOGS_COUNT streams)"
    else
        print_warning "Loki não está recebendo logs ainda"
        print_info "Aguarde alguns segundos ou gere logs no backend"
    fi
else
    print_error "Loki não está acessível em http://localhost:3100"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar Grafana
print_header "4. Verificando Grafana"

if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    print_success "Grafana está acessível (http://localhost:3002)"
    
    # Verificar datasource
    DATASOURCE_STATUS=$(curl -s -u admin:admin http://localhost:3002/api/datasources/name/Loki 2>/dev/null | jq -r '.name' 2>/dev/null || echo "")
    
    if [ "$DATASOURCE_STATUS" = "Loki" ]; then
        print_success "Datasource Loki está configurado"
    else
        print_warning "Datasource Loki não foi encontrado"
        print_info "Aguarde alguns segundos para o provisioning automático"
    fi
    
    # Verificar dashboards
    DASHBOARDS_COUNT=$(curl -s -u admin:admin http://localhost:3002/api/search?type=dash-db 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
    
    if [ "$DASHBOARDS_COUNT" -gt 0 ]; then
        print_success "Dashboards carregados: $DASHBOARDS_COUNT"
        
        # Listar dashboards
        DASHBOARD_NAMES=$(curl -s -u admin:admin http://localhost:3002/api/search?type=dash-db 2>/dev/null | jq -r '.[].title' 2>/dev/null || echo "")
        if [ -n "$DASHBOARD_NAMES" ]; then
            echo -e "  ${BLUE}Dashboards disponíveis:${NC}"
            echo "$DASHBOARD_NAMES" | while read -r name; do
                echo "    • $name"
            done
        fi
    else
        print_warning "Nenhum dashboard encontrado"
        print_info "Aguarde alguns segundos para o provisioning automático"
    fi
else
    print_error "Grafana não está acessível em http://localhost:3002"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar Promtail
print_header "5. Verificando Promtail"

PROMTAIL_LOGS=$(docker logs myia-promtail 2>&1 | tail -n 20)

if echo "$PROMTAIL_LOGS" | grep -q "level=error"; then
    print_warning "Promtail tem erros nos logs"
    print_info "Execute: ./logs.sh promtail"
else
    print_success "Promtail está funcionando sem erros"
fi

# Verificar se Promtail está enviando logs
if echo "$PROMTAIL_LOGS" | grep -q "POST /loki/api/v1/push"; then
    print_success "Promtail está enviando logs para Loki"
else
    print_warning "Promtail não está enviando logs ainda"
    print_info "Verifique se há arquivos de log em ../backend/logs/"
fi

# 6. Verificar arquivos de log
print_header "6. Verificando Arquivos de Log"

LOG_DIR="../backend/logs"

if [ -d "$LOG_DIR" ]; then
    print_success "Diretório de logs existe: $LOG_DIR"
    
    LOG_FILES=$(find "$LOG_DIR" -name "*.log" -type f 2>/dev/null | wc -l)
    
    if [ "$LOG_FILES" -gt 0 ]; then
        print_success "Arquivos de log encontrados: $LOG_FILES"
        
        # Mostrar arquivos mais recentes
        echo -e "  ${BLUE}Arquivos mais recentes:${NC}"
        find "$LOG_DIR" -name "*.log" -type f -printf '%T@ %p\n' 2>/dev/null | \
            sort -rn | head -n 5 | cut -d' ' -f2- | while read -r file; do
            SIZE=$(du -h "$file" | cut -f1)
            echo "    • $(basename "$file") ($SIZE)"
        done
    else
        print_warning "Nenhum arquivo de log encontrado"
        print_info "Inicie o backend para gerar logs"
    fi
else
    print_warning "Diretório de logs não existe: $LOG_DIR"
    print_info "Inicie o backend para criar o diretório"
fi

# 7. Verificar recursos do sistema
print_header "7. Verificando Recursos do Sistema"

# CPU e Memória dos containers
echo -e "${BLUE}Uso de recursos:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
    myia-loki myia-grafana myia-promtail 2>/dev/null || print_warning "Não foi possível obter estatísticas"

# Espaço em disco
DISK_USAGE=$(du -sh data/ 2>/dev/null | cut -f1 || echo "N/A")
print_info "Espaço usado em data/: $DISK_USAGE"

# Resumo final
print_header "Resumo da Validação"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✓ TODOS OS SERVIÇOS ESTÃO FUNCIONANDO!                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "\n${GREEN}Próximos passos:${NC}"
    echo "  1. Acesse Grafana: http://localhost:3002 (admin/admin)"
    echo "  2. Explore os dashboards na pasta 'MyIA'"
    echo "  3. Use o Explore para queries LogQL customizadas"
    echo ""
    
    exit 0
else
    echo -e "${RED}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✗ ALGUNS PROBLEMAS FORAM ENCONTRADOS                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "\n${RED}Erros encontrados: $ERRORS${NC}"
    echo -e "\n${YELLOW}Ações sugeridas:${NC}"
    echo "  1. Execute: ./logs.sh (para ver logs dos containers)"
    echo "  2. Execute: ./stop.sh && ./start.sh (para reiniciar)"
    echo "  3. Verifique a documentação: README.md"
    echo ""
    
    exit 1
fi
