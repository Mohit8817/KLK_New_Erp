import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SRT_Dashboard() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SRT > Dashboard"
        subtitle="Solar Rooftop (SRT) installation vendor operations and performance metrics"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Dashboard' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SRT Vendor Installation Dashboard</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar Solar Rooftop vendor allocations, execution status, and installation analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_Dashboard;
