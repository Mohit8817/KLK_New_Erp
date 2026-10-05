import { PageHead } from '../../../../shell/PageHead';

export function InstallLights() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SSL - Install Lights"
        subtitle="Record street light pole erections, luminaire mounting, and battery installation status"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Install Lights' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Update Street Light Site Details</h3>
          </div>
          <div className="ax-card__body">
            <p>Form to record SSL pole unique IDs, GPS locations, luminaire wattage, panel serial numbers, and photo upload.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallLights;
