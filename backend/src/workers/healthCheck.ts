// backend/src/workers/healthCheck.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import express from 'express';
import { certificationWorker } from './certificationWorker';
import { logger } from '../utils/logger';

const app = express();
const PORT = process.env.WORKER_HEALTH_PORT || 3004;

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  try {
    const status = certificationWorker.getStatus();
    
    if (status.isRunning) {
      res.status(200).json({
        status: 'healthy',
        worker: status,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        worker: status,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    logger.error('❌ Health check error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Metrics endpoint
 */
app.get('/metrics', async (req, res) => {
  try {
    const workerStatus = certificationWorker.getStatus();
    const queueStats = await certificationWorker.getQueueStats();
    
    res.status(200).json({
      worker: workerStatus,
      queue: queueStats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('❌ Metrics error', { error: error.message });
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Readiness probe endpoint
 */
app.get('/ready', async (req, res) => {
  try {
    const status = certificationWorker.getStatus();
    
    if (status.isRunning) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    logger.error('❌ Readiness check error', { error: error.message });
    res.status(500).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe endpoint
 */
app.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Inicia servidor de health check
 */
export function startHealthCheckServer() {
  app.listen(PORT, () => {
    logger.info(`🏥 Worker health check server running on port ${PORT}`, {
      port: PORT,
      endpoints: {
        health: `http://localhost:${PORT}/health`,
        metrics: `http://localhost:${PORT}/metrics`,
        ready: `http://localhost:${PORT}/ready`,
        live: `http://localhost:${PORT}/live`
      }
    });
  });
}
