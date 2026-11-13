import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorWorkOrderAssignView() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="View Work Order Assignments"
      category="Operations"
      subCategory="Vendor Master"
      description="Review vendor work order allocations, statuses, and timeline progress."
      icon="management"
    />
  );
}

export default VendorWorkOrderAssignView;
