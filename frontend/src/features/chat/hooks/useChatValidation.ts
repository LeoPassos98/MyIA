// frontend/src/features/chat/hooks/useChatValidation.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook especializado para validações de envio de mensagens

import { useStableCallback } from '../../../hooks/memory';

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Contexto manual para validação
 */
export interface ManualContext {
  isActive: boolean;
  selectedMessageIds: string[];
  additionalText: string;
}

/**
 * Interface do hook de validação
 */
export interface ChatValidationHook {
  validateSendMessage: (input: string, isLoading: boolean, isSending: boolean) => ValidationResult;
  validateManualContext: (context: ManualContext) => ValidationResult;
}

/**
 * Hook para validações de chat
 * 
 * Responsabilidades:
 * - Validação de input vazio/whitespace
 * - Validação de modo manual (contexto obrigatório)
 * - Validação de estado de envio (loading, isSending)
 * 
 * @returns {ChatValidationHook} Funções de validação
 */
export function useChatValidation(): ChatValidationHook {
  /**
   * Valida contexto manual
   */
  const validateManualContext = useStableCallback((context: ManualContext): ValidationResult => {
    if (!context.isActive) {
      return { isValid: true };
    }

    const hasSelectedMessages = context.selectedMessageIds.length > 0;
    const hasAdditionalText = context.additionalText.trim().length > 0;

    if (!hasSelectedMessages && !hasAdditionalText) {
      return {
        isValid: false,
        error: '⚠️ Modo Manual Ativo: Selecione mensagens ou adicione contexto.'
      };
    }

    return { isValid: true };
  });

  /**
   * Valida envio de mensagem
   */
  const validateSendMessage = useStableCallback((
    input: string,
    isLoading: boolean,
    isSending: boolean
  ): ValidationResult => {
    // Validação 1: Input vazio
    if (!input.trim()) {
      return {
        isValid: false,
        error: 'Mensagem vazia'
      };
    }

    // Validação 2: Estado de loading
    if (isLoading) {
      return {
        isValid: false,
        error: 'Aguarde o envio anterior'
      };
    }

    // Validação 3: Flag de envio
    if (isSending) {
      return {
        isValid: false,
        error: 'Envio em andamento'
      };
    }

    return { isValid: true };
  });

  return {
    validateSendMessage,
    validateManualContext
  };
}
