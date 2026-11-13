import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSLAMCViewAssignLight() {
  return (
    <UPModulePlaceholder
      title="View Assign Light (SSL AMC)"
      category="AMC"
      subCategory="Up SSL"
      description="Monitor and inspect all assigned UP Solar Street Light AMC contracts, lighting clusters, and vendor acceptance."
      icon="assign"
      metrics={[
        { label: 'Assigned Lights', value: '0', sub: 'Under Maintenance', color: '#0284c7' },
        { label: 'Accepted by Vendor', value: '0', sub: 'Active Maintenance', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Queue', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared Batches', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSLAMCViewAssignLight;
