// frontend/src/features/auditPage/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import {
  Box,
  Container,
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

import { useAuditList } from './hooks/useAuditList';
import { useAuditSummary } from './hooks/useAuditSummary';
import { useAuditCostTimeline } from './hooks/useAuditCostTimeline';
import { useAuditProviderStats } from './hooks/useAuditProviderStats';
import { AuditTable } from './components/AuditTable';
import { AuditSummaryCards } from './components/AuditSummaryCards';
import { AuditCostChart } from './components/AuditCostChart';
import AuditProviderCharts from './components/AuditProviderCharts';
import { AuditModal } from '../audit/components/AuditModal';

export default function AuditPage() {
  const {
    records,
    loading,
    error,
    filters,
    handleFilterChange,
    selectedMessageId,
    handleRowClick,
    handleCloseModal,
  } = useAuditList();

  const summary = useAuditSummary(records);
  const costTimeline = useAuditCostTimeline(records);
  const providerStats = useAuditProviderStats(records);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Auditoria de Mensagens
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Histórico completo de inferências, custos e métricas (somente leitura)
        </Typography>
        
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
      </Box>

      {/* Filtros Avançados */}
      <Accordion sx={{ mb: 3 }} defaultExpanded={false}>
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

      <Divider sx={{ mb: 3 }} />

      {/* Conteúdo */}
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

          {/* Resumo */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {records.length} {records.length === 1 ? 'registro' : 'registros'} encontrado
              {records.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Tabela */}
          <AuditTable
            records={records}
            onRowClick={handleRowClick}
          />
        </>
      )}

      {/* Modal de Auditoria */}
      {selectedMessageId && (
        <AuditModal
          audit={{
            messageId: selectedMessageId,
            mode: 'response',
            source: 'system',
          }}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
}
