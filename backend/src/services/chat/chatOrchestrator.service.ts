// backend/src/services/chat/chatOrchestrator.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * ARQUIVO REFATORADO - Agora é apenas um re-export
 * 
 * A implementação foi modularizada em:
 * - orchestrator/ChatOrchestrator.ts (orquestração principal)
 * - orchestrator/validators/* (validação)
 * - orchestrator/handlers/* (gestão de chat, erros, sucesso)
 * - orchestrator/builders/* (payload, configuração)
 * 
 * Ver: docs/refactoring/plans/chatOrchestrator-modularization-plan.md
 */

export { chatOrchestratorService } from './orchestrator';
export type { ProcessMessageParams } from './orchestrator';
