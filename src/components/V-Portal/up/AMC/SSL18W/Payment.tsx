import { PageHead } from '../../../../shell/PageHead';

export function UP_AMC_SSL18W_Payment() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - AMC > SSL18W > Payment"
        subtitle="Payment management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'AMC' },
          { label: 'SSL18W' },
          { label: 'Payment' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Payment Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh AMC - SSL18W - Payment operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_AMC_SSL18W_Payment;