import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WViewPayment() {
  return (
    <UPModulePlaceholder
      title="View Payment (SSL 18W)"
      category="Installation"
      subCategory="SSL 18W"
      description="Track disbursed payments, bank transfer UTR records, and vendor payout history for UP 18W SSL projects."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#2563eb' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Paid Out', color: '#10b981' },
        { label: 'Pending Payment', value: '₹0', sub: 'Finance Clearance', color: '#f59e0b' },
        { label: 'Settled Vendors', value: '0', sub: 'Accounts Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WViewPayment;
