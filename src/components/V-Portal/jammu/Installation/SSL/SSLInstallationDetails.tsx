import { PageHead } from '../../../../shell/PageHead';

export function SSLInstallationDetails() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SSL - Installation Details"
        subtitle="Completed SSL site records, audit logs, and verified street light locations"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Installation Details' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Complete SSL Site Directory</h3>
          </div>
          <div className="ax-card__body">
            <p>View complete records of all verified and operational street light installations in Jammu & Kashmir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SSLInstallationDetails;
