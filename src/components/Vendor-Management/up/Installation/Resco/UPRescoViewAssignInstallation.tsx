import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoViewAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="View Assign Installation (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Monitor and inspect all assigned UP Resco rooftop installation batches and tracking parameters."
      icon="assign"
      metrics={[
        { label: 'Total Batches', value: '0', sub: 'Issued Sites', color: '#2563eb' },
        { label: 'Vendor Accepted', value: '0', sub: 'Under Execution', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'In Review', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Validated', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoViewAssignInstallation;
