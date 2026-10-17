import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SRT_ComplaintRaised() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SRT > Complaint Raised"
        subtitle="Complaints triggered during regular AMC routines for Bihar SRT"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Complaint Raised' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AMC Triggered Rooftop Issues</h3>
          </div>
          <div className="ax-card__body">
            <p>Component failure notices, defective cabling, and inverter faults documented during AMC inspections.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SRT_ComplaintRaised;
