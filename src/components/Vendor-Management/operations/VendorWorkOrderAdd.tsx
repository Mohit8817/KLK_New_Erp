import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorWorkOrderAdd() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Create Work Order"
      category="Operations"
      subCategory="Vendor Master"
      description="Issue a new vendor work order with scheme allocations and targets."
      icon="management"
    />
  );
}

export default VendorWorkOrderAdd;
