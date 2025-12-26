// frontend/src/features/auditPage/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import InsightsIcon from '@mui/icons-material/Insights';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuIcon from '@mui/icons-material/Menu';

import {
  ObservabilityPageLayout,
  ObservabilitySection,
} from '@/components/PageLayout/ObservabilityPageLayout';
import type { ObservabilitySectionItem } from '@/components/PageLayout/ObservabilityPageLayout';
import { useHeaderSlots } from '@/contexts/HeaderSlotsContext';

import { useAuditList } from './hooks/useAuditList';
import { useAuditSummary } from './hooks/useAuditSummary';
import { useAuditCostTimeline } from './hooks/useAuditCostTimeline';
import { useAuditProviderStats } from './hooks/useAuditProviderStats';
import { AuditTable } from './components/AuditTable';
import { AuditSummaryCards } from './components/AuditSummaryCards';
import { AuditCostChart } from './components/AuditCostChart';
import AuditProviderCharts from './components/AuditProviderCharts';
import { AuditViewerModal } from '../auditViewer';

const AUDIT_PAGE_SECTIONS: ObservabilitySectionItem[] = [
  {
    id: 'filters',
    label: 'Filtros',
    icon: <FilterListIcon fontSize="small" />,
  },
  {
    id: 'overview',
    label: 'Visão geral',
    icon: <InsightsIcon fontSize="small" />,
  },
  {
    id: 'table',
    label: 'Registros',
    icon: <TableChartIcon fontSize="small" />,
  },
];

export default function AuditPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setSlots, resetSlots } = useHeaderSlots();

  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  // Configurar slots do header ao montar
  useEffect(() => {
    setSlots({
      brandText: 'ObserveMyIA',
      left: (
        <IconButton
          onClick={handleOpenDrawer}
          aria-label="Abrir menu de navegação"
          sx={{ display: { xs: 'flex', lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      ),
    });

    return () => resetSlots();
  }, [setSlots, resetSlots, handleOpenDrawer]);

  const {
    records,
    loading,
    error,
    filters,
    handleFilterChange,
    selectedAudit,
    loadingAudit,
    handleRowClick,
    handleCloseModal,
  } = useAuditList();

  const summary = useAuditSummary(records);
  const costTimeline = useAuditCostTimeline(records);
  const providerStats = useAuditProviderStats(records);

  return (
    <>
      <ObservabilityPageLayout
        sections={AUDIT_PAGE_SECTIONS}
        defaultSectionId="filters"
        drawerOpen={drawerOpen}
        onOpenDrawer={handleOpenDrawer}
        onCloseDrawer={handleCloseDrawer}
      >
        {/* Indicador de escopo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            Exibindo apenas mensagens do usuário autenticado.
          </Typography>
          <Tooltip
            title="Nesta versão, a auditoria é limitada às mensagens associadas ao usuário logado. Auditoria global ou por outros usuários exige permissões administrativas."
            arrow
            placement="right"
          >
            <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filtros Avançados */}
        <ObservabilitySection
          id="filters"
          title="Filtros avançados"
        >
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Filtros avançados</Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Provider"
                    select
                    fullWidth
                    size="small"
                    value={filters.provider}
                    onChange={(e) => handleFilterChange({ provider: e.target.value })}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="groq">Groq</MenuItem>
                    <MenuItem value="together">Together</MenuItem>
                    <MenuItem value="perplexity">Perplexity</MenuItem>
                    <MenuItem value="mistral">Mistral</MenuItem>
                    <MenuItem value="claude">Claude</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Model"
                    fullWidth
                    size="small"
                    value={filters.model}
                    onChange={(e) => handleFilterChange({ model: e.target.value })}
                    placeholder="Ex: gpt-4"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Data Início"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Data Fim"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ mt: 3 }} />
        </ObservabilitySection>

        {/* Visão geral */}
        <ObservabilitySection
          id="overview"
          title="Visão geral"
        >
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              {/* Cards de Resumo */}
              <Box sx={{ mb: 3 }}>
                <AuditSummaryCards summary={summary} />
              </Box>

              {/* Gráficos Comparativos por Provider */}
              <AuditProviderCharts stats={providerStats} />

              {/* Gráfico de Custos ao Longo do Tempo */}
              <Box sx={{ mb: 3 }}>
                <AuditCostChart data={costTimeline} />
              </Box>
            </>
          )}
        </ObservabilitySection>

        {/* Tabela */}
        <ObservabilitySection
          id="table"
          title="Registros"
        >
          {!loading && !error && (
            <>
              {/* Resumo */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {records.length} {records.length === 1 ? 'registro' : 'registros'} encontrado
                  {records.length !== 1 ? 's' : ''}
                </Typography>
              </Box>

              <AuditTable records={records} onRowClick={handleRowClick} />
            </>
          )}
        </ObservabilitySection>
      </ObservabilityPageLayout>

      {/* Modal de Auditoria V1.4 — mantido EXATAMENTE como estava */}
      {selectedAudit && !loadingAudit && (
        <AuditViewerModal open={true} audit={selectedAudit} onClose={handleCloseModal} />
      )}
    </>
  );
}
