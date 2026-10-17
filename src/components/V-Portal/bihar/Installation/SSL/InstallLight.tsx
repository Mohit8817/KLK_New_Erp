import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SSL_InstallLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SSL > Install Light"
        subtitle="Update installation and commissioning details for Bihar SSL site"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Install Light' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Install SSL Light</h3>
          </div>
          <div className="ax-card__body">
            <p>Upload photos, coordinates, pole details, and installation timestamp for verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallLight;
