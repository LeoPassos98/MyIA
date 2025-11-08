import { authService } from '../../../src/services/authService';
import { prisma } from '../../helpers/testDb';
import { cleanupTestDb } from '../../helpers/testDb';
import { testUsers } from '../../helpers/fixtures';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  beforeEach(async () => {
    // Limpar banco antes de cada teste
    await cleanupTestDb();
  });

  afterAll(async () => {
    // Limpar e fechar conexão após todos os testes
    await cleanupTestDb();
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('deve criar novo usuário com senha hasheada', async () => {
      // Arrange
      const { email, password, name } = testUsers.valid;

      // Act
      const result = await authService.register(email, password, name);

      // Assert
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', email);
      expect(result).toHaveProperty('name', name);
      expect(typeof result.userId).toBe('string');
    });

    it('deve armazenar senha com hash bcrypt', async () => {
      // Arrange
      const { email, password, name } = testUsers.valid;

      // Act
      await authService.register(email, password, name);

      // Assert
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.password).not.toBe(password); // Não deve ser texto plano
      expect(user!.password).toMatch(/^\$2[ayb]\$.{56}$/); // Formato bcrypt
      
      // Verificar que o hash é válido
      const isValid = await bcrypt.compare(password, user!.password);
      expect(isValid).toBe(true);
    });

    it('deve criar usuário sem nome opcional', async () => {
      // Arrange
      const { email, password } = testUsers.noName;

      // Act
      const result = await authService.register(email, password);

      // Assert
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', email);
      expect(result.name).toBeNull();
    });

    it('deve lançar erro se email já existe', async () => {
      // Arrange
      const { email, password, name } = testUsers.valid;
      await authService.register(email, password, name);

      // Act & Assert
      await expect(
        authService.register(email, password, name)
      ).rejects.toThrow('Email already registered');
    });

    it('deve retornar erro 400 para email duplicado', async () => {
      // Arrange
      const { email, password, name } = testUsers.valid;
      await authService.register(email, password, name);

      // Act & Assert
      try {
        await authService.register(email, password, name);
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Email already registered');
      }
    });

    it('não deve expor senha no retorno', async () => {
      // Arrange
      const { email, password, name } = testUsers.valid;

      // Act
      const result = await authService.register(email, password, name);

      // Assert
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await authService.register(
        testUsers.valid.email,
        testUsers.valid.password,
        testUsers.valid.name
      );
    });

    it('deve retornar token e dados do usuário para credenciais válidas', async () => {
      // Arrange
      const { email, password } = testUsers.valid;

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3); // JWT format
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', email);
      expect(result.user).toHaveProperty('name', testUsers.valid.name);
    });

    it('não deve expor senha no retorno do login', async () => {
      // Arrange
      const { email, password } = testUsers.valid;

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.user).not.toHaveProperty('password');
    });

    it('deve lançar erro para email não cadastrado', async () => {
      // Arrange
      const email = 'naoexiste@example.com';
      const password = 'qualquersenha';

      // Act & Assert
      await expect(
        authService.login(email, password)
      ).rejects.toThrow('Invalid credentials');
    });

    it('deve retornar erro 401 para email inválido', async () => {
      // Arrange
      const email = 'naoexiste@example.com';
      const password = 'qualquersenha';

      // Act & Assert
      try {
        await authService.login(email, password);
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid credentials');
      }
    });

    it('deve lançar erro para senha incorreta', async () => {
      // Arrange
      const { email } = testUsers.valid;
      const wrongPassword = 'senhaerrada123';

      // Act & Assert
      await expect(
        authService.login(email, wrongPassword)
      ).rejects.toThrow('Invalid credentials');
    });

    it('deve retornar erro 401 para senha incorreta', async () => {
      // Arrange
      const { email } = testUsers.valid;
      const wrongPassword = 'senhaerrada123';

      // Act & Assert
      try {
        await authService.login(email, wrongPassword);
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid credentials');
      }
    });

    it('deve validar senha mesmo com espaços extras', async () => {
      // Arrange
      const { email } = testUsers.valid;
      const passwordWithSpaces = 'password123 '; // Espaço no final

      // Act & Assert
      await expect(
        authService.login(email, passwordWithSpaces)
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserById', () => {
    it('deve retornar dados do usuário sem senha', async () => {
      // Arrange
      const registerResult = await authService.register(
        testUsers.valid.email,
        testUsers.valid.password,
        testUsers.valid.name
      );
      const userId = registerResult.userId;

      // Act
      const result = await authService.getUserById(userId);

      // Assert
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('email', testUsers.valid.email);
      expect(result).toHaveProperty('name', testUsers.valid.name);
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('password');
    });

    it('deve incluir timestamp de criação', async () => {
      // Arrange
      const registerResult = await authService.register(
        testUsers.valid.email,
        testUsers.valid.password,
        testUsers.valid.name
      );
      const userId = registerResult.userId;

      // Act
      const result = await authService.getUserById(userId);

      // Assert
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('deve lançar erro para userId inválido', async () => {
      // Arrange
      const invalidUserId = 'id-invalido-123';

      // Act & Assert
      await expect(
        authService.getUserById(invalidUserId)
      ).rejects.toThrow('User not found');
    });

    it('deve retornar erro 404 para usuário não encontrado', async () => {
      // Arrange
      const invalidUserId = 'id-invalido-123';

      // Act & Assert
      try {
        await authService.getUserById(invalidUserId);
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
      }
    });
  });

  describe('Integração entre métodos', () => {
    it('deve permitir login após registro', async () => {
      // Arrange & Act
      const { email, password, name } = testUsers.valid;
      
      const registerResult = await authService.register(email, password, name);
      const loginResult = await authService.login(email, password);

      // Assert
      expect(registerResult.userId).toBe(loginResult.user.id);
      expect(registerResult.email).toBe(loginResult.user.email);
    });

    it('deve permitir buscar usuário após registro', async () => {
      // Arrange & Act
      const { email, password, name } = testUsers.valid;
      
      const registerResult = await authService.register(email, password, name);
      const getUserResult = await authService.getUserById(registerResult.userId);

      // Assert
      expect(getUserResult.id).toBe(registerResult.userId);
      expect(getUserResult.email).toBe(registerResult.email);
    });

    it('deve manter múltiplos usuários isolados', async () => {
      // Arrange & Act
      const user1 = await authService.register(
        testUsers.valid.email,
        testUsers.valid.password,
        testUsers.valid.name
      );

      const user2 = await authService.register(
        testUsers.admin.email,
        testUsers.admin.password,
        testUsers.admin.name
      );

      // Assert
      expect(user1.userId).not.toBe(user2.userId);
      expect(user1.email).not.toBe(user2.email);

      // Verificar que ambos podem fazer login
      const login1 = await authService.login(testUsers.valid.email, testUsers.valid.password);
      const login2 = await authService.login(testUsers.admin.email, testUsers.admin.password);

      expect(login1.user.id).toBe(user1.userId);
      expect(login2.user.id).toBe(user2.userId);
    });
  });
});