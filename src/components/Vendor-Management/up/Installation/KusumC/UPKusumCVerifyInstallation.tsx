import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPKusumCVerifyInstallation() {
  return (
    <UPModulePlaceholder
      title="Verify Installation (Kusum C)"
      category="Installation"
      subCategory="Kusum C"
      description="Super Admin physical and remote inspection verification of completed Kusum C solar pump installations in Uttar Pradesh."
      icon="installation"
      metrics={[
        { label: 'Sites Completed', value: '0', sub: 'Submitted by Vendors', color: '#2563eb' },
        { label: 'Pending Inspection', value: '0', sub: 'Awaiting Audit', color: '#f59e0b' },
        { label: 'Verified & Approved', value: '0', sub: 'Passed Inspections', color: '#10b981' },
        { label: 'Rejected / Need Rework', value: '0', sub: 'Issues Flagged', color: '#ef4444' },
      ]}
    />
  );
}

export default UPKusumCVerifyInstallation;
