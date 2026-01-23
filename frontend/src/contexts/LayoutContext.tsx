// frontend/src/contexts/LayoutContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatConfig, ManualContextState, Message, ContextPipelineConfig } from '../features/chat/types';

interface LayoutContextType {
  // Drawer states
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  currentEditorTab: number;
  setCurrentEditorTab: (tab: number) => void;

  // Chat configuration
  chatConfig: ChatConfig;
  updateChatConfig: (partialConfig: Partial<ChatConfig>) => void;

  // Context Pipeline configuration
  contextConfig: ContextPipelineConfig;
  updateContextConfig: (partialConfig: Partial<ContextPipelineConfig>) => void;

  // Manual context state
  manualContext: ManualContextState;
  setManualContext: (state: ManualContextState) => void;
  toggleMessageSelection: (messageId: string) => void;

  // Chat history snapshot (readonly mirror)
  chatHistorySnapshot: Message[];
  syncChatHistory: (messages: Message[]) => void;

  // History drawer state
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;

  // Pin callback (set by chat page, used by control panel)
  onUnpinMessage?: (messageId: string) => void;
  setOnUnpinMessage: (callback: ((messageId: string) => void) | undefined) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  // Drawer states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditorTab, setCurrentEditorTab] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Chat configuration with safe defaults
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    strategy: 'efficient',
    temperature: 0.7,
    topK: 40,           // Valor padrão mais comum
    topP: 0.9,          // ADICIONAR - Nucleus sampling padrão
    maxTokens: 2048,    // ADICIONAR - Limite de saída padrão
    memoryWindow: 10,
    isAutoMode: true,   // ✅ NOVO - Modo Auto ativado por padrão
  });

  // Context Pipeline configuration (valores conservadores para Groq free tier: 12K TPM limit)
  const [contextConfig, setContextConfig] = useState<ContextPipelineConfig>({
    systemPrompt: 'Você é uma IA útil e direta.',
    useCustomSystemPrompt: false,
    pinnedEnabled: true,
    recentEnabled: true,
    recentCount: 5, // Reduzido para evitar contexto muito grande
    ragEnabled: true,
    ragTopK: 3, // Reduzido para evitar contexto muito grande
    maxContextTokens: 4000, // Seguro para Groq (deixa margem para resposta)
  });

  // Manual context state
  const [manualContext, setManualContext] = useState<ManualContextState>({
    isActive: false, // Mantido para compatibilidade
    selectedMessageIds: [],
    additionalText: '',
    hasAdditionalContext: false,
  });

  // Chat history snapshot
  const [chatHistorySnapshot, setChatHistorySnapshot] = useState<Message[]>([]);

  // Pin callback state (needs to trigger re-render when changed)
  const [onUnpinMessage, setOnUnpinMessageState] = useState<((messageId: string) => void) | undefined>(undefined);
  const setOnUnpinMessage = useCallback((callback: ((messageId: string) => void) | undefined) => {
    setOnUnpinMessageState(() => callback);
  }, []);

  // Update chat config (partial update)
  const updateChatConfig = useCallback((partialConfig: Partial<ChatConfig>) => {
    setChatConfig((prev) => ({ ...prev, ...partialConfig }));
  }, []);

  // Update context pipeline config (partial update)
  const updateContextConfig = useCallback((partialConfig: Partial<ContextPipelineConfig>) => {
    setContextConfig((prev) => ({ ...prev, ...partialConfig }));
  }, []);

  // Sync chat history - CRITICAL: Prevent infinite re-render loops
  const syncChatHistory = useCallback((messages: Message[]) => {
    setChatHistorySnapshot((prev) => {
      // Quick size check first
      if (prev.length !== messages.length) {
        return messages;
      }
      
      // Deep comparison including isPinned status
      const prevJson = JSON.stringify(prev.map(m => ({ id: m.id, content: m.content, isPinned: m.isPinned })));
      const newJson = JSON.stringify(messages.map(m => ({ id: m.id, content: m.content, isPinned: m.isPinned })));
      
      if (prevJson !== newJson) {
        return messages;
      }
      
      return prev; // No change, return previous reference
    });
  }, []);

  // Toggle message selection for manual context
  const toggleMessageSelection = useCallback((messageId: string) => {
    setManualContext((prev) => {
      const isSelected = prev.selectedMessageIds.includes(messageId);
      const newSelectedIds = isSelected
        ? prev.selectedMessageIds.filter((id) => id !== messageId)
        : [...prev.selectedMessageIds, messageId];
      
      return {
        ...prev,
        selectedMessageIds: newSelectedIds,
      };
    });
  }, []);

  const value: LayoutContextType = {
    isEditorOpen,
    setIsEditorOpen,
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
    syncChatHistory,
    isHistoryOpen,
    setIsHistoryOpen,
    onUnpinMessage,
    setOnUnpinMessage,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

// Custom hook for consuming the context
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}