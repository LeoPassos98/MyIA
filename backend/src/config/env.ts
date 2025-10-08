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
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// Validar variáveis críticas
if (!config.jwtSecret) {
  logger.warn('JWT_SECRET not set, using default (insecure for production)');
}

if (!config.databaseUrl) {
  logger.error('DATABASE_URL not set');
  process.exit(1);
}

logger.info('Environment variables loaded successfully');