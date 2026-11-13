import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCDashboard() {
  return (
    <UPModulePlaceholder
      title="Kusum C Installation Dashboard"
      category="Installation"
      subCategory="Kusum C"
      description="Executive overview of Uttar Pradesh Kusum C solar pump installations, target metrics, vendor allotments, and progress tracking."
      icon="dashboard"
      metrics={[
        { label: 'Sanctioned Sites', value: '0', sub: 'UP Kusum C Target', color: '#2563eb' },
        { label: 'Assigned to Vendors', value: '0', sub: 'Active Batches', color: '#0891b2' },
        { label: 'Installed Pumps', value: '0', sub: 'Field Complete', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Action Required', color: '#f59e0b' },
        { label: 'Total Disbursed', value: '₹0', sub: 'Vendor Payments', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPKusumCDashboard;
