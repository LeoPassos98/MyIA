# Proposta: Frontend Admin - Sistema de Certificação de Modelos

## Sumário Executivo

Este documento propõe a implementação de uma aplicação frontend dedicada para administração do sistema MyIA, com foco inicial no **Sistema de Certificação de Modelos via Workers (Bull + Redis)**.

**Decisões Arquiteturais**:
- ✅ Frontend separado (`frontend-admin/`) + Backend compartilhado (Opção 2A)
- ✅ Usar `ObservabilityPageLayout` do frontend principal (análise completa em [`OBSERVABILITY-LAYOUT-ANALYSIS.md`](./OBSERVABILITY-LAYOUT-ANALYSIS.md))

---

## 1. Visão Geral

### 1.1 Objetivo

Criar uma interface administrativa para:
- Gerenciar certificações de modelos AWS Bedrock por região
- Monitorar jobs de certificação em tempo real
- Visualizar histórico e métricas de certificação
- Configurar sistema de workers

### 1.2 Escopo Inicial (MVP)

**Funcionalidades Fase 1**:
- ✅ Login admin com verificação de role
- ✅ Dashboard de certificações (visão geral)
- ✅ Formulário de certificação (por região/vendor)
- ✅ Monitoramento de jobs ativos (SSE)
- ✅ Histórico de certificações
- ✅ Integração com Bull Board

**Funcionalidades Futuras**:
- ⏳ Gerenciamento de usuários
- ⏳ Configurações do sistema
- ⏳ Logs e auditoria
- ⏳ Métricas de performance

---

## 2. Arquitetura

### 2.1 Estrutura de Diretórios

```
MyIA/
├── backend/                 (porta 3001)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chatRoutes.ts
│   │   │   └── admin/       ← NOVO
│   │   │       ├── index.ts
│   │   │       ├── certificationRoutes.ts
│   │   │       └── userRoutes.ts
│   │   ├── middleware/
│   │   │   └── isAdmin.ts   ← NOVO
│   │   └── services/
│   │       └── certification-queue.service.ts  ← NOVO
│   └── worker.ts            ← NOVO
│
├── frontend/                (porta 3000)
│   └── src/
│       ├── components/      ← Componentes reutilizáveis
│       ├── features/
│       └── contexts/
│
└── frontend-admin/          (porta 3003) ← NOVO
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   └── Certifications.tsx
    │   ├── components/
    │   │   ├── shared/      ← Importados do frontend principal
    │   │   └── admin/       ← Específicos do admin
    │   ├── hooks/
    │   ├── services/
    │   └── App.tsx
    ├── public/
    ├── package.json
    └── vite.config.ts
```

### 2.2 Componentes Reutilizáveis

**Do Frontend Principal** (`frontend/src/components/`):
- ✅ **`ObservabilityPageLayout`** - Layout com sidebar/drawer + scroll spy (⭐ PRINCIPAL)
- ✅ `StatusBadge` - Badges de status (✅⚠️❌)
- ✅ `MetricBadge` - Badges de métricas
- ✅ `LoadingScreen` - Tela de carregamento
- ✅ `Logo` - Logo da aplicação
- ✅ `CertificationBadge` - Badge de certificação

**Novos para Admin** (`frontend-admin/src/components/admin/`):
- 🆕 `StatsCard` - Card de estatísticas
- 🆕 `RegionStatusTable` - Tabela de status por região
- 🆕 `ActiveJobCard` - Card de job ativo
- 🆕 `JobHistoryTable` - Tabela de histórico
- 🆕 `CertificationForm` - Formulário de certificação

**Análise Completa**: Ver [`OBSERVABILITY-LAYOUT-ANALYSIS.md`](./OBSERVABILITY-LAYOUT-ANALYSIS.md) para análise detalhada do `ObservabilityPageLayout`.

### 2.3 Stack Tecnológico

| Categoria | Tecnologia | Versão | Motivo |
|-----------|-----------|--------|--------|
| **Framework** | React | 18.3.1 | Mesmo do frontend principal |
| **UI Library** | Material-UI | 6.5.0 | Consistência visual |
| **Build Tool** | Vite | 5.4.6 | Performance |
| **State Management** | React Query | 5.90.19 | Cache e sincronização |
| **Routing** | React Router | 6.26.2 | Navegação |
| **HTTP Client** | Axios | 1.7.7 | Requisições API |
| **Charts** | Recharts | 3.6.0 | Gráficos de métricas |
| **TypeScript** | TypeScript | 5.6.2 | Type safety |

