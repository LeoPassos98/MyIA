import { createContext, useState, useContext, ReactNode } from 'react';

interface LayoutContextType {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (isOpen: boolean) => void;
  currentEditorTab: number;
  setCurrentEditorTab: (tabIndex: number) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditorTab, setCurrentEditorTab] = useState(0);

  return (
    <LayoutContext.Provider value={{ 
      isHistoryOpen, setIsHistoryOpen, 
      isEditorOpen, setIsEditorOpen,
      currentEditorTab, setCurrentEditorTab
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
