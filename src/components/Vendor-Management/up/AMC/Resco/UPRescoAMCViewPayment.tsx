import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAMCViewPayment() {
  return (
    <UPModulePlaceholder
      title="Payment (Resco AMC)"
      category="AMC"
      subCategory="Resco"
      description="Track disbursed AMC service payments, bank transaction UTR numbers, and vendor settlement history for UP Resco."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#0284c7' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Paid Out', color: '#10b981' },
        { label: 'Pending Release', value: '₹0', sub: 'Finance Clearance', color: '#f59e0b' },
        { label: 'Active Vendor Accounts', value: '0', sub: 'Settled Vendors', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoAMCViewPayment;
