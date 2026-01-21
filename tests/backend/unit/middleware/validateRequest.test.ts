import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../../src/middleware/validateRequest';
import { AppError } from '../../../src/middleware/errorHandler';

describe('Middleware de Validação de Requisição', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  describe('Validação com Sucesso', () => {
    it('deve passar requisição com dados válidos', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      const validData = {
        email: 'test@example.com',
        password: '123456',
      };

      mockRequest.body = validData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Sem argumentos = sucesso
    });

    it('deve validar schemas complexos', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
        email: z.string().email(),
      });

      const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com',
      };

      mockRequest.body = validData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Validação com Erro', () => {
    it('deve rejeitar requisição com dados inválidos', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      const invalidData = {
        email: 'invalid-email', // Email inválido
        password: '123',        // Senha muito curta
      };

      mockRequest.body = invalidData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBeTruthy();
    });

    it('deve rejeitar requisição com campos faltando', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
      });

      const incompleteData = {
        email: 'test@example.com',
        // password e name faltando
      };

      mockRequest.body = incompleteData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(400);
    });

    it('deve rejeitar requisição com tipos incorretos', () => {
      // Arrange
      const schema = z.object({
        age: z.number(),
        active: z.boolean(),
      });

      const wrongTypeData = {
        age: 'twenty-five',  // String ao invés de number
        active: 'yes',       // String ao invés de boolean
      };

      mockRequest.body = wrongTypeData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.statusCode).toBe(400);
    });

    it('deve retornar primeira mensagem de erro do Zod', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email('Invalid email format'),
      });

      const invalidData = {
        email: 'not-an-email',
      };

      mockRequest.body = invalidData;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      const error = mockNext.mock.calls[0][0] as unknown as AppError;
      expect(error.message).toContain('email');
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com body vazio', () => {
      // Arrange
      const schema = z.object({
        required: z.string(),
      });

      mockRequest.body = {};

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('deve validar schemas opcionais corretamente', () => {
      // Arrange
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const dataWithoutOptional = {
        required: 'value',
        // optional não fornecido
      };

      mockRequest.body = dataWithoutOptional;

      const middleware = validateRequest(schema);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(); // Deve passar
    });
  });
});