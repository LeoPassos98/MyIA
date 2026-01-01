// frontend/src/features/chat/hooks/useChatInput.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, KeyboardEvent } from 'react';

interface UseChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isDrawerOpen: boolean;
}

export function useChatInput({ 
  inputMessage, 
  setInputMessage, 
  onSend, 
  isLoading,
  isDrawerOpen
}: UseChatInputProps) {
  
  // Estado do Histórico (Terminal-like)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 = digitando novo, 0 = ultima msg
  const [draft, setDraft] = useState(''); // Guarda o que você estava escrevendo antes de subir

  const handleSend = () => {
    // Validações antes de enviar
    if (!inputMessage.trim() || isLoading || isDrawerOpen) return;

    // 1. Adiciona ao histórico (Evita duplicatas no topo)
    setHistory(prev => {
      if (prev.length > 0 && prev[0] === inputMessage) return prev;
      return [inputMessage, ...prev];
    });

    // 2. Reseta estados
    setHistoryIndex(-1);
    setDraft('');
    
    // 3. Dispara envio
    onSend();
  };

  const isSelectionCollapsed = (el: HTMLTextAreaElement | HTMLInputElement) => {
    return el.selectionStart === el.selectionEnd;
  };

  const isAtStart = (el: HTMLTextAreaElement | HTMLInputElement) => {
    return (
      typeof el.selectionStart === 'number' &&
      el.selectionStart === 0 &&
      isSelectionCollapsed(el)
    );
  };

  const isAtEnd = (el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
    return (
      typeof el.selectionStart === 'number' &&
      el.selectionStart === value.length &&
      isSelectionCollapsed(el)
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLTextAreaElement | HTMLInputElement;

    // ✅ NÃO interceptar TAB: deixa o comportamento padrão (navegar foco)
    if (e.key === 'Tab') return;

    // ENTER para enviar (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSend();
      return;
    }

    // SETA PRA CIMA (Recuperar anterior)
    // ✅ Só ativa histórico se o cursor estiver no início do texto (não atrapalha navegação no input)
    if (e.key === 'ArrowUp') {
      if (!target || !isAtStart(target)) return;

      if (history.length > 0 && historyIndex < history.length - 1) {
        e.preventDefault();
        
        // Se é a primeira vez subindo, salva o rascunho atual
        if (historyIndex === -1) setDraft(inputMessage);

        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInputMessage(history[nextIndex]);
      }
      return;
    }

    // SETA PRA BAIXO (Voltar para o presente)
    // ✅ Só ativa histórico se o cursor estiver no final do texto
    if (e.key === 'ArrowDown') {
      if (!target || !isAtEnd(target, inputMessage)) return;

      if (historyIndex > -1) {
        e.preventDefault();
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);

        if (prevIndex === -1) {
          setInputMessage(draft); // Restaura o rascunho
        } else {
          setInputMessage(history[prevIndex]);
        }
      }
      return;
    }
  };

  return {
    handleSend,
    handleKeyDown
  };
}
