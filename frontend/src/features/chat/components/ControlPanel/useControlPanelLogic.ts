import React from 'react';
import { useLayout } from '../../../../contexts/LayoutContext';

export const useControlPanelLogic = () => {
  const {
    currentEditorTab,
    setCurrentEditorTab,
    chatConfig,
    updateChatConfig,
    contextConfig,
    updateContextConfig,
    manualContext,
    setManualContext,
    toggleMessageSelection,
    chatHistorySnapshot,
    onUnpinMessage,
  } = useLayout();

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentEditorTab(newValue);
  };

  return {
    // State
    currentEditorTab,
    chatConfig,
    contextConfig,
    manualContext,
    chatHistorySnapshot,
    
    // Actions
    handleTabChange,
    updateChatConfig,
    updateContextConfig,
    setManualContext,
    toggleMessageSelection,
    onUnpinMessage,
  };
};
