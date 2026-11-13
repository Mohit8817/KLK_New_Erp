import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPSSLAMCVerifyAssignLight() {
  return (
    <UPModulePlaceholder
      title="Verify Light (SSL AMC)"
      category="AMC"
      subCategory="Up SSL"
      description="Super Admin verification of streetlight uptime, glowing audits, battery health, and vendor maintenance visits in UP."
      icon="amc"
      metrics={[
        { label: 'Lights Audited', value: '0', sub: 'Visits Submitted', color: '#0284c7' },
        { label: 'Glowing & Functional', value: '0', sub: 'Passed Audit', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Awaiting Action', color: '#f59e0b' },
        { label: 'Faulty / Dark Poles', value: '0', sub: 'Penalty Flagged', color: '#ef4444' },
      ]}
    />
  );
}

export default UPSSLAMCVerifyAssignLight;
