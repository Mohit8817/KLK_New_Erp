import { UpAmcPaymentPage } from '../CommonSharedAMC';
import { upSsl18wAmcApi } from '../../up-services';

export function UP_AMC_SSL18W_Payment() {
  return (
    <UpAmcPaymentPage
      title="UP SSL 18W — AMC Payment & Claims"
      subtitle="View verified SSL 18W street light reports eligible for payment claims and track claim history"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL 18W', href: '/v/up-ssl18w-amc-view-light' },
        { label: 'Payment' },
      ]}
      projectName="Solar Street Light 18W (SSL 18W)"
      onFetchClaimData={upSsl18wAmcApi.getClaimLight}
      onStoreClaim={upSsl18wAmcApi.storeClaim}
    />
  );
}

export default UP_AMC_SSL18W_Payment;
