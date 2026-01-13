-- backend/scripts/add-aws-bedrock.sql
-- Adiciona modelos AWS Bedrock (Claude 3)

INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'Claude 3.5 Sonnet',
  id,
  3.0,
  15.0,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'anthropic.claude-3-haiku-20240307-v1:0',
  'Claude 3 Haiku',
  id,
  0.25,
  1.25,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'anthropic.claude-v2:1',
  'Claude 2.1',
  id,
  8.0,
  24.0,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;
