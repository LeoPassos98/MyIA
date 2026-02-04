// frontend-admin/src/services/certificationApi.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Configurar axios com token
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/certification-queue`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('Token added to request header', {
        component: 'certificationApi',
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`
      });
    } else {
      logger.warn('Token not found in localStorage', { component: 'certificationApi' });
    }
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', {
      component: 'certificationApi',
      error: error.message
    });
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros 401 e desembrulhar JSend
api.interceptors.response.use(
  (response) => {
    // Se resposta é JSend success, desembrulhar data
    if (response.data && response.data.status === 'success') {
      logger.debug('JSend response unwrapped', { 
        service: 'certificationApi',
        hasData: !!response.data.data
      });
      return { ...response, data: response.data.data };
    }
    
    // Se resposta é JSend fail, lançar erro
    if (response.data && response.data.status === 'fail') {
      logger.warn('JSend fail response', { 
        service: 'certificationApi',
        data: response.data.data
      });
      throw new Error(response.data.message || 'Request failed');
    }
    
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      logger.error('Unauthorized request - redirecting to login', { 
        service: 'certificationApi',
        status: 401
      });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    logger.error('API request failed', { 
      service: 'certificationApi',
      error: error.message,
      status: error.response?.status
    });
    
    return Promise.reject(error);
  }
);

export interface CertificationJobData {
  jobId: string;
  bullJobId?: string;
  modelId?: string;
  region?: string;
  status: string;
}

export interface JobStatus {
  id: string;
  type: string;
  status: string;
  regions: string[];
  modelIds: string[];
  totalModels: number;
  processedModels: number;
  successCount: number;
  failureCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  certifications: any[];
}

export interface Stats {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  certificationsByRegion: any[];
  certificationsByStatus: any[];
  recentCertifications: any[];
}

export const certificationApi = {
  // Certificar modelo único
  certifyModel: async (modelId: string, region: string) => {
    const response = await api.post('/certify-model', { modelId, region });
    return response.data;
  },

  // Certificar múltiplos modelos
  certifyMultiple: async (modelIds: string[], regions: string[]) => {
    const response = await api.post('/certify-multiple', { modelIds, regions });
    return response.data;
  },

  // Certificar todos os modelos
  certifyAll: async (regions: string[]) => {
    const response = await api.post('/certify-all', { regions });
    return response.data;
  },

  // Obter status de job
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Listar histórico
  getHistory: async (page = 1, limit = 20, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await api.get(`/history?${params}`);
    return response.data;
  },

  // Listar certificações
  getCertifications: async (page = 1, limit = 20, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await api.get(`/certifications?${params}`);
    return response.data;
  },

  // Obter estatísticas
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Listar regiões disponíveis
  getRegions: async () => {
    const response = await api.get('/regions');
    return response.data;
  },

  // Cancelar job
  cancelJob: async (jobId: string) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Verificar status AWS
  getAWSStatus: async () => {
    const response = await api.get('/aws-status');
    return response.data;
  }
};
