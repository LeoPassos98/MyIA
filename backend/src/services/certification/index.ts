// backend/src/services/certification/index.ts
// Standards: docs/STANDARDS.md
// Barrel export para módulos de certificação

export { CertificationOrchestrator } from './certificationOrchestrator';
export {
  setupSSEHeaders,
  createProgressCallback,
  sendCompleteEvent,
  sendErrorEvent,
  closeSSEConnection
} from './certificationStreamHandler';
