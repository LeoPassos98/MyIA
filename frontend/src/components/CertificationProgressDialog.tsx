// frontend/src/components/CertificationProgressDialog.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MIGRATED: Fase 3 - Padronização Visual

import { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTheme } from '@mui/material/styles';
import { CounterBadge } from '@/components/Badges';
import { CertificationDetails } from '../types/ai';
import { ModelBadgeGroup } from './ModelBadges';

export interface ModelCertificationProgress {
  modelId: string;
  modelName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  startTime?: number;
  endTime?: number;
  result?: CertificationDetails;
}

interface CertificationProgressDialogProps {
  open: boolean;
  models: ModelCertificationProgress[];
  onCancel: () => void;
  onClose: () => void;
  canCancel: boolean;
}

export const CertificationProgressDialog = memo(({
  open,
  models,
  onCancel,
  onClose,
  canCancel
}: CertificationProgressDialogProps) => {
  const theme = useTheme();
  
  const totalModels = models.length;
  const completedModels = models.filter(m => m.status === 'success' || m.status === 'error').length;
  const successModels = models.filter(m => m.status === 'success').length;
  const errorModels = models.filter(m => m.status === 'error').length;
  const progress = totalModels > 0 ? (completedModels / totalModels) * 100 : 0;
  const isComplete = completedModels === totalModels;
  
  // Calcular tempo médio e estimativa
  const completedWithTime = models.filter(m => m.startTime && m.endTime);
  const avgTimeMs = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, m) => sum + (m.endTime! - m.startTime!), 0) / completedWithTime.length
    : 0;
  const remainingModels = totalModels - completedModels;
  const estimatedTimeMs = remainingModels * avgTimeMs;
  const estimatedTimeSec = Math.ceil(estimatedTimeMs / 1000);
  
  const getStatusIcon = (model: ModelCertificationProgress) => {
    if (model.status === 'success' && model.result?.status === 'quality_warning') {
      return <WarningIcon color="warning" />;
    }
    
    // Verificar se é rate limit
    const isRateLimited = model.error?.includes('Limite de certificações excedido');
    
    switch (model.status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return isRateLimited ? <PauseCircleIcon color="disabled" /> : <ErrorIcon color="error" />;
      case 'running':
        return <HourglassEmptyIcon color="primary" />;
      default:
        return <HourglassEmptyIcon color="disabled" />;
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={isComplete ? onClose : undefined}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={!isComplete}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Certificação de Modelos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <CounterBadge
              count={completedModels}
              label={`/${totalModels}`}
              color={isComplete ? 'primary' : 'default'}
            />
            {successModels > 0 && (
              <CounterBadge
                count={successModels}
                label="OK"
                color="primary"
              />
            )}
            {errorModels > 0 && (
              <CounterBadge
                count={errorModels}
                label="Erros"
                color="secondary"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Barra de progresso geral */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progresso Geral
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
          
          {!isComplete && avgTimeMs > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              Tempo estimado restante: ~{estimatedTimeSec}s
              {avgTimeMs > 0 && ` (média: ${Math.round(avgTimeMs / 1000)}s por modelo)`}
            </Typography>
          )}
        </Box>
        
        {/* Alerta informativo */}
        {!isComplete && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Você pode sair desta tela</strong>
            <br />
            A certificação continuará em segundo plano. Os resultados serão salvos automaticamente.
          </Alert>
        )}
        
        {isComplete && errorModels > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Alguns modelos não puderam ser certificados</strong>
            <br />
            Modelos indisponíveis podem ter IDs inválidos ou não estar disponíveis na sua região AWS.
          </Alert>
        )}
        
        {isComplete && errorModels === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Certificação concluída!</strong>
            <br />
            Modelos certificados (<CheckCircleIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />) e disponíveis com limitações (<WarningIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />) podem ser usados. Os badges aparecerão na lista de modelos.
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Lista de modelos */}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {models.map((model, _index) => {
            // ✅ NOVO: Verificar se é rate limit
            const isRateLimited = model.error?.includes('Limite de certificações excedido');
            
            return (
              <ListItem
                key={model.modelId}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: model.status === 'running' ? theme.palette.action.hover : 'transparent',
                  border: model.status === 'running' ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'
                }}
              >
                <ListItemIcon>
                  {getStatusIcon(model)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{model.modelName}</Typography>
                      {/* MIGRATED: Usando novo sistema centralizado de badges (ModelBadgeGroup) */}
                      {/* Ver: plans/badge-system-centralization.md - Fase 3 */}
                      {/* ✅ FIX: Passar model.result para atualização em tempo real dos badges */}
                      <ModelBadgeGroup
                        model={{
                          apiModelId: model.modelId,
                          error: model.error,
                          certificationResult: model.result
                        }}
                        size="sm"
                        spacing={0.5}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {model.modelId}
                      </Typography>
                      {model.error && (
                        <Typography
                          variant="caption"
                          color={isRateLimited ? "text.secondary" : "error"}
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {isRateLimited ? (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <PauseCircleIcon sx={{ fontSize: 14 }} /> {model.error}
                            </Box>
                          ) : (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <CancelIcon sx={{ fontSize: 14 }} /> {model.error}
                            </Box>
                          )}
                        </Typography>
                      )}
                      {model.status === 'success' && model.result?.status === 'quality_warning' && model.startTime && model.endTime && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <WarningIcon sx={{ fontSize: 14 }} />
                          Disponível com limitações em {Math.round((model.endTime - model.startTime) / 1000)}s
                        </Typography>
                      )}
                      {model.status === 'success' && model.result?.status === 'certified' && model.startTime && model.endTime && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 14 }} />
                          Certificado em {Math.round((model.endTime - model.startTime) / 1000)}s
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      
      <DialogActions>
        {!isComplete && canCancel && (
          <Button
            onClick={onCancel}
            color="secondary"
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
        )}
        {isComplete && (
          <Button
            onClick={onClose}
            color="primary"
            variant="contained"
          >
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

CertificationProgressDialog.displayName = 'CertificationProgressDialog';
