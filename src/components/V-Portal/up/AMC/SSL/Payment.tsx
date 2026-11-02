import { UpAmcPaymentPage } from '../CommonSharedAMC';
import { upSslAmcApi } from '../../up-services';

export function UP_AMC_SSL_Payment() {
  return (
    <UpAmcPaymentPage
      title="UP SSL — AMC Payment & Claims"
      subtitle="View verified solar street light reports eligible for payment claims and track claim history"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL', href: '/v/up-ssl-amc-view-light' },
        { label: 'Payment' },
      ]}
      projectName="Solar Street Light (SSL)"
      onFetchClaimData={upSslAmcApi.getClaimLight}
      onStoreClaim={upSslAmcApi.storeClaim}
    />
  );
}

export default UP_AMC_SSL_Payment;
