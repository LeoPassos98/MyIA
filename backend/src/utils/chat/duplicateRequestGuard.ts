// backend/src/utils/chat/duplicateRequestGuard.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import crypto from 'crypto';

/**
 * Controle de Concorrência - Evita spam de requisições duplicadas
 * Mantém um Set de IDs de requisições em processamento
 */
class DuplicateRequestGuard {
  private processingRequests = new Set<string>();

  /**
   * Gera ID único para a requisição baseado em userId, chatId e hash da mensagem
   */
  generateId(userId: string, chatId: string | undefined, messageContent: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(messageContent)
      .digest('hex')
      .substring(0, 8);
    
    return `${userId}-${chatId || 'new'}-${hash}`;
  }

  /**
   * Verifica se a requisição já está sendo processada
   */
  isProcessing(requestId: string): boolean {
    return this.processingRequests.has(requestId);
  }

  /**
   * Marca requisição como em processamento
   * Retorna função de cleanup para remover após conclusão
   */
  markAsProcessing(requestId: string): () => void {
    this.processingRequests.add(requestId);
    
    // Timeout de segurança (60s)
    const timeoutId = setTimeout(() => {
      this.processingRequests.delete(requestId);
    }, 60000);

    // Retorna função de cleanup
    return () => {
      clearTimeout(timeoutId);
      this.processingRequests.delete(requestId);
    };
  }

  /**
   * Remove requisição do controle (cleanup manual)
   */
  release(requestId: string): void {
    this.processingRequests.delete(requestId);
  }
}

export const duplicateRequestGuard = new DuplicateRequestGuard();
