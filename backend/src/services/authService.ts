import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const authService = {
  async register(email: string, password: string, name?: string) {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  },

  async login(email: string, password: string) {
    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Gerar token
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 1. Buscar o usuário completo (incluindo a senha)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // 2. Verificar se a senha antiga está correta
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Senha antiga incorreta', 401);
    }

    // 3. Criptografar a nova senha
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Salvar a nova senha no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return { message: 'Senha atualizada com sucesso' };
  },
};