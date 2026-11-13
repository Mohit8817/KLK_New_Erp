import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify Site (Kusum C AMC)"
      category="AMC"
      subCategory="Kusum C"
      description="Super Admin technical verification of grid-synchronization, net-metering, and maintenance health for UP Kusum C."
      icon="amc"
      metrics={[
        { label: 'Visits Audited', value: '0', sub: 'Reports Received', color: '#0284c7' },
        { label: 'Verified & Cleared', value: '0', sub: 'Passed Inspection', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Action Required', color: '#f59e0b' },
        { label: 'Defects / Issues', value: '0', sub: 'Needs Re-visit', color: '#ef4444' },
      ]}
    />
  );
}

export default UPKusumCAMCVerifySite;
