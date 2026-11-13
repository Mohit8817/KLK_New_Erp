import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumBAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign AMC (Kusum B)"
      category="AMC"
      subCategory="Kusum B"
      description="Allot UP Kusum B solar agriculture pump maintenance contracts and service schedules to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Pumps', value: '0', sub: 'Ready for AMC', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Kusum B Approved', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Districts Covered', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Vendor', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPKusumBAMCAssignSite;
