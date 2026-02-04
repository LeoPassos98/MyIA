# Roadmap Consolidado - Fases 2 e 3: Dashboard + Observabilidade

> **Versão:** 1.0  
> **Data:** 2026-01-26  
> **Status:** Pronto para Execução  
> **Referências:** [LOGS-API-DOCUMENTATION](./LOGS-API-DOCUMENTATION.md) | [LOGGING-IMPLEMENTATION-PLAN-PART2](./LOGGING-IMPLEMENTATION-PLAN-PART2.md) | [STANDARDS §13](./STANDARDS.md#13-sistema-de-logging-estruturado)

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Status Atual](#-status-atual)
3. [Fase 2 Restante: Dashboard de Logs](#-fase-2-restante-dashboard-de-logs-frontend)
4. [Fase 3: Observabilidade Avançada](#-fase-3-observabilidade-avançada)
5. [Diagrama de Dependências](#-diagrama-de-dependências)
6. [Cronograma Sugerido](#-cronograma-sugerido)
7. [Estratégias de Ajuste](#-estratégias-de-ajuste)

---

## 🎯 Visão Geral

### Objetivos Consolidados

Este roadmap consolida as tarefas restantes das **Fases 2 e 3** do Sistema de Logging do MyIA:

- ✅ **Fase 1 (MVP):** Completa - Winston + SQLite + Middleware + Migração
- ✅ **Fase 2.1-2.4:** Completa - PostgreSQL + Transport + Retenção + API de Busca
- 🔄 **Fase 2.5:** Dashboard Frontend (PENDENTE)
- 🔄 **Fase 3:** Observabilidade com Grafana + Loki (PENDENTE)

### Princípios de Execução

1. **Checkpoints Obrigatórios:** Cada tarefa tem critérios de sucesso mensuráveis
2. **Validação Incremental:** Testar após cada subtarefa
3. **Rollback Seguro:** Critérios claros para voltar atrás
4. **Performance First:** Todas as queries < 100ms, SSE < 1s latência

---

## 📊 Status Atual

### ✅ O que já está pronto (Fase 2.1-2.4)

| Componente | Status | Performance |
|------------|--------|-------------|
| Winston Logger | ✅ Completo | < 5ms/log |
| PostgreSQL Transport | ✅ Completo | Assíncrono |
| Tabela `logs` | ✅ Criada | 5 índices |
| Retenção (30 dias) | ✅ Funcionando | Automática |
| API de Busca | ✅ Completa | 11-26ms |
| Endpoints REST | ✅ 5 endpoints | Autenticados |
| Validação Zod | ✅ Completa | - |
| Testes API | ✅ Passando | 100% |

### 🔄 O que falta fazer

| Fase | Componente | Status |
|------|------------|--------|
| **2.5** | Dashboard Frontend | ⏳ Pendente |
| **3.1** | Docker Compose (Loki + Grafana) | ⏳ Pendente |
| **3.2** | Integração Loki | ⏳ Pendente |
| **3.3** | Dashboards Grafana | ⏳ Pendente |
| **3.4** | Alertas | ⏳ Pendente |
| **3.5** | SSE Tempo Real | ⏳ Pendente |

---

## 🎨 Fase 2 Restante: Dashboard de Logs (Frontend)

### Estimativa Total: 5-7 dias úteis

### Objetivos Mensuráveis

- [ ] Interface de busca de logs funcionando
- [ ] Tabela de visualização com paginação
- [ ] Filtros interativos (level, userId, datas)
- [ ] Visualização de detalhes do log
- [ ] Correlação de logs por requestId
- [ ] Gráficos de estatísticas
- [ ] Performance: renderização < 100ms para 1000 logs

---

### Tarefa 2.5.1: Criar Serviço de API de Logs (Frontend)

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar serviço TypeScript para consumir a API de logs do backend.

#### Arquivos a Criar/Modificar

```
frontend/src/services/
├── logsService.ts          # Serviço principal (CRIAR)
└── api.ts                  # Cliente HTTP base (MODIFICAR)

frontend/src/types/
└── logs.ts                 # Tipos TypeScript (CRIAR)
```

#### Implementação Detalhada

**1. Criar tipos TypeScript:**

```typescript
// frontend/src/types/logs.ts
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface Log {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string | null;
  userId: string | null;
  inferenceId: string | null;
  metadata: Record<string, any> | null;
  error: {
    code?: string;
    message?: string;
    stack?: string;
  } | null;
}

export interface LogFilters {
  level?: LogLevel;
  userId?: string;
  requestId?: string;
  inferenceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface LogsResponse {
  logs: Log[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  performance?: {
    duration: string;
  };
}

export interface LogStatsResponse {
  stats: Array<{
    level: LogLevel;
    count: number;
  }>;
}
```

**2. Criar serviço de API:**

```typescript
// frontend/src/services/logsService.ts
import api from './api';
import { Log, LogFilters, LogsResponse, LogStatsResponse } from '../types/logs';

export const logsService = {
  /**
   * Busca logs com filtros e paginação
   */
  async searchLogs(filters: LogFilters): Promise<LogsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/logs?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Busca log por ID
   */
  async getLogById(id: string): Promise<Log> {
    const response = await api.get(`/logs/${id}`);
    return response.data.data.log;
  },

  /**
   * Busca logs por requestId (correlação)
   */
  async getLogsByRequestId(requestId: string): Promise<Log[]> {
    const response = await api.get(`/logs/request/${requestId}`);
    return response.data.data.logs;
  },

  /**
   * Busca erros recentes
   */
  async getRecentErrors(limit: number = 50): Promise<Log[]> {
    const response = await api.get(`/logs/errors/recent?limit=${limit}`);
    return response.data.data.logs;
  },

  /**
   * Busca estatísticas de logs
   */
  async getLogStats(startDate?: string, endDate?: string): Promise<LogStatsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/logs/stats?${params.toString()}`);
    return response.data.data;
  }
};
```

#### Dependências

- ✅ API de Logs (backend) funcionando
- ✅ Cliente HTTP configurado (axios/fetch)
- ✅ Autenticação JWT implementada

#### Checkpoint 2.5.1: Serviço de API Criado

**Critérios de Sucesso:**

- [ ] Arquivo `logsService.ts` criado
- [ ] Tipos TypeScript definidos
- [ ] 5 métodos implementados
- [ ] Tratamento de erros configurado
- [ ] TypeScript compila sem erros

**Teste de Validação:**

```bash
cd frontend
npm run type-check
# Esperado: 0 erros TypeScript
```

**Teste Manual:**

```typescript
// Testar no console do navegador
import { logsService } from './services/logsService';

// Buscar logs
const result = await logsService.searchLogs({ level: 'error', limit: 10 });
console.log(result);
// Esperado: { logs: [...], pagination: {...} }
```

**Se Falhar:**
- **Causa Provável:** Erro de configuração do cliente HTTP
- **Ação:** Verificar configuração do axios/fetch
- **Modo:** Debug (investigar requisições)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.2

---

### Tarefa 2.5.2: Criar Componente de Busca de Logs

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar componente React com formulário de busca e filtros.

#### Arquivos a Criar/Modificar

```
frontend/src/components/logs/
├── LogsSearch.tsx          # Componente de busca (CRIAR)
├── LogsFilters.tsx         # Filtros avançados (CRIAR)
└── index.ts                # Exports (CRIAR)
```

#### Implementação Detalhada

**1. Componente de busca:**

```typescript
// frontend/src/components/logs/LogsSearch.tsx
import React, { useState } from 'react';
import { TextField, Button, Box, Grid } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { LogFilters } from '../../types/logs';

interface LogsSearchProps {
  onSearch: (filters: LogFilters) => void;
  loading?: boolean;
}

export const LogsSearch: React.FC<LogsSearchProps> = ({ onSearch, loading }) => {
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ search: search || undefined });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={10}>
          <TextField
            fullWidth
            placeholder="Buscar em mensagens de log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={loading}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
```

**2. Componente de filtros:**

```typescript
// frontend/src/components/logs/LogsFilters.tsx
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Stack
} from '@mui/material';
import { LogLevel, LogFilters } from '../../types/logs';

interface LogsFiltersProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
}

