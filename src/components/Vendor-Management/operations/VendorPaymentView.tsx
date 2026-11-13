import { StateModulePlaceholder } from '../common/StateModulePlaceholder';

export function VendorPaymentView() {
  return (
    <StateModulePlaceholder
      stateName="Central"
      title="Vendor Payments"
      category="Operations"
      subCategory="Vendor Master"
      description="Disbursement tracker for vendor milestone payments, retainers, and claims."
      icon="management"
    />
  );
}

export default VendorPaymentView;
