import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WAMCClaimRequest() {
  return (
    <UPModulePlaceholder
      title="Claim Request (SSL 18W AMC)"
      category="AMC"
      subCategory="Up SSL 18w"
      description="Review and validate monthly and quarterly maintenance claim requests submitted by UP 18W SSL vendors."
      icon="claim"
      metrics={[
        { label: 'Claims Submitted', value: '0', sub: 'Service Invoices', color: '#0284c7' },
        { label: 'Under Verification', value: '0', sub: 'Awaiting Action', color: '#f59e0b' },
        { label: 'Approved Claims', value: '0', sub: 'Cleared for Payout', color: '#10b981' },
        { label: 'Total Invoiced', value: '₹0', sub: 'Claim Value', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WAMCClaimRequest;
