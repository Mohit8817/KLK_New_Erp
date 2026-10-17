import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SSL_SupplyInspection() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SSL > Supply Inspection"
        subtitle="Bihar SSL light supply batch verification and material inspection"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL' },
          { label: 'Supply Inspection' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Supply Material Inspection</h3>
          </div>
          <div className="ax-card__body">
            <p>Verification of dispatched SSL luminary packages, solar panels, batteries, and hardware lots.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SSL_SupplyInspection;
