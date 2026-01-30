// backend/scripts/test-aws-error-logging.ts
// Script para testar o logging melhorado de erros AWS no BedrockProvider

import { BedrockProvider } from '../src/services/ai/providers/bedrock';
import logger from '../src/utils/logger';

/**
 * Testa o logging de erros AWS forçando diferentes tipos de erro
 */
async function testAWSErrorLogging() {
  logger.info('🧪 [Test] Iniciando teste de logging de erros AWS...');
  
  const provider = new BedrockProvider('us-east-1');
  
  // Teste 1: Credenciais inválidas (deve gerar erro de autenticação)
  logger.info('\n📋 [Test 1] Testando erro de credenciais inválidas...');
  try {
    const invalidCredentials = 'INVALID_KEY:INVALID_SECRET';
    const generator = provider.streamChat(
      [{ role: 'user', content: 'Hello' }],
      {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        apiKey: invalidCredentials,
        temperature: 0.7,
        maxTokens: 100,
      }
    );
    
    for await (const chunk of generator) {
      if (chunk.type === 'error') {
        logger.info('✅ [Test 1] Erro capturado conforme esperado');
        break;
      }
    }
  } catch (error) {
    logger.info('✅ [Test 1] Erro capturado no catch');
  }
  
  // Teste 2: Modelo inexistente (deve gerar ValidationException)
  logger.info('\n📋 [Test 2] Testando erro de modelo inexistente...');
  try {
    // Usar credenciais do .env se disponíveis
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!awsKey || !awsSecret) {
      logger.warn('⚠️ [Test 2] Credenciais AWS não encontradas no .env, pulando teste');
    } else {
      const credentials = `${awsKey}:${awsSecret}`;
      const generator = provider.streamChat(
        [{ role: 'user', content: 'Hello' }],
        {
          modelId: 'invalid.model.id.that.does.not.exist',
          apiKey: credentials,
          temperature: 0.7,
          maxTokens: 100,
        }
      );
      
      for await (const chunk of generator) {
        if (chunk.type === 'error') {
          logger.info('✅ [Test 2] Erro capturado conforme esperado');
          break;
        }
      }
    }
  } catch (error) {
    logger.info('✅ [Test 2] Erro capturado no catch');
  }
  
  logger.info('\n✅ [Test] Teste de logging de erros AWS concluído!');
  logger.info('\n📊 [Test] Verifique os logs acima para validar que todos os campos estão presentes:');
  logger.info('   - modelId, originalModelId, attempt, maxRetries');
  logger.info('   - errorName, errorMessage, errorCode, errorType');
  logger.info('   - metadata.httpStatusCode, metadata.requestId, metadata.attempts, metadata.totalRetryDelay');
  logger.info('   - fault, service, retryable');
  logger.info('   - errorStack, rawError');
}

// Executar teste
testAWSErrorLogging()
  .then(() => {
    logger.info('\n🎉 [Test] Todos os testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ [Test] Erro durante execução dos testes:', error);
    process.exit(1);
  });
