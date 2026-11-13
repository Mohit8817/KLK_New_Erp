import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorComplaintView() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Vendor Complaints"
      category="Operations"
      subCategory="Vendor Master"
      description="Grievance redressal queue for vendor tickets, escalations, and SLA tracking."
      icon="management"
    />
  );
}

export default VendorComplaintView;
