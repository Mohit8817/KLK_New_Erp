import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPPowerPackAMCVerifySite() {
  return (
    <UPModulePlaceholder
      title="Verify Site (Power Pack AMC)"
      category="AMC"
      subCategory="Power Pack"
      description="Super Admin verification of battery gravity, cell balance, inverter backup, and periodic servicing of UP Power Pack systems."
      icon="amc"
      metrics={[
        { label: 'Audits Completed', value: '0', sub: 'Service Dossiers', color: '#0284c7' },
        { label: 'Verified & Cleared', value: '0', sub: 'Healthy Systems', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Under Review', color: '#f59e0b' },
        { label: 'Battery / Inverter Issues', value: '0', sub: 'Replacements Due', color: '#ef4444' },
      ]}
    />
  );
}

export default UPPowerPackAMCVerifySite;
