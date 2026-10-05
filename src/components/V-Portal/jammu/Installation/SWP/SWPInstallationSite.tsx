import { PageHead } from '../../../../shell/PageHead';

export function SWPInstallationSite() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SWP - Installation Site Entry"
        subtitle="Add new solar water pump installation site data and motor details"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SWP' },
          { label: 'Installation Site' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Site Details Form</h3>
          </div>
          <div className="ax-card__body">
            <p>Record motor serial number, controller ID, depth of borewell, structure orientation, and site photos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SWPInstallationSite;
