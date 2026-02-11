// backend/src/controllers/certification/certificationManagementController.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Endpoints de gerenciamento de certificações (delete, stream)

import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { ModelCertificationService } from '../../services/ai/certification';
import { prisma } from '../../lib/prisma';
import { jsend } from '../../utils/jsend';
import { logger } from '../../utils/logger';
import { CertificationOrchestrator, setupSSEHeaders, createProgressCallback, sendCompleteEvent, sendErrorEvent, closeSSEConnection } from '../../services/certification';

const certificationService = new ModelCertificationService();
const orchestrator = new CertificationOrchestrator();

/**
 * GET /api/certification/certify-model/:modelId/stream
 * Certifica modelo com feedback de progresso via Server-Sent Events (SSE)
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
  
  // Configurar SSE
  setupSSEHeaders(res);
  logger.info('[CertificationController] 📡 Headers SSE configurados, iniciando certificação');
  
  try {
    // Criar callback de progresso
    const onProgress = createProgressCallback(res, req.id);
    
    // Executar certificação com progresso
    logger.info(`[CertificationController] 🧪 Iniciando certificação com progresso para: ${modelId}`);
    const result = await orchestrator.certifyModel(
      modelId,
      userId,
      false, // force = false
      req.id,
      onProgress
    );
    
    logger.info(`[CertificationController] ✅ Certificação concluída:`, {
      modelId: result.response.data.certification.modelId,
      status: result.response.data.certification.status
    });
    
    // Enviar evento de conclusão
    sendCompleteEvent(res, result.response.data.certification, req.id);
    closeSSEConnection(res, req.id);
    return;
  } catch (error: unknown) {
    logger.error('[CertificationController] ❌ Erro durante certificação SSE:', error);
    sendErrorEvent(res, error instanceof Error ? error : new Error(String(error)), req.id);
    closeSSEConnection(res, req.id);
    return;
  }
};

/**
 * DELETE /api/certification/:modelId
 * Deleta certificação de um modelo específico
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
    
    // Deletar certificação do banco (todas as regiões)
    // Schema v2: Usar deploymentId em vez de modelId
    // O modelId recebido pode ser o deploymentId (string do provider) ou UUID
    logger.info(`[CertificationController] 🗑️ Deletando certificações para ${modelId} (todas as regiões)`);
    
    // Primeiro, tentar encontrar o deployment pelo deploymentId ou UUID
    const deployment = await prisma.modelDeployment.findFirst({
      where: {
        OR: [
          { id: modelId },
          { deploymentId: modelId }
        ]
      },
      select: { id: true }
    });
    
    if (deployment) {
      await prisma.modelCertification.deleteMany({
        where: { deploymentId: deployment.id }
      });
    }
    
    logger.info(`[CertificationController] ✅ Certificação deletada com sucesso: ${modelId}`);
    
    return res.status(200).json(jsend.success({
      message: 'Certificação deletada com sucesso',
      modelId,
      previousStatus: existing.status
    }));
  } catch (error: unknown) {
    logger.error('[CertificationController] ❌ Erro ao deletar certificação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete certification';
    return res.status(500).json(
      jsend.error(errorMessage)
    );
  }
};
