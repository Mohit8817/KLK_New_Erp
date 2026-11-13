import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSL18WVerifyInstallation() {
  return (
    <UPModulePlaceholder
      title="Verify Installation (SSL 18W)"
      category="Installation"
      subCategory="SSL 18W"
      description="Super Admin physical and geo-tagged verification of installed 18W Solar Street Lights in Uttar Pradesh."
      icon="installation"
      metrics={[
        { label: 'Lights Installed', value: '0', sub: 'Reported by Vendors', color: '#2563eb' },
        { label: 'Pending Inspection', value: '0', sub: 'Awaiting Audit', color: '#f59e0b' },
        { label: 'Verified & Approved', value: '0', sub: 'Passed Inspection', color: '#10b981' },
        { label: 'Rejected / Faulty', value: '0', sub: 'Flagged for Rework', color: '#ef4444' },
      ]}
    />
  );
}

export default UPSSL18WVerifyInstallation;
