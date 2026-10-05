import { PageHead } from '../../../../shell/PageHead';

export function RescoInstallSite() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu RESCO - Install Site"
        subtitle="Record RESCO installation milestone entries, commissioning certificates, and meter readings"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Install Site' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Update RESCO Site Installation</h3>
          </div>
          <div className="ax-card__body">
            <p>Form to log module mounting, inverter sync, grid connectivity, and COD (Commercial Operation Date).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescoInstallSite;
