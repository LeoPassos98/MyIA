import type { ReactNode } from 'react';

/**
 * Representa uma seção navegável no layout de observabilidade
 */
export interface ObservabilitySectionItem {
  /** ID único da seção (usado para scroll e navegação) */
  id: string;
  /** Label exibido na sidebar/drawer */
  label: string;
  /** Ícone opcional para a seção */
  icon?: ReactNode;
}

/**
 * Props do layout principal (sem header próprio - usa slots do MainHeader)
 */
export interface ObservabilityPageLayoutProps {
  /** Lista de seções navegáveis */
  sections: ObservabilitySectionItem[];
  /** Conteúdo da página (deve usar ObservabilitySection) */
  children: ReactNode;
  /** ID da seção ativa por padrão */
  defaultSectionId?: string;
  /** Offset do topo para scroll (altura do MainHeader) */
  topOffset?: number;
  /** Drawer aberto (controlado externamente) */
  drawerOpen: boolean;
  /** Callback para abrir drawer */
  onOpenDrawer: () => void;
  /** Callback para fechar drawer */
  onCloseDrawer: () => void;
}

/**
 * Props da sidebar
 */
export interface ObservabilitySidebarProps {
  sections: ObservabilitySectionItem[];
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
}

/**
 * Props do drawer mobile
 */
export interface ObservabilityDrawerProps {
  sections: ObservabilitySectionItem[];
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
  open: boolean;
  onClose: () => void;
}

/**
 * Props de uma seção individual
 */
export interface ObservabilitySectionProps {
  /** ID único da seção */
  id: string;
  /** Título da seção */
  title: string;
  /** Conteúdo da seção */
  children: ReactNode;
  /** Scroll margin top para compensar headers fixos */
  scrollMarginTop?: number;
}
