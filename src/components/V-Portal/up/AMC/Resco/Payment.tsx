import { UpAmcPaymentPage } from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_Payment() {
  return (
    <UpAmcPaymentPage
      title="UP RESCO — AMC Payment & Claims"
      subtitle="View verified sites eligible for invoice claim and track previous claims"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Resco', href: '/v/up-resco-amc-view-site' },
        { label: 'Payment' },
      ]}
      projectName="RESCO Rooftop Solar"
      onFetchClaimData={upRescoAmcApi.getClaimSite}
      onStoreClaim={upRescoAmcApi.storeClaim}
    />
  );
}

export default UP_AMC_Resco_Payment;
