// backend/src/services/chat/orchestrator/validators/MessageValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Resultado da validação de mensagem
 */
export interface ValidatedMessage {
  content: string;
  isManualMode: boolean;
}

/**
 * Body da requisição de processamento
 */
export interface ProcessMessageBody {
  message?: string;
  prompt?: string;
  context?: string;
  selectedMessageIds?: string[];
  [key: string]: any;
}

/**
 * Validador de mensagens de entrada
 * 
 * Responsabilidades:
 * - Validar presença de message/prompt
 * - Normalizar conteúdo (prompt tem prioridade sobre message)
 * - Detectar modo manual (context ou selectedMessageIds)
 * - Validar tipo e formato do conteúdo
 */
export class MessageValidator {
  /**
   * Valida e normaliza mensagem de entrada
   * 
   * @param body - Body da requisição
   * @returns Mensagem validada e normalizada
   * @throws Error se mensagem inválida ou ausente
   */
  validate(body: ProcessMessageBody): ValidatedMessage {
    // 1. Extrai conteúdo (prompt tem prioridade)
    const content = body.prompt || body.message;

    // 2. Valida presença
    if (!content) {
      throw new Error('Message or prompt is required');
    }

    // 3. Valida tipo
    if (typeof content !== 'string') {
      throw new Error('Message must be a string');
    }

    // 4. Valida conteúdo não vazio
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Message cannot be empty');
    }

    // 5. Detecta modo manual
    const isManualMode = this.detectManualMode(body);

    return {
      content: trimmedContent,
      isManualMode
    };
  }

  /**
   * Detecta se está em modo manual
   * 
   * Modo manual é ativado quando:
   * - context está definido (usuário forneceu contexto customizado)
   * - selectedMessageIds tem itens (usuário selecionou mensagens específicas)
   * 
   * @param body - Body da requisição
   * @returns true se modo manual, false caso contrário
   */
  private detectManualMode(body: ProcessMessageBody): boolean {
    // Context definido indica modo manual
    if (body.context !== undefined) {
      return true;
    }

    // Mensagens selecionadas indicam modo manual
    if (body.selectedMessageIds && body.selectedMessageIds.length > 0) {
      return true;
    }

    return false;
  }
}
