import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoViewClaim() {
  return (
    <UPModulePlaceholder
      title="View Claim (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Super Admin review and approval of UP Resco rooftop installation claims and milestone bills."
      icon="claim"
      metrics={[
        { label: 'Claims Raised', value: '0', sub: 'Total Claims', color: '#2563eb' },
        { label: 'Pending Claims', value: '0', sub: 'Awaiting Action', color: '#f59e0b' },
        { label: 'Claims Approved', value: '0', sub: 'Verified for Settlement', color: '#10b981' },
        { label: 'Total Value', value: '₹0', sub: 'Claimed Amount', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoViewClaim;
