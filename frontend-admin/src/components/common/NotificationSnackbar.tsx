// frontend-admin/src/components/common/NotificationSnackbar.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';

/**
 * Componente de notificações toast/snackbar
 * Renderiza todas as notificações ativas do contexto
 * Posicionado no bottom-right da tela
 * Suporta múltiplas notificações empilhadas
 */
export function NotificationSnackbar() {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon fontSize="inherit" />;
      case 'error':
        return <ErrorIcon fontSize="inherit" />;
      case 'warning':
        return <WarningIcon fontSize="inherit" />;
      case 'info':
        return <InfoIcon fontSize="inherit" />;
      default:
        return undefined;
    }
  };

  const handleClose = (id: string) => {
    logger.debug('Notification closed manually', {
      component: 'NotificationSnackbar',
      id
    });
    removeNotification(id);
  };

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            // Empilhar notificações verticalmente
            bottom: `${24 + index * 80}px !important`,
            transition: 'bottom 0.3s ease-in-out'
          }}
        >
          <Alert
            severity={notification.severity}
            icon={getIcon(notification.severity)}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => handleClose(notification.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              width: '100%',
              minWidth: '300px',
              maxWidth: '500px',
              boxShadow: 3,
              '& .MuiAlert-message': {
                width: '100%',
                wordBreak: 'break-word'
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
