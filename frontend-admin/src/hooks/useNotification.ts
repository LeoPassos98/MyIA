// frontend-admin/src/hooks/useNotification.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useContext } from 'react';
import { NotificationContext, NotificationContextType } from '../contexts/NotificationContext';

/**
 * Hook para acessar o sistema de notificações
 * Deve ser usado dentro de um NotificationProvider
 * 
 * @returns Funções para mostrar notificações e gerenciar estado
 * @throws Error se usado fora do NotificationProvider
 * 
 * @example
 * ```tsx
 * const { showSuccess, showError } = useNotification();
 * 
 * // Mostrar notificação de sucesso
 * showSuccess('Operação concluída com sucesso!');
 * 
 * // Mostrar notificação de erro com duração customizada
 * showError('Erro ao processar', 10000);
 * ```
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}
