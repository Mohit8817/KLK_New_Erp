import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOngridAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View Assign AMC (Ongrid)"
      category="AMC"
      subCategory="Ongrid"
      description="Monitor and inspect all assigned UP Ongrid solar maintenance contracts, generation tracking, and vendor acknowledgments."
      icon="assign"
      metrics={[
        { label: 'Total Assigned Systems', value: '0', sub: 'Under Coverage', color: '#0284c7' },
        { label: 'Vendor Accepted', value: '0', sub: 'Active Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPOngridAMCViewAssignSite;
