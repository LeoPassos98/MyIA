// frontend/src/features/chat/components/ControlPanel/HelpTooltip.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Tooltip, Box, Typography, alpha, useTheme, Link } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { ReactNode } from 'react';

interface HelpTooltipProps {
  title: string;
  description: string;
  examples?: string[];
  /** Link para documentação externa */
  docLink?: string;
  /** Texto do link (padrão: "Saiba mais") */
  docLinkText?: string;
  /** Mensagem de warning contextual */
  warning?: string;
  /** Mensagem informativa adicional */
  info?: string;
}

export const HelpTooltip = ({
  title,
  description,
  examples,
  docLink,
  docLinkText = 'Saiba mais',
  warning,
  info
}: HelpTooltipProps) => {
  const theme = useTheme();

  const content: ReactNode = (
    <Box sx={{ p: 0.5, maxWidth: 320 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        {description}
      </Typography>

      {/* Warning contextual */}
      {warning && (
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.5,
          mb: 1,
          p: 0.75,
          bgcolor: alpha(theme.palette.warning.main, 0.15),
          borderRadius: 0.5,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
        }}>
          <WarningIcon sx={{ fontSize: 14, color: 'warning.main', mt: 0.25 }} />
          <Typography variant="caption" sx={{ flex: 1, color: 'warning.light' }}>
            {warning}
          </Typography>
        </Box>
      )}

      {/* Info adicional */}
      {info && (
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.5,
          mb: 1,
          p: 0.75,
          bgcolor: alpha(theme.palette.info.main, 0.15),
          borderRadius: 0.5,
          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
        }}>
          <InfoIcon sx={{ fontSize: 14, color: 'info.main', mt: 0.25 }} />
          <Typography variant="caption" sx={{ flex: 1, color: 'info.light' }}>
            {info}
          </Typography>
        </Box>
      )}

      {/* Exemplos */}
      {examples && examples.length > 0 && (
        <Box sx={{
          mt: 1,
          pt: 1,
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.2)
        }}>
          <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
            Exemplos:
          </Typography>
          {examples.map((ex, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              • {ex}
            </Typography>
          ))}
        </Box>
      )}

      {/* Link para documentação */}
      {docLink && (
        <Box sx={{
          mt: 1,
          pt: 1,
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.2)
        }}>
          <Link
            href={docLink}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '0.75rem',
              color: 'primary.light',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            📚 {docLinkText} →
          </Link>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={content}
      arrow
      placement="top"
      enterDelay={200}
      leaveDelay={100}
    >
      <HelpOutlineIcon
        sx={{
          fontSize: 16,
          color: 'text.secondary',
          opacity: 0.6,
          cursor: 'help',
          ml: 0.5,
          '&:hover': { opacity: 1, color: 'primary.main' }
        }}
      />
    </Tooltip>
  );
};
