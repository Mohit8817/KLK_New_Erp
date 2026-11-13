import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorAddData() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Add Vendor Master"
      category="Operations"
      subCategory="Vendor Master"
      description="Register and onboard a new vendor entity with GST, PAN, and banking details."
      icon="management"
    />
  );
}

export default VendorAddData;
