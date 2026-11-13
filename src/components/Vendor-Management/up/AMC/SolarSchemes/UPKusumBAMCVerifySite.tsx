import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumBAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify AMC (Kusum B)"
      category="AMC"
      subCategory="Kusum B"
      description="Super Admin verification of field service visits, pump discharge, inverter health, and farmer satisfaction for UP Kusum B."
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

export default UPKusumBAMCVerifySite;
