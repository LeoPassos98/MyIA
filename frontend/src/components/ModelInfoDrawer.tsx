// frontend/src/components/ModelInfoDrawer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import TokenIcon from '@mui/icons-material/Token';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { EnrichedAWSModel } from '../types/ai';

export interface ModelInfoDrawerProps {
  open: boolean;
  model: EnrichedAWSModel | null;
  onClose: () => void;
  isCertified?: boolean;
}

/**
 * Drawer lateral profissional para exibir informações detalhadas do modelo
 * 
 * ✅ Vantagens sobre Tooltip:
 * - Mais espaço para informações
 * - Melhor UX em mobile
 * - Sem problemas de posicionamento
 * - Animação suave
 * - Acessível
 * 
 * 📱 Mobile-friendly
 * 🎨 Design limpo e moderno
 * ⚡ Performance otimizada
 */
export const ModelInfoDrawer = memo(({
  open,
  model,
  onClose,
  isCertified = false,
}: ModelInfoDrawerProps) => {
  const theme = useTheme();

  if (!model) return null;

  const hasDbInfo = model.isInDatabase !== false;
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  const hasContextWindow = model.contextWindow > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
        },
      }}
      transitionDuration={250}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Informações do Modelo
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {/* Nome do Modelo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Nome do Modelo
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
              {model.name}
            </Typography>
          </Box>

          {/* Status Badges */}
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {isCertified && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Certificado"
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {!hasDbInfo && (
              <Chip
                icon={<WarningIcon />}
                label="Novo"
                color="warning"
                size="small"
              />
            )}
            {model.responseStreamingSupported && (
              <Chip
                icon={<SpeedIcon />}
                label="Streaming"
                color="info"
                size="small"
              />
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* ID do Modelo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TokenIcon fontSize="small" color="primary" />
              ID da API
            </Typography>
            <Box
              sx={{
                p: 1.5,
                background: alpha(theme.palette.text.primary, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                }}
              >
                {model.apiModelId}
              </Typography>
            </Box>
          </Box>

          {/* Provedor */}
          {model.providerName && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Provedor
              </Typography>
              <Chip
                label={model.providerName}
                variant="outlined"
                size="medium"
              />
            </Box>
          )}

          {/* Context Window */}
          {hasContextWindow && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TokenIcon fontSize="small" color="secondary" />
                Context Window
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {(model.contextWindow / 1024).toFixed(0)}k
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  tokens ({model.contextWindow.toLocaleString()})
                </Typography>
              </Box>
            </Box>
          )}

          {/* Custos */}
          {hasCostInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoneyIcon fontSize="small" color="success" />
                Custos por 1k Tokens
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    background: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Input (Entrada)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${model.costPer1kInput.toFixed(6)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    background: alpha(theme.palette.warning.main, 0.05),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Output (Saída)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    ${model.costPer1kOutput.toFixed(6)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Avisos */}
          {!hasDbInfo && (
            <Box
              sx={{
                p: 2,
                background: alpha(theme.palette.warning.main, 0.1),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              }}
            >
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <WarningIcon fontSize="small" color="warning" sx={{ mt: 0.2 }} />
                <span>
                  <strong>Modelo não cadastrado no banco de dados.</strong>
                  <br />
                  Informações de custo podem estar indisponíveis ou desatualizadas.
                </span>
              </Typography>
            </Box>
          )}

          {isCertified && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                background: alpha(theme.palette.success.main, 0.1),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              }}
            >
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.2 }} />
                <span>
                  <strong>Modelo certificado</strong>
                  <br />
                  Este modelo foi testado e validado para uso na plataforma.
                </span>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
});

ModelInfoDrawer.displayName = 'ModelInfoDrawer';
