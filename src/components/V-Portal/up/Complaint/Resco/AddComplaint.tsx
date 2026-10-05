import { PageHead } from '../../../../shell/PageHead';

export function UP_Complaint_Resco_AddComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Complaint > Resco > AddComplaint"
        subtitle="AddComplaint management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Complaint' },
          { label: 'Resco' },
          { label: 'AddComplaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AddComplaint Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Complaint - Resco - AddComplaint operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Complaint_Resco_AddComplaint;