import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCViewAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="View Assign Installation (Kusum C)"
      category="Installation"
      subCategory="Kusum C"
      description="Track, inspect, and approve all Uttar Pradesh Kusum C assignment batches, vendor acceptance, and site status."
      icon="assign"
      metrics={[
        { label: 'Total Allocations', value: '0', sub: 'Issued Batches', color: '#2563eb' },
        { label: 'Accepted by Vendor', value: '0', sub: 'In Progress', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Vendor', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPKusumCViewAssignInstallation;
