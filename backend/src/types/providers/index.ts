// backend/src/types/providers/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Barrel export para tipos de providers
 */

export * from './aws-validation.types';
export * from './model-enrichment.types';
export * from '../vendors'; // Re-export tipos existentes (VendorGroup, CertificationInfo)
