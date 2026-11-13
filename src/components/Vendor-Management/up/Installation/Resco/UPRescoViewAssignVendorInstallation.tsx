import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoViewAssignVendorInstallation() {
  return (
    <UPModulePlaceholder
      title="View Assign Vendor Installation (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Comprehensive vendor-wise breakdown and tracking of assigned installation batches for UP Resco."
      icon="assign"
      metrics={[
        { label: 'Participating Vendors', value: '0', sub: 'Active Vendors', color: '#2563eb' },
        { label: 'Total Allocated Units', value: '0', sub: 'Assigned Sites', color: '#0891b2' },
        { label: 'Completed by Vendors', value: '0', sub: 'Installed', color: '#10b981' },
        { label: 'Overdue Allotments', value: '0', sub: 'Deadline Lapsed', color: '#ef4444' },
      ]}
    />
  );
}

export default UPRescoViewAssignVendorInstallation;
