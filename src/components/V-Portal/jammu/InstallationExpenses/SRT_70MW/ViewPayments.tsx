import { PageHead } from '../../../../shell/PageHead';

export function ViewPayments() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - View Payments"
        subtitle="Track expense reimbursement status, UTR numbers, and payment disbursals"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Payments' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Reimbursement Disbursal Ledger</h3>
          </div>
          <div className="ax-card__body">
            <p>Details of completed bank transfers and pending expense reimbursements for Jammu field teams.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewPayments;
