import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WViewAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="View Assign Installation (SSL 18W)"
      category="Installation"
      subCategory="SSL 18W"
      description="Monitor and inspect all assigned UP 18W Solar Street Light batches, vendor acceptance, and location targets."
      icon="assign"
      metrics={[
        { label: 'Total Batches', value: '0', sub: 'Light Allocations', color: '#2563eb' },
        { label: 'Vendor Accepted', value: '0', sub: 'Under Execution', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Vendor', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Validated Batches', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WViewAssignInstallation;
