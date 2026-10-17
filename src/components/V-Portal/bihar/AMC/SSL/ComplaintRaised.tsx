import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SSL_ComplaintRaised() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SSL > Complaint Raised"
        subtitle="Complaints triggered during regular AMC routines for Bihar SSL"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'Complaint Raised' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Complaints Triggered via AMC</h3>
          </div>
          <div className="ax-card__body">
            <p>Issues flagged by field engineers during AMC inspections awaiting corrective replacement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SSL_ComplaintRaised;
