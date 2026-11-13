import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View Assign AMC (Kusum C)"
      category="AMC"
      subCategory="Kusum C"
      description="Monitor and inspect all assigned UP Kusum C grid-connected solar pump AMC contracts and vendor performance."
      icon="assign"
      metrics={[
        { label: 'Total Assigned Sites', value: '0', sub: 'Under Contract', color: '#0284c7' },
        { label: 'Vendor Accepted', value: '0', sub: 'Active Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPKusumCAMCViewAssignSite;
