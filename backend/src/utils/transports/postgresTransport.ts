// backend/src/utils/transports/postgresTransport.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import Transport from 'winston-transport';
import { PrismaClient } from '@prisma/client';

/**
 * Winston Custom Transport para PostgreSQL
 * 
 * Persiste logs estruturados na tabela `logs` usando Prisma.
 * 
 * Características:
 * - Operação assíncrona (não bloqueia requisições)
 * - Fallback automático (não crasha aplicação)
 * - Meta-logging de erros
 * - Suporte a JSONB para metadata e error
 * 
 * Referências:
 * - Plano: docs/LOGGING-IMPLEMENTATION-PLAN.md (Tarefa 2.2)
 * - Schema: backend/prisma/schema.prisma (model Log)
 * - STANDARDS §13: docs/STANDARDS.md#13-sistema-de-logging-estruturado
 * 
 * @example
 * ```typescript
 * import { PostgresTransport } from './transports/postgresTransport';
 * 
 * const logger = winston.createLogger({
 *   transports: [
 *     new PostgresTransport({ level: 'info' })
 *   ]
 * });
 * ```
 */
export class PostgresTransport extends Transport {
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    
    // Inicializar Prisma Client
    this.prisma = new PrismaClient({
      log: ['error'], // Apenas erros do Prisma (evitar recursão)
    });

    // Testar conexão inicial
    this.testConnection();
  }

  /**
   * Testa conexão com PostgreSQL
   * Se falhar, marca como desconectado (fallback automático)
   */
  private async testConnection(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ PostgresTransport: Falha ao conectar ao PostgreSQL', error);
    }
  }

  /**
   * Método principal do transport
   * Chamado pelo Winston para cada log
   * 
   * @param info - Objeto de log do Winston
   * @param callback - Callback para sinalizar conclusão
   */
  async log(info: any, callback: () => void): Promise<void> {
    // Emitir evento 'logged' imediatamente (não bloquear)
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Se não estiver conectado, skip (fallback para File transport)
    if (!this.isConnected) {
      callback();
      return;
    }

    try {
      // Extrair campos do log
      const {
        level,
        message,
        timestamp,
        requestId,
        userId,
        inferenceId,
        metadata,
        error,
        ...rest
      } = info;

      // Preparar dados para inserção
      const logData: any = {
        level: level || 'info',
        message: message || '',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      };

      // Campos opcionais
      if (requestId) logData.requestId = requestId;
      if (userId) logData.userId = userId;
      if (inferenceId) logData.inferenceId = inferenceId;

      // Metadata: combinar campos extras com metadata explícito
      const metadataObj = { ...rest, ...(metadata || {}) };
      if (Object.keys(metadataObj).length > 0) {
        logData.metadata = metadataObj;
      }

      // Error: serializar objeto de erro
      if (error) {
        logData.error = this.serializeError(error);
      }

      // Persistir no PostgreSQL
      await this.prisma.log.create({
        data: logData,
      });
    } catch (error) {
      // Fallback: log error mas NÃO crasha aplicação
      // Meta-log: registrar erro de logging
      console.error('❌ PostgresTransport: Erro ao persistir log', {
        error: error instanceof Error ? error.message : String(error),
        originalLog: info.message,
      });

      // Se erro de conexão, marcar como desconectado
      if (this.isConnectionError(error)) {
        this.isConnected = false;
      }
    }

    // Sempre chamar callback (Winston precisa disso)
    callback();
  }

  /**
   * Serializa objeto de erro para JSONB
   * Extrai stack trace e propriedades relevantes
   */
  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any), // Propriedades adicionais (ex: code, statusCode)
      };
    }

    // Se não for Error, retornar como está
    return error;
  }

  /**
   * Verifica se erro é de conexão com PostgreSQL
   * Usado para desabilitar transport temporariamente
   */
  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'P1001', // Prisma: Can't reach database server
      'P1002', // Prisma: Database server timeout
    ];

    const errorCode = error?.code || error?.meta?.code || '';
    return connectionErrors.some(code => errorCode.includes(code));
  }

  /**
   * Cleanup ao fechar transport
   * Desconecta Prisma Client
   */
  async close(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error('❌ PostgresTransport: Erro ao desconectar Prisma', error);
    }
  }
}

// Exportação default para compatibilidade
export default PostgresTransport;
