// frontend/src/features/audit/index.tsx

import { AuditModal } from './components/AuditModal';
import { useAudit } from './context/AuditContext';

export function AuditFeature() {
  const { auditState, closeAudit } = useAudit();

  if (!auditState) return null;

  return (
    <AuditModal
      audit={auditState}
      onClose={closeAudit}
    />
  );
}
