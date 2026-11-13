import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPOffgridAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign AMC (Offgrid)"
      category="AMC"
      subCategory="Offgrid"
      description="Allot UP Offgrid standalone solar maintenance sites, battery storage, and servicing tasks to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Offgrid Sites', value: '0', sub: 'Ready for Service', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Contractors', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Rural Sites', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Review Required', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPOffgridAMCAssignSite;
