#!/bin/bash
# scripts/backup/backup-models.sh
# Standards: docs/STANDARDS.md
#
# Script de Backup das Tabelas de Modelos de IA
# Autor: MyIA Team
# Data: 2026-02-09
# Descrição: Faz backup das tabelas relacionadas a modelos de IA antes da migration "clean slate"
#
# Tabelas incluídas:
#   - ai_models (obrigatório)
#   - ai_providers (obrigatório)
#   - model_certifications (obrigatório)
#   - users (opcional, para referência)
#   - user_settings (opcional, para referência)

# ==============================================================================
# CONFIGURAÇÃO DE CORES
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ==============================================================================
DB_HOST="${PGHOST:-localhost}"
DB_USER="${PGUSER:-leonardo}"
DB_NAME="${PGDATABASE:-myia}"
DB_PORT="${PGPORT:-5432}"

# ==============================================================================
# CONFIGURAÇÃO DE BACKUP
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_models_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Tabelas obrigatórias
REQUIRED_TABLES=(
    "ai_models"
    "ai_providers"
    "model_certifications"
)

# Tabelas opcionais (para referência)
OPTIONAL_TABLES=(
    "users"
    "user_settings"
)

# ==============================================================================
# FUNÇÕES AUXILIARES
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}       ${GREEN}BACKUP DE TABELAS DE MODELOS DE IA${NC}                         ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}       ${YELLOW}Clean Slate Migration - Fase 1${NC}                             ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
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

# ==============================================================================
# VERIFICAÇÕES PRÉ-BACKUP
# ==============================================================================

check_postgres_connection() {
    print_info "Verificando conexão com PostgreSQL..."
    
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump não encontrado. Instale o PostgreSQL client."
        exit 1
    fi
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        print_error "PostgreSQL não está acessível em ${DB_HOST}:${DB_PORT}"
        print_info "Verifique se o serviço está rodando: sudo systemctl status postgresql"
        exit 1
    fi
    
    print_success "PostgreSQL está acessível em ${DB_HOST}:${DB_PORT}"
}

check_database_exists() {
    print_info "Verificando se o banco de dados '${DB_NAME}' existe..."
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_error "Banco de dados '${DB_NAME}' não encontrado"
        exit 1
    fi
    
    print_success "Banco de dados '${DB_NAME}' encontrado"
}

check_tables_exist() {
    print_info "Verificando tabelas obrigatórias..."
    
    local missing_tables=()
    
    for table in "${REQUIRED_TABLES[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');" 2>/dev/null | grep -q 't'; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -gt 0 ]; then
        print_error "Tabelas obrigatórias não encontradas: ${missing_tables[*]}"
        exit 1
    fi
    
    print_success "Todas as tabelas obrigatórias existem"
}

create_backup_dir() {
    print_info "Verificando diretório de backup..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_success "Diretório de backup criado: ${BACKUP_DIR}"
    else
        print_success "Diretório de backup existe: ${BACKUP_DIR}"
    fi
}

# ==============================================================================
# FUNÇÃO PRINCIPAL DE BACKUP
# ==============================================================================

perform_backup() {
    print_info "Iniciando backup..."
    echo ""
    
    # Construir lista de tabelas para backup
    local tables_args=""
    
    # Adicionar tabelas obrigatórias
    for table in "${REQUIRED_TABLES[@]}"; do
        tables_args+="--table=${table} "
        print_info "  → Incluindo tabela obrigatória: ${table}"
    done
    
    # Verificar e adicionar tabelas opcionais
    for table in "${OPTIONAL_TABLES[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');" 2>/dev/null | grep -q 't'; then
            tables_args+="--table=${table} "
            print_info "  → Incluindo tabela opcional: ${table}"
        else
            print_warning "  → Tabela opcional não encontrada (ignorando): ${table}"
        fi
    done
    
    echo ""
    print_info "Executando pg_dump..."
    
    # Executar pg_dump
    if pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        $tables_args \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        -f "$BACKUP_PATH" 2>/dev/null; then
        
        print_success "Backup criado com sucesso!"
    else
        print_error "Falha ao criar backup"
        exit 1
    fi
}

# ==============================================================================
# VERIFICAÇÕES PÓS-BACKUP
# ==============================================================================

verify_backup() {
    print_info "Verificando backup gerado..."
    
    if [ ! -f "$BACKUP_PATH" ]; then
        print_error "Arquivo de backup não encontrado: ${BACKUP_PATH}"
        exit 1
    fi
    
    local file_size=$(stat -c%s "$BACKUP_PATH" 2>/dev/null || stat -f%z "$BACKUP_PATH" 2>/dev/null)
    local file_size_human=$(du -h "$BACKUP_PATH" | cut -f1)
    
    if [ "$file_size" -eq 0 ]; then
        print_error "Arquivo de backup está vazio!"
        exit 1
    fi
    
    print_success "Arquivo de backup válido"
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                    ${GREEN}BACKUP CONCLUÍDO${NC}                              ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}Arquivo:${NC}  ${BACKUP_FILE}"
    echo -e "  ${BLUE}Caminho:${NC}  ${BACKUP_PATH}"
    echo -e "  ${BLUE}Tamanho:${NC}  ${file_size_human} (${file_size} bytes)"
    echo ""
    
    # Mostrar contagem de registros
    print_info "Contagem de registros nas tabelas:"
    for table in "${REQUIRED_TABLES[@]}"; do
        local count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
            "SELECT COUNT(*) FROM ${table};" 2>/dev/null)
        echo -e "  ${BLUE}→${NC} ${table}: ${count} registros"
    done
    echo ""
}

# ==============================================================================
# FUNÇÃO DE AJUDA
# ==============================================================================

show_help() {
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -h, --help     Mostra esta mensagem de ajuda"
    echo "  -v, --verbose  Modo verboso (mostra mais detalhes)"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  PGHOST      Host do PostgreSQL (default: localhost)"
    echo "  PGPORT      Porta do PostgreSQL (default: 5432)"
    echo "  PGUSER      Usuário do PostgreSQL (default: leonardo)"
    echo "  PGDATABASE  Nome do banco de dados (default: myia)"
    echo ""
    echo "Exemplo:"
    echo "  $0"
    echo "  PGHOST=db.example.com PGUSER=admin $0"
    echo ""
}

# ==============================================================================
# MAIN
# ==============================================================================

main() {
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            *)
                print_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # Verificações pré-backup
    check_postgres_connection
    check_database_exists
    check_tables_exist
    create_backup_dir
    
    echo ""
    
    # Executar backup
    perform_backup
    
    echo ""
    
    # Verificações pós-backup
    verify_backup
    
    exit 0
}

# Executar main
main "$@"
