// backend/src/routes/userRoutes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router, Response } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateProfileSchema } from '../middleware/validators/userValidator';
import { prisma } from '../lib/prisma';
import { protect } from '../middleware/auth';

const router = Router();

// Rota para obter perfil do usuário autenticado
router.get('/profile', authMiddleware, userController.getProfile);

// Rota para atualizar o perfil (nome, etc.)
router.put('/profile', authMiddleware, validateRequest(updateProfileSchema), userController.updateProfile);

// Rota para obter dados do usuário autenticado
router.get('/me', protect, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, settings: true }
    });

    if (!user) {
      return res.status(404).json({ 
        status: 'fail', 
        data: { message: 'Usuário não encontrado' } 
      });
    }

    // ✅ PADRÃO JSEND SUCESSO
    return res.json({ 
      status: 'success', 
      data: { user } 
    }); 
  } catch (error) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar dados do usuário' 
    });
  }
});

export default router;
