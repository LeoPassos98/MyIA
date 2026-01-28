// backend/src/middleware/__tests__/httpLogger.test.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import { httpLoggerMiddleware } from '../httpLogger';
import { logger } from '../../utils/logger';

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    http: jest.fn(),
  },
}));

describe('httpLoggerMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let finishCallback: () => void;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      url: '/api/test',
      id: 'test-request-id',
      user: { id: 'user-123' } as any,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent';
        return undefined;
      }) as any,
    };

    // Mock Response
    mockResponse = {
      statusCode: 200,
      get: jest.fn((header: string) => {
        if (header === 'content-length') return '1234';
        return undefined;
      }) as any,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
        return mockResponse as Response;
      }),
    };

    // Mock Next
    mockNext = jest.fn();
  });

  it('should call next() immediately', () => {
    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should log HTTP request with all fields when response finishes', (done) => {
    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Simular finalização da resposta após 10ms
    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledTimes(1);
      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          requestId: 'test-request-id',
          userId: 'user-123',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          contentLength: '1234',
        })
      );

      // Verificar que duration está presente e é um número
      const callArgs = (logger.http as jest.Mock).mock.calls[0][1];
      expect(callArgs.duration).toBeGreaterThanOrEqual(10);
      expect(typeof callArgs.duration).toBe('number');

      done();
    }, 10);
  });

  it('should log with null userId when user is not authenticated', (done) => {
    mockRequest.user = undefined;

    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          userId: null,
        })
      );

      done();
    }, 5);
  });

  it('should use socket.remoteAddress when req.ip is undefined', (done) => {
    delete (mockRequest as any).ip;

    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          ip: '127.0.0.1',
        })
      );

      done();
    }, 5);
  });

  it('should log error status codes correctly', (done) => {
    mockResponse.statusCode = 500;

    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          statusCode: 500,
        })
      );

      done();
    }, 5);
  });

  it('should log POST requests correctly', (done) => {
    mockRequest.method = 'POST';
    mockRequest.originalUrl = '/api/users';

    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          method: 'POST',
          url: '/api/users',
        })
      );

      done();
    }, 5);
  });

  it('should use originalUrl over url when available', (done) => {
    mockRequest.originalUrl = '/api/original';
    mockRequest.url = '/api/url';

    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    setTimeout(() => {
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          url: '/api/original',
        })
      );

      done();
    }, 5);
  });

  it('should measure request duration accurately', (done) => {
    httpLoggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Aguardar 50ms antes de finalizar
    setTimeout(() => {
      finishCallback();

      const callArgs = (logger.http as jest.Mock).mock.calls[0][1];
      expect(callArgs.duration).toBeGreaterThanOrEqual(50);
      expect(callArgs.duration).toBeLessThan(100); // Margem de segurança

      done();
    }, 50);
  });
});
