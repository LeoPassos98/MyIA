// frontend/src/contexts/NotificationContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * NotificationContext
 *
 * Context e Provider para sistema de notificações toast.
 * Permite exibir mensagens de sucesso, erro, warning e info em qualquer parte da aplicação.
 *
 * @module contexts/NotificationContext
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide, type SlideProps } from '@mui/material';

/**
 * Interface para uma notificação
 */
export interface Notification {
  /** Mensagem a ser exibida */
  message: string;
  /** Severidade da notificação */
  severity: AlertColor;
  /** Duração em milissegundos (padrão: 6000) */
  duration?: number;
  /** ID único da notificação */
  id: string;
}

/**
 * Interface do contexto de notificações
 */
interface NotificationContextValue {
  /** Exibe uma notificação de sucesso */
  showSuccess: (message: string, duration?: number) => void;
  /** Exibe uma notificação de erro */
  showError: (message: string, duration?: number) => void;
  /** Exibe uma notificação de warning */
  showWarning: (message: string, duration?: number) => void;
  /** Exibe uma notificação de info */
  showInfo: (message: string, duration?: number) => void;
  /** Exibe uma notificação customizada */
  showNotification: (message: string, severity: AlertColor, duration?: number) => void;
  /** Fecha a notificação atual */
  closeNotification: () => void;
}

/**
 * Context de notificações
 */
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Transição de slide para o Snackbar
 */
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

/**
 * Props do NotificationProvider
 */
interface NotificationProviderProps {
  children: ReactNode;
  /** Duração padrão das notificações em ms (padrão: 6000) */
  defaultDuration?: number;
  /** Posição do snackbar */
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

/**
 * Provider de notificações
 * 
 * Deve envolver a aplicação ou a parte que precisa de notificações.
 * 
 * @example
 * ```tsx
 * // Em App.tsx ou index.tsx
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * ```
 * 
 * @example
 * ```tsx
 * // Com configurações customizadas
 * <NotificationProvider
 *   defaultDuration={4000}
 *   position={{ vertical: 'top', horizontal: 'right' }}
 * >
 *   <App />
 * </NotificationProvider>
 * ```
 */
export function NotificationProvider({
  children,
  defaultDuration = 6000,
  position = { vertical: 'bottom', horizontal: 'center' }
}: NotificationProviderProps) {
  const [notification, setNotification] = useState<Notification | null>(null);

  /**
   * Exibe uma notificação
   */
  const showNotification = useCallback(
    (message: string, severity: AlertColor, duration?: number) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      setNotification({
        message,
        severity,
        duration: duration ?? defaultDuration,
        id
      });
    },
    [defaultDuration]
  );

  /**
   * Fecha a notificação atual
   */
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * Atalhos para tipos específicos de notificação
   */
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration);
    },
    [showNotification]
  );

  const value: NotificationContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    closeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={notification?.duration}
        onClose={closeNotification}
        anchorOrigin={position}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={closeNotification}
          severity={notification?.severity}
          variant="filled"
          sx={{
            width: '100%',
            boxShadow: 3,
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

/**
 * Hook para usar o sistema de notificações
 * 
 * @returns Objeto com funções para exibir notificações
 * @throws Error se usado fora do NotificationProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { showSuccess, showError } = useNotification();
 *   
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Dados salvos com sucesso!');
 *     } catch (error) {
 *       showError('Erro ao salvar dados');
 *     }
 *   };
 *   
 *   return <button onClick={handleSave}>Salvar</button>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Notificação com duração customizada
 * const { showWarning } = useNotification();
 * 
 * showWarning('Certificação expirada há 7 dias', 10000); // 10 segundos
 * ```
 * 
 * @example
 * ```typescript
 * // Notificação customizada
 * const { showNotification } = useNotification();
 * 
 * showNotification('Operação concluída', 'info', 3000);
 * ```
 */
export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}

/**
 * Hook auxiliar para notificações de operações assíncronas
 * 
 * Automatiza o padrão de mostrar loading, sucesso ou erro.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const notifyAsync = useAsyncNotification();
 *   
 *   const handleCertify = async () => {
 *     await notifyAsync(
 *       certificationService.certifyModel(modelId),
 *       {
 *         loading: 'Certificando modelo...',
 *         success: 'Modelo certificado com sucesso!',
 *         error: 'Erro ao certificar modelo'
 *       }
 *     );
 *   };
 *   
 *   return <button onClick={handleCertify}>Certificar</button>;
 * }
 * ```
 */
export function useAsyncNotification() {
  const { showSuccess, showError, showInfo } = useNotification();
  
  return useCallback(
    async <T,>(
      promise: Promise<T>,
      messages: {
        loading?: string;
        success: string;
        error: string;
      }
    ): Promise<T> => {
      if (messages.loading) {
        showInfo(messages.loading, 2000);
      }
      
      try {
        const result = await promise;
        showSuccess(messages.success);
        return result;
      } catch (error) {
        showError(messages.error);
        throw error;
      }
    },
    [showSuccess, showError, showInfo]
  );
}
