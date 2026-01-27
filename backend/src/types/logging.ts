// backend/src/types/logging.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Níveis de severidade para logs estruturados.
 * 
 * @remarks
 * Usado para categorizar a importância e tipo de evento sendo registrado.
 * 
 * @example
 * ```typescript
 * const level: LogLevel = 'info';
 * logger.info('Operação concluída', { level });
 * ```
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Interface padronizada para entradas de log estruturado.
 * 
 * @remarks
 * Define a estrutura obrigatória para todos os logs do sistema.
 * Garante rastreabilidade, contexto e correlação entre eventos.
 * 
 * @see {@link https://github.com/winstonjs/winston | Winston Logger}
 * @see {@link docs/STANDARDS.md#13-sistema-de-logging-estruturado | STANDARDS.md Seção 13}
 * 
 * @example
 * ```typescript
 * const logEntry: LogEntry = {
 *   timestamp: new Date().toISOString(),
 *   level: 'info',
 *   message: 'Inferência concluída com sucesso',
 *   requestId: '550e8400-e29b-41d4-a716-446655440000',
 *   userId: 'user-123',
 *   inferenceId: 'inf-456',
 *   metadata: {
 *     provider: 'bedrock',
 *     model: 'anthropic.claude-3-sonnet',
 *     tokens: 500,
 *     cost: 0.01
 *   }
 * };
 * ```
 */
export interface LogEntry {
  /**
   * Timestamp do evento em formato ISO 8601 (UTC).
   * 
   * @remarks
   * - Formato: `YYYY-MM-DDTHH:mm:ss.sssZ`
   * - Sempre em UTC para consistência entre servidores
   * - Gerado automaticamente pelo Winston
   * 
   * @example
   * ```typescript
   * timestamp: '2026-01-26T18:00:00.000Z'
   * ```
   */
  timestamp: string;

  /**
   * Nível de severidade do log.
   * 
   * @remarks
   * - `info`: Operações normais (login, inferência concluída, requisição processada)
   * - `warn`: Situações anormais não críticas (rate limit, cache miss, retry)
   * - `error`: Erros que impedem operação (falha de autenticação, timeout)
   * - `debug`: Informações detalhadas para desenvolvimento (payload, estado interno)
   * 
   * @example
   * ```typescript
   * level: 'info'  // Operação normal
   * level: 'error' // Falha crítica
   * ```
   */
  level: LogLevel;

  /**
   * Mensagem descritiva do evento.
   * 
   * @remarks
   * - Deve ser clara e concisa (máximo 200 caracteres recomendado)
   * - Usar verbos no passado para eventos concluídos
   * - Evitar dados sensíveis (senhas, tokens, PII)
   * 
   * @example
   * ```typescript
   * message: 'User login successful'
   * message: 'Inference failed: timeout'
   * message: 'Rate limit exceeded'
   * ```
   */
  message: string;

  /**
   * UUID único da requisição HTTP.
   * 
   * @remarks
   * - Gerado pelo middleware `requestIdMiddleware`
   * - Permite correlacionar todos os logs de uma mesma requisição
   * - Incluído no header `X-Request-ID` da resposta
   * - **OBRIGATÓRIO** em todos os logs de rotas HTTP
   * 
   * @example
   * ```typescript
   * requestId: '550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  requestId?: string;

  /**
   * ID do usuário autenticado.
   * 
   * @remarks
   * - Extraído de `req.user.id` após autenticação
   * - Permite rastrear ações por usuário
   * - **NÃO** incluir email ou nome (apenas ID)
   * - Opcional para rotas públicas (login, registro)
   * 
   * @example
   * ```typescript
   * userId: 'user-123'
   * userId: undefined // Rota pública
   * ```
   */
  userId?: string;

  /**
   * ID da inferência de IA.
   * 
   * @remarks
   * - Usado para rastrear operações de IA (chat, completion)
   * - Permite correlacionar logs de uma mesma inferência
   * - Gerado pelo backend ao criar a inferência
   * - Opcional (apenas para operações de IA)
   * 
   * @example
   * ```typescript
   * inferenceId: 'inf-456'
   * inferenceId: undefined // Operação não relacionada a IA
   * ```
   */
  inferenceId?: string;

  /**
   * Dados adicionais contextuais.
   * 
   * @remarks
   * - Estrutura flexível para informações específicas do evento
   * - **NÃO** incluir dados sensíveis (senhas, tokens, PII)
   * - Evitar objetos muito grandes (impacto em performance)
   * - Preferir resumos ou tamanhos ao invés de arrays completos
   * 
   * @example
   * ```typescript
   * metadata: {
   *   provider: 'bedrock',
   *   model: 'anthropic.claude-3-sonnet',
   *   tokens: 500,
   *   cost: 0.01,
   *   duration: 1234,
   *   statusCode: 200
   * }
   * ```
   */
  metadata?: Record<string, any>;

  /**
   * Informações de erro (apenas para level: 'error').
   * 
   * @remarks
   * - Incluir `name`, `message` e `stack` (apenas em desenvolvimento)
   * - Stack traces **NUNCA** devem ser expostos em produção
   * - Sanitizar mensagens de erro antes de logar
   * 
   * @example
   * ```typescript
   * error: {
   *   name: 'ValidationError',
   *   message: 'Invalid email format',
   *   stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
   * }
   * ```
   */
  error?: Error;
}
