// backend/src/workers/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { certificationWorker } from './certificationWorker';
import { startHealthCheckServer } from './healthCheck';
import { logger } from '../utils/logger';

async function startWorker() {
  try {
    logger.info('🚀 Starting Certification Worker...', {
      nodeEnv: process.env.NODE_ENV,
      pid: process.pid
    });
    
    // Iniciar worker
    certificationWorker.start();
    
    // Iniciar health check server
    startHealthCheckServer();
    
    logger.info('✅ Worker is running and waiting for jobs', {
      status: certificationWorker.getStatus()
    });
    logger.info('Press Ctrl+C to stop');
    
  } catch (error: any) {
    logger.error('❌ Failed to start worker', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Iniciar worker
startWorker();
