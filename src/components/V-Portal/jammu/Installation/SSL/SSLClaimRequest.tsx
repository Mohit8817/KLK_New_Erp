import { PageHead } from '../../../../shell/PageHead';

export function SSLClaimRequest() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SSL - Claim Request Details"
        subtitle="Street light payment claims, vendor invoices, and verification sign-offs"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Claim Request' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SSL Vendor Claim Requests</h3>
          </div>
          <div className="ax-card__body">
            <p>Track payment releases and verification sign-offs for street light installations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SSLClaimRequest;
