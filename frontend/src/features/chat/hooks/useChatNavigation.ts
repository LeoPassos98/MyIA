// frontend/src/features/chat/hooks/useChatNavigation.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook especializado para navegação no chat

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableCallback } from '../../../hooks/memory';

/**
 * Interface do hook de navegação
 */
export interface ChatNavigationHook {
  navigateToNewChat: (chatId: string, currentChatId?: string) => void;
  redirectIfUnauthenticated: (isAuthenticated: boolean) => void;
}

/**
 * Hook para navegação e redirects do chat
 * 
 * Responsabilidades:
 * - Navegação para novo chat criado (replace: true)
 * - Redirect para login se não autenticado
 * - Gerenciamento de navegação condicional
 * 
 * @returns {ChatNavigationHook} Funções de navegação
 */
export function useChatNavigation(): ChatNavigationHook {
  const navigate = useNavigate();

  /**
   * Navega para novo chat criado
   * Usa replace: true para não adicionar ao histórico
   */
  const navigateToNewChat = useStableCallback((chatId: string, currentChatId?: string) => {
    // Só navega se não houver chatId atual (novo chat)
    if (!currentChatId && chatId) {
      navigate(`/chat/${chatId}`, { replace: true });
    }
  });

  /**
   * Redireciona para login se não autenticado
   */
  const redirectIfUnauthenticated = useStableCallback((isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  });

  return {
    navigateToNewChat,
    redirectIfUnauthenticated
  };
}

/**
 * Hook auxiliar para auto-redirect de autenticação
 * Separado para uso em useEffect
 */
export function useAuthRedirect(isAuthenticated: boolean) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
}