---

## 2.4 ObservabilityPageLayout - Layout Base ⭐

### Por que Usar?

O componente [`ObservabilityPageLayout`](../frontend/src/components/PageLayout/ObservabilityPageLayout/) do frontend principal é **PERFEITO** para o admin:

- ✅ **Sidebar Fixa** (desktop) - Navegação entre seções
- ✅ **Drawer Mobile** - Responsivo automaticamente
- ✅ **Scroll Spy** - Detecta seção ativa
- ✅ **Navegação Suave** - Scroll suave entre seções
- ✅ **Acessibilidade** - ARIA labels, navegação por teclado
- ✅ **Performance** - Otimizado com `useMemo` e `useCallback`

**Análise Completa**: Ver [`OBSERVABILITY-LAYOUT-ANALYSIS.md`](./OBSERVABILITY-LAYOUT-ANALYSIS.md)

**Conclusão**: ✅ Usar como está, **SEM modificações**.

### Exemplo de Uso

```tsx
// frontend-admin/src/pages/Certifications.tsx
import { useState } from 'react';
import { ObservabilityPageLayout } from '@/components/PageLayout/ObservabilityPageLayout';
import { ObservabilitySection } from '@/components/PageLayout/ObservabilityPageLayout/ObservabilitySection';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

export function CertificationsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: <DashboardIcon /> },
    { id: 'certify', label: 'Certificar', icon: <PlayArrowIcon /> },
    { id: 'history', label: 'Histórico', icon: <HistoryIcon /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> }
  ];

  return (
    <ObservabilityPageLayout
      sections={sections}
      drawerOpen={drawerOpen}
      onOpenDrawer={() => setDrawerOpen(true)}
      onCloseDrawer={() => setDrawerOpen(false)}
    >
      {/* Seção 1: Visão Geral */}
      <ObservabilitySection id="overview" title="Visão Geral">
        <StatsOverview />
        <RegionStatusTable />
        <ActiveJobs />
      </ObservabilitySection>

      {/* Seção 2: Certificar */}
      <ObservabilitySection id="certify" title="Certificar Modelos">
        <CertificationForm />
      </ObservabilitySection>

      {/* Seção 3: Histórico */}
      <ObservabilitySection id="history" title="Histórico">
        <JobHistoryTable />
      </ObservabilitySection>

      {/* Seção 4: Configurações */}
      <ObservabilitySection id="settings" title="Configurações">
        <SystemSettings />
        <BullBoardLink />
      </ObservabilitySection>
    </ObservabilityPageLayout>
  );
}
```

### Benefícios

| Aspecto | Sem ObservabilityPageLayout | Com ObservabilityPageLayout |
|---------|----------------------------|----------------------------|
| **Código** | ~500 linhas | ~50 linhas |
| **Tempo** | 3 dias | 0.5 dia |
| **Manutenção** | Alta | Baixa |
| **Responsividade** | Manual | Automática |
| **Acessibilidade** | Manual | Automática |

**Economia**: 90% menos código + 2.5 dias mais rápido!

---

## 3. Páginas e Funcionalidades

### 3.1 Página de Login (`/login`)

**Objetivo**: Autenticação de administradores

**Componentes**:
- `LoginForm` - Formulário de login
- `Logo` - Logo da aplicação (reutilizado)

**Fluxo**:
1. Admin insere email e senha
2. Backend valida credenciais e verifica `role === 'admin'`
3. Retorna token JWT com role
4. Redireciona para `/dashboard`

**API**:
```typescript
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, email, role } }
```

---

### 3.2 Dashboard (`/dashboard`)

