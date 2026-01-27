// backend/src/services/awsCredentialsService.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../lib/prisma';
import { encryptionService } from './encryptionService';
import logger from '../utils/logger';

export interface AWSCredentials {
  accessKey: string;
  secretKey: string;
  region: string;
}

export class AWSCredentialsService {
  /**
   * Busca credenciais AWS do usuário no banco de dados
   */
  static async getCredentials(userId: string): Promise<AWSCredentials | null> {
    try {
      // Buscar credenciais do usuário em UserSettings
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
          awsAccessKey: true,
          awsSecretKey: true,
          awsRegion: true
        }
      });

      if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
        return null;
      }

      // Descriptografar credenciais
      const accessKey = encryptionService.decrypt(userSettings.awsAccessKey);
      const secretKey = encryptionService.decrypt(userSettings.awsSecretKey);
      const region = userSettings.awsRegion || 'us-east-1';

      return {
        accessKey,
        secretKey,
        region
      };

    } catch (error) {
      logger.error('[AWSCredentialsService] Erro ao buscar credenciais:', error);
      return null;
    }
  }

  /**
   * Verifica se usuário tem credenciais AWS configuradas
   */
  static async hasCredentials(userId: string): Promise<boolean> {
    const credentials = await this.getCredentials(userId);
    return credentials !== null;
  }
}
