import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSLAMCAssignLight() {
  return (
    <UPModulePlaceholder
      title="Assign Lights (SSL AMC)"
      category="AMC"
      subCategory="Up SSL"
      description="Allot UP Solar Street Light maintenance clusters, pole assets, and AMC schedules to service vendors."
      icon="assign"
      metrics={[
        { label: 'Unassigned Lights', value: '0', sub: 'Ready for AMC', color: '#0284c7' },
        { label: 'Active AMC Vendors', value: '0', sub: 'Lighting Contractors', color: '#2563eb' },
        { label: 'Clusters Issued', value: '0', sub: 'Panchayat Batches', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Vendor Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPSSLAMCAssignLight;
