import { PageHead } from '../../../../shell/PageHead';

export function RescoDashboard() {
  const stats = [
    { label: 'Total RESCO Projects', value: '85 Sites', badge: 'Active PPA' },
    { label: 'Total Capacity', value: '28.5 MW', badge: 'Commissioned' },
    { label: 'Monthly Generation', value: '3.42 GWh', badge: 'Avg' },
    { label: 'Active PPAs', value: '42 Agreements', badge: 'Signed' },
  ];

  return (
    <div className="ax-page">
      <PageHead
        title="Jammu RESCO - Installation Dashboard"
        subtitle="RESCO model solar project performance, PPA monitoring, and generation metrics"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Dashboard' },
        ]}
      />

      <div className="ax-dash-grid">
        {stats.map((st) => (
          <div key={st.label} className="ax-card ax-col--3">
            <div className="ax-card__body">
              <span style={{ fontSize: '13px', color: 'var(--ax-muted)' }}>{st.label}</span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0' }}>{st.value}</h2>
              <span className="ax-badge ax-badge--info" style={{ fontSize: '11px' }}>{st.badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RescoDashboard;
