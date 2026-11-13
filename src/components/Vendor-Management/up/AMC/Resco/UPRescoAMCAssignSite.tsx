import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAMCAssignSite() {
  return (
    <UPModulePlaceholder
      title="Assign Site (Resco AMC)"
      category="AMC"
      subCategory="Resco"
      description="Allot UP Resco rooftop solar maintenance sites and scheduled AMC service visits to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned AMC Sites', value: '0', sub: 'Ready for Service', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Service Agencies', color: '#2563eb' },
        { label: 'Service Visits Due', value: '0', sub: 'This Quarter', color: '#f59e0b' },
        { label: 'Sites Maintained', value: '0', sub: 'Active Coverage', color: '#10b981' },
      ]}
    />
  );
}

export default UPRescoAMCAssignSite;
