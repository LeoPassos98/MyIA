import { Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../../src/middleware/authMiddleware';
import { generateToken } from '../../../src/utils/jwt';
import { AppError } from '../../../src/middleware/errorHandler';

describe('Middleware de Autenticação', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  describe('Token Válido', () => {
    it('deve passar requisição com token JWT válido', () => {
      // Arrange
      const validPayload = { userId: 'test-user-123', email: 'test@test.com' };
      const validToken = generateToken(validPayload);
      
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Chamado sem argumentos = sucesso
      expect(mockRequest.userId).toBe(validPayload.userId);
      expect(mockRequest.userEmail).toBe(validPayload.email);
    });

    it('deve extrair userId do token e adicionar ao request', () => {
      // Arrange
      const userId = 'user-456';
      const email = 'user@test.com';
      const token = generateToken({ userId, email });
      
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBe(userId);
      expect(mockRequest.userEmail).toBe(email);
      expect(mockNext).toHaveBeenCalledWith(); // Sem erro
    });
  });

  describe('Token Ausente', () => {
    it('deve rejeitar requisição sem token', () => {
      // Arrange
      mockRequest.headers = {}; // Sem header authorization

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/token/i);
    });

    it('deve rejeitar requisição com header authorization sem Bearer', () => {
      // Arrange
      const token = generateToken({ userId: '123', email: 'test@test.com' });
      mockRequest.headers = {
        authorization: token, // Sem "Bearer "
      };

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Token Inválido', () => {
    it('deve rejeitar requisição com token inválido', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token-here',
      };

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    it('deve rejeitar token malformado', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer not.a.valid.jwt',
      };

      // Act
      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Integração', () => {
    it('deve permitir múltiplas requisições válidas', () => {
      // Arrange
      const token1 = generateToken({ userId: 'user1', email: 'user1@test.com' });
      const token2 = generateToken({ userId: 'user2', email: 'user2@test.com' });

      // Act & Assert - Primeira requisição
      mockRequest.headers = { authorization: `Bearer ${token1}` };
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockRequest.userId).toBe('user1');
      expect(mockNext).toHaveBeenCalledWith();

      // Reset
      mockNext.mockClear();
      mockRequest = { headers: { authorization: `Bearer ${token2}` } };

      // Act & Assert - Segunda requisição
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockRequest.userId).toBe('user2');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});