**Objetivo**: Visão geral do sistema de certificação

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 Painel de Certificações                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │ ✅ Certificados │ ⚠️ Warnings │ ❌ Falhos │ ❓ Não Testados│  │
│ │     245         │     18      │    37     │     50      │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                             │
│ 🌍 Status por Região:                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ us-east-1    ✅ 48  ⚠️ 2   ❌ 0   [Certificar]          │ │
│ │ us-west-2    ✅ 45  ⚠️ 3   ❌ 2   [Certificar]          │ │
│ │ eu-west-1    ✅ 42  ⚠️ 5   ❌ 3   [Certificar]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⏳ Jobs Ativos (2):                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Job #456 | us-west-2 | Anthropic (10 modelos)           │ │
│ │ [████████░░] 8/10 modelos • 2min restantes              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Componentes**:
- `StatsCard` - Cards de métricas (4 cards)
- `RegionStatusTable` - Tabela de status por região
- `ActiveJobCard` - Cards de jobs ativos
- `JobProgressBar` - Barra de progresso (MUI LinearProgress)

**APIs**:
```typescript
GET /api/admin/certifications/stats
Response: {
  certified: 245,
  warnings: 18,
  failed: 37,
  untested: 50
}

GET /api/admin/certifications/regions
Response: [
  { region: 'us-east-1', certified: 48, warnings: 2, failed: 0 },
  ...
]

GET /api/admin/certifications/jobs/active
Response: [
  { 
    id: '456', 
    region: 'us-west-2', 
    vendor: 'anthropic',
    progress: { current: 8, total: 10 },
    estimatedTime: 120000
  },
  ...
]
```

**SSE para Jobs Ativos**:
```typescript
// frontend-admin/src/hooks/useActiveJobs.ts
const eventSource = new EventSource('/api/admin/certifications/stream');

eventSource.addEventListener('job-progress', (event) => {
  const job = JSON.parse(event.data);
  updateJobProgress(job);
});
```

---

### 3.3 Página de Certificações (`/certifications`)

**Objetivo**: Gerenciar certificações de modelos

**Abas**:
1. **Certificar** - Formulário para iniciar certificações
2. **Histórico** - Lista de jobs completados
3. **Bull Board** - Link para dashboard Bull

#### Aba 1: Certificar

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Certificar Modelos                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Região: [Todas as Regiões ▼]                               │
│ Vendor: [Todos ▼] [Anthropic] [Amazon] [Cohere]            │
│                                                             │
│ [🚀 Certificar Tudo]  [🔄 Re-certificar Falhos]            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ us-east-1 (N. Virginia)    50 modelos  [Certificar]  │ │
│ │ ☐ us-west-2 (Oregon)         50 modelos  [Certificar]  │ │
│ │ ☐ eu-west-1 (Ireland)        50 modelos  [Certificar]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚙️ Configurações Avançadas:                                 │
│ ☑ Forçar re-certificação (ignorar cache)                   │
│ ☑ Certificar em paralelo (máx 3 regiões)                   │
│ ☐ Notificar por email ao concluir                          │
└─────────────────────────────────────────────────────────────┘
```

**Componentes**:
- `CertificationForm` - Formulário principal
- `RegionCheckboxList` - Lista de regiões com checkboxes
- `VendorSelector` - Seletor de vendor (reutilizado do frontend)
- `AdvancedSettings` - Configurações avançadas

**API**:
```typescript
POST /api/admin/certifications/certify-region-async
Body: {
  region: 'us-east-1',
  vendor: 'anthropic',
  force: false
}
Response: {
  jobId: 'abc123',
  modelsCount: 10
}
```

#### Aba 2: Histórico

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Histórico de Certificações                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Filtros: [Data ▼] [Região ▼] [Vendor ▼] [Status ▼]         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Job #455 | 31/01 14:23 | us-east-1 | Anthropic          │ │
│ │ ✅ Concluído | 10 modelos | 2min 15s | 100% sucesso      │ │
│ │ [Ver Relatório] [Exportar CSV]                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Job #454 | 31/01 12:10 | sa-east-1 | Todos              │ │
│ │ ⚠️ Concluído com Avisos | 50 modelos | 8min | 60%       │ │
│ │ [Ver Relatório] [Tentar Novamente]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Componentes**:
- `JobHistoryTable` - Tabela de histórico (MUI DataGrid)
- `JobFilters` - Filtros de busca
- `JobReportModal` - Modal com detalhes do job

**API**:
```typescript
GET /api/admin/certifications/jobs?page=1&limit=20&region=us-east-1
Response: {
  jobs: [
    {
      id: '455',
      createdAt: '2026-01-31T14:23:00Z',
      region: 'us-east-1',
      vendor: 'anthropic',
      status: 'completed',
      modelsCount: 10,
      duration: 135000,
      successRate: 100
    },
    ...
  ],
  total: 150,
  page: 1,
  limit: 20
}
```

---

## 4. Componentes Detalhados

### 4.1 StatsCard

**Propósito**: Exibir métricas de certificação

**Props**:
```typescript
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}
```

**Exemplo de Uso**:
```tsx
<StatsCard
  title="Certificados"
  value={245}
  icon={<CheckCircleIcon />}
  color="success"
  trend={{ value: 12, direction: 'up' }}
