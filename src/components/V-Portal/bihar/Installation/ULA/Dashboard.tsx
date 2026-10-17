import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_Dashboard() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Dashboard"
        subtitle="Unnat Lok Abhiyan (ULA) solar installation dashboard for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Dashboard' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">ULA Installation Metrics</h3>
          </div>
          <div className="ax-card__body">
            <p>Overall tracking of ULA structure erection, solar module installations, and district allocations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_Dashboard;
