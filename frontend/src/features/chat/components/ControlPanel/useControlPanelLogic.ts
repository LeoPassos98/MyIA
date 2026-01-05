import React from 'react';
import { useLayout } from '../../../../contexts/LayoutContext';

export const useControlPanelLogic = () => {
  const {
    currentEditorTab,
    setCurrentEditorTab,
    chatConfig,
    updateChatConfig,
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
    manualContext,
    chatHistorySnapshot,
    
    // Actions
    handleTabChange,
    updateChatConfig,
    setManualContext,
    toggleMessageSelection,
    onUnpinMessage,
  };
};
