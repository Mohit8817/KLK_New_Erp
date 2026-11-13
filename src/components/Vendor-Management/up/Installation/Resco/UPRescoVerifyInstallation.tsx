import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoVerifyInstallation() {
  return (
    <UPModulePlaceholder
      title="Verify Installation (Resco)"
      category="Installation"
      subCategory="Resco"
      description="Super Admin physical inspection and technical commissioning verification for UP Resco installations."
      icon="installation"
      metrics={[
        { label: 'Sites Completed', value: '0', sub: 'Reported by Vendors', color: '#2563eb' },
        { label: 'Inspection Queue', value: '0', sub: 'Pending Verification', color: '#f59e0b' },
        { label: 'Approved Sites', value: '0', sub: 'Passed Verification', color: '#10b981' },
        { label: 'Rejection Flagged', value: '0', sub: 'Punchlist Created', color: '#ef4444' },
      ]}
    />
  );
}

export default UPRescoVerifyInstallation;
