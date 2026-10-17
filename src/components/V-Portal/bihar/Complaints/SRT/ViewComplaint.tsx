import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Complaint_SRT_ViewComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Complaints > SRT > View Complaint"
        subtitle="Full log of solar rooftop consumer grievance tickets and status"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT' },
          { label: 'View Complaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">All SRT Complaints</h3>
          </div>
          <div className="ax-card__body">
            <p>Comprehensive register of rooftop grievance lifecycle and resolution audit trails.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SRT_ViewComplaint;
