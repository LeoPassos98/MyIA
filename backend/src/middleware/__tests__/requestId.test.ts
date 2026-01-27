import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../requestId';

// Mock do módulo uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('requestIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should generate unique requestId', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.id).toBeDefined();
    expect(typeof mockRequest.id).toBe('string');
    expect(mockRequest.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should set X-Request-ID header', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      mockRequest.id
    );
  });

  it('should call next function', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });
});
