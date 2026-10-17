import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Complaint_SRT_AssignedComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Complaints > SRT > Assigned Complaint"
        subtitle="Manage assigned rooftop complaint tickets, spare replacements, and closure"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT' },
          { label: 'Assigned Complaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assigned SRT Complaints</h3>
          </div>
          <div className="ax-card__body">
            <p>Field technician workbench for assigned rooftop tickets, corrective action logs, and consumer OTP sign-off.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SRT_AssignedComplaint;
