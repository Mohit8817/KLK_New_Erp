import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign AMC (Kusum C)"
      category="AMC"
      subCategory="Kusum C"
      description="Allot UP Kusum C grid-connected solar pump maintenance sites and service obligations to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Sites', value: '0', sub: 'Ready for AMC', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Authorized', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Feeder Clusters', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Vendor', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPKusumCAMCAssignSite;
