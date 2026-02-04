// frontend-admin/src/components/Certifications/JobHistoryTable.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useJobHistory } from './useJobHistory';
import { JobFilters } from './JobFilters';
import { JobTableRow } from './JobTableRow';
import { StatusLegend } from './StatusLegend';
import { HelpTooltip } from './HelpTooltip';

/**
 * Tabela de histórico de jobs de certificação
 * Refatorado para usar componentes extraídos conforme STANDARDS.md Seção 15
 * 
 * Componentes extraídos:
 * - useJobHistory.ts: Lógica de negócio (STANDARDS.md Seção 3.0)
 * - JobFilters.tsx: Componente de filtros
 * - JobTableRow.tsx: Linha individual da tabela
 */
export function JobHistoryTable() {
  const {
    jobs,
    loading,
    refreshing,
    page,
    rowsPerPage,
    total,
    searchId,
    statusFilter,
    expandedRows,
    filteredJobs,
    activeJobIds,
    isPolling,
    lastUpdate,
    setPage,
    setRowsPerPage,
    setSearchId,
    setStatusFilter,
    toggleRowExpansion,
    handleRefresh,
    formatLastUpdate
  } = useJobHistory();

  return (
    <Card>
      <CardContent>
        {/* Cabeçalho com título e botão de refresh */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">📋 Histórico de Jobs</Typography>
            <HelpTooltip
              title="Histórico de Jobs"
              description={
                <Box>
                  <Typography variant="caption" display="block" mb={0.5}>
                    Lista de todos os jobs de certificação criados, com atualização automática a cada 3 segundos para jobs ativos.
                  </Typography>
                  <Typography variant="caption" display="block">
                    Clique em um job para ver detalhes de cada modelo certificado.
                  </Typography>
                </Box>
              }
            />
          </Box>
          <Tooltip title="Atualizar agora">
            <span>
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading || refreshing}
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'rotate(180deg)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Indicador de polling ativo */}
        {isPolling && (
          <Box mb={2}>
            <Alert severity="info" icon={<CircularProgress size={16} />}>
              <Typography variant="body2">
                🔄 Atualizando automaticamente... {activeJobIds.length} job{activeJobIds.length > 1 ? 's' : ''} ativo{activeJobIds.length > 1 ? 's' : ''}
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Última atualização */}
        {lastUpdate && !isPolling && (
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            {formatLastUpdate()}
          </Typography>
        )}

        {/* Legenda de status */}
        <Box mb={3}>
          <StatusLegend />
        </Box>

        {/* Filtros */}
        <JobFilters
          searchId={searchId}
          onSearchIdChange={setSearchId}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filteredCount={filteredJobs.length}
          showResultCount={!!searchId || statusFilter !== 'ALL'}
        />

        {loading && jobs.length === 0 ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Barra de progresso durante refresh */}
            {refreshing && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}></TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Regiões</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progresso Visual</TableCell>
                    <TableCell>Criado em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          {searchId || statusFilter !== 'ALL' 
                            ? '🔍 Nenhum job encontrado com os filtros aplicados'
                            : '📭 Nenhum job encontrado. Crie um novo job na seção "Certificar" acima.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <JobTableRow
                        key={job.id}
                        job={job}
                        isExpanded={expandedRows.has(job.id)}
                        onToggleExpand={toggleRowExpansion}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
