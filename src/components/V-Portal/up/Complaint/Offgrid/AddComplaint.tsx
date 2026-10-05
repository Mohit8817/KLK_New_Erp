import { PageHead } from '../../../../shell/PageHead';

export function UP_Complaint_Offgrid_AddComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Complaint > Offgrid > AddComplaint"
        subtitle="AddComplaint management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Complaint' },
          { label: 'Offgrid' },
          { label: 'AddComplaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AddComplaint Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Complaint - Offgrid - AddComplaint operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Complaint_Offgrid_AddComplaint;