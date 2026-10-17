import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_Payment() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Payment"
        subtitle="Track payment receipts and disbursement status for Bihar ULA"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Payment' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">ULA Payment Disbursements</h3>
          </div>
          <div className="ax-card__body">
            <p>Track sanctioned amounts, bank reference UTRs, and payment reconciliation for ULA installations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_Payment;
