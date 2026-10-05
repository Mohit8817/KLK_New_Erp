import { PageHead } from '../../../../shell/PageHead';

export function UP_Complaint_Ongrid_AssignedComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Complaint > Ongrid > AssignedComplaint"
        subtitle="AssignedComplaint management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Complaint' },
          { label: 'Ongrid' },
          { label: 'AssignedComplaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AssignedComplaint Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Complaint - Ongrid - AssignedComplaint operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Complaint_Ongrid_AssignedComplaint;