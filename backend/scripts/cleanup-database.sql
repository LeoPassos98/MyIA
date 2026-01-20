-- backend/scripts/cleanup-database.sql
-- Script de limpeza do banco de dados
-- Remove modelos, providers e certificações obsoletos
-- MANTÉM: usuários e configurações gerais

BEGIN TRANSACTION;

-- 1. Limpar certificações (sem dependências)
DELETE FROM model_certifications;

-- 2. Limpar modelos (sem dependências)
DELETE FROM ai_models;

-- 3. Limpar credenciais de providers (referencia ai_providers)
DELETE FROM user_provider_credentials;

-- 4. Limpar providers (agora pode ser deletado)
DELETE FROM ai_providers;

-- 5. Resetar sequences
PRAGMA foreign_keys=off;
DELETE FROM sqlite_sequence WHERE name IN ('model_certifications', 'ai_models', 'user_provider_credentials', 'ai_providers');
PRAGMA foreign_keys=on;

-- 6. Verificar limpeza
SELECT 'Modelos restantes:' as info, COUNT(*) as count FROM ai_models
UNION ALL
SELECT 'Providers restantes:', COUNT(*) FROM ai_providers
UNION ALL
SELECT 'Certificações restantes:', COUNT(*) FROM model_certifications
UNION ALL
SELECT 'Credenciais restantes:', COUNT(*) FROM user_provider_credentials
UNION ALL
SELECT 'Usuários mantidos:', COUNT(*) FROM users
UNION ALL
SELECT 'Configurações mantidas:', COUNT(*) FROM user_settings;

COMMIT;
