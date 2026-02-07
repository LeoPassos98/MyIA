// backend/src/services/chat/orchestrator/index.ts

import { prisma } from '../../../lib/prisma';
import { ChatOrchestrator } from './ChatOrchestrator';
import { MessageValidator } from './validators/MessageValidator';
import { ContextValidator } from './validators/ContextValidator';
import { ChatManager } from './handlers/ChatManager';
import { StreamErrorHandler } from './handlers/StreamErrorHandler';
import { SuccessHandler } from './handlers/SuccessHandler';
import { PayloadBuilder } from './builders/PayloadBuilder';
import { ConfigBuilder } from './builders/ConfigBuilder';

/**
 * Factory para criar instância do ChatOrchestrator com todas as dependências
 * Mantém compatibilidade com código existente que usa chatOrchestratorService
 */
export function createChatOrchestrator(): ChatOrchestrator {
  return new ChatOrchestrator(
    new MessageValidator(),
    new ContextValidator(),
    new ChatManager(prisma),
    new PayloadBuilder(),
    new ConfigBuilder(),
    new StreamErrorHandler(),
    new SuccessHandler()
  );
}

/**
 * Instância singleton para compatibilidade com código existente
 */
export const chatOrchestratorService = createChatOrchestrator();

// Exports para uso direto
export { ChatOrchestrator };
export type { ProcessMessageParams } from './ChatOrchestrator';
