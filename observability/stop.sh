#!/bin/bash

# MyIA Observability Stack - Stop Script
# Para Grafana, Loki e Promtail

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🛑 Parando MyIA Observability Stack..."
echo ""

# Verificar se está rodando
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Stack não está rodando."
    exit 0
fi

# Parar serviços
echo "🐳 Parando containers..."
docker-compose down

echo ""
echo "✅ Stack parado com sucesso!"
echo ""
echo "💡 Para remover volumes (CUIDADO: apaga dados):"
echo "   docker-compose down -v"
echo ""
echo "💡 Para iniciar novamente:"
echo "   ./start.sh"
echo ""
