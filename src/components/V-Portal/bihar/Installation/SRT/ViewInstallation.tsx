import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SRT_ViewInstallation() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SRT > View Installation"
        subtitle="Comprehensive register of completed SRT installations in Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'View Installation' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Completed SRT Installations</h3>
          </div>
          <div className="ax-card__body">
            <p>Master registry of commissioned solar rooftop projects across Bihar circles.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_ViewInstallation;
