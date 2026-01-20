// frontend/src/contexts/HeaderSlotsContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HeaderSlotsState = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  brandText?: string;
};

type HeaderSlotsContextValue = {
  slots: HeaderSlotsState;
  setSlots: (next: HeaderSlotsState) => void;
  resetSlots: () => void;
};

const HeaderSlotsContext = createContext<HeaderSlotsContextValue | null>(null);

export function HeaderSlotsProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlotsState] = useState<HeaderSlotsState>({});

  const setSlots = useCallback((next: HeaderSlotsState) => {
    setSlotsState(next);
  }, []);

  const resetSlots = useCallback(() => {
    setSlotsState({});
  }, []);

  const value = useMemo(
    () => ({
      slots,
      setSlots,
      resetSlots,
    }),
    [slots, setSlots, resetSlots]
  );

  return <HeaderSlotsContext.Provider value={value}>{children}</HeaderSlotsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHeaderSlots() {
  const ctx = useContext(HeaderSlotsContext);
  if (!ctx) {
    throw new Error('useHeaderSlots must be used within HeaderSlotsProvider');
  }
  return ctx;
}
