import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="Assign Installation (Kusum C)"
      category="Installation"
      subCategory="Kusum C"
      description="Allot and dispatch Uttar Pradesh Kusum C solar pump installation sites to authorized vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Sites', value: '0', sub: 'Ready for Allotment', color: '#2563eb' },
        { label: 'Active Vendors', value: '0', sub: 'Kusum C Approved', color: '#0891b2' },
        { label: 'Batches Created', value: '0', sub: 'Current Phase', color: '#10b981' },
        { label: 'Pending Vendor Acceptance', value: '0', sub: 'Review Required', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPKusumCAssignInstallation;
