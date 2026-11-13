import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCVerifyDocument() {
  return (
    <UPModulePlaceholder
      title="Verify Document (Kusum C)"
      category="Installation"
      subCategory="Kusum C"
      description="Audit and validate Kusum C installation documents, JCR certificates, farmer declarations, and inspection dossiers."
      icon="doc"
      metrics={[
        { label: 'Uploaded Documents', value: '0', sub: 'Dossiers Received', color: '#2563eb' },
        { label: 'Pending Audit', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Approved Documents', value: '0', sub: 'Verified Successfully', color: '#10b981' },
        { label: 'Doc Queries Raised', value: '0', sub: 'Clarification Needed', color: '#ef4444' },
      ]}
    />
  );
}

export default UPKusumCVerifyDocument;
