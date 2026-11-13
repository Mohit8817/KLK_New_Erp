import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorWorkOrderAssignAdd() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Assign Work Order"
      category="Operations"
      subCategory="Vendor Master"
      description="Allot work order quotas to field vendors and contractors."
      icon="management"
    />
  );
}

export default VendorWorkOrderAssignAdd;
