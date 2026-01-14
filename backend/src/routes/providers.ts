// backend/src/routes/providers.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { jsend } from '../utils/jsend';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/bedrock/models', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export default router;
