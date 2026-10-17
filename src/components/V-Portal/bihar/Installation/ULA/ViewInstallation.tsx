import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_ViewInstallation() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > View Installation"
        subtitle="Completed ULA installations list and verification details"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'View Installation' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Completed ULA Sites</h3>
          </div>
          <div className="ax-card__body">
            <p>Master registry of installed and commissioned ULA solar units in Bihar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_ViewInstallation;
