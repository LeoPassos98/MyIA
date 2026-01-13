// backend/src/config/env.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES || '15'),
  contextCleanupInterval: parseInt(process.env.CONTEXT_CLEANUP_INTERVAL || '3600000'),
  // Raw comma-separated value and parsed array of allowed CORS origins
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsOrigins: String(process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
};

// Validar variáveis críticas
if (!config.jwtSecret) {
  logger.error('❌ JWT_SECRET is required. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

if (config.jwtSecret.length < 32) {
  logger.error('❌ JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

if (!config.databaseUrl) {
  logger.error('DATABASE_URL not set');
  process.exit(1);
}

logger.info('Environment variables loaded successfully');