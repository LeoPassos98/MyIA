// backend/src/controllers/certificationController.ts
// Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ModelCertificationService } from '../services/ai/certification';
import { AWSCredentialsService } from '../services/awsCredentialsService';
import { jsend } from '../utils/jsend';

const certificationService = new ModelCertificationService();

/**
 * POST /api/certification/certify-model
 * Certifica um modelo específico
 * Busca credenciais AWS do banco de dados do usuário
 */
export const certifyModel = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[CertificationController] 🚀 POST /certify-model recebido');
    const { modelId } = req.body;
    const userId = req.userId;
    
    console.log('[CertificationController] 📋 Dados recebidos:', { modelId, userId });
    
    if (!modelId) {
      console.log('[CertificationController] ❌ modelId não fornecido');
      return res.status(400).json(
        jsend.fail({ message: 'modelId is required' })
      );
    }
    
    if (!userId) {
      console.log('[CertificationController] ❌ userId não autenticado');
      return res.status(401).json(
        jsend.fail({ message: 'User not authenticated' })
      );
    }
    
    // Buscar credenciais AWS do banco
    console.log('[CertificationController] 🔑 Buscando credenciais AWS para userId:', userId);
    const credentials = await AWSCredentialsService.getCredentials(userId);
    
    if (!credentials) {
      console.log('[CertificationController] ❌ Credenciais AWS não encontradas');
      return res.status(400).json(
        jsend.fail({ message: 'Credenciais AWS não configuradas' })
      );
    }
    
    console.log('[CertificationController] ✅ Credenciais encontradas:', {
      region: credentials.region,
      hasAccessKey: !!credentials.accessKey,
      hasSecretKey: !!credentials.secretKey
    });
    
    // Certificar modelo
    console.log('[CertificationController] 🧪 Iniciando certificação do modelo:', modelId);
    const result = await certificationService.certifyModel(modelId, credentials);
    
    console.log('[CertificationController] 📊 Resultado da certificação:', {
      modelId: result.modelId,
      status: result.status,
      isCertified: result.isCertified,
      successRate: result.successRate
    });
    
    return res.status(200).json(jsend.success({ certification: result }));
  } catch (error: any) {
    console.error('[CertificationController] ❌ Erro ao certificar modelo:', error);
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
export const getCertifiedModels = async (_req: Request, res: Response) => {
  try {
    console.log('[CertificationController] 📋 GET /certified-models recebido');
    const modelIds = await certificationService.getCertifiedModels();
    
    console.log('[CertificationController] ✅ Modelos certificados retornados:', modelIds);
    
    return res.status(200).json(jsend.success({ modelIds }));
  } catch (error: any) {
    console.error('[CertificationController] ❌ Erro ao buscar modelos certificados:', error);
    return res.status(500).json(
      jsend.error(error.message || 'Failed to get certified models')
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
