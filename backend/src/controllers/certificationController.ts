// backend/src/controllers/certificationController.ts
// Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { jsend } from '../utils/jsend';
import { logger } from '../utils/logger';
import { CertificationOrchestrator } from '../services/certification';

const orchestrator = new CertificationOrchestrator();

/**
 * GET /api/certification/check/:modelId
 * Verifica se existe certificação em cache (SEM rate limiting)
 */
export const checkCertificationCache = async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    
    if (!modelId) {
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    const cached = await orchestrator.getCachedCertification(modelId, (req as any).id);
    
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
    
    // Orquestrar certificação
    const result = await orchestrator.certifyModel(
      modelId,
      userId,
      force,
      req.id
    );
    
    return res.status(result.statusCode).json(result.response);
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
    
    const results = await orchestrator.certifyVendor(vendor, userId, req.id);
    
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
 */
export const certifyAll = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    const results = await orchestrator.certifyAll(userId, req.id);
    
    return res.status(200).json(jsend.success({ certifications: results }));
  } catch (error: any) {
    return res.status(500).json(
      jsend.error(error.message || 'Failed to certify all models')
    );
  }
};

// Re-export endpoints de listagem
export {
  getCertifiedModels,
  getFailedModels,
  getAllFailedModels,
  getUnavailableModels,
  getQualityWarningModels,
  getCertificationDetails,
  checkCertification
} from './certification/certificationListController';

// Re-export endpoints de gerenciamento
export {
  certifyModelStream,
  deleteCertification
} from './certification/certificationManagementController';
