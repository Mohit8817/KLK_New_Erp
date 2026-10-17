import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SSL_InstallationDetail() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SSL > Installation Detail"
        subtitle="Completed SSL installation site details and inspection reports"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Installation Detail' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Completed Installation Records</h3>
          </div>
          <div className="ax-card__body">
            <p>View complete records of installed solar street lights, verification certificates, and photos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_InstallationDetail;
