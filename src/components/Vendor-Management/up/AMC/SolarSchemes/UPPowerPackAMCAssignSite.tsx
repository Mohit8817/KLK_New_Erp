import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPPowerPackAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign AMC (Power Pack)"
      category="AMC"
      subCategory="Power Pack"
      description="Allot UP Solar Power Pack maintenance sites, battery energy storage systems, and institutional installations to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Power Packs', value: '0', sub: 'Ready for Service', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Service Agencies', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Institutional Sites', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Vendor Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPPowerPackAMCAssignSite;
