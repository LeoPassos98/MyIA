// frontend/src/features/settings/hooks/useAWSConfig.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, useCallback } from 'react';
import { userSettingsService } from '../../../services/userSettingsService';
import { api } from '../../../services/api';

type FormState = {
  accessKey: string;
  secretKey: string;
  region: string;
};

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

type UseAWSConfigReturn = {
  formState: FormState;
  setFormState: (s: FormState) => void;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  validationStatus: ValidationStatus;
  validationResult: any;
  availableModels: any[];
  selectedModels: string[];
  setSelectedModels: (ids: string[]) => void;
  handleFieldChange: (field: keyof FormState, value: string) => void;
  handleValidate: () => Promise<void>;
  handleSave: () => Promise<void>;
  toggleModel: (modelId: string) => void;
  loadAWSConfig: () => Promise<void>;
};

const AWS_ACCESS_KEY_REGEX = /^AKIA[0-9A-Z]{16}$/;
const AWS_SECRET_KEY_REGEX = /^[0-9a-zA-Z/+]{40}$/;
const AWS_REGION_REGEX = /^[a-z]{2}-[a-z]+-\d{1}$/;

export function useAWSConfig(): UseAWSConfigReturn {
  const [formState, setFormState] = useState<FormState>({
    accessKey: '',
    secretKey: '',
    region: 'us-east-1'
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carrega configurações e modelos ao montar
  useEffect(() => {
    loadAWSConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAWSConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const settings = await userSettingsService.getSettings();
      
      setFormState({
        accessKey: settings.awsAccessKey || '',
        secretKey: '', // nunca retorna do backend
        region: settings.awsRegion || 'us-east-1'
      });
      setSelectedModels(settings.awsEnabledModels || []);
      setValidationStatus(settings.awsAccessKey ? 'valid' : 'idle');
      setIsDirty(false);

      // Se já tem credenciais configuradas, buscar modelos disponíveis dinamicamente
      if (settings.awsAccessKey) {
        try {
          const modelsRes = await api.get('/providers/bedrock/available-models');
          if (modelsRes.data?.models) {
            setAvailableModels(modelsRes.data.models);
          }
        } catch (modelsErr: any) {
          // Fallback: buscar modelos estáticos do banco
          try {
            const fallbackModels = await api.get('/providers/bedrock/models');
            setAvailableModels(fallbackModels.data.models || []);
          } catch (fallbackErr) {
            console.error('Erro ao buscar modelos:', fallbackErr);
          }
        }
      } else {
        // Sem credenciais, buscar modelos estáticos do banco
        try {
          const modelsRes = await api.get('/providers/bedrock/models');
          setAvailableModels(modelsRes.data.models || []);
        } catch (modelsErr) {
          console.error('Erro ao buscar modelos:', modelsErr);
        }
      }
    } catch (err: any) {
      setError('Erro ao carregar configuração AWS');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validação local dos campos
  const validateLocal = (accessKey: string, secretKey: string, region: string) => {
    if (!AWS_ACCESS_KEY_REGEX.test(accessKey)) return 'Access Key inválida';
    if (!AWS_SECRET_KEY_REGEX.test(secretKey)) return 'Secret Key inválida';
    if (!AWS_REGION_REGEX.test(region)) return 'Região inválida';
    return null;
  };

  // Atualiza campos e marca como dirty
  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setValidationStatus('idle');
    setError(null);
    setSuccess(null);
  };

  // Validação das credenciais AWS
  const handleValidate = useCallback(async () => {
    setValidationStatus('validating');
    setError(null);
    setSuccess(null);
    setValidationResult(null);

    // Validação local apenas se dirty
    if (isDirty) {
      const localError = validateLocal(formState.accessKey, formState.secretKey, formState.region);
      if (localError) {
        setValidationStatus('invalid');
        setError(localError);
        return;
      }
    }

    try {
      let payload: any;
      if (!isDirty) {
        payload = { useStoredCredentials: true, region: formState.region };
      } else {
        payload = {
          accessKey: formState.accessKey,
          secretKey: formState.secretKey,
          region: formState.region
        };
      }
      const response = await api.post('/providers/bedrock/validate', payload);

      if (response.status === 200 && response.data.status === 'valid') {
        setValidationStatus('valid');
        setValidationResult(response.data);
        setSuccess(response.data.message);

        // Após validação bem-sucedida, buscar modelos disponíveis dinamicamente
        try {
          const modelsRes = await api.get('/providers/bedrock/available-models');
          if (modelsRes.data?.models) {
            setAvailableModels(modelsRes.data.models);
          }
        } catch (modelsErr: any) {
          console.error('Erro ao buscar modelos disponíveis:', modelsErr);
          // Não falha a validação se não conseguir buscar modelos
        }
      } else {
        setValidationStatus('invalid');
        setError(response.data.message || 'Credenciais inválidas');
      }
    } catch (err: any) {
      setValidationStatus('invalid');
      setError(err.response?.data?.message || 'Erro ao validar credenciais');
    }
  }, [formState, isDirty]);

  // Salva configurações AWS
  const handleSave = useCallback(async () => {
    if (validationStatus !== 'valid') {
      setError('Valide as credenciais antes de salvar');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userSettingsService.updateSettings({
        awsAccessKey: formState.accessKey,
        awsSecretKey: formState.secretKey,
        awsRegion: formState.region,
        awsEnabledModels: selectedModels
      });
      setSuccess('Configuração AWS salva com sucesso!');
      setIsDirty(false);
      
      // Disparar evento customizado para atualizar lista de providers no ControlPanel
      window.dispatchEvent(new CustomEvent('aws-credentials-updated'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  }, [formState, selectedModels, validationStatus]);

  // Alterna seleção de modelos
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
    setIsDirty(true);
  };

  return {
    formState,
    setFormState,
    isDirty,
    isLoading,
    isSaving,
    error,
    success,
    validationStatus,
    validationResult,
    availableModels,
    selectedModels,
    setSelectedModels,
    handleFieldChange,
    handleValidate,
    handleSave,
    toggleModel,
    loadAWSConfig
  };
}