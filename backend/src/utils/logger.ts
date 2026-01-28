// backend/src/utils/logger.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import winston from 'winston';
import path from 'path';
// @ts-expect-error - winston-sqlite3 não tem tipos TypeScript
import SQLite3Transport from 'winston-sqlite3';
import { PostgresTransport } from './transports/postgresTransport';

/**
 * Níveis de log suportados
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'http';

/**
 * Níveis customizados do Winston com suporte a HTTP
 * Fase 1 HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Adicionar cores customizadas ao Winston
winston.addColors(customLevels.colors);

/**
 * Configuração do Winston Logger com múltiplos transports
 *
 * Transports configurados:
 * 1. Console: Para desenvolvimento (colorizado, formato pretty)
 * 2. File: Para logs persistentes (combined.log e error.log)
 * 3. HTTP: Para logs de requisições HTTP (http.log)
 * 4. SQLite: Para armazenamento estruturado (logs.db)
 *
 * Referências:
 * - ADR-005: docs/architecture/ADR-005-LOGGING-SYSTEM.md
 * - STANDARDS §13: docs/STANDARDS.md#13-sistema-de-logging-estruturado
 * - Plano de Implementação: docs/LOGGING-IMPLEMENTATION-PLAN.md
 * - HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md (Fase 1)
 */

// Diretório de logs
// Quando executado com ts-node: __dirname = backend/src/utils
// Quando compilado: __dirname = backend/dist/utils
// Quando executado com ts-node: __dirname = backend/src/utils
// Quando compilado: __dirname = backend/dist/utils
// Queremos sempre: backend/logs
const LOG_DIR = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../../logs')      // dist/utils -> backend/logs
  : path.join(__dirname, '../../logs');     // src/utils -> backend/logs

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}`;
  })
);

// Formato para arquivos e SQLite (JSON estruturado)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Instância do Winston Logger
 *
 * Configurado com 3 transports:
 * - Console: Logs colorizados para desenvolvimento
 * - File (combined): Todos os logs em logs/combined.log
 * - File (error): Apenas erros em logs/error.log
 * - SQLite: Logs estruturados em logs/logs.db
 */
// Configurar transports baseado no ambiente
const transports: winston.transport[] = [
  // Transport 1: Console (desenvolvimento)
  new winston.transports.Console({
    format: consoleFormat,
    level: 'debug', // Mostra todos os níveis no console
  }),

  // Transport 2: File - Combined (todos os logs)
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: fileFormat,
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),

  // Transport 3: File - Error (apenas erros)
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    format: fileFormat,
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),

  // Transport 4: File - HTTP (requisições HTTP)
  // Fase 1 HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'http.log'),
    format: fileFormat,
    level: 'http',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Transport 5: PostgreSQL (produção ou teste explícito)
// Fase 2: Sistema de Logging Estruturado
// Referência: docs/LOGGING-IMPLEMENTATION-PLAN.md (Tarefa 2.2)
// ENABLE_POSTGRES_TRANSPORT=true para habilitar em desenvolvimento (testes)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_POSTGRES_TRANSPORT === 'true') {
  transports.push(
    new PostgresTransport({
      level: 'info',
      format: fileFormat,
    })
  );
}

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  levels: customLevels.levels,
  transports,
  
  // Tratamento de erros do logger
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format: fileFormat,
    }),
  ],
  
  // Não sair do processo em caso de exceção
  exitOnError: false,
});

// Adicionar listeners de erro para debug
winstonLogger.on('error', (error) => {
  console.error('❌ Erro no logger:', error);
});

winstonLogger.transports.forEach((transport, index) => {
  transport.on('error', (error) => {
    console.error(`❌ Erro no transport ${index}:`, error);
  });
});

/**
 * Interface pública do logger
 *
 * Exporta métodos para os 5 níveis de log:
 * - error: Erros
 * - warn: Avisos
 * - info: Informações gerais
 * - http: Requisições HTTP (Fase 1 HTTP Logging)
 * - debug: Informações de debug
 *
 * @example
 * ```typescript
 * import { logger } from './utils/logger';
 *
 * logger.info('Usuário autenticado', { userId: '123', requestId: 'abc' });
 * logger.http('HTTP Request', { method: 'GET', url: '/api/users', statusCode: 200 });
 * logger.error('Erro ao processar requisição', { error: err.message, requestId: 'abc' });
 * ```
 */
export const logger = {
  /**
   * Log de erro
   * @param message - Mensagem do log
   * @param meta - Metadados adicionais (requestId, userId, error, stack, etc.)
   */
  error: (message: string, meta?: any) => {
    winstonLogger.error(message, meta);
  },

  /**
   * Log de aviso
   * @param message - Mensagem do log
   * @param meta - Metadados adicionais (requestId, userId, etc.)
   */
  warn: (message: string, meta?: any) => {
    winstonLogger.warn(message, meta);
  },

  /**
   * Log de informação
   * @param message - Mensagem do log
   * @param meta - Metadados adicionais (requestId, userId, etc.)
   */
  info: (message: string, meta?: any) => {
    winstonLogger.info(message, meta);
  },

  /**
   * Log de requisição HTTP
   * Fase 1 HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md
   * @param message - Mensagem do log
   * @param meta - Metadados HTTP (method, url, statusCode, duration, requestId, userId, etc.)
   */
  http: (message: string, meta?: any) => {
    winstonLogger.log('http', message, meta);
  },

  /**
   * Log de debug
   * @param message - Mensagem do log
   * @param meta - Metadados adicionais (requestId, userId, etc.)
   */
  debug: (message: string, meta?: any) => {
    winstonLogger.debug(message, meta);
  },

  /**
   * Log genérico com nível customizado
   * @param level - Nível do log
   * @param message - Mensagem do log
   * @param meta - Metadados adicionais
   */
  log: (level: LogLevel, message: string, meta?: any) => {
    winstonLogger.log(level, message, meta);
  },
};

// Exportação default para compatibilidade
export default logger;
