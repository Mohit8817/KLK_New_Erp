import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoViewPayment() {
  return (
    <UPModulePlaceholder
      title="View Payment (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Track and audit disbursed payments, transaction references, and settlement logs for UP Resco installations."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#2563eb' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Transferred', color: '#10b981' },
        { label: 'Pending Payment', value: '₹0', sub: 'Finance Clearance', color: '#f59e0b' },
        { label: 'Settled Vendors', value: '0', sub: 'Vendors Paid', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoViewPayment;
