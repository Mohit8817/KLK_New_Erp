import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAMCVerifyAssignLight() {
  return (
    <UPModulePlaceholder
      title="Verify Light (SSL 18W AMC)"
      category="AMC"
      subCategory="Up SSL 18w"
      description="Super Admin night and day uptime verification for UP 18W Solar Street Lights under maintenance contracts."
      icon="amc"
      metrics={[
        { label: 'Lights Audited', value: '0', sub: 'Reports Received', color: '#0284c7' },
        { label: '100% Glowing', value: '0', sub: 'Uptime Cleared', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Awaiting Review', color: '#f59e0b' },
        { label: 'Out of Order', value: '0', sub: 'Defects Reported', color: '#ef4444' },
      ]}
    />
  );
}

export default UPSSL18WAMCVerifyAssignLight;
