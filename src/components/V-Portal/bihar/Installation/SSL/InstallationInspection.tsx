import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SSL_InstallationInspection() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SSL > Installation Inspection"
        subtitle="Bihar SSL light installation quality verification and physical audit"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Installation Inspection' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Site Quality & Physical Inspection</h3>
          </div>
          <div className="ax-card__body">
            <p>Verification checklists, tilt angle, civil work, battery box locking, and lux output audits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationInspection;
