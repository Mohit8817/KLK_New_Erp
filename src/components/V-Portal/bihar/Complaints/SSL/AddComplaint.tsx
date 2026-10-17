import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Complaint_SSL_AddComplaint() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Complaints > SSL > Add Complaint"
        subtitle="Register new solar street light breakdown or grievance ticket for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SSL' },
          { label: 'Add Complaint' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Register SSL Complaint</h3>
          </div>
          <div className="ax-card__body">
            <p>Log street light breakdown issues, luminary not glowing, damaged pole, or theft ticket.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Complaint_SSL_AddComplaint;
