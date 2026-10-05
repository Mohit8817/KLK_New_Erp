import { PageHead } from '../../../../shell/PageHead';

export function UP_Installation_SSL_AssignedLights() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Installation > SSL > AssignedLights"
        subtitle="AssignedLights management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'AssignedLights' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AssignedLights Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Installation - SSL - AssignedLights operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Installation_SSL_AssignedLights;