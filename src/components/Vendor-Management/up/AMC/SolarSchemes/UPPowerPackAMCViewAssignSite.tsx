import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPPowerPackAMCViewAssignSite() {
  return (
    <UPModulePlaceholder
      title="View Assign AMC (Power Pack)"
      category="AMC"
      subCategory="Power Pack"
      description="Monitor and inspect all assigned UP Solar Power Pack maintenance contracts and scheduled visits."
      icon="assign"
      metrics={[
        { label: 'Total Assigned Units', value: '0', sub: 'Under Coverage', color: '#0284c7' },
        { label: 'Vendor Accepted', value: '0', sub: 'Under Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPPowerPackAMCViewAssignSite;
