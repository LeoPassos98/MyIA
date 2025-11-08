import { logger } from '../../../src/utils/logger';

describe('Utilitários de Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // O logger usa console.log para info/warn/debug e console.error para error
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('deve logar mensagens de info no console.log', () => {
      // Arrange
      const message = 'This is an info message';

      // Act
      logger.info(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      
      const firstArg = consoleLogSpy.mock.calls[0][0];
      expect(firstArg).toContain('[INFO]');
      expect(firstArg).toContain(message);
    });

    it('deve incluir timestamp no log de info', () => {
      // Arrange
      const message = 'Info with timestamp';

      // Act
      logger.info(message);

      // Assert
      const firstArg = consoleLogSpy.mock.calls[0][0];
      expect(firstArg).toMatch(/\d{4}-\d{2}-\d{2}/); // Data YYYY-MM-DD
      expect(firstArg).toContain(message);
    });

    it('deve incluir metadados quando fornecidos', () => {
      // Arrange
      const message = 'Info with metadata';
      const meta = { userId: '123' };

      // Act
      logger.info(message, meta);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][1]).toEqual(meta);
    });
  });

  describe('error', () => {
    it('deve logar mensagens de erro no console.error', () => {
      // Arrange
      const message = 'This is an error message';

      // Act
      logger.error(message);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      
      const firstArg = consoleErrorSpy.mock.calls[0][0];
      expect(firstArg).toContain('[ERROR]');
      expect(firstArg).toContain(message);
    });

    it('deve logar objetos de erro como metadados', () => {
      // Arrange
      const message = 'Error occurred';
      const errorObj = new Error('Something went wrong');

      // Act
      logger.error(message, errorObj);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(message);
      expect(consoleErrorSpy.mock.calls[0][1]).toBe(errorObj);
    });
  });

  describe('warn', () => {
    it('deve logar mensagens de aviso no console.log', () => {
      // Arrange
      const message = 'This is a warning message';

      // Act
      logger.warn(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      
      const firstArg = consoleLogSpy.mock.calls[0][0];
      expect(firstArg).toContain('[WARN]');
      expect(firstArg).toContain(message);
    });

    it('deve incluir metadados em warnings', () => {
      // Arrange
      const message = 'Warning with metadata';
      const meta = { reason: 'test' };

      // Act
      logger.warn(message, meta);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][1]).toEqual(meta);
    });
  });

  describe('debug', () => {
    it('deve logar mensagens de debug no console.log', () => {
      // Arrange
      const message = 'Debug message';

      // Act
      logger.debug(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      
      const firstArg = consoleLogSpy.mock.calls[0][0];
      expect(firstArg).toContain('[DEBUG]');
      expect(firstArg).toContain(message);
    });
  });

  describe('Integração do Logger', () => {
    it('deve usar console.log para info, warn e debug', () => {
      // Act
      logger.info('Info message');
      logger.warn('Warning message');
      logger.debug('Debug message');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });

    it('deve usar console.error apenas para error', () => {
      // Act
      logger.error('Error message');

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    });

    it('deve formatar todos os níveis com timestamp e level', () => {
      // Act
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');
      logger.debug('Debug');

      // Assert
      const infoLog = consoleLogSpy.mock.calls[0][0];
      const warnLog = consoleLogSpy.mock.calls[1][0];
      const errorLog = consoleErrorSpy.mock.calls[0][0];
      const debugLog = consoleLogSpy.mock.calls[2][0];

      // Todos devem ter timestamp e level
      [infoLog, warnLog, errorLog, debugLog].forEach(log => {
        expect(log).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
        expect(log).toMatch(/\[(INFO|WARN|ERROR|DEBUG)\]/);
      });
    });
  });
});