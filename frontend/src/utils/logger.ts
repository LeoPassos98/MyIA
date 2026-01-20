/**
 * frontend/src/utils/logger.ts
 * Conditional logger for development/production
 * Standards: docs/STANDARDS.md
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log informativo (apenas em desenvolvimento)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  /**
   * Log de erro (sempre ativo)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  /**
   * Log de warning (apenas em desenvolvimento)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  /**
   * Log de info (apenas em desenvolvimento)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  }
};
