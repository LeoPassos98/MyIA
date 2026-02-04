// frontend-admin/src/pages/Certifications.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { ObservabilityPageLayout } from '@/components/PageLayout/ObservabilityPageLayout';
import { ObservabilitySection } from '@/components/PageLayout/ObservabilityPageLayout/ObservabilitySection';
import { StatsOverview } from '@/components/Certifications/StatsOverview';
import { CertificationForm } from '@/components/Certifications/CertificationForm';
import { JobHistoryTable } from '@/components/Certifications/JobHistoryTable';
import { SystemSettings } from '@/components/Certifications/SystemSettings';
import { AWSStatusBanner } from '@/components/Certifications/AWSStatusBanner';
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
      {/* Banner de status AWS - sempre visível no topo */}
      <AWSStatusBanner />
      
      <ObservabilitySection id="overview" title="Visão Geral">
        <StatsOverview />
      </ObservabilitySection>

      <ObservabilitySection id="certify" title="Certificar Modelos">
        <CertificationForm />
      </ObservabilitySection>

      <ObservabilitySection id="history" title="Histórico">
        <JobHistoryTable />
      </ObservabilitySection>

      <ObservabilitySection id="settings" title="Configurações">
        <SystemSettings />
      </ObservabilitySection>
    </ObservabilityPageLayout>
  );
}
