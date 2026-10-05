import { PageHead } from '../../../../shell/PageHead';

export function SWPViewInstallation() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SWP - View Installation"
        subtitle="Complete audit and verification view of installed SWP sites"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'View Installation' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SWP Installed Sites Directory</h3>
          </div>
          <div className="ax-card__body">
            <p>Comprehensive list of verified SWP installations with discharge testing results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SWPViewInstallation;
