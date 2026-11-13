import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAMCViewAssignLight() {
  return (
    <UPModulePlaceholder
      title="View Assign Light (SSL 18W AMC)"
      category="AMC"
      subCategory="Up SSL 18w"
      description="Monitor and inspect all assigned UP 18W Solar Street Light maintenance contracts and vendor acknowledgments."
      icon="assign"
      metrics={[
        { label: 'Assigned Lights', value: '0', sub: 'Under AMC Coverage', color: '#0284c7' },
        { label: 'Vendor Accepted', value: '0', sub: 'Active Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WAMCViewAssignLight;
