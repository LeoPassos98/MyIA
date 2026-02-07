// frontend/src/features/settings/components/providers/aws/hooks/useCredentialsManagement.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';

/**
 * Tipos de validação de credenciais
 */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

/**
 * Estado do formulário de credenciais
 */
export interface FormState {
  accessKey: string;
  secretKey: string;
  region: string;
}

/**
 * Props para o hook de gerenciamento de credenciais
 */
export interface UseCredentialsManagementProps {
  formState: FormState;
  validationStatus: ValidationStatus;
}

/**
 * Retorno do hook de gerenciamento de credenciais
 */
export interface UseCredentialsManagementReturn {
  hasExistingCredentials: boolean;
  isEditingCredentials: boolean;
  setIsEditingCredentials: (value: boolean) => void;
  canSaveRegionOnly: boolean;
}

/**
 * Hook para gerenciar lógica de credenciais existentes vs novas
 * 
 * Responsabilidades:
 * - Detectar se já existem credenciais válidas
 * - Gerenciar estado de edição
 * - Determinar se pode salvar apenas região
 * 
 * @param props - Props com estado do formulário e validação
 * @returns Estado e handlers de gerenciamento de credenciais
 */
export function useCredentialsManagement(
  props: UseCredentialsManagementProps
): UseCredentialsManagementReturn {
  const { formState, validationStatus } = props;
  
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  
  // ✅ CORREÇÃO: Só marcar como "credenciais existentes" se validationStatus for 'valid'
  // Isso evita que o sistema bloqueie os campos quando o usuário está digitando
  // novas credenciais pela primeira vez
  useEffect(() => {
    // Só considerar credenciais existentes se:
    // 1. Tem accessKey preenchido
    // 2. E o status de validação é 'valid' (credenciais já foram validadas anteriormente)
    if (formState.accessKey && formState.accessKey.length > 0 && validationStatus === 'valid') {
      setHasExistingCredentials(true);
      setIsEditingCredentials(false);
    } else {
      setHasExistingCredentials(false);
      setIsEditingCredentials(false);
    }
  }, [formState.accessKey, validationStatus]);
  
  // Determinar se pode salvar apenas região (sem alterar credenciais)
  const canSaveRegionOnly = hasExistingCredentials && !isEditingCredentials;
  
  return {
    hasExistingCredentials,
    isEditingCredentials,
    setIsEditingCredentials,
    canSaveRegionOnly
  };
}
