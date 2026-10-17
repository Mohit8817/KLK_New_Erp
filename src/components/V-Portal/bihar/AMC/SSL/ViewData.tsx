import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SSL_ViewData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SSL > View Data"
        subtitle="Master log of all AMC inspections and maintenance logs for Bihar SSL"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SSL AMC Maintenance Log</h3>
          </div>
          <div className="ax-card__body">
            <p>Browse historical AMC records, technician visit logs, and preventive maintenance slips.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SSL_ViewData;
