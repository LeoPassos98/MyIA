#!/bin/bash
# Script de teste para verificar detecção do Grafana

GRAFANA_PORT=3002

echo "=== Teste de Detecção do Grafana ==="
echo ""

# Teste 1: Health check HTTP
echo "1. Health check HTTP (curl):"
if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
  echo "   ✅ SUCESSO - Grafana está respondendo"
  curl -s http://localhost:$GRAFANA_PORT/api/health | head -3
else
  echo "   ❌ FALHOU - Grafana não está respondendo"
fi

echo ""

# Teste 2: Porta com lsof
echo "2. Verificação de porta (lsof):"
if lsof -ti:$GRAFANA_PORT >/dev/null 2>&1; then
  echo "   ✅ SUCESSO - Porta detectada com lsof"
else
  echo "   ❌ FALHOU - Porta não detectada com lsof (esperado em Docker)"
fi

echo ""

# Teste 3: Container Docker
echo "3. Container Docker:"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^myia-grafana$"; then
  echo "   ✅ SUCESSO - Container myia-grafana encontrado"
  docker ps --format 'table {{.Names}}\t{{.Status}}' | grep grafana
else
  echo "   ❌ FALHOU - Container não encontrado"
fi

echo ""

# Teste 4: Porta com ss
echo "4. Verificação de porta (ss):"
if ss -tlnp 2>/dev/null | grep -q ":$GRAFANA_PORT"; then
  echo "   ✅ SUCESSO - Porta detectada com ss"
else
  echo "   ❌ FALHOU - Porta não detectada com ss"
fi

echo ""
echo "=== Resultado ==="
if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
  echo "✅ Grafana está FUNCIONANDO e acessível em http://localhost:$GRAFANA_PORT"
else
  echo "❌ Grafana NÃO está acessível"
fi