/>
```

**Reutilização**: Baseado em `MetricBadge` do frontend principal

---

### 4.2 RegionStatusTable

**Propósito**: Exibir status de certificação por região

**Props**:
```typescript
interface RegionStatusTableProps {
  regions: RegionStatus[];
  onCertify: (region: string) => void;
}

interface RegionStatus {
  region: string;
  name: string;
  certified: number;
  warnings: number;
  failed: number;
  untested: number;
}
```

**Exemplo de Uso**:
```tsx
<RegionStatusTable
  regions={[
    { 
      region: 'us-east-1', 
      name: 'US East (N. Virginia)',
      certified: 48,
      warnings: 2,
      failed: 0,
      untested: 0
    },
    ...
  ]}
  onCertify={(region) => startCertification(region)}
/>
```

**Componente MUI**: `Table` + `TableBody` + `TableRow`

---

### 4.3 ActiveJobCard

**Propósito**: Exibir job ativo com progresso em tempo real

**Props**:
```typescript
interface ActiveJobCardProps {
  job: ActiveJob;
  onCancel: (jobId: string) => void;
}

interface ActiveJob {
  id: string;
  region: string;
  vendor: string;
  progress: {
    current: number;
    total: number;
  };
  currentModel: string;
  estimatedTime: number;
}
```

**Exemplo de Uso**:
```tsx
<ActiveJobCard
  job={{
    id: '456',
    region: 'us-west-2',
    vendor: 'anthropic',
    progress: { current: 8, total: 10 },
    currentModel: 'Claude 3 Haiku',
    estimatedTime: 120000
  }}
  onCancel={(jobId) => cancelJob(jobId)}
/>
```

**Componente MUI**: `Card` + `LinearProgress` + `Typography`

---

## 5. Hooks Customizados

### 5.1 useActiveJobs

**Propósito**: Gerenciar jobs ativos com SSE

```typescript
// frontend-admin/src/hooks/useActiveJobs.ts
import { useState, useEffect } from 'react';

interface ActiveJob {
  id: string;
  region: string;
  vendor: string;
  progress: { current: number; total: number };
  currentModel: string;
  estimatedTime: number;
}

export function useActiveJobs() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Buscar jobs ativos iniciais
    fetchActiveJobs();

    // 2. Conectar SSE para atualizações em tempo real
    const eventSource = new EventSource('/api/admin/certifications/stream');

    eventSource.addEventListener('job-progress', (event) => {
      const job = JSON.parse(event.data);
      updateJobProgress(job);
    });

    eventSource.addEventListener('job-complete', (event) => {
      const job = JSON.parse(event.data);
      removeJob(job.id);
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setError('Erro na conexão SSE');
    };

    return () => eventSource.close();
  }, []);

  const fetchActiveJobs = async () => {
    try {
      const response = await axios.get('/api/admin/certifications/jobs/active');
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      setError('Erro ao buscar jobs ativos');
      setLoading(false);
    }
  };

  const updateJobProgress = (updatedJob: ActiveJob) => {
    setJobs(prev => 
      prev.map(job => job.id === updatedJob.id ? updatedJob : job)
    );
  };

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  return { jobs, loading, error };
}
```

---

### 5.2 useCertificationForm

**Propósito**: Gerenciar formulário de certificação

```typescript
// frontend-admin/src/hooks/useCertificationForm.ts
import { useState } from 'react';
import axios from 'axios';

interface CertificationFormData {
  regions: string[];
  vendor: string;
  force: boolean;
  parallel: boolean;
  notifyEmail: boolean;
}

