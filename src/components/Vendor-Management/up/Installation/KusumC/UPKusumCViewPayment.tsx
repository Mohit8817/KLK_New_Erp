import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCViewPayment() {
  return (
    <UPModulePlaceholder
      title="View Payment (Kusum C)"
      category="Installation"
      subCategory="Kusum C"
      description="Track and audit payment releases, bank transaction UTR numbers, and vendor settlements for UP Kusum C."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#2563eb' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Paid Out', color: '#10b981' },
        { label: 'Pending Disbursement', value: '₹0', sub: 'In Finance Queue', color: '#f59e0b' },
        { label: 'Settled Vendors', value: '0', sub: 'Vendor Accounts', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPKusumCViewPayment;
