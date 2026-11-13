import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOngridAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign AMC (Ongrid)"
      category="AMC"
      subCategory="Ongrid"
      description="Allot UP Ongrid rooftop solar maintenance sites and annual service obligations to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Ongrid Systems', value: '0', sub: 'Ready for Service', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Solar EPCs', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Current Term', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Vendor Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPOngridAMCAssignSite;
