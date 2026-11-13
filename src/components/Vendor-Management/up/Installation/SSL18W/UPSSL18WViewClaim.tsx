import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WViewClaim() {
  return (
    <UPModulePlaceholder
      title="View Claim (SSL 18W)"
      category="Installation"
      subCategory="SSL 18W"
      description="Super Admin review and approval of vendor installation claim requests for UP 18W Solar Street Lights."
      icon="claim"
      metrics={[
        { label: 'Claims Submitted', value: '0', sub: 'Invoices Received', color: '#2563eb' },
        { label: 'Pending Claims', value: '0', sub: 'Under Scrutiny', color: '#f59e0b' },
        { label: 'Approved Claims', value: '0', sub: 'Cleared for Payout', color: '#10b981' },
        { label: 'Claim Amount', value: '₹0', sub: 'Total Invoiced', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPSSL18WViewClaim;
