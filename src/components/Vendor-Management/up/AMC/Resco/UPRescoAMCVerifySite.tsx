import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify Site (Resco AMC)"
      category="AMC"
      subCategory="Resco"
      description="Super Admin inspection and verification of executed AMC quarterly service visits for UP Resco systems."
      icon="amc"
      metrics={[
        { label: 'Services Completed', value: '0', sub: 'Visits Submitted', color: '#0284c7' },
        { label: 'Pending Verification', value: '0', sub: 'Awaiting Review', color: '#f59e0b' },
        { label: 'Verified & Approved', value: '0', sub: 'Service Cleared', color: '#10b981' },
        { label: 'Incomplete / Flagged', value: '0', sub: 'Needs Re-visit', color: '#ef4444' },
      ]}
    />
  );
}

export default UPRescoAMCVerifySite;
