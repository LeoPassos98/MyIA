#!/bin/bash
# Script wrapper para executar manage-certifications.sh de forma não-interativa
# Certifica todos os modelos automaticamente

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   Certificação Automática de Modelos - MyIA   ║${NC}"
echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se backend está rodando
echo -e "${CYAN}[1/4]${NC} Verificando se backend está rodando..."
if ! lsof -ti:3001 >/dev/null 2>&1 && ! pgrep -f "node.*backend/src/server" >/dev/null 2>&1; then
  echo -e "${RED}✗${NC} Backend não está rodando"
  echo -e "${YELLOW}⚠${NC}  Inicie o backend com: ${CYAN}./start.sh start backend${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Backend está rodando"
echo ""

# Verificar modelos no banco
echo -e "${CYAN}[2/4]${NC} Verificando modelos ativos no banco de dados..."
MODELS_COUNT=$(psql -U leonardo -h localhost -d myia -t -c "SELECT COUNT(*) FROM ai_models WHERE \"isActive\" = true;" | xargs)
echo -e "${GREEN}✓${NC} Total de modelos ativos: ${BOLD}$MODELS_COUNT${NC}"
echo ""

# Listar modelos
echo -e "${BLUE}Modelos que serão certificados:${NC}"
psql -U leonardo -h localhost -d myia -c "SELECT m.name, p.name as provider FROM ai_models m JOIN ai_providers p ON m.\"providerId\" = p.id WHERE m.\"isActive\" = true ORDER BY p.name, m.name;"
echo ""

# Confirmar
echo -e "${YELLOW}⚠${NC}  Isso irá criar um job para certificar ${BOLD}TODOS${NC} os $MODELS_COUNT modelos ativos!"
echo -e "${YELLOW}⚠${NC}  Região: ${BOLD}us-east-1${NC}"
echo ""
read -p "Deseja continuar? (s/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo -e "${YELLOW}✗${NC} Operação cancelada pelo usuário"
  exit 0
fi

echo ""
echo -e "${CYAN}[3/4]${NC} Criando job de certificação via API direta..."

# Usar o script TypeScript direto do backend
cd backend

# Criar script temporário para certificação
cat > ./scripts/certify-all-temp.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { CertificationQueueService } from '../src/services/queue/CertificationQueueService';

const prisma = new PrismaClient();

async function certifyAll() {
  try {
    const queueService = new CertificationQueueService();
    
    // Buscar todos os modelos ativos
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    console.log(`\n📊 Encontrados ${models.length} modelos ativos\n`);
    
    // Criar job para todos os modelos
    const regions = ['us-east-1'];
    const result = await queueService.certifyAllModels(regions);
    
    console.log('\n✅ Job criado com sucesso!');
    console.log(`📋 Job ID: ${result.jobId}`);
    console.log(`🔢 Total de certificações: ${result.totalJobs}`);
    console.log(`🌍 Regiões: ${regions.join(', ')}\n`);
    
    // Salvar Job ID
    const fs = require('fs');
    fs.writeFileSync('../.last-certification-job-id', result.jobId);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

certifyAll();
EOF

# Executar script
npx tsx ./scripts/certify-all-temp.ts

# Voltar ao diretório raiz
cd ..

echo ""
echo -e "${CYAN}[4/4]${NC} Verificando status do job..."
sleep 2

if [ -f .last-certification-job-id ]; then
  JOB_ID=$(cat .last-certification-job-id)
  echo -e "${GREEN}✓${NC} Job ID salvo: ${BOLD}$JOB_ID${NC}"
  echo ""
  
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}✓ CERTIFICAÇÃO INICIADA COM SUCESSO!${NC}"
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${BLUE}Próximos passos:${NC}"
  echo -e "  1. Monitorar progresso: ${CYAN}./manage-certifications.sh${NC} (opção 4)"
  echo -e "  2. Ver logs: ${CYAN}./manage-certifications.sh${NC} (opção 9)"
  echo -e "  3. Ver estatísticas: ${CYAN}./manage-certifications.sh${NC} (opção 7)"
  echo -e "  4. Bull Board: ${CYAN}http://localhost:3001/admin/queues${NC}"
  echo ""
  echo -e "${YELLOW}Job ID para referência:${NC} ${BOLD}$JOB_ID${NC}"
  echo ""
fi

# Limpar arquivo temporário
rm -f backend/scripts/certify-all-temp.ts
