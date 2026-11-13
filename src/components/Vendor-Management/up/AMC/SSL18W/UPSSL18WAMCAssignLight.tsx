import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAMCAssignLight() {
  return (
    <UPModulePlaceholder
      title="Assign Lights (SSL 18W AMC)"
      category="AMC"
      subCategory="Up SSL 18w"
      description="Allot UP 18W Solar Street Light AMC contracts, maintenance zones, and inspection schedules to certified vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned 18W Lights', value: '0', sub: 'Ready for Service', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Certified Contractors', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Panchayat Zones', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Vendor Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPSSL18WAMCAssignLight;
