import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Complaint_SRT_AddComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Complaints > SRT > Add Complaint"
        subtitle="Log consumer solar rooftop malfunction or power generation issues"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT' },
          { label: 'Add Complaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Register SRT Complaint</h3>
          </div>
          <div className="ax-card__body">
            <p>Log rooftop generation fault, inverter error code, grid-sync issue, or meter fault ticket.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SRT_AddComplaint;
