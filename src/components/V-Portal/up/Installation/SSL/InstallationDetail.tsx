import { PageHead } from '../../../../shell/PageHead';

export function UP_Installation_SSL_InstallationDetail() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Installation > SSL > InstallationDetail"
        subtitle="InstallationDetail management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'InstallationDetail' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">InstallationDetail Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Installation - SSL - InstallationDetail operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Installation_SSL_InstallationDetail;