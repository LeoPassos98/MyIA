/**
 * Script de Limpeza Automática de Logs
 * 
 * Executa a função cleanup_old_logs() do PostgreSQL para deletar
 * logs com mais de 30 dias.
 * 
 * Uso:
 *   npx ts-node scripts/cleanup-logs.ts
 * 
 * Cron Job (executar diariamente às 2h da manhã):
 *   0 2 * * * cd /path/to/backend && npx ts-node scripts/cleanup-logs.ts >> logs/cleanup.log 2>&1
 * 
 * @see docs/LOG-RETENTION.md
 */

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

interface CleanupResult {
  cleanup_old_logs: number;
}

async function cleanupOldLogs(): Promise<void> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting log cleanup process', {
      timestamp: new Date().toISOString(),
      retentionDays: 30,
    });

    // Executar função PostgreSQL
    const result = await prisma.$queryRaw<CleanupResult[]>`SELECT cleanup_old_logs()`;
    
    const deletedCount = result[0]?.cleanup_old_logs ?? 0;
    const duration = Date.now() - startTime;

    // Log de auditoria
    logger.info('Log cleanup completed successfully', {
      deletedCount,
      retentionDays: 30,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    // Output para console (útil para cron logs)
    console.log('✅ Log Cleanup Summary:');
    console.log(`   - Deleted logs: ${deletedCount}`);
    console.log(`   - Retention period: 30 days`);
    console.log(`   - Duration: ${duration}ms`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);

    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log de erro
    logger.error('Log cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    // Output para console
    console.error('❌ Log Cleanup Failed:');
    console.error(`   - Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   - Duration: ${duration}ms`);
    console.error(`   - Timestamp: ${new Date().toISOString()}`);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar cleanup
cleanupOldLogs();
