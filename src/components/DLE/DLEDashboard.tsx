import { PageHead } from '../shell/PageHead';

export function DLEDashboard() {
  return (
    <div className="ax-page">
      <PageHead
        title="DLE - Dashboard"
        subtitle="DLE overview and key numbers"
        breadcrumbs={[
          { label: 'DLE' },
          { label: 'Dashboard' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Dashboard</h3>
          </div>
          <div className="ax-card__body">
            <p>DLE overview and key numbers. (Content yahan add hoga.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DLEDashboard;
