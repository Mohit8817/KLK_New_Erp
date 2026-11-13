import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorViewData() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="View Vendors"
      category="Operations"
      subCategory="Vendor Master"
      description="Directory of all onboarded vendors, status, compliance, and active state allocations."
      icon="management"
    />
  );
}

export default VendorViewData;
