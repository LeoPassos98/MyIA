// frontend/src/features/audit/components/AuditController.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Dialog,
  DialogContent,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAudit } from '../context/AuditContext';
import { useAuditLoader } from '../hooks/useAuditLoader';
import { AuditViewerModal } from '../../auditViewer';
import { RawAuditModal } from '../../auditViewer/RawAuditModal';
import { getViewModeForAuditMode } from '../constants/auditViewMode';

/**
 * Controller de auditoria.
 * 
 * Responsabilidades:
 * - Consumir contexto de auditoria
 * - Carregar dados via hook
 * - Tratar estados (loading, erro)
 * - Decidir qual modal renderizar (human-first viewer | technical viewer)
 * 
 * Decisão de visualização:
 * - human → AuditViewerModal (visualização humanizada)
 * - technical → RawAuditModal (JSON cru)
 * 
 * Não mistura fetch com UI.
 * Não altera contratos de domínio.
 * Não introduz lógica nova.
 */
export function AuditController() {
  const { auditState, closeAudit } = useAudit();

  // IMPORTANTE: Todos os hooks DEVEM ser chamados antes de qualquer early return
  // para respeitar as Rules of Hooks do React (mesma ordem em toda renderização).
  // O hook useAuditLoader aceita null e retorna estado neutro quando não há messageId.
  const messageId = auditState?.messageId ?? null;
  const mode = auditState?.mode;
  const { audit, loading, error } = useAuditLoader(messageId);

  // Sem intent, sem modal (early return APÓS os hooks)
  if (!auditState) {
    return null;
  }

  // Estado: Loading
  if (loading) {
    return (
      <Dialog
        open
        onClose={closeAudit}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Estado: Erro
  if (error) {
    return (
      <Dialog
        open
        onClose={closeAudit}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogContent>
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  // Estado: Sem dados
  if (!audit) {
    return null;
  }

  // Decisão: qual visualização usar
  if (!mode) {
    return (
      <Dialog
        open
        onClose={closeAudit}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogContent>
          <Alert severity="warning" sx={{ my: 2 }}>
            Modo de auditoria não definido.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }
  const viewMode = getViewModeForAuditMode(mode);

  if (viewMode === 'human') {
    return (
      <AuditViewerModal
        open={true}
        audit={audit}
        onClose={closeAudit}
      />
    );
  }

  // Modo técnico (raw JSON)
  return (
    <RawAuditModal
      open={true}
      audit={audit}
      onClose={closeAudit}
    />
  );
}
