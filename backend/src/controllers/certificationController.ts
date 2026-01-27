// backend/src/controllers/certificationController.ts
// Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ModelCertificationService, ProgressEvent } from '../services/ai/certification';
import { AWSCredentialsService } from '../services/awsCredentialsService';
import { prisma } from '../lib/prisma';
import { jsend } from '../utils/jsend';
import { logger } from '../utils/logger';

const certificationService = new ModelCertificationService();

/**
 * GET /api/certification/check/:modelId
 * Verifica se existe certificação em cache (SEM rate limiting)
 *
 * Este endpoint é chamado ANTES do POST /certify-model para evitar
 * consumo desnecessário de rate limit quando o resultado já está em cache.
 *
 * Fluxo recomendado:
 * 1. Frontend chama GET /check/:modelId (sem rate limit)
 * 2. Se cached=true: usar resultado do cache
 * 3. Se cached=false: chamar POST /certify-model (com rate limit)
 */
export const checkCertificationCache = async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    // Verificar apenas cache, não executar testes
    const cached = await certificationService.getCachedCertification(modelId);
    
    if (cached) {
      return res.json(jsend.success({
        cached: true,
        certification: cached
      }));
    }
    
    return res.json(jsend.success({
      cached: false
    }));
  } catch (error: any) {
    logger.error('Erro ao verificar cache de certificação', {
      requestId: (req as any).id,
      modelId: req.params.modelId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json(jsend.error('Erro ao verificar cache'));
  }
};

/**
 * POST /api/certification/certify-model
 * Certifica um modelo específico (COM rate limiting de 10 req/min)
 * Busca credenciais AWS do banco de dados do usuário
 *
 * IMPORTANTE: Este endpoint tem rate limiting aplicado.
 * Recomenda-se chamar GET /check/:modelId primeiro para verificar cache.
 *
 * Body params:
 * - modelId: string (obrigatório) - ID do modelo a certificar
 * - force: boolean (opcional) - Se true, ignora cache e força re-certificação
 */
export const certifyModel = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('POST /certify-model recebido', {
      requestId: req.id,
      userId: req.userId
    });
    
    const { modelId, force = false } = req.body;
    const userId = req.userId;
    
    if (!modelId) {
      logger.warn('modelId não fornecido', {
        requestId: req.id,
        userId
      });
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    if (!userId) {
      logger.warn('userId não autenticado', {
        requestId: req.id
      });
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    // Buscar credenciais AWS do banco
    logger.info('Buscando credenciais AWS', {
      requestId: req.id,
      userId,
      modelId,
      force
    });
    
    const credentials = await AWSCredentialsService.getCredentials(userId);
    
    if (!credentials) {
      logger.warn('Credenciais AWS não encontradas', {
        requestId: req.id,
        userId
      });
      return res.status(400).json(
        jsend.fail({ message: 'Credenciais AWS não configuradas' })
      );
    }
    
    // Certificar modelo (com parâmetro force)
    logger.info('Iniciando certificação do modelo', {
      requestId: req.id,
      userId,
      modelId,
      force,
      region: credentials.region
    });
    
    const result = await certificationService.certifyModel(modelId, credentials, force);
    
    logger.info('Resultado da certificação', {
      requestId: req.id,
      userId,
      modelId: result.modelId,
      status: result.status,
      isCertified: result.isCertified,
      isAvailable: result.isAvailable,
      successRate: result.successRate
    });
    
    // ========================================================================
    // CORREÇÃO: Verificar isAvailable PRIMEIRO, depois status específico
    // ========================================================================
    //
    // Problema anterior: A condição `!result.isCertified || !result.isAvailable`
    // retornava 400 para quality_warning porque isCertified=false, mesmo com
    // isAvailable=true.
    //
    // Lógica correta:
    // 1. Se isAvailable=false: retornar 400 (modelo não pode ser usado)
    // 2. Se isAvailable=true E status=quality_warning: retornar 200 com aviso
    // 3. Se isAvailable=true E isCertified=true: retornar 200 (sucesso completo)
    // ========================================================================
    
    // Se modelo está indisponível (não pode ser usado), retornar 400
    if (!result.isAvailable) {
      const errorMessage = result.categorizedError?.message ||
        (result.results && result.results.length > 0 && result.results[0].error
          ? result.results[0].error
          : 'Modelo indisponível ou falhou nos testes de certificação');
      
      logger.warn('Modelo indisponível', {
        requestId: req.id,
        userId,
        modelId,
        errorMessage,
        categorizedError: result.categorizedError
      });
      
      return res.status(400).json(jsend.fail({
        message: errorMessage,
        certification: result,
        isAvailable: false,
        categorizedError: result.categorizedError
      }));
    }
    
    // Se modelo está disponível mas com warning de qualidade, retornar 200 com aviso
    if (result.status === 'quality_warning') {
      logger.warn('Modelo disponível mas com limitações de qualidade', {
        requestId: req.id,
        userId,
        modelId,
        successRate: result.successRate
      });
      
      return res.status(200).json(jsend.success({
        message: 'Modelo disponível mas com limitações de qualidade',
        certification: result,
        isAvailable: true,
        categorizedError: result.categorizedError
      }));
    }

    // Sucesso completo
    logger.info('Modelo certificado com sucesso', {
      requestId: req.id,
      userId,
      modelId,
      status: result.status,
      successRate: result.successRate
    });
    
    return res.status(200).json(jsend.success({
      message: 'Modelo certificado com sucesso',
      certification: result,
      isAvailable: true
    }));
  } catch (error: any) {
    logger.error('Erro ao certificar modelo', {
      requestId: req.id,
      userId: req.userId,
      modelId: req.body.modelId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to certify model')
    );
  }
};

/**
 * POST /api/certification/certify-vendor
 * Certifica todos os modelos de um vendor
 * Busca credenciais AWS do banco de dados do usuário
 */
export const certifyVendor = async (req: AuthRequest, res: Response) => {
  try {
    const { vendor } = req.body;
    const userId = req.userId;
    
    if (!vendor) {
      return res.status(400).json(
        jsend.fail({ message: 'vendor is required' })
      );
    }
    
    if (!userId) {
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    // Buscar credenciais AWS do banco
    const credentials = await AWSCredentialsService.getCredentials(userId);
    
    if (!credentials) {
      return res.status(400).json(
        jsend.fail({ message: 'Credenciais AWS não configuradas' })
      );
    }
    
    // Certificar vendor
    const results = await certificationService.certifyVendor(vendor, credentials);
    
    return res.status(200).json(jsend.success({ certifications: results }));
  } catch (error: any) {
    return res.status(500).json(
      jsend.error(error.message || 'Failed to certify vendor')
    );
  }
};

/**
 * POST /api/certification/certify-all
 * Certifica todos os modelos
 * Busca credenciais AWS do banco de dados do usuário
 */
export const certifyAll = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    // Buscar credenciais AWS do banco
    const credentials = await AWSCredentialsService.getCredentials(userId);
    
    if (!credentials) {
      return res.status(400).json(
        jsend.fail({ message: 'Credenciais AWS não configuradas' })
      );
    }
    
    // Certificar todos os modelos
    const results = await certificationService.certifyAll(credentials);
    
    return res.status(200).json(jsend.success({ certifications: results }));
  } catch (error: any) {
    return res.status(500).json(
      jsend.error(error.message || 'Failed to certify all models')
    );
  }
};

/**
 * GET /api/certification/certified-models
 * Lista modelos certificados
 */
export const getCertifiedModels = async (req: Request, res: Response) => {
  try {
    logger.info('GET /certified-models recebido', {
      requestId: (req as any).id
    });
    
    const modelIds = await certificationService.getCertifiedModels();
    
    logger.info('Modelos certificados retornados', {
      requestId: (req as any).id,
      count: modelIds.length
    });
    
    return res.status(200).json(jsend.success({ modelIds }));
  } catch (error: any) {
    logger.error('Erro ao buscar modelos certificados', {
      requestId: (req as any).id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to get certified models')
    );
  }
};

/**
 * GET /api/certification/failed-models
 * Lista modelos que falharam na certificação (mantido para compatibilidade)
 */
export const getFailedModels = async (req: Request, res: Response) => {
  try {
    logger.info('GET /failed-models recebido', {
      requestId: (req as any).id
    });
    
    const modelIds = await certificationService.getFailedModels();
    
    logger.info('Modelos que falharam retornados', {
      requestId: (req as any).id,
      count: modelIds.length
    });
    
    return res.status(200).json(jsend.success({ modelIds }));
  } catch (error: any) {
    logger.error('Erro ao buscar modelos que falharam', {
      requestId: (req as any).id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to get failed models')
    );
  }
};

/**
 * GET /api/certification/all-failed-models
 * Lista TODOS os modelos com status 'failed' (para exibir badge vermelho no frontend)
 */
export const getAllFailedModels = async (req: Request, res: Response) => {
  try {
    logger.info('GET /all-failed-models recebido', {
      requestId: (req as any).id
    });
    
    const failed = await certificationService.getAllFailedModels();
    
    logger.info('Todos os modelos failed retornados', {
      requestId: (req as any).id,
      count: failed.length
    });
    
    return res.status(200).json(jsend.success({
      modelIds: failed
    }));
  } catch (error: any) {
    logger.error('Erro ao buscar modelos failed', {
      requestId: (req as any).id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to fetch all failed models')
    );
  }
};

/**
 * GET /api/certification/unavailable-models
 * Lista modelos realmente indisponíveis (não podem ser usados)
 * Retorna apenas modelos com categorias de erro críticas
 */
export const getUnavailableModels = async (req: Request, res: Response) => {
  try {
    const unavailable = await certificationService.getUnavailableModels();
    
    return res.status(200).json(jsend.success({
      modelIds: unavailable
    }));
  } catch (error: any) {
    logger.error('Erro ao buscar modelos indisponíveis', {
      requestId: (req as any).id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to fetch unavailable models')
    );
  }
};

/**
 * GET /api/certification/quality-warning-models
 * Lista modelos disponíveis mas com warnings de qualidade
 */
export const getQualityWarningModels = async (req: Request, res: Response) => {
  try {
    const warnings = await certificationService.getQualityWarningModels();
    
    return res.status(200).json(jsend.success({
      modelIds: warnings
    }));
  } catch (error: any) {
    logger.error('Erro ao buscar modelos com warning', {
      requestId: (req as any).id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json(
      jsend.error(error.message || 'Failed to fetch quality warning models')
    );
  }
};

/**
 * GET /api/certification/details/:modelId
 * Obtém detalhes completos da certificação de um modelo
 */
export const getCertificationDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    const details = await certificationService.getCertificationDetails(modelId);
    
    if (!details) {
      return res.status(404).json(
        jsend.fail({ message: 'Certification not found for this model' })
      );
    }
    
    // Adicionar campos de categorização na resposta
    return res.status(200).json(jsend.success({
      certification: {
        ...details,
        isAvailable: details.status === 'certified' || details.status === 'quality_warning'
      }
    }));
  } catch (error: any) {
    return res.status(500).json(
      jsend.error(error.message || 'Failed to get certification details')
    );
  }
};

/**
 * GET /api/certification/is-certified/:modelId
 * Verifica se modelo está certificado
 */
export const checkCertification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    const isCertified = await certificationService.isCertified(modelId);
    
    return res.status(200).json(jsend.success({ modelId, isCertified }));
  } catch (error: any) {
    return res.status(500).json(
      jsend.error(error.message || 'Failed to check certification')
    );
  }
};

/**
 * GET /api/certification/certify-model/:modelId/stream
 * Certifica modelo com feedback de progresso via Server-Sent Events (SSE)
 *
 * Este endpoint fornece feedback em tempo real durante o processo de certificação,
 * que pode levar 30-60 segundos. O cliente recebe eventos de progresso conforme
 * cada teste é executado.
 *
 * Formato dos eventos SSE:
 * - progress: Atualização de progresso (teste iniciando/concluindo)
 * - complete: Certificação concluída com sucesso
 * - error: Erro durante a certificação
 *
 * Rate limiting: 10 req/min (mesmo limite do POST /certify-model)
 */
export const certifyModelStream = async (req: AuthRequest, res: Response) => {
  const { modelId } = req.params;
  const userId = req.userId;
  
  logger.info(`[CertificationController] 🚀 GET /certify-model/${modelId}/stream recebido`);
  
  // Validações iniciais
  if (!modelId) {
    logger.warn('[CertificationController] ❌ modelId não fornecido');
    return res.status(400).json(
      jsend.fail({ message: 'modelId is required' })
    );
  }
  
  if (!userId) {
    logger.warn('[CertificationController] ❌ userId não autenticado');
    return res.status(401).json(
      jsend.fail({ message: 'User not authenticated' })
    );
  }
  
  // Buscar credenciais AWS do banco
  logger.info(`[CertificationController] 🔑 Buscando credenciais AWS para userId: ${userId}`);
  const credentials = await AWSCredentialsService.getCredentials(userId);
  
  if (!credentials) {
    logger.warn('[CertificationController] ❌ Credenciais AWS não encontradas');
    return res.status(400).json(
      jsend.fail({ message: 'Credenciais AWS não configuradas' })
    );
  }
  
  logger.info('[CertificationController] ✅ Credenciais encontradas, configurando SSE');
  
  // ========================================================================
  // CONFIGURAR HEADERS SSE (Server-Sent Events)
  // ========================================================================
  // Content-Type: text/event-stream - Indica stream SSE
  // Cache-Control: no-cache - Desabilita cache do navegador
  // Connection: keep-alive - Mantém conexão aberta
  // X-Accel-Buffering: no - Desabilita buffering do nginx (se aplicável)
  // ========================================================================
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  
  logger.info('[CertificationController] 📡 Headers SSE configurados, iniciando certificação');
  
  try {
    // Callback de progresso para enviar eventos SSE
    const onProgress = (event: ProgressEvent) => {
      // Formato SSE: data: {JSON}\n\n
      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
      
      logger.debug(`[CertificationController] 📤 Evento SSE enviado:`, {
        type: event.type,
        testName: event.testName,
        status: event.status,
        current: event.current,
        total: event.total
      });
    };
    
    // Executar certificação com callback de progresso
    logger.info(`[CertificationController] 🧪 Iniciando certificação com progresso para: ${modelId}`);
    const result = await certificationService.certifyModel(
      modelId,
      credentials,
      false, // force = false (não ignorar cache no SSE)
      onProgress
    );
    
    logger.info(`[CertificationController] ✅ Certificação concluída:`, {
      modelId: result.modelId,
      status: result.status,
      isCertified: result.isCertified,
      successRate: result.successRate
    });
    
    // Enviar evento final de conclusão
    const completeEvent: ProgressEvent = {
      type: 'complete',
      certification: result
    };
    res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
    
    logger.info('[CertificationController] 📡 Evento de conclusão enviado, fechando conexão SSE');
    res.end();
    return;
  } catch (error: any) {
    logger.error('[CertificationController] ❌ Erro durante certificação SSE:', error);
    
    // Enviar evento de erro
    const errorEvent: ProgressEvent = {
      type: 'error',
      message: error.message || 'Erro ao certificar modelo'
    };
    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    
    logger.info('[CertificationController] 📡 Evento de erro enviado, fechando conexão SSE');
    res.end();
    return;
  }
};

/**
 * DELETE /api/certification/:modelId
 * Deleta certificação de um modelo específico
 *
 * Útil para:
 * - Invalidar cache de certificações antigas
 * - Forçar re-certificação completa
 * - Limpar certificações com erros antigos (ex: timeout 10s -> 30s)
 *
 * Após deletar, o modelo precisará ser re-certificado.
 */
export const deleteCertification = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { modelId } = req.params;
    const userId = req.userId;
    
    logger.info(`[CertificationController] 🗑️ DELETE /certification/${modelId} recebido`);
    
    if (!modelId) {
      logger.warn('[CertificationController] ❌ modelId não fornecido');
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    if (!userId) {
      logger.warn('[CertificationController] ❌ userId não autenticado');
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    // Verificar se certificação existe
    const existing = await certificationService.getCertificationDetails(modelId);
    
    if (!existing) {
      logger.warn(`[CertificationController] ⚠️ Certificação não encontrada para ${modelId}`);
      return res.status(404).json(
        jsend.fail({ message: 'Certification not found for this model' })
      );
    }
    
    // Deletar certificação do banco
    logger.info(`[CertificationController] 🗑️ Deletando certificação para ${modelId}`);
    await prisma.modelCertification.delete({
      where: { modelId }
    });
    
    logger.info(`[CertificationController] ✅ Certificação deletada com sucesso: ${modelId}`);
    
    return res.status(200).json(jsend.success({
      message: 'Certificação deletada com sucesso',
      modelId,
      previousStatus: existing.status
    }));
  } catch (error: any) {
    logger.error('[CertificationController] ❌ Erro ao deletar certificação:', error);
    return res.status(500).json(
      jsend.error(error.message || 'Failed to delete certification')
    );
  }
};
