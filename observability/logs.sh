#!/bin/bash

# MyIA Observability Stack - Logs Script
# Visualiza logs dos serviços

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Função de ajuda
show_help() {
    echo "📝 MyIA Observability Stack - Visualizador de Logs"
    echo ""
    echo "Uso: ./logs.sh [serviço] [opções]"
    echo ""
    echo "Serviços disponíveis:"
    echo "  loki      - Logs do Loki"
    echo "  grafana   - Logs do Grafana"
    echo "  promtail  - Logs do Promtail"
    echo "  all       - Logs de todos os serviços (padrão)"
    echo ""
    echo "Opções:"
    echo "  -f, --follow    - Seguir logs em tempo real"
    echo "  -n, --lines N   - Mostrar últimas N linhas (padrão: 100)"
    echo "  -h, --help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./logs.sh                    # Ver logs de todos"
    echo "  ./logs.sh loki               # Ver logs do Loki"
    echo "  ./logs.sh loki -f            # Seguir logs do Loki"
    echo "  ./logs.sh grafana -n 50      # Últimas 50 linhas do Grafana"
    echo ""
}

# Verificar se está rodando
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Stack não está rodando. Use ./start.sh para iniciar."
    exit 1
fi

# Parâmetros padrão
SERVICE="all"
FOLLOW=""
LINES="100"

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        loki|grafana|promtail|all)
            SERVICE="$1"
            shift
            ;;
        *)
            echo "❌ Argumento desconhecido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# Executar comando de logs
echo "📝 Visualizando logs: $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SERVICE" = "all" ]; then
    docker-compose logs --tail="$LINES" $FOLLOW
else
    docker-compose logs --tail="$LINES" $FOLLOW "$SERVICE"
fi
