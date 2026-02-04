// frontend-admin/src/contexts/NotificationContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { createContext, useState, useCallback, ReactNode } from 'react';
import { logger } from '../utils/logger';

export interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  autoHideDuration?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

const MAX_NOTIFICATIONS = 3;
const DEFAULT_DURATION = 5000;

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    message: string,
    severity: Notification['severity'],
    duration: number = DEFAULT_DURATION
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: Notification = {
      id,
      message,
      severity,
      autoHideDuration: duration
    };

    logger.debug('Adding notification', {
      component: 'NotificationContext',
      id,
      severity,
      message: message.substring(0, 50)
    });

    setNotifications(prev => {
      // Limitar a MAX_NOTIFICATIONS notificações visíveis
      const updated = [...prev, notification];
      if (updated.length > MAX_NOTIFICATIONS) {
        const removed = updated.shift();
        logger.debug('Removing oldest notification due to limit', {
          component: 'NotificationContext',
          removedId: removed?.id
        });
      }
      return updated;
    });

    // Auto-dismiss após duração especificada
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    logger.debug('Removing notification', {
      component: 'NotificationContext',
      id
    });

    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    logger.info('Success notification', {
      component: 'NotificationContext',
      message: message.substring(0, 50)
    });
    addNotification(message, 'success', duration);
  }, [addNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    logger.error('Error notification', {
      component: 'NotificationContext',
      message: message.substring(0, 50)
    });
    addNotification(message, 'error', duration);
  }, [addNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    logger.info('Info notification', {
      component: 'NotificationContext',
      message: message.substring(0, 50)
    });
    addNotification(message, 'info', duration);
  }, [addNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    logger.warn('Warning notification', {
      component: 'NotificationContext',
      message: message.substring(0, 50)
    });
    addNotification(message, 'warning', duration);
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
