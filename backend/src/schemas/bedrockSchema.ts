// backend/src/schemas/bedrockSchema.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { z } from 'zod';

// Lista de regiões AWS permitidas para Bedrock
// ✅ CORREÇÃO: Adicionar todas as regiões suportadas pelo AWS Bedrock
const allowedRegions = [
  // Estados Unidos
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  // Ásia-Pacífico
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  // Canadá
  'ca-central-1',
  // Europa
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  // América do Sul
  'sa-east-1',
] as const;

// Regex para Access Key AWS (formato: AKIA + 16 caracteres = 20 total)
// ✅ CORREÇÃO: Access Key começa com AKIA seguido de 16 caracteres alfanuméricos
const accessKeyRegex = /^AKIA[0-9A-Z]{16}$/;

// Regex para Secret Key AWS (40 caracteres alfanuméricos + / e +)
// ✅ CORREÇÃO: Secret Key tem exatamente 40 caracteres
const secretKeyRegex = /^[A-Za-z0-9/+]{40}$/;

// Schema para validação do body
const bedrockConfigBodySchema = z.object({
  useStoredCredentials: z.boolean().optional().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.enum(allowedRegions, {
    errorMap: () => ({ message: 'Região AWS inválida para Bedrock' }),
  }),
}).refine(
  (data) => {
    // ✅ CORREÇÃO: Se useStoredCredentials=true OU se não tem secretKey, permitir
    // Isso cobre o caso de "Teste Rápido" onde o backend busca credenciais do banco
    if (data.useStoredCredentials || !data.secretKey) {
      console.log('🔍 [bedrockSchema] Validação: usando credenciais armazenadas ou teste rápido');
      return true;
    }
    
    // ✅ Se tem secretKey, validar formato completo
    console.log('🔍 [bedrockSchema] Validação: credenciais novas fornecidas, validando formato...');
    const isValid = (
      data.accessKey &&
      accessKeyRegex.test(data.accessKey) &&
      data.secretKey &&
      secretKeyRegex.test(data.secretKey)
    );
    
    if (!isValid) {
      console.log('❌ [bedrockSchema] Validação falhou:', {
        hasAccessKey: !!data.accessKey,
        accessKeyValid: data.accessKey ? accessKeyRegex.test(data.accessKey) : false,
        hasSecretKey: !!data.secretKey,
        secretKeyValid: data.secretKey ? secretKeyRegex.test(data.secretKey) : false
      });
    }
    
    return isValid;
  },
  {
    message: 'Credenciais inválidas: Access Key deve começar com AKIA e ter 20 caracteres, Secret Key deve ter 40 caracteres',
    path: ['accessKey', 'secretKey'],
  }
);

// Schema completo para validateRequest middleware (espera body, query, params)
export const bedrockConfigSchema = z.object({
  body: bedrockConfigBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export type BedrockConfig = z.infer<typeof bedrockConfigBodySchema>;