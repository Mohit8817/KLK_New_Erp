import { PageHead } from '../../../../shell/PageHead';

export function UP_Installation_SSL_InstallLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Installation > SSL > InstallLight"
        subtitle="InstallLight management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'InstallLight' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">InstallLight Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Installation - SSL - InstallLight operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Installation_SSL_InstallLight;