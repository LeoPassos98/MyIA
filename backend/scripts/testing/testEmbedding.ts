// backend/scripts/testEmbedding.ts
// Script para testar salvamento de embeddings

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { aiService } from '../src/services/ai';

async function testSaveVector() {
  // Pega a última mensagem
  const lastMsg = await prisma.message.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  if (!lastMsg) {
    console.log('Nenhuma mensagem encontrada');
    return;
  }
  
  console.log('Mensagem:', lastMsg.id, '-', lastMsg.content.substring(0, 50));
  
  // Gera embedding
  const emb = await aiService.embed(lastMsg.content);
  if (!emb) {
    console.log('❌ Embedding falhou');
    return;
  }
  
  console.log('Embedding gerado com', emb.vector.length, 'dimensões');
  console.log('Salvando vetor...');
  
  // Tenta salvar
  try {
    const vectorStr = '[' + emb.vector.join(',') + ']';
    await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${lastMsg.id}`;
    console.log('✅ Vetor salvo!');
    
    // Verifica se salvou
    const check: any[] = await prisma.$queryRaw`SELECT id, vector IS NOT NULL as has_vector FROM messages WHERE id = ${lastMsg.id}`;
    console.log('Verificação:', check[0]);
  } catch (e: any) {
    console.log('❌ Erro ao salvar:', e.message);
  }
  
  await prisma.$disconnect();
}

testSaveVector();
