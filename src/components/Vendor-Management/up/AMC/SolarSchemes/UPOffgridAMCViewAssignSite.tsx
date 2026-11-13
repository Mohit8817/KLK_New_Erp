import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOffgridAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View Assign AMC (Offgrid)"
      category="AMC"
      subCategory="Offgrid"
      description="Monitor and inspect all assigned UP Offgrid standalone solar maintenance contracts and vendor acknowledgments."
      icon="assign"
      metrics={[
        { label: 'Assigned Offgrid Units', value: '0', sub: 'Under Coverage', color: '#0284c7' },
        { label: 'Vendor Accepted', value: '0', sub: 'Active Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPOffgridAMCViewAssignSite;
