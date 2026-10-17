import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SRT_ClaimRequest() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SRT > Claim Request"
        subtitle="Submit and track SRT vendor payment claims and disbursement status"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Claim Request' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Vendor Payment Claim</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar SRT vendor milestone payment requests, verified bills, and release tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_ClaimRequest;
