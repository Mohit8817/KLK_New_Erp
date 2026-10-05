import { PageHead } from '../../../../shell/PageHead';

export function SWPViewPayment() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SWP - View Payment"
        subtitle="Track SWP vendor payment claims, central/state subsidy disbursals, and bank references"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'View Payment' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SWP Payment & Claim Disbursal Ledger</h3>
          </div>
          <div className="ax-card__body">
            <p>Detailed breakdown of vendor claims and subsidy payments for solar water pumps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SWPViewPayment;
