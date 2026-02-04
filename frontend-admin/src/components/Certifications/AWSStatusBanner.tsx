// frontend-admin/src/components/Certifications/AWSStatusBanner.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, Box, Chip, CircularProgress, IconButton, Collapse, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudIcon from '@mui/icons-material/Cloud';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { certificationApi } from '../../services/certificationApi';

interface AWSStatus {
  configured: boolean;
  valid: boolean;
  message: string;
  region: string | null;
  modelsAvailable: number;
  accessKeyPreview?: string;
  error?: string;
}

export function AWSStatusBanner() {
  const [status, setStatus] = useState<AWSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await certificationApi.getAWSStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar status AWS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading && !status) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="info" 
          icon={<CircularProgress size={20} />}
        >
          Verificando credenciais AWS...
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="error"
          action={
            <IconButton size="small" onClick={fetchStatus}>
              <RefreshIcon />
            </IconButton>
          }
        >
          <AlertTitle>Erro</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!status) return null;

  // Determinar severidade e ícone
  const getSeverity = () => {
    if (!status.configured) return 'warning';
    if (!status.valid) return 'error';
    return 'success';
  };

  const getIcon = () => {
    if (!status.configured) return <WarningIcon />;
    if (!status.valid) return <ErrorIcon />;
    return <CheckCircleIcon />;
  };

  const getTitle = () => {
    if (!status.configured) return 'AWS Não Configurado';
    if (!status.valid) return 'Credenciais AWS Inválidas';
    return 'AWS Conectado';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Revalidar credenciais">
              <IconButton 
                size="small" 
                onClick={fetchStatus}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        }
        sx={{
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudIcon fontSize="small" />
          {getTitle()}
          {status.valid && (
            <Chip 
              label={`${status.modelsAvailable} modelos`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </AlertTitle>
        
        <Typography variant="body2">
          {status.message}
        </Typography>
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pl: 1, borderLeft: 2, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Região:</strong> {status.region || 'Não configurada'}
            </Typography>
            {status.accessKeyPreview && (
              <Typography variant="body2" color="text.secondary">
                <strong>Access Key:</strong> {status.accessKeyPreview}
              </Typography>
            )}
            {status.error && (
              <Typography variant="body2" color="error">
                <strong>Erro AWS:</strong> {status.error}
              </Typography>
            )}
            {!status.configured && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                💡 Configure <code>AWS_BEDROCK_CREDENTIALS=ACCESS_KEY:SECRET_KEY</code> no arquivo <code>.env</code>
              </Typography>
            )}
            {status.configured && !status.valid && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                💡 Verifique se as credenciais estão corretas e se a conta tem acesso ao AWS Bedrock
              </Typography>
            )}
          </Box>
        </Collapse>
      </Alert>
    </Box>
  );
}
