import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoInstallationDashboard() {
  return (
    <UPModulePlaceholder
      title="Resco Installation Dashboard"
      category="Installation"
      subCategory="Resco"
      description="Executive command center for Uttar Pradesh Resco rooftop solar installations, district capacities, and vendor tracking."
      icon="dashboard"
      metrics={[
        { label: 'Sanctioned MW / Sites', value: '0', sub: 'UP Resco Target', color: '#2563eb' },
        { label: 'Assigned Sites', value: '0', sub: 'Allotted to Vendors', color: '#0891b2' },
        { label: 'Installed Capacity', value: '0 kW', sub: 'Commissioned', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Action Required', color: '#f59e0b' },
        { label: 'Total Disbursed', value: '₹0', sub: 'Payments Released', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoInstallationDashboard;
