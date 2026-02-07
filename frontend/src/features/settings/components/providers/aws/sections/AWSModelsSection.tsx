// frontend/src/features/settings/components/providers/aws/sections/AWSModelsSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, Typography, Alert, TextField, Button, CircularProgress,
  InputAdornment, Accordion, AccordionSummary, AccordionDetails, FormGroup
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { EnrichedAWSModel } from '@/types/ai';
import { CounterBadge } from '@/components/Badges';
import { OptimizedTooltip } from '@/components/OptimizedTooltip';
import { ModelCheckboxItem } from '../components/ModelCheckboxItem';
import { useModelsManagement, useCertificationProgress } from '../hooks';
import { CertificationProgressDialog } from '@/components/CertificationProgressDialog';

/**
 * Props do componente AWSModelsSection
 */
export interface AWSModelsSectionProps {
  availableModels: EnrichedAWSModel[];
  selectedModels: string[];
  toggleModel: (id: string) => void;
  canSelectModels: boolean;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  unavailableModels: string[];
  refreshCertifications: () => Promise<void>;
  onShowModelInfo: (model: EnrichedAWSModel) => void;
}

/**
 * Seção de gerenciamento de modelos AWS
 * 
 * Responsabilidades:
 * - Listagem e busca de modelos
 * - Seleção/deseleção de modelos
 * - Certificação de modelos
 * - Agrupamento por provedor
 */
export function AWSModelsSection(props: AWSModelsSectionProps) {
  const {
    availableModels,
    selectedModels,
    toggleModel,
    canSelectModels,
    isSaving,
    handleSave,
    unavailableModels,
    refreshCertifications,
    onShowModelInfo
  } = props;
  
  const { searchTerm, groupedModels, handleSearch } = useModelsManagement({ availableModels });
  
  const {
    progress,
    isDialogOpen,
    canCancel,
    startCertification,
    cancelCertification,
    closeDialog
  } = useCertificationProgress({ availableModels, refreshCertifications });
  
  return (
    <>
      <Box sx={{ mb: 4, opacity: canSelectModels ? 1 : 0.5 }}>
        <Typography variant="h6" gutterBottom>Habilitar Modelos</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {canSelectModels
            ? 'Selecione os modelos que deseja usar. Clique no ícone ℹ️ para ver detalhes.'
            : '⚠️ Valide as credenciais primeiro para habilitar a seleção de modelos'
          }
        </Typography>
        
        {availableModels.length === 0 && canSelectModels && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nenhum modelo disponível encontrado. Verifique suas permissões AWS.
          </Alert>
        )}

        {availableModels.length > 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <CounterBadge
                count={availableModels.length}
                label="modelos disponíveis"
                color="primary"
                size="small"
              />
              <CounterBadge
                count={selectedModels.length}
                label="selecionados"
                color="primary"
                size="small"
              />
              <CounterBadge
                count={groupedModels.length}
                label="provedores"
                color="primary"
                size="small"
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Buscar modelos por nome, ID ou provedor..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={!canSelectModels}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {groupedModels.length === 0 && searchTerm && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Nenhum modelo encontrado para "{searchTerm}"
              </Alert>
            )}

            {groupedModels.map(([providerName, models]) => {
              const selectedInGroup = models.filter(m => selectedModels.includes(m.apiModelId)).length;
              
              return (
                <Accordion key={providerName} defaultExpanded={groupedModels.length <= 3}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {providerName}
                      </Typography>
                      <CounterBadge
                        count={models.length}
                        label="modelos"
                        size="small"
                      />
                      {selectedInGroup > 0 && (
                        <CounterBadge
                          count={selectedInGroup}
                          label="selecionados"
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {models.map((model) => (
                        <ModelCheckboxItem
                          key={model.id}
                          model={model}
                          isSelected={selectedModels.includes(model.apiModelId)}
                          onToggle={toggleModel}
                          disabled={!canSelectModels}
                          isUnavailable={unavailableModels.includes(model.apiModelId)}
                          onShowInfo={onShowModelInfo}
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            {/* Botões para salvar e certificar */}
            {canSelectModels && (
              <>
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <OptimizedTooltip content="Certifica os modelos selecionados para garantir que funcionam corretamente">
                      <span>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => startCertification(selectedModels)}
                          disabled={!canSelectModels || selectedModels.length === 0 || isDialogOpen}
                          startIcon={isDialogOpen ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
                          sx={{ fontWeight: 'bold', px: 3 }}
                        >
                          {isDialogOpen ? 'Certificando...' : `Certificar ${selectedModels.length} Modelos`}
                        </Button>
                      </span>
                    </OptimizedTooltip>
                    <OptimizedTooltip
                      content="A certificação testa cada modelo individualmente e salva o resultado permanentemente. Você não precisa salvar a seleção de modelos para manter a certificação."
                      placement="left"
                    >
                      <HelpOutlineIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                    </OptimizedTooltip>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={isSaving || !selectedModels.length}
                    sx={{ fontWeight: 'bold', px: 4 }}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Modelos Selecionados'}
                  </Button>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                  💡 A certificação é salva automaticamente e não depende de salvar a seleção de modelos.
                </Typography>
              </>
            )}
          </>
        )}
      </Box>
      
      {/* Diálogo de progresso de certificação */}
      <CertificationProgressDialog
        open={isDialogOpen}
        models={progress}
        onCancel={cancelCertification}
        onClose={closeDialog}
        canCancel={canCancel}
      />
    </>
  );
}
