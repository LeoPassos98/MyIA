#!/bin/bash

# MyIA Observability Stack - Start Script
# Inicia Grafana, Loki e Promtail

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Iniciando MyIA Observability Stack..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Criar diretórios de dados se não existirem
echo "📁 Criando diretórios de dados..."
mkdir -p data/loki data/grafana

# Ajustar permissões
echo "🔐 Ajustando permissões..."
chmod -R 777 data/ 2>/dev/null || true

# Verificar se já está rodando
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Stack já está rodando. Use ./stop.sh para parar primeiro."
    echo ""
    docker-compose ps
    exit 0
fi

# Iniciar serviços
echo ""
echo "🐳 Iniciando containers..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 5

# Verificar status dos serviços
echo ""
echo "📊 Status dos serviços:"
docker-compose ps

# Verificar health dos serviços
echo ""
echo "🏥 Verificando saúde dos serviços..."

# Verificar Loki
echo -n "  Loki: "
if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "⚠️  Aguardando..."
fi

# Verificar Grafana
echo -n "  Grafana: "
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "⚠️  Aguardando..."
fi

# Verificar Promtail
echo -n "  Promtail: "
if docker-compose ps promtail | grep -q "Up"; then
    echo "✅ OK"
else
    echo "⚠️  Aguardando..."
fi

echo ""
echo "✅ Stack iniciado com sucesso!"
echo ""
echo "📍 URLs de acesso:"
echo "  • Grafana:  http://localhost:3002 (admin/admin)"
echo "  • Loki API: http://localhost:3100"
echo ""
echo "📝 Comandos úteis:"
echo "  • Ver logs:   ./logs.sh [serviço]"
echo "  • Parar:      ./stop.sh"
echo "  • Reiniciar:  ./stop.sh && ./start.sh"
echo ""
echo "💡 Dica: Acesse o Grafana e explore os logs em Explore > Loki"
echo ""
