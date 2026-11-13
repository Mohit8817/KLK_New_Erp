import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorDailyProgressReport() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Daily Progress Report"
      category="Operations"
      subCategory="Vendor Master"
      description="Daily execution throughput, module installations, and surveyor site counts."
      icon="management"
    />
  );
}

export default VendorDailyProgressReport;
