// frontend/src/features/chat/hooks/index.ts
// Exportações centralizadas dos hooks de chat

export { useChatLogic } from './useChatLogic';
export { useChatValidation } from './useChatValidation';
export { useChatCleanup } from './useChatCleanup';
export { useChatNavigation, useAuthRedirect } from './useChatNavigation';
export { useChatMessages } from './useChatMessages';
export { useChatStreaming } from './useChatStreaming';

// Re-exporta tipos
export type { ValidationResult, ManualContext, ChatValidationHook } from './useChatValidation';
export type { CleanupResources, ChatCleanupHook } from './useChatCleanup';
export type { ChatNavigationHook } from './useChatNavigation';
export type { ChatMessagesHook } from './useChatMessages';
export type { 
  TelemetryMetrics, 
  StreamCallbacks, 
  ChatPayload, 
  ChatStreamingHook 
} from './useChatStreaming';
