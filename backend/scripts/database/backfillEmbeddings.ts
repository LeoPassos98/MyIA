// backend/scripts/backfillEmbeddings.ts
// Script para gerar embeddings para mensagens existentes que não têm vetor

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { aiService } from '../src/services/ai';
import { get_encoding } from 'tiktoken';

const BATCH_SIZE = 10;
const DELAY_MS = 500; // Delay entre batches para não sobrecarregar a API
const MAX_TOKENS = 8000; // Limite do modelo de embedding (8192, com margem)

const encoding = get_encoding('cl100k_base');

/**
 * Trunca texto para caber no limite de tokens do modelo de embedding
 */
function truncateToTokenLimit(text: string, maxTokens: number): string {
  const tokens = encoding.encode(text);
  if (tokens.length <= maxTokens) return text;
  
  // Trunca os tokens e decodifica de volta
  const truncatedTokens = tokens.slice(0, maxTokens);
  return new TextDecoder().decode(encoding.decode(truncatedTokens));
}

async function backfillEmbeddings() {
  console.log('🔄 Iniciando backfill de embeddings...\n');

  // Conta mensagens sem vetor
  const totalWithout: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM messages WHERE vector IS NULL
  `;
  const total = Number(totalWithout[0].count);
  
  console.log(`📊 Mensagens sem embedding: ${total}`);
  
  if (total === 0) {
    console.log('✅ Todas as mensagens já têm embeddings!');
    await prisma.$disconnect();
    return;
  }

  let processed = 0;
  let errors = 0;

  while (processed < total) {
    // Filtra as que não têm vetor
    const withoutVector: any[] = await prisma.$queryRaw`
      SELECT id, content FROM messages 
      WHERE vector IS NULL 
      ORDER BY "createdAt" ASC 
      LIMIT ${BATCH_SIZE}
    `;

    if (withoutVector.length === 0) break;

    for (const msg of withoutVector) {
      try {
        // Trunca se necessário para caber no limite do modelo
        const contentToEmbed = truncateToTokenLimit(msg.content, MAX_TOKENS);
        const wasTruncated = contentToEmbed.length < msg.content.length;
        
        const emb = await aiService.embed(contentToEmbed);
        if (emb) {
          const vectorStr = '[' + emb.vector.join(',') + ']';
          await prisma.$executeRaw`UPDATE messages SET vector = ${vectorStr}::vector WHERE id = ${msg.id}`;
          processed++;
          const truncNote = wasTruncated ? ' (truncado)' : '';
          process.stdout.write(`\r⏳ Processando: ${processed}/${total} (${Math.round(processed/total*100)}%)${truncNote}    `);
        } else {
          errors++;
          console.log(`\n⚠️ Embedding nulo para: ${msg.id}`);
        }
      } catch (e: any) {
        errors++;
        console.log(`\n❌ Erro em ${msg.id}: ${e.message}`);
      }
    }

    // Delay entre batches
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n\n✅ Backfill completo!`);
  console.log(`   Processados: ${processed}`);
  console.log(`   Erros: ${errors}`);
  
  await prisma.$disconnect();
}

backfillEmbeddings().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
