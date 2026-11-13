import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOngridAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify Site (Ongrid AMC)"
      category="AMC"
      subCategory="Ongrid"
      description="Super Admin technical verification of grid export metrics, inverter uptime, and maintenance checksheets for UP Ongrid."
      icon="amc"
      metrics={[
        { label: 'Audits Completed', value: '0', sub: 'Reports Received', color: '#0284c7' },
        { label: 'Verified & Cleared', value: '0', sub: 'Optimal Performance', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'In Audit Queue', color: '#f59e0b' },
        { label: 'Underperformance Flagged', value: '0', sub: 'Action Required', color: '#ef4444' },
      ]}
    />
  );
}

export default UPOngridAMCVerifySite;
