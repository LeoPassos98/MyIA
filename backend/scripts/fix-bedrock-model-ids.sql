-- backend/scripts/fix-bedrock-model-ids.sql
-- Corrige IDs dos modelos AWS Bedrock para usar Cross-Region Inference Profiles
-- 
-- PROBLEMA: Modelos estavam usando IDs regionais antigos que não existem
-- SOLUÇÃO: Atualizar para IDs com prefixo "us." (Cross-Region Inference Profiles)

-- 1. Remover todos os modelos Bedrock antigos
DELETE FROM ai_models 
WHERE "providerId" IN (SELECT id FROM ai_providers WHERE slug = 'bedrock');

-- 2. Adicionar modelos com IDs corretos (Cross-Region Inference Profiles)

-- Claude 3.5 Sonnet v2 (Mais recente)
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "contextWindow", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'Claude 3.5 Sonnet v2',
  id,
  3.0,
  15.0,
  200000,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3.5 Sonnet v1
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "contextWindow", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  'Claude 3.5 Sonnet v1',
  id,
  3.0,
  15.0,
  200000,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3 Haiku (Modelo rápido e econômico)
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "contextWindow", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'Claude 3 Haiku',
  id,
  0.25,
  1.25,
  200000,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3 Opus (Modelo mais poderoso)
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "contextWindow", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-opus-20240229-v1:0',
  'Claude 3 Opus',
  id,
  15.0,
  75.0,
  200000,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- 3. Verificar modelos inseridos
SELECT 
  "apiModelId", 
  name, 
  "isActive",
  "costPer1kInput",
  "costPer1kOutput",
  "contextWindow"
FROM ai_models 
WHERE "providerId" IN (SELECT id FROM ai_providers WHERE slug = 'bedrock')
ORDER BY name;

-- 4. Informações sobre os modelos
-- 
-- Cross-Region Inference Profiles (prefixo "us."):
-- - Disponíveis em múltiplas regiões AWS
-- - Melhor disponibilidade e latência
-- - IDs padronizados que funcionam em qualquer região
-- 
-- Referência: https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html
