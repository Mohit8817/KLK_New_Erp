import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WInstallationDashboard() {
  return (
    <UPModulePlaceholder
      title="SSL 18W Installation Dashboard"
      category="Installation"
      subCategory="SSL 18W"
      description="Overview and analytics for Uttar Pradesh 18W Solar Street Light installations, pole erection, and luminary commissioning."
      icon="dashboard"
      metrics={[
        { label: 'Sanctioned Lights', value: '0', sub: 'Target 18W SSL', color: '#2563eb' },
        { label: 'Assigned Lights', value: '0', sub: 'Allotted to Vendors', color: '#0891b2' },
        { label: 'Installed & Lit', value: '0', sub: 'Commissioned Lights', color: '#10b981' },
        { label: 'Pending Inspection', value: '0', sub: 'Awaiting Audit', color: '#f59e0b' },
        { label: 'Disbursed', value: '₹0', sub: 'Vendor Settlements', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WInstallationDashboard;
