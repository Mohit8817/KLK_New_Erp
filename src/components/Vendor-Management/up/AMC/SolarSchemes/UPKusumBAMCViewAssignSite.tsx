import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumBAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View AMC (Kusum B)"
      category="AMC"
      subCategory="Kusum B"
      description="Monitor and inspect all assigned UP Kusum B solar pump maintenance contracts, farmer sites, and vendor acceptance."
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

export default UPKusumBAMCViewAssignSite;
