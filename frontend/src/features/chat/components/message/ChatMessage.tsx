// frontend/src/features/chat/components/message/ChatMessage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import { Message } from '../../types';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { useAudit } from '../../../audit/context/AuditContext';

interface ChatMessageProps {
  message: Message;
  isDevMode?: boolean;
  onTogglePin?: (messageId: string) => void;
}

function ChatMessage({ message, isDevMode = false, onTogglePin }: ChatMessageProps) {
  const { openAudit } = useAudit();

  const handleViewPayload = () => {
    openAudit({
      messageId: message.id,
      mode: 'payload',
      source: 'chat',
    });
  };

  const handleOpenPromptTrace = () => {
    window.open(`/prompt-trace/${message.id}`, '_blank');
  };

  // Decide qual componente renderizar baseado no role
  if (message.role === 'user') {
    return (
      <UserMessage
        message={message}
        isDevMode={isDevMode}
        onTogglePin={onTogglePin}
      />
    );
  }

  return (
    <AssistantMessage
      message={message}
      isDevMode={isDevMode}
      onTogglePin={onTogglePin}
      onViewPayload={handleViewPayload}
      onOpenTrace={handleOpenPromptTrace}
    />
  );
}

// Memoização para evitar re-renders desnecessários
export default memo(ChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isPinned === nextProps.message.isPinned &&
    prevProps.isDevMode === nextProps.isDevMode
  );
});
