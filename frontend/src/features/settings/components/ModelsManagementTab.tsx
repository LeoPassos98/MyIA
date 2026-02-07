/**
 * frontend/src/features/settings/components/ModelsManagementTab.tsx
 * Model certification management interface (Modularized)
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { SettingsSection } from './SettingsSection';
import { useModelsManagement } from './ModelsManagement/hooks';
import {
  CertificationProgress,
  ModelsToolbar,
  ModelsTable,
} from './ModelsManagement/components';

/**
 * Tab de gerenciamento de modelos com certificação
 * Componente principal que orquestra hooks e sub-componentes
 */
export default function ModelsManagementTab() {
  const logic = useModelsManagement();

  if (logic.isLoading) {
    return (
      <SettingsSection>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Gerenciamento de Modelos"
      description="Certifique e gerencie modelos AWS Bedrock"
    >
      {/* Alertas de erro e sucesso */}
      {logic.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => logic.setError(null)}>
          {logic.error}
        </Alert>
      )}

      {logic.success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => logic.setSuccess(null)}>
          {logic.success}
        </Alert>
      )}

      {/* Feedback de certificação em andamento */}
      <CertificationProgress
        isCertifying={!!logic.isCertifying}
        isCertifyingBatch={logic.isCertifyingBatch}
      />

      {/* Toolbar com filtros e ações em lote */}
      <ModelsToolbar
        filter={logic.filter}
        onFilterChange={logic.setFilter}
        filterCounts={logic.filterCounts}
        selectedCount={logic.selectedModels.length}
        uncertifiedSelectedCount={logic.uncertifiedSelectedCount}
        onSelectAll={logic.handleSelectAll}
        onDeselectAll={logic.handleDeselectAll}
        onCertifySelected={logic.handleCertifySelected}
        onRefresh={logic.loadData}
        isCertifyingBatch={logic.isCertifyingBatch}
      />

      {/* Tabela de modelos */}
      <ModelsTable
        models={logic.filteredModels}
        certifiedModels={logic.certifiedModels}
        selectedModels={logic.selectedModels}
        isCertifying={logic.isCertifying}
        onToggleModel={logic.handleToggleModel}
        onCertifyModel={logic.handleCertifyModel}
        onSelectAll={logic.handleSelectAll}
        onDeselectAll={logic.handleDeselectAll}
      />

      {/* Informação sobre certificação */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Sobre a Certificação:</strong> A certificação testa se o modelo
          responde corretamente e está disponível na sua conta AWS. Modelos certificados
          são automaticamente habilitados e salvos nas suas configurações.
        </Typography>
      </Alert>
    </SettingsSection>
  );
}
