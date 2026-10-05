import { PageHead } from '../../../../shell/PageHead';

export function RescoInstallationDetails() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu RESCO - Installation Details"
        subtitle="Complete technical parameters and PPA document repository for RESCO projects"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Installation Details' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">RESCO Technical & Contract Directory</h3>
          </div>
          <div className="ax-card__body">
            <p>Comprehensive repository of RESCO project parameters, plant layouts, and tariff details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescoInstallationDetails;