export const LogsFilters: React.FC<LogsFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof LogFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleClearFilter = (key: keyof LogFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof LogFilters] !== undefined
  ).length;

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Filtro de Nível */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Nível</InputLabel>
            <Select
              value={filters.level || ''}
              onChange={(e) => handleChange('level', e.target.value)}
              label="Nível"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Filtro de Data Início */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Data Início"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Filtro de Data Fim */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Data Fim"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Filtro de User ID */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="User ID"
            value={filters.userId || ''}
            onChange={(e) => handleChange('userId', e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Chips de filtros ativos */}
      {activeFiltersCount > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {Object.entries(filters).map(([key, value]) => {
            if (value === undefined) return null;
            return (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                onDelete={() => handleClearFilter(key as keyof LogFilters)}
                size="small"
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
```

#### Dependências

- ✅ Tarefa 2.5.1 (Serviço de API)
- ✅ Material-UI instalado
- ✅ React Router configurado

#### Checkpoint 2.5.2: Componente de Busca Criado

**Critérios de Sucesso:**

- [ ] Componente `LogsSearch` renderiza
- [ ] Componente `LogsFilters` renderiza
- [ ] Filtros funcionam corretamente
- [ ] Estado gerenciado corretamente
- [ ] UI responsiva (mobile + desktop)

**Teste de Validação:**

```typescript
// Testar renderização
import { render, screen, fireEvent } from '@testing-library/react';
import { LogsSearch } from './LogsSearch';

test('should render search input', () => {
  const onSearch = jest.fn();
  render(<LogsSearch onSearch={onSearch} />);
  
  const input = screen.getByPlaceholderText(/buscar/i);
  expect(input).toBeInTheDocument();
});

test('should call onSearch when submitted', () => {
  const onSearch = jest.fn();
  render(<LogsSearch onSearch={onSearch} />);
  
  const input = screen.getByPlaceholderText(/buscar/i);
  const button = screen.getByRole('button', { name: /buscar/i });
  
  fireEvent.change(input, { target: { value: 'error' } });
  fireEvent.click(button);
  
  expect(onSearch).toHaveBeenCalledWith({ search: 'error' });
});
```

**Se Falhar:**
- **Causa Provável:** Erro de renderização ou estado
- **Ação:** Verificar props e estado
- **Modo:** Debug (investigar componente)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.3

---

### Tarefa 2.5.3: Criar Tabela de Visualização de Logs

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar tabela responsiva para exibir logs com paginação.

#### Arquivos a Criar/Modificar

```
frontend/src/components/logs/
├── LogsTable.tsx           # Tabela de logs (CRIAR)
├── LogRow.tsx              # Linha da tabela (CRIAR)
└── LogLevelBadge.tsx       # Badge de nível (CRIAR)
```

#### Implementação Detalhada

**1. Badge de nível:**

```typescript
// frontend/src/components/logs/LogLevelBadge.tsx
import React from 'react';
import { Chip } from '@mui/material';
import { LogLevel } from '../../types/logs';

interface LogLevelBadgeProps {
  level: LogLevel;
}

const levelColors: Record<LogLevel, 'info' | 'warning' | 'error' | 'default'> = {
  info: 'info',
  warn: 'warning',
  error: 'error',
  debug: 'default'
};

export const LogLevelBadge: React.FC<LogLevelBadgeProps> = ({ level }) => {
  return (
    <Chip
      label={level.toUpperCase()}
      color={levelColors[level]}
      size="small"
    />
  );
};
```

**2. Linha da tabela:**

```typescript
// frontend/src/components/logs/LogRow.tsx
import React from 'react';
import { TableRow, TableCell, IconButton, Collapse, Box } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Log } from '../../types/logs';
import { LogLevelBadge } from './LogLevelBadge';
import { format } from 'date-fns';

interface LogRowProps {
  log: Log;
  onRowClick?: (log: Log) => void;
}

export const LogRow: React.FC<LogRowProps> = ({ log, onRowClick }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow hover onClick={() => onRowClick?.(log)} sx={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
        </TableCell>
        <TableCell>
          <LogLevelBadge level={log.level} />
        </TableCell>
        <TableCell>{log.message}</TableCell>
        <TableCell>{log.requestId || '-'}</TableCell>
        <TableCell>{log.userId || '-'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(log, null, 2)}
              </pre>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
```

**3. Tabela principal:**

```typescript
// frontend/src/components/logs/LogsTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { Log } from '../../types/logs';
import { LogRow } from './LogRow';

interface LogsTableProps {
  logs: Log[];
  loading?: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick?: (log: Log) => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({
  logs,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onRowClick
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography color="textSecondary">
          Nenhum log encontrado
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Timestamp</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Mensagem</TableCell>
              <TableCell>Request ID</TableCell>
              <TableCell>User ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} onRowClick={onRowClick} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Paper>
  );
};
```

#### Dependências

- ✅ Tarefa 2.5.1 (Serviço de API)
- ✅ Tarefa 2.5.2 (Componente de Busca)
- ✅ date-fns instalado

#### Checkpoint 2.5.3: Tabela de Logs Criada

**Critérios de Sucesso:**

- [ ] Tabela renderiza logs corretamente
- [ ] Paginação funciona
- [ ] Expansão de detalhes funciona
- [ ] Performance: renderização < 100ms para 100 logs
- [ ] Responsiva (mobile + desktop)

**Teste de Validação:**

```typescript
// Testar renderização
import { render, screen } from '@testing-library/react';
import { LogsTable } from './LogsTable';

const mockLogs = [
  {
    id: '1',
    timestamp: '2026-01-26T20:00:00Z',
    level: 'info',
    message: 'Test log',
    requestId: 'req-123',
    userId: 'user-456',
    inferenceId: null,
    metadata: null,
    error: null
  }
];

test('should render logs table', () => {
  render(
    <LogsTable
      logs={mockLogs}
      page={1}
      limit={20}
      total={1}
      onPageChange={jest.fn()}
      onLimitChange={jest.fn()}
    />
  );
  
  expect(screen.getByText('Test log')).toBeInTheDocument();
});
```

**Se Falhar:**
- **Causa Provável:** Erro de renderização ou performance
- **Ação:** Otimizar renderização (React.memo, virtualização)
- **Modo:** Debug (investigar performance)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.4

---

### Tarefa 2.5.4: Criar Página Principal de Logs

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Integrar todos os componentes em uma página funcional.

#### Arquivos a Criar/Modificar

```
frontend/src/pages/
└── LogsPage.tsx            # Página principal (CRIAR)

frontend/src/App.tsx        # Adicionar rota (MODIFICAR)
```

#### Implementação Detalhada

**1. Página principal:**

```typescript
// frontend/src/pages/LogsPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Paper, Alert } from '@mui/material';
import { LogsSearch } from '../components/logs/LogsSearch';
import { LogsFilters } from '../components/logs/LogsFilters';
import { LogsTable } from '../components/logs/LogsTable';
import { logsService } from '../services/logsService';
import { Log, LogFilters } from '../types/logs';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: 20,
    sort: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await logsService.searchLogs(filters);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (err) {
      setError('Erro ao buscar logs. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleSearch = (searchFilters: LogFilters) => {
    setFilters({ ...filters, ...searchFilters, page: 1 });
  };

  const handleFiltersChange = (newFilters: LogFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Logs do Sistema
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <LogsSearch onSearch={handleSearch} loading={loading} />
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <LogsFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </Paper>

        <LogsTable
          logs={logs}
          loading={loading}
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </Box>
    </Container>
  );
};
```

**2. Adicionar rota:**

```typescript
// frontend/src/App.tsx (adicionar)
import { LogsPage } from './pages/LogsPage';

// Dentro do Router:
<Route path="/logs" element={<LogsPage />} />
```

#### Dependências

- ✅ Todas as tarefas anteriores (2.5.1-2.5.3)
- ✅ React Router configurado

#### Checkpoint 2.5.4: Página de Logs Funcionando

**Critérios de Sucesso:**

- [ ] Página renderiza sem erros
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Loading states corretos
- [ ] Error handling implementado

**Teste de Validação:**

```bash
# 1. Iniciar frontend
cd frontend
npm run dev

# 2. Acessar http://localhost:3000/logs

# 3. Verificar:
# - Página carrega
# - Logs aparecem
# - Busca funciona
# - Filtros funcionam
# - Paginação funciona
```

**Se Falhar:**
- **Causa Provável:** Erro de integração
- **Ação:** Verificar console do navegador
- **Modo:** Debug (investigar erros)

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.5

---

### Tarefa 2.5.5: Implementar Visualização de Detalhes do Log

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar modal/drawer para visualizar detalhes completos de um log.

#### Arquivos a Criar/Modificar

```
frontend/src/components/logs/
├── LogDetailsDrawer.tsx    # Drawer de detalhes (CRIAR)
└── LogMetadataViewer.tsx   # Visualizador de metadata (CRIAR)
```

#### Implementação Detalhada

**1. Visualizador de metadata:**

```typescript
// frontend/src/components/logs/LogMetadataViewer.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface LogMetadataViewerProps {
  metadata: Record<string, any> | null;
}

export const LogMetadataViewer: React.FC<LogMetadataViewerProps> = ({ metadata }) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <Typography color="textSecondary">
        Nenhum metadata disponível
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Metadata
      </Typography>
      <Box component="pre" sx={{ fontSize: '12px', overflow: 'auto', m: 0 }}>
        {JSON.stringify(metadata, null, 2)}
      </Box>
    </Paper>
  );
};
```

**2. Drawer de detalhes:**

```typescript
// frontend/src/components/logs/LogDetailsDrawer.tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Button
} from '@mui/material';
import { Close as CloseIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { Log } from '../../types/logs';
import { LogLevelBadge } from './LogLevelBadge';
import { LogMetadataViewer } from './LogMetadataViewer';
import { format } from 'date-fns';

interface LogDetailsDrawerProps {
  log: Log | null;
  open: boolean;
  onClose: () => void;
  onViewCorrelation?: (requestId: string) => void;
}

export const LogDetailsDrawer: React.FC<LogDetailsDrawerProps> = ({
  log,
  open,
  onClose,
  onViewCorrelation
}) => {
  if (!log) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(log.id);
  };

  const handleCopyRequestId = () => {
    if (log.requestId) {
      navigator.clipboard.writeText(log.requestId);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Detalhes do Log</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Informações Principais */}
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              ID
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {log.id}
              </Typography>
              <IconButton size="small" onClick={handleCopyId}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Timestamp
            </Typography>
            <Typography variant="body2">
              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss.SSS')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Nível
            </Typography>
            <Box mt={0.5}>
              <LogLevelBadge level={log.level} />
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Mensagem
            </Typography>
            <Typography variant="body2">{log.message}</Typography>
          </Box>

          {log.requestId && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Request ID
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {log.requestId}
                </Typography>
                <IconButton size="small" onClick={handleCopyRequestId}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
              {onViewCorrelation && (
                <Button
                  size="small"
                  onClick={() => onViewCorrelation(log.requestId!)}
                  sx={{ mt: 1 }}
                >
                  Ver Logs Correlacionados
                </Button>
              )}
            </Box>
          )}

          {log.userId && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                User ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {log.userId}
              </Typography>
            </Box>
          )}

          {log.inferenceId && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Inference ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {log.inferenceId}
              </Typography>
            </Box>
          )}

          {log.error && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Erro
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', mt: 1 }}>
                {log.error.code && (
                  <Chip label={log.error.code} size="small" color="error" sx={{ mb: 1 }} />
                )}
                <Typography variant="body2">{log.error.message}</Typography>
                {log.error.stack && (
                  <Box component="pre" sx={{ fontSize: '10px', overflow: 'auto', mt: 1 }}>
                    {log.error.stack}
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {log.metadata && (
            <Box>
              <LogMetadataViewer metadata={log.metadata} />
            </Box>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};
```

#### Dependências

- ✅ Tarefa 2.5.4 (Página Principal)

#### Checkpoint 2.5.5: Visualização de Detalhes Implementada

**Critérios de Sucesso:**

- [ ] Drawer abre ao clicar em um log
- [ ] Todos os campos exibidos corretamente
- [ ] Botão de copiar IDs funciona
- [ ] Visualização de erro formatada
- [ ] Metadata exibida em JSON formatado

**Teste de Validação:**

```bash
# 1. Acessar página de logs
# 2. Clicar em um log
# 3. Verificar drawer abre
# 4. Verificar todos os campos
# 5. Testar botão copiar
```

**Se Falhar:**
- **Causa Provável:** Erro de renderização do drawer
- **Ação:** Verificar props e estado
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.6

---

### Tarefa 2.5.6: Implementar Correlação de Logs (Request ID)

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar visualização de logs correlacionados por requestId.

#### Arquivos a Criar/Modificar

```
frontend/src/components/logs/
└── LogCorrelationView.tsx  # Visualização de correlação (CRIAR)

frontend/src/pages/
└── LogsPage.tsx            # Adicionar correlação (MODIFICAR)
```

#### Implementação Detalhada

```typescript
// frontend/src/components/logs/LogCorrelationView.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Log } from '../../types/logs';
import { logsService } from '../../services/logsService';
import { LogLevelBadge } from './LogLevelBadge';
import { format } from 'date-fns';

interface LogCorrelationViewProps {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
}

export const LogCorrelationView: React.FC<LogCorrelationViewProps> = ({
  requestId,
  open,
  onClose
}) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestId && open) {
      fetchCorrelatedLogs();
    }
  }, [requestId, open]);

  const fetchCorrelatedLogs = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      const data = await logsService.getLogsByRequestId(requestId);
      setLogs(data);
    } catch (error) {
      console.error('Erro ao buscar logs correlacionados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Logs Correlacionados</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="textSecondary">
          Request ID: {requestId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Typography color="textSecondary">
            Nenhum log correlacionado encontrado
          </Typography>
        ) : (
          <Timeline position="right">
            {logs.map((log, index) => (
              <TimelineItem key={log.id}>
                <TimelineSeparator>
                  <TimelineDot color={log.level === 'error' ? 'error' : 'primary'} />
                  {index < logs.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <LogLevelBadge level={log.level} />
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{log.message}</Typography>
                    {log.metadata && (
                      <Box component="pre" sx={{ fontSize: '10px', mt: 0.5 }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </Box>
                    )}
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

#### Checkpoint 2.5.6: Correlação de Logs Implementada

**Critérios de Sucesso:**

- [ ] Dialog abre ao clicar em "Ver Correlacionados"
- [ ] Timeline exibe logs em ordem cronológica
- [ ] Logs correlacionados carregam corretamente
- [ ] UI clara e intuitiva

**Teste de Validação:**

```bash
# 1. Buscar logs com requestId
# 2. Abrir detalhes de um log
# 3. Clicar em "Ver Logs Correlacionados"
# 4. Verificar timeline aparece
# 5. Verificar ordem cronológica
```

**Se Falhar:**
- **Causa Provável:** Erro na API ou renderização
- **Ação:** Verificar chamada da API
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 2.5.7

---

### Tarefa 2.5.7: Adicionar Gráficos de Estatísticas

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar dashboard com gráficos de estatísticas de logs.

#### Arquivos a Criar/Modificar

```
frontend/src/components/logs/
├── LogsStatsChart.tsx      # Gráfico de estatísticas (CRIAR)
└── LogsStatsCards.tsx      # Cards de resumo (CRIAR)

frontend/src/pages/
└── LogsPage.tsx            # Adicionar stats (MODIFICAR)
```

#### Implementação Detalhada

**1. Cards de resumo:**

```typescript
// frontend/src/components/logs/LogsStatsCards.tsx
import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import { LogStatsResponse } from '../../types/logs';

interface LogsStatsCardsProps {
  stats: LogStatsResponse['stats'];
}

const iconMap = {
  error: <ErrorIcon color="error" />,
  warn: <WarningIcon color="warning" />,
  info: <InfoIcon color="info" />,
  debug: <DebugIcon />
};

export const LogsStatsCards: React.FC<LogsStatsCardsProps> = ({ stats }) => {
  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid item xs={12} sm={6} md={3} key={stat.level}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {iconMap[stat.level]}
                <Typography variant="h6" textTransform="capitalize">
                  {stat.level}
                </Typography>
              </Box>
              <Typography variant="h4">{stat.count}</Typography>
              <Typography variant="caption" color="textSecondary">
                logs registrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
```

**2. Gráfico de estatísticas:**

```typescript
// frontend/src/components/logs/LogsStatsChart.tsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { LogStatsResponse } from '../../types/logs';

interface LogsStatsChartProps {
  stats: LogStatsResponse['stats'];
}

const colorMap = {
  error: '#f44336',
  warn: '#ff9800',
  info: '#2196f3',
  debug: '#9e9e9e'
};

export const LogsStatsChart: React.FC<LogsStatsChartProps> = ({ stats }) => {
  const data = stats.map((stat) => ({
    level: stat.level.toUpperCase(),
    count: stat.count,
    fill: colorMap[stat.level]
  }));

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Distribuição de Logs por Nível
      </Typography>
      <Box height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Quantidade" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
```

**3. Integrar na página:**

```typescript
// frontend/src/pages/LogsPage.tsx (adicionar)
import { LogsStatsCards } from '../components/logs/LogsStatsCards';
import { LogsStatsChart } from '../components/logs/LogsStatsChart';

// Adicionar estado:
const [stats, setStats] = useState<LogStatsResponse['stats']>([]);

// Adicionar fetch:
useEffect(() => {
  fetchStats();
}, []);

const fetchStats = async () => {
  try {
    const response = await logsService.getLogStats();
    setStats(response.stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
  }
};

// Adicionar no JSX (antes da tabela):
{stats.length > 0 && (
  <>
    <LogsStatsCards stats={stats} />
    <Box mt={2}>
      <LogsStatsChart stats={stats} />
    </Box>
  </>
)}
```

#### Dependências

- ✅ Todas as tarefas anteriores
- ✅ recharts instalado (`npm install recharts`)

#### Checkpoint 2.5.7: Gráficos de Estatísticas Implementados

**Critérios de Sucesso:**

- [ ] Cards de resumo exibem contadores
- [ ] Gráfico de barras renderiza
- [ ] Cores corretas por nível
- [ ] Responsivo

**Teste de Validação:**

```bash
# 1. Acessar página de logs
# 2. Verificar cards no topo
# 3. Verificar gráfico abaixo
# 4. Verificar dados corretos
```

**Se Falhar:**
- **Causa Provável:** Biblioteca recharts não instalada
- **Ação:** Instalar recharts
- **Modo:** Code

**Se Passar:**
- **Próximo Passo:** Checkpoint Fase 2.5

---

### 🎯 Checkpoint de Fase 2.5: Dashboard Frontend Completo

**Critérios de Sucesso Global:**

- [ ] Serviço de API funcionando
- [ ] Componentes de busca e filtros funcionando
- [ ] Tabela de logs com paginação
- [ ] Página principal integrada
- [ ] Visualização de detalhes
- [ ] Correlação de logs por requestId
- [ ] Gráficos de estatísticas
- [ ] Performance < 100ms renderização
- [ ] UI responsiva
- [ ] Testes passando

**Teste de Validação Final:**

```bash
# 1. Build sem erros
cd frontend
npm run build

# 2. Testes passando
npm test

# 3. Acessar aplicação
npm run dev
# http://localhost:3000/logs

# 4. Testar todos os recursos:
# - Busca de logs
# - Filtros
# - Paginação
# - Detalhes do log
# - Correlação
# - Gráficos
```

**Se TODOS passarem:**
- ✅ **Fase 2.5 COMPLETA**
- ✅ **Avançar para Fase 3**

**Se ALGUM falhar:**
- ❌ **NÃO avançar para Fase 3**
- ❌ **Revisar tarefas com falha**

---

## 🔭 Fase 3: Observabilidade Avançada

### Estimativa Total: 10-15 dias úteis

### Objetivos Mensuráveis

- [ ] Docker Compose com Loki + Grafana funcionando
- [ ] Loki ingerindo logs em tempo real (< 5s latência)
- [ ] 3 Dashboards Grafana criados
- [ ] 2 Alertas configurados e funcionando
- [ ] SSE para logs em tempo real
- [ ] Documentação completa

---

### Tarefa 3.1: Configurar Docker Compose (Loki + Grafana + Promtail)

**Modo Primário:** Code  
**Modo Secundário:** Architect

#### Descrição

Criar configuração Docker Compose para stack de observabilidade.

#### Arquivos a Criar

```
docker/
├── docker-compose.observability.yml    # Compose file (CRIAR)
├── loki/
│   └── loki-config.yml                 # Config Loki (CRIAR)
├── promtail/
│   └── promtail-config.yml             # Config Promtail (CRIAR)
└── grafana/
    ├── datasources.yml                 # Datasources (CRIAR)
    └── dashboards/                     # Dashboards (CRIAR)
```

#### Implementação Detalhada

**1. Docker Compose:**

```yaml
# docker/docker-compose.observability.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml
      - loki-data:/loki
    command: -config.file=/etc/loki/loki-config.yml
    networks:
      - observability

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/promtail-config.yml
      - ../backend/logs:/var/log/myia
    command: -config.file=/etc/promtail/promtail-config.yml
    networks:
      - observability
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - grafana-data:/var/lib/grafana
    networks:
      - observability
    depends_on:
      - loki

networks:
  observability:
    driver: bridge

volumes:
  loki-data:
  grafana-data:
```

**2. Configuração Loki:**

```yaml
# docker/loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  retention_period: 720h  # 30 dias

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h
```

**3. Configuração Promtail:**

```yaml
# docker/promtail/promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: myia-backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: myia-backend
          __path__: /var/log/myia/*.log
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            requestId: requestId
            userId: userId
      - labels:
          level:
          requestId:
          userId:
      - timestamp:
          source: timestamp
          format: RFC3339
```

**4. Datasource Grafana:**

```yaml
# docker/grafana/datasources.yml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    isDefault: true
    editable: false
```

#### Checkpoint 3.1: Docker Compose Funcionando

**Critérios de Sucesso:**

- [ ] Todos os serviços iniciam sem erros
- [ ] Loki acessível em http://localhost:3100
- [ ] Grafana acessível em http://localhost:3002
- [ ] Promtail conectado ao Loki

**Teste de Validação:**

```bash
# 1. Iniciar serviços
cd docker
docker-compose -f docker-compose.observability.yml up -d

# 2. Verificar status
docker-compose -f docker-compose.observability.yml ps
# Esperado: todos "Up"

# 3. Verificar Loki
curl http://localhost:3100/ready
# Esperado: ready

# 4. Acessar Grafana
# http://localhost:3002
# Login: admin / admin
```

**Se Falhar:**
- **Causa Provável:** Portas ocupadas ou Docker não instalado
- **Ação:** Verificar portas e instalar Docker
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 3.2

---

### Tarefa 3.2: Integrar Winston com Loki

**Modo Primário:** Code  
**Modo Secundário:** Debug

#### Descrição

Configurar Winston para enviar logs diretamente para Loki.

#### Arquivos a Modificar

```
backend/src/utils/
└── logger.ts               # Adicionar transport Loki (MODIFICAR)

backend/package.json        # Adicionar winston-loki (MODIFICAR)
```

#### Implementação Detalhada

```typescript
// backend/src/utils/logger.ts (adicionar)
import LokiTransport from 'winston-loki';

// Adicionar transport Loki (apenas em produção)
if (process.env.NODE_ENV === 'production' && process.env.LOKI_URL) {
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://localhost:3100',
      labels: {
        app: 'myia-backend',
        environment: process.env.NODE_ENV || 'development'
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      }
    })
  );
}
```

#### Checkpoint 3.2: Winston Integrado com Loki

**Critérios de Sucesso:**

- [ ] Transport Loki configurado
- [ ] Logs aparecem no Loki
- [ ] Latência < 5s
- [ ] Fallback funciona se Loki falhar

**Teste de Validação:**

```bash
# 1. Configurar variável de ambiente
export LOKI_URL=http://localhost:3100

# 2. Iniciar backend
cd backend
npm run dev

# 3. Fazer requisições
curl http://localhost:3001/api/health

# 4. Verificar logs no Loki
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={app="myia-backend"}'

# Esperado: JSON com logs
```

**Se Falhar:**
- **Causa Provável:** Loki não acessível ou config incorreta
- **Ação:** Verificar conectividade
- **Modo:** Debug

**Se Passar:**
- **Próximo Passo:** Tarefa 3.3

---

### Tarefa 3.3: Criar Dashboards Grafana

**Modo Primário:** Frontend Specialist  
**Modo Secundário:** Code

#### Descrição

Criar 3 dashboards Grafana para monitoramento.

#### Dashboards a Criar

1. **Dashboard de Erros**
2. **Dashboard de Latência**
3. **Dashboard de Uso**

#### Implementação Detalhada

**Dashboard 1: Erros**

```json
// docker/grafana/dashboards/errors-dashboard.json
{
  "dashboard": {
    "title": "MyIA - Erros",
    "panels": [
      {
        "title": "Taxa de Erro (%)",
        "targets": [
          {
            "expr": "sum(rate({app=\"myia-backend\",level=\"error\"}[5m])) / sum(rate({app=\"myia-backend\"}[5m])) * 100"
          }
        ]
      },
      {
        "title": "Top 10 Erros",
        "targets": [
          {
            "expr": "topk(10, sum by (message) (count_over_time({app=\"myia-backend\",level=\"error\"}[1h])))"
          }
        ]
      },
      {
        "title": "Erros por Endpoint",
        "targets": [
          {
            "expr": "sum by (endpoint) (count_over_time({app=\"myia-backend\",level=\"error\"}[1h]))"
          }
        ]
      },
      {
        "title": "Timeline de Erros",
        "targets": [
          {
            "expr": "sum(count_over_time({app=\"myia-backend\",level=\"error\"}[1m]))"
          }
        ]
      }
    ]
  }
}
```

**Dashboard 2: Latência**

```json
// docker/grafana/dashboards/latency-dashboard.json
{
  "dashboard": {
    "title": "MyIA - Latência",
    "panels": [
      {
        "title": "Latência P50/P