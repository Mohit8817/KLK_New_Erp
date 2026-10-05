import { PageHead } from '../../../../shell/PageHead';

export function RescoClaimRequest() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu RESCO - Claim Request"
        subtitle="RESCO developer billing, energy generation claims, and monthly tariff invoices"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Claim Request' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">RESCO Generation & Milestone Claims</h3>
          </div>
          <div className="ax-card__body">
            <p>Track monthly solar generation bills, grid feed-in credits, and incentive disbursals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescoClaimRequest;
