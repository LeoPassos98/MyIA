// backend/src/controllers/certification/certificationListController.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Endpoints de listagem de certificações

import { Request, Response } from 'express';
import { ModelCertificationService } from '../../services/ai/certification';
import { jsend } from '../../utils/jsend';
import { logger } from '../../utils/logger';

const certificationService = new ModelCertificationService();

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
 * Lista modelos que falharam na certificação
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
 * Lista TODOS os modelos com status 'failed'
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
 * Lista modelos realmente indisponíveis
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
