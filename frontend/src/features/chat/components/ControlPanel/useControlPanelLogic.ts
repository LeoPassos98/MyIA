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
  } = useLayout();

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentEditorTab(newValue);
  };

  // Constantes de Dados (Providers & Models)
  const providerOptions = [
    { value: 'groq', label: 'Groq (LLaMA 3.1 - Gratuito)' },
    { value: 'openai', label: 'OpenAI (GPT-3.5/4)' },
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'together', label: 'Together.ai' },
    { value: 'perplexity', label: 'Perplexity' },
    { value: 'mistral', label: 'Mistral' },
  ];

  const modelOptions: Record<string, string[]> = {
    groq: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'],
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    together: ['meta-llama/Llama-3-70b-chat-hf'],
    perplexity: ['llama-3.1-sonar-small-128k-online'],
    mistral: ['mistral-large-latest', 'mistral-medium-latest'],
  };

  return {
    // State
    currentEditorTab,
    chatConfig,
    manualContext,
    chatHistorySnapshot,
    providerOptions,
    modelOptions,
    
    // Actions
    handleTabChange,
    updateChatConfig,
    setManualContext,
    toggleMessageSelection
  };
};
