// backend/scripts/diagnose-cert-sync.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Script de diagnóstico para verificar sincronia entre Redis (Bull) e PostgreSQL
 * 
 * Uso:
 *   npx tsx scripts/diagnose-cert-sync.ts
 *   npx tsx scripts/diagnose-cert-sync.ts --model-id "anthropic.claude-sonnet-4-5-20250929-v1:0"
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

const QUEUE_PREFIX = process.env.BULL_QUEUE_PREFIX || 'myia';
const QUEUE_NAME = 'model-certification';

interface DiagnosticResult {
  modelId: string;
  region: string;
  dbStatus: string | null;
  redisStatus: string | null;
  syncOk: boolean;
  issues: string[];
  dbData?: any;
  redisData?: any;
}

async function diagnose(modelIdFilter?: string): Promise<void> {
  console.log('🔍 Iniciando diagnóstico de sincronia Redis ↔ PostgreSQL\n');

  try {
    // 1. Buscar certificações no banco
    const certifications = await prisma.modelCertification.findMany({
      where: modelIdFilter ? { modelId: modelIdFilter } : {},
      select: {
        id: true,
        modelId: true,
        region: true,
        status: true,
        passed: true,
        score: true,
        rating: true,
        badge: true,
        jobId: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log(`📊 Encontradas ${certifications.length} certificações no banco\n`);

    const results: DiagnosticResult[] = [];

    // 2. Para cada certificação, verificar estado no Redis
    for (const cert of certifications) {
      const issues: string[] = [];
      let redisStatus: string | null = null;
      let redisData: any = null;

      if (cert.jobId) {
        const redisKey = `${QUEUE_PREFIX}:${QUEUE_NAME}:${cert.jobId}`;
        
        try {
          const jobDataRaw = await redis.hgetall(redisKey);
          
          if (Object.keys(jobDataRaw).length > 0) {
            redisData = jobDataRaw;
            
            // Parse returnvalue se existir
            if (jobDataRaw.returnvalue) {
              try {
                const result = JSON.parse(jobDataRaw.returnvalue);
                redisStatus = result.passed ? 'CERTIFIED' : 'FAILED';
                
                // Verificar consistência
                if (cert.passed !== null && cert.passed !== result.passed) {
                  issues.push(`Inconsistência: DB.passed=${cert.passed} ≠ Redis.passed=${result.passed}`);
                }
                if (cert.score !== null && Math.abs(cert.score - result.score) > 0.1) {
                  issues.push(`Inconsistência: DB.score=${cert.score} ≠ Redis.score=${result.score}`);
                }
              } catch (e) {
                issues.push('Erro ao parsear returnvalue do Redis');
              }
            }
            
            // Verificar se job está completed/failed
            if (jobDataRaw.finishedOn) {
              redisStatus = redisStatus || 'COMPLETED';
            } else if (jobDataRaw.processedOn) {
              redisStatus = 'PROCESSING';
            }
          } else {
            issues.push('Job não encontrado no Redis');
          }
        } catch (error: any) {
          issues.push(`Erro ao acessar Redis: ${error.message}`);
        }
      } else {
        issues.push('JobId ausente no banco');
      }

      // Verificar sincronia
      const syncOk = !issues.length && (
        (cert.status === 'CERTIFIED' && redisStatus === 'CERTIFIED') ||
        (cert.status === 'FAILED' && redisStatus === 'FAILED') ||
        (cert.status === 'PROCESSING' && redisStatus === 'PROCESSING') ||
        (cert.status === 'PENDING' && !redisStatus)
      );

      if (!syncOk) {
        if (cert.status === 'QUEUED' && redisStatus === 'CERTIFIED') {
          issues.push('🚨 DESSINCRONIA CRÍTICA: Redis completado mas banco ainda QUEUED');
        } else if (cert.status !== redisStatus) {
          issues.push(`Status diferente: DB=${cert.status}, Redis=${redisStatus}`);
        }
      }

      results.push({
        modelId: cert.modelId,
        region: cert.region,
        dbStatus: cert.status,
        redisStatus,
        syncOk,
        issues,
        dbData: {
          passed: cert.passed,
          score: cert.score,
          rating: cert.rating,
          badge: cert.badge,
          completedAt: cert.completedAt,
        },
        redisData
      });
    }

    // 3. Exibir resultados
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const syncIssues = results.filter(r => !r.syncOk);
    
    if (syncIssues.length === 0) {
      console.log('✅ TODAS AS CERTIFICAÇÕES ESTÃO SINCRONIZADAS\n');
    } else {
      console.log(`🚨 ENCONTRADAS ${syncIssues.length} DESSINCRONIAS:\n`);
      
      syncIssues.forEach((result, index) => {
        console.log(`${index + 1}. ${result.modelId} @ ${result.region}`);
        console.log(`   DB Status: ${result.dbStatus}`);
        console.log(`   Redis Status: ${result.redisStatus || 'N/A'}`);
        console.log(`   Issues:`);
        result.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
        console.log('');
      });
    }

    // 4. Estatísticas gerais
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`Total de certificações: ${results.length}`);
    console.log(`Sincronizadas: ${results.filter(r => r.syncOk).length}`);
    console.log(`Com problemas: ${syncIssues.length}`);
    console.log('');
    
    const statusCount: Record<string, number> = {};
    results.forEach(r => {
      statusCount[r.dbStatus || 'NULL'] = (statusCount[r.dbStatus || 'NULL'] || 0) + 1;
    });
    
    console.log('Status no banco:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// CLI
const args = process.argv.slice(2);
const modelIdIndex = args.indexOf('--model-id');
const modelId = modelIdIndex >= 0 ? args[modelIdIndex + 1] : undefined;

diagnose(modelId).catch(console.error);
