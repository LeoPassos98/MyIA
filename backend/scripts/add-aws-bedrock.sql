-- backend/scripts/add-aws-bedrock.sql
-- Adiciona modelos AWS Bedrock (Claude 3.5)

-- Claude 3.5 Sonnet v2 (Cross-Region Inference Profile)
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'Claude 3.5 Sonnet v2',
  id,
  3.0,
  15.0,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3.5 Sonnet v1
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  'Claude 3.5 Sonnet v1',
  id,
  3.0,
  15.0,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3 Haiku
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'Claude 3 Haiku',
  id,
  0.25,
  1.25,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;

-- Claude 3 Opus
INSERT INTO ai_models (id, "apiModelId", name, "providerId", "costPer1kInput", "costPer1kOutput", "isActive", "updatedAt")
SELECT 
  gen_random_uuid(),
  'us.anthropic.claude-3-opus-20240229-v1:0',
  'Claude 3 Opus',
  id,
  15.0,
  75.0,
  true,
  CURRENT_TIMESTAMP
FROM ai_providers WHERE slug = 'bedrock'
ON CONFLICT DO NOTHING;
