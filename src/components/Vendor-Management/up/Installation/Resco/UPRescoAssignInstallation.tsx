import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="Assign Installation (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Allot UP Resco rooftop solar installation sites and volumes to certified vendors and contractors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Sites', value: '0', sub: 'Awaiting Allotment', color: '#2563eb' },
        { label: 'Active Resco Vendors', value: '0', sub: 'Authorized', color: '#0891b2' },
        { label: 'Batches Issued', value: '0', sub: 'Current Term', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Vendor Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPRescoAssignInstallation;
