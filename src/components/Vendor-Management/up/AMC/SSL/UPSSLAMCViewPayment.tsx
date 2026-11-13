import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSLAMCViewPayment() {
  return (
    <UPModulePlaceholder
      title="Payment (SSL AMC)"
      category="AMC"
      subCategory="Up SSL"
      description="Track disbursed AMC maintenance payments, bank UTR references, and settlement history for UP Solar Street Lights."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#0284c7' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Released to Vendors', color: '#10b981' },
        { label: 'Pending Release', value: '₹0', sub: 'In Accounts Queue', color: '#f59e0b' },
        { label: 'Settled Vendors', value: '0', sub: 'Active Vendors', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSLAMCViewPayment;
