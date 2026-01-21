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
    
    // Se modelo está disponível mas com warning de qualidade, retornar 200 (não 400)
    if (result.status === 'quality_warning') {
      console.log('[CertificationController] ⚠️ Modelo disponível mas com limitações de qualidade');
      return res.status(200).json(jsend.success({
        message: 'Modelo disponível mas com limitações de qualidade',
        certification: result,
        isAvailable: true,
        categorizedError: result.categorizedError
      }));
    }

    // Se modelo está indisponível, retornar 400
    if (!result.isCertified || !result.isAvailable) {
      const errorMessage = result.categorizedError?.message ||
        (result.results && result.results.length > 0 && result.results[0].error
          ? result.results[0].error
          : 'Modelo falhou nos testes de certificação');
      
      console.log('[CertificationController] ❌ Certificação falhou:', errorMessage);
      return res.status(400).json(jsend.fail({
        message: errorMessage,
        certification: result,
        isAvailable: false,
        categorizedError: result.categorizedError
      }));
    }

    // Sucesso completo
    console.log('[CertificationController] ✅ Modelo certificado com sucesso');
    return res.status(200).json(jsend.success({
      message: 'Modelo certificado com sucesso',
      certification: result,
      isAvailable: true
    }));
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
 * GET /api/certification/failed-models
 * Lista modelos que falharam na certificação (mantido para compatibilidade)
 */
export const getFailedModels = async (_req: Request, res: Response) => {
  try {
    console.log('[CertificationController] 📋 GET /failed-models recebido');
    const modelIds = await certificationService.getFailedModels();
    
    console.log('[CertificationController] ❌ Modelos que falharam retornados:', modelIds);
    
    return res.status(200).json(jsend.success({ modelIds }));
  } catch (error: any) {
    console.error('[CertificationController] ❌ Erro ao buscar modelos que falharam:', error);
    return res.status(500).json(
      jsend.error(error.message || 'Failed to get failed models')
    );
  }
};

/**
 * GET /api/certification/unavailable-models
 * Lista modelos realmente indisponíveis (não podem ser usados)
 */
export const getUnavailableModels = async (_req: Request, res: Response) => {
  try {
    const unavailable = await certificationService.getUnavailableModels();
    
    return res.status(200).json(jsend.success({
      modelIds: unavailable
    }));
  } catch (error: any) {
    console.error('[CertificationController] ❌ Erro ao buscar modelos indisponíveis:', error);
    return res.status(500).json(
      jsend.error(error.message || 'Failed to fetch unavailable models')
    );
  }
};

/**
 * GET /api/certification/quality-warning-models
 * Lista modelos disponíveis mas com warnings de qualidade
 */
export const getQualityWarningModels = async (_req: Request, res: Response) => {
  try {
    const warnings = await certificationService.getQualityWarningModels();
    
    return res.status(200).json(jsend.success({
      modelIds: warnings
    }));
  } catch (error: any) {
    console.error('[CertificationController] ❌ Erro ao buscar modelos com warning:', error);
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