export function useCertificationForm() {
  const [formData, setFormData] = useState<CertificationFormData>({
    regions: [],
    vendor: 'all',
    force: false,
    parallel: false,
    notifyEmail: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/admin/certifications/certify-regions-async', {
        regions: formData.regions,
        vendor: formData.vendor,
        force: formData.force,
        parallel: formData.parallel,
        notifyEmail: formData.notifyEmail
      });

      return response.data.jobIds;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao iniciar certificação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    handleSubmit
  };
}
```

---

## 6. Reutilização de Componentes

### 6.1 Componentes Compartilhados

**Estratégia**: Criar symlink ou copiar componentes reutilizáveis

**Opção 1: Symlink** (Recomendado)
```bash
cd frontend-admin/src
ln -s ../../frontend/src/components/Badges ./components/shared/Badges
ln -s ../../frontend/src/components/Feedback ./components/shared/Feedback
```

**Opção 2: Copiar** (Mais simples)
```bash
cp -r frontend/src/components/Badges frontend-admin/src/components/shared/
cp -r frontend/src/components/Feedback frontend-admin/src/components/shared/
```

**Componentes a Reutilizar**:
- ✅ `Badges/StatusBadge` - Badge de status (✅⚠️❌)
- ✅ `Badges/MetricBadge` - Badge de métricas
- ✅ `Feedback/LoadingScreen` - Tela de carregamento
- ✅ `Logo` - Logo da aplicação
- ✅ `CertificationBadge` - Badge de certificação

---

## 7. Configuração e Setup

### 7.1 Criar Aplicação Admin

```bash
# 1. Criar aplicação Vite + React + TypeScript
cd MyIA
npx create-vite frontend-admin --template react-ts

# 2. Instalar dependências
cd frontend-admin
npm install

# 3. Instalar Material-UI (mesma versão do frontend)
npm install @mui/material@6.5.0 @mui/icons-material@6.5.0 @emotion/react@11.13.3 @emotion/styled@11.13.0

