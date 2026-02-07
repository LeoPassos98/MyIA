// frontend/src/features/settings/components/providers/aws/sections/AWSCredentialsSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, TextField, Button, Alert, LinearProgress,
  Select, MenuItem, ListSubheader, InputAdornment
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '@mui/material/styles';
import { REGION_GROUPS } from '../constants/regions';
import { OptimizedTooltip } from '@/components/OptimizedTooltip';
import { StatusBadge } from '@/components/Badges';
import { useCredentialsManagement, ValidationStatus, FormState } from '../hooks';

/**
 * Props do componente AWSCredentialsSection
 */
export interface AWSCredentialsSectionProps {
  formState: FormState;
  validationStatus: ValidationStatus;
  validationResult: any;
  error: string | null;
  success: string | null;
  isSaving: boolean;
  handleFieldChange: (field: keyof FormState, value: string) => void;
  handleValidate: () => Promise<void>;
  handleSave: () => Promise<void>;
}

/**
 * Seção de gerenciamento de credenciais AWS
 * 
 * Responsabilidades:
 * - Formulário de Access Key e Secret Key
 * - Seleção de região
 * - Validação de credenciais
 * - Feedback visual de status
 */
export function AWSCredentialsSection(props: AWSCredentialsSectionProps) {
  const theme = useTheme();
  const {
    formState,
    validationStatus,
    validationResult,
    error,
    success,
    isSaving,
    handleFieldChange,
    handleValidate,
    handleSave
  } = props;
  
  const {
    hasExistingCredentials,
    isEditingCredentials,
    setIsEditingCredentials,
    canSaveRegionOnly
  } = useCredentialsManagement({ formState, validationStatus });
  
  return (
    <Box sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, color: theme.palette.error.main }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, color: theme.palette.primary.main }}>
          {success}
        </Alert>
      )}
      
      {/* Alert quando credenciais já existem */}
      {hasExistingCredentials && !isEditingCredentials && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setIsEditingCredentials(true)}
            >
              Alterar Key
            </Button>
          }
        >
          <strong>Credenciais AWS já cadastradas</strong>
          <br />
          Você já possui credenciais configuradas para este provider.
          Clique em "Alterar Key" se deseja modificá-las.
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <OptimizedTooltip content="ID da sua Access Key AWS. Nunca compartilhe com terceiros.">
          <TextField
            fullWidth
            label="Access Key ID"
            placeholder="Access Key ID - Ex: AKIAIOSFODNN7EXAMPLE (16 caracteres após AKIA)"
            value={formState.accessKey}
            onChange={e => handleFieldChange('accessKey', e.target.value.trim())}
            disabled={
              validationStatus === 'validating' ||
              (hasExistingCredentials && !isEditingCredentials)
            }
            InputProps={{
              readOnly: hasExistingCredentials && !isEditingCredentials,
              endAdornment: hasExistingCredentials && !isEditingCredentials && (
                <InputAdornment position="end">
                  <CheckCircleIcon color="success" />
                </InputAdornment>
              )
            }}
            sx={{ mb: 1 }}
            inputProps={{
              autoComplete: 'username'
            }}
          />
        </OptimizedTooltip>
        
        <OptimizedTooltip content="Sua chave secreta AWS. Nunca será exibida após salvar.">
          <TextField
            fullWidth
            type="password"
            label="Secret Access Key"
            placeholder={formState.secretKey ? '********' : 'Secret Access Key - Ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (40 caracteres)'}
            value={formState.secretKey}
            onChange={e => handleFieldChange('secretKey', e.target.value.trim())}
            disabled={
              validationStatus === 'validating' ||
              (hasExistingCredentials && !isEditingCredentials)
            }
            InputProps={{
              readOnly: hasExistingCredentials && !isEditingCredentials,
              endAdornment: hasExistingCredentials && !isEditingCredentials && (
                <InputAdornment position="end">
                  <CheckCircleIcon color="success" />
                </InputAdornment>
              )
            }}
            sx={{ mb: 1 }}
            inputProps={{
              autoComplete: 'current-password'
            }}
          />
        </OptimizedTooltip>
        
        <OptimizedTooltip content="Região AWS onde seus modelos estão disponíveis. Pode ser alterada a qualquer momento.">
          <Select
            fullWidth
            value={formState.region}
            onChange={e => handleFieldChange('region', e.target.value.trim())}
            disabled={validationStatus === 'validating'}
            sx={{ mb: 1 }}
            displayEmpty
            renderValue={selected => {
              const found = REGION_GROUPS.flatMap(g => g.regions).find(r => r.value === selected);
              return found ? found.label : 'Selecione a região';
            }}
          >
            <MenuItem value="" disabled>Selecione a região</MenuItem>
            {REGION_GROUPS.map(group => [
              <ListSubheader key={group.label}>{group.label}</ListSubheader>,
              ...group.regions.map(region => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))
            ])}
          </Select>
        </OptimizedTooltip>
        
        {/* Botão para salvar apenas a região quando credenciais já existem */}
        {canSaveRegionOnly && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleSave}
            disabled={isSaving}
            size="small"
          >
            {isSaving ? 'Salvando...' : 'Salvar Região'}
          </Button>
        )}

        {/* Botões condicionais baseados no estado de edição */}
        {hasExistingCredentials && !isEditingCredentials ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsEditingCredentials(true)}
              startIcon={<EditIcon />}
              sx={{ fontWeight: 'bold', px: 3 }}
            >
              Alterar Credenciais
            </Button>
            <StatusBadge
              label="Credenciais Válidas"
              status="success"
              icon={<CheckCircleIcon />}
              size="small"
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <OptimizedTooltip content="Testa as credenciais e salva se forem válidas.">
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    await handleValidate();
                    if (validationStatus === 'valid') {
                      await handleSave();
                      setIsEditingCredentials(false);
                    }
                  }}
                  disabled={validationStatus === 'validating' || !formState.accessKey || !formState.secretKey}
                  sx={{ fontWeight: 'bold', px: 4, transition: 'all 0.2s' }}
                >
                  {validationStatus === 'validating' || isSaving ? 'Testando...' : 'Testar e Salvar'}
                </Button>
              </span>
            </OptimizedTooltip>
            {isEditingCredentials && (
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  setIsEditingCredentials(false);
                }}
              >
                Cancelar
              </Button>
            )}
            {validationStatus === 'valid' && (
              <StatusBadge
                label="Válido"
                status="success"
                icon={<CheckCircleIcon />}
                size="small"
              />
            )}
            {validationStatus === 'invalid' && (
              <StatusBadge
                label="Inválido"
                status="error"
                icon={<ErrorIcon />}
                size="small"
              />
            )}
          </Box>
        )}

        {validationStatus === 'validating' && <LinearProgress sx={{ mt: 1 }} />}

        {validationResult?.suggestion && (
          <Alert severity="info" icon={<WarningIcon />}>
            <strong>Sugestão:</strong> {validationResult.suggestion}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
