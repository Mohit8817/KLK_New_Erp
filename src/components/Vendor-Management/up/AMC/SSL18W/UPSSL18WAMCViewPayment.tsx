import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAMCViewPayment() {
  return (
    <UPModulePlaceholder
      title="Payment (SSL 18W AMC)"
      category="AMC"
      subCategory="Up SSL 18w"
      description="Track disbursed AMC maintenance payments, bank UTR transfer details, and vendor settlements for UP 18W SSL."
      icon="payment"
      metrics={[
        { label: 'Total Payable', value: '₹0', sub: 'Approved Claims', color: '#0284c7' },
        { label: 'Disbursed Amount', value: '₹0', sub: 'Paid Out', color: '#10b981' },
        { label: 'Pending Release', value: '₹0', sub: 'Finance Clearance', color: '#f59e0b' },
        { label: 'Settled Vendors', value: '0', sub: 'Vendor Accounts', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WAMCViewPayment;