# 4. Instalar outras dependências
npm install axios@1.7.7 react-router-dom@6.26.2 @tanstack/react-query@5.90.19 recharts@3.6.0
```

### 7.2 Configurar Vite

**frontend-admin/vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

### 7.3 Configurar package.json

**frontend-admin/package.json**:
```json
{
  "name": "myia-frontend-admin",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3003",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## 8. Plano de Implementação (ATUALIZADO)

### Fase 1: Setup Inicial (1 dia)
- [ ] Criar aplicação `frontend-admin/` com Vite
- [ ] Instalar dependências (MUI, React Router, Axios)
- [ ] Configurar Vite (porta 3003, proxy)
- [ ] Criar estrutura de pastas
- [ ] Configurar tema MUI (copiar do frontend)
- [ ] **Copiar `ObservabilityPageLayout` do frontend** ⭐

### Fase 2: Autenticação (1 dia)
- [ ] Criar página de login (`/login`)
- [ ] Implementar `useAuth` hook
- [ ] Criar `ProtectedRoute` component
- [ ] Integrar com backend (`POST /api/auth/login`)
- [ ] Armazenar token JWT

### Fase 3: Página de Certificações com ObservabilityPageLayout (2 dias) ⭐ REDUZIDO
- [ ] Criar página Certifications (`/certifications`) usando `ObservabilityPageLayout`
- [ ] Definir seções (Visão Geral, Certificar, Histórico, Configurações)
- [ ] Implementar seção "Visão Geral" (`StatsCard`, `RegionStatusTable`, `ActiveJobCard`)
- [ ] Implementar seção "Certificar" (`CertificationForm`)
- [ ] Implementar seção "Histórico" (`JobHistoryTable`)
- [ ] Implementar seção "Configurações" (link para Bull Board)

### Fase 4: Componentes Admin (2 dias)
- [ ] Implementar `StatsCard` component
- [ ] Implementar `RegionStatusTable` component
- [ ] Implementar `ActiveJobCard` component
- [ ] Implementar `CertificationForm` component
- [ ] Implementar `JobHistoryTable` component

### Fase 5: Componentes Reutilizáveis (0.5 dia) ⭐ REDUZIDO
- [ ] Copiar/Symlink componentes do frontend
- [ ] Adaptar `StatusBadge` para admin
- [ ] Adaptar `MetricBadge` para admin

### Fase 6: Hooks Customizados (1 dia)
- [ ] Implementar `useActiveJobs` hook (SSE)
- [ ] Implementar `useCertificationForm` hook
- [ ] Implementar `useJobHistory` hook
- [ ] Implementar `useRegionStatus` hook

### Fase 7: Testes (1.5 dias) ⭐ REDUZIDO
- [ ] Testar login admin
- [ ] Testar página de certificações (todas as seções)
- [ ] Testar SSE (jobs ativos)
- [ ] Testar responsividade (desktop + mobile)

### Fase 8: Documentação (1 dia)
- [ ] Documentar componentes admin
- [ ] Criar guia de uso para admins
- [ ] Documentar APIs admin
- [ ] Criar README do frontend-admin

**Total Estimado**: 10 dias ⭐ (antes: 12 dias)

**Economia**: 2 dias (17% mais rápido) graças ao uso do `ObservabilityPageLayout`

---

## 9. Segurança

### 9.1 Autenticação

- ✅ Token JWT com role `admin`
- ✅ Verificação de role no backend (middleware `isAdmin()`)
- ✅ Token armazenado em `httpOnly cookie`
- ✅ Expiração de token (30 minutos)
- ✅ Refresh token automático

### 9.2 Autorização

- ✅ Todas as rotas admin protegidas por `isAdmin()`
- ✅ Rate limiting específico para admin (500 req/15min)
- ✅ Logging de auditoria de ações admin
- ✅ CORS restritivo (apenas domínio admin)

### 9.3 Proteção de Dados

- ✅ HTTPS obrigatório em produção
- ✅ Sanitização de inputs
- ✅ Validação de parâmetros no backend
- ✅ Erros genéricos no frontend

---

## 10. Deploy

### 10.1 Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"

  frontend-admin:
    build: ./frontend-admin
    ports:
      - "3002:80"
    environment:
      - VITE_API_URL=http://localhost:3001

  backend:
    build: ./backend
    ports:
      - "3001:3001"

  worker:
    build: ./backend
    command: npm run worker

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=myia
```

### 10.2 Nginx (Produção)

```nginx
# Frontend principal
server {
  listen 80;
  server_name myia.com;
  root /var/www/frontend;
  index index.html;
}

# Frontend admin
server {
  listen 80;
  server_name admin.myia.com;
  root /var/www/frontend-admin;
  index index.html;
  
  # Proteção adicional: Bloquear IPs externos
  allow 192.168.1.0/24;  # Rede interna
  deny all;
}

# Backend
server {
  listen 80;
  server_name api.myia.com;
  
  location /api/admin {
    # Bloquear acesso direto de IPs externos
    allow 192.168.1.0/24;
    deny all;
    
    proxy_pass http://backend:3001;
  }
  
  location /api {
    proxy_pass http://backend:3001;
  }
}
```

---

## 11. Próximos Passos

1. **Aprovação da Proposta**: Revisar e aprovar este documento
2. **Setup Inicial**: Criar `frontend-admin/` e configurar dependências
3. **Implementação Backend**: Criar rotas admin e middleware `isAdmin()`
4. **Implementação Frontend**: Seguir plano de implementação (Fase 1-8)
5. **Testes**: Validar funcionalidades e segurança
6. **Deploy**: Configurar Docker Compose e Nginx
7. **Documentação**: Criar guias de uso e manutenção

---

## 12. Perguntas e Respostas

### Q1: Por que frontend separado em vez de lazy loading?
**R**: Frontend separado oferece melhor isolamento de segurança e permite deploy independente, mesmo que adicione complexidade.

### Q2: Por que reutilizar componentes do frontend principal?
**R**: Consistência visual, menos código duplicado, manutenção mais fácil.

### Q3: Por que Material-UI?
**R**: Já usado no frontend principal, biblioteca madura, componentes prontos, boa documentação.

### Q4: Como compartilhar código entre frontends?
**R**: Symlink ou copiar componentes reutilizáveis. Futuramente, considerar monorepo.

### Q5: Como garantir segurança?
**R**: Middleware `isAdmin()` no backend, token JWT com role, rate limiting, logging de auditoria, CORS restritivo.

---

## 13. Referências

- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [Server-