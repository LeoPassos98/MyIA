// backend/src/middleware/validators/chatValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * Schema de validação para envio de mensagens no chat
 */
export const sendMessageSchema = z.object({
  chatId: z.string().uuid('ID do chat deve ser um UUID válido').optional(),
  message: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(10000, 'Mensagem muito longa (máximo 10.000 caracteres)'),
  
  // Configurações opcionais
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topK: z.number().min(1).max(100).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  
  // Contexto manual/pipeline
  selectedMessageIds: z.array(z.string().uuid()).optional(),
  contextConfig: z.object({
    systemPrompt: z.string().optional(),
    pinnedEnabled: z.boolean().optional(),
    recentEnabled: z.boolean().optional(),
    recentCount: z.number().min(1).max(50).optional(),
    ragEnabled: z.boolean().optional(),
    ragTopK: z.number().min(1).max(20).optional(),
    maxContextTokens: z.number().min(100).max(20000).optional(),
  }).optional(),
});
