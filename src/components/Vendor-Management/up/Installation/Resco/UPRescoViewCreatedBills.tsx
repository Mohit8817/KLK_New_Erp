import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoViewCreatedBills() {
  return (
    <UPModulePlaceholder
      title="View Created Bills (Resco)"
      category="Installation"
      subCategory="Resco"
      description="View and verify system-generated and submitted installation invoice bills for UP Resco rooftop projects."
      icon="doc"
      metrics={[
        { label: 'Bills Generated', value: '0', sub: 'Total Invoices', color: '#2563eb' },
        { label: 'Bills Under Audit', value: '0', sub: 'Verification Pending', color: '#f59e0b' },
        { label: 'Bills Approved', value: '0', sub: 'Forwarded to Accounts', color: '#10b981' },
        { label: 'Total Invoiced Value', value: '₹0', sub: 'Bill Amount', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoViewCreatedBills;
