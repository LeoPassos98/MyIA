// frontend/src/utils/logger.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Logger condicional para desenvolvimento
 * 
 * Em produção, apenas warn e error são exibidos.
 * Em desenvolvimento, todos os níveis são exibidos.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - apenas em desenvolvimento
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log logs - apenas em desenvolvimento (alias para info)
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Info logs - apenas em desenvolvimento
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Warning logs - sempre exibidos
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Error logs - sempre exibidos
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
