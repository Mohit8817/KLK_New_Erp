import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoAMCClaimRequest() {
  return (
    <UPModulePlaceholder
      title="Claim Request (Resco AMC)"
      category="AMC"
      subCategory="Resco"
      description="Review and validate quarterly and annual AMC maintenance claim requests submitted by UP Resco vendors."
      icon="claim"
      metrics={[
        { label: 'Claims Submitted', value: '0', sub: 'Service Invoices', color: '#0284c7' },
        { label: 'Claims Pending Review', value: '0', sub: 'Action Required', color: '#f59e0b' },
        { label: 'Claims Approved', value: '0', sub: 'Passed for Payout', color: '#10b981' },
        { label: 'Approved Value', value: '₹0', sub: 'Total Payable', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoAMCClaimRequest;
