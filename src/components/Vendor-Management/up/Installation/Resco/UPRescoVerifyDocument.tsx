import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoVerifyDocument() {
  return (
    <UPModulePlaceholder
      title="Verify Document (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Inspect and validate UP Resco rooftop installation documents, commissioning sheets, CEIG approvals, and warranty cards."
      icon="doc"
      metrics={[
        { label: 'Documents Uploaded', value: '0', sub: 'Site Files', color: '#2563eb' },
        { label: 'Verification Pending', value: '0', sub: 'Audit Queue', color: '#f59e0b' },
        { label: 'Documents Approved', value: '0', sub: 'Audit Cleared', color: '#10b981' },
        { label: 'Queries Raised', value: '0', sub: 'Corrections Required', color: '#ef4444' },
      ]}
    />
  );
}

export default UPRescoVerifyDocument;
