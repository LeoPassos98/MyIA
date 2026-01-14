-- backend/scripts/cleanup-bedrock-models.sql
-- Remove modelos Bedrock antigos/duplicados

-- Deletar modelos sem prefixo us. (deprecated)
DELETE FROM ai_models 
WHERE "providerId" IN (SELECT id FROM ai_providers WHERE slug = 'bedrock')
AND "apiModelId" NOT LIKE 'us.%';

-- Verificar modelos restantes
SELECT "apiModelId", name, "isActive" 
FROM ai_models 
WHERE "providerId" IN (SELECT id FROM ai_providers WHERE slug = 'bedrock')
ORDER BY name;
