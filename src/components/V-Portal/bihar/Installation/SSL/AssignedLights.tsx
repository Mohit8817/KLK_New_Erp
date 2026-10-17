import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SSL_AssignedLights() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SSL > Assigned Lights"
        subtitle="View and manage SSL lights assigned for installation in Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Assigned Lights' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assigned SSL Lights</h3>
          </div>
          <div className="ax-card__body">
            <p>Assigned solar street light site locations, pole identifiers, and deployment queues.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_AssignedLights;
