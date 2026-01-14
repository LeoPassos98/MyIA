// backend/src/routes/providers.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { jsend } from '../utils/jsend';
import { protect } from '../middleware/auth';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '../utils/logger';

const router = Router();

router.get('/bedrock/models', protect, async (_req, res: Response, next: NextFunction) => {
  try {
    const models = await prisma.aIModel.findMany({
      where: {
        provider: {
          slug: 'bedrock',
          isActive: true
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        apiModelId: true,
        costPer1kInput: true,
        costPer1kOutput: true,
        contextWindow: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(jsend.success({ models }));
  } catch (error) {
    next(error);
  }
});

// Endpoint para listar providers configurados pelo usuário
router.get('/configured', protect, async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // Buscar validação AWS
    const awsValidation = await prisma.providerCredentialValidation.findUnique({
      where: { userId_provider: { userId, provider: 'bedrock' } }
    });

    // Buscar todos os providers ativos
    const allProviders = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: { models: { where: { isActive: true } } },
      orderBy: { name: 'asc' }
    });

    // Filtrar providers baseado em configuração
    const configuredProviders = allProviders.filter(provider => {
      // Providers padrão (sempre disponíveis)
      if (['openai', 'groq', 'together'].includes(provider.slug)) {
        return true;
      }

      // AWS Bedrock: só mostrar se validado
      if (provider.slug === 'bedrock') {
        if (awsValidation?.status === 'valid' && settings?.awsEnabledModels?.length) {
          // Filtrar apenas modelos habilitados
          provider.models = provider.models.filter(m => 
            settings.awsEnabledModels.includes(m.apiModelId)
          );
          return provider.models.length > 0;
        }
        return false;
      }

      return true;
    });

    res.json(jsend.success({ providers: configuredProviders }));
  } catch (error) {
    next(error);
  }
});

router.post('/bedrock/validate', protect, async (req: any, res: Response, _next: NextFunction): Promise<Response | void> => {
  const startTime = Date.now();
  const userId = req.userId!;
  const { accessKey, secretKey, region } = req.body;

  logger.info('AWS_VALIDATION_START', { userId, region, timestamp: new Date() });

  try {
    if (!accessKey || !secretKey || !region) {
      return res.status(400).json(jsend.fail({ message: 'Credenciais incompletas' }));
    }

    const client = new BedrockRuntimeClient({
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
    });

    // Testa com modelo mais barato (Haiku)
    const testModelId = 'us.anthropic.claude-3-haiku-20240307-v1:0';
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    };

    const command = new InvokeModelCommand({
      modelId: testModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    await client.send(command);
    const latencyMs = Date.now() - startTime;

    // Salvar validação bem-sucedida
    await prisma.providerCredentialValidation.upsert({
      where: { userId_provider: { userId, provider: 'bedrock' } },
      update: {
        status: 'valid',
        lastValidatedAt: new Date(),
        lastError: null,
        errorCode: null,
        validatedModels: [testModelId],
        latencyMs
      },
      create: {
        userId,
        provider: 'bedrock',
        status: 'valid',
        lastValidatedAt: new Date(),
        validatedModels: [testModelId],
        latencyMs
      }
    });

    logger.info('AWS_VALIDATION_SUCCESS', { userId, region, latencyMs, timestamp: new Date() });

    res.json(jsend.success({ 
      status: 'valid', 
      latencyMs,
      message: 'Credenciais válidas! Você pode selecionar os modelos agora.' 
    }));
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const errorCode = error.name || 'UnknownError';
    const errorMessage = error.message || 'Erro desconhecido';

    // Mapear erros AWS para mensagens amigáveis
    let userMessage = 'Erro ao validar credenciais';
    let suggestion = 'Verifique suas credenciais e tente novamente';

    if (errorCode.includes('InvalidSignature') || errorCode.includes('InvalidAccessKeyId')) {
      userMessage = 'Access Key ou Secret Key inválidos';
      suggestion = 'Verifique se copiou as credenciais corretamente';
    } else if (errorCode.includes('UnrecognizedClient')) {
      userMessage = 'Credenciais não reconhecidas';
      suggestion = 'Verifique se a Access Key está ativa no console AWS';
    } else if (errorCode.includes('AccessDenied')) {
      userMessage = 'Sem permissão para acessar Bedrock';
      suggestion = 'Adicione a policy AmazonBedrockFullAccess ao usuário IAM';
    } else if (errorCode.includes('ResourceNotFound')) {
      userMessage = 'Modelo não disponível nesta região';
      suggestion = `Tente usar us-east-1 ou us-west-2`;
    }

    // Salvar validação com erro
    await prisma.providerCredentialValidation.upsert({
      where: { userId_provider: { userId, provider: 'bedrock' } },
      update: {
        status: 'invalid',
        lastValidatedAt: new Date(),
        lastError: errorMessage,
        errorCode,
        latencyMs
      },
      create: {
        userId,
        provider: 'bedrock',
        status: 'invalid',
        lastValidatedAt: new Date(),
        lastError: errorMessage,
        errorCode,
        latencyMs
      }
    });

    logger.error('AWS_VALIDATION_FAILED', { 
      userId, 
      region, 
      errorCode, 
      errorMessage, 
      suggestion,
      latencyMs,
      timestamp: new Date() 
    });

    res.json(jsend.success({ 
      status: 'invalid', 
      error: userMessage,
      suggestion,
      errorCode,
      latencyMs
    }));
  }
});

export default router;
