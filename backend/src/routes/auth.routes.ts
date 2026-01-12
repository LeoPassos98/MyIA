// backend/src/routes/auth.routes.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../features/auth/auth.schema';
import { AuthController } from '../features/auth/auth.controller';

const router = Router();

// A rota só chega ao Controller se passar no Zod
router.post('/register', validate(registerSchema), AuthController.register);

router.post('/login', validate(loginSchema), AuthController.login);

export default router;
