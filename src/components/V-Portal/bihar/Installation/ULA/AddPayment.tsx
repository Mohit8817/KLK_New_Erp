import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_AddPayment() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Add Payment"
        subtitle="Submit new payment claims for completed ULA installations"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Add Payment' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Create ULA Payment Claim</h3>
          </div>
          <div className="ax-card__body">
            <p>Generate milestone claim vouchers, attach installation completion forms, and submit for approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_AddPayment;
