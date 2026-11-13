import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View Assign Site (Resco AMC)"
      category="AMC"
      subCategory="Resco"
      description="Monitor and inspect all assigned UP Resco AMC sites, maintenance contracts, and vendor schedules."
      icon="assign"
      metrics={[
        { label: 'Total Assigned Sites', value: '0', sub: 'Under Contract', color: '#0284c7' },
        { label: 'Accepted by Vendor', value: '0', sub: 'Active Service', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Vendor', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Contract Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoAMCViewAssignSite;
