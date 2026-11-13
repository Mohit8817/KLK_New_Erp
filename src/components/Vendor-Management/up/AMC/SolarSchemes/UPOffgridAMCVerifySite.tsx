import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOffgridAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify Site (Offgrid AMC)"
      category="AMC"
      subCategory="Offgrid"
      description="Super Admin verification of battery health, load testing, PV module cleaning, and servicing logs for UP Offgrid."
      icon="amc"
      metrics={[
        { label: 'Audits Completed', value: '0', sub: 'Reports Received', color: '#0284c7' },
        { label: 'Verified & Cleared', value: '0', sub: 'Healthy Systems', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'In Audit Queue', color: '#f59e0b' },
        { label: 'Replacement Needed', value: '0', sub: 'Batteries / Parts', color: '#ef4444' },
      ]}
    />
  );
}

export default UPOffgridAMCVerifySite;
