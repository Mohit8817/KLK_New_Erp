import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAssignInstallation() {
  return (
    <UPModulePlaceholder
      title="Assign Installation (SSL 18W)"
      category="Installation"
      subCategory="SSL 18W"
      description="Allot UP 18W Solar Street Light installation sites, pole locations, and panchayats to authorized vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Lights', value: '0', sub: 'Ready for Allotment', color: '#2563eb' },
        { label: 'Active Vendors', value: '0', sub: 'SSL Certified', color: '#0891b2' },
        { label: 'Batches Issued', value: '0', sub: 'This Phase', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Review Required', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPSSL18WAssignInstallation;
