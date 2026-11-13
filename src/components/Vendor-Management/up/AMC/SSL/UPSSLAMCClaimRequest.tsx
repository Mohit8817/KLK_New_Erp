import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSLAMCClaimRequest() {
  return (
    <UPModulePlaceholder
      title="Claim Request (SSL AMC)"
      category="AMC"
      subCategory="Up SSL"
      description="Review and validate monthly and quarterly maintenance claim requests submitted by UP Solar Street Light vendors."
      icon="claim"
      metrics={[
        { label: 'Claims Raised', value: '0', sub: 'Invoices Received', color: '#0284c7' },
        { label: 'Pending Review', value: '0', sub: 'Awaiting Approval', color: '#f59e0b' },
        { label: 'Claims Approved', value: '0', sub: 'Passed for Payout', color: '#10b981' },
        { label: 'Claim Amount', value: '₹0', sub: 'Total Invoiced', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSLAMCClaimRequest;
