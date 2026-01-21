// backend/src/middleware/validators/settingsValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * Schema de validação para atualização de configurações do usuário
 * IMPORTANTE: O validateRequest middleware passa { body, query, params }
 */
export const updateSettingsSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    
    // Campos AWS Bedrock
    awsAccessKey: z.string().optional(),
    awsSecretKey: z.string().optional(),
    awsRegion: z.string().optional(),
    awsEnabledModels: z.array(z.string()).optional(),
    
    // Outras chaves de API
    openaiApiKey: z.string().optional(),
    groqApiKey: z.string().optional(),
    claudeApiKey: z.string().optional(),
    togetherApiKey: z.string().optional(),
    perplexityApiKey: z.string().optional(),
    mistralApiKey: z.string().optional(),
  }).strict() // strict() impede campos desconhecidos
});

/**
 * Schema de validação para atualização de credenciais de API
 */
export const updateCredentialsSchema = z.object({
  body: z.object({
    provider: z.string().min(1, 'Provider é obrigatório'),
    apiKey: z.string().min(10, 'API Key deve ter no mínimo 10 caracteres'),
  }).strict()
});
