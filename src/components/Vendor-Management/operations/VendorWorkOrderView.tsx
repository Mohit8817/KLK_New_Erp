import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorWorkOrderView() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="View Work Orders"
      category="Operations"
      subCategory="Vendor Master"
      description="Browse and track all authorized vendor work orders across states."
      icon="management"
    />
  );
}

export default VendorWorkOrderView;
